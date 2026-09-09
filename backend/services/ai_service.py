"""
AI Inference Service — EfficientNet-B0 dental disease prediction + Grad-CAM.

Model is loaded ONCE at application startup via the lifespan context.
Preprocessing pipeline exactly matches the training notebook.
"""
import base64
import json
import logging
from io import BytesIO
from pathlib import Path
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from PIL import Image
from torchvision.models import efficientnet_b0

from config.settings import settings

logger = logging.getLogger(__name__)

# ─── Module-level globals (loaded once at startup) ─────────────────────────────
_model: Optional[nn.Module] = None
_class_names: list[str] = []
_disease_info: dict = {}
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Preprocessing transform — MUST match notebook exactly
_inference_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],   # ImageNet mean
        std=[0.229, 0.224, 0.225],    # ImageNet std
    )
])


# ─── Grad-CAM Implementation ──────────────────────────────────────────────────

class GradCAM:
    """
    Gradient-weighted Class Activation Mapping for EfficientNet-B0.
    Target layer: model.features[-1] (the last convolutional block).
    """

    def __init__(self, model: nn.Module):
        self.model = model
        self.gradients: Optional[torch.Tensor] = None
        self.activations: Optional[torch.Tensor] = None
        self._hooks: list = []

    def _register_hooks(self) -> None:
        """Register forward and backward hooks on the last feature block."""
        target_layer = self.model.features[-1]

        def save_activation(module, input, output):
            self.activations = output.detach()

        def save_gradient(module, grad_input, grad_output):
            self.gradients = grad_output[0].detach()

        self._hooks.append(target_layer.register_forward_hook(save_activation))
        self._hooks.append(target_layer.register_full_backward_hook(save_gradient))

    def _remove_hooks(self) -> None:
        for h in self._hooks:
            h.remove()
        self._hooks.clear()

    def generate(
        self, input_tensor: torch.Tensor, class_idx: int
    ) -> np.ndarray:
        """
        Generate Grad-CAM heatmap.

        Args:
            input_tensor: Preprocessed image tensor (1, C, H, W).
            class_idx: Target class index.

        Returns:
            Numpy heatmap array (224, 224) with values in [0, 1].
        """
        self._register_hooks()
        self.model.zero_grad()

        output = self.model(input_tensor)
        output[0, class_idx].backward()

        # Compute weights: global average pooling on gradients
        weights = self.gradients.mean(dim=(2, 3), keepdim=True)  # (1, C, 1, 1)
        cam = (weights * self.activations).sum(dim=1).squeeze()   # (H, W)
        cam = torch.relu(cam)

        # Normalize to [0, 1]
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max > cam_min:
            cam = (cam - cam_min) / (cam_max - cam_min)

        self._remove_hooks()
        return cam.cpu().numpy()


# ─── Model Loading ─────────────────────────────────────────────────────────────

def load_model() -> None:
    """
    Load EfficientNet-B0 model and class mapping at startup.
    Called once by FastAPI lifespan context manager.
    """
    global _model, _class_names, _disease_info

    try:
        model_path = settings.model_path_resolved
        if not model_path.exists():
            alt_paths = [
                Path(__file__).parent.parent / "models" / "efficientnet_b0_dental.pth",
                Path(__file__).parent.parent.parent / "efficientnet_b0_dental.pth",
                Path(__file__).parent.parent / "efficientnet_b0_dental.pth",
            ]
            for p in alt_paths:
                if p.exists():
                    model_path = p
                    break

        class_mapping_path = settings.class_mapping_path_resolved
        if not class_mapping_path.exists():
            alt_m = Path(__file__).parent.parent / "models" / "class_mapping.json"
            if alt_m.exists():
                class_mapping_path = alt_m

        disease_info_path = settings.disease_info_path_resolved
        if not disease_info_path.exists():
            alt_d = Path(__file__).parent.parent / "models" / "disease_info.json"
            if alt_d.exists():
                disease_info_path = alt_d

        logger.info(f"Loading model from: {model_path}")
        if not model_path.exists():
            logger.error(f"Model file not found at {model_path}. Prediction endpoint will return 503 until uploaded.")
            return

        # Build EfficientNet-B0 architecture
        model = efficientnet_b0(weights=None)
        num_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(num_features, 6)

        # Load trained state dict
        state_dict = torch.load(model_path, map_location=_device, weights_only=True)
        model.load_state_dict(state_dict)
        model.to(_device)
        model.eval()
        _model = model
        logger.info(f"Model loaded successfully on device: {_device}")

        if class_mapping_path.exists():
            with open(class_mapping_path, "r") as f:
                mapping = json.load(f)
            _class_names = [mapping[str(i)] for i in range(len(mapping))]
            logger.info(f"Classes loaded: {_class_names}")

        if disease_info_path.exists():
            with open(disease_info_path, "r") as f:
                _disease_info = json.load(f)
            logger.info("Disease info loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load ML model on startup: {e}")


