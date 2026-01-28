import re
from services.llm_service import llm_summary_if_key

def _extract_age(text: str):
    m = re.search(r"\b(\d{2})\b", text or "")
    return int(m.group(1)) if m else None

def build_summary(snapshot, question):
    period = snapshot["period"]
    salary_m = float(snapshot["salary_monthly"])
    spend_m = float(snapshot["monthly_expense_total"])
    savings_m = float(snapshot["savings_est_monthly"])
    res = float(snapshot["resilience"])
    liq = float(snapshot["liquidity"])

    q = (question or "").strip().lower()

    # Facts block for LLM (if key exists) - NEVER allow invented numbers
    facts = {
        "period": period,
        "salary_monthly": salary_m,
        "expenses_monthly": spend_m,
        "savings_monthly": savings_m,
        "resilience_pct": res,
        "liquidity_pct": liq,
        "top_expenses": [{"label": e["label"], "monthly": e["monthly"]} for e in snapshot["expenses"][:5]],
        "flow_grain": snapshot["flow"]["grain"]
    }

    # Optional LLM summary (only if OPENAI_API_KEY set)
    llm_text = llm_summary_if_key(facts)
    if llm_text:
        return {
            "headline": "GenAI summary (facts-only)",
            "bullets": [llm_text],
            "note": "Generated from provided facts. Not advice."
        }

    # Deterministic base summary
    headline = f"{period} snapshot: estimated savings £{savings_m:.0f}/month."
    bullets = [
        f"Income: £{salary_m:.0f}/month | Expenses: £{spend_m:.0f}/month",
        f"Resilience: {res:.0f}% | Liquidity: {liq:.0f}%",
        f"Top expense: {snapshot['expenses'][0]['label']} (£{snapshot['expenses'][0]['monthly']:.0f}/month)" if snapshot["expenses"] else "No expense categories loaded."
    ]

    # ---- Simulation logic (POC but meaningful) ----
    # We estimate "buffers" from scores for demo:
    # - liquidity buffer: up to ~3 months of expenses scaled by liquidity%
    # - resilience buffer: up to ~6 months of expenses scaled by resilience%
    liquidity_buffer = (liq/100.0) * (3.0 * spend_m)
    resilience_buffer = (res/100.0) * (6.0 * spend_m)

    if "holiday" in q or "vacation" in q:
        # spend ceiling: liquidity buffer minus 1 month safety
        safety = 1.0 * spend_m
        ceiling = max(liquidity_buffer - safety, 0)
        bullets.append(f"Holiday scenario: spend ceiling ≈ £{ceiling:.0f} (keeps ~1 month safety buffer).")

    if "retire" in q:
        age = _extract_age(q) or 55
        # without user's current age/assets, we frame it as savings-rate readiness
        target_savings_rate = 0.35  # conservative POC assumption
        required = target_savings_rate * salary_m
        gap = required - savings_m
        if gap <= 0:
            bullets.append(f"Retire at {age}: savings rate looks strong vs a {int(target_savings_rate*100)}% target (model).")
        else:
            bullets.append(f"Retire at {age}: needs ~£{gap:.0f}/month extra savings to reach a {int(target_savings_rate*100)}% target (model).")

    if q and ("holiday" not in q) and ("vacation" not in q) and ("retire" not in q):
        bullets.append("Try: 'retire at 55' or 'holiday budget'.")

    return {"headline": headline, "bullets": bullets, "note": "POC output. Not financial advice."}
