import React, { useEffect, useRef, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonSpinner,
} from "@ionic/react";
import { paperPlane, send, person, medkit, arrowBack } from "ionicons/icons";
import { useHistory, useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "../../services/axiosInstance";
import { getSocketUrl } from "../../services/apiConfig";
import "./ChatPagePatient.css";

// Force Light Mode Global
document.body.classList.remove("dark");

const SOCKET_URL = getSocketUrl();
const socket = io(SOCKET_URL);

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  timestamp: string;
}

interface ChatSessionDetail {
  id: number;
  doctor: {
    fullName: string;
    specialty?: { name: string };
    user: { id: number; email: string };
  };
  patient: {
    fullName: string;
    user: { id: number; email: string };
  };
}

const ChatPagePatient: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sessionDetail, setSessionDetail] = useState<ChatSessionDetail | null>(null);
  const history = useHistory();
  
  const currentUserId = parseInt(localStorage.getItem("userId") || "0");
  const receiverId = sessionDetail?.doctor.user.id;

  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    socket.emit("joinSession", sessionId);

    socket.on("newMessage", (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const sessionRes = await axios.get(`/chat/session/${sessionId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setSessionDetail(sessionRes.data);

        const messagesRes = await axios.get(`/chat/messages/${sessionId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        console.log("Messages loaded:", messagesRes.data);
        setMessages(messagesRes.data);

      } catch (error) {
        console.error("Lỗi tải dữ liệu chat:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      socket.off("newMessage");
    };
  }, [sessionId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending || !receiverId) return;

    const messageToSend = newMessage.trim();
    setIsSending(true);
    setNewMessage("");

    try {
      await axios.post(
        `/chat/messages`,
        {
          content: messageToSend,
          chatSessionId: parseInt(sessionId),
          senderId: currentUserId,
          receiverId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Input focus
      if(inputRef.current) inputRef.current.focus();
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      setNewMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Safe Date Parsing
  const safeDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const formatDateLabel = (timestamp: string) => {
    const date = safeDate(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (isSameDay(date, now)) return "Hôm nay";
    if (isSameDay(date, yesterday)) return "Hôm qua";
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatMessageTime = (timestamp: string) => {
    return safeDate(timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessages = () => {
    if (isLoading) {
      return <div className="chat-loading"><IonSpinner name="dots" /></div>;
    }

    if (!messages || messages.length === 0) {
      return (
        <div className="empty-chat">
          <p>Bắt đầu cuộc trò chuyện với bác sĩ {sessionDetail?.doctor.fullName}</p>
        </div>
      );
    }

    return messages.map((msg, index) => {
      const isCurrentUser = msg.senderId === currentUserId;
      const messageDate = safeDate(msg.timestamp);
      
      const previousMessage = index > 0 ? messages[index - 1] : null;
      const previousMessageDate = previousMessage ? safeDate(previousMessage.timestamp) : null;

      let showDateLabel = false;
      if (index === 0) {
        showDateLabel = true;
      } else if (previousMessageDate && !isSameDay(messageDate, previousMessageDate)) {
        showDateLabel = true;
      }

      return (
        <React.Fragment key={msg.id || index}>
          {showDateLabel && (
            <div className="chat-date-divider">
              <span>{formatDateLabel(msg.timestamp)}</span>
            </div>
          )}
          <div className={`message-row ${isCurrentUser ? "current-user" : "other-user"}`}>
            {!isCurrentUser && (
              <div className="avatar-container">
                 <div className="avatar-circle doctor">
                    <IonIcon icon={medkit} />
                 </div>
              </div>
            )}
            
            <div className="message-bubble-container">
              <div className={`message-bubble ${isCurrentUser ? "me" : "them"}`}>
                <div className="message-content">{msg.content}</div>
                <div className="message-time">{formatMessageTime(msg.timestamp)}</div>
              </div>
            </div>

            {isCurrentUser && (
               <div className="avatar-container">
                  <div className="avatar-circle patient">
                    <IonIcon icon={person} />
                  </div>
               </div>
            )}
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <IonPage className="chat-page-custom">
      <IonHeader className="chat-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/patient/chats" icon={arrowBack} text="" />
          </IonButtons>
          <div className="header-info">
             {sessionDetail ? (
                 <>
                    <div className="header-avatar">🩺</div>
                    <div className="header-text">
                        <h3>{sessionDetail.doctor.fullName}</h3>
                        <p>{sessionDetail.doctor.specialty?.name}</p>
                    </div>
                 </>
             ) : (
                 <IonTitle>Chat bác sĩ</IonTitle>
             )}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="chat-content">
        <div className="messages-container">
          {renderMessages()}
          <div ref={messageEndRef} />
        </div>
      </IonContent>

      <IonFooter className="chat-footer-custom">
        <div className="input-area">
            <textarea
                ref={inputRef}
                className="custom-textarea"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                disabled={isSending}
                rows={1}
            />
            <button 
                className="custom-send-btn" 
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending}
            >
                <IonIcon icon={send} />
            </button>
        </div>
      </IonFooter>
    </IonPage>
  );
};

export default ChatPagePatient;
