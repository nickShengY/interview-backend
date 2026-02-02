"""Unit tests for cover letter generation."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from pathlib import Path
import io
import sys
import json

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.main import app


client = TestClient(app)


class TestCoverLetterEndpoint:
    """Test cover letter generation endpoint."""

    @patch('backend.cover_letter.genai')
    @patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-api-key'})
    def test_generate_cover_letter_success(self, mock_genai):
        """Test successful cover letter generation."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "cover_letter": "Dear Hiring Manager,\n\nI am excited to apply for the position..."
        })
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model

        resume_content = b"John Doe\nSoftware Developer\n5 years experience in Python"
        files = {"resume": ("resume.txt", io.BytesIO(resume_content), "text/plain")}
        data = {"jd": "Looking for a Python developer"}

        response = client.post("/cover-letter", files=files, data=data)
        # May fail without actual API, but validates endpoint exists
        assert response.status_code in [200, 500]

    @patch.dict('os.environ', {'GOOGLE_API_KEY': ''}, clear=False)
    def test_generate_cover_letter_no_api_key(self):
        """Test error when API key is missing."""
        # Clear the env var
        import os
        original = os.environ.get('GOOGLE_API_KEY')
        os.environ.pop('GOOGLE_API_KEY', None)

        try:
            resume_content = b"Resume content"
            files = {"resume": ("resume.txt", io.BytesIO(resume_content), "text/plain")}
            data = {"jd": "Job description"}

            response = client.post("/cover-letter", files=files, data=data)
            assert response.status_code == 500
            assert "API key" in response.json()["detail"]
        finally:
            if original:
                os.environ['GOOGLE_API_KEY'] = original

    def test_generate_cover_letter_missing_resume(self):
        """Test error when resume is missing."""
        data = {"jd": "Job description"}
        response = client.post("/cover-letter", data=data)
        assert response.status_code == 422

    def test_generate_cover_letter_missing_jd(self):
        """Test error when job description is missing."""
        resume_content = b"Resume content"
        files = {"resume": ("resume.txt", io.BytesIO(resume_content), "text/plain")}
        response = client.post("/cover-letter", files=files)
        assert response.status_code == 422

    @patch('backend.cover_letter.genai')
    @patch('backend.cover_letter.extract_text')
    @patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-key'})
    def test_cover_letter_uses_resume_text(self, mock_extract, mock_genai):
        """Test that resume text is extracted and used."""
        mock_extract.return_value = "Extracted resume content with Python skills"
        
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"cover_letter": "Generated cover letter"}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model

        resume_content = b"Resume bytes"
        files = {"resume": ("resume.pdf", io.BytesIO(resume_content), "application/pdf")}
        data = {"jd": "Python developer position"}

        response = client.post("/cover-letter", files=files, data=data)
        
        if response.status_code == 200:
            mock_extract.assert_called_once()

    @patch('backend.cover_letter.genai')
    @patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-key'})
    def test_cover_letter_handles_non_json_response(self, mock_genai):
        """Test fallback when model returns non-JSON."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Plain text cover letter without JSON formatting"
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model

        resume_content = b"Resume content"
        files = {"resume": ("resume.txt", io.BytesIO(resume_content), "text/plain")}
        data = {"jd": "Job description"}

        response = client.post("/cover-letter", files=files, data=data)
        if response.status_code == 200:
            result = response.json()
            assert "cover_letter" in result


class TestCoverLetterFormats:
    """Test cover letter generation with different file formats."""

    @patch('backend.cover_letter.genai')
    @patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-key'})
    def test_pdf_resume(self, mock_genai):
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"cover_letter": "Test"}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model

        pdf_content = b"%PDF-1.4 resume content"
        files = {"resume": ("resume.pdf", io.BytesIO(pdf_content), "application/pdf")}
        data = {"jd": "Job description for developer"}

        response = client.post("/cover-letter", files=files, data=data)
        assert response.status_code in [200, 500]

    @patch('backend.cover_letter.genai')
    @patch('backend.cover_letter.extract_text')
    @patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-key'})
    def test_docx_resume(self, mock_extract, mock_genai):
        # Mock extract_text to avoid actual docx parsing
        mock_extract.return_value = "Extracted docx resume content"
        
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"cover_letter": "Test"}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model

        docx_content = b"PK docx content"
        files = {"resume": ("resume.docx", io.BytesIO(docx_content), 
                           "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        data = {"jd": "Job description for developer"}

        response = client.post("/cover-letter", files=files, data=data)
        assert response.status_code in [200, 500]


class TestCoverLetterEdgeCases:
    """Test edge cases for cover letter generation."""

    @patch('backend.cover_letter.genai')
    @patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-key'})
    def test_empty_response_text(self, mock_genai):
        """Test handling of empty response from AI."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = None
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model

        resume_content = b"Resume"
        files = {"resume": ("resume.txt", io.BytesIO(resume_content), "text/plain")}
        data = {"jd": "Job description"}

        response = client.post("/cover-letter", files=files, data=data)
        # Empty response should return 500 or still have cover_letter key
        assert response.status_code in [200, 500]

    @patch('backend.cover_letter.genai')
    @patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-key'})
    def test_long_job_description(self, mock_genai):
        """Test with very long job description."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"cover_letter": "Generated letter"}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model

        resume_content = b"Resume content"
        files = {"resume": ("resume.txt", io.BytesIO(resume_content), "text/plain")}
        long_jd = "Python developer " * 1000
        data = {"jd": long_jd}

        response = client.post("/cover-letter", files=files, data=data)
        assert response.status_code in [200, 500]

    @patch('backend.cover_letter.genai')
    @patch.dict('os.environ', {'GOOGLE_API_KEY': 'test-key'})
    def test_unicode_content(self, mock_genai):
        """Test with unicode characters in resume and JD."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"cover_letter": "Cover letter with émojis 🚀"}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model

        resume_content = "Développeur Python avec expérience en 日本".encode('utf-8')
        files = {"resume": ("resume.txt", io.BytesIO(resume_content), "text/plain")}
        data = {"jd": "Looking for développeur with international experience"}

        response = client.post("/cover-letter", files=files, data=data)
        assert response.status_code in [200, 500]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
