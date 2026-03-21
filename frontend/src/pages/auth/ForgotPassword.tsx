// src/pages/auth/ForgotPassword.tsx
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
import { useHistory } from "react-router-dom";
import { forgotPassword } from "../../auth/authService"; // Sử dụng service đã fix
import Header from "../../components/Header";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState({ show: false, message: "" });
  const history = useHistory();

  const handleSendReset = async () => {
    if (!email) {
      setToast({ show: true, message: "Vui lòng nhập email." });
      return;
    }

    try {
      await forgotPassword(email);
      setToast({
        show: true,
        message: "Đã gửi link đặt lại mật khẩu qua email!",
      });
    } catch (err) {
      setToast({
        show: true,
        message: "Không thể gửi email. Kiểm tra lại email của bạn.",
      });
    }
  };

  return (
    <IonPage>
      <Header />
      <IonContent className="ion-padding">
        <div className="form-box" style={{ maxWidth: 400, margin: "auto" }}>
          <h2>Quên Mật Khẩu</h2>
          <p>Nhập địa chỉ email để nhận link đặt lại mật khẩu.</p>

          <IonItem lines="none">
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput
              type="email"
              value={email}
              onIonChange={(e) => setEmail(e.detail.value ?? "")}
              placeholder="Nhập email"
            />
          </IonItem>

          <IonButton expand="block" onClick={handleSendReset}>
            Gửi link khôi phục
          </IonButton>

          <IonButton
            expand="block"
            fill="clear"
            onClick={() => history.push("/login")}
          >
            Quay lại đăng nhập
          </IonButton>

          <IonToast
            isOpen={toast.show}
            message={toast.message}
            duration={2000}
            onDidDismiss={() => setToast({ show: false, message: "" })}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
