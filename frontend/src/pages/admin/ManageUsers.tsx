import React, { useEffect, useState } from "react";
import axios from "../../services/axiosInstance";

import { IonPage, IonContent } from "@ionic/react";
import AdminSidebar from "../../components/AdminSidebar";

import "./ManageUsers.css";

interface User {
  id: number;
  email: string;
  role: string;
}

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users")
      .then((res) => setUsers(res.data));
  }, []);

  return (
    <IonPage className="admin-container">
      <AdminSidebar />

      <div id="main">
        <IonContent className="ion-padding">
          {/* HEADER */}
          <div className="page-header-new">
            <h1>Quản lý người dùng</h1>
            <p>Chào mừng bạn quay trở lại với hệ thống quản trị</p>
          </div>

          {/* TABLE */}
          <div className="users-box">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.role.toLowerCase()}`}>
                        {u.role.toUpperCase()}
                      </span>
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

export default ManageUsers;
