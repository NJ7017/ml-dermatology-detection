from flask import Flask, render_template, request, jsonify
import torch
import torchvision.transforms as transforms
from PIL import Image
import json
import os
import timm
from werkzeug.utils import secure_filename

app = Flask(__name__)

# 🔹 Set upload folder
UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# 🔹 Load the model
def load_model(model_path, device):
    model = torch.load(model_path, map_location=device, weights_only=False)  # Add weights_only=False
    model.eval()
    model.to(device)
    return model

# 🔹 Load class names from JSON
def load_class_names(class_names_path):
    with open(class_names_path, "r") as f:
        class_names = json.load(f)
    return class_names

# 🔹 Image preprocessing
def preprocess_image(image_path):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    image = Image.open(image_path).convert("RGB")
    image = transform(image).unsqueeze(0)
    return image

# 🔹 Prediction function
def predict_disease(image_path, model, class_names, device):
    image = preprocess_image(image_path).to(device)
    
    with torch.no_grad():
        output = model(image)
        _, predicted_idx = torch.max(output, 1)
    
    predicted_class = class_names[predicted_idx.item()]  
    return predicted_class

# 🔹 Set device (CPU/GPU)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 🔹 Paths (UPDATE THESE AS NEEDED)
MODEL_PATH = "VIT_skin_disease.pth"
CLASS_NAMES_PATH = "class_names.json"

# 🔹 Load model and class names
class_names = load_class_names(CLASS_NAMES_PATH)
model = load_model(MODEL_PATH, device=device)

@app.route("/", methods=["GET", "POST"])
def home():
    if request.method == "POST":
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"})

        file = request.files["image"]
        if file.filename == "":
            return jsonify({"error": "No selected file"})

        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)

        try:
            predicted_disease = predict_disease(file_path, model, class_names, device)
            return render_template("index.html", uploaded_image=file_path, prediction=predicted_disease)
        except Exception as e:
            return jsonify({"error": str(e)})

    return render_template("index.html", uploaded_image=None, prediction=None)



from io import BytesIO

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    try:
        # Directly read image without saving
        image_bytes = BytesIO(file.read())
        image = Image.open(image_bytes).convert("RGB")
        
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        image = transform(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = model(image)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)[0] * 100
        
        predictions = {
            format_disease_name(class_names[i]): round(probabilities[i].item(), 2)
            for i in range(len(class_names))
        }
        
        return jsonify(predictions)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Helper function to format disease names
def format_disease_name(name):
    return name.replace('_', ' ').title()
    


@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/education")
def education():
    return render_template("education.html")

@app.route("/faq")
def faq():
    return render_template("faq.html")

@app.route("/contact")
def contact():
    return render_template("contact.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5001)),debug=True)
    # app.run(debug=True)
