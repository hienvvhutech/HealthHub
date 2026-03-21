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

import "./ManageDoctors.css";

interface Doctor {
  id: number;
  fullName: string;
  email: string;
  dob?: string;
  password?: string;
  specialtyId?: number;
  specialty?: {
    name: string;
  };
}

interface Specialty {
  id: number;
  name: string;
}

const ManageDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [specialtyId, setSpecialtyId] = useState<number | undefined>();
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchDoctors = async (query = "") => {
    const res = await axios.get(`/doctors${query}`);
    setDoctors(res.data);
  };

  const fetchSpecialties = async () => {
    const res = await axios.get("/specialties");
    setSpecialties(res.data);
  };

  useEffect(() => {
    fetchDoctors();
    fetchSpecialties();
  }, []);

  const handleSubmit = async () => {
    const payload = { fullName, email, dob, password, specialtyId };

    if (editingId) {
      await axios.put(`/doctors/${editingId}`, payload);
    } else {
      await axios.post("/doctors", payload);
    }

    resetForm();
    fetchDoctors();
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setDob("");
    setPassword("");
    setSpecialtyId(undefined);
    setEditingId(null);
  };

  const handleEdit = (d: Doctor) => {
    setFullName(d.fullName);
    setEmail(d.email);
    setDob(d.dob?.substring(0, 10) || "");
    setPassword("");
    setSpecialtyId(d.specialtyId);
    setEditingId(d.id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Xác nhận xoá bác sĩ này?")) return;
    await axios.delete(`/doctors/${id}`);
    fetchDoctors();
  };

  return (
    <IonPage className="admin-container">
      <AdminSidebar />

      <div id="main">
        <IonContent className="ion-padding">
          {/* HEADER */}
          <div className="page-header-new">
            <h1>Quản lý bác sĩ</h1>
            <p>Chào mừng bạn quay trở lại với hệ thống quản trị</p>
          </div>

          {/* FORM CARD */}
          <div className="doctor-form-card">
            <h2 className="form-title">
              {editingId ? "Cập nhật bác sĩ" : "Thêm bác sĩ mới"}
            </h2>

            <div className="form-grid">
              <IonItem>
                <IonLabel position="stacked">Họ tên</IonLabel>
                <IonInput
                  value={fullName}
                  onIonChange={(e) => setFullName(e.detail.value ?? "")}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Email</IonLabel>
                <IonInput
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value ?? "")}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Chuyên khoa</IonLabel>
                <IonSelect
                  placeholder="-- Chọn chuyên khoa --"
                  value={specialtyId}
                  onIonChange={(e) => setSpecialtyId(Number(e.detail.value))}
                >
                  {specialties.map((s) => (
                    <IonSelectOption key={s.id} value={s.id}>
                      {s.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Ngày sinh</IonLabel>
                <IonInput
                  type="date"
                  value={dob}
                  onIonChange={(e) => setDob(e.detail.value ?? "")}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Mật khẩu</IonLabel>
                <IonInput
                  type="password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value ?? "")}
                />
              </IonItem>
            </div>

            <IonButton
              expand="block"
              onClick={handleSubmit}
              className="submit-btn"
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
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Chuyên khoa</th>
                  <th>Ngày sinh</th>
                  <th>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td>{d.fullName}</td>
                    <td>{d.email}</td>

                    <td>
                      <span className="specialty-badge">
                        {d.specialty?.name || "Không rõ"}
                      </span>
                    </td>

                    <td>{d.dob?.substring(0, 10)}</td>

                    <td className="action-buttons">
                      <IonButton
                        size="small"
                        color="warning"
                        onClick={() => handleEdit(d)}
                      >
                        Sửa
                      </IonButton>

                      <IonButton
                        size="small"
                        color="danger"
                        onClick={() => handleDelete(d.id)}
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

export default ManageDoctors;
