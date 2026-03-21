import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
} from "@ionic/react";
import { useParams, useHistory } from "react-router-dom";
import { resetPassword } from "../../auth/authService"; // Sử dụng service đã fix
import Header from "../../components/Header";

interface RouteParams {
  token: string;
}

const ResetPassword: React.FC = () => {
  const { token } = useParams<RouteParams>();
  const history = useHistory();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [toast, setToast] = useState({ show: false, message: "" });

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setToast({ show: true, message: "Vui lòng điền đầy đủ thông tin." });
      return;
    }

    if (password !== confirmPassword) {
      setToast({ show: true, message: "Mật khẩu xác nhận không khớp." });
      return;
    }

    try {
      await resetPassword(token, password);

      setToast({ show: true, message: "Đặt lại mật khẩu thành công!" });
      setTimeout(() => history.push("/login"), 1500);
    } catch (error) {
      setToast({
        show: true,
        message: "Token không hợp lệ hoặc đã hết hạn.",
      });
    }
  };

  return (
    <IonPage>
      <Header />
      <IonContent className="ion-padding">
        <div className="form-box" style={{ maxWidth: 400, margin: "auto" }}>
          <h2>Đặt Lại Mật Khẩu</h2>

          <IonItem lines="none">
            <IonLabel position="stacked">Mật khẩu mới</IonLabel>
            <IonInput
              type="password"
              value={password}
              onIonChange={(e) => setPassword(e.detail.value ?? "")}
              placeholder="Nhập mật khẩu mới"
            />
          </IonItem>

          <IonItem lines="none">
            <IonLabel position="stacked">Xác nhận mật khẩu</IonLabel>
            <IonInput
              type="password"
              value={confirmPassword}
              onIonChange={(e) => setConfirmPassword(e.detail.value ?? "")}
              placeholder="Nhập lại mật khẩu"
            />
          </IonItem>

          <IonButton expand="block" onClick={handleReset}>
            Đặt lại mật khẩu
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

export default ResetPassword;
