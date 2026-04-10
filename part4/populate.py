"""
populate.py — Seed the HBnB database via the API.

Usage:
    python populate.py

The Flask server must already be running on http://127.0.0.1:5000.
The script:
  1. Inserts the admin user directly in SQLite (required bootstrap).
  2. Logs in as admin to get a JWT token.
  3. Creates regular users, amenities, places, and reviews via the API.

Accounts after seeding:
  admin@hbnb.io          / admin1234   (admin)
  john.doe@hbnb.io       / pass1234    (owner of places)
  jane.smith@hbnb.io     / pass1234    (reviewer)
  robert.brown@hbnb.io   / pass1234    (reviewer)
"""

import os
import sys
import sqlite3
import requests

BASE = "http://127.0.0.1:5000/api/v1"

# Path to the SQLite database used by the Flask app
DB_PATH = os.path.join(
    os.path.dirname(__file__),
    "..", "part3", "hbnb", "instance", "development.db"
)


# ============================================================
# HELPERS
# ============================================================

def post(path, data, token=None):
    """POST JSON to the API. Returns parsed JSON or None on error."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = requests.post(f"{BASE}{path}", json=data, headers=headers)
    if r.status_code not in (200, 201):
        print(f"  ERROR {r.status_code} on POST {path}: {r.text}")
        return None
    return r.json()


def login(email, password):
    """Login and return the JWT access_token, or None."""
    data = post("/auth/login", {"email": email, "password": password})
    if data and "access_token" in data:
        return data["access_token"]
    return None


# ============================================================
# STEP 0 — Bootstrap admin directly in SQLite
# ============================================================

def bootstrap_admin():
    """
    Insert the admin user directly into the database.
    This is needed because POST /users/ requires an admin JWT,
    creating a chicken-and-egg problem for the very first user.
    The password hash below corresponds to 'admin1234' (bcrypt).
    """
    db_path = os.path.normpath(DB_PATH)

    if not os.path.exists(db_path):
        print(f"  ERROR: Database not found at {db_path}")
        print("  Make sure to run: sqlite3 instance/development.db < schema.sql")
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if admin already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", ("admin@hbnb.io",))
    if cursor.fetchone():
        print("  Admin already exists, skipping insert.")
        conn.close()
        return

    # bcrypt hash for 'admin1234'
    admin_hash = "$2b$12$Uu5fTvVL036i9kQnGeAeNOlb5JAvFCFMDKuHfcycD/fpzVtjx7dty"

    cursor.execute(
        """INSERT INTO users (id, first_name, last_name, email, password, is_admin, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)""",
        (
            "36c9050e-ddd3-4c3b-9731-9f487208bbc1",
            "Admin", "HBnB", "admin@hbnb.io",
            admin_hash, True
        )
    )
    conn.commit()
    conn.close()
    print("  Admin user inserted into database.")


# ============================================================
# MAIN
# ============================================================

def main():
    print("=== Seeding HBnB database ===\n")

    # ── Step 0: Bootstrap admin in SQLite ──
    print("[0/6] Bootstrapping admin user...")
    bootstrap_admin()

    # ── Step 1: Login as admin ──
    print("\n[1/6] Logging in as admin...")
    admin_token = login("admin@hbnb.io", "admin1234")
    if not admin_token:
        print("  FATAL: Could not log in as admin. Aborting.")
        sys.exit(1)
    print("  Token obtained.")

    # ── Step 2: Create regular users ──
    print("\n[2/6] Creating users...")
    users_data = [
        {"first_name": "John",   "last_name": "Doe",   "email": "john.doe@hbnb.io",      "password": "pass1234"},
        {"first_name": "Jane",   "last_name": "Smith", "email": "jane.smith@hbnb.io",     "password": "pass1234"},
        {"first_name": "Robert", "last_name": "Brown", "email": "robert.brown@hbnb.io",   "password": "pass1234"},
    ]

    users = {}
    for ud in users_data:
        u = post("/users/", ud, token=admin_token)
        if u:
            users[ud["email"]] = u
            print(f"  Created {ud['email']} — id={u['id']}")
        else:
            print(f"  Skipped {ud['email']} (may already exist)")

    # ── Step 3: Create amenities ──
    print("\n[3/6] Creating amenities...")
    amenity_names = ["WiFi", "Pool", "Air Conditioning"]
    amenities = {}
    for name in amenity_names:
        a = post("/amenities/", {"name": name}, token=admin_token)
        if a:
            amenities[name] = a["id"]
            print(f"  Created '{name}' — id={a['id']}")

    # ── Step 4: Login as each user (needed to create places & reviews) ──
    print("\n[4/6] Logging in as users...")
    john_token   = login("john.doe@hbnb.io", "pass1234")
    jane_token   = login("jane.smith@hbnb.io", "pass1234")
    robert_token = login("robert.brown@hbnb.io", "pass1234")

    if not john_token:
        print("  FATAL: Could not log in as John. Aborting.")
        sys.exit(1)
    print("  All user tokens obtained.")

    # ── Step 5: Create places (owner = token user) ──
    print("\n[5/6] Creating places...")
    wifi_id = amenities.get("WiFi", "")
    pool_id = amenities.get("Pool", "")
    ac_id   = amenities.get("Air Conditioning", "")

    places_data = [
        {
            "title": "Beautiful Beach House",
            "description": "A beautiful beach house with amazing views...",
            "price": 150.0,
            "latitude": 25.7617,
            "longitude": -80.1918,
            "amenities": [wifi_id, pool_id, ac_id],
            "token": john_token,
        },
        {
            "title": "Cozy Cabin",
            "description": "A warm and cozy cabin in the woods, perfect for a weekend getaway.",
            "price": 100.0,
            "latitude": 35.6762,
            "longitude": 139.6503,
            "amenities": [wifi_id],
            "token": john_token,
        },
        {
            "title": "Modern Apartment",
            "description": "A sleek and modern apartment in the heart of the city.",
            "price": 200.0,
            "latitude": 48.8566,
            "longitude": 2.3522,
            "amenities": [wifi_id, ac_id],
            "token": john_token,
        },
    ]

    place_ids = []
    for pd in places_data:
        tk = pd.pop("token")
        p = post("/places/", pd, token=tk)
        if p:
            place_ids.append(p["id"])
            print(f"  Created '{pd['title']}' — id={p['id']}")

    # ── Step 6: Create reviews (reviewer != owner) ──
    print("\n[6/6] Creating reviews...")

    if len(place_ids) >= 1:
        # Jane reviews Beautiful Beach House — 4 stars
        r = post("/reviews/", {
            "text": "Great place to stay!",
            "rating": 4,
            "place_id": place_ids[0],
        }, token=jane_token)
        if r:
            print(f"  Jane reviewed '{places_data[0]['title']}' — 4 stars")

        # Robert reviews Beautiful Beach House — 5 stars
        r = post("/reviews/", {
            "text": "Amazing location and very comfortable.",
            "rating": 5,
            "place_id": place_ids[0],
        }, token=robert_token)
        if r:
            print(f"  Robert reviewed '{places_data[0]['title']}' — 5 stars")

    if len(place_ids) >= 2:
        # Robert reviews Cozy Cabin — 4 stars
        r = post("/reviews/", {
            "text": "Very cozy, exactly as described.",
            "rating": 4,
            "place_id": place_ids[1],
        }, token=robert_token)
        if r:
            print(f"  Robert reviewed '{places_data[1]['title']}' — 4 stars")

    if len(place_ids) >= 3:
        # Jane reviews Modern Apartment — 5 stars
        r = post("/reviews/", {
            "text": "Perfect location, super modern and clean!",
            "rating": 5,
            "place_id": place_ids[2],
        }, token=jane_token)
        if r:
            print(f"  Jane reviewed '{places_data[2]['title']}' — 5 stars")

    # ── Done ──
    print("\n=== Done! Database seeded successfully. ===")
    print()
    print("Accounts:")
    print("  admin@hbnb.io          / admin1234  (admin)")
    print("  john.doe@hbnb.io       / pass1234")
    print("  jane.smith@hbnb.io     / pass1234")
    print("  robert.brown@hbnb.io   / pass1234")


if __name__ == "__main__":
    main()
