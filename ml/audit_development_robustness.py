"""Audit the frozen development classifier under meaning-preserving text changes.

This consumes the already-used synthetic scenario test set only as a diagnostic.
It must not be used to tune or select another model and is not field validation.
"""

import argparse
from collections import defaultdict
from hashlib import sha256
import json
from pathlib import Path
import re

import joblib
import numpy as np

from ml.development_model import sentence_max_probability
from ml.improve_development_model import metrics


TERM_REPLACEMENTS = {
    "worker": "person",
    "workers": "personnel",
    "technician": "maintainer",
    "crew": "team",
    "before": "prior to",
    "stopped": "ceased",
    "remained": "stayed",
}


def lowercase(text: str) -> str:
    return text.lower()


def plain_formatting(text: str) -> str:
    value = re.sub(r"[^\w\s%.-]", " ", text)
    return " ".join(value.split())


def administrative_context(text: str) -> str:
    return "Shift handover entry. Area supervisor notified. " + text


def common_terms(text: str) -> str:
    pattern = re.compile(r"\b(" + "|".join(map(re.escape, TERM_REPLACEMENTS)) + r")\b", re.I)

    def replace(match: re.Match) -> str:
        value = TERM_REPLACEMENTS[match.group(0).lower()]
        return value.capitalize() if match.group(0)[0].isupper() else value

    return pattern.sub(replace, text)


TRANSFORMS = {
    "lowercase": lowercase,
    "plain_formatting": plain_formatting,
    "administrative_context": administrative_context,
    "common_terms": common_terms,
}


def load_rows(dataset: Path) -> list[dict]:
    return [json.loads(line) for line in dataset.read_text(encoding="utf-8").splitlines()
            if line.strip() and json.loads(line).get("split") == "test"]


def audit(model_dir: Path, output: Path) -> dict:
    if output.exists():
        raise ValueError(f"Refusing to overwrite robustness evidence: {output}")
    manifest_path = model_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    artifact = model_dir / manifest["artifact_file"]
    if sha256(artifact.read_bytes()).hexdigest() != manifest["artifact_sha256"]:
        raise ValueError("Classifier artifact checksum does not match its manifest")
    if manifest.get("status") != "SYNTHETIC_DEVELOPMENT_ONLY":
        raise ValueError("This audit accepts only the synthetic development artifact")

    rows = load_rows(model_dir / "development_cases.jsonl")
    if not rows:
        raise ValueError("No reserved development test rows found")
    model = joblib.load(artifact)
    labels = np.asarray([int(row["label"]) for row in rows])
    threshold = float(manifest["threshold"])
    original_text = [row["description"] for row in rows]
    original_probability = model.predict_proba(original_text)[:, 1]
    original_prediction = original_probability >= threshold

    variants = {}
    cases = []
    family_summary = defaultdict(lambda: {"records": 0, "flips": 0,
                                          "positive_to_negative": 0})
    for name, transform in TRANSFORMS.items():
        changed_text = [transform(text) for text in original_text]
        probability = model.predict_proba(changed_text)[:, 1]
        prediction = probability >= threshold
        flipped = prediction != original_prediction
        dangerous = flipped & (labels == 1) & original_prediction & ~prediction
        variants[name] = {
            "metrics": metrics(labels, probability, threshold),
            "decision_flips": int(flipped.sum()),
            "decision_flip_rate": float(flipped.mean()),
            "positive_to_negative_flips": int(dangerous.sum()),
            "mean_absolute_probability_change": float(np.abs(probability - original_probability).mean()),
            "maximum_absolute_probability_change": float(np.abs(probability - original_probability).max()),
        }
        for row, before, after, was_flipped, was_dangerous in zip(
                rows, original_probability, probability, flipped, dangerous):
            family = family_summary[row["family"]]
            family["records"] += 1
            family["flips"] += int(was_flipped)
            family["positive_to_negative"] += int(was_dangerous)
            if was_flipped or abs(float(after - before)) >= 0.15:
                cases.append({
                    "record_id": row["record_id"],
                    "family": row["family"],
                    "expected": int(row["label"]),
                    "transform": name,
                    "original_probability": float(before),
                    "changed_probability": float(after),
                    "original_prediction": int(before >= threshold),
                    "changed_prediction": int(after >= threshold),
                })

    context_text = [administrative_context(text) for text in original_text]
    pooled_probability = np.asarray([
        sentence_max_probability(model, text) for text in context_text
    ])
    pooled_prediction = pooled_probability >= threshold
    context_probability = model.predict_proba(context_text)[:, 1]
    variants["administrative_context_sentence_max"] = {
        "metrics": metrics(labels, pooled_probability, threshold),
        "decision_flips": int((pooled_prediction != original_prediction).sum()),
        "decision_flip_rate": float((pooled_prediction != original_prediction).mean()),
        "positive_to_negative_flips": int(((labels == 1) & original_prediction & ~pooled_prediction).sum()),
        "mean_absolute_probability_change": float(np.abs(pooled_probability - original_probability).mean()),
        "maximum_absolute_probability_change": float(np.abs(pooled_probability - original_probability).max()),
        "comparison": "Sentence-max aggregation after adding administrative context",
        "unpooled_mean_probability": float(context_probability.mean()),
    }

    result = {
        "status": "SYNTHETIC_DIAGNOSTIC_ONLY",
        "model_version": manifest["model_version"],
        "artifact_sha256": manifest["artifact_sha256"],
        "records": len(rows),
        "threshold": threshold,
        "original": metrics(labels, original_probability, threshold),
        "variants": variants,
        "family_summary": dict(sorted(family_summary.items())),
        "notable_cases": sorted(cases, key=lambda row: abs(
            row["changed_probability"] - row["original_probability"]), reverse=True),
        "limitations": [
            "The source scenarios and perturbations are synthetic and not independently HSE-reviewed.",
            "This audit reuses the consumed scenario test set and cannot select or tune a new model.",
            "The transformations test stability only; they do not establish real-world SIF accuracy.",
        ],
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = audit(args.model_dir, args.output)
    print(json.dumps({key: report[key] for key in (
        "status", "model_version", "records", "threshold", "original", "variants")}, indent=2))
