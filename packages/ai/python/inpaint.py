"""Object erasing / inpainting using LaMa or simple fallback."""
import sys
import json


def main():
    input_path = sys.argv[1]
    mask_path = sys.argv[2]
    output_path = sys.argv[3]

    try:
        from PIL import Image

        try:
            # Try lama-cleaner if available
            from lama_cleaner.model_manager import ModelManager
            from lama_cleaner.schema import Config

            img = Image.open(input_path).convert("RGB")
            mask = Image.open(mask_path).convert("L")

            # Resize mask to match image if needed
            if mask.size != img.size:
                mask = mask.resize(img.size, Image.NEAREST)

            import numpy as np

            img_array = np.array(img)
            mask_array = np.array(mask)

            model_manager = ModelManager(name="lama", device="cpu")
            config = Config(
                ldm_steps=25,
                ldm_sampler="plms",
                hd_strategy="Original",
                hd_strategy_crop_margin=128,
                hd_strategy_crop_trigger_size=800,
                hd_strategy_resize_limit=800,
            )
            result = model_manager(img_array, mask_array, config)
            Image.fromarray(result).save(output_path)
            method = "lama"

        except ImportError:
            # LaMa not available — report error instead of silently copying
            print(
                json.dumps(
                    {
                        "success": False,
                        "error": "Object eraser requires the lama-cleaner package. Install with: pip install lama-cleaner",
                    }
                )
            )
            sys.exit(1)
        except Exception as e:
            # LaMa installed but processing failed — still report error
            print(json.dumps({"success": False, "error": f"Inpainting failed: {str(e)}"}))
            sys.exit(1)

        print(json.dumps({"success": True, "method": method}))

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
