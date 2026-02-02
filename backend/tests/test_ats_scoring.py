"""Unit tests for ATS scoring module."""

import pytest
import numpy as np
from pathlib import Path
from tempfile import NamedTemporaryFile
from unittest.mock import patch, MagicMock

# Import functions to test
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.ats_scoring import (
    _clean_text,
    _estimate_pages_from_text,
    extract_text_with_pages,
    extract_text,
    compute_keyword_score,
    formatting_penalty,
    _cosine,
    semantic_similarity,
    _detect_action_verbs,
    _detect_quantifiable_results,
    _detect_certifications,
    _detect_sections,
    run_ats_scan,
)


class TestCleanText:
    """Test text cleaning functionality."""

    def test_lowercase_conversion(self):
        assert _clean_text("Hello WORLD") == "hello world"

    def test_punctuation_removal(self):
        assert _clean_text("Hello, World!") == "hello world"

    def test_whitespace_collapse(self):
        assert _clean_text("hello   world\n\ttest") == "hello world test"

    def test_empty_string(self):
        assert _clean_text("") == ""

    def test_only_punctuation(self):
        assert _clean_text("...!!!") == ""

    def test_numbers_preserved(self):
        assert _clean_text("Python 3.9") == "python 39"

    def test_mixed_content(self):
        result = _clean_text("  Hello,  WORLD!  123  ")
        assert result == "hello world 123"


class TestEstimatePagesFromText:
    """Test page estimation heuristic."""

    def test_empty_text(self):
        assert _estimate_pages_from_text("") == 1

    def test_few_lines(self):
        text = "\n".join(["line"] * 10)
        assert _estimate_pages_from_text(text) == 1

    def test_one_page_threshold(self):
        text = "\n".join(["line"] * 50)
        assert _estimate_pages_from_text(text) == 1

    def test_two_pages(self):
        text = "\n".join(["line"] * 100)
        assert _estimate_pages_from_text(text) == 2

    def test_multiple_pages(self):
        text = "\n".join(["line"] * 250)
        assert _estimate_pages_from_text(text) == 5

    def test_empty_lines_ignored(self):
        text = "\n\n\n".join(["line"] * 50)
        assert _estimate_pages_from_text(text) == 1


class TestExtractText:
    """Test text extraction from various file formats."""

    def test_extract_txt_file(self):
        content = "This is a test resume.\nWith multiple lines."
        with NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(content)
            temp_path = f.name
        # File must be closed before reading on Windows
        try:
            text, pages = extract_text_with_pages(Path(temp_path))
            assert "test resume" in text
            assert pages >= 1
        finally:
            Path(temp_path).unlink()

    def test_extract_text_wrapper(self):
        content = "Resume content here"
        with NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(content)
            temp_path = f.name
        # File must be closed before reading on Windows
        try:
            text = extract_text(Path(temp_path))
            assert "Resume content" in text
        finally:
            Path(temp_path).unlink()

    def test_nonexistent_file(self):
        with pytest.raises(Exception):
            extract_text(Path("/nonexistent/file.txt"))


class TestComputeKeywordScore:
    """Test keyword/TF-IDF scoring."""

    def test_identical_texts(self):
        text = "Python developer with experience in machine learning"
        score, missing, matched = compute_keyword_score(text, text)
        assert score > 50
        assert len(missing) == 0

    def test_no_overlap(self):
        resume = "Java developer building mobile applications"
        jd = "Python data scientist machine learning AI"
        score, missing, matched = compute_keyword_score(resume, jd)
        assert score < 50
        assert len(missing) > 0

    def test_partial_overlap(self):
        resume = "Python developer with Django experience"
        jd = "Python developer needed for web application using Django and React"
        score, missing, matched = compute_keyword_score(resume, jd)
        assert 20 < score < 80
        assert "python" in matched or "django" in matched

    def test_empty_resume(self):
        score, missing, matched = compute_keyword_score("", "Python developer")
        assert score == 0
        assert len(matched) == 0

    def test_empty_jd(self):
        score, missing, matched = compute_keyword_score("Python developer", "")
        assert score == 0

    def test_stopwords_filtered(self):
        resume = "The developer is a Python expert"
        jd = "A Python developer for the team"
        score, missing, matched = compute_keyword_score(resume, jd)
        # "the" and "a" should not be in missing keywords
        assert "the" not in missing
        assert "a" not in missing


