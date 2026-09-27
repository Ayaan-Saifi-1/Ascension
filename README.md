# Ascension 🚀

**Ascension** is an enterprise-grade Safety Incident Intelligence and Precursor Identification Platform. It combines domain-tuned natural language processing (SafetyBERT), machine learning classification models, and interactive 3D visualizations to help organizations detect Serious Injury & Fatality (SIF) precursors before incidents escalate.

---

## 🏗️ Architecture Overview

The system is organized into modular services:

- **`backend/`**: Django REST Framework API
  - Report ingestion, filtering, and classification workflows
  - PostgreSQL & Supabase support (with fallback to SQLite for local development)
  - PDF report generation (`reportlab`), data seeding, and clustering
  - Waitress multi-threaded production WSGI server
- **`frontend/`**: Modern React & Next.js / Vite web client
  - Responsive dashboards, incident analytics, and precursor exploration
  - 3D interactive visualizations (Plotly Precursor Landscape & Classification Distribution)
  - Dynamic Narrative Climate and Safety review portal
- **`ml/`**: Machine Learning & Safety Pipeline
  - SafetyBERT language model embeddings
  - Scenario SIF Candidate Classifier (`classifier.joblib`)
  - Semantic clustering, hard gate evaluation, and pattern detection engine
- **`scripts/`**: Automation & Deployment utilities
  - Model weights downloader (`download_model.py`)
  - Production server runner (`serve.py`)
  - GCP Ubuntu setup automation (`setup_gcp.sh`)
- **`render.yaml`**: One-click infrastructure specification for Render

---

## ⚡ Quick Start (Local Development)

### 1. Backend Setup

```bash
# Navigate to the project root
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations and seed data
python manage.py migrate
python manage.py setup_deployment

# Start Django development server
python manage.py runserver 8000
```

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000` (or `http://localhost:5173`).

---

## ☁️ Deployment

### Option A: Render (One-Click Blueprint)

1. Connect this repository (`Ayaan-Saifi-1/Ascension`) to [Render](https://render.com).
2. Render detects `render.yaml` and provisions:
   - **`ascension-backend`**: Python web service running Waitress with automated migrations and data seeding.
   - **`ascension-frontend`**: Node service running the Next.js / Vinext web app.
3. Configure your environment variables (e.g. `DATABASE_URL` for Supabase/PostgreSQL, `CORS_ALLOWED_ORIGINS`, `DJANGO_SUPERUSER_PASSWORD`).

### Option B: Google Cloud Platform (Compute Engine)

Run the included automated setup script on an Ubuntu 22.04 / 24.04 LTS VM:

```bash
chmod +x setup_gcp.sh
./setup_gcp.sh
```

---

## 🧠 Machine Learning Checkpoint Download

To download the SafetyBERT transformer checkpoint locally or on a production host:

```bash
python scripts/download_model.py
```

Weights will be fetched from Hugging Face (`adanish91/safetybert`) into `ml/models/safetybert/`.

---

## 📄 License

Proprietary / Internal use. All rights reserved.
