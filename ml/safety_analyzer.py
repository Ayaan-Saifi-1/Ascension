import logging
import re
from ml.catalogue import VERSION
from ml.extractor import extract
from ml.hard_gates import evaluate

logger = logging.getLogger(__name__)


def synthetic_low_energy_case(report, facts):
    """A narrow, transparent demonstration rule; never clears a real report."""
    context = report.get("context") or {}
    required = ("equipment_refs", "reported_activity", "reported_hazard",
                "reported_exposure", "reported_consequence", "actual_consequence",
                "barrier_name", "barrier_evidence")
    consequence = str(context.get("reported_consequence", ""))
    return (
        report.get("is_synthetic") is True
        and report.get("source_system") == "SYNTHETIC_DEMO"
        and report.get("report_type") in {"Unsafe Act", "Unsafe Condition", "Near Miss", "Incident"}
        and not facts["simulated"]
        and not facts["family_ids"]
        and not facts["severe_hazard"]
        and not facts["credible_fatal"]
        and not facts["missing_information"]
        and all(context.get(key) for key in required)
        and context.get("barrier_state") == "EFFECTIVE"
        and context.get("verification_status") == "PRESENT"
        and context.get("validation_status") == "VALIDATED"
        and bool(re.search(r"\b(?:minor|superficial|first aid)\b", consequence, re.I))
        and not re.search(r"\b(?:fatal|serious|permanent|amputat|fracture)\b", consequence, re.I)
    )
def analyze(report, inference=None):
    facts=extract(report["description"])
    from ml.context import supplement
    facts=supplement(facts,report.get("context",{}))
    demo_low_energy=synthetic_low_energy_case(report,facts)
    if inference is None:
        from ml.sif_classifier import predict
        inference=predict
    model=dict(probability=None,encoder_status="UNAVAILABLE",classifier_status="UNAVAILABLE",
               model_version="rules-only / model unavailable",vector=[],threshold=None)
    error=None
    if demo_low_energy:
        # The development classifier is not calibrated for benign events outside
        # its synthetic training families. Do not display its score as confidence.
        model.update(encoder_status="NOT_USED", classifier_status="NOT_USED",
                     model_version="synthetic-low-energy-rule-1", development_only=True)
    else:
        try:
            model=inference(report["description"],facts,report["report_type"])
        except Exception as exc:
            error="SafetyBERT inference unavailable; report requires human review."
            logger.warning("Analysis model unavailable: %s",type(exc).__name__)
    # Training material/drills cannot become an actual exposure from a text
    # classifier score alone. Actual events during drills remain eligible.
    model_applicable=not facts["simulated"] and not demo_low_energy
    result=evaluate(facts,model["probability"] if model_applicable else None)
    if demo_low_energy:
        result.update(sif_label="NON_SIF_POTENTIAL",priority="LOW",risk_level="LOW",ranking_score=0.0)
    unavailable=model["classifier_status"]!="READY" and not demo_low_energy
    if facts["simulated"]:
        result["sif_label"]="OUT_OF_SCOPE"
        result["priority"]=result["risk_level"]="LOW"
    if not unavailable and model_applicable and result["sif_label"] != "SIF_POTENTIAL":
        if model_applicable and model["probability"]>=model["threshold"]:
            # A positive candidate still warrants review when metadata or the
            # dictionary extractor is incomplete. Missing facts remain visible.
            result["sif_label"]="SIF_POTENTIAL"
        elif not facts["missing_information"] and model.get("negative_threshold") is not None and model["probability"]<=model["negative_threshold"]:
            result["sif_label"]="NON_SIF_POTENTIAL"
        else:
            result["sif_label"]="REVIEW_REQUIRED"
            if model_applicable and not facts["missing_information"]:
                facts["missing_information"].append("model probability lies in the review band")
    if result["sif_label"]=="SIF_POTENTIAL" and result["priority"] in ["LOW","MEDIUM"]:
        result["priority"]=result["risk_level"]="HIGH"
    reasons=[] if facts["simulated"] or demo_low_energy else list(result["hard_gate"]["reason"]) + list(facts["missing_information"])
    if unavailable and not facts["simulated"]:
        reasons.append(error or "SIF classifier needs HSSE-labelled training and validation data")
    # A positive model flag can reach the dashboard without a classification
    # review. It remains a provisional alert, never an automatic safe clearance.
    # Vague narratives, hard gates and contradictory evidence require adjudication.
    auto_sif_alert=(not unavailable and model_applicable and
                    len(report["description"].split())>=10 and
                    bool(facts["family_ids"]) and
                    result["sif_label"]=="SIF_POTENTIAL" and
                    not result["hard_gate"]["triggered"] and
                    not facts["credible_fatal"] and
                    not any(b["contradictory"] for b in facts["barriers"]))
    review_required=not facts["simulated"] and (unavailable or bool(reasons) or
                     result["sif_label"]=="SIF_POTENTIAL") and not auto_sif_alert
    return dict(**report,**facts,**result,sif_probability=None if facts["simulated"] else model["probability"],
                status="ANALYSIS_UNAVAILABLE" if unavailable and not facts["simulated"] else "COMPLETE",
                encoder_status=model["encoder_status"],classifier_status=model["classifier_status"],
                model_version=model["model_version"],embedding=model["vector"],
                model_applicable=model_applicable,
                development_only=model.get("development_only",False),
                decision_source="SCOPE_RULE" if facts["simulated"] else "DEMO_LOW_ENERGY_RULE" if demo_low_energy else "SAFETY_RULES" if result["hard_gate"]["triggered"] or facts["credible_fatal"] else "ABSTENTION" if unavailable else "MODEL",
                review_required=review_required,
                triage_route="AUTO_OUT_OF_SCOPE" if facts["simulated"] else "AUTO_SIF_ALERT" if auto_sif_alert else "HSSE_REVIEW" if review_required else "AUTO_CLASSIFIED",
                review_reasons=list(dict.fromkeys(reasons)),model_error=error,
                catalogue_version=VERSION,gate_version="gates-1",threshold=model["threshold"],
                calibration_version="unavailable" if unavailable else model["model_version"],
                pattern_id=None,similar_report_count=0)
