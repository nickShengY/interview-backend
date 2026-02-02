"""ATS scoring utilities (Python side).
Handles:
 - Text extraction from resume files (pdf, docx, txt)
 - Traditional keyword / TF-IDF similarity
 - Formatting quality deduction
 - AI semantic similarity using Gemini embeddings (with optional SBERT fallback)
"""

from __future__ import annotations

import io
import re
import string
import uuid
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import pdfplumber
import requests
from docx import Document  # python-docx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
import google.generativeai as genai

# ----------------------------------------------------------------------------
# Text extraction helpers
# ----------------------------------------------------------------------------

STOPWORDS = set(
    [
        "the",
        "and",
        "of",
        "to",
        "in",
        "a",
        "for",
        "with",
        "on",
        "as",
        "at",
    ]
)

SECTION_PATTERNS = {
    "summary": [r"summary", r"professional summary", r"profile"],
    "experience": [r"experience", r"work experience", r"employment"],
    "education": [r"education", r"academic"],
    "skills": [r"skills", r"technical skills", r"core competencies"],
    "projects": [r"projects", r"project experience"],
    "certifications": [r"certifications", r"certificates"],
}


def _clean_text(text: str) -> str:
    """Lowercase, remove punctuation, collapse whitespace."""
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _estimate_pages_from_text(text: str) -> int:
    """Heuristic page count for non-PDF formats based on non-empty lines.

    This roughly mirrors the 50-lines-per-page heuristic used on the TS side.
    """
    lines = [ln for ln in text.splitlines() if ln.strip()]
    return max(1, len(lines) // 50 or 1)


def extract_text_with_pages(file_path: Path) -> Tuple[str, int]:
    """Extract text and an approximate page count from a resume/textbook file.

    - For PDFs, use pdfplumber when possible and return the real page count.
    - For DOC/DOCX/TXT, return 1+ pages based on a simple heuristic.
    """

    ext = file_path.suffix.lower()
    if ext == ".pdf":
        try:
            with pdfplumber.open(str(file_path)) as pdf:
                pages = [page.extract_text() or "" for page in pdf.pages]
                text = "\n".join(pages)
                page_count = len(pdf.pages) or 1
                return text, page_count
        except Exception:
            # Fallback to PyPDF2 / pypdf if available; otherwise, return empty string gracefully
            try:
                from PyPDF2 import PdfReader  # type: ignore
            except Exception:
                try:
                    from pypdf import PdfReader  # type: ignore
                except Exception:
                    return "", 1
            try:
                reader = PdfReader(str(file_path))
                texts = []
                for page in getattr(reader, "pages", []):
                    try:
                        txt = page.extract_text() or ""
                    except Exception:
                        txt = ""
                    texts.append(txt)
                text = "\n".join(texts)
                page_count = len(getattr(reader, "pages", [])) or 1
                return text, page_count
            except Exception:
                return "", 1
    elif ext in {".doc", ".docx"}:
        doc = Document(str(file_path))
        full_text = [p.text for p in doc.paragraphs]
        text = "\n".join(full_text)
        return text, _estimate_pages_from_text(text)
    else:
        text = file_path.read_text(errors="ignore")
        return text, _estimate_pages_from_text(text)


def extract_text(file_path: Path) -> str:
    """Backward-compatible wrapper returning only the extracted text.

    Existing ATS scan and cover-letter flows depend on this signature.
    """
    text, _ = extract_text_with_pages(file_path)
    return text


# ----------------------------------------------------------------------------
# Traditional score
# ----------------------------------------------------------------------------


def compute_keyword_score(resume_txt: str, jd_txt: str) -> Tuple[float, List[str], List[str]]:
    """Return similarity score 0-100 and lists of missing and matched top keywords."""
    clean_resume = _clean_text(resume_txt)
    clean_jd = _clean_text(jd_txt)

    if not clean_resume or not clean_jd:
        return 0.0, [], []

    vectorizer = TfidfVectorizer(stop_words="english")
    try:
        tfidf = vectorizer.fit_transform([clean_jd, clean_resume])
        sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        tfidf_score = sim * 100
    except ValueError:
        tfidf_score = 0.0

    # Top JD keywords
    jd_tokens = [w for w in clean_jd.split() if w not in STOPWORDS]
    jd_freq: Dict[str, int] = {}
    for w in jd_tokens:
        jd_freq[w] = jd_freq.get(w, 0) + 1
    sorted_kw = sorted(jd_freq.items(), key=lambda x: x[1], reverse=True)
    top_keywords = [kw for kw, _ in sorted_kw[:30]]

    if not top_keywords:
        return 0.0, [], []

    missing = [kw for kw in top_keywords if kw not in clean_resume]
    matched = [kw for kw in top_keywords if kw in clean_resume]

    match_ratio = len(matched) / max(1, len(top_keywords))
    blended_score = (0.65 * tfidf_score) + (0.35 * (match_ratio * 100))
    score = round(blended_score, 2)
    return score, missing, matched


# ----------------------------------------------------------------------------
# Formatting heuristic
# ----------------------------------------------------------------------------


def formatting_penalty(resume_txt: str) -> int:
    """Detect tables/2-columns with multiple consecutive spaces or vertical bars."""
    penalty = 0
    if re.search(r"\|\s*\|", resume_txt):
        penalty += 5
    if re.search(r"\s{8,}", resume_txt):
        penalty += 5
    return penalty


# ----------------------------------------------------------------------------
# AI semantic score via Gemini embeddings, fallback to SBERT if configured
# ----------------------------------------------------------------------------


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def _gemini_embed(text: str) -> np.ndarray:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GOOGLE_API_KEY")
    genai.configure(api_key=api_key)
    # Use fully-qualified model name to avoid API version/model lookup issues
    model = os.getenv("GEMINI_EMBED_MODEL", "models/text-embedding-004")
    # SDK returns dict-like with 'embedding' which often contains 'values'
    resp = genai.embed_content(model=model, content=text)
    vec = resp.get("embedding") if isinstance(resp, dict) else getattr(resp, "embedding", None)
    if isinstance(vec, dict):
        vec = vec.get("values")
    if vec is None:
        raise RuntimeError("No embedding from Gemini")
    return np.array(vec, dtype=float)


def _sbert_embed_pair(resume_txt: str, jd_txt: str) -> Tuple[np.ndarray, np.ndarray]:
    endpoint = os.getenv("SBERT_API_URL")
    if not endpoint:
        raise RuntimeError("SBERT endpoint not configured")
    body = {"sentences": [resume_txt, jd_txt]}
    resp = requests.post(endpoint, json=body, timeout=30)
    resp.raise_for_status()
    embeddings = resp.json().get("embeddings", [])
    if len(embeddings) != 2:
        raise ValueError("Unexpected embedding count from SBERT service")
    return np.array(embeddings[0], dtype=float), np.array(embeddings[1], dtype=float)


def semantic_similarity(resume_txt: str, jd_txt: str) -> float:
    """Compute cosine similarity using Gemini embeddings; fallback to SBERT if available.

    Returns similarity on 0-100 scale.
    """
    try:
        v1 = _gemini_embed(resume_txt)
        v2 = _gemini_embed(jd_txt)
        sim = _cosine(v1, v2)
        return round(sim * 100, 2)
    except Exception:
        # Fallback to SBERT if configured
        try:
            v1, v2 = _sbert_embed_pair(resume_txt, jd_txt)
            sim = _cosine(v1, v2)
            return round(sim * 100, 2)
        except Exception:
            return 0.0


# ----------------------------------------------------------------------------
# Main entry
# ----------------------------------------------------------------------------


def _detect_action_verbs(resume_txt: str) -> int:
    """Award bonus points for strong action verbs."""
    action_verbs = {
        "achieved", "improved", "developed", "managed", "led", "created", 
        "implemented", "designed", "optimized", "increased", "reduced",
        "launched", "built", "delivered", "streamlined", "enhanced",
        "spearheaded", "pioneered", "architected", "automated", "scaled"
    }
    clean = _clean_text(resume_txt)
    found = sum(1 for verb in action_verbs if verb in clean)
    return min(5, found // 2)  # Up to 5 bonus points


def _detect_quantifiable_results(resume_txt: str) -> int:
    """Award bonus points for quantifiable achievements (numbers, %)."""
    # Look for patterns like: 20%, $50K, 100+, 3x, etc.
    patterns = [
        r'\d+%',           # percentages
        r'\$\d+[KMB]?',    # dollar amounts
        r'\d+\+',          # numbers with plus
        r'\d+x',           # multipliers
        r'\d{2,}'          # any 2+ digit numbers
    ]
    count = sum(len(re.findall(pattern, resume_txt)) for pattern in patterns)
    return min(5, count // 3)  # Up to 5 bonus points


def _detect_certifications(resume_txt: str) -> List[str]:
    """Detect common professional certifications."""
    cert_patterns = [
        r'AWS Certified', r'Azure', r'GCP', r'CKA', r'CKAD',
        r'PMP', r'CISSP', r'CompTIA', r'Scrum Master', r'CSM',
        r'Six Sigma', r'ITIL', r'CPA', r'CFA', r'PE License'
    ]
    found = []
    for pattern in cert_patterns:
        if re.search(pattern, resume_txt, re.IGNORECASE):
            found.append(pattern)
    return found


def _detect_sections(resume_txt: str) -> Tuple[List[str], List[str]]:
    """Detect common resume sections by heading heuristics."""
    lower = resume_txt.lower()
    found: List[str] = []
    for section, patterns in SECTION_PATTERNS.items():
        for pattern in patterns:
            if re.search(rf"\b{pattern}\b", lower):
                found.append(section)
                break
    missing = [section for section in SECTION_PATTERNS.keys() if section not in found]
    return found, missing


def run_ats_scan(resume_path: Path, jd_text: str) -> Dict:
    resume_text = extract_text(resume_path)
    warnings: List[str] = []
    if not resume_text or len(resume_text.strip()) < 50:
        warnings.append(
            "Could not extract enough text from the resume. If this is a scanned PDF/image, please upload the DOCX/TXT version or a text-based PDF."
        )

    kw_score, missing_kw, matched_kw = compute_keyword_score(resume_text, jd_text)
    penalty = formatting_penalty(resume_text)

    sections_found, sections_missing = _detect_sections(resume_text)
    core_sections = {"experience", "education", "skills"}
    missing_core = [section for section in sections_missing if section in core_sections]
    section_penalty = min(15, len(missing_core) * 5)
    penalty += section_penalty
    
    # Add bonus points for quality indicators
    action_verb_bonus = _detect_action_verbs(resume_text)
    results_bonus = _detect_quantifiable_results(resume_text)
    certifications = _detect_certifications(resume_text)
    cert_bonus = min(3, len(certifications))  # Up to 3 bonus points
    
    # Calculate traditional score with bonuses
    total_bonus = action_verb_bonus + results_bonus + cert_bonus
    traditional_score = max(0.0, min(100.0, kw_score - penalty + total_bonus))

    ai_score = semantic_similarity(resume_text, jd_text)

    return {
        "traditional_score": round(traditional_score, 2),
        "ai_score": ai_score,
        "missing_keywords": missing_kw[:15],  # Top 15 most important
        "matched_keywords": matched_kw[:30],
        "formatting_penalty": penalty,
        "analysis_id": str(uuid.uuid4()),
        "warnings": warnings,
        "quality_indicators": {
            "action_verbs_bonus": action_verb_bonus,
            "quantifiable_results_bonus": results_bonus,
            "certifications_found": certifications,
            "certifications_bonus": cert_bonus,
            "sections_found": sections_found,
            "sections_missing": sections_missing,
            "section_penalty": section_penalty,
            "keyword_match_ratio": round(len(matched_kw) / max(1, len(matched_kw) + len(missing_kw)), 2)
        }
    }
