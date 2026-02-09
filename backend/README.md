# ATS Scanner Backend

A sophisticated AI-powered resume scanning service using FastAPI, Google Gemini AI, and advanced NLP techniques.

## Features

### 🎯 Dual Scoring System

#### 1. Traditional ATS Score (TF-IDF Based)
- **Keyword Matching**: Industry-standard TF-IDF cosine similarity
- **Top Keywords**: Extracts top 30 most important terms from job description
- **Missing Keywords**: Identifies critical terms to add to resume
- **Format Analysis**: Detects ATS-unfriendly layouts (tables, multi-column)

#### 2. AI Semantic Score (Gemini Embeddings)
- **Google Gemini**: Uses `text-embedding-004` model for semantic understanding
- **Contextual Matching**: Understands synonyms and related concepts
- **Fallback Support**: Optional SBERT endpoint if Gemini unavailable

### ⭐ Quality Indicators (NEW!)

The scanner now includes bonus points for resume quality:

- **Action Verbs**: Detects strong action verbs (achieved, led, implemented, etc.)
  - Up to +5 bonus points
- **Quantifiable Results**: Identifies metrics, percentages, dollar amounts
  - Up to +5 bonus points  
- **Certifications**: Recognizes professional certifications (AWS, PMP, CISSP, etc.)
  - Up to +3 bonus points

### 📝 Cover Letter Generation

AI-powered cover letter generation using Google Gemini:
- Tailored to specific job description
- Highlights relevant experience from resume
- ~350 words, professionally formatted

## Quick Start

### Option 1: Use Batch File (Windows)
```bash
# From backend directory
start.bat
```

### Option 2: Manual Setup
```bash
# Create virtual environment
python -m venv .venv311

# Activate virtual environment
.venv311\Scripts\activate  # Windows
source .venv311/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Set environment variable
set OPENROUTER_API_KEY=your_api_key_here  # Windows
export OPENROUTER_API_KEY=your_api_key_here  # Linux/Mac

# Start server
uvicorn main:app --reload --port 8000
```

## API Endpoints

### POST /scan
Scan resume against job description

**Request:**
- `resume`: File upload (PDF, DOCX, DOC, or TXT)
- `jd`: Job description text (form field)

**Response:**
```json
{
  "traditional_score": 85.5,
  "ai_score": 88.2,
  "missing_keywords": ["python", "docker", "kubernetes"],
  "formatting_penalty": 0,
  "analysis_id": "uuid-here",
  "quality_indicators": {
    "action_verbs_bonus": 4,
    "quantifiable_results_bonus": 5,
    "certifications_found": ["AWS Certified", "PMP"],
    "certifications_bonus": 2
  }
}
```

### POST /cover-letter
Generate AI cover letter

**Request:**
- `resume`: File upload
- `jd`: Job description text

**Response:**
```json
{
  "cover_letter": "Dear Hiring Manager,\n\n..."
}
```

### GET /health
Health check endpoint

### GET /docs
Interactive API documentation (Swagger UI)

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENROUTER_API_KEY` | OpenRouter API key | - | ✅ |
| `OPENROUTER_APP_URL` | OpenRouter attribution URL (HTTP-Referer header) | - | ❌ |
| `OPENROUTER_APP_NAME` | OpenRouter attribution app name (X-Title header) | - | ❌ |
| `SBERT_API_URL` | Fallback SBERT endpoint | - | ❌ |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `http://localhost:3000` | ❌ |

## Technical Details

### Scoring Algorithm

**Traditional Score Formula:**
```
Base Score (0-100) = TF-IDF Cosine Similarity × 100
Penalties = Formatting Issues (5-10 points)
Bonuses = Action Verbs (0-5) + Quantifiable Results (0-5) + Certifications (0-3)

Final Score = min(100, max(0, Base Score - Penalties + Bonuses))
```

**AI Semantic Score:**
```
1. Generate embeddings for resume and JD using Gemini
2. Calculate cosine similarity between embeddings
3. Scale to 0-100
```

### File Processing

Supports multiple formats:
- **PDF**: Uses `pdfplumber` for text extraction
- **DOCX/DOC**: Uses `python-docx` library
- **TXT**: Direct text reading

### Rate Limiting

- **10 scans per minute** per IP address
- Uses `slowapi` library for enforcement

## Dependencies

```
fastapi==0.110.0          # Web framework
uvicorn[standard]==0.29.0 # ASGI server
pdfplumber==0.10.3        # PDF extraction
python-docx==1.1.0        # Word document handling
scikit-learn==1.4.2       # TF-IDF and ML
google-generativeai==0.7.2 # Gemini API
slowapi==0.1.9            # Rate limiting
```

## Error Handling

- **400**: Invalid input (wrong file type, missing fields)
- **429**: Rate limit exceeded
- **500**: Server error (API issues, processing errors)

All errors include descriptive messages for debugging.

## Security Features

- File size limit: 10MB
- Allowed file types validated
- Input sanitization
- Rate limiting per IP
- CORS configuration
- Temporary file cleanup

## Development

### Add New Quality Indicators

Edit `ats_scoring.py`:

```python
def _detect_your_feature(resume_txt: str) -> int:
    """Your detection logic here"""
    # Return bonus points (0-N)
    return bonus_points

# Add to run_ats_scan():
your_bonus = _detect_your_feature(resume_text)
total_bonus += your_bonus
```

### Testing

```bash
# Test scan endpoint
curl -X POST http://localhost:8000/scan \
  -F "resume=@test_resume.pdf" \
  -F "jd=Software Engineer with Python experience"

# Test health check
curl http://localhost:8000/health
```

## Troubleshooting

**Issue**: `OPENROUTER_API_KEY not configured`
- Set environment variable with valid OpenRouter API key
- Get key from: https://openrouter.ai/keys

**Issue**: `Module not found`
- Activate virtual environment
- Run `pip install -r requirements.txt`

**Issue**: Rate limit errors
- Adjust limits in `main.py`: `@limiter.limit("10/minute")`
- Or wait and retry

**Issue**: PDF extraction fails
- Ensure PDF is not scanned/image-based
- Try converting to DOCX or TXT

## Production Deployment

See main [DEPLOYMENT.md](../DEPLOYMENT.md) for:
- Railway deployment
- Render deployment  
- Docker containerization
- Environment configuration

## License

MIT License - Part of Interview Pro platform
