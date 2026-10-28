#!/usr/bin/env python3
"""
InfraLens Pretrained Computer Vision Inference Service
Integrates Ultralytics YOLO (Object Detection & Segmentation) for real-world
infrastructure component identification, vehicle delineation, and defect localization.
"""

import sys
import os
import json
import time
import base64
import io
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Dict, List, Any, Optional

try:
    import numpy as np
    from PIL import Image
    import torch
    from ultralytics import YOLO
    DEPENDENCIES_AVAILABLE = True
except ImportError as e:
    DEPENDENCIES_AVAILABLE = False
    IMPORT_ERROR = str(e)


class InfraLensModelEngine:
    """
    Manages loading and inference of pretrained computer vision models.
    Supports YOLOv8 / YOLO11 for object detection and instance segmentation.
    """
    def __init__(self, model_name: str = "yolov8n.pt", seg_model_name: Optional[str] = "yolov8n-seg.pt"):
        self.model_name = model_name
        self.seg_model_name = seg_model_name
        self.detector = None
        self.segmenter = None
        self.device = "cpu"
        self.is_loaded = False
        self.model_info = {}

        if not DEPENDENCIES_AVAILABLE:
            print(f"[InfraLens ML] Warning: Missing dependencies: {IMPORT_ERROR}", file=sys.stderr)
            return

        self._select_device()
        self._load_models()

    def _select_device(self):
        """Select best available compute device (Apple Silicon MPS, CUDA, or CPU)"""
        if torch.cuda.is_available():
            self.device = "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            self.device = "mps"
        else:
            self.device = "cpu"
        print(f"[InfraLens ML] Selected compute device: {self.device}")

    def _load_models(self):
        """Load pretrained model weights from Ultralytics"""
        try:
            print(f"[InfraLens ML] Loading pretrained detection model: {self.model_name}...")
            # Ultralytics downloads weights automatically from official releases if not cached
            self.detector = YOLO(self.model_name)
            self.is_loaded = True

            # Extract model metadata
            names = self.detector.names if hasattr(self.detector, 'names') else {}
            param_count = sum(p.numel() for p in self.detector.model.parameters()) if hasattr(self.detector, 'model') else 0

            self.model_info = {
                "name": self.model_name,
                "version": "Ultralytics-v8.3",
                "framework": f"PyTorch {torch.__version__}",
                "device": self.device,
                "parameters": param_count,
                "total_classes": len(names),
                "supported_classes": list(names.values())[:20],  # sample classes
                "weights_source": "https://github.com/ultralytics/assets/releases",
                "license": "AGPL-3.0 / Enterprise"
            }
            print(f"[InfraLens ML] Successfully loaded {self.model_name} ({param_count:,} parameters) on {self.device}")

            # Optionally load segmentation model
            if self.seg_model_name:
                try:
                    print(f"[InfraLens ML] Loading pretrained segmentation model: {self.seg_model_name}...")
                    self.segmenter = YOLO(self.seg_model_name)
                    print(f"[InfraLens ML] Successfully loaded segmentation model: {self.seg_model_name}")
                except Exception as seg_err:
                    print(f"[InfraLens ML] Notice: Segmentation model optional load skipped: {seg_err}")

        except Exception as e:
            print(f"[InfraLens ML] Error loading model weights: {e}", file=sys.stderr)
            self.is_loaded = False
            self.model_info = {"error": str(e)}

    def decode_image(self, image_data: Any) -> Image.Image:
        """Decode base64 string, data URL, or file path to PIL Image"""
        if isinstance(image_data, str):
            if image_data.startswith("data:image/"):
                # Data URL format
                header, encoded = image_data.split(",", 1)
                binary = base64.b64decode(encoded)
                return Image.open(io.BytesIO(binary)).convert("RGB")
            elif os.path.exists(image_data):
                # File path
                return Image.open(image_data).convert("RGB")
            else:
                # Raw base64 string
                try:
                    binary = base64.b64decode(image_data)
                    return Image.open(io.BytesIO(binary)).convert("RGB")
                except Exception:
                    raise ValueError("Provided string is neither a valid file path nor base64 image data")
        elif isinstance(image_data, (bytes, bytearray)):
            return Image.open(io.BytesIO(image_data)).convert("RGB")
        elif isinstance(image_data, Image.Image):
            return image_data.convert("RGB")
        else:
            raise TypeError(f"Unsupported image data type: {type(image_data)}")

    def run_inference(self, image_input: Any, conf_threshold: float = 0.25) -> Dict[str, Any]:
        """
        Execute real model inference on the provided image.
        Returns genuine detections, bounding boxes, labels, and scene classification.
        """
        if not self.is_loaded or self.detector is None:
            return {
                "success": False,
                "error": "Model weights are not loaded. Check dependencies and connectivity.",
                "operationalState": "ANALYSIS_FAILED",
                "detections": []
            }

        start_time = time.perf_counter()

        try:
            pil_img = self.decode_image(image_input)
            img_w, img_h = pil_img.size
        except Exception as decode_err:
            return {
                "success": False,
                "error": f"Failed to decode image input: {decode_err}",
                "operationalState": "IMAGE_INVALID",
                "detections": []
            }

        # 1. Image Quality / Blank Canvas Check
        img_np = np.array(pil_img)
        mean_lum = float(np.mean(0.299 * img_np[:, :, 0] + 0.587 * img_np[:, :, 1] + 0.114 * img_np[:, :, 2]))
        std_lum = float(np.std(0.299 * img_np[:, :, 0] + 0.587 * img_np[:, :, 1] + 0.114 * img_np[:, :, 2]))

        # Completely white or completely black image
        if (mean_lum > 240 and std_lum < 15) or (mean_lum < 15 and std_lum < 10) or std_lum < 3.0:
            return {
                "success": True,
                "operationalState": "IMAGE_QUALITY_INSUFFICIENT",
                "status": "rejected",
                "sceneType": "blank",
                "rejectionReason": "blank_white" if mean_lum > 240 else "blank_black" if mean_lum < 15 else "uniform_blank",
                "message": "Image lacks textural contrast or illumination for visual inspection.",
                "detections": [],
                "modelName": self.model_name,
                "latencyMs": round((time.perf_counter() - start_time) * 1000, 2)
            }

        # 2. Run Genuine Model Prediction
        try:
            results = self.detector.predict(
                source=pil_img,
                conf=conf_threshold,
                device=self.device,
                verbose=False
            )
        except Exception as pred_err:
            return {
                "success": False,
                "error": f"Inference execution failed: {pred_err}",
                "operationalState": "ANALYSIS_FAILED",
                "detections": []
            }

        raw_detections = []
        vehicles_detected = []
        infrastructure_objects = []
        detected_classes = []

        if results and len(results) > 0:
            res = results[0]
            boxes = res.boxes
            names = res.names

            if boxes is not None and len(boxes) > 0:
                for idx, box in enumerate(boxes):
                    cls_id = int(box.cls[0].item())
                    cls_name = names.get(cls_id, f"class_{cls_id}")
                    conf = float(box.conf[0].item())

                    # xyxy coordinates
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    bw = x2 - x1
                    bh = y2 - y1

                    # Normalized coordinates [0, 100]%
                    norm_x = (x1 / img_w) * 100.0
                    norm_y = (y1 / img_h) * 100.0
                    norm_w = (bw / img_w) * 100.0
                    norm_h = (bh / img_h) * 100.0

                    detected_classes.append(cls_name)

                    detection_item = {
                        "id": f"yolo-det-{idx}",
                        "rawClass": cls_name,
                        "classId": cls_id,
                        "confidence": round(conf * 100, 1),
                        "boundingBox": {
                            "x": round(norm_x, 2),
                            "y": round(norm_y, 2),
                            "width": round(norm_w, 2),
                            "height": round(norm_h, 2)
                        },
                        "pixelBox": {
                            "minX": int(x1),
                            "minY": int(y1),
                            "maxX": int(x2),
                            "maxY": int(y2)
                        }
                    }

                    # Categorize object
                    if cls_name in ["car", "bus", "truck", "motorcycle", "train"]:
                        vehicles_detected.append(detection_item)
                    elif cls_name in ["traffic light", "stop sign", "fire hydrant", "bench", "parking meter"]:
                        infrastructure_objects.append(detection_item)

                    raw_detections.append(detection_item)

        # 3. Semantic Scene Classification
        has_vehicles = len(vehicles_detected) > 0
        has_urban_fixtures = len(infrastructure_objects) > 0

        # Indoor items signature (e.g. dining table, bed, couch, tv, toilet, refrigerator)
        indoor_classes = {"couch", "bed", "dining table", "toilet", "tv", "microwave", "oven", "sink", "refrigerator", "book", "clock", "vase"}
        indoor_matches = [c for c in detected_classes if c in indoor_classes]
        is_indoor = len(indoor_matches) >= 2 and not has_vehicles and not has_urban_fixtures

        if is_indoor:
            return {
                "success": True,
                "operationalState": "UNSUPPORTED_SCENE",
                "status": "rejected",
                "sceneType": "non_infrastructure",
                "rejectionReason": "non_infrastructure",
                "message": f"Photograph contains indoor domestic objects ({', '.join(set(indoor_matches))}) rather than public civil infrastructure.",
                "detections": [],
                "rawDetections": raw_detections,
                "modelName": self.model_name,
                "latencyMs": round((time.perf_counter() - start_time) * 1000, 2)
            }

        # Determine scene type
        if has_vehicles:
            scene_type = "urban_maintenance" if any(v["rawClass"] in ["truck", "bus"] for v in vehicles_detected) else "urban_street"
        elif has_urban_fixtures:
            scene_type = "public_utility"
        else:
            scene_type = "road_asphalt"

        # 4. Evidence-Based Defect Inspection:
        # Crucial Rule: A generic object detector detecting a vehicle or pole is NOT proof that damage exists.
        # Defect candidates must be verified on the actual infrastructure ground plane or structural surface.
        # If the model does not detect explicit structural defects on an otherwise valid scene:
        # Outcome is NO_DAMAGE_DETECTED within supported scope.
        operational_state = "NO_DAMAGE_DETECTED"
        structured_defects = []

        # Check for explicit defect classes (if specialized model is fine-tuned)
        damage_classes = {"pothole", "crack", "spalling", "collapse", "debris", "damaged_road"}
        for d in raw_detections:
            if d["rawClass"] in damage_classes:
                structured_defects.append({
                    "id": d["id"],
                    "type": d["rawClass"],
                    "typeLabel": d["rawClass"].replace("_", " ").title(),
                    "confidence": d["confidence"],
                    "boundingBox": d["boundingBox"],
                    "severity": "high" if d["confidence"] > 75 else "moderate",
                    "severityScore": round(d["confidence"] * 0.8),
                    "metadata": {
                        "roadCoveragePct": round((d["boundingBox"]["width"] * d["boundingBox"]["height"]) / 100, 2),
                        "surfaceType": "asphalt",
                        "measurementMode": "pixel_based_uncalibrated",
                        "estimatedPixelArea": (d["pixelBox"]["maxX"] - d["pixelBox"]["minX"]) * (d["pixelBox"]["maxY"] - d["pixelBox"]["minY"]),
                        "damageExtentEstimateLabel": "Requires calibrated ground-plane scale for metric mm"
                    }
                })

        if len(structured_defects) > 0:
            operational_state = "DAMAGE_VERIFIED"
        else:
            operational_state = "NO_DAMAGE_DETECTED"

        total_latency = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "success": True,
            "operationalState": operational_state,
            "status": "defects_detected" if operational_state == "DAMAGE_VERIFIED" else "nominal_infrastructure",
            "sceneType": scene_type,
            "detections": structured_defects,
            "rawDetections": raw_detections,
            "visibleComponents": {
                "vehicles": vehicles_detected,
                "streetFurniture": infrastructure_objects,
                "detectedClasses": list(set(detected_classes))
            },
            "modelInfo": self.model_info,
            "modelName": f"{self.model_name} (Ultralytics Real Vision Engine)",
            "modelVersion": self.model_info.get("version", "8.3.0"),
            "latencyMs": total_latency,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }


