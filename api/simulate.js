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

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { period = '6M', question = '', profile: profileId = 'james_thompson' } =
        req.body || {};

    const q = (question || '').trim();
    if (!q) {
        res.status(200).json({
            heading: '',
            lines: ["Type a scenario question first (e.g. 'retire at 65')."],
            enabled: true,
        });
        return;
    }

    if (!process.env.OPENAI_API_KEY) {
        res.status(200).json({
            heading: 'Simulation (LLM not enabled)',
            lines: ['No key found. Set OPENAI_API_KEY in Vercel project settings.'],
            enabled: false,
        });
        return;
    }

    try {
        const profileData = loadProfile(profileId);
        const expensesCfg = profileData.expenses || {};
        const ts = profileData.time_series || {};

        const block = ts[period] || {};
        const metrics = block.metrics || {};
        const salaryMonthly = metrics.salary || 0;
        const resilience = metrics.resilience || 0;
        const liquidity = metrics.liq || 0;

        const expenses = expensesCfg.categories || [];
        const monthlyExpenseTotal = expenses.reduce(
            (sum, e) => sum + (e.monthly || 0),
            0
        );

        const facts = {
            period,
            salary_monthly: salaryMonthly,
            expenses_monthly: monthlyExpenseTotal,
            savings_monthly: Math.max(salaryMonthly - monthlyExpenseTotal, 0),
            resilience_pct: resilience,
            liquidity_pct: liquidity,
            top_expenses: expenses.slice(0, 5).map((e) => ({
                label: e.label,
                monthly: e.monthly,
            })),
        };

        const userPrompt = `
You are a financial scenario simulation engine.
Respond ONLY to the user's simulation question.
Base calculations strictly on the provided facts.
Use conservative assumptions.
Assume inflation at 5% unless the user specifies another rate.
Do NOT provide personalized financial advice. Provide illustrative options only.

Required output structure:
1) Heading: <short title derived from the question>
2) Scenario summary
3) Required income or corpus (show assumptions)
4) Gap vs current trajectory
5) Illustrative options to close the gap

FACTS (JSON): ${JSON.stringify(facts)}

SIMULATION QUESTION: ${q}
`.trim();

        const body = {
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a safe, conservative banking assistant. Do not invent numbers.',
                },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.2,
        };

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify(body),
        });

        if (!resp.ok) {
            console.error('OpenAI error status', resp.status, await resp.text());
            res.status(200).json({
                heading: 'Simulation (LLM call failed)',
                lines: ['The LLM call did not return a response. Try again later.'],
                enabled: false,
            });
            return;
        }

        const data = await resp.json();
        const text = data.choices?.[0]?.message?.content?.trim() || '';

        if (!text) {
            res.status(200).json({
                heading: 'Simulation (LLM call failed)',
                lines: ['No response text from OpenAI. Try again.'],
                enabled: false,
            });
            return;
        }

        const lines = text.split('\n').map((ln) => ln.trim()).filter(Boolean);
        const heading = lines[0] || 'Simulation result';
        const bodyLines = lines.slice(1);

        res.status(200).json({
            heading,
            lines: bodyLines.length ? bodyLines : ['No details returned.'],
            enabled: true,
        });
    } catch (err) {
        console.error(err);
        res.status(200).json({
            heading: 'Simulation (LLM call failed)',
            lines: ['An error occurred calling the LLM. Try again later.'],
            enabled: false,
        });
    }
}

