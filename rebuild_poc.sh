#!/bin/bash
set -e

mkdir -p data services templates static

# ---------- DATA ----------
cat > data/time_series.json <<'JSON'
{
  "6M": {
    "labels": ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
    "points": [105, 109, 108, 112, 115, 118],
    "metrics": {"resilience": 81, "liq": 75, "edu_gap": 11800, "holiday": 1200, "med": 400, "salary": 6500}
  },
  "1Y": {
    "labels": ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
    "points": [95, 97, 101, 100, 103, 106, 108, 109, 111, 113, 116, 118],
    "metrics": {"resilience": 79, "liq": 73, "edu_gap": 11800, "holiday": 1200, "med": 400, "salary": 6500}
  },
  "3Y": {
    "labels": ["2023", "2024", "2025", "2026"],
    "points": [62, 78, 98, 118],
    "metrics": {"resilience": 76, "liq": 70, "edu_gap": 11800, "holiday": 1200, "med": 400, "salary": 6500}
  },
  "5Y": {
    "labels": ["2022", "2023", "2024", "2025", "2026"],
    "points": [48, 62, 78, 98, 118],
    "metrics": {"resilience": 74, "liq": 68, "edu_gap": 11800, "holiday": 1200, "med": 400, "salary": 6500}
  }
}
JSON

cat > data/expenses.json <<'JSON'
{
  "currency": "EUR",
  "categories": [
    {"key":"kids","label":"Kids Education","monthly":300},
    {"key":"health","label":"Healthcare","monthly":160},
    {"key":"holiday","label":"Holiday","monthly":180},
    {"key":"rent","label":"Mortgage / Rent","monthly":1450},
    {"key":"transport","label":"Cab / Transport","monthly":220},
    {"key":"grocery","label":"Grocery","monthly":520},
    {"key":"electricity","label":"Electricity","monthly":120},
    {"key":"utilities","label":"Utilities","monthly":110},
    {"key":"other","label":"Other","monthly":400}
  ],
  "goal_pots": [
    {"key":"edu_gap","label":"Education Gap","target":11800,"current":0},
    {"key":"holiday_fund","label":"Holiday Fund","target":2500,"current":800},
    {"key":"medical","label":"Medical Reserve","target":1500,"current":250}
  ]
}
JSON

# ---------- SERVICES ----------
cat > services/data_service.py <<'PY'
import json
from pathlib import Path

def load_json(path: Path):
    with open(path, "r") as f:
        return json.load(f)

def load_time_series(data_dir: Path):
    return load_json(data_dir / "time_series.json")

def load_expenses(data_dir: Path):
    return load_json(data_dir / "expenses.json")
PY

cat > services/finance_engine.py <<'PY'
def build_snapshot(period, ts, expenses_cfg):
    if period not in ts:
        raise ValueError(f"Unknown period: {period}")

    block = ts[period]
    labels = block.get("labels", [])
    points = block.get("points", [])
    metrics = block.get("metrics", {}) or {}

    salary_monthly = metrics.get("salary", 0)
    resilience = metrics.get("resilience", 0)
    liquidity = metrics.get("liq", 0)

    expenses = expenses_cfg.get("categories", [])
    monthly_expense_total = sum(e.get("monthly", 0) for e in expenses)

    denom = monthly_expense_total if monthly_expense_total > 0 else 1
    exp_out = []
    for e in expenses:
        m = e.get("monthly", 0)
        exp_out.append({
            "key": e.get("key", ""),
            "label": e.get("label", ""),
            "monthly": m,
            "pct": round((m / denom) * 100, 1)
        })
    exp_out.sort(key=lambda x: x["monthly"], reverse=True)

    # Flow bars:
    # 6M/1Y -> month-wise
    # 3Y/5Y -> year-wise
    if period in ["6M", "1Y"]:
        income = [salary_monthly for _ in labels]
        expense = [monthly_expense_total for _ in labels]
        savings = [max(salary_monthly - monthly_expense_total, 0) for _ in labels]
        flow_grain = "monthly"
    else:
        income = [salary_monthly * 12 for _ in labels]
        expense = [monthly_expense_total * 12 for _ in labels]
        savings = [max((salary_monthly - monthly_expense_total) * 12, 0) for _ in labels]
        flow_grain = "yearly"

    return {
        "period": period,
        "labels": labels,
        "wealth": points,
        "metrics": metrics,
        "salary_monthly": salary_monthly,
        "resilience": resilience,
        "liquidity": liquidity,
        "expenses": exp_out,
        "monthly_expense_total": monthly_expense_total,
        "savings_est_monthly": max(salary_monthly - monthly_expense_total, 0),
        "flow": {"grain": flow_grain, "labels": labels, "income": income, "expense": expense, "savings": savings}
    }
