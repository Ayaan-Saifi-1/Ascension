import hashlib,json,os
from functools import lru_cache
import numpy as np
from ml.encoder import encode, ROOT
FEATURE_VERSION="safety-features-2"
ARTIFACT_DIR=ROOT/"ml"/"models"/"sif"
DEVELOPMENT_ARTIFACT_DIR=ROOT/"ml"/"models"/"scenario-sif-candidate-v2"
LEGACY_DEVELOPMENT_ARTIFACT_DIR=ROOT/"ml"/"models"/"synthetic-demo-sif-v1"
def features(facts,report_type="Near Miss"):
    states=[b["state"] for b in facts["barriers"]]
    return np.asarray([float(facts[k]) for k in ["credible_fatal","direct_exposure","severe_hazard","simulated"]] +
        [float(s in states) for s in ["EFFECTIVE","DEGRADED","FAILED","BYPASSED","ABSENT","UNVERIFIED","UNKNOWN"]] +
        [float(bool(facts["missing_information"]))] +
        [float(report_type==r) for r in ["Unsafe Act","Unsafe Condition","Near Miss","Incident"]],dtype=np.float32)

@lru_cache(maxsize=1)
def load_classifier():
    import joblib
    manifest_path=ARTIFACT_DIR/"manifest.json"
    if manifest_path.exists():
        manifest=json.loads(manifest_path.read_text())
        if manifest["feature_version"]==FEATURE_VERSION and manifest.get("hse_validated"):
            current=json.loads((ROOT/"ml"/"models"/"provenance.json").read_text())
            if manifest.get("encoder")!=current:raise RuntimeError("Classifier/encoder provenance mismatch.")
            threshold=manifest["threshold"];negative=manifest.get("negative_threshold")
            if not 0<=threshold<=1 or (negative is not None and not 0<=negative<threshold):
                raise RuntimeError("Invalid decision thresholds.")
            return joblib.load(ARTIFACT_DIR/"calibrated.joblib"),manifest
    # Local development uses this same classifier contract until the reviewer
    # dataset replaces it. It is enabled only by the local start script.
    if os.environ.get("ASCENSION_DEVELOPMENT_MODEL") != "1":return None,None
    directory=DEVELOPMENT_ARTIFACT_DIR
    if not (directory/"manifest.json").exists():directory=LEGACY_DEVELOPMENT_ARTIFACT_DIR
    scenario_model=directory==DEVELOPMENT_ARTIFACT_DIR
    manifest_path=directory/"manifest.json"
    artifact=directory/("classifier.joblib" if scenario_model else "synthetic_demo_tfidf.joblib")
    if not manifest_path.exists() or not artifact.exists():return None,None
    manifest=json.loads(manifest_path.read_text())
    if manifest.get("status") != "SYNTHETIC_DEVELOPMENT_ONLY" or manifest.get("production_eligible") is not False:
        raise RuntimeError("Development model has an invalid status")
    if scenario_model and manifest.get("development_release_eligible") is not True:
        raise RuntimeError("Development candidate has not passed its comparison")
    if not np.isfinite(manifest["threshold"]) or not 0<=manifest["threshold"]<=1:
        raise RuntimeError("Invalid development decision threshold")
    if manifest.get("uses_encoder"):
        current=json.loads((ROOT/"ml"/"models"/"provenance.json").read_text())
        if manifest.get("encoder")!=current:raise RuntimeError("Development classifier/encoder provenance mismatch")
    if hashlib.sha256(artifact.read_bytes()).hexdigest()!=manifest.get("artifact_sha256"):
        raise RuntimeError("Development model artifact checksum mismatch")
    manifest=dict(manifest,model_version=manifest["model_version"] if scenario_model else "development-sif-tfidf-v1",development_only=True)
    return joblib.load(artifact),manifest

def predict(description,facts,report_type):
    classifier,manifest=load_classifier()
    if classifier is None:
        vector=encode(description)
        return dict(probability=None,encoder_status="READY",classifier_status="NOT_TRAINED",
                    model_version="SafetyBERT / classifier pending",vector=vector.tolist(),threshold=None,negative_threshold=None)
    if manifest.get("development_only"):
        if manifest.get("inference_strategy") == "max(full_report,sentence_chunks)":
            from ml.development_model import sentence_max_probability
            p=sentence_max_probability(classifier,description)
        else:
            p=float(classifier.predict_proba([description])[0,1])
        if not np.isfinite(p) or not 0<=p<=1:raise ValueError("Invalid development model probability")
        uses_encoder=manifest.get("uses_encoder",False)
        vector=encode(description).tolist() if uses_encoder else []
        return dict(probability=p,encoder_status="READY" if uses_encoder else "NOT_USED",classifier_status="READY",model_version=manifest["model_version"],
                    vector=vector,threshold=manifest["threshold"],negative_threshold=None,development_only=True)
    vector=encode(description)
    p=float(classifier.predict_proba(np.concatenate([vector,features(facts,report_type)])[None,:])[0,1])
    if not np.isfinite(p) or not 0<=p<=1:raise ValueError("Invalid classifier probability")
    return dict(probability=p,encoder_status="READY",classifier_status="READY",model_version=manifest["model_version"],
                vector=vector.tolist(),threshold=manifest["threshold"],negative_threshold=manifest.get("negative_threshold"),development_only=False)
