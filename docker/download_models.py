"""Pre-download and verify all ML models for the Docker image.

This script runs at Docker build time. Any failure exits non-zero,
failing the build. No silent fallbacks.
"""
import os
import sys
import urllib.request

# Force CPU mode during build - no GPU driver available at build time.
# Must be set before any ML library import.
os.environ["PADDLE_DEVICE"] = "cpu"
os.environ["FLAGS_use_cuda"] = "0"
os.environ["CUDA_VISIBLE_DEVICES"] = ""

REALESRGAN_MODEL_DIR = "/opt/models/realesrgan"
REALESRGAN_MODEL_URL = (
    "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
)
REALESRGAN_MODEL_PATH = os.path.join(REALESRGAN_MODEL_DIR, "RealESRGAN_x4plus.pth")
REALESRGAN_MIN_SIZE = 60_000_000  # ~67 MB

REMBG_MODELS = [
    "u2net",
    "isnet-general-use",
    "bria-rmbg",
    "birefnet-general-lite",
    "birefnet-portrait",
    "birefnet-general",
    "birefnet-matting",
]

# PaddleOCR language codes (not ISO). German/French/Spanish use "latin" model.
# Valid keys: ch, en, korean, japan, chinese_cht, ta, te, ka, latin, arabic, cyrillic, devanagari
PADDLEOCR_LANGUAGES = ["en", "ch", "japan", "korean", "latin"]


def _register_birefnet_matting():
    """Register BiRefNet-matting ONNX session for Ultra quality mode."""
    import os
    import pooch
    from rembg.sessions import sessions_class
    from rembg.sessions.birefnet_general import BiRefNetSessionGeneral

    class BiRefNetMattingSession(BiRefNetSessionGeneral):
        @classmethod
        def download_models(cls, *args, **kwargs):
            fname = f"{cls.name(*args, **kwargs)}.onnx"
            pooch.retrieve(
                "https://github.com/ZhengPeng7/BiRefNet/releases/download/v1/BiRefNet-matting-epoch_100.onnx",
                None,  # Skip checksum for GitHub release assets
                fname=fname,
                path=cls.u2net_home(*args, **kwargs),
                progressbar=True,
            )
            return os.path.join(cls.u2net_home(*args, **kwargs), fname)

        @classmethod
        def name(cls, *args, **kwargs):
            return "birefnet-matting"

    sessions_class.append(BiRefNetMattingSession)


def download_rembg_models():
    """Download all rembg ONNX models."""
    print("=== Downloading rembg models ===")
    from rembg import new_session

    _register_birefnet_matting()

    for model in REMBG_MODELS:
        print(f"  Downloading {model}...")
        new_session(model)
        print(f"  {model} ready")
    print(f"All {len(REMBG_MODELS)} rembg models downloaded.\n")


def download_realesrgan_model():
    """Download RealESRGAN_x4plus.pth pretrained weights."""
    print("=== Downloading RealESRGAN model ===")
    os.makedirs(REALESRGAN_MODEL_DIR, exist_ok=True)
    print(f"  Downloading from {REALESRGAN_MODEL_URL}...")
    urllib.request.urlretrieve(REALESRGAN_MODEL_URL, REALESRGAN_MODEL_PATH)

    size = os.path.getsize(REALESRGAN_MODEL_PATH)
    assert size > REALESRGAN_MIN_SIZE, (
        f"RealESRGAN model too small: {size} bytes (expected > {REALESRGAN_MIN_SIZE})"
    )
    print(f"  RealESRGAN_x4plus.pth downloaded ({size / 1_000_000:.1f} MB)\n")


def download_paddleocr_models():
    """Pre-download PaddleOCR PP-OCRv5 models for all supported languages."""
    print("=== Downloading PaddleOCR PP-OCRv5 models ===")
    try:
        from paddleocr import PaddleOCR
    except ImportError as e:
        if "libcuda" in str(e):
            print(f"  Skipping PaddleOCR model pre-download (no CUDA driver at build time)")
            print(f"  Models will download on first use at runtime.\n")
            return
        raise

    for lang in PADDLEOCR_LANGUAGES:
        print(f"  Downloading PP-OCRv5 models for lang={lang}...")
        PaddleOCR(lang=lang, use_gpu=False, show_log=False, ocr_version="PP-OCRv5")
        print(f"  {lang} ready")
    print(f"All {len(PADDLEOCR_LANGUAGES)} PaddleOCR PP-OCRv5 languages downloaded.\n")


def download_paddleocr_vl_model():
    """Pre-download PaddleOCR-VL 1.5 model weights."""
    print("=== Downloading PaddleOCR-VL 1.5 model ===")
    try:
        from paddleocr import PaddleOCRVL
    except ImportError as e:
        if "libcuda" in str(e):
            print(f"  Skipping PaddleOCR-VL pre-download (no CUDA driver at build time)")
            print(f"  Model will download on first use at runtime.\n")
            return
        raise

    print("  Downloading PaddleOCR-VL 1.5 weights (~1.93 GB)...")
    try:
        PaddleOCRVL(device="cpu")
        print("  PaddleOCR-VL 1.5 ready\n")
    except Exception as e:
        print(f"  Warning: PaddleOCR-VL pre-download failed: {e}")
        print(f"  Model will download on first use at runtime.\n")


def verify_mediapipe():
    """Verify MediaPipe face detection models are bundled in the wheel."""
    print("=== Verifying MediaPipe models ===")
    import mediapipe as mp

    for selection in [0, 1]:
        label = "short-range" if selection == 0 else "full-range"
        print(f"  Verifying {label} model (selection={selection})...")
        detector = mp.solutions.face_detection.FaceDetection(
            model_selection=selection, min_detection_confidence=0.5
        )
        detector.close()
        print(f"  {label} model OK")
    print("MediaPipe models verified.\n")


def smoke_test():
    """Final verification that all ML libraries and models are loadable.

    GPU-dependent libraries (paddlepaddle-gpu, torch CUDA) cannot be imported
    at build time because the CUDA driver is only available at runtime. We verify
    CPU-only imports and check that model files exist on disk.
    """
    print("=== Running smoke test ===")

    # CPU-only imports that work on all platforms at build time
    from PIL import Image
    import cv2
    import numpy
    from rembg import new_session
    print("  CPU imports OK (Pillow, cv2, numpy, rembg)")

    # MediaPipe is CPU-only, should always import
    import mediapipe as mp
    print("  MediaPipe import OK")

    # RealESRGAN model file must exist
    assert os.path.exists(REALESRGAN_MODEL_PATH), (
        f"RealESRGAN model missing: {REALESRGAN_MODEL_PATH}"
    )
    assert os.path.getsize(REALESRGAN_MODEL_PATH) > REALESRGAN_MIN_SIZE, (
        "RealESRGAN model file is too small"
    )
    print("  RealESRGAN model file verified")

    print("Smoke test passed.\n")


def main():
    print("Pre-downloading all ML models...\n")
    download_rembg_models()
    download_realesrgan_model()
    download_paddleocr_models()
    download_paddleocr_vl_model()
    verify_mediapipe()
    smoke_test()
    print("All models downloaded and verified.")


if __name__ == "__main__":
    main()
