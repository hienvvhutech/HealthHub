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
// import "./ChatSessionsDoctor.css";

interface ChatSession {
  id: number;
  patient?: {
    fullName: string;
  };
  updatedAt: string;
}

const ChatSessionsDoctor: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const history = useHistory();

  const fetchSessions = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    try {
      // ✅ Use relative path
      const res = await axios.get(
        `/chat/session?userId=${userId}&role=doctor`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("📦 Doctor sessions:", res.data);
      setSessions(res.data || []);
    } catch (error) {
      console.error("Lỗi tải danh sách chat session:", error);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/doctor/home" />
          </IonButtons>
          <IonTitle>Danh sách tư vấn</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonList>
          {sessions.map((s) => (
            <IonItem
              key={s.id}
              button
              onClick={() => history.push(`/doctor/chat/${s.id}`)}
            >
              <IonAvatar slot="start">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: "#ddd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  🧑‍⚕️
                </div>
              </IonAvatar>
              <IonLabel>
                <h2>
                  {s.patient?.fullName || (
                    <span style={{ color: "gray" }}>
                      [Không có tên bệnh nhân]
                    </span>
                  )}
                </h2>
                {!s.patient && (
                  <pre style={{ fontSize: "0.6rem", color: "#ccc" }}>
                    {JSON.stringify(s, null, 2)}
                  </pre>
                )}
              </IonLabel>
              <IonText slot="end" color="medium">
                <small>
                  {new Date(s.updatedAt).toLocaleDateString("vi-VN")}
                </small>
              </IonText>
            </IonItem>
          ))}
          {sessions.length === 0 && (
            <p
              style={{ textAlign: "center", color: "#999", marginTop: "2rem" }}
            >
              Bạn chưa có cuộc trò chuyện nào.
            </p>
          )}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default ChatSessionsDoctor;