PY

cat > services/llm_service.py <<'PY'
import os
import json
import urllib.request
from typing import Optional

def llm_summary_if_key(facts: dict) -> Optional[str]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        prompt = (
            "Summarize ONLY the provided facts. Do NOT invent numbers. Do NOT give advice. "
            "Output 1 headline + 3 bullets.\n\n"
            f"FACTS(JSON): {json.dumps(facts)}"
        )

        body = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You summarize financial dashboards safely and conservatively."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2
        }

        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=12) as resp:
            out = json.loads(resp.read().decode("utf-8"))
            return out["choices"][0]["message"]["content"].strip()

    except Exception:
        return None
PY

cat > services/summary_engine.py <<'PY'
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

    llm_text = llm_summary_if_key(facts)
    if llm_text:
        return {"headline": "GenAI summary (facts-only)", "bullets": [llm_text], "note": "Generated from provided facts. Not advice."}

    headline = f"{period} snapshot: estimated savings €{savings_m:.0f}/month."
    bullets = [
        f"Income: €{salary_m:.0f}/month | Expenses: €{spend_m:.0f}/month",
        f"Resilience: {res:.0f}% | Liquidity: {liq:.0f}%",
        f"Top expense: {snapshot['expenses'][0]['label']} (€{snapshot['expenses'][0]['monthly']:.0f}/month)" if snapshot["expenses"] else "No expense categories loaded."
    ]

    liquidity_buffer = (liq/100.0) * (3.0 * spend_m)

    if "holiday" in q or "vacation" in q:
        safety = 1.0 * spend_m
        ceiling = max(liquidity_buffer - safety, 0)
        bullets.append(f"Holiday scenario: spend ceiling ≈ €{ceiling:.0f} (keeps ~1 month safety buffer).")

    if "retire" in q:
        age = _extract_age(q) or 55
        target_rate = 0.35
        required = target_rate * salary_m
        gap = required - savings_m
        if gap <= 0:
            bullets.append(f"Retire at {age}: savings rate looks strong vs a {int(target_rate*100)}% target (model).")
        else:
            bullets.append(f"Retire at {age}: needs ~€{gap:.0f}/month extra savings to reach a {int(target_rate*100)}% target (model).")

    if q and ("holiday" not in q) and ("vacation" not in q) and ("retire" not in q):
        bullets.append("Try: 'retire at 55' or 'holiday budget'.")

    return {"headline": headline, "bullets": bullets, "note": "POC output. Not financial advice."}
PY

# ---------- APP ----------
cat > app.py <<'PY'
from flask import Flask, render_template, request, jsonify
from pathlib import Path

from services.data_service import load_time_series, load_expenses
from services.finance_engine import build_snapshot
from services.summary_engine import build_summary

app = Flask(__name__)
DATA_DIR = Path("data")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/snapshot", methods=["POST"])
def api_snapshot():
    payload = request.get_json(force=True) or {}
    period = payload.get("period", "6M")
    question = payload.get("question", "")

    ts = load_time_series(DATA_DIR)
    expenses_cfg = load_expenses(DATA_DIR)

    snap = build_snapshot(period, ts, expenses_cfg)
    summary = build_summary(snap, question)
    return jsonify({"snapshot": snap, "summary": summary})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
PY

