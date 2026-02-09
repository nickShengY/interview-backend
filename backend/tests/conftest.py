"""Pytest configuration and fixtures for backend tests."""

import pytest
import os
from pathlib import Path
import tempfile


@pytest.fixture(autouse=True)
def setup_test_environment():
    """Set up test environment variables."""
    os.environ.setdefault('OPENROUTER_API_KEY', '')
    os.environ.setdefault('SBERT_API_URL', '')
    yield


@pytest.fixture
def sample_resume_txt():
    """Create a sample resume text file."""
    content = """
    John Doe
    Software Developer
    
    Experience:
    - 5 years of Python development
    - Built scalable web applications using Django and Flask
    - Implemented machine learning models with scikit-learn
    - Managed AWS infrastructure and deployments
    
    Skills:
    Python, Django, Flask, PostgreSQL, AWS, Docker, Kubernetes
    
    Education:
    BS Computer Science, University of Technology
    
    Achievements:
    - Improved system performance by 50%
    - Led team of 5 developers
    - AWS Certified Developer
    """
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write(content)
        f.flush()
        yield Path(f.name)
    
    Path(f.name).unlink(missing_ok=True)


@pytest.fixture
def sample_job_description():
    """Sample job description for testing."""
    return """
    Senior Python Developer
    
    We are looking for an experienced Python developer to join our team.
    
    Requirements:
    - 5+ years of Python experience
    - Strong knowledge of Django or Flask
    - Experience with PostgreSQL or MySQL
    - Familiarity with AWS services
    - Knowledge of Docker and containerization
    
    Nice to have:
    - Machine learning experience
    - Kubernetes experience
    - Team leadership experience
    """


@pytest.fixture
def minimal_resume():
    """Create a minimal resume for edge case testing."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write("Short resume")
        f.flush()
        yield Path(f.name)
    
    Path(f.name).unlink(missing_ok=True)


@pytest.fixture
def formatted_resume():
    """Create a resume with table formatting (should incur penalty)."""
    content = """
    Name | Email | Phone
    John | john@email.com | 555-1234
    
    Skills          |          Experience          |          Education
    Python          |          5 years             |          BS CS
    """
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write(content)
        f.flush()
        yield Path(f.name)
    
    Path(f.name).unlink(missing_ok=True)
