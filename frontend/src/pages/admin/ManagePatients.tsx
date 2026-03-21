import React, { useEffect, useState } from "react";
import axios from "../../services/axiosInstance";
import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonContent,
  IonPage,
} from "@ionic/react";

import AdminSidebar from "../../components/AdminSidebar";
import "./ManageDoctors.css"; // UI Premium dùng chung

interface Patient {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  dob?: string;
}

const ManagePatients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchPatients = async (query = "") => {
    const res = await axios.get(`/patients${query}`);
    setPatients(res.data);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSubmit = async () => {
    const payload = { fullName, email, phone, address, dob };

    try {
      if (editingId) {
        await axios.put(`/patients/${editingId}`, payload);
      } else {
        await axios.post("/patients", payload);
      }

      resetForm();
      fetchPatients();
    } catch (err) {
      console.error("Lỗi khi lưu bệnh nhân:", err);
    }
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setDob("");
    setEditingId(null);
  };

  const handleEdit = (p: Patient) => {
    setFullName(p.fullName);
    setEmail(p.email);
    setPhone(p.phone || "");
    setAddress(p.address || "");
    setDob(p.dob?.substring(0, 10) || "");
    setEditingId(p.id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Xác nhận xoá bệnh nhân này?")) return;
    await axios.delete(`/patients/${id}`);
    fetchPatients();
  };

  return (
    <IonPage className="admin-container">
      <AdminSidebar />

      <div id="main">
        <IonContent className="ion-padding">
          {/* HEADER */}
          <div className="page-header-new">
            <h1>Quản lý bệnh nhân</h1>
            <p>Chào mừng bạn quay trở lại với hệ thống quản trị</p>
          </div>

          {/* FORM CARD */}
          <div className="doctor-form-card">
            <h2 className="form-title">
              {editingId
                ? "Cập nhật thông tin bệnh nhân"
                : "Thêm bệnh nhân mới"}
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
                <IonLabel position="stacked">Số điện thoại</IonLabel>
                <IonInput
                  value={phone}
                  onIonChange={(e) => setPhone(e.detail.value ?? "")}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Địa chỉ</IonLabel>
                <IonInput
                  value={address}
                  onIonChange={(e) => setAddress(e.detail.value ?? "")}
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Ngày sinh</IonLabel>
                <IonInput
                  type="date"
                  value={dob}
                  onIonChange={(e) => setDob(e.detail.value ?? "")}
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
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Địa chỉ</th>
                  <th>Ngày sinh</th>
                  <th>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.fullName}</td>
                    <td>{p.email}</td>
                    <td>{p.phone}</td>
                    <td>{p.address}</td>
                    <td>{p.dob?.substring(0, 10)}</td>

                    <td className="action-buttons">
                      <IonButton
                        size="small"
                        color="warning"
                        onClick={() => handleEdit(p)}
                      >
                        Sửa
                      </IonButton>

                      <IonButton
                        size="small"
                        color="danger"
                        onClick={() => handleDelete(p.id)}
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

export default ManagePatients;