# ─── Inference ────────────────────────────────────────────────────────────────

async def predict_disease(image_bytes: bytes) -> dict:
    """
    Run EfficientNet-B0 inference on an uploaded image.

    Args:
        image_bytes: Raw bytes of the uploaded image file.

    Returns:
        dict with keys:
            - predicted_class (str)
            - class_index (int)
            - confidence (float, 0–100)
            - top3 (list of {class, confidence})
            - gradcam_base64 (str — base64 PNG)
            - gradcam_overlay_base64 (str — base64 PNG, overlaid on original)
            - disease_info (dict)
    """
    if _model is None:
        raise RuntimeError("Model not loaded. Ensure load_model() was called at startup.")

    # ── Decode and preprocess image ──────────────────────────────────────────
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    original_size = image.size  # (W, H) — for overlay

    input_tensor = _inference_transform(image).unsqueeze(0).to(_device)  # (1, 3, 224, 224)

    # ── Forward pass ─────────────────────────────────────────────────────────
    with torch.no_grad():
        logits = _model(input_tensor)

    probabilities = torch.softmax(logits, dim=1).squeeze()  # (6,)
    confidence_scores = probabilities.cpu().numpy()

    predicted_idx = int(np.argmax(confidence_scores))
    predicted_class = _class_names[predicted_idx]
    confidence = float(confidence_scores[predicted_idx]) * 100

    # Top-3 predictions
    top3_indices = np.argsort(confidence_scores)[::-1][:3]
    top3 = [
        {
            "class": _class_names[int(i)],
            "confidence": round(float(confidence_scores[i]) * 100, 2),
        }
        for i in top3_indices
    ]

    # ── Grad-CAM ─────────────────────────────────────────────────────────────
    # Re-enable gradient computation for Grad-CAM
    input_tensor_grad = _inference_transform(image).unsqueeze(0).to(_device)
    input_tensor_grad.requires_grad_(True)

    gradcam = GradCAM(_model)
    heatmap = gradcam.generate(input_tensor_grad, predicted_idx)  # (H_feat, W_feat)

    # Generate heatmap overlay on original image
    gradcam_base64, overlay_base64 = _render_gradcam(image, heatmap)

    # ── Disease info ─────────────────────────────────────────────────────────
    info = _disease_info.get(predicted_class, {})

    return {
        "predicted_class": predicted_class,
        "class_index": predicted_idx,
        "confidence": round(confidence, 2),
        "all_confidences": {_class_names[i]: round(float(confidence_scores[i]) * 100, 2) for i in range(6)},
        "top3": top3,
        "gradcam_base64": gradcam_base64,
        "gradcam_overlay_base64": overlay_base64,
        "disease_info": info,
    }


def _render_gradcam(
    original_image: Image.Image, heatmap: np.ndarray
) -> tuple[str, str]:
    """
    Render Grad-CAM heatmap and overlay on original image.

    Returns:
        Tuple of (pure_heatmap_base64, overlay_base64) as PNG base64 strings.
    """
    import cv2

    # Resize heatmap to 224x224 for display
    heatmap_resized = cv2.resize(heatmap, (224, 224))
    heatmap_uint8 = np.uint8(255 * heatmap_resized)

    # Apply colormap (Jet: blue→green→yellow→red)
    heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

    # Pure heatmap → base64
    heatmap_pil = Image.fromarray(heatmap_rgb)
    buf = BytesIO()
    heatmap_pil.save(buf, format="PNG")
    pure_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    # Overlay heatmap on original (resize original to 224x224 for consistency)
    original_resized = original_image.resize((224, 224))
    original_np = np.array(original_resized)

    overlay = cv2.addWeighted(original_np, 0.6, heatmap_rgb, 0.4, 0)
    overlay_pil = Image.fromarray(overlay)
    buf2 = BytesIO()
    overlay_pil.save(buf2, format="PNG")
    overlay_b64 = base64.b64encode(buf2.getvalue()).decode("utf-8")

    return pure_b64, overlay_b64


def get_disease_info(disease_name: str) -> dict:
    """Get disease information by name."""
    return _disease_info.get(disease_name, {})


def get_all_disease_info() -> dict:
    """Get all disease information."""
    return _disease_info


def get_class_names() -> list[str]:
    """Get list of class names."""
    return _class_names.copy()
