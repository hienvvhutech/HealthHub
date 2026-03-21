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
  IonSpinner,
  IonBadge,
  IonSearchbar, // Added IonSearchbar
} from "@ionic/react";
import { personCircleOutline, sendOutline, refreshOutline } from "ionicons/icons";
import AdminSidebar from "../../components/AdminSidebar";
import axios from "../../services/axiosInstance";
import io from "socket.io-client";
import "./CustomerSupport.css";

const SOCKET_URL = "http://localhost:3000"; 

interface ChatSession {
  guestId: string;
  lastMessage?: string; // Optional if we fetch details
  _max: { createdAt: string };
}

interface Message {
  id: number;
  guestId: string;
  sender: "user" | "admin" | "system";
  message: string;
  createdAt: string;
}

const CustomerSupport: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query

  useEffect(() => {
    fetchSessions();
    
    // Connect Socket
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("newPublicMessage", (msg: Message) => {
      // Nếu đang mở cuộc trò chuyện này -> Cập nhật tin nhắn
      if (selectedSession && msg.guestId === selectedSession) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
      // Reload danh sách session để đưa lên đầu
      fetchSessions();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [selectedSession]); // Re-bind listener if selectedSession changes? No, logic inside check selectedSession

  const fetchSessions = async () => {
    try {
      const res = await axios.get("/public-chat/sessions");
      setSessions(Array.isArray(res.data) ? res.data : []); // Ensure res.data is an array
    } catch (err) {
      console.error("Lỗi lấy sessions", err);
      setSessions([]); // Set to empty array on error
    }
  };

  const loadHistory = async (guestId: string) => {
    setSelectedSession(guestId);
    try {
      const res = await axios.get(`/public-chat/history/${guestId}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (err) {
      console.error("Lỗi lấy lịch sử", err);
    }
  };

  const sendReply = async () => {
    if (!input.trim() || !selectedSession) return;
    
    const text = input;
    setInput(""); // Clear input early

    try {
      await axios.post("/public-chat/admin-send", {
        chatId: selectedSession,
        message: text,
      });
      // Socket will update the UI, or optimistic update
    } catch (err) {
      console.error("Gửi tin thất bại", err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Filtered sessions based on search query
  const filteredSessions = sessions.filter(session => {
    const guestIdentifier = session.guestId.startsWith("patient-") 
      ? `Bệnh nhân #${session.guestId.split("-")[1]}` 
      : "Khách vãng lai";
    return guestIdentifier.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <IonPage className="admin-container">
      <AdminSidebar />
      <div id="main" className="support-layout">
        
        {/* Sidebar List Sessions */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h2>Đoạn chat</h2> {/* Changed header to match image */}
            <IonIcon icon={refreshOutline} onClick={fetchSessions} style={{cursor: 'pointer'}}/>
          </div>
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value ?? '')}
            placeholder="Tìm kiếm cuộc trò chuyện..." // Changed placeholder as requested
            className="customer-support-searchbar"
          ></IonSearchbar>
          <div className="session-list">
            {filteredSessions.map((s) => ( // Use filteredSessions here
              <div 
                key={s.guestId} 
                className={`session-item ${selectedSession === s.guestId ? "active" : ""}`}
                onClick={() => loadHistory(s.guestId)}
              >
                <div className="session-avatar">
                  <IonIcon icon={personCircleOutline} />
                </div>
                <div className="session-info">
                  <div className="session-name">
                    {s.guestId.startsWith("patient-") ? `Bệnh nhân #${s.guestId.split("-")[1]}` : "Khách vãng lai"}
                  </div>
                  <div className="session-time">
                    {new Date(s._max.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="chat-window">
          {selectedSession ? (
            <>
              <div className="chat-header">
                <h3>Đang chat với: {selectedSession.startsWith("patient-") ? `Bệnh nhân #${selectedSession.split("-")[1]}` : "Khách vãng lai"}</h3>
              </div>
              <div className="chat-content">
                {messages.map((m) => (
                  <div key={m.id} className={`chat-bubble ${m.sender}`}>
                    <div className="bubble-text">{m.message}</div>
                    <div className="bubble-time">
                      {new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input-area">
                <IonInput 
                  value={input} 
                  placeholder="Nhập câu trả lời..." 
                  onIonChange={e => setInput(e.detail.value!)}
                  onKeyPress={e => e.key === 'Enter' && sendReply()}
                />
                <IonButton onClick={sendReply}>
                  <IonIcon icon={sendOutline} />
                </IonButton>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Chọn một cuộc hội thoại để bắt đầu</p>
            </div>
          )}
        </div>

      </div>
    </IonPage>
  );
};

export default CustomerSupport;
