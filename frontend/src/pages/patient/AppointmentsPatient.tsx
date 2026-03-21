//cspell:disable
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonText,
} from "@ionic/react";
import axios from "../../services/axiosInstance";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

interface Appointment {
  id: number;
  doctorName: string;
  date: string;
  note: string;
  status: string;
}

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const patientId = localStorage.getItem("userId");

      if (!token || !patientId) return;

      // ✅ Use relative path, axiosInstance handles base URL
      const res = await axios.get("/appointments/patient", {
        params: { patientId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAppointments(res.data);
    } catch (error) {
      console.error("Lỗi khi tải lịch hẹn", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <IonPage>
      <Header />
      <IonContent className="ion-padding">
        <h2>Lịch Hẹn Của Bạn</h2>
        {loading ? (
          <IonSpinner name="crescent" />
        ) : appointments.length === 0 ? (
          <IonText color="medium">Không có lịch hẹn nào.</IonText>
        ) : (
          <div className="ion-padding">
            {appointments.map((appt) => (
              <IonCard key={appt.id} className="ion-margin-bottom">
                <IonCardHeader>
                  <IonCardTitle>🩺 Bác sĩ: {appt.doctorName}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>
                    <strong>🗓 Ngày:</strong>{" "}
                    {new Date(appt.date).toLocaleString("vi-VN")}
                  </p>
                  <p>
                    <strong>📝 Ghi chú:</strong>{" "}
                    {appt.note || "Không có ghi chú"}
                  </p>
                  <p>
                    <strong>📌 Trạng thái:</strong>{" "}
                    {appt.status === "scheduled" ? "Chưa khám" : "Đã khám"}
                  </p>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>
      <Footer />
    </IonPage>
  );
};

export default Appointments;
