import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonAvatar,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonButton,
  IonRefresher,
  IonRefresherContent
} from "@ionic/react";
import {
  notificationsOutline,
  checkmarkDoneOutline,
  calendarOutline,
  cashOutline,
  medkitOutline,
  ellipsisHorizontal,
  warningOutline,
  pulseOutline,
  searchOutline
} from "ionicons/icons";
import axios from "../../services/axiosInstance";
import "./NotificationPage.css";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  status: string;
  createdAt: string;
}

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (event?: any) => {
    try {
      const res = await axios.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Lỗi tải thông báo:", err);
    } finally {
        if(event) event.detail.complete();
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "Read" } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Payment":
        return cashOutline;
      case "Reexam":
        return calendarOutline;
      case "Medical":
        return medkitOutline;
      case "Health":
      case "health_alert": // ✅ Handle new type
        return pulseOutline; 
      case "Queue":
        return notificationsOutline;
      default:
        return notificationsOutline;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "Payment":
        return "success"; // Xanh lá
      case "Reexam":
        return "warning"; // Vàng
      case "Medical":
        return "danger"; // Đỏ
      case "Health":
      case "health_alert": // ✅ Handle new type
        return "danger"; // Đỏ (Cảnh báo sức khỏe)
      case "Queue":
        return "primary";
      default:
        return "primary"; // Xanh dương
    }
  };

  const formatTime = (isoString: string) => {
      const date = new Date(isoString);
      const now = new Date();
      if(date.toDateString() === now.toDateString()) {
          return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      }
      return date.toLocaleDateString("vi-VN", {day: '2-digit', month: '2-digit'});
  }

  // Phân nhóm Mới / Trước đó (Giả sử logic đơn giản: chưa đọc là Mới)
  const newNotifs = notifications.filter((n) => n.status === "Unread");
  const oldNotifs = notifications.filter((n) => n.status === "Read");

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/patient/home" />
          </IonButtons>
          <IonTitle>Thông báo</IonTitle>
          <IonButtons slot="end">
            <IonButton>
                <IonIcon icon={searchOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="notif-content">
        <IonRefresher slot="fixed" onIonRefresh={fetchNotifications}>
            <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div className="notif-container">
          <h2 className="section-header">Thông báo</h2>

          {/* MỚI */}
          {newNotifs.length > 0 && (
            <>
              <h3 className="group-title">Mới</h3>
              <div className="notif-list">
                {newNotifs.map((n) => (
                  <div
                    key={n.id}
                    className="notif-item unread"
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className={`notif-icon-wrapper ${getIconColor(n.type)}`}>
                      <IonIcon icon={getIcon(n.type)} />
                    </div>
                    <div className="notif-body">
                      <p className="notif-text">
                        <strong>{n.title}</strong> {n.message}
                      </p>
                      <span className="notif-time">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                    <div className="notif-status-dot"></div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TRƯỚC ĐÓ */}
          <h3 className="group-title">Trước đó</h3>
          <div className="notif-list">
            {oldNotifs.map((n) => (
              <div key={n.id} className="notif-item">
                <div className={`notif-icon-wrapper ${getIconColor(n.type)}`}>
                  <IonIcon icon={getIcon(n.type)} />
                </div>
                <div className="notif-body">
                  <p className="notif-text">
                    <strong>{n.title}</strong> {n.message}
                  </p>
                  <span className="notif-time">
                    {formatTime(n.createdAt)}
                  </span>
                </div>
                <IonButton fill="clear" size="small" className="more-btn">
                    <IonIcon icon={ellipsisHorizontal} />
                </IonButton>
              </div>
            ))}
            {oldNotifs.length === 0 && newNotifs.length === 0 && (
                <p className="empty-state">Bạn chưa có thông báo nào.</p>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotificationPage;
