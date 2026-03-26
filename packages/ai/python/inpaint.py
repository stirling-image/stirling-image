"""Object erasing / inpainting using OpenCV."""
import sys
import json


def emit_progress(percent, stage):
    """Emit structured progress to stderr for bridge.ts to capture."""
    print(json.dumps({"progress": percent, "stage": stage}), file=sys.stderr, flush=True)


def main():
    input_path = sys.argv[1]
    mask_path = sys.argv[2]
    output_path = sys.argv[3]

    try:
        emit_progress(10, "Preparing")
        from PIL import Image

        try:
            import cv2
            import numpy as np

            emit_progress(20, "Ready")

            img = Image.open(input_path).convert("RGB")
            mask = Image.open(mask_path).convert("L")

            # Resize mask to match image if needed
            emit_progress(30, "Analyzing mask")
            if mask.size != img.size:
                mask = mask.resize(img.size, Image.NEAREST)

            img_array = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            mask_array = np.array(mask)

            # Threshold mask to binary (ensure clean white/black)
            _, mask_binary = cv2.threshold(mask_array, 127, 255, cv2.THRESH_BINARY)

            # Inpaint radius scales with image size for better results
            inpaint_radius = max(3, min(img_array.shape[0], img_array.shape[1]) // 200)

            emit_progress(50, "Erasing")
            result = cv2.inpaint(img_array, mask_binary, inpaint_radius, cv2.INPAINT_TELEA)

            emit_progress(90, "Saving")
            result_rgb = cv2.cvtColor(result, cv2.COLOR_BGR2RGB)
            Image.fromarray(result_rgb).save(output_path)

            print(json.dumps({"success": True, "method": "opencv-telea"}))

        except ImportError:
            print(
                json.dumps(
                    {
                        "success": False,
                        "error": "Object eraser requires OpenCV. Install with: pip install opencv-python-headless",
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
