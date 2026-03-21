import React, { useEffect, useState } from "react";
import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonContent,
  IonPage,
  IonIcon,
} from "@ionic/react";

import { pencil, trash } from "ionicons/icons";
import axios from "../../services/axiosInstance";

import AdminSidebar from "../../components/AdminSidebar";
import "./ManageDoctors.css"; // dùng UI premium chung

interface Specialty {
  id: number;
  name: string;
}

const AdminSpecialties: React.FC = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const fetchSpecialties = async () => {
    const res = await axios.get("/specialties");
    setSpecialties(res.data);
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await axios.post("/specialties", { name: newName });
    setNewName("");
    fetchSpecialties();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xoá chuyên khoa này?")) return;
    await axios.delete(`/specialties/${id}`);
    fetchSpecialties();
  };

  const handleEdit = (id: number, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleUpdate = async () => {
    if (!editingName.trim() || editingId === null) return;
    await axios.put(`/specialties/${editingId}`, { name: editingName });
    setEditingId(null);
    setEditingName("");
    fetchSpecialties();
  };

  return (
    <IonPage className="admin-container">
      <AdminSidebar />

      <div id="main">
        <IonContent className="ion-padding">
          {/* HEADER */}
          <div className="page-header-new">
            <h1>Quản lý chuyên khoa</h1>
            <p>Chào mừng bạn quay trở lại với hệ thống quản trị</p>
          </div>

          {/* FORM ADD NEW */}
          <div className="doctor-form-card">
            <h2 className="form-title">Thêm chuyên khoa mới</h2>

            <div className="form-grid">
              <IonItem>
                <IonLabel position="stacked">Tên chuyên khoa</IonLabel>
                <IonInput
                  placeholder="Nhập tên..."
                  value={newName}
                  onIonChange={(e) => setNewName(e.detail.value ?? "")}
                />
              </IonItem>
            </div>

            <IonButton
              expand="block"
              className="submit-btn"
              onClick={handleAdd}
            >
              Thêm mới
            </IonButton>
          </div>

          {/* TABLE LIST */}
          <div className="table-wrapper">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên chuyên khoa</th>
                  <th>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {specialties.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>

                    {/* Nếu đang edit */}
                    {editingId === s.id ? (
                      <>
                        <td>
                          <IonInput
                            value={editingName}
                            onIonChange={(e) =>
                              setEditingName(e.detail.value ?? "")
                            }
                          />
                        </td>
                        <td className="action-buttons">
                          <IonButton
                            size="small"
                            color="success"
                            onClick={handleUpdate}
                          >
                            Lưu
                          </IonButton>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{s.name}</td>
                        <td className="action-buttons">
                          <IonButton
                            size="small"
                            color="warning"
                            onClick={() => handleEdit(s.id, s.name)}
                          >
                            <IonIcon icon={pencil} />
                          </IonButton>

                          <IonButton
                            size="small"
                            color="danger"
                            onClick={() => handleDelete(s.id)}
                          >
                            <IonIcon icon={trash} />
                          </IonButton>
                        </td>
                      </>
                    )}
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

export default AdminSpecialties;