class TestFormattingPenalty:
    """Test formatting quality detection."""

    def test_no_penalty_clean_text(self):
        text = "Simple resume text without tables or columns."
        assert formatting_penalty(text) == 0

    def test_table_detection(self):
        # The regex looks for || or |  | patterns (adjacent pipes)
        text = "Name || Email || Phone"
        assert formatting_penalty(text) >= 5

    def test_column_detection_spaces(self):
        text = "Skills          Experience          Education"
        assert formatting_penalty(text) >= 5

    def test_combined_penalties(self):
        text = "Name | Email        |        Phone"
        assert formatting_penalty(text) >= 5

    def test_normal_spacing(self):
        text = "Normal text with    some extra spaces"
        # 4 spaces shouldn't trigger penalty (needs 8+)
        assert formatting_penalty(text) == 0


class TestCosine:
    """Test cosine similarity calculation."""

    def test_identical_vectors(self):
        v = np.array([1.0, 2.0, 3.0])
        assert abs(_cosine(v, v) - 1.0) < 0.001

    def test_orthogonal_vectors(self):
        v1 = np.array([1.0, 0.0])
        v2 = np.array([0.0, 1.0])
        assert abs(_cosine(v1, v2)) < 0.001

    def test_opposite_vectors(self):
        v1 = np.array([1.0, 2.0])
        v2 = np.array([-1.0, -2.0])
        assert abs(_cosine(v1, v2) - (-1.0)) < 0.001

    def test_zero_vector(self):
        v1 = np.array([0.0, 0.0])
        v2 = np.array([1.0, 2.0])
        assert _cosine(v1, v2) == 0.0


class TestSemanticSimilarity:
    """Test AI semantic similarity (mocked)."""

    @patch('backend.ats_scoring._gemini_embed')
    def test_high_similarity(self, mock_gemini):
        mock_gemini.side_effect = [
            np.array([1.0, 0.0, 0.0]),
            np.array([0.9, 0.1, 0.0])
        ]
        score = semantic_similarity("resume", "job description")
        assert score > 80

    @patch('backend.ats_scoring._gemini_embed')
    def test_low_similarity(self, mock_gemini):
        mock_gemini.side_effect = [
            np.array([1.0, 0.0, 0.0]),
            np.array([0.0, 1.0, 0.0])
        ]
        score = semantic_similarity("resume", "job description")
        assert score < 20

    @patch('backend.ats_scoring._gemini_embed')
    def test_api_failure_fallback(self, mock_gemini):
        mock_gemini.side_effect = RuntimeError("API Error")
        # Should return 0 when both Gemini and SBERT fail
        score = semantic_similarity("resume", "job description")
        assert score == 0.0


class TestDetectActionVerbs:
    """Test action verb detection."""

    def test_no_action_verbs(self):
        text = "I was a developer at the company."
        assert _detect_action_verbs(text) == 0

    def test_few_action_verbs(self):
        text = "I developed and implemented new features."
        bonus = _detect_action_verbs(text)
        assert bonus >= 1

    def test_many_action_verbs(self):
        text = "Achieved goals, improved processes, developed solutions, managed teams, led projects, created systems, implemented features, designed architectures, optimized performance, increased revenue."
        bonus = _detect_action_verbs(text)
        assert bonus == 5  # Max is 5

    def test_case_insensitive(self):
        text = "ACHIEVED and IMPROVED and DEVELOPED"
        bonus = _detect_action_verbs(text)
        assert bonus >= 1


class TestDetectQuantifiableResults:
    """Test quantifiable results detection."""

    def test_no_numbers(self):
        text = "Worked on various projects and improved outcomes."
        assert _detect_quantifiable_results(text) == 0

    def test_percentages(self):
        text = "Improved performance by 50% and reduced costs by 30%."
        bonus = _detect_quantifiable_results(text)
        assert bonus >= 1

    def test_dollar_amounts(self):
        text = "Managed $5M budget and saved $500K annually."
        bonus = _detect_quantifiable_results(text)
        assert bonus >= 1

    def test_multipliers(self):
        text = "Increased throughput by 3x and scaled to 10x users."
        bonus = _detect_quantifiable_results(text)
        assert bonus >= 1

    def test_max_bonus(self):
        # Need many quantifiable results to hit max (count // 3, max 5)
        # Each pattern: 15+ matches needed to get 5 bonus points
        text = "50% 60% 70% 80% 90% increase, $1M $2M $3M $4M $5M revenue, 100+ 200+ 300+ users, 5x 10x growth"
        bonus = _detect_quantifiable_results(text)
        assert bonus == 5  # Max is 5


