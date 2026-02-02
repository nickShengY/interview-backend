"""Generate cover letter using Google Gemini based on resume text & job description."""
from pathlib import Path
from tempfile import NamedTemporaryFile

import os
import json
import google.generativeai as genai
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from backend.ats_scoring import extract_text

router = APIRouter()


@router.post("/cover-letter")
async def generate_cover_letter(resume: UploadFile = File(...), jd: str = Form(...)):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Google API key not configured")

    genai.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_BIG_MODEL", "gemini-2.5-flash-lite")
    model = genai.GenerativeModel(model_name)

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

        # Ask for structured JSON output
        response = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": {
                    "type": "object",
                    "properties": {"cover_letter": {"type": "string"}},
                    "required": ["cover_letter"],
                },
            },
        )
        raw = response.text or "{}"
        try:
            data = json.loads(raw)
        except Exception:
            # Fallback if model ignored schema
            data = {"cover_letter": raw}
        return JSONResponse(data)
    finally:
        tmp_path.unlink(missing_ok=True)  # type: ignore[attr-defined]