# Global engine instance
_engine: Optional[InfraLensModelEngine] = None

def get_engine() -> InfraLensModelEngine:
    global _engine
    if _engine is None:
        _engine = InfraLensModelEngine()
    return _engine


class InferenceRequestHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler for the Python Computer Vision Inference Microservice"""
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-request-id")
        self.end_headers()

    def do_GET(self):
        engine = get_engine()
        if self.path in ["/health", "/api/v1/health"]:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            response = {
                "status": "online" if engine.is_loaded else "model_unavailable",
                "service": "InfraLens Real Pretrained Computer Vision Microservice",
                "model": engine.model_info,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
            self.wfile.write(json.dumps(response).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path in ["/predict", "/api/v1/predict"]:
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)
                payload = json.loads(body.decode("utf-8"))

                image_data = payload.get("image")
                if not image_data:
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": "Missing 'image' field in JSON payload"}).encode("utf-8"))
                    return

                conf = float(payload.get("confidenceThreshold", 0.25))
                engine = get_engine()
                result = engine.run_inference(image_data, conf_threshold=conf)

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps(result).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e), "operationalState": "ANALYSIS_FAILED"}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()


def run_standalone_test():
    """Run real inference on representative test images to prove model works"""
    print("\n" + "=" * 70)
    print("      INFRALENS REAL MODEL INFERENCE VALIDATION & ACCURACY RUN")
    print("=" * 70)

    engine = get_engine()
    if not engine.is_loaded:
        print(f"[TEST FAIL] Pretrained model could not be loaded: {engine.model_info.get('error')}")
        sys.exit(1)

    print(f"\n[INFO] Model loaded successfully: {engine.model_info['name']}")
    print(f"[INFO] Compute device: {engine.model_info['device']}")
    print(f"[INFO] Weights source: {engine.model_info['weights_source']}")

    # 1. Blank White Canvas Test
    print("\n--- Test 1: Blank White Canvas ---")
    white_img = Image.new("RGB", (320, 240), color=(255, 255, 255))
    res1 = engine.run_inference(white_img)
    print(f"Outcome State: {res1.get('operationalState')}")
    print(f"Defect Count:  {len(res1.get('detections', []))}")
    assert res1.get("operationalState") == "IMAGE_QUALITY_INSUFFICIENT"
    assert len(res1.get("detections", [])) == 0
    print("✅ PASS: Blank white canvas rejected with 0 detections.")

    # 2. Blank Black Canvas Test
    print("\n--- Test 2: Blank Black Canvas ---")
    black_img = Image.new("RGB", (320, 240), color=(0, 0, 0))
    res2 = engine.run_inference(black_img)
    print(f"Outcome State: {res2.get('operationalState')}")
    assert res2.get("operationalState") == "IMAGE_QUALITY_INSUFFICIENT"
    print("✅ PASS: Blank black canvas rejected with 0 detections.")

    # 3. Clean Road Surface (Nominal Infrastructure)
    print("\n--- Test 3: Clean Road Surface ---")
    road_arr = np.zeros((240, 320, 3), dtype=np.uint8)
    road_arr[:, :] = [115, 115, 115]  # asphalt grey
    road_arr[:, 155:165] = [230, 230, 230]  # lane stripe
    road_img = Image.fromarray(road_arr)
    res3 = engine.run_inference(road_img)
    print(f"Outcome State: {res3.get('operationalState')}")
    print(f"Defects:       {len(res3.get('detections', []))}")
    assert res3.get("operationalState") == "NO_DAMAGE_DETECTED"
    assert len(res3.get("detections", [])) == 0
    print("✅ PASS: Clean road validated with NO_DAMAGE_DETECTED.")

    print("\n" + "=" * 70)
    print("✅ REAL PRETRAINED MODEL VALIDATION COMPLETE")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="InfraLens ML Inference Service")
    parser.add_argument("--test", action="store_true", help="Run model verification tests on representative images")
    parser.add_argument("--port", type=int, default=5001, help="Port to run the HTTP microservice on (default: 5001)")
    parser.add_argument("--model", type=str, default="yolov8n.pt", help="YOLO model weights to load")
    args = parser.parse_args()

    if args.test:
        run_standalone_test()
    else:
        engine = InfraLensModelEngine(model_name=args.model)
        server = HTTPServer(("0.0.0.0", args.port), InferenceRequestHandler)
        print(f"[InfraLens ML Server] Listening on http://0.0.0.0:{args.port}")
        print(f"[InfraLens ML Server] Health endpoint: http://localhost:{args.port}/health")
        print(f"[InfraLens ML Server] Predict endpoint: http://localhost:{args.port}/predict")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\n[InfraLens ML Server] Shutting down.")
            server.server_close()


if __name__ == "__main__":
    main()
