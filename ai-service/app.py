from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np

app = FastAPI()

# Load model
try:
    model = joblib.load('health_model.pkl')
    print("✅ Model loaded successfully")
except:
    print("⚠️ Model not found. Please run 'python train_model.py'")
    model = None

class HealthInput(BaseModel):
    age: int
    gender: str # "Male" or "Female"
    bmi: float
    glucose: float
    blood_pressure: float
    history: list = [] # List of strings: ["Smoker", "Diabetes", ...]

@app.post("/predict")
def predict_health(data: HealthInput):
    if not model:
        return {"error": "Model not trained"}

    # 1. Preprocess Input
    gender_val = 1 if data.gender == "Male" else 0
    smoking_val = 1 if "Smoker" in data.history or "Hút thuốc" in data.history else 0
    
    # DataFrame phải khớp thứ tự cột lúc train: age, gender, bmi, glucose, bp, smoking
    input_df = pd.DataFrame([{
        'age': data.age,
        'gender': gender_val,
        'bmi': data.bmi,
        'glucose': data.glucose,
        'blood_pressure': data.blood_pressure,
        'smoking': smoking_val
    }])

    # 2. Predict
    prediction = model.predict(input_df)[0]
    probs = model.predict_proba(input_df)[0]
    confidence = max(probs)

    # 3. Generate Advice (Logic kết hợp AI + Rule)
    risk_map = {0: "Thấp", 1: "Trung bình", 2: "Cao"}
    risk_level = risk_map.get(prediction, "Không xác định")

    advice = []
    tests = []

    # Gợi ý dựa trên chỉ số cụ thể (AI giải thích)
    if data.bmi > 25:
        advice.append("Chỉ số BMI cao, bạn nên điều chỉnh chế độ ăn uống và vận động.")
    if data.glucose > 120:
        advice.append("Đường huyết hơi cao, cần lưu ý nguy cơ tiểu đường.")
        tests.append("HbA1c")
        tests.append("Đường huyết lúc đói")
    if data.blood_pressure > 130:
        advice.append("Huyết áp cao, hãy theo dõi thường xuyên.")
        tests.append("Điện tâm đồ (ECG)")
        tests.append("Siêu âm tim")
    
    if smoking_val == 1:
        advice.append("Hút thuốc lá làm tăng nguy cơ bệnh phổi và tim mạch.")
        tests.append("X-quang phổi")

    # Gợi ý chung theo mức độ rủi ro
    if prediction == 2:
        final_advice = "Nguy cơ sức khỏe CAO. Khuyên bạn nên đi khám chuyên sâu sớm nhất có thể. " + " ".join(advice)
        tests.extend(["Tổng phân tích tế bào máu", "Chức năng gan/thận", "Mỡ máu (Lipid máu)"])
    elif prediction == 1:
        final_advice = "Nguy cơ sức khỏe TRUNG BÌNH. Hãy cải thiện lối sống. " + " ".join(advice)
        tests.extend(["Tổng phân tích nước tiểu", "Siêu âm bụng tổng quát"])
    else:
        final_advice = "Sức khỏe TỐT (Rủi ro thấp). Hãy duy trì thói quen lành mạnh. " + " ".join(advice)
        tests.extend(["Khám sức khỏe định kỳ"])

    return {
        "risk_level": risk_level,
        "confidence": float(confidence),
        "advice": final_advice,
        "suggested_tests": list(set(tests)) # Remove duplicates
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
