# ASCENSION: OIL SIF Precursor Intelligence Platform

> The ASCENSION –It is not a simple text classifier—it is a life-saving intelligence engine. We don't just label reports; we connect hidden hazard precursors across years of history to break the chain of events before a fatality occurs.

## Table of contents

1. [What it does](#what-it-does)
2. [Layer-by-layer](#layer-by-layer)
3. [Tech stack](#tech-stack)
4. [Repository structure](#repository-structure)
5. [Data model](#data-model)
6. [API reference](#api-reference)
7. [Background jobs (Celery)](#background-jobs-celery)
8. [Roles and access (RBAC)](#roles-and-access-rbac)
9. [Permanent safety properties](#permanent-safety-properties)
10. [Testing and safety assurance](#testing-and-safety-assurance)
11. [Model training and promotion](#model-training-and-promotion)
12. [Build order (work packages)](#build-order-work-packages)
13. [Deployed link](#deployed-link)
14. [Conditional components](#conditional-components)
15. [References](#references)

---

## What it does

The tool works with OIL's existing HSSE reporting system (their system of record) to intake UA/UC observations, near misses and incidents and performs the following actions:

- classifies each report as **SIF-POTENTIAL**, **NON-SIF-POTENTIAL** or **UNCERTAIN/INSUFFICIENT** according to the extent of what could have happened.

- Assigns each report a label based on the nine **IOGP Life-Saving Rules** by using -label classification and also includes evidence to support it.

- It identifies barriers such as effective, degraded, failed, bypassed, missing, unverified and unknown together with their present status and whether or not they have been verified or validated.

- It identifies recurring patterns in the data over time.

- For each site, activity and barrier it calculates the reliability-adjusted SIF-precursor density.

- It focuses on the hard safety gates first and then uses an explainable weighted score for the further evaluation of the cases.

- It keeps each case in a single centralized HSSE review queue until the case has been fully verified.

The severity potential, versus: the tool assesses the possibility of what might have happened rather than what actually did happen. For instance, a near miss which did not cause injuries can be listed as SIF-potential if the circumstances indicate that a serious incident could have taken place.

## Layer-by-layer

| #   | Layer                                     | Purpose                                                                                                         | Key technology                                                                  |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | **Data intake and schema adapter**        | Pull digital records through source adapters, keep an immutable source snapshot, and produce a canonical report | Django, DRF, PostgreSQL, Celery                                                 |
| 2   | **Structural validation**                 | Check required fields, types, timestamps, and duplicates. Structure only, no semantic judgment                  | DRF serializers, Python validators                                              |
| 3   | **NLP foundation**                        | Safety-language encoder with continued pretraining on an Oil & Gas corpus                                       | SafetyBERT, PyTorch, Hugging Face, MLflow                                       |
| 4   | **Safety fact extraction**                | Extract entities, barrier states, and relations; resolve entities; build evidence objects                       | SafetyBERT, regex, Pint, RapidFuzz, Label Studio                                |
| 5   | **Evidence quality and sufficiency gate** | Decide `SUFFICIENT` / `REVIEW_REQUIRED` / `INSUFFICIENT`; detect contradictions                                 | Rule-based, conditional required-fact logic                                     |
| 6   | **SIF/PSIF classification**               | Calibrated P(SIF) with dual thresholds and abstention                                                           | XGBoost, scikit-learn `CalibratedClassifierCV` (Platt)                          |
| 7   | **IOGP Life-Saving Rules tagging**        | Nine independent sigmoid outputs with evidence                                                                  | SafetyBERT multi-label head, `BCEWithLogitsLoss`                                |
| 8   | **Critical barrier intelligence**         | Canonical barrier matching, state, verification vs. validation                                                  | PostgreSQL catalogue, RapidFuzz, pgvector, Django rules                         |
| 9   | **Recurring and hidden precursors**       | Semantic clusters, frequent combinations, sequences, predictive factors, trends                                 | BGE-M3 + pgvector + HDBSCAN, FP-Growth, PrefixSpan, XGBoost + SHAP, EWMA + PELT |
| 10  | **SIF-precursor density**                 | Raw and Bayesian-adjusted density with credible intervals                                                       | Beta-Binomial shrinkage, PostgreSQL aggregates                                  |
| 11  | **Priority and triage**                   | Hard gates, uncertainty gate, pattern escalation, explainable MCDA ranking                                      | Deterministic rules, weighted MCDA                                              |
| 12  | **HSSE review and corrective action**     | Confirm, override, request info, escalate, assign; verified closure                                             | Django workflow                                                                 |
| 13  | **Dashboard and interfaces**              | Role-based screens and REST APIs                                                                                | React, ECharts/Plotly, DRF                                                      |
| 14  | **Monitoring and governance**             | Drift, calibration, override-rate, degraded mode, safety tests                                                  | pytest, Hypothesis, MLflow                                                      |

## Key layer details

**Intake (Layers 1–2)**. The adapters (`OilApiAdapter`, `OilReadOnlyDbAdapter`, `HistoricalCsvAdapter`) only contain logic for mapping fields to the canonical schema; they do not perform any domain-specific reasoning. Ingestion of a particular source is idempotent according to the combination of `source_record_id` and `source_system`. Any field from the source that we do not explicitly map to the canonical schema will be stored as-is in the `source_payload` to avoid information loss. Schema updates are handled through versioning (not overwriting).

**NLP foundation (Layer 3).** This is where SafetyBERT gets its domain training. It keeps learning on real Oil & Gas text — safety alerts, incident write-ups, investigation reports — so it actually picks up on the field's language. A generic model won't know what "PSV gagged" means out of the box; this one does by the time this layer's finished. Everything downstream, from layer 4 onward, leans on that groundwork

**Extraction (Layer 4)**. The entity types are standardized as `ACTIVITY`, `EQUIPMENT`, `HAZARD_ENERGY`, `THREAT`, `EXPOSURE`, `BARRIER`, `CONSEQUENCE`, and `MEASUREMENT`. Additional attributes for `BARRIER` entities are `EFFECTIVE`, `DEGRADED`, `FAILED`, `BYPASSED`, `ABSENT`, `UNVERIFIED`, and `UNKNOWN`. Relations are standardized as `EXPOSED_TO`, `CONTROLLED_BY`, `INDICATES`, and `CAN_LEAD_TO`. Information extraction never produces entities without supporting evidence records. Each fact is supported by one or more pieces of evidence; for example, a JSON representation of a piece of evidence is

```json
{
  "field": "critical_barrier",
  "value": "Pressure Safety Valve",
  "source_status": "EXTRACTED | INFERRED | UNKNOWN",
  "evidence_text": "PSV was gagged during operation",
  "start_char": 118,
  "end_char": 149,
  "confidence": 0.93,
  "model_version": "safetybert-og-v1"
}
```

**Sufficiency (Layer 5):** We follow the principle that weak or insufficient evidence never confirms a negative scenario but may cast doubt of varying degrees on potential risk, therefore lowering the confidence when applicable and flagging cases for inspection when required.

**Classification (Layer 6):** Classifiers are not hard-coded; thresholds for binary classification (SIF vs. non-SIF) are learned from OIL data and calibrated against hsse’s costs-benefits considerations. Whenever possible, two thresholds are used: evidence above the higher threshold confirms SIF-POTENTIAL, while evidence below the lower threshold confirms NON-SIF-POTENTIAL. Evidence in between is sent for inspection instead of being positively or negatively classified.

**IOGP tagging (Layer 7):** There are 9 LSIs covered: Bypassing of Safety Controls, Confined Space Entry, Driving, Energy Isolation, Hot Work, Line of Fire, Safe Mechanical Lifting, Work Authorisation, and Working at Height. A single observation may have multiple IOGP tags.

**Critical barrier intelligence (Layer 8):** Barrier mentions are matched to a canonical catalogue (PSVs, BOPs, isolation systems, gas detectors, etc.) using RapidFuzz and pgvector, so "PSV," "Pump 17," and "P-17" resolve to the same entry. Each barrier carries a state — effective, degraded, failed, bypassed, absent, unverified, or unknown. Verification and validation are tracked separately: verification checks whether the claimed state was actually confirmed; validation checks whether that confirmation was reliable. A barrier claimed "working" isn't treated as effective unless it's been verified.

**Pattern discovery (Layer 9):** Prior to pattern learning, observations are grouped by relevant dimensions such as asset, well, pipeline kilometre, worksite, or work order. Patterns are described using discovery-specific terms such as recurrent association, predictive factor, ordered precursor, trend, candidate contributing factor, etc. The engine avoids suggesting proven causes (“root causes”) and instead refers to associations (“contributing factors”) and mechanisms (“precursors”).

**Density (Layer 10):** The dashboard displays observed density, adjusted density, SIF count, observed count, time window, and density reliability. Density alone is not sufficient to label an installation unsafe; further operational or contextual information must be inspected.

**Priority (Layer 11):** Hard gates always override any prioritization or ranking rules, including those defined in this layer:
| Gate | Description |
|---|---|
| Credible fatal consequence + critical barrier FAILED/BYPASSED/ABSENT | Mandatory CRITICAL review |
| Severe hazard + critical barrier UNKNOWN/UNVERIFIED | Mandatory review; not safe |
| Semantic sufficiency INSUFFICIENT + severe hazard evidence | Review / request information |
| Strongly increasing SIF precursor across multiple installations | Escalation floor (at least HIGH if approved by HSSE policy) |

**Corrective actions (Layer 12):** For critical control-related observations, the closure requires verification by an authorized agent as to whether the reported configuration changes were indeed implemented. This includes a re-assessment of the relevant barrier’s status, which may result in reopening or escalation of the corrective action request if such verification fails.

**Dashboard and Interfaces (Level 13):** The frontend is a ReactJS app built upon Django REST Framework with ECharts or Plotly visualizations for trends, densities, patterns, etc. It is accessible to Field Users, HSE Officers, Site HSE Leads, Corporate HSE, and System Admins, who see different sets of features and data depending on their authentication level (handled by Django or enterprise level OAuth Identity Providers in the case of OIL). Real-time features are light, relying on periodic polling in most cases, with WebSockets used sparingly for genuine real-time requirements. Location data is shown only when coordinates are available, rather than using dummy data. There are eight screens in the app: a Safety Overview dashboard, the core HSE Review Queue, Report Analysis tools, Pattern Explorer, SIF Density displays, Critical Control Heat/Health screens, corrective actions tracking, and a Model/Health view for privileged users.

**Monitoring and reporting (Level 14):** ASCENSION monitors its own health as closely as it monitors the incoming reports  tracking input drift, prediction drift, calibration drift, human override rate, false negative reviews (with any verified missed case treated as an exceptional event of the highest severity), and pattern/system health. Degraded mode is a non-negotiable concern for the system: when model health becomes invalid, the service becomes unavailable, or confidence in extraction is lost, cases are never silently disposed of  hard HSE approved rules still apply, and affected cases are sent to human review while the model is re validated. This is backed by a permanent safety assurance suite, including pytest for unit and data checks, Hypothesis for property based invariants (higher P(SIF) can never imply lower priority), and locked NLP regression, SIF challenge, and barrier challenge sets, so that dangerous or ambiguous cases are never silently passed through without human review.

# Tech stack

| Area                           | Technology                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| Backend                        | Django, Django REST Framework, Django ORM                                                |
| Database                       | PostgreSQL + pgvector                                                                    |
| Async                          | Celery + Redis                                                                           |
| NLP / ML                       | PyTorch, Hugging Face Transformers, SafetyBERT (+ O&G DAPT), XGBoost, scikit-learn, SHAP |
| Embeddings / clustering        | BGE-M3, pgvector, HDBSCAN                                                                |
| Pattern mining                 | mlxtend (FP-Growth), PrefixSpan, EWMA, PELT                                              |
| Deterministic helpers          | Python regex, Pint, RapidFuzz, versioned domain dictionary                               |
| Annotation                     | Label Studio                                                                             |
| Experiment tracking / registry | MLflow                                                                                   |
| Inference runtime              | PyTorch or ONNX Runtime                                                                  |
| Frontend                       | React, ECharts or Plotly                                                                 |
| Serving                        | Nginx -> Gunicorn -> Django/DRF                                                          |
| Packaging                      | Docker                                                                                   |
| Testing                        | pytest, Hypothesis                                                                       |

ASCENSION is built as a **modular Django monolith** first. ML inference sits behind service classes so components can move to separate services later only if scale requires it.

## Repository structure

```text
ascension/
├── manage.py
├── config/#
│   ├── settings/{base,dev,prod}.py
│   ├── celery.py
│   └── urls.py
├── apps/
│   ├── ingestion/     adapters.py serializers.py validators.py models.py tasks.py
│   ├── incidents/     models.py services.py api.py
│   ├── nlp/           extraction.py entity_resolution.py evidence.py models.py
│   ├── sif/           features.py inference.py calibration.py decisions.py models.py
│   ├── iogp/          inference.py taxonomy.py models.py
│   ├── barriers/      catalogue.py matching.py rules.py verification.py models.py
│   ├── patterns/      embeddings.py clustering.py associations.py sequences.py trends.py fusion.py models.py
│   ├── density/       calculations.py bayes.py models.py tasks.py
│   ├── priority/      gates.py scoring.py config.py models.py
│   ├── HSSE/           reviews.py actions.py verification.py models.py
│   ├── governance/    monitoring.py drift.py safety_tests.py models.py
│   └── audit/         models.py middleware.py
├── ml/
│   ├── training/{dapt,extraction,sif,iogp}/
│   └── artifacts/
├── frontend/
├── tests/
│   ├── safety_challenge/
│   ├── property/
│   └── integration/
├── docker/
└── docs/
```

---

## Data model

| Model                                          | Purpose                                                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `Site` / `CanonicalEntity`                     | Canonical site, asset, equipment, well, pipeline section, and work-order identities including aliases |
| `IncidentReport`                               | Canonical source record with unmodifiable source snapshot and versioned normalized fields             |
| `EvidenceQualityAssessment`                    | Completeness, contradictions, sufficiency, including reason codes                                     |
| `SIFAssessment`                                | `p_sif`, calibrated decision, thresholds, model and calibration versions, and supporting evidence     |
| `IOGPTag`                                      | Multi-label rule output with relevance score, supporting evidence, and version                        |
| `BarrierCatalogue` / `BarrierAssessment`       | Organized control catalogue and report-level control state, V&V, and evidence                         |
| `Pattern` / `PatternReportLink`                | Hidden precursor with its exact supporting reports that recurred                                      |
| `SIFDensityMetric`                             | Time-windowed raw and adjusted density with intervals and reliability                                 |
| `PriorityConfiguration` / `PriorityAssessment` | Hard-gate and weight configuration; ranking components, level, and reasons                            |
| `HSSEReview`                                   | Human decision with override reason                                                                   |
| `CorrectiveAction`                             | Lifecycle, verification, closure of action                                                            |
| `ModelVersion`                                 | Artifact, dataset, metrics, status, artifact approval version                                         |
| `AuditEvent`                                   | Append-only record of user or system action                                                           |

Previously made assessments can never be changed. Instead, new assessment always generate a new versioned record.

## API reference

Base path: `/api/v1/`

| Method | Endpoint                  | Purpose                                                                    |
| ------ | ------------------------- | -------------------------------------------------------------------------- |
| POST   | `/reports/`               | Create or simulate a digital report; returns report id and analysis job id |
| POST   | `/imports/`               | Historical backfill import (admin only)                                    |
| GET    | `/reports/{id}/analysis/` | Full versioned analysis and evidence bundle                                |
| GET    | `/reviews/queue/`         | Central HSSE queue, filtered by role, site, priority                       |
| POST   | `/reviews/{id}/decision`  | Confirm, override, request info, or escalate                               |
| POST   | `/actions/`               | Create a corrective action from a review                                   |
| POST   | `/actions/{id}/verify/`   | Record authorized verification, closure, or reopen                         |
| GET    | `/patterns/`              | Recurring and hidden precursor records                                     |
| GET    | `/density/`               | Site/activity/barrier density by time window                               |
| GET    | `/barriers/health/`       | Critical-control and barrier health aggregates                             |
| GET    | `/system/model-health/`   | Model and governance metrics (authorized users)                            |

## Background jobs (Celery)

| Task                                       | Trigger                                         |
| ------------------------------------------ | ----------------------------------------------- |
| `analyze_report(report_id)`                | After successful ingestion and validation       |
| `bulk_import_history(import_id)`           | Historical CSV/ETL backfill                     |
| `build_report_embedding(report_id)`        | After canonical narrative is ready              |
| `refresh_pattern_clusters(window)`         | Scheduled or after a batch threshold            |
| `refresh_frequent_patterns(window)`        | Scheduled                                       |
| `refresh_temporal_trends(window)`          | Scheduled                                       |
| `refresh_density_metrics(window)`          | Scheduled and on material new data              |
| `refresh_priority(pattern/report)`         | After SIF, barrier, pattern, or density updates |
| `send_action_escalations()`                | Scheduled overdue/due-date checks               |
| `run_model_health_checks()`                | Scheduled governance job                        |
| `run_candidate_shadow_eval(model_version)` | Controlled validation only                      |

---

## Roles and access (RBAC)

| Role           | Minimum permissions                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Field User     | Create and view own or permitted reports; answer information requests; view assigned actions              |
| HSSE Officer   | Review assigned cases, inspect evidence, confirm or override, create actions                              |
| Site HSSE Lead | Site-wide reviews, actions, patterns, density, barrier health                                             |
| Corporate HSSE | Cross-site intelligence, systemic patterns, organization-wide density and control health                  |
| System Admin   | Technical configuration, users, connectors. **No authority to alter HSSE decisions** without an HSSE role |

Privacy and fairness: minimize PII, and do not introduce age, gender, or nationality proxies into SIF scoring. Do not rank or punish individual workers based on model scores.

---

## Permanent safety properties

These invariants must hold in every release:

- An `UNKNOWN` critical barrier is never equivalent to `EFFECTIVE`.
- A hard fatal-hazard gate cannot be cancelled by low recurrence, low trend, or low site spread.
- A model or worker failure cannot cause a report to disappear from processing.
- Every user-visible decision is reproducible from stored source, model/config versions, and evidence.
- Historical predictions are never overwritten.

## Testing and safety assurance

| Test family                 | Implementation                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| Unit / data tests           | pytest for adapters, validators, normalization, calculations                             |
| Property-based safety tests | Hypothesis, e.g. higher P(SIF) cannot lower priority; FAILED cannot rank below EFFECTIVE |
| NLP regression set          | Locked expert examples for entity, state, and relation extraction                        |
| SIF challenge set           | HSSE-approved dangerous cases that must never be silently negative                       |
| Barrier challenge set       | PSV, BOP, isolation, gas detection, lifting examples with expected control state         |
| End-to-end tests            | Report -> analysis -> queue -> action -> audit                                           |
| Release gate                | CI/CD blocks a release if mandatory safety tests fail                                    |
| Shadow validation           | Run candidates on live-like data without changing dispositions                           |

### Mandatory challenge cases

| Case                                         | Expected invariant                                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Worker below suspended load, no injury       | Severity is not inferred from zero injury; line-of-fire and lifting evidence reaches SIF/IOGP logic |
| PSV bypassed/gagged                          | Barrier `BYPASSED`; hard escalation if a credible severe consequence exists                         |
| H2S possible, detector status unknown        | `UNKNOWN` control state; not safe; review required                                                  |
| High-pressure maintenance, isolation unclear | Insufficient control evidence; review or abstain                                                    |
| Same precursor rising across sites           | Escalation reflected in priority reasons                                                            |
| `P-17` vs `Pump 17`                          | Entity resolver links to the same asset when catalogue data supports it                             |
| Tiny site sample (2 of 4 SIF)                | Raw density shown with reliability warning and adjusted estimate                                    |

---

## Model training and promotion

**Dataset split policy**

- Deduplicate before splitting
- Same incident reports must be kept within a single split
- The locked test set should be used for final evaluation; thresholds must not be tuned on it
- Add temporal and/or domain-specific holdout partitions if sufficient OIL history is available for the domain/site in question

**Promotion pipeline**

1. Train a candidate model from a versioned training corpus/dataset
2. Evaluate task metrics and failure slices by domain
3. Tune thresholds and select an acceptable candidate model on approved validation partitions
4. Run it through the Safety Assurance Suite and HSSE challenge set to stress-test it.
   5.Register it in MLflow — but only as non-production for now.
   6.Test it in shadow mode alongside the live system to compare real-world behavior.
5. Discuss discrepancies with HSSE and technical owners
6. Require formal documented approval for promotion to production
7. Save the previous model and configuration for reference and potential rollback

The following metrics should be reported for SIF-related tasks: recall, false-negative rate, F2 score, precision, PR-AUC, NPV, Brier score/reliability curve, and analogous measures partitioned by domain, site, or time, as appropriate.

The training corpus (DAPT) consists of IOGP high potential event narratives, BSEE investigation reports, PHMSA pipeline narratives, OISD safety alerts, and other relevant public OIL documents. Notably, OIL internal narratives are added to the corpus at the discretion of the governance committee and maintained as a separate version.

## Build order (work packages)

| WP   | Deliverable | Depends on  |
|---|---|---|
| WP1  | Django project, PostgreSQL, RBAC, canonical `IncidentReport`, audit foundations | None                       |
| WP2  | Digital report API/demo entry, schema adapter, validators, historical import    | WP1                        |
| WP3  | Public O&G corpus ingestion, DAPT scripts, Label Studio schema, annotation seed | WP1                        |
| WP4  | Fact extraction + regex/Pint/dictionary + entity resolution + evidence objects  | WP3                        |
| WP5  | Evidence quality + semantic sufficiency                                         | WP4                        |
| WP6  | XGBoost SIF features/classifier + calibration + decision API                    | WP4-WP5                    |
| WP7  | IOGP multi-label tagging                                                        | WP4                        |
| WP8  | Barrier catalogue + matching + pgvector + V&V + barrier API                     | WP4                        |
| WP9  | BGE-M3/HDBSCAN, FP-Growth, PrefixSpan, XGBoost/SHAP, EWMA/PELT                  | WP4, WP6, WP8              |
| WP10 | Raw/adjusted SIF density + reliability metrics                                  | WP6, WP9                   |
| WP11 | Hard safety gates + explainable priority ranking + queue                        | WP5-WP10                   |
| WP12 | HSSE review/action/verification lifecycle                                       | WP11                       |
| WP13 | Frontend dashboard and all role views                                           | WP2-WP12 APIs              |
| WP14 | Monitoring, safety challenge suite, property tests, shadow/promotion controls   | Cross-cutting; start early |

## Deployed link

https://ascension.matrikaregmi.com.np/


## Conditional components

Not everything in ASCENSION has a default behavior in its code, only a small number of components get switched on specifically when their data conditions are met:

| Component | Turns on when | What it adds |
|---|---|---|
| **PM4Py** | There's a real event log — multiple timestamped events tied to the same asset, case, well, job, or workflow | Traces process paths, flags deviations, catches skipped steps or delays |
| **Exposure-normalized rates** | Reliable denominators exist (work-hours, number of lifts, km driven, well-days) | Shows rate comparisons alongside the regular report-based density |
| **OIL-specific continued DAPT** | Internal OIL narratives are approved for training and properly versioned | Teaches SafetyBERT OIL's own language, beyond public industry text |
| **Monotonic EBM / XGBoost priority model** | There's a long, consistent history of expert-validated OIL HSSE outcome labels | Adds a learned sense of urgency — hard gates still get the final word |
| **LambdaMART / XGBoost Ranker** | Reliable historical queue ordering data exists | Reorders the queue based on what's worked before, but can never downgrade a hard-gated case |

## References

Parikh, Penfield & Juaire (2024), automatic identification of PSIFs, Scientific Reports 14, 8091

NLP and ML for mining accident analysis: automates root cause analysis from mining accident reports (Agarwal et al., 2025)

Energy-based safety risk assessment: tests whether the magnitude and intensity of energy predict injury severity (Hallowell et al., 2017):

AI-based prediction of construction safety outcomes: predicts injury outcomes directly from raw incident report text (Baker et al., 2020)

KKurian, D., Ma, Y., Lefsrud, L.M. & Sattari, F. (2020). Seeing the forest and the trees: using machine learning to categorize and analyze incident reports for Alberta oil sands operators.
 
