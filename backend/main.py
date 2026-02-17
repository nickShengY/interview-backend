"""FastAPI service exposing ATS scan endpoint.

POST /scan
  - file: resume file (multipart/form-data)
  - jd: job description (str)

Returns JSON with traditional_score, ai_score, missing_keywords, formatting_penalty, analysis_id.
"""

from pathlib import Path
from tempfile import NamedTemporaryFile
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

import os
from dotenv import load_dotenv
import logging

try:
    from backend.ats_scoring import run_ats_scan, extract_text_with_pages
    from backend.cover_letter import router as cover_router
except ModuleNotFoundError:
    # Supports environments where this file is executed from inside /backend (e.g. Vercel root dir = backend)
    from ats_scoring import run_ats_scan, extract_text_with_pages
    from cover_letter import router as cover_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment from .env (project root) so backend has OPENROUTER_API_KEY, etc.
load_dotenv()

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI app
app = FastAPI(
    title="ATS Scan Service",
    version="1.0.0",
    description="AI-powered resume scanning and optimization service"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# mount cover letter router
app.include_router(cover_router)

# CORS configuration from environment (include both localhost and 127.0.0.1 by default)
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
logger.info(f"Allowed CORS origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# Validation models
class JobDescriptionValidator(BaseModel):
    jd: str
    
    @validator('jd')
    def validate_jd(cls, v):
        if not v or len(v.strip()) < 20:
            raise ValueError('Job description must be at least 20 characters')
        if len(v) > 50000:
            raise ValueError('Job description too long (max 50,000 characters)')
        return v.strip()


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "ATS Scan Service API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.post("/scan")
@limiter.limit("10/minute")  # Max 10 scans per minute per IP
async def scan_resume(
    request: Request,
    resume: UploadFile = File(...),
    jd: str = Form(...)
):
    """
    Scan resume against job description
    
    - **resume**: Resume file (PDF, DOCX, DOC, or TXT, max 10MB)
    - **jd**: Job description text (20-50,000 characters)
    
    Returns ATS score and recommendations
    """
    client_host = request.client.host if request.client else "test-client"
    logger.info(f"Scan request from {client_host}")
    
    # Validate file type - allow by content-type or by extension fallback
    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
        "application/octet-stream",  # some browsers upload PDFs as octet-stream
    }
    allowed_exts = {".pdf", ".docx", ".doc", ".txt"}
    file_ext = Path(resume.filename or "").suffix.lower()
    if (resume.content_type not in allowed_types) and (file_ext not in allowed_exts):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {resume.content_type} ({file_ext}). Allowed: PDF, DOCX, DOC, TXT"
        )
    
    # Validate file size (10MB max)
    MAX_FILE_SIZE = 10 * 1024 * 1024
    resume_content = await resume.read()
    if len(resume_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 10MB"
        )
    
    # Validate job description
    try:
        JobDescriptionValidator(jd=jd)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    tmp_path: Optional[Path] = None
    try:
        suffix = Path(resume.filename or "resume.pdf").suffix
        with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(resume_content)
            tmp_path = Path(tmp.name)
        
        logger.info(f"Processing resume: {resume.filename}")
        result = run_ats_scan(tmp_path, jd)
        logger.info(f"Scan completed successfully")
        
        return JSONResponse(result)
    except Exception as e:
        logger.error(f"Error scanning resume: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to process resume. Please try again."
        )
    finally:
        if tmp_path and tmp_path.exists():
            try:
                tmp_path.unlink()
            except Exception as e:
                logger.warning(f"Failed to delete temp file: {e}")


@app.post("/extract-text")
@limiter.limit("30/minute")
async def extract_text_endpoint(
    request: Request,
    file: UploadFile = File(...),
):
    """Extract raw text and approximate page count from an uploaded document.

    Used by the Next.js app for textbook PDF/TXT parsing and other flows.
    """

    client_host = request.client.host if request.client else "test-client"
    logger.info(f"Text extract request from {client_host}")

    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
        "text/markdown",
        "application/octet-stream",
    }
    allowed_exts = {".pdf", ".docx", ".doc", ".txt", ".md"}

    file_ext = Path(file.filename or "").suffix.lower()
    if (file.content_type not in allowed_types) and (file_ext not in allowed_exts):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type} ({file_ext}). Allowed: PDF, DOCX, DOC, TXT, MD",
        )

    # For textbooks we allow larger files than resumes (up to 50MB)
    MAX_FILE_SIZE = 50 * 1024 * 1024
    raw = await file.read()
    if len(raw) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 50MB",
        )

    tmp_path: Optional[Path] = None
    try:
        suffix = Path(file.filename or "document.pdf").suffix
        with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(raw)
            tmp_path = Path(tmp.name)

        text, pages = extract_text_with_pages(tmp_path)
        if not text or not text.strip():
            raise HTTPException(
                status_code=400,
                detail=(
                    "No readable text could be extracted from this file. "
                    "If this is a scanned PDF/image, please upload the DOCX/TXT "
                    "version or a text-based PDF."
                ),
            )

        return JSONResponse({"content": text, "pages": pages})
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting text: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to extract text from file. Please try again.",
        )
    finally:
        if tmp_path and tmp_path.exists():
            try:
                tmp_path.unlink()
            except Exception as e:
                logger.warning(f"Failed to delete temp file: {e}")
