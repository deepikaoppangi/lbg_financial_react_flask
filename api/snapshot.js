import fs from 'fs';
import path from 'path';

function loadProfile(profileId = 'james_thompson') {
    const dataDir = path.join(process.cwd(), 'data');
    const profilePath = path.join(dataDir, 'profiles', `${profileId}.json`);

    const fileToUse = fs.existsSync(profilePath)
        ? profilePath
        : path.join(dataDir, 'profiles', 'james_thompson.json');

    const raw = fs.readFileSync(fileToUse, 'utf8');
    return JSON.parse(raw);
}

export default function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { period = '6M', question = '', profile: profileId = 'james_thompson' } =
            req.body || {};

        const profileData = loadProfile(profileId);
        const expensesCfg = profileData.expenses || {};
        const ts = profileData.time_series || {};

        if (!ts[period]) {
            res.status(400).json({ error: `Unknown period: ${period}` });
            return;
        }

        const block = ts[period];
        const labels = block.labels || [];
        const points = block.points || [];
        const metrics = block.metrics || {};

        const salaryMonthly = metrics.salary || 0;
        const resilience = metrics.resilience || 0;
        const liquidity = metrics.liq || 0;

        const expenses = expensesCfg.categories || [];
        const monthlyExpenseTotal = expenses.reduce(
            (sum, e) => sum + (e.monthly || 0),
            0
        );

        const denom = monthlyExpenseTotal > 0 ? monthlyExpenseTotal : 1;
        const expOut = expenses
            .map((e) => {
                const m = e.monthly || 0;
                return {
                    key: e.key || '',
                    label: e.label || '',
                    monthly: m,
                    pct: Math.round(((m / denom) * 1000)) / 10,
                };
            })
            .sort((a, b) => b.monthly - a.monthly);

        let income;
        let expense;
        let savings;
        let flowGrain;

        if (['6M', '1Y'].includes(period)) {
            income = labels.map(() => salaryMonthly);
            expense = labels.map(() => monthlyExpenseTotal);
            savings = labels.map(() =>
                Math.max(salaryMonthly - monthlyExpenseTotal, 0)
            );
            flowGrain = 'monthly';
        } else {
            income = labels.map(() => salaryMonthly * 12);
            expense = labels.map(() => monthlyExpenseTotal * 12);
            savings = labels.map(() =>
                Math.max((salaryMonthly - monthlyExpenseTotal) * 12, 0)
            );
            flowGrain = 'yearly';
        }

        const snapshot = {
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

        // Simple deterministic summary (you can enrich later if needed)
        const headline = `${period} snapshot: estimated savings £${snapshot.savings_est_monthly.toFixed(
            0
        )}/month.`;
        const bullets = [
            `Income: £${salaryMonthly.toFixed(
                0
            )}/month | Expenses: £${monthlyExpenseTotal.toFixed(0)}/month`,
            `Resilience: ${resilience.toFixed(0)}% | Liquidity: ${liquidity.toFixed(
                0
            )}%`,
            snapshot.expenses.length
                ? `Top expense: ${snapshot.expenses[0].label} (£${snapshot.expenses[0].monthly.toFixed(
                    0
                )}/month)`
                : 'No expense categories loaded.',
        ];

        const summary = {
            headline,
            bullets,
            note: 'POC output. Not financial advice.',
        };

        res.status(200).json({ snapshot, summary });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to build snapshot' });
    }
}

