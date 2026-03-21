import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonInput,
  IonTextarea,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonToast,
} from "@ionic/react";
import axios from "../../services/axiosInstance";

// ✅ Khai báo kiểu dữ liệu rõ ràng
interface Doctor {
  id: number;
  fullName: string;
}

const FeedbackForm: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // ✅ Use relative path
    axios.get("/doctors").then((res) => {
      setDoctors(res.data);
    });
  }, []);

  const handleSubmit = async () => {
    if (!fullName || !email || !message || !doctorId) {
      setToastMsg("Vui lòng điền đầy đủ thông tin.");
      setShowToast(true);
      return;
    }

    try {
      // ✅ Use relative path
      await axios.post("/feedbacks", {
        fullName,
        email,
        message,
        doctorId,
      });
      setToastMsg("Phản hồi đã được gửi!");
      setFullName("");
      setEmail("");
      setMessage("");
    } catch {
      setToastMsg("Gửi phản hồi thất bại.");
    } finally {
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <h2 className="text-center mb-4">📬 Gửi phản hồi</h2>
        <div className="container">
          <IonInput
            placeholder="Họ và tên"
            value={fullName}
            onIonChange={(e) => setFullName(e.detail.value ?? "")}
          />
          <IonInput
            placeholder="Email"
            type="email"
            value={email}
            onIonChange={(e) => setEmail(e.detail.value ?? "")}
          />
          <IonSelect
            placeholder="Chọn bác sĩ"
            value={doctorId}
            onIonChange={(e) => setDoctorId(Number(e.detail.value))}
          >
            {doctors.map((doc: Doctor) => (
              <IonSelectOption key={doc.id} value={doc.id}>
                {doc.fullName}
              </IonSelectOption>
            ))}
          </IonSelect>
          <IonTextarea
            placeholder="Nội dung phản hồi"
            rows={6}
            value={message}
            onIonChange={(e) => setMessage(e.detail.value ?? "")}
          />
          <IonButton expand="block" onClick={handleSubmit}>
            Gửi phản hồi
          </IonButton>
        </div>
        <IonToast
          isOpen={showToast}
          message={toastMsg}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default FeedbackForm;
