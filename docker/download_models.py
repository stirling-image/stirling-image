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

LAMA_MODEL_DIR = "/opt/models/lama"
LAMA_MODEL_URL = "https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx"
LAMA_MODEL_PATH = os.path.join(LAMA_MODEL_DIR, "lama_fp32.onnx")
LAMA_MIN_SIZE = 100_000_000  # ~200 MB

REALESRGAN_MODEL_DIR = "/opt/models/realesrgan"
REALESRGAN_MODEL_URL = (
    "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
)
REALESRGAN_MODEL_PATH = os.path.join(REALESRGAN_MODEL_DIR, "RealESRGAN_x4plus.pth")
REALESRGAN_MIN_SIZE = 60_000_000  # ~67 MB

GFPGAN_MODEL_DIR = "/opt/models/gfpgan"
GFPGAN_MODEL_URL = (
    "https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.3.pth"
)
GFPGAN_MODEL_PATH = os.path.join(GFPGAN_MODEL_DIR, "GFPGANv1.3.pth")
GFPGAN_MIN_SIZE = 300_000_000  # ~332 MB

REMBG_MODELS = [
    "u2net",
    "isnet-general-use",
    "bria-rmbg",
    "birefnet-general-lite",
    "birefnet-portrait",
    "birefnet-general",
    "birefnet-matting",
]

# PaddleOCR PP-OCRv5 HuggingFace model repos to pre-download.
# These are the models used by PaddleOCR(ocr_version="PP-OCRv5").
# Downloaded via huggingface_hub to avoid initializing the PaddlePaddle
# inference engine, which segfaults under QEMU emulation at build time.
PADDLEOCR_MODELS = [
    "PaddlePaddle/PP-OCRv5_server_det",
    "PaddlePaddle/PP-OCRv5_server_rec",
    "PaddlePaddle/PP-OCRv5_mobile_det",
    "PaddlePaddle/PP-OCRv5_mobile_rec",
    "PaddlePaddle/latin_PP-OCRv5_mobile_rec",
    "PaddlePaddle/korean_PP-OCRv5_mobile_rec",
    "PaddlePaddle/PP-LCNet_x1_0_textline_ori",
]

PADDLEOCR_VL_MODEL = "PaddlePaddle/PaddleOCR-VL-1.5"

# PaddleX stores models here by default
PADDLEX_MODEL_DIR = os.path.expanduser("~/.paddlex/official_models")


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


def download_lama_model():
    """Download LaMa ONNX inpainting model from HuggingFace."""
    print("=== Downloading LaMa ONNX model ===")
    os.makedirs(LAMA_MODEL_DIR, exist_ok=True)
    print(f"  Downloading from {LAMA_MODEL_URL}...")
    urllib.request.urlretrieve(LAMA_MODEL_URL, LAMA_MODEL_PATH)

    size = os.path.getsize(LAMA_MODEL_PATH)
    assert size > LAMA_MIN_SIZE, (
        f"LaMa model too small: {size} bytes (expected > {LAMA_MIN_SIZE})"
    )
    print(f"  lama_fp32.onnx downloaded ({size / 1_000_000:.1f} MB)\n")


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


def download_gfpgan_model():
    """Download GFPGANv1.3.pth pretrained weights for face enhancement."""
    print("=== Downloading GFPGAN model ===")
    os.makedirs(GFPGAN_MODEL_DIR, exist_ok=True)
    print(f"  Downloading from {GFPGAN_MODEL_URL}...")
    urllib.request.urlretrieve(GFPGAN_MODEL_URL, GFPGAN_MODEL_PATH)

    size = os.path.getsize(GFPGAN_MODEL_PATH)
    assert size > GFPGAN_MIN_SIZE, (
        f"GFPGAN model too small: {size} bytes (expected > {GFPGAN_MIN_SIZE})"
    )
    print(f"  GFPGANv1.3.pth downloaded ({size / 1_000_000:.1f} MB)\n")


