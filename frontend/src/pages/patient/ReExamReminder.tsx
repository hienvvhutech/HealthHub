import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonToggle,
  IonSpinner,
  IonText,
  IonToast,
  IonButtons,
  IonBackButton,
} from "@ionic/react";
import axios from "../../services/axiosInstance";
import { AxiosError } from "axios";
import "./ReExamReminder.css";

interface ReExamAppointment {
  id: number;
  appointmentId: number;
  specialty: string;
  doctorName: string;
  reExamDate: string;
  note?: string;
}

const ReExamReminder: React.FC = () => {
  const [appointments, setAppointments] = useState<ReExamAppointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

  const token = localStorage.getItem("token");

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError(null);

    if (!token) {
      setError("⚠️ Vui lòng đăng nhập để xem lịch tái khám");
      setIsLoading(false);
      return;
    }

    try {
      // ✅ Use relative path
      const response = await axios.get("/reexam", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(response.data)) {
        setAppointments(response.data);
      } else {
        setError("❌ Dữ liệu không đúng định dạng");
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      const message =
        error.response?.data?.message || "Không thể lấy dữ liệu lịch tái khám";
      setError(`❌ ${message}`);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleConfirm = async (id: number) => {
    try {
      // ✅ Use relative path
      await axios.patch(
        `/reexam/${id}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToastMessage("✅ Đã xác nhận sẽ đến tái khám");
      fetchAppointments();
    } catch (err) {
      setToastMessage("❌ Xác nhận thất bại");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      // ✅ Use relative path
      await axios.delete(`/reexam/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setToastMessage("🗑️ Đã huỷ lịch tái khám");
      fetchAppointments();
    } catch (err) {
      setToastMessage("❌ Huỷ thất bại");
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { date: "Ngày không hợp lệ", time: "" };
    return {
      date: date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/patient/home" />
          </IonButtons>
          <IonTitle>Nhắc hẹn tái khám</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="reminder-page">
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="8">
              <h2 className="reminder-title">📅 Lịch hẹn tái khám </h2>
              {isLoading ? (
                <div className="loading-state">
                  <IonSpinner name="crescent" />
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <IonText color="danger">{error}</IonText>
                  <IonButton onClick={fetchAppointments} color="primary">
                    Thử lại
                  </IonButton>
                </div>
              ) : appointments.length === 0 ? (
                <div className="empty-state">
                  <p className="no-appointments">📭 Chưa có lịch hẹn nào</p>
                  <p className="sub">
                    Dữ liệu sẽ hiển thị tại đây sau khi bạn đặt lịch tái khám.
                  </p>
                </div>
              ) : (
                appointments.map((app) => {
                  const { date, time } = formatDateTime(app.reExamDate);
                  return (
                    <IonCard key={app.appointmentId} className="reminder-card">
                      <IonCardHeader>
                        <IonCardTitle>{app.specialty}</IonCardTitle>
                        <IonCardSubtitle>
                          Bác sĩ: {app.doctorName}
                        </IonCardSubtitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <p>📆 {date}</p>
                        {time && <p>⏰ {time}</p>}
                        {app.note && <p>📝 {app.note}</p>}

                        <div className="reminder-settings">
                          <p className="reminder-label">Cài đặt nhắc nhở</p>
                          <div className="reminder-toggle">
                            <span>📧 Email</span> <IonToggle checked />
                          </div>
                          <div className="reminder-toggle">
                            <span>📞 SMS</span> <IonToggle checked />
                          </div>
                          <div className="reminder-toggle">
                            <span>🔔 App</span> <IonToggle checked />
                          </div>
                        </div>

                        <div className="reminder-actions">
                          <IonButton
                            color="medium"
                            onClick={() => handleCancel(app.id)}
                          >
                            Huỷ lịch hẹn
                          </IonButton>
                          <IonButton
                            color="primary"
                            onClick={() => handleConfirm(app.id)}
                          >
                            Xác nhận sẽ đến
                          </IonButton>
                        </div>
                      </IonCardContent>
                    </IonCard>
                  );
                })
              )}
            </IonCol>

            {/* Quy định lịch hẹn tái khám */}
            <IonCol size="12" sizeMd="4">
              <IonCard className="rules-card">
                <IonCardHeader>
                  <IonCardTitle className="rules-title">
                    📌 Quy định lịch hẹn tái khám
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <ul className="rules-list">
                    <li>✔️ Vui lòng xác nhận lịch trước ít nhất 24h.</li>
                    <li>📞 Bạn sẽ được nhắc qua Email, SMS và App.</li>
                    <li>❌ Nếu không xác nhận đúng hạn, lịch sẽ bị huỷ.</li>
                    <li>📅 Bạn có thể đặt lại lịch mới nếu cần.</li>
                  </ul>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={2500}
          onDidDismiss={() => setToastMessage("")}
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

export default ReExamReminder;
