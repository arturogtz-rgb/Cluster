import os
import logging
import mimetypes
from pathlib import Path

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(__file__).parent / "uploads"


def init_storage(force: bool = False):
    """Ensure the uploads directory exists."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("Local file storage ready at %s", UPLOAD_DIR)


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Write file to local disk. `path` is a slash-separated key like 'app/uploads/system/file.jpg'."""
    file_path = UPLOAD_DIR / path
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(data)
    return {"path": path}


def get_object(path: str) -> tuple:
    """Read file from local disk. Returns (bytes, content_type)."""
    file_path = UPLOAD_DIR / path
    if not file_path.is_file():
        raise FileNotFoundError(f"File not found: {path}")
    content_type = mimetypes.guess_type(str(file_path))[0] or "application/octet-stream"
    return file_path.read_bytes(), content_type
