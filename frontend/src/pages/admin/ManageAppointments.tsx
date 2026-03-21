import React, { useEffect, useState } from "react";
import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonContent,
  IonPage,
} from "@ionic/react";

import axios from "../../services/axiosInstance";
import AdminSidebar from "../../components/AdminSidebar";
import "./ManageDoctors.css"; // dùng chung UI premium

interface Appointment {
  id: number;
  reason: string; // Vẫn giữ để map form (nếu cần)
  note?: string;  // Backend trả về note
  date: string;
  status: string;
  doctorId: number;
  patientId: number;
  // ✅ Thêm thông tin bác sĩ & chuyên khoa
  doctor?: {
    fullName: string;
    specialty?: {
      name: string;
    };
  };
  patient?: {
    fullName: string;
  };
}

type StatusMap = {
  [key: string]: {
    label: string;
    class: string;
  };
};

const ManageAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<Omit<Appointment, "id" | "doctor" | "patient">>({
    reason: "",
    date: "",
    status: "pending",
    doctorId: 1,
    patientId: 1,
  });

  const fetchAppointments = async () => {
    const res = await axios.get("/appointments");
    setAppointments(res.data);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleChange = (key: keyof typeof form, value: string | number) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async () => {
    // Map 'reason' to 'note' for backend if needed
    const payload = {
        ...form,
        note: form.reason 
    };

    if (editingId) {
      await axios.put(`/appointments/${editingId}/status`, payload); // Admin update status mainly
      // Note: Backend might need specific update route for admin to change dates/doctors
    } else {
      await axios.post("/appointments", payload);
    }
    setEditingId(null);
    setForm({
      reason: "",
      date: "",
      status: "pending",
      doctorId: 1,
      patientId: 1,
    });
    fetchAppointments();
  };

  const handleEdit = (a: Appointment) => {
    setEditingId(a.id);
    setForm({
      reason: a.note || a.reason || "",
      date: a.date.substring(0, 16),
      status: a.status,
      doctorId: a.doctorId,
      patientId: a.patientId,
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Xoá lịch hẹn này?")) return;
    await axios.delete(`/appointments/${id}`);
    fetchAppointments();
  };

  const getStatusBadge = (status: string) => {
    const map: StatusMap = {
      pending: { label: "Chờ xác nhận", class: "status-pending" },
      waiting: { label: "Đang chờ", class: "status-pending" },
      examining: { label: "Đang khám", class: "status-exam" },
      completed: { label: "Đã khám", class: "status-done" },
      cancelled: { label: "Đã huỷ", class: "status-cancel" },
    };
    const info = map[status] || { label: status, class: "" };
    
    return (
      <span className={`status-badge ${info.class}`}>
        {info.label}
      </span>
    );
  };

  return (
    <IonPage className="admin-container">
      <AdminSidebar />

      <div id="main">
        <IonContent className="ion-padding">
          {/* HEADER */}
          <div className="page-header-new">
            <h1>Quản lý lịch hẹn</h1>
            <p>Theo dõi và quản lý các cuộc hẹn trong hệ thống</p>
          </div>

          {/* FORM CARD */}
          <div className="doctor-form-card">
            <h2 className="form-title">
              {editingId ? "Cập nhật lịch hẹn" : "Thêm lịch hẹn mới"}
            </h2>

            <div className="form-grid">
              <IonItem>
                <IonLabel position="stacked">Ghi chú / Lý do</IonLabel>
                <IonInput
                  value={form.reason}
                  onIonChange={(e) =>
                    handleChange("reason", e.detail.value ?? "")
                  }
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Ngày hẹn</IonLabel>
                <IonInput
                  type="datetime-local"
                  value={form.date}
                  onIonChange={(e) =>
                    handleChange("date", e.detail.value ?? "")
                  }
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Trạng thái</IonLabel>
                <IonSelect
                  value={form.status}
                  onIonChange={(e) => handleChange("status", e.detail.value)}
                >
                  <IonSelectOption value="pending">Chờ xác nhận</IonSelectOption>
                  <IonSelectOption value="waiting">Đang chờ</IonSelectOption>
                  <IonSelectOption value="examining">Đang khám</IonSelectOption>
                  <IonSelectOption value="completed">Đã khám</IonSelectOption>
                  <IonSelectOption value="cancelled">Đã hủy</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">ID bác sĩ</IonLabel>
                <IonInput
                  type="number"
                  value={form.doctorId}
                  onIonChange={(e) =>
                    handleChange("doctorId", Number(e.detail.value))
                  }
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">ID bệnh nhân</IonLabel>
                <IonInput
                  type="number"
                  value={form.patientId}
                  onIonChange={(e) =>
                    handleChange("patientId", Number(e.detail.value))
                  }
                />
              </IonItem>
            </div>

            <IonButton
              expand="block"
              className="submit-btn"
              onClick={handleSubmit}
            >
              {editingId ? "Cập nhật" : "Thêm mới"}
            </IonButton>
          </div>

          {/* TABLE */}
          <div className="table-wrapper">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Chuyên khoa</th> {/* ✅ Đổi tiêu đề */}
                  <th>Ngày</th>
                  <th>Trạng thái</th>
                  <th>Bác sĩ</th>
                  <th>Bệnh nhân</th>
                  <th>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    {/* ✅ Hiển thị Chuyên khoa từ relation */}
                    <td>
                        {a.doctor?.specialty?.name || "Chưa rõ"}
                    </td>
                    <td>{new Date(a.date).toLocaleString('vi-VN')}</td>
                    <td>{getStatusBadge(a.status)}</td>
                    {/* Hiển thị tên bác sĩ nếu có */}
                    <td>{a.doctor?.fullName || a.doctorId}</td>
                    <td>{a.patient?.fullName || a.patientId}</td>
                    <td className="action-buttons">
                      <IonButton
                        size="small"
                        color="warning"
                        onClick={() => handleEdit(a)}
                      >
                        Sửa
                      </IonButton>
                      <IonButton
                        size="small"
                        color="danger"
                        onClick={() => handleDelete(a.id)}
                      >
                        Xoá
                      </IonButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </IonContent>
      </div>
    </IonPage>
  );
};

export default ManageAppointments;
