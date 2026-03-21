import React from "react";
import { IonIcon } from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import {
  homeOutline,
  calendarOutline,
  documentTextOutline,
  personOutline,
  chatbubbleEllipsesOutline,
  logOutOutline
} from "ionicons/icons";
import "./AdminSidebar.css"; // Tái sử dụng CSS của Admin Sidebar

const DoctorSidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({ isOpen, onClose }) => {
  const history = useHistory();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    history.push(path);
    if (onClose) onClose();
  };

  const menuItems = [
    { text: "Dashboard", path: "/doctor/home", icon: homeOutline },
    { text: "Lịch làm việc", path: "/doctor/appointments", icon: calendarOutline },
    { text: "Hồ sơ bệnh nhân", path: "/doctor/medical-records", icon: documentTextOutline },
    { text: "Hồ sơ cá nhân", path: "/doctor/profile", icon: personOutline },
    { text: "Phản hồi & Chat", path: "/doctor/chats", icon: chatbubbleEllipsesOutline },
  ];

  return (
    <div className={`admin-sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h2>Doctor Portal</h2>
        <p>Hệ thống bác sĩ</p>
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

export default DoctorSidebar;
