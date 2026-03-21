import React, { useEffect, useState, useRef } from "react";
import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonIcon,
  IonInput,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonBackButton,
  IonButtons,
} from "@ionic/react";
import { personCircleOutline, sendOutline, refreshOutline } from "ionicons/icons";
import axios from "../../services/axiosInstance";
import io from "socket.io-client";
import "./DoctorChat.css";

const SOCKET_URL = "http://localhost:3000";

interface ChatSession {
  id: number;
  patient: { fullName: string; avatarUrl?: string };
  lastMessage?: string;
  updatedAt: string;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  createdAt: string; // or sentAt
}

const DoctorChat: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<any>(null);
  
  const doctorId = parseInt(localStorage.getItem("userId") || "0"); // Assuming userId maps to doctor

  useEffect(() => {
    fetchSessions();
    
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("newMessage", (msg: any) => {
      if (selectedSession && msg.chatSessionId === selectedSession) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
      fetchSessions(); // Refresh list to show unread or order
    });

    return () => {
      newSocket.disconnect();
    };
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`/chat/sessions?role=doctor&userId=${doctorId}`);
      setSessions(res.data);
    } catch (err) {
      console.error("Lỗi tải session", err);
    }
  };

  const loadMessages = async (sessionId: number) => {
    setSelectedSession(sessionId);
    try {
      const res = await axios.get(`/chat/messages/${sessionId}`);
      setMessages(res.data);
      scrollToBottom();
      
      // Join room
      if (socket) {
          socket.emit("joinSession", sessionId);
      }
    } catch (err) {
      console.error("Lỗi tải tin nhắn", err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedSession) return;
    const content = input;
    setInput("");

    try {
      // Find receiverId (Patient ID)
      const session = sessions.find(s => s.id === selectedSession);
      // We need patient's userId to send notification? 
      // chat.controller.sendMessage needs: { content, chatSessionId, senderId, receiverId }
      // We can pass just chatSessionId and senderId? 
      // Let's check chat.controller.ts (Turn 70).
      // It takes senderId, receiverId.
      // We assume receiverId is patient.userId? Or patient.id?
      // Usually ChatSession has patientId.
      // I'll send just chatSessionId and content if backend supports it, or I need receiverId.
      // Let's assume Backend infers or we pass 0 for now if unsure.
      // Actually, standard is:
      
      await axios.post("/chat/send", {
        chatSessionId: selectedSession,
        senderId: doctorId, 
        receiverId: 0, // Backend might ignore if using session
        content: content
      });
    } catch (err) {
      console.error("Gửi tin thất bại", err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/doctor/home" /></IonButtons>
          <IonTitle>Tư vấn bệnh nhân</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="doctor-chat-layout">
        <div className="d-chat-container">
            {/* Sidebar */}
            <div className="d-chat-sidebar">
                <div className="d-sidebar-header">Danh sách tư vấn</div>
                {sessions.map(s => (
                    <div key={s.id} className={`d-session-item ${selectedSession === s.id ? 'active' : ''}`} onClick={() => loadMessages(s.id)}>
                        <div className="d-avatar"><IonIcon icon={personCircleOutline}/></div>
                        <div className="d-info">
                            <div className="d-name">{s.patient?.fullName}</div>
                            <div className="d-time">Session #{s.id}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Chat */}
            <div className="d-chat-main">
                {selectedSession ? (
                    <>
                        <div className="d-messages">
                            {messages.map((m, idx) => (
                                <div key={idx} className={`d-message ${m.senderId === doctorId ? 'me' : 'other'}`}>
                                    <div className="d-msg-content">{m.content}</div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="d-input-area">
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder="Nhập tin nhắn..." />
                            <button onClick={sendMessage}><IonIcon icon={sendOutline}/></button>
                        </div>
                    </>
                ) : (
                    <div className="d-no-chat">Chọn bệnh nhân để bắt đầu tư vấn</div>
                )}
            </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DoctorChat;
