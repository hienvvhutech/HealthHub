import React from "react";
import { IonIcon } from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import {
  homeOutline,
  peopleOutline,
  personOutline,
  personAddOutline,
  calendarOutline,
  medkitOutline,
  chatbubbleEllipsesOutline,
  logOutOutline,
  analyticsOutline
} from "ionicons/icons";
import "./AdminSidebar.css";

const AdminSidebar: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    history.push(path);
  };

  const menuItems = [
    { text: "Dashboard", path: "/admin/admin-dashboard", icon: homeOutline },
    { text: "KPI Dashboard", path: "/admin/kpi-dashboard", icon: analyticsOutline },
    { text: "Quản lý người dùng", path: "/admin/manage-users", icon: peopleOutline },
    { text: "Quản lý bác sĩ", path: "/admin/manage-doctors", icon: personOutline },
    { text: "Quản lý bệnh nhân", path: "/admin/manage-patients", icon: personAddOutline },
    { text: "Quản lý lịch hẹn", path: "/admin/manage-appointments", icon: calendarOutline },
    { text: "Quản lý chuyên khoa", path: "/admin/manage-specialties", icon: medkitOutline },
    { text: "Chăm sóc khách hàng", path: "/admin/support", icon: chatbubbleEllipsesOutline },
  ];

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <h2>Admin Portal</h2>
        <p>Hệ thống đặt khám</p>
      </div>
      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <div
            key={item.path}
            className={`menu-item ${
              location.pathname === item.path ? "active" : ""
            }`}
            onClick={() => handleNavigate(item.path)}
          >
            <IonIcon icon={item.icon} />
            <span>{item.text}</span>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="menu-item logout-btn" onClick={() => handleNavigate("/login")}>
          <IonIcon icon={logOutOutline} />
          <span>Đăng xuất</span>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
