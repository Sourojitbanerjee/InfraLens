#!/usr/bin/env python3
"""
Runs real pretrained YOLO model inference on real test images and outputs
detailed predictions, bounding boxes, labels, and operational states.
"""
import os
import sys
import json
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from server.ml_inference_service import get_engine

IMAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "tests", "fixtures", "real_images")

TEST_CASES = [
    {
        "filename": "damaged_road_pothole.jpg",
        "description": "Real damaged asphalt road with deep pothole cavity",
        "expected_presence": "infrastructure_present",
        "expect_damage": True
    },
    {
        "filename": "clean_road.jpg",
        "description": "Real undamaged clean highway road surface",
        "expected_presence": "infrastructure_present",
        "expect_damage": False
    },
    {
        "filename": "yellow_vehicle_street.jpg",
        "description": "Real urban street scene with yellow transit/maintenance vehicle",
        "expected_presence": "infrastructure_present",
        "expect_damage": False
    },
    {
        "filename": "damaged_building.jpg",
        "description": "Real damaged building structure with wall breach/cracks",
        "expected_presence": "infrastructure_present",
        "expect_damage": True
    },
    {
        "filename": "indoor_living_room.jpg",
        "description": "Real unrelated indoor domestic living room (non-infrastructure)",
        "expected_presence": "infrastructure_absent",
        "expect_damage": False
    },
    {
        "filename": "blank_white.png",
        "description": "Completely blank white canvas",
        "expected_presence": "image_unsuitable",
        "expect_damage": False
    },
    {
        "filename": "blank_black.png",
        "description": "Completely blank black canvas",
        "expected_presence": "image_unsuitable",
        "expect_damage": False
    }
]

def main():
    print("=" * 80)
    print("      INFRALENS REAL COMPUTER VISION MODEL EVALUATION ON REAL DATA")
    print("=" * 80)

    engine = get_engine()
    print(f"\nModel: {engine.model_name}")
    print(f"Device: {engine.device}")
    print(f"Parameters: {engine.model_info.get('parameters', 0):,}")
    print(f"Total Supported Classes: {engine.model_info.get('total_classes', 0)}")
    print("-" * 80)

    results_summary = []

    for idx, case in enumerate(TEST_CASES, 1):
        filepath = os.path.join(IMAGES_DIR, case["filename"])
        print(f"\n[{idx}/7] Evaluating: {case['filename']}")
        print(f"Description: {case['description']}")

        if not os.path.exists(filepath):
            print(f"  ❌ File not found: {filepath}")
            continue

        res = engine.run_inference(filepath)

        op_state = res.get("operationalState")
        scene_type = res.get("sceneType")
        raw_dets = res.get("rawDetections", [])
        structured_dets = res.get("detections", [])
        latency = res.get("latencyMs", 0)

        print(f"  Operational State: {op_state}")
        print(f"  Scene Type:        {scene_type}")
        print(f"  Latency:           {latency} ms")
        print(f"  Raw Objects Detected ({len(raw_dets)}):")
        for obj in raw_dets[:5]:
            print(f"    - {obj['rawClass']} ({obj['confidence']}%) at {obj['boundingBox']}")
        if len(raw_dets) > 5:
            print(f"    ... and {len(raw_dets) - 5} more")

        print(f"  Verified Defects ({len(structured_dets)}):")
        for d in structured_dets:
            print(f"    * {d['typeLabel']} ({d['confidence']}%)")

        results_summary.append({
            "file": case["filename"],
            "operationalState": op_state,
            "sceneType": scene_type,
            "rawObjectsCount": len(raw_dets),
            "defectsCount": len(structured_dets),
            "latencyMs": latency
        })

    print("\n" + "=" * 80)
    print("                         SUMMARY OF REAL INFERENCE RUN")
    print("=" * 80)
    print(f"{'Image File':<28} | {'Operational State':<26} | {'Scene':<18} | {'Objects':<8} | {'Latency':<8}")
    print("-" * 96)
    for r in results_summary:
        print(f"{r['file']:<28} | {r['operationalState']:<26} | {r['sceneType']:<18} | {r['rawObjectsCount']:<8} | {r['latencyMs']} ms")
    print("=" * 80)

if __name__ == "__main__":
    main()
