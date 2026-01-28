import { PROFILE_DATA } from '../data/profiles';

const buildSnapshot = (period, timeSeries, expensesCfg) => {
  if (!timeSeries[period]) {
    throw new Error(`Unknown period: ${period}`);
  }

  const block = timeSeries[period];
  const labels = block.labels || [];
  const points = block.points || [];
  const metrics = block.metrics || {};

  const salaryMonthly = metrics.salary || 0;
  const resilience = metrics.resilience || 0;
  const liquidity = metrics.liq || 0;

  const expenses = (expensesCfg && expensesCfg.categories) || [];
  const monthlyExpenseTotal = expenses.reduce((sum, e) => sum + (e.monthly || 0), 0);

  const denom = monthlyExpenseTotal > 0 ? monthlyExpenseTotal : 1;
  const expOut = expenses
    .map((e) => {
      const m = e.monthly || 0;
      return {
        key: e.key || '',
        label: e.label || '',
        monthly: m,
        pct: Math.round(((m / denom) * 100) * 10) / 10,
      };
    })
    .sort((a, b) => b.monthly - a.monthly);

  let income;
  let expense;
  let savings;
  let flowGrain;

  if (period === '6M' || period === '1Y') {
    income = labels.map(() => salaryMonthly);
    expense = labels.map(() => monthlyExpenseTotal);
    savings = labels.map(() => Math.max(salaryMonthly - monthlyExpenseTotal, 0));
    flowGrain = 'monthly';
  } else {
    income = labels.map(() => salaryMonthly * 12);
    expense = labels.map(() => monthlyExpenseTotal * 12);
    savings = labels.map(() => Math.max((salaryMonthly - monthlyExpenseTotal) * 12, 0));
    flowGrain = 'yearly';
  }

  return {
    period,
    labels,
    wealth: points,
    metrics,
    salary_monthly: salaryMonthly,
    resilience,
    liquidity,
    expenses: expOut,
    monthly_expense_total: monthlyExpenseTotal,
    savings_est_monthly: Math.max(salaryMonthly - monthlyExpenseTotal, 0),
    flow: {
      grain: flowGrain,
      labels,
      income,
      expense,
      savings,
    },
  };
};

const extractAge = (text) => {
  const match = /\b(\d{2})\b/.exec(text || '');
  return match ? parseInt(match[1], 10) : null;
};

export const buildSummary = (snapshot, question) => {
  const period = snapshot.period;
  const salaryM = Number(snapshot.salary_monthly || 0);
  const spendM = Number(snapshot.monthly_expense_total || 0);
  const savingsM = Number(snapshot.savings_est_monthly || 0);
  const res = Number(snapshot.resilience || 0);
  const liq = Number(snapshot.liquidity || 0);

  const q = (question || '').trim().toLowerCase();

  const headline = `${period} snapshot: estimated savings £${savingsM.toFixed(0)}/month.`;
  const bullets = [
    `Income: £${salaryM.toFixed(0)}/month | Expenses: £${spendM.toFixed(0)}/month`,
    `Resilience: ${res.toFixed(0)}% | Liquidity: ${liq.toFixed(0)}%`,
    snapshot.expenses && snapshot.expenses.length
      ? `Top expense: ${snapshot.expenses[0].label} (£${snapshot.expenses[0].monthly.toFixed(
          0,
        )}/month)`
      : 'No expense categories loaded.',
  ];

  const liquidityBuffer = (liq / 100.0) * (3.0 * spendM);
  const resilienceBuffer = (res / 100.0) * (6.0 * spendM);
  // resilienceBuffer is not surfaced directly but kept for parity with Python logic.
  void resilienceBuffer;

  if (q.includes('holiday') || q.includes('vacation')) {
    const safety = 1.0 * spendM;
    const ceiling = Math.max(liquidityBuffer - safety, 0);
    bullets.push(
      `Holiday scenario: spend ceiling ≈ £${ceiling.toFixed(
        0,
      )} (keeps ~1 month safety buffer).`,
    );
  }

  if (q.includes('retire')) {
    const age = extractAge(q) || 55;
    const targetSavingsRate = 0.35;
    const required = targetSavingsRate * salaryM;
    const gap = required - savingsM;
    if (gap <= 0) {
      bullets.push(
        `Retire at ${age}: savings rate looks strong vs a ${Math.round(
          targetSavingsRate * 100,
        )}% target (model).`,
      );
    } else {
      bullets.push(
        `Retire at ${age}: needs ~£${gap.toFixed(
          0,
        )}/month extra savings to reach a ${Math.round(
          targetSavingsRate * 100,
        )}% target (model).`,
      );
    }
  }

  if (q && !q.includes('holiday') && !q.includes('vacation') && !q.includes('retire')) {
    bullets.push("Try: 'retire at 55' or 'holiday budget'.");
  }

  return {
    headline,
    bullets,
    note: 'POC output. Not financial advice.',
  };
};

export const buildSnapshotForProfile = (period, profileId) => {
  const data = PROFILE_DATA[profileId] || PROFILE_DATA.james_thompson;
  return buildSnapshot(period, data.time_series, data.expenses);
};

