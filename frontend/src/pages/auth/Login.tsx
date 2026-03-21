import React, { useState } from "react";
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonToast,
  IonCheckbox,
} from "@ionic/react";
import { login } from "../../auth/authService";
import { useHistory } from "react-router-dom";
import Footer from "../../components/Footer";

import "./Login.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const history = useHistory();

  const handleLogin = async () => {
    try {
      const result = await login(email, password);

      if (result.data && result.data.token) {
        const { role, id, patientId } = result.data.user;

        localStorage.setItem("token", result.data.token);
        localStorage.setItem("role", role);
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("email", email);

        if (role === "patient" && patientId) {
          localStorage.setItem("userId", patientId.toString());
        } else {
          localStorage.setItem("userId", id.toString());
        }

        localStorage.setItem(
          "user",
          JSON.stringify({
            id: role === "patient" ? patientId : id,
            role,
            email,
          })
        );

        setToastMsg("Đăng nhập thành công!");
        setShowToast(true);

        setTimeout(() => {
          if (role === "admin") {
            history.push("/admin/admin-dashboard");
          } else if (role === "doctor") {
            history.push("/doctor/home");
          } else if (role === "patient") {
            history.push("/patient/home");
          } else {
            history.push("/home");
          }
        }, 1000);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.response && error.response.status === 401) {
        setToastMsg("Email hoặc mật khẩu không chính xác!");
      } else {
        setToastMsg("Lỗi kết nối hoặc server không phản hồi.");
      }
      setShowToast(true);
    }
  };

  const formattedTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <IonPage>
      {/* Top bar với giờ sát bên phải */}
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

      <IonContent className="login-content ion-padding">
        <div className="login-container">
          {/* Left Section: Welcome to HealthHub */}
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

          {/* Right Section: Login Form */}
          <div className="login-form-section">
            <h2 className="login-title">Đăng Nhập Tài Khoản</h2>
            <p className="login-subtitle">Hoặc đăng ký tài khoản mới</p>

            <IonItem lines="none" className="login-input">
              <IonLabel position="stacked"> Email </IonLabel>
              <IonInput
                value={email}
                onIonChange={(e) => setEmail(e.detail.value ?? "")}
                placeholder="Nhập email của bạn"
                type="email"
              />
            </IonItem>

            <IonItem lines="none" className="login-input">
              <IonLabel position="stacked">Mật khẩu</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonChange={(e) => setPassword(e.detail.value ?? "")}
                placeholder="Nhập mật khẩu của bạn"
              />
            </IonItem>

            <div className="login-options">
              <label className="checkbox-label">
                <IonCheckbox
                  checked={rememberMe}
                  onIonChange={(e) => setRememberMe(e.detail.checked)}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <span
                className="forgot-password"
                onClick={() => history.push("/forgot-password")}
              >
                Quên mật khẩu?
              </span>
            </div>

            <IonButton
              expand="block"
              className="login-button"
              onClick={handleLogin}
            >
              Đăng nhập
            </IonButton>

            <div className="register-link">
              <span>Bạn chưa có tài khoản? </span>
              <span
                className="register-text"
                onClick={() => history.push("/register")}
              >
                Đăng ký
              </span>
            </div>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          message={toastMsg}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
          color={toastMsg.includes("thành công") ? "success" : "danger"}
        />
        <Footer />
      </IonContent>
    </IonPage>
  );
};

export default Login;
