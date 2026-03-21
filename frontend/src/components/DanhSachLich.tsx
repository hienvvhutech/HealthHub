//cspell:disable
import React, { useEffect, useState } from "react";
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonSpinner,
} from "@ionic/react";
import axios from "../services/axiosInstance";

interface Appointment {
  id: number;
  doctorName: string;
  date: string;
  note: string;
  status: string;
}

const DanhSachLich = ({ status }: { status: "scheduled" | "completed" }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const patientId = localStorage.getItem("userId");

      if (!token || !patientId) return;

      // ✅ Use relative path
      const res = await axios.get("/appointments/patient", {
        params: { patientId },
        headers: { Authorization: `Bearer ${token}` },
      });

      const filtered = res.data.filter(
        (appt: Appointment) => appt.status === status
      );

      setAppointments(filtered);
    } catch (error) {
      console.error("Lỗi khi tải lịch:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [status]);

  if (loading) return <IonSpinner name="crescent" />;
  if (appointments.length === 0)
    return <IonText color="medium">Không có lịch phù hợp.</IonText>;

  return (
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
              <strong>📝 Ghi chú:</strong> {appt.note || "Không có ghi chú"}
            </p>
            <p>
              <strong>📌 Trạng thái:</strong>{" "}
              {appt.status === "scheduled" ? "Chưa khám" : "Đã khám"}
            </p>
          </IonCardContent>
        </IonCard>
      ))}
    </div>
  );
};

export default DanhSachLich;
