# SmartStock Pro Enterprise - Comprehensive User & Technical Guide

SmartStock Pro Enterprise is a high-performance, AI-driven Inventory Management System (IMS) designed to bridge the gap between simple spreadsheets and complex ERP systems. It leverages a modern full-stack architecture with real-time analytics and Google Gemini AI intelligence.

---

## 🚀 1. Quick Start (The 60-Second Setup)

The fastest way to deploy the entire stack (Database + API + Frontend) is using Docker.

### Prerequisites
- **Docker Desktop** installed and running.
- A **Google Gemini API Key** (Get one at [ai.google.dev](https://aistudio.google.com/)).

### Steps
1. **Prepare Environment**: Create a `.env` file in the root directory (or set the variable in your shell):
   ```bash
   API_KEY=your_gemini_api_key_here
   ```
2. **Launch Stack**:
   ```bash
   docker-compose up --build
   ```
3. **Access**: Open [http://localhost:3000](http://localhost:3000) in your browser.

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
- **Smart Audit**: Every 24 hours (or on refresh), the **Gemini 3 Flash** model analyzes your inventory snapshot to detect anomalies, warranty risks, and procurement needs.
- **Recent Activity**: Live stream of asset movements and status changes.

### 💻 Hardware Management
- **Centralized Registry**: Manage all physical assets with unique IDs and Serial Numbers.
- **Procurement Form**: Log new purchases with supplier data, cost, and warranty periods.
- **Handover Workflow**: Simple UI to assign assets to employees and departments.

### 🔑 License Tracking
- **Software Assets**: Manage digital keys, total vs. assigned seats, and expiration dates.
- **Utilization Bars**: Visual indicators showing how many seats are remaining in your software pool.

### 🔧 Maintenance & Repair
- **Ticket System**: Log issues (Hardware, Software, Physical) with cost estimation.
- **Lifecycle tracking**: Assets marked as "Faulty" automatically appear here for the IT team to review.

### 💬 AI Assistant (Chatbot)
- Located in the bottom right (Floating Action Button).
- Powered by **Gemini 3 Pro**.
- **Capabilities**: Ask questions like "Who has the Dell laptop?", "How many items are in the Marketing department?", or "What is our total inventory cost?"

---

## 🗄 4. Database Schema (MariaDB)

The system initializes with the following schema via `init-db.sql`:

### Table: `items` (Asset Registry)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) | Primary Key (e.g., IT-001) |
| `name` | VARCHAR(100) | Item Model/Name |
| `status` | ENUM | purchased, assigned, in-use, backup, faulty, available |
| `serial` | VARCHAR(100) | Manufacturer Serial Number |
| `cost` | DECIMAL(10,2) | Purchase price |

### Table: `movements` (Audit Trail)
| Column | Type | Description |
| :--- | :--- | :--- |
| `date` | DATETIME | Timestamp of movement |
| `item` | VARCHAR(100) | Reference to item name/id |
| `from` | VARCHAR(100) | Origin (e.g., Warehouse) |
| `to` | VARCHAR(100) | Destination (e.g., Employee Name) |

---

## 🤖 5. AI Integration Details

### Smart Audit (Dashboard)
- **Model**: `gemini-3-flash-preview`
- **Logic**: Sends a lightweight JSON array of inventory statuses and warranties.
- **Prompt**: "Analyze this inventory data... Provide one high-impact, short, professional actionable insight."

### Inventory Assistant (Chatbot)
- **Model**: `gemini-3-pro-preview`
- **Logic**: Injects the first 100 inventory items into the system prompt for deep contextual awareness.
- **Behavior**: Acts as a "Senior Inventory Analyst" capable of complex reasoning over your data.

---

## ⚠️ 6. Manual Installation (Non-Docker)

If you prefer to run the components separately:

1. **Database**: Install MariaDB/MySQL. Run `init-db.sql`.
2. **Backend**:
   ```bash
   cd root_folder
   npm install
   # Set environment variables (DB_HOST, DB_USER, etc.)
   node server.js
   ```
3. **Frontend**: The frontend is served statically by Express. No separate build step is required as it uses ESM modules directly in the browser.

---

## 🛡 7. Troubleshooting

- **"Live Database Inactive"**: Check if the Docker container `smartstock-db` is running. Ensure port 3306 isn't blocked by another local SQL installation.
- **AI Insights not loading**: Verify your `API_KEY` is valid and has "Gemini 3" model access. Check browser console for 403/429 errors.
- **Changes not reflecting**: Clear browser cache or use Incognito. Since the app uses ESM imports, the browser may cache `App.tsx` or `api.ts`.

---

## 🔒 8. Security Note
This enterprise template uses a connection pool with environment-based credentials. For production deployment:
- Change the `MARIADB_ROOT_PASSWORD` in `docker-compose.yml`.
- Enable HTTPS via a reverse proxy (like Nginx or Caddy).
- Implement a login/SSO layer (OIDC/SAML) before the `App` component mounts.

---
*SmartStock Pro Enterprise v1.0.0 - Built with ❤️ for Modern IT Operations.*
