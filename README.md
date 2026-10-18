# SevaFlow (HealthConnect India) 🇮🇳

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg?style=flat&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg?style=flat&logo=Tailwind-CSS&logoColor=white)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-AI-4285F4.svg?style=flat&logo=Google&logoColor=white)](https://ai.google.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_+_pgvector-336791.svg?style=flat&logo=PostgreSQL&logoColor=white)](https://github.com/pgvector/pgvector)

**SevaFlow** (HealthConnect India) is an AI-powered, multilingual healthcare and health insurance navigation platform designed for Indian citizens and families. It democratizes access to verified care by simplifying Ayushman Bharat (PM-JAY), decoding complex insurance policies using semantic retrieval (RAG), and providing localized hospital and medical guidance.

---

## 🌟 Key Features

### 1. 🏥 Find Empanelled Care & Hospitals
- Search across public hospitals, government medical colleges, and **PM-JAY (Ayushman Bharat)** empanelled centers across **750+ Indian districts**.
- Filter by State, District, and clinical specialities (Cardiology, Oncology, Orthopaedics, Nephrology, etc.).
- Transparent indicators for **PM-JAY Cashless eligibility**, emergency capabilities, and public vs. private facilities.
- Out-of-pocket and budget estimation guidance based on local tier categories.

### 2. 📄 Insurance Document RAG & Policy Analyzer
- Upload health insurance policies (PDF, image scans) to automatically extract:
  - Room rent caps and sub-limits.
  - Pre-existing disease (PED) waiting periods.
  - Exclusions, co-pays, and critical illness terms.
- Vector search powered by **Google Gemini Embeddings (`text-embedding-004`)** and **PostgreSQL `pgvector`**.
- Natural language query interface backed by **Gemini 2.0 Flash**.

### 3. 🛡️ Ayushman Bharat (PM-JAY) Navigator
- Real-time guidance on the **₹5 Lakh** annual cashless family floater scheme.
- Verification workflows for PM-JAY card holders, eligibility checklists, and empanelment lookup with graceful fallbacks.

### 4. 📋 Guided Intake & Personalized Health Profile
- Intuitive, accessible 10-step onboarding questionnaire.
- Manages profiles for yourself, spouse, children, or elderly parents.
- Tracks chronic health conditions (Diabetes, Hypertension, Heart, Thyroid, Kidney) to deliver customized care pathways.

### 5. 💊 Medication & Health Records Vault
- Daily schedule and dosage tracker with refill alert notifications.
- Secure, client-controlled health document storage for prescriptions, lab reports, and hospital bills.

### 6. 🌐 Multilingual & Inclusive
- Native localization in **English**, **हिंदी (Hindi)**, and **मराठी (Marathi)**.
- Designed with high-contrast accessibility, keyboard navigation, and responsive layouts for mobile and desktop.

### 7. 🔍 Provenance & Grounded Evidence
- Every recommendation and extracted clause includes **evidence provenance**: source page, verbatim policy quotes, and confidence scores to prevent AI hallucinations.

---

## 🏗️ Architecture & Tech Stack

```
SevaFlow Architecture
├── Frontend (Client)
│   ├── React 18 + Vite (SPA)
│   ├── TypeScript + Strict Mode
│   ├── Tailwind CSS v4 + Framer Motion
│   ├── TanStack Query (Server State)
│   └── i18n localization (EN, HI, MR)
│
├── Backend (API & Orchestration)
│   ├── FastAPI (Python 3.11+)
│   ├── SQLAlchemy 2.0 (Asyncpg)
│   ├── Alembic (Database Migrations)
│   ├── Google Gemini API (2.0 Flash & text-embedding-004)
│   ├── PDFPlumber (Document Parsing)
│   └── SlowAPI (Rate Limiting) & Python-Jose (JWT Auth)
│
└── Data Layer
    ├── PostgreSQL 16 + pgvector extension
    ├── Adminer (Database GUI)
    └── Docker Compose
```

---

## 📂 Project Structure

```
iiit-d/
├── docker-compose.yml          # PostgreSQL 16 + pgvector & Adminer services
├── .env.template               # Template for environment configuration
├── backend/                    # FastAPI application
│   ├── alembic/                # Database migrations
│   ├── app/
│   │   ├── api/                # REST endpoints (auth, onboarding, find_care, insurance, etc.)
│   │   ├── config.py           # Application settings via Pydantic
│   │   ├── database.py         # Async SQLAlchemy engine and session setup
│   │   ├── dependencies.py     # Auth & dependency injection
│   │   ├── integrations/       # Gemini AI, NHA PM-JAY & Reminders
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── provenance/         # Grounded evidence & citation tracker
│   │   ├── schemas/            # Pydantic v2 validation schemas
│   │   └── services/           # Business logic, RAG engine, analyzer
│   ├── pyproject.toml          # Python project specification & dependencies
│   ├── requirements.txt        # Pip dependencies
│   └── tests/                  # Pytest automated test suite
│
└── frontend/                   # React + TypeScript Vite application
    ├── src/
    │   ├── api/                # API client and TanStack Query hooks
    │   ├── components/         # Common UI components (FileUpload, ConsentGate, etc.)
    │   ├── i18n/               # Localization catalogs (en, hi, mr) and context
    │   ├── layout/             # Header, Sidebar, and AppLayout
    │   ├── onboarding/         # 10-step wizard, state machine, and questions
    │   ├── pages/              # Primary route views (FindCare, Insurance, Claims, etc.)
    │   ├── types/              # TypeScript interfaces and Zod schemas
    │   └── index.css           # Design tokens and styles
    ├── package.json            # Frontend dependencies and npm scripts
    └── vite.config.ts          # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.11 or higher
- **Docker & Docker Compose**: (For local PostgreSQL + pgvector)
- **Google Gemini API Key**: [Get a Gemini API Key](https://aistudio.google.com/app/apikey)

---

### Step 1: Clone & Configure Environment

```bash
git clone https://github.com/Shahir1134/SevaFlow.git
cd SevaFlow
```

Copy the environment template:
```bash
cp .env.template .env
```

Open `.env` and configure your credentials:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_EMBEDDING_MODEL=text-embedding-004
GEMINI_GENERATIVE_MODEL=gemini-2.0-flash

DATABASE_URL=postgresql+asyncpg://healthuser:healthpass@localhost:5432/healthdb
DATABASE_URL_SYNC=postgresql://healthuser:healthpass@localhost:5432/healthdb

JWT_SECRET_KEY=generate_a_secure_hex_key
```
*(Tip: generate a secure JWT key with `python -c "import secrets; print(secrets.token_hex(32))"`)*

---

### Step 2: Start the Database (Docker)

Launch PostgreSQL with `pgvector` and Adminer:
```bash
docker compose up -d
```
- **PostgreSQL**: `localhost:5432` (User: `healthuser`, Password: `healthpass`, DB: `healthdb`)
- **Adminer DB GUI**: [`http://localhost:8080`](http://localhost:8080)

---

### Step 3: Set Up and Run the Backend

1. Navigate to the backend directory and set up a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run database migrations:
   ```bash
   alembic upgrade head
   ```

4. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
- **API Server**: [`http://localhost:8000`](http://localhost:8000)
- **Interactive Swagger Docs**: [`http://localhost:8000/docs`](http://localhost:8000/docs)
- **ReDoc**: [`http://localhost:8000/redoc`](http://localhost:8000/redoc)

---

### Step 4: Set Up and Run the Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```
- **Web App**: [`http://localhost:5173`](http://localhost:5173)

---

## 🧪 Testing

### Frontend Tests (Vitest)
Run the unit and component test suite:
```bash
cd frontend
npm test
```
Run type-checking:
```bash
npm run typecheck
```

### Backend Tests (Pytest)
Run backend unit and integration tests:
```bash
cd backend
pytest
```

---

## 🛡️ Security & Privacy
- **Consent Gate & Disclaimers**: Platform recommendations are informational aids and not medical advice. Users review a clear disclaimer prior to accessing clinical guidance.
- **Data Minimization**: Health questionnaire drafts are stored in browser session storage and only committed upon explicit user action.
- **Strict File Controls**: Uploads are restricted by size (20MB cap) and sanitized against supported MIME types (`application/pdf`, `image/jpeg`, `image/png`, `image/tiff`).

---

## 🤝 Contributing
Contributions, feedback, and issue reports are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
