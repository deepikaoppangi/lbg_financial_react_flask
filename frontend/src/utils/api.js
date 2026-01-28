import { getAvailableProfiles } from '../data/profiles';
import { buildSnapshotForProfile, buildSummary } from './snapshot';
import { hasLlmKey, llmSummaryIfKey, llmSimulation } from './llm';

export const fetchProfiles = async () => {
  // Pure frontend: derive profiles from embedded JSON data.
  return { profiles: getAvailableProfiles() };
};

export const fetchSnapshot = async (period, question, profile) => {
  const snapshot = buildSnapshotForProfile(period, profile);

  // Base deterministic summary (works even without LLM)
  let summary = buildSummary(snapshot, question);

  // Optional LLM overlay: if key present, try to get a GenAI summary.
  if (hasLlmKey) {
    const facts = {
      period: snapshot.period,
      salary_monthly: snapshot.salary_monthly,
      expenses_monthly: snapshot.monthly_expense_total,
      savings_monthly: snapshot.savings_est_monthly,
      resilience_pct: snapshot.resilience,
      liquidity_pct: snapshot.liquidity,
      top_expenses: (snapshot.expenses || []).slice(0, 5).map((e) => ({
        label: e.label,
        monthly: e.monthly,
      })),
      flow_grain: snapshot.flow?.grain,
    };

    const llmText = await llmSummaryIfKey(facts);
    if (llmText) {
      summary = {
        headline: 'GenAI summary (facts-only)',
        bullets: [llmText],
        note: 'Generated from provided facts. Not advice.',
      };
    }
  }

  return { snapshot, summary };
};

export const fetchSimulation = async (period, question, profile) => {
  const trimmed = (question || '').trim();
  if (!trimmed) {
    return {
      heading: '',
      lines: ["Type a scenario question first (e.g. 'retire at 65')."],
      enabled: true,
    };
  }

  const snapshot = buildSnapshotForProfile(period, profile);
  const salaryM = Number(snapshot.salary_monthly || 0);
  const spendM = Number(snapshot.monthly_expense_total || 0);
  const savingsM = Number(snapshot.savings_est_monthly || 0);
  const res = Number(snapshot.resilience || 0);
  const liq = Number(snapshot.liquidity || 0);

  // If LLM key is available, try a rich GenAI simulation first.
  if (hasLlmKey) {
    const facts = {
      period: snapshot.period,
      salary_monthly: salaryM,
      expenses_monthly: spendM,
      savings_monthly: savingsM,
      resilience_pct: res,
      liquidity_pct: liq,
      top_expenses: (snapshot.expenses || []).slice(0, 5).map((e) => ({
        label: e.label,
        monthly: e.monthly,
      })),
    };

    const text = await llmSimulation(trimmed, facts);
    if (text) {
      const rawLines = text.split('\n').map((ln) => ln.trim()).filter(Boolean);
      const heading = rawLines[0] || 'Simulation result';
      const body = rawLines.length > 1 ? rawLines.slice(1) : ['No details returned.'];
      return {
        heading,
        lines: body,
        enabled: true,
      };
    }
  }

  // Fallback: deterministic, non-LLM simulation logic (always works).
  const lowerQ = trimmed.toLowerCase();
  const lines = [];
  let heading = 'Simulation result';

  if (lowerQ.includes('holiday') || lowerQ.includes('vacation')) {
    heading = 'Holiday affordability check';
    const liquidityBuffer = (liq / 100.0) * (3.0 * spendM);
    const safety = 1.0 * spendM;
    const ceiling = Math.max(liquidityBuffer - safety, 0);
    lines.push(
      `Based on your current expenses of ~£${spendM.toFixed(
        0,
      )}/month and liquidity score of ${liq.toFixed(0)}%,`,
    );
    lines.push(
      `a cautious holiday budget ceiling is around £${ceiling.toFixed(
        0,
      )} while keeping ~1 month of expenses as a safety buffer.`,
    );
    lines.push(
      'Treat this as an illustrative guide only, not personalised financial advice.',
    );
  } else if (lowerQ.includes('retire')) {
    heading = 'Retirement readiness (illustrative)';
    const ageMatch = /\b(\d{2})\b/.exec(lowerQ);
    const age = ageMatch ? parseInt(ageMatch[1], 10) : 55;
    const targetSavingsRate = 0.35;
    const required = targetSavingsRate * salaryM;
    const gap = required - savingsM;

    lines.push(
      `You asked about retiring around age ${age}. Current estimated savings: ~£${savingsM.toFixed(
        0,
      )}/month.`,
    );
    lines.push(
      `A simple model target is saving about ${Math.round(
        targetSavingsRate * 100,
      )}% of income (~£${required.toFixed(0)}/month at your income level).`,
    );
    if (gap <= 0) {
      lines.push(
        'Your current savings rate looks strong versus this illustrative target, ' +
          'but this is not a full retirement plan.',
      );
    } else {
      lines.push(
        `This model suggests increasing savings by ~£${gap.toFixed(
          0,
        )}/month to reach that target.`,
      );
    }
    lines.push(
      'This is a simplified illustration only and not personalised financial advice.',
    );
  } else {
    heading = 'Simple scenario view';
    lines.push(
      `Current monthly income is about £${salaryM.toFixed(
        0,
      )}, with expenses around £${spendM.toFixed(0)} and savings ~£${savingsM.toFixed(
        0,
      )}.`,
    );
    lines.push(
      `Resilience score is ${res.toFixed(
        0,
      )}% and liquidity score is ${liq.toFixed(
        0,
      )}%, indicating how robust your buffers are in this simple model.`,
    );
    lines.push(
      "For more targeted scenarios, try questions like 'retire at 65' or 'holiday budget for next year'.",
    );
  }

  return {
    heading,
    lines,
    enabled: true,
  };
};
