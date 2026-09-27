"""Compare development classifiers on scenario-disjoint synthetic data.

No external source records or pending reviewer decisions enter this experiment.
Candidate/threshold selection uses validation only. Reserved test results cannot
select among candidates and never establish real-world accuracy.
"""
import argparse
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.frozen import FrozenEstimator
from sklearn.metrics import (accuracy_score, balanced_accuracy_score, brier_score_loss,
    confusion_matrix, f1_score, fbeta_score, precision_score, recall_score)
from ml.development_model import candidate
from ml.development_scenarios import scenarios
from scripts.generate_synthetic_demo_dataset import RULES

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    return sha256(path.read_bytes()).hexdigest()


def metrics(y, p, threshold):
    predicted = np.asarray(p) >= threshold
    tn, fp, fn, tp = confusion_matrix(y, predicted, labels=[0, 1]).ravel()
    n = len(y)
    correct = int(np.sum(predicted == y))
    proportion = correct / n
    z = 1.95996398454
    centre = (proportion + z*z/(2*n)) / (1 + z*z/n)
    margin = z * np.sqrt(proportion*(1-proportion)/n + z*z/(4*n*n)) / (1 + z*z/n)
    return dict(records=n, accuracy=float(accuracy_score(y, predicted)),
        accuracy_95_interval=[float(centre-margin), float(centre+margin)],
        balanced_accuracy=float(balanced_accuracy_score(y, predicted)),
        precision=float(precision_score(y, predicted, zero_division=0)),
        recall=float(recall_score(y, predicted, zero_division=0)),
        f1=float(f1_score(y, predicted, zero_division=0)),
        f2=float(fbeta_score(y, predicted, beta=2, zero_division=0)),
        brier=float(brier_score_loss(y, p)),
        confusion_matrix=[[int(tn), int(fp)], [int(fn), int(tp)]])


def validate(rows):
    seen, groups = set(), {}
    for row in rows:
        if row.get("is_synthetic") != "true" or row.get("hse_reviewed") != "false":
            raise ValueError("This experiment requires explicitly synthetic, unreviewed cases")
        normalized = " ".join(row["description"].casefold().split())
        if not normalized or normalized in seen:
            raise ValueError("Empty or duplicate narrative")
        seen.add(normalized)
        group = row["event_group"]
        if group in groups and groups[group] != row["split"]:
            raise ValueError("A scenario pair crosses splits")
        groups[group] = row["split"]
    for split in ("train", "calibration", "validation", "test"):
        if {row["label"] for row in rows if row["split"] == split} != {"0", "1"}:
            raise ValueError(f"{split} must contain both classes")


def select_threshold(y, p):
    unique = np.unique(p)
    thresholds = np.r_[0.0, (unique[1:] + unique[:-1]) / 2, 1.0]
    eligible = [float(t) for t in thresholds if recall_score(y, p >= t) >= .9]
    return max(eligible, key=lambda t: (
        fbeta_score(y, p >= t, beta=2), precision_score(y, p >= t, zero_division=0), t))


