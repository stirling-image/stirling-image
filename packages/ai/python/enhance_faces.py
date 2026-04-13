"""Face enhancement using GFPGAN or CodeFormer with MediaPipe detection."""
import sys
import json
import os

# Patch for basicsr compatibility with torchvision >= 0.18.
# torchvision removed transforms.functional_tensor, merging it into
# transforms.functional. basicsr still imports the old path, so we
# create a shim module to redirect the import.
try:
    import torchvision.transforms.functional_tensor  # noqa: F401
except (ImportError, ModuleNotFoundError):
    try:
        import types
        import torchvision.transforms.functional as _F

        _shim = types.ModuleType("torchvision.transforms.functional_tensor")
        _shim.rgb_to_grayscale = _F.rgb_to_grayscale
        sys.modules["torchvision.transforms.functional_tensor"] = _shim
    except ImportError:
        pass  # torchvision not installed at all


def emit_progress(percent, stage):
    """Emit structured progress to stderr for bridge.ts to capture."""
    print(json.dumps({"progress": percent, "stage": stage}), file=sys.stderr, flush=True)


GFPGAN_MODEL_PATH = os.environ.get(
    "GFPGAN_MODEL_PATH",
    "/opt/models/gfpgan/GFPGANv1.3.pth",
)

CODEFORMER_MODEL_PATH = os.environ.get(
    "CODEFORMER_MODEL_PATH",
    "/opt/models/codeformer/codeformer.pth",
)


def detect_faces_mediapipe(img_array, sensitivity):
    """Detect faces using MediaPipe with dual-model approach.

    Returns a list of {x, y, w, h} dicts for each detected face.
    """
    import mediapipe as mp

    min_confidence = max(0.1, 1.0 - sensitivity)
    mp_face = mp.solutions.face_detection

    # Try short-range model first (model_selection=0, best for faces
    # within ~2m which covers most photos), then fall back to
    # full-range model (model_selection=1) for distant/group shots.
    detections = []
    for model_sel in [0, 1]:
        detector = mp_face.FaceDetection(
            model_selection=model_sel,
            min_detection_confidence=min_confidence,
        )
        results = detector.process(img_array)
        detector.close()
        if results.detections:
            detections = results.detections
            break

    if not detections:
        return []

    ih, iw = img_array.shape[:2]
    faces = []
    for detection in detections:
        bbox = detection.location_data.relative_bounding_box
        x = int(bbox.xmin * iw)
        y = int(bbox.ymin * ih)
        w = int(bbox.width * iw)
        h = int(bbox.height * ih)
        faces.append({"x": x, "y": y, "w": w, "h": h})

    return faces


def enhance_with_gfpgan(img_array, only_center_face):
    """Enhance faces using GFPGAN. Returns the enhanced image array."""
    from gfpgan import GFPGANer

    if not os.path.exists(GFPGAN_MODEL_PATH):
        raise FileNotFoundError(f"GFPGAN model not found: {GFPGAN_MODEL_PATH}")

    enhancer = GFPGANer(
        model_path=GFPGAN_MODEL_PATH,
        upscale=1,
        arch="clean",
        channel_multiplier=2,
        bg_upsampler=None,
    )
    _, _, output = enhancer.enhance(
        img_array,
        has_aligned=False,
        only_center_face=only_center_face,
        paste_back=True,
    )
    return output


def enhance_with_codeformer(img_array, fidelity_weight):
    """Enhance faces using CodeFormer via codeformer-pip.

    The codeformer-pip package provides inference_app() which handles
    face detection, alignment, restoration, and paste-back internally.
    fidelity_weight controls quality vs fidelity (0 = quality, 1 = fidelity).

    NOTE: codeformer-pip's app.py runs heavy module-level initialization
    (model downloads, GPU setup) on import. The Docker image must place
    model weights where the package expects them, or set environment
    variables so the download step succeeds. If the import or inference
    fails, the auto model selection will fall back to GFPGAN.
    """
    import numpy as np

    # Import may fail if codeformer-pip is not installed or if the
    # module-level model loading fails (missing weights, no GPU, etc.)
    from codeformer.app import inference_app

    # inference_app accepts a numpy array (BGR) or file path.
    # It returns the restored image as a BGR numpy array.
    # We pass our RGB array converted to BGR since OpenCV convention is used internally.
    img_bgr = img_array[:, :, ::-1].copy()
    restored_bgr = inference_app(
        image=img_bgr,
        background_enhance=False,
        face_upsample=False,
        upscale=1,
        codeformer_fidelity=fidelity_weight,
    )
    # Convert back to RGB
    restored_rgb = restored_bgr[:, :, ::-1].copy()
    return restored_rgb


