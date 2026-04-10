# HBnB — Part 4: Simple Web Client

## Overview

**HBnB Part 4** is the front-end of the HBnB application.
It interacts with the REST API developed in Part 3 using **AJAX (`fetch`)** and manages authentication via **JWT stored in cookies**.

Built with **vanilla HTML, CSS, and JavaScript** — no frameworks.

---

## Pages

| Page | Description |
|------|-------------|
| `index.html` | Home page — places list with price filter |
| `login.html` | User authentication |
| `place.html` | Place details, amenities, reviews |
| `add_review.html` | Submit a review (auth required) |
| `add_place.html` | Create a new place (auth required) |

---

## Project Structure

```
part4/
├── index.html
├── login.html
├── place.html
├── add_review.html
├── add_place.html
├── styles.css
├── scripts.js
├── populate.py
└── images/
    ├── logo.png
    └── icon.png
```

---

## Installation & Setup

### 1. Requirements

- Python 3.10+
- Part 3 backend with `flask-cors` enabled

```bash
cd part3/hbnb
pip install -r requirements.txt
```

### 2. Initialize Database

```bash
cd part3/hbnb
rm -f instance/development.db
sqlite3 instance/development.db < schema.sql
```

### 3. Start the API

```bash
cd part3/hbnb
python3 run.py
```

API running on http://127.0.0.1:5000

### 4. Seed the Database

```bash
cd part4
pip install requests
python3 populate.py
```

### 5. Start the Frontend

```bash
cd part4
python3 -m http.server 8000
```

Open http://127.0.0.1:8000

---

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@hbnb.io` | `admin1234` | Admin |
| `john.doe@hbnb.io` | `pass1234` | User (place owner) |
| `jane.smith@hbnb.io` | `pass1234` | User (reviewer) |
| `robert.brown@hbnb.io` | `pass1234` | User (reviewer) |

---

## Features

### Task 0 — Design

- Semantic HTML5 structure
- Responsive CSS
- Required classes: `.logo`, `.login-button`, `.place-card`, `.details-button`, `.place-details`, `.place-info`, `.review-card`, `.add-review`, `.form`
- Fixed card parameters: margin 20px, padding 10px, border 1px solid #ddd, border-radius 10px

### Task 1 — Login (`login.html`)

- `POST /api/v1/auth/login`
- Stores JWT token in cookie
- Redirects to `index.html` on success
- Displays error message on failure

### Task 2 — Index (`index.html`)

- Fetches places from API
- Displays place cards dynamically
- Client-side price filter (10, 50, 100, All)
- Login link visible only when not authenticated

### Task 3 — Place Details (`place.html`)

- Extracts place ID from URL
- Fetches place details + reviews
- Displays host, price, description, amenities
- Shows review form only if authenticated

### Task 4 — Add Review (`add_review.html`)

- Redirects unauthenticated users to index
- Submits review via `POST /api/v1/reviews/`
- Displays success/error alert

---

## API Endpoints Used

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | No | Login |
| GET | `/api/v1/places/` | No | List places |
| GET | `/api/v1/places/:id` | No | Place details |
| GET | `/api/v1/places/:id/reviews` | No | Place reviews |
| GET | `/api/v1/users/:id` | No | User info |
| POST | `/api/v1/reviews/` | Yes | Create review |
| POST | `/api/v1/places/` | Yes | Create place |

---

## CSS Classes Reference

| Class | Element | Fixed Parameters |
|-------|---------|-----------------|
| `.logo` | Header logo | — |
| `.login-button` | Login link | — |
| `.place-card` | Place card | margin: 20px, padding: 10px, border: 1px solid #ddd, border-radius: 10px |
| `.details-button` | View Details button | — |
| `.place-details` | Details section | — |
| `.place-info` | Info card | border: 1px solid #ddd, border-radius: 10px, padding: 10px |
| `.review-card` | Review card | margin: 20px, padding: 10px, border: 1px solid #ddd, border-radius: 10px |
| `.add-review` | Review form section | — |
| `.form` | Form class | — |

---

## Author

**Valentin Planchon** — [GitHub](https://github.com/ValentinCA28/holbertonschool-hbnb/tree/main) — Holberton School, 2026
