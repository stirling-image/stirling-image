"""Runtime GPU/CUDA detection utility."""
import functools
import json
import os
import subprocess
import sys


def emit_info(msg):
    """Emit an informational JSON message to stderr for the bridge to capture."""
    print(json.dumps({"info": msg}), file=sys.stderr, flush=True)


def _nvidia_smi_gpu_name():
    """Return GPU name from nvidia-smi, or None if unavailable."""
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    return None


@functools.lru_cache(maxsize=1)
def gpu_available():
    """Return True if a usable CUDA GPU is present at runtime."""
    override = os.environ.get("SNAPOTTER_GPU")
    if override is not None and override.lower() in ("0", "false", "no"):
        return False

    # Try torch first -- it probes the hardware directly.
    torch_available = _try_torch_cuda()
    if torch_available:
        return True

    # torch either isn't installed or can't use CUDA. Fall through to
    # ONNX Runtime + nvidia-smi so ONNX-based tools can still use GPU.
    onnx_available = _try_onnx_cuda()
    if onnx_available:
        return True

    # Last resort: check nvidia-smi alone. The GPU is present even if
    # neither torch nor ONNX Runtime can use it (e.g. CPU-only packages).
    gpu_name = _nvidia_smi_gpu_name()
    if gpu_name:
        print(f"[gpu] nvidia-smi found GPU ({gpu_name}) but neither torch "
              "nor ONNX Runtime can use it -- reinstall AI features for GPU support",
              file=sys.stderr, flush=True)
    return False


def _try_torch_cuda():
    """Check GPU via torch.cuda. Returns True if CUDA is usable."""
    try:
        import torch
    except ImportError as e:
        print(f"[gpu] torch not importable: {e}", file=sys.stderr, flush=True)
        return False

    if torch.cuda.is_available():
        name = torch.cuda.get_device_name(0)
        print(f"[gpu] CUDA available via torch: {name}", file=sys.stderr, flush=True)
        return True

    # CUDA not available -- diagnose why.
    cuda_version = getattr(torch.version, "cuda", None)
    if not cuda_version:
        gpu_name = _nvidia_smi_gpu_name()
        if gpu_name:
            print(f"[gpu] torch is a CPU-only build but GPU is present ({gpu_name}) "
                  "-- reinstall AI features to get CUDA support",
                  file=sys.stderr, flush=True)
        else:
            print("[gpu] torch is a CPU-only build and no GPU detected",
                  file=sys.stderr, flush=True)
        return False

    # torch has CUDA compiled in but can't access the GPU.
    diag = [f"torch has CUDA {cuda_version} but cannot access GPU"]
    ld_path = os.environ.get("LD_LIBRARY_PATH", "")
    diag.append(f"LD_LIBRARY_PATH={'<empty>' if not ld_path else ld_path}")
    try:
        torch.cuda.init()
    except RuntimeError as e:
        diag.append(f"torch.cuda.init(): {e}")
    gpu_name = _nvidia_smi_gpu_name()
    if gpu_name:
        diag.append(f"nvidia-smi sees GPU ({gpu_name}) but torch cannot use it")
    else:
        diag.append("nvidia-smi also cannot find a GPU")
    print(f"[gpu] {'; '.join(diag)}", file=sys.stderr, flush=True)
    return False


def _try_onnx_cuda():
    """Check GPU via ONNX Runtime CUDAExecutionProvider + nvidia-smi."""
    try:
        import onnxruntime as _ort
        providers = _ort.get_available_providers()
        if "CUDAExecutionProvider" not in providers:
            return False
        gpu_name = _nvidia_smi_gpu_name()
        if gpu_name:
            print(f"[gpu] CUDA available via ONNX Runtime + nvidia-smi: {gpu_name}",
                  file=sys.stderr, flush=True)
            return True
        return False
    except (ImportError, FileNotFoundError, subprocess.TimeoutExpired):
        return False


def onnx_providers():
    """Return (providers, device) tuple.

    providers: ONNX Runtime execution providers in priority order.
    device: "cuda" or "cpu" -- reflects which hardware will actually be used.
    """
    if gpu_available():
        try:
            import onnxruntime as _ort
            available = _ort.get_available_providers()
            if "CUDAExecutionProvider" in available:
                return (["CUDAExecutionProvider", "CPUExecutionProvider"], "cuda")
            emit_info("GPU detected by torch but CUDAExecutionProvider not available in onnxruntime "
                      "-- install onnxruntime-gpu for GPU acceleration")
        except ImportError:
            emit_info("onnxruntime not installed, cannot check CUDA provider")
    emit_info("No GPU detected, processing on CPU")
    return (["CPUExecutionProvider"], "cpu")


def safe_onnx_session(model_path, providers=None):
    """Create an ONNX Runtime InferenceSession with graceful CUDA EP fallback.

    Returns (session, device) where device is "cuda" or "cpu".
    """
    import onnxruntime as ort

    device = "cpu"
    if providers is None:
        providers, device = onnx_providers()

    try:
        session = ort.InferenceSession(model_path, providers=providers)
        return session, device
    except Exception as e:
        if "CUDAExecutionProvider" in providers:
            emit_info(f"CUDA init failed ({e}), falling back to CPU")
            session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
            return session, "cpu"
        raise
