# SafeHome-RAG: Computer Vision Fine-Tuning Module

This module provides a **Transfer Learning & Fine-Tuning Pipeline** for automatic visual inspection of residential maintenance complaints.

---

## 1. Problem Statement & Architecture

When residents report maintenance issues, text descriptions can be subjective or incomplete. By attaching a photo of the defect, the computer vision model automatically:
1. **Identifies the defect category** (Plumbing, Electrical, Structural, Lift, Sanitation).
2. **Evaluates visual severity** (Low, Medium, High, Critical).
3. **Flags immediate life-safety hazards** (e.g., water leaks near active electrical wiring).

### Model Architecture
- **Base Backbone**: Pre-trained **MobileNetV2** (lightweight for edge/mobile) or **ResNet-50**.
- **Weights**: ImageNet-1K pre-trained weights.
- **Custom Classification Head**:
  - Dropout layer (\(p=0.2\))
  - Dense linear layer (\(1280 \rightarrow 6\) output logits)
  - Softmax activation function

---

## 2. Maintenance Defect Classes (6 Categories)

1. `Water_Leakage_Seepage`: Pipe bursts, tap leaks, ceiling dampness, pooling water.
2. `Electrical_Damage_Burn`: Burnt sockets, exposed wires, sparking switchboards, charred breakers.
3. `Structural_Wall_Crack`: Plaster fissures, concrete cracks, brick separation.
4. `Elevator_Mechanical_Fault`: Misaligned lift doors, broken floor indicator, panel damage.
5. `Garbage_Sanitation_Overflow`: Dumpster spillover, chute blockages, corridor litter.
6. `Normal_No_Issue`: Baseline clean, repaired, or non-defective fixtures.

---

## 3. Installation & Requirements

```bash
cd ml-vision
pip install -r requirements.txt
```

---

## 4. How to Run Training

To train or evaluate the fine-tuning pipeline:

```bash
# Using MobileNetV2 (Default - fast & mobile-friendly)
python train_maintenance_vision.py --model mobilenet_v2 --epochs 10 --batch-size 16 --lr 1e-4

# Using ResNet-50 (Deeper feature representation)
python train_maintenance_vision.py --model resnet50 --epochs 15 --batch-size 16 --lr 1e-4
```

### Generated Training Artifacts:
- **`ml-vision/weights/safehome_vision_best.pth`**: Trained model weights.
- **`ml-vision/benchmark_evaluation.json`**: Epoch-by-epoch loss, validation accuracy, and precision/recall metrics.

---

## 5. How to Run Image Inference

To classify an uploaded maintenance image:

```bash
python predict_image.py path/to/complaint_photo.jpg
```

Sample output:
```text
==================================================
 SAFEHOME-RAG COMPUTER VISION INFERENCE RESULT 
==================================================
Predicted Class : Water_Leakage_Seepage
Confidence      : 96.0%
Category        : Plumbing
Severity        : High
Safety Advisory : Risk of slip hazard and structural water damage
==================================================
```

---

## 6. Academic Defense Notes (For Capstone Viva)

- **Why Transfer Learning?**: Rather than training millions of convolution weights from scratch, transfer learning leverages feature extractors pre-trained on ImageNet (edges, textures, contours) and adapts the top layers to residential defects.
- **Why Multi-Modal?**: The production application uses **Claude 3.5 Sonnet Vision** for zero-shot contextual reasoning in production (`attachmentController.js`), while this PyTorch module demonstrates the **offline custom fine-tuning and classification benchmarks**.
