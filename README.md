# Sentry Health // DSA IA3 Hospital Intelligence & Triage System

An integrated medical facility management platform built for **Semester 3 Data Structures and Algorithms (DSA Micro-Project IA3)**. The system handles emergency triage, longitudinal patient visit logging, large-scale medical record organization, AI symptom-based decision-tree diagnosis, and epidemiological contagion tracking.

Styled following the **Sentry Design System** (`DESIGN-sentry.md`): crisp porcelain canvas (`#f6f5fb`), pure white cards (`#ffffff`), ink-deep typography (`#150f23`), electric lime highlight accents (`#c2ef4e`), and Google Rubik typography — with a 1-click **Light/Dark Mode toggle** included.

---

## 📋 Course Outcome (CO1 – CO5) Architecture Mapping

Every single data structure and algorithm is **implemented purely from scratch in Python** inside `backend/algorithms/` without relying on built-in library shortcuts (such as `heapq`, `sorted()`, `.sort()`, or `bisect`).

| Course Outcome | Description | Data Structure & Algorithm | Theoretical Complexity | Implementation File |
| :--- | :--- | :--- | :--- | :--- |
| **CO1** | Emergency Triage & Appointment Scheduling | **Queue (FIFO)** for routine bookings;<br>**Priority Queue (Max-Heap by Severity)** for emergency intake. | Enqueue: $O(\log n)$<br>Dequeue: $O(\log n)$<br>FIFO: $O(1)$ | [`backend/algorithms/queue_structures.py`](file:///c:/Users/LENOVO/Documents/KITS/Semester%203/DSA/IA3/backend/algorithms/queue_structures.py) |
| **CO2** | Patient Visit Logging | **Doubly Linked List** with bidirectional pointer navigation (`prev`/`next` cursors) for sequential medical histories. | Append: $O(1)$<br>Prev/Next: $O(1)$ | [`backend/algorithms/doubly_linked_list.py`](file:///c:/Users/LENOVO/Documents/KITS/Semester%203/DSA/IA3/backend/algorithms/doubly_linked_list.py) |
| **CO3** | Medical Record Sorting & Fast Retrieval | **Merge Sort** (by date or billing amount);<br>**Binary Search** & **Interpolation Search** on sorted records;<br>**Hash Table** with separate chaining & dynamic resize. | Merge Sort: $O(n \log n)$<br>Binary: $O(\log n)$<br>Interp: $O(\log \log n)$<br>Hash: $O(1)$ | [`backend/algorithms/sorting_searching.py`](file:///c:/Users/LENOVO/Documents/KITS/Semester%203/DSA/IA3/backend/algorithms/sorting_searching.py)<br>[`backend/algorithms/hash_table.py`](file:///c:/Users/LENOVO/Documents/KITS/Semester%203/DSA/IA3/backend/algorithms/hash_table.py) |
| **CO4** | AI Symptom Classification & Large-scale Storage | **Binary Decision Tree** (internal yes/no question nodes, illness leaf nodes);<br>**B-Tree (Order $t=3$)** database indexing engine. | Tree: $O(\text{depth})$<br>B-Tree: $O(\log_t n)$ | [`backend/algorithms/binary_tree.py`](file:///c:/Users/LENOVO/Documents/KITS/Semester%203/DSA/IA3/backend/algorithms/binary_tree.py)<br>[`backend/algorithms/b_tree.py`](file:///c:/Users/LENOVO/Documents/KITS/Semester%203/DSA/IA3/backend/algorithms/b_tree.py) |
| **CO5** | Disease Progression & Contagion Modeling | **Graph (Adjacency Lists)**;<br>**BFS** for transmission radius waves (uses custom Queue);<br>**DFS** for infection origin / Patient Zero tracing (uses custom Stack). | BFS: $O(V + E)$<br>DFS: $O(V + E)$ | [`backend/algorithms/graph.py`](file:///c:/Users/LENOVO/Documents/KITS/Semester%203/DSA/IA3/backend/algorithms/graph.py) |

---

## 🛠 Technology Stack

- **Backend**: Python 3, Django 6, Django REST Framework, `django-cors-headers`.
- **Database**: PostgreSQL (via environment variables `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`) with seamless automatic fallback to SQLite (`db.sqlite3`) for instant zero-config startup.
- **Algorithms**: Pure Python standard implementations in `backend/algorithms/`.
- **Frontend**: React (Vite) + Plain CSS styled with Sentry Design Tokens, Lucide React icons.

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
Ensure you have **Python 3.10+** and **Node.js 18+** installed.

### 2. Backend Setup
Open a terminal in the project directory:
```bash
# Navigate to backend directory
cd backend

# (Optional) Set up PostgreSQL env vars if desired:
# $env:DB_NAME="sentry_health"; $env:DB_USER="postgres"; $env:DB_PASSWORD="password"

# Run database migrations
python manage.py makemigrations core
python manage.py migrate

# Seed database with 50 realistic patient records, clinical visits, and contact network
python seed_data.py

# Start Django backend server
python manage.py runserver 127.0.0.1:8000
```
Backend API will be live at `http://127.0.0.1:8000/api/`.

### 3. Frontend Setup
Open a separate terminal in the project directory:
```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies (if not already installed)
npm install

# Start Vite React development server
npm run dev
```
Frontend Web Client will be live at `http://localhost:5173/`.

---

## 🌐 REST API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/patients/?sort=date\|billing\|severity&order=asc\|desc` | Lists patient records sorted using pure recursive **Merge Sort** $O(n \log n)$. |
| `POST` | `/api/patients/` | Creates a new patient profile and hydrates Hash Table, B-Tree, and Contact Graph. |
| `GET` | `/api/patients/<id>/?method=binary\|interpolation\|hash\|btree` | Locates patient record using chosen algorithm, returning comparison steps and latency. |
| `POST` | `/api/triage/` | Evaluates symptom answers on **Binary Decision Tree**, calculates severity, and enqueues to **Priority Queue** (Emergency) or **FIFO Queue** (Routine). |
| `POST` | `/api/triage/next/` | Dequeues next patient: highest severity emergency patient first, routine appointments next. |
| `GET` | `/api/triage/status/` | Returns waiting lengths and preview of both Priority and Routine queues. |
| `GET` | `/api/patients/<id>/visits/` | Returns all clinical visits for a patient organized via **Doubly Linked List**. |
| `POST` | `/api/patients/<id>/visits/` | Appends a new clinical visit node to the tail of the Doubly Linked List in $O(1)$. |
| `GET` | `/api/patients/<id>/visits/navigate/?action=prev\|next\|reset_head\|reset_tail` | Steps cursor forward or backward across the Doubly Linked List pointers. |
| `POST` | `/api/diagnose/` | Walks the Binary Tree using symptoms, returning path taken, classification, and prescription. |
| `GET` | `/api/disease/graph/` | Returns full graph vertices and adjacency links for interactive visualization. |
| `GET` | `/api/disease/bfs/?start=<id>&depth=<n>` | Runs **BFS** from starting patient within $n$ contact waves, modeling transmission radius. |
| `GET` | `/api/disease/dfs/?start=<id>` | Runs **DFS** tracing infection lineage backwards to identify suspected Patient Zero. |
| `GET` | `/api/benchmark/` | Runs live time-complexity benchmarks (Merge Sort vs Timsort; Linear vs Binary vs Interpolation vs Hash Table). |

---

## 💻 Frontend Pages & Features

1. **Dashboard**: Live queue monitors (Emergency Priority Queue vs Routine Appointment Queue), quick stat cards, and "Summon Next Patient" processor.
2. **Triage & AI Diagnosis**: Clinical symptom questionnaire; walks the Binary Decision Tree in real time, displays decision breadcrumb path, calculated severity rating, and enqueues patient.
3. **Patients & Medical Records**: Multi-strategy search box (Binary, Interpolation, Hash Table, B-Tree) displaying algorithmic comparison steps; Merge Sort controls by admission date, billing, or severity.
4. **Visit History (DLL)**: Interactive Doubly Linked List pointer visualizer (`[prev] <--> [current] <--> [next]`) with forward/backward stepping and log new visit form.
5. **Disease Tracker (Graph)**: Interactive SVG epidemiological network with BFS transmission radius waves and DFS origin tracer highlighting Patient Zero.
6. **Performance & Benchmarks**: Real-time benchmark runner evaluating empirical latencies and theoretical complexity tables.