def main():
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    settings = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}

    model_choice = settings.get("model", "auto")
    strength = float(settings.get("strength", 0.8))
    only_center_face = settings.get("onlyCenterFace", False)
    sensitivity = float(settings.get("sensitivity", 0.5))

    try:
        emit_progress(10, "Preparing")
        from PIL import Image
        import numpy as np

        img = Image.open(input_path).convert("RGB")
        img_array = np.array(img)

        # Detect faces with MediaPipe
        try:
            emit_progress(20, "Scanning for faces")
            faces = detect_faces_mediapipe(img_array, sensitivity)
        except ImportError:
            print(
                json.dumps(
                    {
                        "success": False,
                        "error": "Face detection requires MediaPipe. Install with: pip install mediapipe",
                    }
                )
            )
            sys.exit(1)

        num_faces = len(faces)
        emit_progress(30, f"Found {num_faces} face{'s' if num_faces != 1 else ''}")

        # No faces found - save original unchanged
        if num_faces == 0:
            img.save(output_path)
            print(
                json.dumps(
                    {
                        "success": True,
                        "facesDetected": 0,
                        "faces": [],
                        "model": "none",
                    }
                )
            )
            return

        emit_progress(40, "Loading AI model")

        # Redirect stdout to stderr for the ENTIRE AI pipeline.
        # Libraries like basicsr, gfpgan, and torch print download
        # progress and init messages to stdout which would corrupt
        # our JSON result.
        stdout_fd = os.dup(1)
        os.dup2(2, 1)

        enhanced = None
        model_used = None

        try:
            if model_choice == "gfpgan":
                enhanced = enhance_with_gfpgan(img_array, only_center_face)
                model_used = "gfpgan"

            elif model_choice == "codeformer":
                fidelity_weight = 1.0 - strength
                enhanced = enhance_with_codeformer(img_array, fidelity_weight)
                model_used = "codeformer"

            elif model_choice == "auto":
                # Try CodeFormer first, fall back to GFPGAN.
                # Catch broad Exception because codeformer-pip can fail in
                # unexpected ways (AttributeError, TypeError, etc.)
                try:
                    fidelity_weight = 1.0 - strength
                    enhanced = enhance_with_codeformer(img_array, fidelity_weight)
                    model_used = "codeformer"
                except Exception:
                    enhanced = enhance_with_gfpgan(img_array, only_center_face)
                    model_used = "gfpgan"

        finally:
            # Restore stdout after ALL AI processing
            os.dup2(stdout_fd, 1)
            os.close(stdout_fd)

        if enhanced is None:
            raise RuntimeError("Face enhancement failed: no model available")

        emit_progress(85, "Enhancement complete")

        # Alpha blend result with original based on strength.
        # For CodeFormer, strength is already applied via fidelity_weight,
        # so skip the blend to avoid double-applying.
        # For GFPGAN (which has no fidelity knob), blend with original.
        if strength < 1.0 and model_used != "codeformer":
            blended = (
                img_array.astype(np.float32) * (1.0 - strength)
                + enhanced.astype(np.float32) * strength
            )
            enhanced = np.clip(blended, 0, 255).astype(np.uint8)

        emit_progress(95, "Saving result")
        Image.fromarray(enhanced).save(output_path)

        print(
            json.dumps(
                {
                    "success": True,
                    "facesDetected": num_faces,
                    "faces": faces,
                    "model": model_used,
                }
            )
        )

    except ImportError:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": "Pillow is not installed. Install with: pip install Pillow",
                }
            )
        )
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
