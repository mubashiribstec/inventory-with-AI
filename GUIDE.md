# SmartStock Pro Enterprise - Comprehensive User & Technical Guide

SmartStock Pro Enterprise is a high-performance, AI-driven Inventory Management System (IMS) designed to bridge the gap between simple spreadsheets and complex ERP systems. It leverages a modern full-stack architecture with real-time analytics and Google Gemini AI intelligence.

---

## 🚀 1. Quick Start (The 60-Second Setup)

The fastest way to deploy the entire stack (Database + API + Frontend) is using Docker.

### Prerequisites
- **Docker Desktop** installed and running.
- A **Google Gemini API Key** (Get one at [ai.google.dev](https://aistudio.google.com/)).

### Steps
1. **Prepare Environment**: Create a `.env` file in the root directory:
   ```bash
   API_KEY=your_gemini_api_key_here
   ```
2. **Launch Stack**:
   ```bash
   docker compose up --build
   ```
3. **Access**: Open [http://localhost:3000](http://localhost:3000) in your browser.

> **💡 Linux Users**: If you are using a fresh Linux install, please follow our detailed **[INSTALL_LINUX.md](./INSTALL_LINUX.md)** for a step-by-step setup of Docker and Node.js.

---

## 🛠 2. Architecture & Tech Stack

SmartStock Pro uses a **3-Tier Enterprise Architecture**:

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Tailwind CSS | High-fidelity UI, real-time state, and responsive design. |
| **Middleware** | Node.js, Express | API Gateway, connection pooling, and security. |
| **Intelligence** | Google Gemini API | Predictive analysis, NLP chatbot, and audit automation. |
| **Storage (Primary)** | MariaDB (Docker) | Relational persistence for enterprise data integrity. |
| **Storage (Edge)** | IndexedDB (Browser) | Offline capabilities and local caching for high performance. |

---

## 📂 3. Feature Modules

### 📊 Dashboard (The Command Center)
- **Real-time Metrics**: Tracks Purchased, Assigned, In-Use, Backup, and Faulty stock.
- **Smart Audit**: Powered by **Gemini 3 Flash**, it analyzes your inventory snapshot to detect anomalies.
- **Recent Activity**: Live stream of asset movements and status changes.

### 💻 Hardware Management
- **Centralized Registry**: Manage all physical assets with unique IDs and Serial Numbers.
- **Procurement Form**: Log new purchases with supplier data, cost, and warranty periods.
- **Handover Workflow**: Simple UI to assign assets to employees and departments.

### 🔑 License Tracking
- **Software Assets**: Manage digital keys, total vs. assigned seats, and expiration dates.

### 🔧 Maintenance & Repair
- **Ticket System**: Log issues with cost estimation and status tracking.

### 💬 AI Assistant (Chatbot)
- Located in the bottom right FAB.
- Powered by **Gemini 3 Pro**.
- **Capabilities**: Query inventory data using natural language.

---

## 🗄 4. Database Schema (MariaDB)

The system initializes with the following schema via `init-db.sql`:

### Table: `items` (Asset Registry)
Primary storage for all physical hardware and capital assets.

### Table: `movements` (Audit Trail)
Historical log of every assignment, transfer, and status change.

---

## 🤖 5. AI Integration Details

### Smart Audit (Dashboard)
- **Model**: `gemini-3-flash-preview`
- **Goal**: Professional actionable insights based on status trends and warranty dates.

### Inventory Assistant (Chatbot)
- **Model**: `gemini-3-pro-preview`
- **Goal**: Context-aware reasoning over the entire asset catalog.

---

## 🛡 6. Troubleshooting

- **"Live Database Inactive"**: Ensure the Docker container `smartstock-db` is healthy.
- **AI Insights not loading**: Verify your `API_KEY` in the `.env` file.
- **Permissions**: On Linux, ensure your user is in the `docker` group.

---
*SmartStock Pro Enterprise v1.0.0 - Built with ❤️ for Modern IT Operations.*
