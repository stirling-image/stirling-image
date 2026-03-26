"""Face detection and blurring using OpenCV."""
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
            import cv2
            import numpy as np

            emit_progress(20, "Ready")

            # Load Haar cascade for face detection
            haar_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            face_cascade = cv2.CascadeClassifier(haar_path)

            # Convert to grayscale for detection
            img_array = np.array(img)
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

            # Map sensitivity (0.1-0.9) to minNeighbors (8-2)
            # Higher sensitivity = fewer required neighbors = more detections
            min_neighbors = max(2, int(8 - sensitivity * 7))

            emit_progress(25, "Scanning for faces")
            faces_detected = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=min_neighbors,
                minSize=(30, 30),
            )

            faces = []
            num_faces = len(faces_detected)
            emit_progress(50, f"Found {num_faces} face{'s' if num_faces != 1 else ''}")

            if num_faces > 0:
                for i, (x, y, w, h) in enumerate(faces_detected):
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
                    faces.append({"x": int(x), "y": int(y), "w": int(w), "h": int(h)})
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
                        "error": "Face detection requires OpenCV. Install with: pip install opencv-python-headless",
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
