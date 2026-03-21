import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

# 1. Tạo dữ liệu giả lập (Realistic Synthetic Data)
# Quy tắc sinh dữ liệu:
# - Tuổi cao, BMI cao, Glucose cao, HA cao, Hút thuốc -> Nguy cơ cao (2)
# - Các chỉ số trung bình -> Nguy cơ trung bình (1)
# - Các chỉ số tốt -> Nguy cơ thấp (0)

np.random.seed(42)
n_samples = 5000

# Sinh ngẫu nhiên
age = np.random.randint(18, 90, n_samples)
gender = np.random.randint(0, 2, n_samples) # 0: Female, 1: Male
bmi = np.random.normal(25, 5, n_samples) # Mean 25, Std 5
glucose = np.random.normal(100, 20, n_samples) # Mean 100
bp = np.random.normal(120, 15, n_samples) # Systolic BP
smoking = np.random.randint(0, 2, n_samples) # 0: No, 1: Yes

# Tạo nhãn (Label) dựa trên logic y khoa giả định
risk_score = (
    (age / 90) * 2 + 
    (bmi / 40) * 3 + 
    (glucose / 200) * 4 + 
    (bp / 180) * 3 +
    smoking * 1.5
)

# Phân loại Risk dựa trên Score
# Tinh chỉnh ngưỡng để cân bằng dữ liệu
risk_level = []
for score in risk_score:
    if score < 4.5:
        risk_level.append(0) # Low
    elif score < 6.0:
        risk_level.append(1) # Medium
    else:
        risk_level.append(2) # High

df = pd.DataFrame({
    'age': age,
    'gender': gender,
    'bmi': bmi,
    'glucose': glucose,
    'blood_pressure': bp,
    'smoking': smoking,
    'risk_level': risk_level
})

print("Dữ liệu mẫu:")
print(df.head())

# 2. Huấn luyện Model
X = df.drop('risk_level', axis=1)
y = df['risk_level']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 3. Đánh giá
y_pred = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred)}")
print(classification_report(y_test, y_pred))

# 4. Lưu Model
joblib.dump(model, 'health_model.pkl')
print("✅ Đã lưu model 'health_model.pkl' thành công (Xịn hơn nhiều!)")
