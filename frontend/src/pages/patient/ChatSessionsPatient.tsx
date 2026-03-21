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
  IonAvatar,
  IonText,
  IonButtons,
  IonBackButton,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import axios from "../../services/axiosInstance";
// import "./ChatSessionsPatient.css";

interface ChatSession {
  id: number;
  doctor: {
    fullName: string;
    specialty?: { name: string };
  };
  updatedAt: string;
}

const ChatSessionsPatient: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const history = useHistory();

  const fetchSessions = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    try {
      // ✅ Use relative path
      const res = await axios.get(
        `/chat/session?userId=${userId}&role=patient`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSessions(res.data || []);
    } catch (error) {
      console.error("Lỗi tải danh sách chat session:", error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <IonPage className="chat-sessions-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/patient/home" />
          </IonButtons>
          <IonTitle>Hộp thư tư vấn</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonList>
          {sessions.map((s) => (
            <IonItem
              key={s.id}
              button
              onClick={() => history.push(`/patient/chat/${s.id}`)}
            >
              <IonAvatar slot="start">
                <div className="doctor-avatar">🩺</div>
              </IonAvatar>
              <IonLabel>
                <h2>{s.doctor.fullName}</h2>
                <p>
                  {s.doctor.specialty?.name
                    ? `Chuyên khoa: ${s.doctor.specialty.name}`
                    : "Không rõ chuyên khoa"}
                </p>
              </IonLabel>
              <IonText slot="end" className="date-text">
                <small>
                  {new Date(s.updatedAt).toLocaleDateString("vi-VN")}
                </small>
              </IonText>
            </IonItem>
          ))}
          {sessions.length === 0 && (
            <div className="empty-state">
              <p>Bạn chưa có cuộc trò chuyện nào.</p>
            </div>
          )}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default ChatSessionsPatient;