def run(output):
    if output.exists():
        raise ValueError(f"Refusing to overwrite completed evaluation: {output}")
    rows = scenarios()
    # Retain the 18 original core examples once each, exclusively in training.
    # Do not inflate the corpus with repeated site/shift/follow-up wrappers.
    for rule, texts in RULES.items():
        for name, label in (("positive", "1"), ("negative", "0")):
            rows.append(dict(record_id=f"ORIGINAL-{rule}-{label}",
                event_group=f"ORIGINAL-{rule}", description=texts[name],
                label=label, split="train", family=rule, is_synthetic="true",
                hse_reviewed="false", label_origin="ORIGINAL_TEMPLATE_EXPECTATION"))
    validate(rows)
    output.mkdir(parents=True)
    dataset = output / "development_cases.jsonl"
    dataset.write_text("".join(json.dumps(r) + "\n" for r in rows), encoding="utf-8")
    buckets = {s: [r for r in rows if r["split"] == s]
               for s in ("train", "calibration", "validation", "test")}
    def xy(split):
        return [r["description"] for r in buckets[split]], np.array([int(r["label"]) for r in buckets[split]])
    tx, ty = xy("train")
    cx, cy = xy("calibration")
    vx, vy = xy("validation")
    print(json.dumps({"phase": "train", "counts": {s: len(v) for s, v in buckets.items()}}), flush=True)
    trained = []
    for semantic in (False, True):
        for structured in (False, True):
            for regularization in (1.0, 4.0):
                prefix = "semantic-lexical" if semantic else "word-character"
                if structured:
                    prefix += "-structured"
                name = prefix + f"-C{regularization:g}"
                estimator = candidate(semantic, regularization, structured).fit(tx, ty)
                calibrated = CalibratedClassifierCV(FrozenEstimator(estimator), method="sigmoid").fit(cx, cy)
                p = calibrated.predict_proba(vx)[:, 1]
                threshold = select_threshold(vy, p)
                score = metrics(vy, p, threshold)
                trained.append((calibrated, name, semantic, structured, threshold, score))
                print(json.dumps({"phase": "validation", "candidate": name, "metrics": score}), flush=True)
    # Lock the winning model before touching reserved test predictions.
    model, name, semantic, structured, threshold, validation = max(trained,
        key=lambda item: (item[5]["f2"], item[5]["precision"], -item[5]["brier"]))
    artifact = output / "classifier.joblib"
    joblib.dump(model, artifact)
    selection = dict(candidate=name, threshold=threshold, selection_split="validation",
        artifact_sha256=digest(artifact), validation=validation)
    (output / "selection.json").write_text(json.dumps(selection, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"phase": "selection_locked", **selection}), flush=True)
    ex, ey = xy("test")
    probabilities = model.predict_proba(ex)[:, 1]
    old_dir = ROOT / "ml/models/synthetic-demo-sif-v1"
    old_manifest = json.loads((old_dir / "manifest.json").read_text())
    old = joblib.load(old_dir / "synthetic_demo_tfidf.joblib")
    old_probabilities = old.predict_proba(ex)[:, 1]
    old_score = metrics(ey, old_probabilities, old_manifest["threshold"])
    score = metrics(ey, probabilities, threshold)
    eligible = score["f1"] > old_score["f1"] and score["recall"] >= old_score["recall"] and score["precision"] >= .7
    details = [dict(record_id=r["record_id"], family=r["family"], expected=int(r["label"]),
        previous_probability=float(op), candidate_probability=float(p),
        previous_prediction=int(op >= old_manifest["threshold"]), candidate_prediction=int(p >= threshold))
        for r, op, p in zip(buckets["test"], old_probabilities, probabilities)]
    manifest = dict(status="SYNTHETIC_DEVELOPMENT_ONLY", hse_validated=False, production_eligible=False,
        development_only=True, development_release_eligible=eligible,
        model_version="development-sif-scenario-v2.1", artifact_file=artifact.name,
        artifact_sha256=digest(artifact), dataset_sha256=digest(dataset),
        encoder=json.loads((ROOT / "ml/models/provenance.json").read_text()) if semantic else None,
        uses_encoder=semantic, uses_structured_features=structured, candidate=name,
        inference_strategy="max(full_report,sentence_chunks)",
        threshold=threshold, negative_threshold=None,
        sample_sizes={s: len(v) for s,v in buckets.items()}, validation=validation,
        previous_model_scenario_test=old_score, candidate_scenario_test=score,
        candidates=[dict(name=n, validation=v, threshold=t,
            uses_encoder=s, uses_structured_features=f) for _,n,s,f,t,v in trained],
        trained_at=datetime.now(timezone.utc).isoformat(),
        limitations=["All cases and target expectations are synthetic and assistant-authored, not independently HSE-reviewed.",
            "Scenario pairs are split together; vocabulary and authorship still overlap across splits.",
            "Small, balanced challenge scores do not establish field accuracy or real prevalence calibration.",
            "No automatic non-SIF clearance and no pseudo-labels for real records.",
            "Life-saving-rule tags remain the separate rule extractor, not a trained tag head."])
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (output / "test_predictions.json").write_text(json.dumps(details, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    run(parser.parse_args().output)
