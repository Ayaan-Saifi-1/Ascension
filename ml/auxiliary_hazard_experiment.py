"""Train a non-deployable auxiliary hazard-family experiment from a CC BY source.

The experiment explicitly excludes the source's reviewed validation IDs and exact
narrative matches from training.  It does not create SIF or life-saving-rule
labels, and its artifact is deliberately kept outside the serving model path.
"""

import argparse
import csv
from collections import Counter
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.pipeline import Pipeline


SCHEMA_VERSION = "auxiliary-hazard-family-1"
LABELS = [
    "FALL_FROM_HEIGHT",
    "SLIP_TRIP_SAME_LEVEL",
    "CAUGHT_IN_BETWEEN",
    "STRUCK_BY",
    "EQUIPMENT_TIP_OVER",
]


def normalized(text: str) -> str:
    return " ".join(text.casefold().split())


def family(label: str) -> str | None:
    """Map compatible source phrases to a deliberately small, disclosed schema."""
    value = label.casefold()
    if "fall from" in value or value == "fall":
        return "FALL_FROM_HEIGHT"
    if "slip" in value or "same level" in value:
        return "SLIP_TRIP_SAME_LEVEL"
    if "caught" in value or "crush" in value:
        return "CAUGHT_IN_BETWEEN"
    if "struck" in value:
        return "STRUCK_BY"
    if "tip-over" in value:
        return "EQUIPMENT_TIP_OVER"
    return None


def read_rows(path: Path) -> list[dict]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def train(source_root: Path, output: Path) -> None:
    if output.exists():
        raise ValueError(f"Output already exists: {output}")
    files = source_root / "source_files"
    master_path = files / "Final_Master_Ensemble_v18_Success_Deidentified.csv"
    reviewed_path = files / "Gemini_Final_Validation_400_Deidentified.csv"
    master, reviewed_all = read_rows(master_path), read_rows(reviewed_path)
    reviewed = [row for row in reviewed_all if row.get("Is_Correct") in {"0", "1"}]
    heldout_ids = {row["ID"] for row in reviewed}
    heldout_texts = {normalized(row["Final Narrative"]) for row in reviewed}

    train_rows = [
        row for row in master
        if row["ID"] not in heldout_ids
        and normalized(row["Final Narrative"]) not in heldout_texts
        and family(row.get("Hazard_Trigger", "")) is not None
    ]
    test_rows = [
        row for row in reviewed
        if family(row.get("GT_Hazard_Trigger", "")) is not None
    ]
    training_texts = {normalized(row["Final Narrative"]) for row in train_rows}
    leakage = [
        row["ID"] for row in test_rows
        if row["ID"] in {item["ID"] for item in train_rows}
        or normalized(row["Final Narrative"]) in training_texts
    ]
    if leakage:
        raise ValueError(f"Holdout leakage detected for IDs: {leakage[:5]}")
    if set(family(row["Hazard_Trigger"]) for row in train_rows) != set(LABELS):
        raise ValueError("Training data does not cover every declared family")
    if set(family(row["GT_Hazard_Trigger"]) for row in test_rows) != set(LABELS):
        raise ValueError("Reviewed holdout does not cover every declared family")

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, max_features=20_000, sublinear_tf=True)),
        ("classifier", LogisticRegression(max_iter=2_000, class_weight="balanced", random_state=42)),
    ])
    x_train = [row["Final Narrative"] for row in train_rows]
    y_train = [family(row["Hazard_Trigger"]) for row in train_rows]
    x_test = [row["Final Narrative"] for row in test_rows]
    y_test = [family(row["GT_Hazard_Trigger"]) for row in test_rows]
    pipeline.fit(x_train, y_train)
    predicted = pipeline.predict(x_test)
    probabilities = pipeline.predict_proba(x_test)

    output.mkdir(parents=True)
    joblib.dump(pipeline, output / "auxiliary_hazard_tfidf.joblib")
    source_manifest = json.loads((source_root / "manifest.json").read_text(encoding="utf-8"))
    manifest = {
        "status": "EXPERIMENTAL_AUXILIARY_RESEARCH_ONLY",
        "model_type": "TF-IDF (1-2 gram) plus balanced multinomial logistic regression",
        "schema_version": SCHEMA_VERSION,
        "label_schema": LABELS,
        "input_fields": ["Final Narrative"],
        "explicitly_excluded_input_fields": [
            "Hospitalized", "Amputation", "Loss of Eye", "Consequence",
            "Nature", "Part of Body", "Event", "Source", "Secondary Source",
        ],
        "source": {
            "doi": source_manifest["doi"],
            "licence": source_manifest["licence"]["short_name"],
            "attribution": source_manifest["attribution"],
            "master_sha256": sha256(master_path.read_bytes()).hexdigest(),
            "reviewed_holdout_sha256": sha256(reviewed_path.read_bytes()).hexdigest(),
        },
        "split": {
            "training_source": "master source ensemble hazard labels",
            "evaluation_source": "source researcher-reviewed ground-truth hazard labels",
            "master_rows": len(master),
            "reviewed_rows_read": len(reviewed_all),
            "reviewed_rows_structurally_eligible": len(reviewed),
            "training_rows_after_id_and_text_holdout": len(train_rows),
            "reviewed_holdout_rows_in_schema": len(test_rows),
            "reviewed_holdout_rows_outside_schema": len(reviewed) - len(test_rows),
            "shared_ids_excluded_from_training": len(heldout_ids & {row["ID"] for row in master}),
            "leakage_records": len(leakage),
        },
        "class_counts": {
            "train": dict(sorted(Counter(y_train).items())),
            "reviewed_holdout": dict(sorted(Counter(y_test).items())),
        },
        "metrics": {
            "accuracy": float((predicted == y_test).mean()),
            "macro_f1": float(f1_score(y_test, predicted, labels=LABELS, average="macro", zero_division=0)),
            "weighted_f1": float(f1_score(y_test, predicted, labels=LABELS, average="weighted", zero_division=0)),
            "classification_report": classification_report(y_test, predicted, labels=LABELS, output_dict=True, zero_division=0),
            "confusion_matrix": confusion_matrix(y_test, predicted, labels=LABELS).tolist(),
            "mean_max_probability": float(probabilities.max(axis=1).mean()),
        },
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "artifact_sha256": None,
        "prohibitions": [
            "This is not an ASCENSION SIF classifier.",
            "This does not create or validate ASCENSION life-saving-rule tags.",
            "This is not validated for oil and gas, and must not be deployed or surfaced as an operational decision.",
            "The reviewed holdout is source-population held out, not an independent external oil-and-gas test set.",
            "The source master labels are ensemble labels; their agreement with the reviewed ground truth is limited.",
        ],
    }
    artifact = output / "auxiliary_hazard_tfidf.joblib"
    manifest["artifact_sha256"] = sha256(artifact.read_bytes()).hexdigest()
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    train(args.source_root, args.output)
