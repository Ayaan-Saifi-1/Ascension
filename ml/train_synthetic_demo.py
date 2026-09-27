"""Train a synthetic-only development SIF demo model.

This artifact is intentionally incompatible with the production classifier loader.
It exists only to prove the local training workflow while real HSE labels are
pending, and it must never drive a safety decision.
"""

import argparse
import csv
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.frozen import FrozenEstimator
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, brier_score_loss, fbeta_score, precision_score, recall_score
from sklearn.pipeline import make_pipeline


def rows_from(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def measures(y: np.ndarray, probabilities: np.ndarray, threshold: float) -> dict:
    predicted = probabilities >= threshold
    return {
        "precision": float(precision_score(y, predicted, zero_division=0)),
        "recall": float(recall_score(y, predicted, zero_division=0)),
        "f2": float(fbeta_score(y, predicted, beta=2, zero_division=0)),
        "pr_auc": float(average_precision_score(y, probabilities)),
        "brier": float(brier_score_loss(y, probabilities)),
        "records": int(len(y)),
    }


def train(dataset: Path, output: Path) -> None:
    if output.exists():
        raise ValueError(f"Output already exists: {output}")
    rows = rows_from(dataset)
    if not rows or any(row.get("is_synthetic") != "true" for row in rows):
        raise ValueError("This trainer accepts only explicitly synthetic records")
    if len({row["description"] for row in rows}) != len(rows):
        raise ValueError("Synthetic descriptions must be unique")
    groups = {}
    for row in rows:
        if row.get("label") not in {"0", "1"}:
            raise ValueError("Synthetic labels must be binary")
        if row.get("split") not in {"train", "calibration", "validation", "test"}:
            raise ValueError("Each row requires a declared split")
        group = row.get("event_group")
        if not group or (group in groups and groups[group] != row["split"]):
            raise ValueError("Synthetic event groups must be complete and split-safe")
        groups[group] = row["split"]
    buckets = {split: [row for row in rows if row["split"] == split] for split in ("train", "calibration", "validation", "test")}
    for split, subset in buckets.items():
        if {row["label"] for row in subset} != {"0", "1"}:
            raise ValueError(f"Synthetic {split} split lacks one class")

    estimator = make_pipeline(
        TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, max_features=20_000),
        LogisticRegression(class_weight="balanced", max_iter=2_000, random_state=42),
    )
    estimator.fit([row["description"] for row in buckets["train"]], [int(row["label"]) for row in buckets["train"]])
    calibrated = CalibratedClassifierCV(FrozenEstimator(estimator), method="sigmoid")
    calibrated.fit(
        [row["description"] for row in buckets["calibration"]],
        [int(row["label"]) for row in buckets["calibration"]],
    )
    validation_y = np.asarray([int(row["label"]) for row in buckets["validation"]])
    validation_p = calibrated.predict_proba([row["description"] for row in buckets["validation"]])[:, 1]
    thresholds = [float(value) for value in np.unique(validation_p)]
    threshold = max(thresholds, key=lambda value: (fbeta_score(validation_y, validation_p >= value, beta=2), value))
    test_y = np.asarray([int(row["label"]) for row in buckets["test"]])
    test_p = calibrated.predict_proba([row["description"] for row in buckets["test"]])[:, 1]

    output.mkdir(parents=True)
    artifact = output / "synthetic_demo_tfidf.joblib"
    joblib.dump(calibrated, artifact)
    manifest = {
        "status": "SYNTHETIC_DEVELOPMENT_ONLY",
        "model_version": "synthetic-demo-tfidf-v1",
        "model_type": "TF-IDF (1-2 gram) plus logistic regression with synthetic calibration",
        "input_fields": ["description"],
        "dataset": str(dataset),
        "dataset_sha256": sha256(dataset.read_bytes()).hexdigest(),
        "sample_sizes": {split: len(subset) for split, subset in buckets.items()},
        "threshold": threshold,
        "validation": measures(validation_y, validation_p, threshold),
        "synthetic_test": measures(test_y, test_p, threshold),
        "artifact_sha256": sha256(artifact.read_bytes()).hexdigest(),
        "hse_validated": False,
        "production_eligible": False,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "prohibitions": [
            "Do not load this artifact through ml.sif_classifier or any production inference path.",
            "Do not report synthetic validation metrics as field performance.",
            "Do not use its probability to label, close or prioritize a real safety report.",
            "Replace this artifact with a real HSE-reviewed, rights-cleared model when available.",
        ],
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("dataset", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    train(args.dataset, args.output)
