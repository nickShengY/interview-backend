"""Generate cover letter using OpenRouter based on resume text & job description."""
from pathlib import Path
from tempfile import NamedTemporaryFile

import os
import json
import requests
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from backend.ats_scoring import extract_text

router = APIRouter()


OPENROUTER_MODELS = [
    "arcee-ai/trinity-large-preview:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "z-ai/glm-4-32b",
]


def _openrouter_headers(api_key: str) -> dict:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    app_url = os.getenv("OPENROUTER_APP_URL")
    app_name = os.getenv("OPENROUTER_APP_NAME")
    if app_url:
        headers["HTTP-Referer"] = app_url
    if app_name:
        headers["X-Title"] = app_name
    return headers


def _request_openrouter(prompt: str, api_key: str) -> dict:
    payload = {
        "messages": [{"role": "user", "content": prompt}],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "cover_letter",
                "schema": {
                    "type": "object",
                    "properties": {"cover_letter": {"type": "string"}},
                    "required": ["cover_letter"],
                },
                "strict": True,
            },
        },
    }

    headers = _openrouter_headers(api_key)
    for model in OPENROUTER_MODELS:
        payload["model"] = model
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=60,
        )
        if response.status_code >= 400:
            continue
        data = response.json()
        content = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content")
        )
        if not content:
            continue
        try:
            return json.loads(content)
        except Exception:
            return {"cover_letter": content}
    raise HTTPException(status_code=500, detail="OpenRouter request failed")


@router.post("/cover-letter")
async def generate_cover_letter(resume: UploadFile = File(...), jd: str = Form(...)):
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")

    suffix = Path(resume.filename).suffix
    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await resume.read())
        tmp_path = Path(tmp.name)

    try:
        resume_text = extract_text(tmp_path)
        prompt = (
            "You are an expert career coach. Write a concise, engaging cover letter tailored to the job "
            "description below, highlighting relevant experience from the provided resume. Address it generically (\"Hiring Manager\"). "
            "Limit length to ~350 words.\n\nRESUME:\n" + resume_text + "\n\nJOB DESCRIPTION:\n" + jd
        )

        data = _request_openrouter(prompt, api_key)
        return JSONResponse(data)
    finally:
        tmp_path.unlink(missing_ok=True)  # type: ignore[attr-defined]