def download_paddleocr_models():
    """Pre-download PaddleOCR PP-OCRv5 model weights from HuggingFace.

    Uses huggingface_hub.snapshot_download() to fetch model files directly
    into the PaddleX cache directory. This avoids initializing PaddlePaddle's
    C++ inference engine, which segfaults under QEMU emulation (arm64 host
    building amd64 image).
    """
    print("=== Downloading PaddleOCR PP-OCRv5 models ===")
    from huggingface_hub import snapshot_download

    os.makedirs(PADDLEX_MODEL_DIR, exist_ok=True)

    for repo_id in PADDLEOCR_MODELS:
        model_name = repo_id.split("/", 1)[1]
        local_dir = os.path.join(PADDLEX_MODEL_DIR, model_name)
        print(f"  Downloading {model_name}...")
        snapshot_download(repo_id=repo_id, local_dir=local_dir)
        print(f"  {model_name} ready")
    print(f"All {len(PADDLEOCR_MODELS)} PaddleOCR PP-OCRv5 models downloaded.\n")


def download_paddleocr_vl_model():
    """Pre-download PaddleOCR-VL 1.5 model weights from HuggingFace."""
    print("=== Downloading PaddleOCR-VL 1.5 model ===")
    from huggingface_hub import snapshot_download

    model_name = PADDLEOCR_VL_MODEL.split("/", 1)[1]
    local_dir = os.path.join(PADDLEX_MODEL_DIR, model_name)
    print(f"  Downloading {model_name} (~1.93 GB)...")
    snapshot_download(repo_id=PADDLEOCR_VL_MODEL, local_dir=local_dir)
    print(f"  {model_name} ready\n")


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

    # LaMa model file must exist
    assert os.path.exists(LAMA_MODEL_PATH), (
        f"LaMa model missing: {LAMA_MODEL_PATH}"
    )
    assert os.path.getsize(LAMA_MODEL_PATH) > LAMA_MIN_SIZE, (
        "LaMa model file is too small"
    )
    print("  LaMa ONNX model file verified")

    # RealESRGAN model file must exist
    assert os.path.exists(REALESRGAN_MODEL_PATH), (
        f"RealESRGAN model missing: {REALESRGAN_MODEL_PATH}"
    )
    assert os.path.getsize(REALESRGAN_MODEL_PATH) > REALESRGAN_MIN_SIZE, (
        "RealESRGAN model file is too small"
    )
    print("  RealESRGAN model file verified")

    # GFPGAN model file must exist
    assert os.path.exists(GFPGAN_MODEL_PATH), (
        f"GFPGAN model missing: {GFPGAN_MODEL_PATH}"
    )
    assert os.path.getsize(GFPGAN_MODEL_PATH) > GFPGAN_MIN_SIZE, (
        "GFPGAN model file is too small"
    )
    print("  GFPGAN model file verified")

    # PaddleOCR model directories must exist
    for repo_id in PADDLEOCR_MODELS:
        model_name = repo_id.split("/", 1)[1]
        model_dir = os.path.join(PADDLEX_MODEL_DIR, model_name)
        assert os.path.isdir(model_dir), f"PaddleOCR model missing: {model_dir}"
    print(f"  PaddleOCR models verified ({len(PADDLEOCR_MODELS)} models)")

    # PaddleOCR-VL model directory must exist
    vl_name = PADDLEOCR_VL_MODEL.split("/", 1)[1]
    vl_dir = os.path.join(PADDLEX_MODEL_DIR, vl_name)
    assert os.path.isdir(vl_dir), f"PaddleOCR-VL model missing: {vl_dir}"
    print("  PaddleOCR-VL model verified")

    print("Smoke test passed.\n")


def main():
    print("Pre-downloading all ML models...\n")
    download_lama_model()
    download_rembg_models()
    download_realesrgan_model()
    download_gfpgan_model()
    download_paddleocr_models()
    download_paddleocr_vl_model()
    verify_mediapipe()
    smoke_test()
    print("All models downloaded and verified.")


if __name__ == "__main__":
    main()
