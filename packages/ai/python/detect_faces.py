"""Face detection and blurring using MediaPipe."""
import sys
import json


def emit_progress(percent, stage):
    """Emit structured progress to stderr for bridge.ts to capture."""
    print(json.dumps({"progress": percent, "stage": stage}), file=sys.stderr, flush=True)


def main():
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    settings = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}

    blur_radius = settings.get("blurRadius", 30)
    sensitivity = settings.get("sensitivity", 0.5)

    try:
        emit_progress(10, "Preparing")
        from PIL import Image, ImageFilter

        img = Image.open(input_path).convert("RGB")

        try:
            import mediapipe as mp
            import numpy as np

            emit_progress(20, "Ready")

            # Map sensitivity (0.1-0.9) to MediaPipe confidence threshold.
            # Higher sensitivity = lower confidence threshold = more detections.
            min_confidence = max(0.1, 1.0 - sensitivity)

            img_array = np.array(img)
            mp_face = mp.solutions.face_detection

            # Try short-range model first (model_selection=0, best for faces
            # within ~2m which covers most photos), then fall back to
            # full-range model (model_selection=1) for distant/group shots.
            emit_progress(25, "Scanning for faces")
            results = None
            for model_sel in [0, 1]:
                detector = mp_face.FaceDetection(
                    model_selection=model_sel,
                    min_detection_confidence=min_confidence,
                )
                results = detector.process(img_array)
                detector.close()
                if results.detections:
                    break

            faces = []
            detections = results.detections or []
            num_faces = len(detections)
            emit_progress(50, f"Found {num_faces} face{'s' if num_faces != 1 else ''}")

            if num_faces > 0:
                ih, iw = img_array.shape[:2]
                for i, detection in enumerate(detections):
                    bbox = detection.location_data.relative_bounding_box
                    x = int(bbox.xmin * iw)
                    y = int(bbox.ymin * ih)
                    w = int(bbox.width * iw)
                    h = int(bbox.height * ih)

                    # Add padding around the face
                    pad = int(max(w, h) * 0.1)
                    x1 = max(0, x - pad)
                    y1 = max(0, y - pad)
                    x2 = min(img.width, x + w + pad)
                    y2 = min(img.height, y + h + pad)

                    face_region = img.crop((x1, y1, x2, y2))
                    blurred = face_region.filter(
                        ImageFilter.GaussianBlur(blur_radius)
                    )
                    img.paste(blurred, (x1, y1))
                    faces.append({"x": x, "y": y, "w": w, "h": h})
                    emit_progress(
                        50 + int((i + 1) / num_faces * 40),
                        f"Blurring face {i + 1} of {num_faces}",
                    )

            emit_progress(95, "Saving result")
            img.save(output_path)
            print(
                json.dumps(
                    {
                        "success": True,
                        "facesDetected": len(faces),
                        "faces": faces,
                    }
                )
            )

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
