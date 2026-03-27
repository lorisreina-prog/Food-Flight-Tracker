import os
import qrcode
from PIL import Image

QR_DIR = "qr_images"
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://localhost:5173")


def generate_qr(batch_id: int, qr_code: str) -> str:
    os.makedirs(QR_DIR, exist_ok=True)
    url = f"{FRONTEND_BASE_URL}/scan/{qr_code}"
    img = qrcode.make(url)
    path = os.path.join(QR_DIR, f"{qr_code}.png")
    img.save(path)
    return path


def get_qr_image_path(qr_code: str) -> str:
    path = os.path.join(QR_DIR, f"{qr_code}.png")
    if not os.path.exists(path):
        return None
    return path
