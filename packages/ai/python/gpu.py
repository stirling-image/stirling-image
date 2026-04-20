"""Runtime GPU/CUDA detection utility."""
import ctypes
import functools
import os
import sys


@functools.lru_cache(maxsize=1)
def gpu_available():
    """Return True if a usable CUDA GPU is present at runtime."""
    # Allow explicit disable via env var (set to "false" or "0")
    override = os.environ.get("ASHIM_GPU")
    if override is not None and override.lower() in ("0", "false", "no"):
        return False

    # Use torch.cuda as the source of truth when available. It actually
    # probes the hardware. Fall back to onnxruntime provider detection
    # when torch is not installed (e.g. CPU-only images without PyTorch).
    try:
        import torch
        avail = torch.cuda.is_available()
        if avail:
            name = torch.cuda.get_device_name(0)
            print(f"[gpu] CUDA available via torch: {name}", file=sys.stderr, flush=True)
        else:
            print("[gpu] torch loaded but CUDA not available", file=sys.stderr, flush=True)
        return avail
    except ImportError as e:
        print(f"[gpu] torch not importable: {e}", file=sys.stderr, flush=True)

    # Fallback: check if onnxruntime's CUDA provider can actually load.
    # get_available_providers() only reports *compiled-in* backends, not whether
    # the required libraries (cuDNN, etc.) are present at runtime.  We verify
    # by creating a minimal CUDA session — this transitively checks that cuDNN
    # and all required libraries are present.
    try:
        import onnxruntime as _ort
        providers = _ort.get_available_providers()
        if "CUDAExecutionProvider" not in providers:
            return False
        # Smoke-test: create a session with CUDA to verify libraries load
        import numpy as _np
        _ort.InferenceSession(
            _np.zeros(0, dtype=_np.uint8).tobytes(),
            providers=["CUDAExecutionProvider"],
        )
        # If we get here without error, CUDA provider is functional
        # (the empty model will fail, but the provider DLLs loaded)
        return True
    except Exception as e:
        # CUDA provider may report as available but fail to load (missing cuDNN, etc.)
        # Any error here means CUDA isn't usable — fall back to CPU
        err_str = str(e).lower()
        if "cuda" in err_str or "cudnn" in err_str or "provider" in err_str:
            print(f"[gpu] ONNX CUDA provider not functional: {e}", file=sys.stderr, flush=True)
        return False


def onnx_providers():
    """Return ONNX Runtime execution providers in priority order."""
    if gpu_available():
        return ["CUDAExecutionProvider", "CPUExecutionProvider"]
    return ["CPUExecutionProvider"]