# ---------- UI ----------
cat > templates/index.html <<'HTML'
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Lloyds Finance Snapshot POC</title>
  <link rel="stylesheet" href="/static/app.css" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div class="app">
    <header class="topbar">
      <div class="brand">Lloyds Intelligence</div>
      <div class="tabs">
        <button class="tab active" data-period="6M">6M</button>
        <button class="tab" data-period="1Y">1Y</button>
        <button class="tab" data-period="3Y">3Y</button>
        <button class="tab" data-period="5Y">5Y</button>
      </div>
    </header>

    <main class="grid">
      <section class="card" id="expensesCard">
        <div class="cardTitle">Expenses by category</div>
        <div class="subtle" id="expTotal"></div>
        <div class="list" id="expensesList"></div>
      </section>

      <section class="card" id="centerCard">
        <div class="cardTitle">Earning • Spending • Saving</div>

        <div class="miniGrid">
          <div class="pill">
            <div class="pillLabel">Salary (monthly)</div>
            <div class="pillValue" id="salary"></div>
          </div>
          <div class="pill">
            <div class="pillLabel">Estimated savings</div>
            <div class="pillValue" id="savings"></div>
          </div>
        </div>

        <div class="chartBox">
          <div class="chartTitle" id="flowTitle">Flow (Income vs Expense vs Savings)</div>
          <canvas id="flowChart" height="140"></canvas>
        </div>

        <div class="chartBox">
          <div class="chartTitle">Wealth trajectory (index points)</div>
          <canvas id="wealthChart" height="120"></canvas>
        </div>

        <div class="simBox">
          <div class="simTitle">Scenario simulation</div>
          <div class="simRow">
            <input id="question" placeholder="Try: I want to retire at 55 / holiday budget" />
            <button id="simulateBtn">SIMULATE</button>
          </div>
        </div>
      </section>

      <section class="card" id="metricsCard">
        <div class="cardTitle">Resilience & liquidity</div>

        <div class="metric">
          <div class="metricLabel">Resilience</div>
          <div class="bar"><div class="barFill" id="resBar"></div></div>
          <div class="metricValue" id="res"></div>
        </div>

        <div class="metric">
          <div class="metricLabel">Liquidity</div>
          <div class="bar"><div class="barFill" id="liqBar"></div></div>
          <div class="metricValue" id="liq"></div>
        </div>

        <div class="summaryBox">
          <div class="summaryTitle">Insight summary</div>
          <div class="summaryHeadline" id="sumHeadline"></div>
          <ul class="summaryBullets" id="sumBullets"></ul>
          <div class="summaryNote" id="sumNote"></div>
        </div>
      </section>
    </main>
  </div>

  <script src="/static/app.js"></script>
</body>
</html>
HTML

# Lloyds theme: white + light green + dark green
cat > static/app.css <<'CSS'
:root{
  --bg:#ffffff;
  --card:#f5faf7;
  --text:#0b1f1a;
  --muted:#4b6b61;
  --line:#dbe7e3;
  --accent:#006a4d;     /* Lloyds dark green */
  --accent2:#2abf88;    /* Lloyds light green */
  --warn:#d97706;
  --grid:rgba(219,231,227,.9);
}

*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
  background:var(--bg);
  color:var(--text);
  overflow:hidden; /* no page scroll */
}

.app{height:100vh; display:flex; flex-direction:column}

