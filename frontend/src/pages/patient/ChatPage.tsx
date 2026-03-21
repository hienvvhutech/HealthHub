import React, { useEffect, useState, useRef } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonFooter,
  IonInput,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { sendOutline } from "ionicons/icons";
import { useParams } from "react-router-dom";
import axios from "../../services/axiosInstance";
import io from "socket.io-client"; // ✅ Import Socket
import "./ChatPage.css";

const SOCKET_URL = "http://localhost:3000"; // Đổi IP nếu chạy trên điện thoại thật

interface Message {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
}

const ChatPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Lấy userId từ localStorage
  const userId = parseInt(localStorage.getItem("userId") || "0");

  useEffect(() => {
    fetchMessages();

    // ✅ KẾT NỐI SOCKET
    const socket = io(SOCKET_URL);
    
    // Tham gia phòng chat (session)
    socket.emit("joinSession", parseInt(sessionId)); 

    // Lắng nghe tin nhắn mới
    socket.on("newMessage", (msg: Message) => {
      // Chỉ nhận tin nhắn nếu ID tin nhắn > 0 (tin nhắn thật từ server)
      // Và tránh duplicate (nếu optimistic update đã thêm rồi)
      if (msg && msg.id > 0) {
          setMessages((prev) => {
              // Kiểm tra xem tin nhắn đã tồn tại chưa (tránh trùng)
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, msg];
          });
          scrollToBottom();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`/chat/messages/${sessionId}`);
      setMessages(res.data);
      scrollToBottom();
    } catch (error) {
      console.error("Lỗi tải tin nhắn:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const content = input;
    setInput("");

    // ✅ OPTIMISTIC UPDATE (Hiện ngay lập tức)
    const tempId = Date.now();
    const tempMsg: Message = {
        id: tempId, // ID tạm
        content: content,
        senderId: userId,
        createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    try {
      const res = await axios.post("/chat/send", {
        chatSessionId: parseInt(sessionId),
        senderId: userId,
        content,
        receiverId: 0, // Backend tự xử lý logic receiver nếu cần
      });
      
      // Cập nhật lại tin nhắn thật từ server (thay thế tin nhắn tạm)
      setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));

    } catch (error) {
      console.error("Lỗi gửi tin:", error);
      // Xóa tin nhắn tạm nếu lỗi
      setMessages(prev => prev.filter(m => m.id !== tempId));
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
          <IonButtons slot="start">
            <IonBackButton defaultHref="/patient/find-doctor" />
          </IonButtons>
          <IonTitle>Tư vấn trực tuyến</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="chat-content-bg">
        <div className="messages-list">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message-bubble ${
                msg.senderId === userId ? "my-message" : "their-message"
              }`}
            >
              <div className="message-text">{msg.content}</div>
              <div className="message-time">
                  {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </IonContent>

      <IonFooter className="chat-footer">
        <IonToolbar>
          <div style={{ display: "flex", alignItems: "center", padding: "0 10px" }}>
            <IonInput
              value={input}
              placeholder="Nhập tin nhắn..."
              onIonChange={(e) => setInput(e.detail.value!)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              style={{ background: "#f1f1f1", borderRadius: "20px", paddingLeft: "10px", marginRight: "10px", '--padding-start': '10px' }}
            />
            <IonButton fill="clear" onClick={sendMessage}>
              <IonIcon icon={sendOutline} slot="icon-only" />
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default ChatPage;
