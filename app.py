from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask, render_template, request, jsonify
from pathlib import Path

from services.data_service import load_time_series, load_expenses, get_available_profiles
from services.finance_engine import build_snapshot
from services.summary_engine import build_summary
from services.llm_service import llm_simulation

app = Flask(__name__)
DATA_DIR = Path("data")


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/profiles", methods=["GET"])
def api_profiles():
    """Get list of available profiles."""
    profiles = get_available_profiles(DATA_DIR)
    return jsonify({"profiles": profiles})


@app.route("/api/snapshot", methods=["POST"])
def api_snapshot():
    payload = request.get_json(force=True) or {}
    period = payload.get("period", "6M")
    question = payload.get("question", "")
    profile_id = payload.get("profile", "james_thompson")

    ts = load_time_series(DATA_DIR, profile_id)
    expenses_cfg = load_expenses(DATA_DIR, profile_id)
    snap = build_snapshot(period, ts, expenses_cfg)

    summary = build_summary(snap, question)
    return jsonify({"snapshot": snap, "summary": summary})


@app.route("/api/simulate", methods=["POST"])
def api_simulate():
    payload = request.get_json(force=True) or {}
    period = payload.get("period", "6M")
    question = (payload.get("question") or "").strip()
    profile_id = payload.get("profile", "james_thompson")

    if not question:
        return jsonify({
            "heading": "",
            "lines": ["Type a scenario question first (e.g. 'retire at 65')."],
            "enabled": True
        })

    ts = load_time_series(DATA_DIR, profile_id)
    expenses_cfg = load_expenses(DATA_DIR, profile_id)
    snap = build_snapshot(period, ts, expenses_cfg)

    facts = {
        "period": snap["period"],
        "salary_monthly": snap["salary_monthly"],
        "expenses_monthly": snap["monthly_expense_total"],
        "savings_monthly": snap["savings_est_monthly"],
        "resilience_pct": snap["resilience"],
        "liquidity_pct": snap["liquidity"],
        "top_expenses": [{"label": e["label"], "monthly": e["monthly"]} for e in snap["expenses"][:5]],
    }

    text = llm_simulation(question, facts)

    if not text:
        # Key may exist but call may still fail (timeout/network/etc.)
        key_exists = bool(os.getenv("OPENAI_API_KEY")) or (Path("secrets") / "openai_key.txt").exists()
        if key_exists:
            return jsonify({
                "heading": "Simulation (LLM call failed)",
                "lines": [
                    "Key is present, but the LLM call did not return a response (timeout/network).",
                    "Try again, or check your internet connection."
                ],
                "enabled": False
            })
        return jsonify({
            "heading": "Simulation (LLM not enabled)",
            "lines": [
                "No key found. Put it in secrets/openai_key.txt (one line) or set OPENAI_API_KEY."
            ],
            "enabled": False
        })

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    heading = lines[0] if lines else "Simulation result"
    body = lines[1:] if len(lines) > 1 else ["No details returned."]

    return jsonify({"heading": heading, "lines": body, "enabled": True})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
