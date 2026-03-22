"""Background removal using rembg."""
import sys
import json


def main():
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    settings = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}

    model = settings.get("model", "u2net")

    try:
        from rembg import remove

        with open(input_path, "rb") as f:
            input_data = f.read()

        # Try with alpha matting first for better edges, but fall back
        # without it if the image triggers the known rembg matting error
        try:
            output_data = remove(
                input_data,
                alpha_matting=True,
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
            )
        except Exception:
            output_data = remove(input_data)

        with open(output_path, "wb") as f:
            f.write(output_data)

        print(json.dumps({"success": True, "model": model}))

    except ImportError:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": "rembg is not installed. Install with: pip install rembg[cpu]",
                }
            )
        )
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
