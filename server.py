"""
LabSimplifier — Python Backend Server
======================================
Flask + SQLite student database.

Features:
  • Student accounts stored in SQLite (students.db)
  • SHA-256 password hashing (same logic as frontend)
  • Endpoints: /api/signup, /api/login, /api/reset-password, /api/progress (save/load)
  • CORS enabled so the frontend (HTML file) can call these APIs
  • No sensitive data ever returned in responses
  • Authorised ID hashes live in config.py (same as config.js)

HOW TO RUN (local):
  python server.py
  → Server starts at http://127.0.0.1:5000

HOW TO RUN (production on Vercel):
  Vercel supports Python via serverless functions.
  See DEPLOY.md for instructions.

DATABASE:
  students.db is created automatically beside server.py.
  Tables:
    students  — one row per registered student
    progress  — one row per student per experiment
    feedback  — user support feedback
"""

import hashlib
import json
import os
import re
import sqlite3
import time
from datetime import datetime
from functools import wraps

from flask import Flask, g, jsonify, request, send_from_directory
from flask_cors import CORS

# ── Configuration ────────────────────────────────────────────────────────────

# Authorised GITAM ID hashes fallback list (matches config.js)
# When server runs, it ALSO automatically parses config.js so you only ever have to edit config.js!
DEFAULT_AUTHORISED_ID_HASHES = [
    "98b2652a25b8f921a01c3256feade0a9f571deb29ad3d2e7784c0552b9b38e60",  # Team member 1
    "f4f58ca60d3224150a9df80650a97336f3d3b7df9448241e961a524921377d1b",  # Team member 2
    "bc4897afb4e0d85adb91eb47b21c827f1755a7492921a904f2c749214d37af15",  # Team member 3
    "b8db508700787b0a7df9caa7df013a3fc5a9c2bae207a9f7fe19d17a45779ac7",  # Team member 4
    "c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646",  # Demo ID: 1234567890
    "254aa248acb47dd654ca3ea53f48c2c26d641d23d7e2e93a1ec56258df7674c4",  # Demo ID: 12345678901
]

def get_authorised_hashes():
    """
    Read authorised hashes from config.js dynamically.
    This guarantees that whenever you add new teammate IDs to config.js,
    the Python backend instantly recognizes them without needing code changes!
    """
    hashes = set(DEFAULT_AUTHORISED_ID_HASHES)
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.js")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                content = f.read()
            found = re.findall(r'["\']([a-f0-9]{64})["\']', content, re.IGNORECASE)
            for h in found:
                hashes.add(h.lower())
        except Exception as e:
            print(f"[WARN] Failed to read config.js: {e}")
    return hashes

# Database file path (same directory as this script)
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "students.db")

# Secret key for session tokens (change this before production)
SECRET_KEY = "labsimplifier-dev-secret-2026"

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for both local & hosted frontend

# ── Database Setup ────────────────────────────────────────────────────────────

def get_db():
    """Get a database connection scoped to the current request."""
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH, check_same_thread=False)
        g.db.row_factory = sqlite3.Row  # rows behave like dicts
    return g.db


@app.teardown_appcontext
def close_db(error):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create all tables if they do not exist."""
    db = sqlite3.connect(DB_PATH)
    db.executescript("""
        CREATE TABLE IF NOT EXISTS students (
            id_hash       TEXT PRIMARY KEY,      -- SHA-256 of GITAM ID
            full_name     TEXT NOT NULL,
            password_hash TEXT NOT NULL,         -- SHA-256 of "id:password"
            created_at    TEXT NOT NULL,
            last_login    TEXT
        );

        CREATE TABLE IF NOT EXISTS progress (
            id_hash         TEXT NOT NULL,       -- FK → students.id_hash
            experiment_id   TEXT NOT NULL,       -- e.g. "exp-11"
            current_step    INTEGER DEFAULT 1,
            readings_json   TEXT DEFAULT '[]',   -- JSON array of recorded readings
            quiz_answers    TEXT DEFAULT '{}',   -- JSON object {qIndex: optIndex}
            quiz_score      INTEGER,
            quiz_completed  INTEGER DEFAULT 0,   -- 0 = false, 1 = true
            viva_index      INTEGER DEFAULT 0,
            exp_completed   INTEGER DEFAULT 0,
            mean_lambda     REAL,
            mean_error      REAL,
            completed_at    TEXT,
            updated_at      TEXT,
            PRIMARY KEY (id_hash, experiment_id)
        );

        CREATE TABLE IF NOT EXISTS feedback (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            id_hash       TEXT,                  -- NULL allowed for anonymous
            message       TEXT NOT NULL,
            submitted_at  TEXT NOT NULL
        );
    """)
    db.commit()
    db.close()
    print(f"[DB] Database initialised at: {DB_PATH}")


# ── Helpers ───────────────────────────────────────────────────────────────────

def sha256(text: str) -> str:
    """Return lowercase hex SHA-256 of text."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def password_hash(id_raw: str, password: str) -> str:
    """Hash a password using the same scheme as the frontend: SHA-256(id + ':' + password)."""
    return sha256(f"{id_raw}:{password}")


