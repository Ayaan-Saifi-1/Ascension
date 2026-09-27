"""Reusable features for the local, synthetic-only classifier experiment."""
import re

import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from ml.encoder import encode
from ml.extractor import extract


BARRIER_STATES = ("EFFECTIVE", "DEGRADED", "FAILED", "BYPASSED", "ABSENT",
                  "UNVERIFIED", "UNKNOWN")


def sentence_max_probability(model, text):
    """Keep a material-risk sentence from being diluted by routine report text."""
    segments = [part.strip() for part in re.split(r"(?<=[.!?])\s+|[\r\n]+", text)
                if len(part.split()) >= 4]
    candidates = [text]
    candidates.extend(segment for segment in segments if segment != text)
    return float(model.predict_proba(candidates)[:, 1].max())


class SafetyBertFeatures(TransformerMixin, BaseEstimator):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        return np.vstack([encode(text) for text in X])


class ExtractedSafetyFeatures(TransformerMixin, BaseEstimator):
    """Turn the same evidence-preserving extraction used by the app into features.

    The values are deliberately limited to facts already exposed by the extractor.
    The transformer does not use the final rule-engine decision or a target label.
    """

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        rows = []
        for text in X:
            facts = extract(text)
            states = {barrier["state"] for barrier in facts["barriers"]}
            rows.append([
                float(facts["credible_fatal"]),
                float(facts["direct_exposure"]),
                float(facts["severe_hazard"]),
                float(facts["simulated"]),
                *(float(state in states) for state in BARRIER_STATES),
                float(bool(facts["missing_information"])),
            ])
        return np.asarray(rows, dtype=np.float32)


def candidate(semantic=False, regularization=2.0, structured=False):
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import FeatureUnion, make_pipeline
    views = [
        ("word", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, max_features=20000)),
        ("character", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5),
                                    sublinear_tf=True, max_features=30000)),
    ]
    weights = {"word": 1.0, "character": 0.6}
    if semantic:
        views.append(("semantic", SafetyBertFeatures()))
        weights["semantic"] = 4.0
    if structured:
        views.append(("structured", ExtractedSafetyFeatures()))
        weights["structured"] = 2.0
    return make_pipeline(FeatureUnion(views, transformer_weights=weights),
        LogisticRegression(C=regularization, max_iter=2000,
                           class_weight="balanced", random_state=42))
