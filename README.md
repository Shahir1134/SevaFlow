<div align="center">

# 🩺 HEALTHCONNCET-INDIA
### *Next-Gen AI Healthcare & Ayushman Bharat Insurance Navigation for India*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=for-the-badge&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=for-the-badge&logo=React&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg?style=for-the-badge&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg?style=for-the-badge&logo=Tailwind-CSS&logoColor=white)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-4285F4.svg?style=for-the-badge&logo=Google&logoColor=white)](https://ai.google.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_+_pgvector-336791.svg?style=for-the-badge&logo=PostgreSQL&logoColor=white)](https://github.com/pgvector/pgvector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>English</b> • <b>हिंदी</b> • <b>मराठी</b>
</p>

<p align="center">
  <b>SevaFlow</b> bridges the massive gap in Indian healthcare navigation. By integrating <b>Ayushman Bharat (PM-JAY)</b> intelligence, <b>Retrieval-Augmented Generation (RAG)</b> on dense insurance policies, and a real-time empanelled hospital directory across all <b>750+ Indian districts</b>, SevaFlow empowers every citizen to receive transparent, affordable, and timely medical care.
</p>

</div>

---

## 📑 Table of Contents

- [The Healthcare Dilemma in India](#-the-healthcare-dilemma-in-india)
- [How SevaFlow Solves It](#-how-sevaflow-solves-it)
- [Core Platform Modules](#-core-platform-modules)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Project Directory Layout](#-project-directory-layout)
- [Step-by-Step Installation & Setup](#-step-by-step-installation--setup)
- [Environment Variables Configuration](#-environment-variables-configuration)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Security, Privacy & Grounded Evidence](#-security-privacy--grounded-evidence)
- [License & Acknowledgements](#-license--acknowledgements)

---

## 🚨 The Healthcare Dilemma in India

1. **Complex Policy Jargon**: Millions of families hold health insurance or government schemes but get claims rejected due to fine-print clauses (room-rent sub-limits, PED waiting periods, co-pays).
2. **PM-JAY Underutilization**: Over 500 million beneficiaries are eligible for the ₹5 Lakh annual cashless scheme under Ayushman Bharat, but finding verified empanelled hospitals locally remains difficult.
3. **Out-of-Pocket Surprises**: Families often face devastating medical bills because they lack visibility into procedural costs and accredited public options in their home district.
4. **Language Barriers**: The majority of insurance and healthcare portals operate exclusively in complex bureaucratic English.

---

## 💡 How SevaFlow Solves It

| Challenge | SevaFlow Solution |
| :--- | :--- |
| **Complex Insurance Policies** | **Gemini 2.0 Flash + `pgvector` RAG**: Upload your policy PDF and receive instant answers on room-rent caps, covered treatments, and exclusions with verbatim clause citations. |
| **Hospital Empanelment** | **750+ District Directory**: Search accredited PM-JAY and public medical centers with instant cashless status indicators, tier-based cost estimates, and emergency tags. |
| **Ayushman Bharat Card** | **PM-JAY Navigator**: Verify eligibility, check family floater benefits, and identify local empanelled care centers with zero friction. |
| **Linguistic Inclusion** | **Native Trilingual Support**: Full system localization in **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)**. |
| **AI Hallucinations** | **Evidence Provenance Engine**: No ungrounded advice. Every extraction cites exact page numbers, policy quotes, and source confidence scores. |

---

## ⚡ Core Platform Modules

### 1. 🏥 Find Care & Empanelled Hospitals
- **Pan-India Coverage**: Search across 28,000+ empanelled public and private hospitals across every Indian State and Union Territory.
- **District-Level Granularity**: Filter by State, District, and clinical specialities (Cardiology, Oncology, Orthopaedics, Gynaecology, Nephrology, etc.).
- **Budget Estimation**: Tier 1 / Tier 2 / Tier 3 cost forecasting to prevent out-of-pocket billing shocks.

### 2. 📄 Policy Analyzer & Semantic Insurance RAG
- **Automated Extraction**: Instant breakdown of room-rent sub-limits, critical illness coverage, co-pay clauses, and waiting periods (1-year, 2-year, 4-year pre-existing disease terms).
- **Interactive Policy Assistant**: Ask questions like *"Is cataract surgery covered?"* or *"What is the daily room rent limit?"* and receive answers backed by direct quotes from your policy.

### 3. 🛡️ Ayushman Bharat (PM-JAY) Suite
- Clear explanations of the ₹5 Lakh family floater benefit.
- Checklists for cashless hospitalization and claim settlement requirements.
- Graceful degradation and official portal linkouts if live NHA APIs are experiencing maintenance.

### 4. 📝 10-Step Guided Intake Questionnaire
- Seamless progressive onboarding collecting language preferences, family profile members, life stages, and chronic conditions.
- Smooth slide animations with real-time draft persistence in session storage.

### 5. 💊 Medication & Health Vault
- Schedule daily dosages and track chronic treatments (Diabetes, Hypertension, Heart, Thyroid, Asthma).
- Upload and tag prescriptions, diagnostic reports, and medical bills in an encrypted document vault.

---

## 🏗️ System Architecture

```mermaid
graph TD
    User([Citizen / Family User]) -->|HTTPS / WSS| Frontend[React 18 + Vite SPA<br/>Tailwind CSS v4 • Framer Motion]
    
    subgraph Client-Side
        Frontend -->|i18n Engine| I18N[English / Hindi / Marathi Catalogs]
        Frontend -->|Session State| Storage[(Session Storage)]
        Frontend -->|API Queries| TanStack[TanStack Query v5]
    end

    TanStack -->|REST JSON / JWT| API[FastAPI Backend Server]

    subgraph Backend Services
        API --> Auth[Auth & Profile Management]
        API --> CareSvc[Find Care & Hospital Search Engine]
        API --> PolicySvc[Insurance Document RAG Analyzer]
        API --> Provenance[Provenance & Citation Verifier]
        API --> MedsSvc[Medications & Claims Service]
    end

    subgraph AI & Embeddings
        PolicySvc -->|Document Chunking| PDF[PDFPlumber / Vision OCR]
        PDF -->|text-embedding-004| GeminiEmb[Google Gemini Embeddings]
        GeminiEmb -->|1536-dim Vectors| PGVec[(PostgreSQL 16 + pgvector)]
        PGVec -->|Cosine Similarity Search| PolicySvc
        PolicySvc -->|Context + Prompt| GeminiLLM[Google Gemini 2.0 Flash]
        GeminiLLM -->|Grounded Answer + Citations| API
    end

    subgraph Data Store
        Auth & CareSvc & MedsSvc --> DB[(PostgreSQL 16 Relational DB)]
        DB --> Adminer[Adminer DB GUI :8080]
    end
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode, `exactOptionalPropertyTypes`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State & Networking**: [TanStack Query v5](https://tanstack.com/query) + [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/) + React Testing Library

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **ASGI Server**: [Uvicorn](https://www.uvicorn.org/)
- **ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Async engine with `asyncpg`)
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/)
- **Authentication**: JWT tokens with [python-jose](https://github.com/mpdavis/python-jose) + [passlib](https://passlib.readthedocs.io/)
- **Rate Limiting**: [SlowAPI](https://github.com/laurentS/slowapi)
- **PDF Extraction**: [pdfplumber](https://github.com/jsvine/pdfplumber)
- **AI / LLM**: [Google GenAI SDK](https://github.com/google-gemini/generative-ai-python) (`gemini-2.0-flash`, `text-embedding-004`)

### Database & DevOps
- **Database**: [PostgreSQL 16](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector)
- **Database Management**: [Adminer](https://www.adminer.org/)
- **Containerization**: [Docker & Docker Compose](https://www.docker.com/)

---

## 📡 API Endpoints Reference

| Module | Route | Method | Description |
| :--- | :--- | :--- | :--- |
| **System** | `/health` | `GET` | Health check & database connectivity probe |
| **Auth** | `/auth/register` | `POST` | Register user account |
| **Auth** | `/auth/login` | `POST` | OAuth2 password flow login (returns JWT) |
| **Auth** | `/auth/me` | `GET` | Get authenticated user profile |
| **Onboarding** | `/onboarding/submit` | `POST` | Persist intake questionnaire answers |
| **Profiles** | `/profiles` | `GET` / `POST` | Manage family member health profiles |
| **Care** | `/find-care/search` | `GET` | Search hospitals by State, District, and Speciality |
| **Care** | `/find-care/budget` | `POST` | Estimate out-of-pocket costs by district tier |
| **Documents** | `/documents/upload` | `POST` | Upload policy PDF or medical report |
| **Documents** | `/documents` | `GET` | List user documents with verification tags |
| **Insurance** | `/insurance/analyze` | `POST` | Trigger Gemini RAG clause extraction |
| **Insurance** | `/insurance/query` | `POST` | Ask natural language question against policy |
| **PM-JAY** | `/pmjay/check` | `GET` | Check Ayushman Bharat coverage eligibility |
| **Medications** | `/medications` | `GET` / `POST` | Manage medication schedules and dosages |
| **Claims** | `/claims/checklist` | `GET` | Fetch claim submission checklist for treatment |

*(Interactive Swagger UI documentation is available at `http://localhost:8000/docs`)*

---

## 📁 Project Directory Layout

```
iiit-d/
├── .env.template               # Environment variables configuration template
├── docker-compose.yml          # PostgreSQL 16 + pgvector container definition
├── README.md                   # Project documentation
│
├── backend/
│   ├── alembic/                # Database schema migration versions
│   ├── alembic.ini             # Alembic configuration
│   ├── app/
│   │   ├── api/                # REST endpoints (find_care, insurance, auth, etc.)
│   │   ├── config.py           # Pydantic BaseSettings configuration
│   │   ├── database.py         # Asyncpg session lifecycle
│   │   ├── dependencies.py     # JWT validation and DB session injection
│   │   ├── integrations/       # Gemini AI client, NHA PM-JAY mock/real connectors
│   │   ├── main.py             # FastAPI entrypoint, CORS, exception handlers
│   │   ├── models/             # SQLAlchemy ORM database models
│   │   ├── provenance/         # Grounded citations and verification tracker
│   │   ├── schemas/            # Pydantic input/output schemas
│   │   └── services/           # Core RAG, document parsing, hospital search
│   ├── pyproject.toml          # Build configuration and project metadata
│   ├── requirements.txt        # Production Python dependencies
│   └── tests/                  # Pytest automated test suites
│
└── frontend/
    ├── src/
    │   ├── api/                # Axios/fetch client & React Query hooks
    │   ├── components/         # Shared UI components (ConsentGate, FileUpload)
    │   ├── i18n/               # Catalogs (en.ts, hi.ts, mr.ts) & hook
    │   ├── layout/             # Header, Sidebar, and AppLayout
    │   ├── onboarding/         # 10-step questionnaire state machine
    │   ├── pages/              # ClaimsPage, DocumentsPage, FindCarePage, etc.
    │   ├── types/              # TypeScript types & Zod schemas
    │   ├── index.css           # Global CSS and Tailwind directives
    │   └── main.tsx            # React application root
    ├── package.json            # Node.js dependencies and scripts
    ├── tsconfig.json           # TypeScript configuration
    └── vite.config.ts          # Vite bundler configuration
```

---

## 🚀 Step-by-Step Installation & Setup

### 1. Prerequisites Check
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (v3.11 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Running)

---

### 2. Configure Environment Variables
Copy `.env.template` to `.env`:

```bash
# Windows (PowerShell)
Copy-Item .env.template .env

# Linux / macOS
cp .env.template .env
```

Open `.env` and fill in your values:
```env
# 1. Google Gemini API Key (Required for Insurance RAG & Document Analyzer)
# Get your free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_EMBEDDING_MODEL=text-embedding-004
GEMINI_GENERATIVE_MODEL=gemini-2.0-flash

# 2. Database Connection
DATABASE_URL=postgresql+asyncpg://healthuser:healthpass@localhost:5432/healthdb
DATABASE_URL_SYNC=postgresql://healthuser:healthpass@localhost:5432/healthdb

# 3. Secret Key for JWT Tokens
JWT_SECRET_KEY=9b49b4c09d57a2b91839e9f60bfb5c71d6043217482930283471018274928192
```

---

### 3. Launch PostgreSQL with pgvector (Docker)
Start the database service:

```bash
docker compose up -d
```

Verify that the containers are healthy:
```bash
docker compose ps
```
- **PostgreSQL**: `localhost:5432`
- **Adminer DB Browser**: [`http://localhost:8080`](http://localhost:8080) *(System: PostgreSQL, Server: db, Username: healthuser, Password: healthpass, Database: healthdb)*

---

### 4. Setup Backend Service (FastAPI)

```bash
# Navigate to backend
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database schema migrations
alembic upgrade head

# Start FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend API will be live at [`http://localhost:8000`](http://localhost:8000).  
Interactive Swagger docs: [`http://localhost:8000/docs`](http://localhost:8000/docs).

---

### 5. Setup Frontend Service (React + Vite)

Open a new terminal window:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open [`http://localhost:5173`](http://localhost:5173) in your browser.

---

## ⚙️ Environment Variables Configuration

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | *(None)* | Google AI Studio Gemini API Key |
| `GEMINI_EMBEDDING_MODEL` | `text-embedding-004` | 1536-dimensional embedding model |
| `GEMINI_GENERATIVE_MODEL`| `gemini-2.0-flash` | Multimodal generative inference model |
| `DATABASE_URL` | `postgresql+asyncpg://...` | Async database URI for FastAPI application |
| `DATABASE_URL_SYNC` | `postgresql://...` | Synchronous database URI for Alembic migrations |
| `JWT_SECRET_KEY` | *(None)* | Secret cryptographic key for access tokens |
| `JWT_ALGORITHM` | `HS256` | Token signing algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token lifespan |
| `MAX_UPLOAD_SIZE_BYTES` | `20971520` (20 MB) | Maximum permitted policy document file size |
| `ALLOWED_DOC_MIME_TYPES` | `application/pdf,image/...`| Whitelisted upload formats |
| `RATE_LIMIT_PER_MINUTE` | `60` | SlowAPI per-IP request ceiling |

---

## 🧪 Testing & Quality Assurance

### Frontend Testing (Vitest & React Testing Library)
```bash
cd frontend

# Run all unit and component test suites
npm test

# Run tests in interactive watch mode
npm run test:watch

# Perform strict TypeScript typecheck
npm run typecheck
```
*Current test suite: **6 test suites, 37 tests passing (100%)**.*

### Backend Testing (Pytest)
```bash
cd backend

# Run backend unit tests
pytest

# Run tests with coverage
pytest --cov=app tests/
```

---

## 🔒 Security, Privacy & Grounded Evidence

- **Medical Non-Advice & Consent Gate**: SevaFlow provides informational and navigation guidance. Users must accept a clinical disclaimer before receiving care triage.
- **Client-Side Draft Isolation**: Onboarding questionnaire answers remain in the user's browser `sessionStorage` and are only committed to the database upon explicit consent.
- **Evidence Provenance & Anti-Hallucination**: Every clause extracted by the Insurance RAG pipeline returns exact quote snippets, page numbers, and verifier check results to ensure legal and clinical accuracy.
- **Upload Hardening**: File payloads are verified for magic bytes, size limits, and sanitised before processing.

---

## 📄 License & Acknowledgements

- Distributed under the **MIT License**.
- Built with data and inspirations from the **National Health Authority (NHA)**, **Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB PM-JAY)**, and the **Google Gemini Developer Competition**.
- Special thanks to all open-source contributors and healthcare workers advancing public health access across India.

<div align="center">
  <sub>Made with ❤️ for a healthier, more transparent India.</sub>
</div>
