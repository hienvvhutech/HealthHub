// src/pages/admin/AdminFeedbacks.tsx
import React, { useEffect, useState } from "react";
import axios from "../../services/axiosInstance";
import { IonButton } from "@ionic/react";
import "./AdminStyle.css";

interface Feedback {
  id: number;
  fullName: string;
  email: string;
  message: string;
  createdAt: string;
}

const AdminFeedbacks: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const fetchFeedbacks = async () => {
    // ✅ Use relative path
    const res = await axios.get("/feedbacks");
    setFeedbacks(res.data);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá phản hồi này?")) return;
    // ✅ Use relative path
    await axios.delete(`/feedbacks/${id}`);
    fetchFeedbacks();
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  return (
    <div className="admin-container">
      <h2>📬 Quản lý Phản hồi</h2>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Nội dung</th>
            <th>Thời gian gửi</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {feedbacks.map((f) => (
            <tr key={f.id}>
              <td>{f.id}</td>
              <td>{f.fullName}</td>
              <td>{f.email}</td>
              <td>{f.message}</td>
              <td>{f.createdAt?.substring(0, 19).replace("T", " ")}</td>
              <td>
                <IonButton
                  size="small"
                  color="danger"
                  onClick={() => handleDelete(f.id)}
                >
                  Xoá
                </IonButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <IonButton routerLink="/admin/admin-dashboard" className="back-button">
        ← Quay lại trang Admin
      </IonButton>
    </div>
  );
};

export default AdminFeedbacks;