def now_iso() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def ok(data: dict = None, message: str = "OK"):
    """Return a standard JSON success response."""
    body = {"success": True, "message": message}
    if data:
        body.update(data)
    return jsonify(body), 200


def err(message: str, code: int = 400):
    """Return a standard JSON error response."""
    return jsonify({"success": False, "error": message}), code


def require_id_hash(f):
    """Decorator: validates that the request body contains a known id_hash."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        body = request.get_json(silent=True) or {}
        ih = body.get("id_hash", "").strip().lower()
        if len(ih) != 64 or not all(c in "0123456789abcdef" for c in ih):
            return err("Invalid id_hash format.")
        if ih not in get_authorised_hashes():
            return err("Registration ID not authorised for this portal.", 403)
        return f(*args, id_hash=ih, body=body, **kwargs)
    return wrapper


# ── Auth Endpoints ────────────────────────────────────────────────────────────

@app.route("/api/signup", methods=["POST"])
@require_id_hash
def signup(id_hash, body):
    """
    Create a new student account.
    Body: { id_hash, full_name, password_hash_client }
    Note: frontend sends SHA-256("id:password") — we store that directly.
    """
    full_name = (body.get("full_name") or "").strip()
    pw_hash   = (body.get("password_hash_client") or "").strip().lower()

    if not full_name or len(full_name) < 2:
        return err("Full name must be at least 2 characters.")
    if len(pw_hash) != 64:
        return err("Invalid password hash from client.")

    db = get_db()
    existing = db.execute(
        "SELECT id_hash FROM students WHERE id_hash = ?", (id_hash,)
    ).fetchone()

    if existing:
        return err("An account already exists with this Registration ID. Please log in.", 409)

    db.execute(
        "INSERT INTO students (id_hash, full_name, password_hash, created_at) VALUES (?, ?, ?, ?)",
        (id_hash, full_name, pw_hash, now_iso())
    )
    db.commit()

    return ok({"name": full_name}, "Account created successfully.")


@app.route("/api/login", methods=["POST"])
@require_id_hash
def login(id_hash, body):
    """
    Authenticate a student.
    Body: { id_hash, password_hash_client }
    Returns: { name }
    """
    pw_hash = (body.get("password_hash_client") or "").strip().lower()

    if len(pw_hash) != 64:
        return err("Invalid password hash.")

    db = get_db()
    student = db.execute(
        "SELECT full_name, password_hash FROM students WHERE id_hash = ?", (id_hash,)
    ).fetchone()

    if not student:
        return err("No account found with this ID. Please sign up first.", 404)

    if student["password_hash"] != pw_hash:
        return err("Incorrect password. Please try again.", 401)

    # Update last login timestamp
    db.execute(
        "UPDATE students SET last_login = ? WHERE id_hash = ?",
        (now_iso(), id_hash)
    )
    db.commit()

    return ok({"name": student["full_name"]}, "Login successful.")


@app.route("/api/reset-password", methods=["POST"])
@require_id_hash
def reset_password(id_hash, body):
    """
    Reset a student's password after verifying their name.
    Body: { id_hash, full_name, new_password_hash_client }
    """
    full_name    = (body.get("full_name") or "").strip()
    new_pw_hash  = (body.get("new_password_hash_client") or "").strip().lower()

    if not full_name or len(new_pw_hash) != 64:
        return err("Name and new password hash are required.")

    db = get_db()
    student = db.execute(
        "SELECT full_name FROM students WHERE id_hash = ?", (id_hash,)
    ).fetchone()

    if not student:
        return err("No account found with this Registration ID.", 404)

    if student["full_name"].lower() != full_name.lower():
        return err("Name does not match account records.", 403)

    db.execute(
        "UPDATE students SET password_hash = ? WHERE id_hash = ?",
        (new_pw_hash, id_hash)
    )
    db.commit()

    return ok(message="Password reset successfully. Please log in.")


# ── Progress Endpoints ────────────────────────────────────────────────────────

@app.route("/api/progress/<experiment_id>", methods=["GET"])
def get_progress(experiment_id):
    """
    Load a student's saved progress for an experiment.
    Query param: id_hash
    """
    id_hash = request.args.get("id_hash", "").strip().lower()
    if len(id_hash) != 64:
        return err("Invalid id_hash.")

    db = get_db()
    row = db.execute(
        "SELECT * FROM progress WHERE id_hash = ? AND experiment_id = ?",
        (id_hash, experiment_id)
    ).fetchone()

    if not row:
        # Return default empty progress
        return ok({"progress": None}, "No saved progress.")

    return ok({
        "progress": {
            "currentStep":       row["current_step"],
            "readings":          json.loads(row["readings_json"] or "[]"),
            "quizAnswers":       json.loads(row["quiz_answers"] or "{}"),
            "quizScore":         row["quiz_score"],
            "quizCompleted":     bool(row["quiz_completed"]),
            "vivaIndex":         row["viva_index"],
            "experimentCompleted": bool(row["exp_completed"]),
            "meanLambda":        row["mean_lambda"],
            "meanError":         row["mean_error"],
            "completedAt":       row["completed_at"],
        }
    })


@app.route("/api/progress/<experiment_id>", methods=["POST"])
def save_progress(experiment_id):
    """
    Save or update a student's progress.
    Body: { id_hash, progress: { currentStep, readings, quizAnswers, ... } }
    """
    body    = request.get_json(silent=True) or {}
    id_hash = (body.get("id_hash") or "").strip().lower()
    p       = body.get("progress") or {}

    if len(id_hash) != 64:
        return err("Invalid id_hash.")

    db = get_db()

    # Upsert
    db.execute("""
        INSERT INTO progress
            (id_hash, experiment_id, current_step, readings_json, quiz_answers,
             quiz_score, quiz_completed, viva_index, exp_completed,
             mean_lambda, mean_error, completed_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id_hash, experiment_id) DO UPDATE SET
            current_step   = excluded.current_step,
            readings_json  = excluded.readings_json,
            quiz_answers   = excluded.quiz_answers,
            quiz_score     = excluded.quiz_score,
            quiz_completed = excluded.quiz_completed,
            viva_index     = excluded.viva_index,
            exp_completed  = excluded.exp_completed,
            mean_lambda    = excluded.mean_lambda,
            mean_error     = excluded.mean_error,
            completed_at   = excluded.completed_at,
            updated_at     = excluded.updated_at
    """, (
        id_hash,
        experiment_id,
        p.get("currentStep", 1),
        json.dumps(p.get("readings", [])),
        json.dumps(p.get("quizAnswers", {})),
        p.get("quizScore"),
        1 if p.get("quizCompleted") else 0,
        p.get("vivaIndex", 0),
        1 if p.get("experimentCompleted") else 0,
        p.get("meanLambda"),
        p.get("meanError"),
        p.get("completedAt"),
        now_iso()
    ))
    db.commit()

    return ok(message="Progress saved.")


@app.route("/api/progress/<experiment_id>/reset", methods=["POST"])
def reset_progress(experiment_id):
    """
    Reset a student's progress for an experiment (Practice Again).
    Body: { id_hash }
    """
    body    = request.get_json(silent=True) or {}
    id_hash = (body.get("id_hash") or "").strip().lower()

    if len(id_hash) != 64:
        return err("Invalid id_hash.")

    db = get_db()
    db.execute(
        "DELETE FROM progress WHERE id_hash = ? AND experiment_id = ?",
        (id_hash, experiment_id)
    )
    db.commit()

    return ok(message="Progress reset. Ready to practice again.")


# ── Feedback Endpoint ─────────────────────────────────────────────────────────

@app.route("/api/feedback", methods=["POST"])
def submit_feedback():
    """
    Store user feedback.
    Body: { id_hash (optional), message }
    """
    body    = request.get_json(silent=True) or {}
    id_hash = (body.get("id_hash") or "").strip().lower() or None
    message = (body.get("message") or "").strip()

    if not message:
        return err("Feedback message is required.")

    # Validate optional id_hash
    if id_hash and len(id_hash) != 64:
        id_hash = None

    db = get_db()
    db.execute(
        "INSERT INTO feedback (id_hash, message, submitted_at) VALUES (?, ?, ?)",
        (id_hash, message[:2000], now_iso())
    )
    db.commit()

    return ok(message="Feedback submitted. Thank you!")


# ── Admin / Dev Endpoints (remove before public launch) ──────────────────────

@app.route("/api/admin/students", methods=["GET"])
def list_students():
    """
    [DEV ONLY] List all registered students (no passwords returned).
    Remove or add authentication before any public deployment.
    """
    db = get_db()
    rows = db.execute(
        "SELECT id_hash, full_name, created_at, last_login FROM students ORDER BY created_at DESC"
    ).fetchall()

    students = []
    for r in rows:
        students.append({
            "id_hash_preview": r["id_hash"][:8] + "...",  # Only first 8 chars for safety
            "name":            r["full_name"],
            "created_at":      r["created_at"],
            "last_login":      r["last_login"],
        })

    return ok({"count": len(students), "students": students})


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return ok({"server": "LabSimplifier API", "version": "1.0", "db": DB_PATH})


# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    print("=" * 60)
    print("  LabSimplifier Python Server")
    print("  Student database: students.db")
    print("  Running at: http://127.0.0.1:5000")
    print("  Health check: http://127.0.0.1:5000/api/health")
    print("=" * 60)
    app.run(host="127.0.0.1", port=5000, debug=True)
