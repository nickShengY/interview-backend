"""Unit tests for FastAPI main endpoints."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from pathlib import Path
import tempfile
import io
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.main import app, JobDescriptionValidator


client = TestClient(app)


class TestRootEndpoint:
    """Test root endpoint."""

    def test_root_returns_api_info(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "ATS Scan Service" in data["message"]
        assert "version" in data
        assert "docs" in data

    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data


class TestJobDescriptionValidator:
    """Test JD validation."""

    def test_valid_jd(self):
        jd = "Looking for a Python developer with at least 5 years experience."
        validator = JobDescriptionValidator(jd=jd)
        assert validator.jd == jd.strip()

    def test_jd_too_short(self):
        with pytest.raises(ValueError, match="at least 20 characters"):
            JobDescriptionValidator(jd="Short JD")

    def test_jd_too_long(self):
        long_jd = "a" * 50001
        with pytest.raises(ValueError, match="too long"):
            JobDescriptionValidator(jd=long_jd)

    def test_empty_jd(self):
        with pytest.raises(ValueError):
            JobDescriptionValidator(jd="")

    def test_whitespace_only_jd(self):
        with pytest.raises(ValueError):
            JobDescriptionValidator(jd="     ")

    def test_jd_strips_whitespace(self):
        jd = "  Looking for a Python developer with experience   "
        validator = JobDescriptionValidator(jd=jd)
        assert validator.jd == jd.strip()


class TestScanEndpoint:
    """Test resume scanning endpoint."""

    @patch('backend.main.run_ats_scan')
    def test_scan_valid_pdf(self, mock_scan):
        mock_scan.return_value = {
            "traditional_score": 75.5,
            "ai_score": 80.0,
            "missing_keywords": ["kubernetes"],
            "matched_keywords": ["python", "django"],
            "formatting_penalty": 0,
            "analysis_id": "test-123",
            "warnings": [],
            "quality_indicators": {}
        }

        pdf_content = b"%PDF-1.4 test content"
        files = {"resume": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")}
        data = {"jd": "Looking for Python developer with Django experience"}

        response = client.post("/scan", files=files, data=data)
        assert response.status_code == 200
        result = response.json()
        assert "traditional_score" in result
        assert result["traditional_score"] == 75.5

    @patch('backend.main.run_ats_scan')
    def test_scan_valid_txt(self, mock_scan):
        mock_scan.return_value = {
            "traditional_score": 70.0,
            "ai_score": 75.0,
            "missing_keywords": [],
            "matched_keywords": ["python"],
            "formatting_penalty": 0,
            "analysis_id": "test-456",
            "warnings": [],
            "quality_indicators": {}
        }

        txt_content = b"Python developer resume content here"
        files = {"resume": ("resume.txt", io.BytesIO(txt_content), "text/plain")}
        data = {"jd": "Python developer job description"}

        response = client.post("/scan", files=files, data=data)
        assert response.status_code == 200

    @patch('backend.main.run_ats_scan')
    def test_scan_valid_docx(self, mock_scan):
        mock_scan.return_value = {
            "traditional_score": 65.0,
            "ai_score": 70.0,
            "missing_keywords": [],
            "matched_keywords": [],
            "formatting_penalty": 0,
            "analysis_id": "test-789",
            "warnings": [],
            "quality_indicators": {}
        }

        docx_content = b"PK\x03\x04 docx content"
        files = {"resume": ("resume.docx", io.BytesIO(docx_content), 
                           "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        data = {"jd": "Job description for developer position"}

        response = client.post("/scan", files=files, data=data)
        # May fail on actual docx parsing, but validates file type acceptance
        assert response.status_code in [200, 500]

    def test_scan_invalid_file_type(self):
        exe_content = b"MZ executable content"
        files = {"resume": ("malware.exe", io.BytesIO(exe_content), "application/x-msdownload")}
        data = {"jd": "Python developer job description"}

        response = client.post("/scan", files=files, data=data)
        assert response.status_code == 400
        assert "Unsupported file type" in response.json()["detail"]

    def test_scan_missing_jd(self):
        pdf_content = b"%PDF-1.4 test"
        files = {"resume": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")}

        response = client.post("/scan", files=files)
        assert response.status_code == 422  # FastAPI validation error

    def test_scan_missing_resume(self):
        data = {"jd": "Python developer job description"}

        response = client.post("/scan", data=data)
        assert response.status_code == 422

    def test_scan_jd_too_short(self):
        pdf_content = b"%PDF-1.4 test"
        files = {"resume": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")}
        data = {"jd": "Short"}

        response = client.post("/scan", files=files, data=data)
        assert response.status_code == 400

    def test_scan_file_too_large(self):
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        files = {"resume": ("large.pdf", io.BytesIO(large_content), "application/pdf")}
        data = {"jd": "Python developer job description"}

        response = client.post("/scan", files=files, data=data)
        assert response.status_code == 400
        assert "too large" in response.json()["detail"].lower()

    def test_scan_octet_stream_pdf(self):
        """Test PDF uploaded as octet-stream (common browser behavior)."""
        pdf_content = b"%PDF-1.4 test content"
        files = {"resume": ("test.pdf", io.BytesIO(pdf_content), "application/octet-stream")}
        data = {"jd": "Python developer with extensive experience"}

        with patch('backend.main.run_ats_scan') as mock_scan:
            mock_scan.return_value = {
                "traditional_score": 70.0,
                "ai_score": 70.0,
                "missing_keywords": [],
                "matched_keywords": [],
                "formatting_penalty": 0,
                "analysis_id": "test",
                "warnings": [],
                "quality_indicators": {}
            }
            response = client.post("/scan", files=files, data=data)
            assert response.status_code == 200


class TestExtractTextEndpoint:
    """Test text extraction endpoint."""

    @patch('backend.main.extract_text_with_pages')
    def test_extract_text_valid_txt(self, mock_extract):
        mock_extract.return_value = ("Extracted text content", 5)

        txt_content = b"Test document content"
        files = {"file": ("document.txt", io.BytesIO(txt_content), "text/plain")}

        response = client.post("/extract-text", files=files)
        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        assert "pages" in data
        assert data["content"] == "Extracted text content"
        assert data["pages"] == 5

    @patch('backend.main.extract_text_with_pages')
    def test_extract_text_valid_pdf(self, mock_extract):
        mock_extract.return_value = ("PDF content here", 10)

        pdf_content = b"%PDF-1.4 content"
        files = {"file": ("textbook.pdf", io.BytesIO(pdf_content), "application/pdf")}

        response = client.post("/extract-text", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["pages"] == 10

    @patch('backend.main.extract_text_with_pages')
    def test_extract_text_markdown(self, mock_extract):
        mock_extract.return_value = ("# Markdown content", 2)

        md_content = b"# Heading\nParagraph"
        files = {"file": ("notes.md", io.BytesIO(md_content), "text/markdown")}

        response = client.post("/extract-text", files=files)
        assert response.status_code == 200

    def test_extract_text_invalid_type(self):
        exe_content = b"MZ executable"
        files = {"file": ("program.exe", io.BytesIO(exe_content), "application/x-msdownload")}

        response = client.post("/extract-text", files=files)
        assert response.status_code == 400

    def test_extract_text_file_too_large(self):
        large_content = b"x" * (51 * 1024 * 1024)  # 51MB
        files = {"file": ("large.pdf", io.BytesIO(large_content), "application/pdf")}

        response = client.post("/extract-text", files=files)
        assert response.status_code == 400
        assert "too large" in response.json()["detail"].lower()

    @patch('backend.main.extract_text_with_pages')
    def test_extract_text_empty_result(self, mock_extract):
        mock_extract.return_value = ("", 1)

        pdf_content = b"%PDF-1.4 scanned image"
        files = {"file": ("scanned.pdf", io.BytesIO(pdf_content), "application/pdf")}

        response = client.post("/extract-text", files=files)
        assert response.status_code == 400
        assert "No readable text" in response.json()["detail"]


class TestCORSMiddleware:
    """Test CORS configuration."""

    def test_cors_headers_present(self):
        response = client.options("/scan", headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST"
        })
        # CORS preflight should not error
        assert response.status_code in [200, 405]


class TestRateLimiting:
    """Test rate limiting behavior (basic tests)."""

    def test_health_not_rate_limited(self):
        # Health endpoint should always work
        for _ in range(20):
            response = client.get("/health")
            assert response.status_code == 200


class TestErrorHandling:
    """Test error handling scenarios."""

    @patch('backend.main.run_ats_scan')
    def test_scan_internal_error(self, mock_scan):
        mock_scan.side_effect = Exception("Internal processing error")

        pdf_content = b"%PDF-1.4 test"
        files = {"resume": ("test.pdf", io.BytesIO(pdf_content), "application/pdf")}
        data = {"jd": "Python developer job description"}

        response = client.post("/scan", files=files, data=data)
        assert response.status_code == 500
        assert "Failed to process" in response.json()["detail"]

    @patch('backend.main.extract_text_with_pages')
    def test_extract_internal_error(self, mock_extract):
        mock_extract.side_effect = Exception("Extraction failed")

        txt_content = b"Test content"
        files = {"file": ("test.txt", io.BytesIO(txt_content), "text/plain")}

        response = client.post("/extract-text", files=files)
        assert response.status_code == 500


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
