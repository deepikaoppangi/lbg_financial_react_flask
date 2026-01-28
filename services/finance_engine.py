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

    # add % of total for UI
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

    # FLOW SERIES
    # 6M and 1Y -> month-wise values
    # 3Y and 5Y -> year-wise values (annualized)
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

    snapshot = {
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
        "flow": {
            "grain": flow_grain,
            "labels": labels,
            "income": income,
            "expense": expense,
            "savings": savings
        }
    }

    return snapshot
