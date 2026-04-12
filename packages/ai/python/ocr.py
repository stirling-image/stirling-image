"""Text extraction from images using Tesseract, PaddleOCR PP-OCRv5, or PaddleOCR-VL 1.5."""
import sys
import json
import os

# Lazy-loaded VLM instance (stays resident in dispatcher process)
_paddleocr_vl_instance = None


def emit_progress(percent, stage):
    """Emit structured progress to stderr for bridge.ts to capture."""
    print(json.dumps({"progress": percent, "stage": stage}), file=sys.stderr, flush=True)


TESSERACT_LANG_MAP = {
    "en": "eng", "de": "deu", "fr": "fra", "es": "spa",
    "zh": "chi_sim", "ja": "jpn", "ko": "kor",
}

PADDLE_LANG_MAP = {
    "en": "en", "de": "latin", "fr": "latin", "es": "latin",
    "zh": "ch", "ja": "japan", "ko": "korean",
}


def auto_detect_language(input_path):
    """Detect script/language from image using PaddleOCR's det model.

    Returns a language code (e.g. "en", "zh") or "en" as fallback.
    """
    try:
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(lang="en", use_gpu=False, show_log=False, rec=False)
        result = ocr.ocr(input_path, rec=False)
        if result and result[0]:
            return "en"
    except Exception:
        pass
    return "en"


def run_tesseract(input_path, language):
    """Run Tesseract OCR (Fast tier)."""
    import subprocess

    tess_lang = TESSERACT_LANG_MAP.get(language, "eng")

    emit_progress(30, "Scanning")
    result = subprocess.run(
        ["tesseract", input_path, "stdout", "-l", tess_lang],
        capture_output=True,
        text=True,
        timeout=120,
    )
    emit_progress(70, "Extracting text")
    text = result.stdout.strip()
    if result.returncode != 0 and not text:
        raise RuntimeError(result.stderr.strip() or "Tesseract failed")
    return text


def run_paddleocr_v5(input_path, language):
    """Run PaddleOCR PP-OCRv5 server models (Balanced tier)."""
    os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

    stdout_fd = os.dup(1)
    os.dup2(2, 1)

    try:
        from paddleocr import PaddleOCR
        from gpu import gpu_available

        paddle_lang = PADDLE_LANG_MAP.get(language, "en")

        emit_progress(20, "Loading")
        ocr = PaddleOCR(
            lang=paddle_lang,
            use_gpu=gpu_available(),
            show_log=False,
            ocr_version="PP-OCRv5",
        )
        emit_progress(30, "Scanning")
        result = ocr.ocr(input_path)
        emit_progress(70, "Extracting text")
        text = "\n".join(
            [
                line[1][0]
                for res in result
                if res
                for line in res
                if line and line[1]
            ]
        )
    finally:
        os.dup2(stdout_fd, 1)
        os.close(stdout_fd)

    return text


def run_paddleocr_vl(input_path):
    """Run PaddleOCR-VL 1.5 vision-language model (Best tier).

    The VLM is lazy-loaded on first call and stays resident in the
    dispatcher process for subsequent requests.
    """
    global _paddleocr_vl_instance
    os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

    stdout_fd = os.dup(1)
    os.dup2(2, 1)

    try:
        if _paddleocr_vl_instance is None:
            emit_progress(15, "Loading model")
            from paddleocr import PaddleOCRVL
            from gpu import gpu_available

            device = "gpu" if gpu_available() else "cpu"
            _paddleocr_vl_instance = PaddleOCRVL(device=device)

        emit_progress(30, "Scanning")
        output = _paddleocr_vl_instance.predict(input_path)
        emit_progress(70, "Extracting text")

        text_parts = []
        for res in output:
            if hasattr(res, "parsing_res_list"):
                for block in res.parsing_res_list:
                    content = block.get("block_content", "")
                    if content:
                        text_parts.append(content)
            elif hasattr(res, "rec_text"):
                text_parts.append(res.rec_text)

        text = "\n".join(text_parts)
    finally:
        os.dup2(stdout_fd, 1)
        os.close(stdout_fd)

    return text


def main():
    input_path = sys.argv[1]
    settings = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}

    quality = settings.get("quality", None)
    language = settings.get("language", "auto")
    enhance = settings.get("enhance", True)

    # Backward compat: old "engine" param maps to quality
    if quality is None:
        engine = settings.get("engine", "tesseract")
        quality = "fast" if engine == "tesseract" else "balanced"

    try:
        emit_progress(5, "Preparing")

        # Preprocessing (if enabled)
        if enhance:
            emit_progress(8, "Enhancing image")
            try:
                from ocr_preprocess import preprocess
                preprocessed_path = input_path + "_enhanced.png"
                preprocess(input_path, preprocessed_path)
                input_path = preprocessed_path
            except Exception:
                pass

        # Language auto-detection
        if language == "auto":
            emit_progress(10, "Detecting language")
            language = auto_detect_language(input_path)

        # Route to engine based on quality tier
        if quality == "fast":
            try:
                text = run_tesseract(input_path, language)
            except FileNotFoundError:
                print(json.dumps({"success": False, "error": "Tesseract is not installed"}))
                sys.exit(1)

        elif quality == "balanced":
            try:
                text = run_paddleocr_v5(input_path, language)
            except ImportError:
                print(json.dumps({"success": False, "error": "PaddleOCR is not installed"}))
                sys.exit(1)
            except Exception:
                emit_progress(25, "Falling back")
                try:
                    text = run_tesseract(input_path, language)
                except FileNotFoundError:
                    print(json.dumps({"success": False, "error": "OCR engines unavailable"}))
                    sys.exit(1)

        elif quality == "best":
            try:
                text = run_paddleocr_vl(input_path)
            except ImportError:
                emit_progress(20, "Falling back")
                try:
                    text = run_paddleocr_v5(input_path, language)
                except Exception:
                    text = run_tesseract(input_path, language)
            except Exception:
                emit_progress(20, "Falling back")
                try:
                    text = run_paddleocr_v5(input_path, language)
                except Exception:
                    text = run_tesseract(input_path, language)

        else:
            print(json.dumps({"success": False, "error": f"Unknown quality: {quality}"}))
            sys.exit(1)

        emit_progress(95, "Done")
        print(json.dumps({"success": True, "text": text}))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
