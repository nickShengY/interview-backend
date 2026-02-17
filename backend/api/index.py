try:
    from main import app
except ModuleNotFoundError:
    from backend.main import app

