import { useState, useEffect, useRef } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonButton,
  IonTextarea,
  IonItem,
  IonSpinner,
  IonIcon,
  IonAvatar,
  IonLabel,
  IonBadge,
} from "@ionic/react";
import { send, close } from "ionicons/icons";

interface Message {
  id: string;
  sender: "user" | "doctor";
  text: string;
  time: string;
  doctorName?: string;
}

interface DoctorConsultProps {
  isOpen: boolean;
  onClose: () => void;
}

const DoctorConsult = ({ isOpen, onClose }: DoctorConsultProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "d-1",
      sender: "doctor",
      text: "Xin chào! Tôi là Bác sĩ Nguyễn Văn A, chuyên khoa Tai Mũi Họng. Bạn có vấn đề gì cần tư vấn?",
      time: new Date().toISOString(),
      doctorName: "BS. Nguyễn Văn A",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [doctorOnline, setDoctorOnline] = useState(true);
  const contentRef = useRef<HTMLIonContentElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom(), 300);
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    contentRef.current?.scrollToBottom(300);
  };

  const addMessage = (m: Message) => setMessages((prev) => [...prev, m]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toISOString(),
    };
    addMessage(userMsg);
    setInputText("");
    setSending(true);

    try {
      // Mock doctor response - replace with actual chat system
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const doctorMsg: Message = {
        id: `d-${Date.now()}`,
        sender: "doctor",
        text: "Cảm ơn bạn đã chia sẻ. Dựa trên thông tin bạn cung cấp, tôi khuyên bạn nên đặt lịch khám trực tiếp để được thăm khám kỹ hơn. Bạn có thể đặt lịch ngay trên hệ thống.",
        time: new Date().toISOString(),
        doctorName: "BS. Nguyễn Văn A",
      };
      addMessage(doctorMsg);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <IonAvatar style={{ width: "32px", height: "32px" }}>
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  BS
                </div>
              </IonAvatar>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <strong>BS. Nguyễn Văn A</strong>
                <small style={{ fontSize: "12px", opacity: 0.7 }}>
                  Chuyên khoa Tai Mũi Họng
                  {doctorOnline && (
                    <IonBadge color="success" style={{ marginLeft: "8px" }}>
                      Online
                    </IonBadge>
                  )}
                </small>
              </div>
            </div>
          </IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent ref={contentRef} className="chat-content">
        <div className="chat-messages">
          {messages.map((m) => (
            <div key={m.id} className={`chat-bubble ${m.sender === "user" ? "user" : "doctor"}`}>
              {m.sender === "doctor" && (
                <div className="doctor-info">
                  <IonAvatar style={{ width: "24px", height: "24px", marginRight: "8px" }}>
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      BS
                    </div>
                  </IonAvatar>
                  <IonLabel style={{ fontSize: "12px", fontWeight: "600" }}>
                    {m.doctorName}
                  </IonLabel>
                </div>
              )}
              <div className="bubble-text">{m.text}</div>
              <div className="bubble-time">
                {new Date(m.time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>
      </IonContent>

      <IonFooter>
        <div className="doctor-notice">
          <small style={{ color: "var(--ion-color-medium)", fontSize: "11px", padding: "8px 16px", display: "block" }}>
            💡 Đây là tư vấn sơ bộ. Vui lòng đặt lịch khám để được thăm khám chi tiết.
          </small>
        </div>

        <div className="chat-input-row">
          <IonItem lines="none" className="chat-input-item">
            <IonTextarea
              value={inputText}
              onIonInput={(e) => setInputText(e.detail.value || "")}
              placeholder="Mô tả triệu chứng của bạn... (Ctrl/Cmd+Enter để gửi)"
              onKeyDown={handleKeyPress}
              autoGrow
              rows={2}
            />
          </IonItem>
          <div className="chat-send-area">
            <IonButton onClick={sendMessage} disabled={sending} className="chat-send-button">
              {sending ? <IonSpinner /> : <IonIcon icon={send} />}
            </IonButton>
          </div>
        </div>
      </IonFooter>
    </IonModal>
  );
};

export default DoctorConsult;