.topbar{
  height:64px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 16px;
  border-bottom:1px solid var(--line);
  background:linear-gradient(180deg, #ffffff, #fbfdfc);
}
.brand{font-weight:900; letter-spacing:.2px; color:var(--accent)}

.tabs{display:flex; gap:8px}
.tab{
  border:1px solid var(--line);
  background:#fff;
  color:var(--text);
  padding:8px 10px;
  border-radius:12px;
  cursor:pointer;
  font-weight:800;
}
.tab.active{
  border-color:var(--accent);
  box-shadow:0 0 0 2px rgba(0,106,77,.12) inset;
  color:var(--accent);
}

.grid{
  height:calc(100vh - 64px);
  display:grid;
  grid-template-columns: 1.1fr 1.8fr 1.1fr;
  gap:12px;
  padding:12px;
}

.card{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:18px;
  padding:14px;
  overflow:hidden;
  box-shadow:0 10px 22px rgba(0,0,0,.08);
}

.cardTitle{font-weight:900; margin-bottom:8px}
.subtle{color:var(--muted); font-size:12px; margin-bottom:8px}

.list{
  height:calc(100% - 60px);
  overflow:auto;
  padding-right:6px;
}

.row{
  padding:10px;
  border:1px solid var(--line);
  border-radius:14px;
  margin-bottom:10px;
  background:#ffffff;
}
.rowTop{display:flex; justify-content:space-between; font-weight:900}
.rowSub{display:flex; justify-content:space-between; margin-top:6px; color:var(--muted); font-size:12px}
.miniBar{height:6px; background:#eef6f2; border:1px solid var(--line); border-radius:999px; margin-top:8px; overflow:hidden}
.miniFill{height:100%}

.miniGrid{display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:8px 0 12px}
.pill{
  border:1px solid var(--line);
  border-radius:14px;
  padding:10px;
  background:#ffffff;
}
.pillLabel{color:var(--muted); font-size:12px}
.pillValue{font-size:18px; font-weight:950; margin-top:6px; color:var(--accent)}

.chartBox{
  height:260px;
  display:flex;
  flex-direction:column;
  border:1px solid var(--line);
  border-radius:14px;
  padding:12px;
  margin-bottom:12px;
  background:#ffffff;
}
.chartTitle{color:var(--muted); font-size:12px; margin-bottom:10px}
.chartBox canvas{flex:1; min-height:220px}

.simBox{
  border:1px solid var(--line);
  border-radius:14px;
  padding:12px;
  background:#ffffff;
}
.simTitle{font-weight:900; margin-bottom:10px}
.simRow{display:flex; gap:10px}
input{
  flex:1;
  background:#ffffff;
  border:1px solid var(--line);
  border-radius:12px;
  padding:10px 12px;
  color:var(--text);
  outline:none;
}
button#simulateBtn{
  background:var(--accent);
  color:#fff;
  border:0;
  border-radius:12px;
  padding:10px 14px;
  font-weight:950;
  cursor:pointer;
}

.metric{margin-top:10px}
.metricLabel{color:var(--muted); font-size:12px; margin-bottom:8px}
.bar{
  height:10px;
  background:#eef6f2;
  border:1px solid var(--line);
  border-radius:999px;
  overflow:hidden;
}
.barFill{height:100%; width:0%}
.metricValue{margin-top:8px; font-weight:950; color:var(--accent)}

.summaryBox{
  margin-top:12px;
  border:1px solid var(--line);
  border-radius:14px;
  padding:12px;
  background:#ffffff;
}
.summaryTitle{color:var(--muted); font-size:12px; margin-bottom:8px}
.summaryHeadline{font-weight:950; margin-bottom:8px}
.summaryBullets{margin:0; padding-left:16px}
.summaryBullets li{margin:6px 0}
.summaryNote{margin-top:10px; color:var(--muted); font-size:11px}
CSS

cat > static/app.js <<'JS'
let period = "6M";
let flowChart = null;
let wealthChart = null;

function eur(n){
  try { return "€" + Number(n).toLocaleString(undefined,{maximumFractionDigits:0}); }
  catch(e){ return "€" + n; }
}

function cssVar(name, fallback){
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const COLORS = {
  income: cssVar("--accent", "#006a4d"),
  expense: cssVar("--warn", "#d97706"),
  savings: cssVar("--accent2", "#2abf88"),
  grid: cssVar("--grid", "rgba(219,231,227,.9)"),
  muted: cssVar("--muted", "#4b6b61"),
  text: cssVar("--text", "#0b1f1a")
};

const NO_ANIM = { animation: false, responsiveAnimationDuration: 0 };

function setBars(res, liq){
  document.getElementById("res").textContent = `${res}%`;
  document.getElementById("liq").textContent = `${liq}%`;
  document.getElementById("resBar").style.width = `${res}%`;
  document.getElementById("liqBar").style.width = `${liq}%`;
  document.getElementById("resBar").style.background = COLORS.income;
  document.getElementById("liqBar").style.background = COLORS.income;
}

function renderExpenses(expenses, total){
  document.getElementById("expTotal").textContent = `Estimated monthly expenses: ${eur(total)}`;
  const list = document.getElementById("expensesList");
  list.innerHTML = "";
  expenses.forEach(e=>{
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div class="rowTop">
        <div>${e.label}</div>
        <div>${eur(e.monthly)}</div>
      </div>
      <div class="rowSub">
        <div>Share of expenses</div>
        <div>${e.pct}%</div>
      </div>
      <div class="miniBar">
        <div class="miniFill" style="width:${e.pct}%; background:${COLORS.income}"></div>
      </div>
    `;
    list.appendChild(row);
  });
}

function renderSummary(summary){
  document.getElementById("sumHeadline").textContent = summary.headline || "";
  const ul = document.getElementById("sumBullets");
  ul.innerHTML = "";
  (summary.bullets || []).forEach(b=>{
    const li = document.createElement("li");
    li.textContent = b;
    ul.appendChild(li);
  });
  document.getElementById("sumNote").textContent = summary.note || "";
}

function minMaxPad(values){
  const nums = (values || []).map(Number).filter(v=>isFinite(v));
  if (!nums.length) return {min: 0, max: 100};
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = (max - min) || 1;
  return { min: min - range * 0.15, max: max + range * 0.15 };
}

function drawFlow(flow){
  const title = document.getElementById("flowTitle");
  title.textContent =
    flow.grain === "monthly"
      ? "Flow (month-wise): Income vs Expense vs Savings"
      : "Flow (year-wise): Income vs Expense vs Savings";

  const ctx = document.getElementById("flowChart").getContext("2d");
  if (flowChart) flowChart.destroy();

  const all = [...(flow.income||[]), ...(flow.expense||[]), ...(flow.savings||[])];
  const mm = minMaxPad(all);
  const yMin = 0;
  const yMax = Math.max(mm.max, 1);

  flowChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: flow.labels,
      datasets: [
        { label: "Income",  data: flow.income,  backgroundColor: COLORS.income, borderRadius: 6 },
        { label: "Expense", data: flow.expense, backgroundColor: COLORS.expense, borderRadius: 6 },
        { label: "Savings", data: flow.savings, backgroundColor: COLORS.savings, borderRadius: 6 }
      ]
    },
    options: {
      ...NO_ANIM,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: COLORS.text } },
        tooltip: { callbacks: { label: (ctx)=> `${ctx.dataset.label}: ${eur(ctx.raw)}` } }
      },
      scales: {
        x: { ticks: { color: COLORS.muted }, grid: { color: COLORS.grid } },
        y: { min: yMin, max: yMax, ticks: { color: COLORS.muted }, grid: { color: COLORS.grid } }
      }
    }
  });
}

function drawWealth(labels, points){
  const ctx = document.getElementById("wealthChart").getContext("2d");
  if (wealthChart) wealthChart.destroy();

  const mm = minMaxPad(points);

  wealthChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Wealth index",
        data: points,
        tension: 0.35,
        borderColor: COLORS.income,
        backgroundColor: "rgba(0,0,0,0)",
        pointRadius: 0,
        borderWidth: 2
      }]
    },
    options: {
      ...NO_ANIM,
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: COLORS.text } } },
      scales: {
        x: { ticks: { color: COLORS.muted }, grid: { color: COLORS.grid } },
        y: { min: mm.min, max: mm.max, ticks: { color: COLORS.muted }, grid: { color: COLORS.grid } }
      }
    }
  });
}

async function loadSnapshot(){
  const q = document.getElementById("question").value || "";
  document.getElementById("sumHeadline").textContent = "Generating insight…";
  document.getElementById("sumBullets").innerHTML = "";
  document.getElementById("sumNote").textContent = "";

  const res = await fetch("/api/snapshot", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ period, question: q })
  });

  const data = await res.json();
  const snap = data.snapshot;

  document.getElementById("salary").textContent = eur(snap.salary_monthly);
  document.getElementById("savings").textContent = eur(snap.savings_est_monthly);

  renderExpenses(snap.expenses, snap.monthly_expense_total);
  setBars(snap.resilience, snap.liquidity);
  drawFlow(snap.flow);
  drawWealth(snap.labels, snap.wealth);
  renderSummary(data.summary);
}

document.querySelectorAll(".tab").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    period = btn.dataset.period;
    loadSnapshot();
  });
});

document.getElementById("simulateBtn").addEventListener("click", ()=> loadSnapshot());
loadSnapshot();
JS

echo "Rebuild complete."
