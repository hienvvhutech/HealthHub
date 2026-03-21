import React, { useEffect, useState, useRef } from "react";
import { IonPage, IonContent, IonIcon } from "@ionic/react";
import axios from "../../services/axiosInstance";
import AdminSidebar from "../../components/AdminSidebar";
import "./AdminSupport.css";
import {
  sendOutline,
  ellipsisHorizontal,
  createOutline,
  callOutline,
  videocamOutline,
  informationCircleOutline,
  addCircleOutline,
  imageOutline,
  micOutline,
  happyOutline,
} from "ionicons/icons";

interface ChatSession {
  guestId: string;
  lastActive: string;
}

interface ChatMessage {
  id: number;
  sender: "user" | "admin" | "system";
  message: string;
  createdAt: string;
}

const AdminSupport: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessions = async () => {
    // ✅ Use relative path
    const res = await axios.get("/public-chat/sessions");
    setSessions(res.data);
  };

  const loadMessages = async (chatId: string) => {
    // ✅ Use relative path
    const res = await axios.get(
      `/public-chat/history/${chatId}`
    );
    setMessages(res.data);
  };

  const sendAdminMsg = async () => {
    if (!input.trim() || !selectedChat) return;

    // ✅ Use relative path
    await axios.post("/public-chat/admin-send", {
      chatId: selectedChat,
      message: input,
    });

    setInput("");
    loadMessages(selectedChat);
  };

  const openChat = (chatId: string) => {
    setSelectedChat(chatId);
    loadMessages(chatId);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <IonPage className="admin-container">
      {/* SIDEBAR TÍM BÊN TRÁI */}
      <AdminSidebar />

      {/* NỘI DUNG CHÍNH BÊN PHẢI */}
      <div id="main">
        <IonContent scrollY={false} className="ion-no-padding">
          <div className="admin-support-wrapper">
            {/* ========== LEFT SIDEBAR (Chat List) ========== */}
            <div className="chat-list">
              {/* Header */}
              <div className="chat-list-header">
                <span>Đoạn chat</span>
                <div className="header-actions">
                  <div className="header-action-btn">
                    <IonIcon icon={ellipsisHorizontal} />
                  </div>
                  <div className="header-action-btn">
                    <IonIcon icon={createOutline} />
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="chat-search">
                <input placeholder="Tìm kiếm trên Messenger" />
              </div>

              {/* Chat List - SCROLLABLE */}
              <div className="chat-list-content">
                {sessions.map((s) => {
                  const chatId = s.guestId;

                  return (
                    <div
                      key={chatId}
                      className={`chat-item ${
                        selectedChat === chatId ? "active" : ""
                      }`}
                      onClick={() => openChat(chatId)}
                    >
                      <div className="avatar">🧑</div>
                      <div className="chat-info">
                        <div className="chat-name">Khách vãng lai</div>
                        <div className="chat-preview">
                          {new Date(s.lastActive).toLocaleString("vi-VN")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========== RIGHT CHAT WINDOW ========== */}
            <div className="chat-window">
              {!selectedChat ? (
                <div className="no-chat-selected">
                  <div style={{ fontSize: "80px" }}>💬</div>
                  <h2>Chọn đoạn chat</h2>
                  <p>Hãy chọn một cuộc trò chuyện để bắt đầu</p>
                </div>
              ) : (
                <>
                  {/* Chat Header - FIXED TOP */}
                  <div className="chat-header-right">
                    <div className="chat-header-left">
                      <div className="chat-header-avatar">🧑</div>
                      <div className="chat-header-info">
                        <h3>Khách vãng lai</h3>
                        <div className="status">Đang hoạt động</div>
                      </div>
                    </div>
                    <div className="chat-header-actions">
                      <button className="header-icon-btn">
                        <IonIcon icon={callOutline} />
                      </button>
                      <button className="header-icon-btn">
                        <IonIcon icon={videocamOutline} />
                      </button>
                      <button className="header-icon-btn">
                        <IonIcon icon={informationCircleOutline} />
                      </button>
                    </div>
                  </div>

                  {/* Chat Messages - SCROLLABLE */}
                  <div className="chat-messages">
                    {messages.map((m) => (
                      <div key={m.id} className={`bubble-row ${m.sender}`}>
                        {/* KHÁCH HÀNG (user) - Avatar bên TRÁI */}
                        {m.sender === "user" && (
                          <div className="bubble-avatar">🧑</div>
                        )}

                        <div className="bubble-content">
                          <div className="bubble">{m.message}</div>
                          <div className="time">
                            {new Date(m.createdAt).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input - FIXED BOTTOM */}
                  <div className="chat-input">
                    <div className="chat-input-wrapper">
                      <div className="chat-input-actions">
                        <button className="input-action-btn">
                          <IonIcon icon={addCircleOutline} />
                        </button>
                        <button className="input-action-btn">
                          <IonIcon icon={imageOutline} />
                        </button>
                        <button className="input-action-btn">
                          <IonIcon icon={micOutline} />
                        </button>
                      </div>

                      <input
                        value={input}
                        placeholder="Aa"
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendAdminMsg()}
                      />

                      <button className="input-action-btn">
                        <IonIcon icon={happyOutline} />
                      </button>
                    </div>

                    <button
                      className="send-btn"
                      onClick={sendAdminMsg}
                      disabled={!input.trim()}
                    >
                      <IonIcon icon={sendOutline} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </IonContent>
      </div>
    </IonPage>
  );
};

export default AdminSupport;
