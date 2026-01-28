import os
import json
import urllib.request
from typing import Optional
from pathlib import Path


def _read_key_from_file() -> Optional[str]:
    key_file = Path("secrets") / "openai_key.txt"
    if not key_file.exists():
        return None
    key = key_file.read_text().strip()
    return key or None


def _get_api_key() -> Optional[str]:
    return os.getenv("OPENAI_API_KEY") or _read_key_from_file()


def _openai_chat(api_key: str, user_prompt: str) -> Optional[str]:
    try:
        body = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are a safe, conservative banking assistant. Do not invent numbers."},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2
        }

        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}"
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=20) as resp:
            out = json.loads(resp.read().decode("utf-8"))
            return out["choices"][0]["message"]["content"].strip()

    except Exception:
        return None


def llm_summary_if_key(facts: dict) -> Optional[str]:
    api_key = _get_api_key()
    if not api_key:
        return None

    prompt = (
        "You are a retail banking insights engine.\n"
        "Summarize the customer's CURRENT financial position using ONLY the facts below.\n"
        "Do NOT talk about the future.\n"
        "Do NOT give advice.\n"
        "Do NOT assume goals.\n\n"
        "Output format:\n"
        "- 1 short headline\n"
        "- 3 bullet points (plain language)\n\n"
        f"FACTS (JSON): {json.dumps(facts)}"
    )

    return _openai_chat(api_key, prompt)


def llm_simulation(prompt_text: str, facts: dict) -> Optional[str]:
    api_key = _get_api_key()
    if not api_key:
        return None

    full_prompt = (
        "You are a financial scenario simulation engine.\n"
        "Respond ONLY to the user's simulation question.\n"
        "Base calculations strictly on the provided facts.\n"
        "Use conservative assumptions.\n"
        "Assume inflation at 5% unless the user specifies another rate.\n"
        "Do NOT provide personalized financial advice. Provide illustrative options only.\n\n"
        "Required output structure:\n"
        "1) Heading: <short title derived from the question>\n"
        "2) Scenario summary\n"
        "3) Required income or corpus (show assumptions)\n"
        "4) Gap vs current trajectory\n"
        "5) Illustrative options to close the gap\n\n"
        f"FACTS (JSON): {json.dumps(facts)}\n\n"
        f"SIMULATION QUESTION: {prompt_text}"
    )

    return _openai_chat(api_key, full_prompt)
