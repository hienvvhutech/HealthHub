import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonButton,
  IonToast,
} from "@ionic/react";
import { register } from "../../auth/authService"; // Sử dụng service đã fix
import axios from "axios";
import { useHistory } from "react-router-dom";
import Footer from "../../components/Footer";

import "./Login.css"; // Dùng lại CSS từ Login để đồng bộ

const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState({ show: false, message: "" });
  const history = useHistory();

  const handleSubmit = async () => {
    if (!email || !password || !confirmPassword) {
      setToast({ show: true, message: "Vui lòng nhập đầy đủ thông tin." });
      return;
    }

    if (password !== confirmPassword) {
      setToast({ show: true, message: "Mật khẩu xác nhận không khớp." });
      return;
    }

    try {
      await register(email, password, "patient");
      setToast({ show: true, message: "Đăng ký thành công!" });
      setTimeout(() => history.push("/login"), 1000);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        setToast({ show: true, message: error.response.data.error });
      } else {
        setToast({ show: true, message: "Đăng ký thất bại." });
      }
    }
  };

  const formattedTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <IonPage>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "#f8f9fa",
          alignItems: "center",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ margin: 0 }}>
          <span style={{ color: "#0ea5e9", fontWeight: 700 }}>Health</span>
          <span style={{ color: "#3b82f6", fontWeight: 700 }}>Hub</span>
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ fontWeight: 500 }}>{formattedTime}</div>
          <IonButton
            fill="solid"
            color="primary"
            size="small"
            onClick={() => history.push("/login")}
          >
            ĐĂNG NHẬP
          </IonButton>
        </div>
      </div>

      <IonContent className="login-content">
        <div className="login-container">
          {/* Bên trái: Giới thiệu HealthHub */}
          <div className="welcome-section">
            <h1 className="welcome-title">
              Chào mừng đến với <br />
              <span className="highlight">HealthHub</span>
            </h1>
            <p className="welcome-subtitle">
              Nền tảng tin cậy cho các dịch vụ y tế, chăm sóc sức khỏe.
            </p>
            <ul className="welcome-features">
              <li>Đặt lịch khám bệnh chỉ trong vài click</li>
              <li>Tìm bác sĩ phù hợp với nhu cầu của bạn</li>
              <li>Truy cập hồ sơ y tế của bạn bất cứ lúc nào</li>
              <li>Hỗ trợ tư vấn trực tuyến 24/7</li>
            </ul>
            <p className="welcome-testimonial">
              &quot;HealthHub đã mang lại cho tôi sự tiện lợi khi đặt lịch khám
              bệnh. Tôi rất hài lòng với dịch vụ này!&quot;
            </p>
            <p className="welcome-author">Bệnh nhân tại Tp Hồ Chí Minh, 2025</p>
          </div>

          {/* Bên phải: Form đăng ký */}
          <div className="login-form-section">
            <h2 className="login-title">Đăng Ký Tài Khoản</h2>
            <p className="login-subtitle">Hoặc đăng nhập nếu đã có tài khoản</p>

            <IonItem lines="none" className="login-input">
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value ?? "")}
                placeholder="Nhập email"
              />
            </IonItem>

            <IonItem lines="none" className="login-input">
              <IonLabel position="stacked">Mật khẩu</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonChange={(e) => setPassword(e.detail.value ?? "")}
                placeholder="Nhập mật khẩu"
              />
            </IonItem>

            <IonItem lines="none" className="login-input">
              <IonLabel position="stacked">Xác nhận mật khẩu</IonLabel>
              <IonInput
                type="password"
                value={confirmPassword}
                onIonChange={(e) => setConfirmPassword(e.detail.value ?? "")}
                placeholder="Nhập lại mật khẩu"
              />
            </IonItem>

            <div className="login-options">
              <label className="checkbox-label">
                <input type="checkbox" style={{ marginRight: 6 }} />
                Tôi đồng ý với{" "}
                <span style={{ color: "#3b82f6", cursor: "pointer" }}>
                  Điều khoản sử dụng
                </span>
              </label>
            </div>

            <IonButton
              expand="block"
              className="login-button"
              onClick={handleSubmit}
            >
              Đăng Ký
            </IonButton>

            <div className="register-link">
              <span>Đã có tài khoản? </span>
              <span
                className="register-text"
                onClick={() => history.push("/login")}
              >
                Đăng nhập
              </span>
            </div>

            <IonToast
              isOpen={toast.show}
              message={toast.message}
              duration={1500}
              onDidDismiss={() => setToast({ show: false, message: "" })}
            />
          </div>
        </div>
        <Footer />
      </IonContent>
    </IonPage>
  );
};

export default Register;