class TestDetectCertifications:
    """Test certification detection."""

    def test_no_certifications(self):
        text = "Experienced software developer"
        certs = _detect_certifications(text)
        assert len(certs) == 0

    def test_aws_certification(self):
        text = "AWS Certified Solutions Architect"
        certs = _detect_certifications(text)
        assert len(certs) >= 1

    def test_multiple_certifications(self):
        text = "AWS Certified, PMP certified, CISSP, Scrum Master"
        certs = _detect_certifications(text)
        assert len(certs) >= 3

    def test_case_insensitive(self):
        text = "aws certified and pmp certified"
        certs = _detect_certifications(text)
        assert len(certs) >= 1


class TestDetectSections:
    """Test resume section detection."""

    def test_detects_common_sections(self):
        text = "Summary\nExperience\nEducation\nSkills\nProjects"
        found, missing = _detect_sections(text)
        assert "experience" in found
        assert "education" in found
        assert "skills" in found
        assert "summary" in found
        assert "projects" in found
        assert "experience" not in missing

    def test_missing_sections(self):
        text = "Experience\nSkills"
        found, missing = _detect_sections(text)
        assert "experience" in found
        assert "skills" in found
        assert "education" in missing


class TestRunAtsScan:
    """Test full ATS scan pipeline."""

    @patch('backend.ats_scoring.semantic_similarity')
    def test_full_scan_with_txt(self, mock_semantic):
        mock_semantic.return_value = 75.0
        
        content = """
        John Doe - Software Developer
        
        Experience:
        - Developed Python applications
        - Implemented machine learning models
        - Achieved 50% performance improvement
        - AWS Certified Developer
        """
        
        with NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(content)
            temp_path = f.name
        # File must be closed before reading on Windows
        try:
            jd = "Looking for Python developer with machine learning experience"
            result = run_ats_scan(Path(temp_path), jd)
            
            assert 'traditional_score' in result
            assert 'ai_score' in result
            assert 'missing_keywords' in result
            assert 'matched_keywords' in result
            assert 'formatting_penalty' in result
            assert 'analysis_id' in result
            assert 'quality_indicators' in result
            assert result['ai_score'] == 75.0
            assert 'sections_found' in result['quality_indicators']
            assert 'sections_missing' in result['quality_indicators']
            assert 'section_penalty' in result['quality_indicators']
            assert 'keyword_match_ratio' in result['quality_indicators']
        finally:
            Path(temp_path).unlink()

    @patch('backend.ats_scoring.semantic_similarity')
    def test_scan_with_warnings_low_text(self, mock_semantic):
        mock_semantic.return_value = 50.0
        
        with NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("short")  # Less than 50 chars
            temp_path = f.name
        # File must be closed before reading on Windows
        try:
            result = run_ats_scan(Path(temp_path), "Job description text here")
            
            assert len(result['warnings']) > 0
            assert "Could not extract enough text" in result['warnings'][0]
        finally:
            Path(temp_path).unlink()

    @patch('backend.ats_scoring.semantic_similarity')
    def test_score_bounds(self, mock_semantic):
        mock_semantic.return_value = 50.0
        
        content = "Python developer with experience in Django and React"
        
        with NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(content)
            temp_path = f.name
        # File must be closed before reading on Windows
        try:
            result = run_ats_scan(Path(temp_path), content)
            
            assert 0 <= result['traditional_score'] <= 100
            assert 0 <= result['ai_score'] <= 100
        finally:
            Path(temp_path).unlink()


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_unicode_handling(self):
        text = "Developer with experience in 日本語 and émojis 🚀"
        cleaned = _clean_text(text)
        assert "developer" in cleaned

    def test_very_long_text(self):
        text = "keyword " * 10000
        score, missing, matched = compute_keyword_score(text, "keyword important")
        assert score >= 0
        assert score <= 100

    def test_special_characters_in_jd(self):
        resume = "C++ and C# developer"
        jd = "Looking for C++ and C# expertise"
        score, missing, matched = compute_keyword_score(resume, jd)
        # Should handle special chars without crashing
        assert score >= 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
