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
} from "@ionic/react";
import { send, close } from "ionicons/icons";

type Role = "user" | "assistant" | "system";

interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  time: string;
  loading?: boolean;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChat = ({ isOpen, onClose }: AIChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sys-1",
      role: "system",
      text: "Xin chào! Tôi là trợ lý AI của HealthHub. Tôi có thể giúp bạn về lịch khám, thông tin chuyên khoa và hướng dẫn đặt lịch. Bạn cần hỗ trợ gì?",
      time: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const contentRef = useRef<HTMLIonContentElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom(), 300);
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    contentRef.current?.scrollToBottom(300);
  };

  const addMessage = (m: ChatMessage) => setMessages((prev) => [...prev, m]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      time: new Date().toISOString(),
    };
    addMessage(userMsg);
    setInputText("");
    setSending(true);

    const placeholder: ChatMessage = {
      id: `a-p-${Date.now()}`,
      role: "assistant",
      text: "…",
      time: new Date().toISOString(),
      loading: true,
    };
    addMessage(placeholder);

    try {
      // Mock AI response - replace with actual AI integration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setMessages((prev) => prev.filter((m) => m.id !== placeholder.id));

      let reply = "Cảm ơn bạn đã hỏi! ";
      const lowerText = text.toLowerCase();

      if (lowerText.includes("đặt lịch")) {
        reply += "Để đặt lịch khám, bạn cần đăng nhập và chọn chuyên khoa phù hợp. Bạn có thể nhấn nút 'Đặt lịch ngay' ở trang chủ.";
      } else if (lowerText.includes("thời gian") || lowerText.includes("dự kiến")) {
        reply += "Bạn có thể xem thời gian dự kiến trong mục 'Theo dõi khám bệnh' ở trang chủ. Mỗi chuyên khoa đều hiển thị số đang khám và thời gian dự kiến.";
      } else if (lowerText.includes("bác sĩ")) {
        reply += "Hiện tại chúng tôi có đội ngũ hơn 100 bác sĩ chuyên khoa. Bạn muốn biết thông tin về chuyên khoa nào?";
      } else {
        reply += "Tôi có thể giúp bạn: kiểm tra thứ tự khám, hướng dẫn đặt lịch, hoặc giải thích các dịch vụ. Bạn muốn hỏi gì cụ thể?";
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: reply,
        time: new Date().toISOString(),
      };
      addMessage(assistantMsg);
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholder.id
            ? { ...m, loading: false, text: "Có lỗi xảy ra. Vui lòng thử lại." }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  };

  const quickAsk = (text: string) => {
    setInputText(text);
    setTimeout(() => sendMessage(), 100);
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
            <div style={{ display: "flex", flexDirection: "column" }}>
              <strong>AI Assistant — HealthHub</strong>
              <small style={{ fontSize: "12px", opacity: 0.7 }}>
                Hỏi về thứ tự khám, đặt lịch,...
              </small>
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
            <div
              key={m.id}
              className={`chat-bubble ${
                m.role === "user" ? "user" : m.role === "assistant" ? "assistant" : "system"
              }`}
            >
              <div className="bubble-text">
                {m.loading ? (
                  <div className="loading-line">
                    <IonSpinner name="crescent" />
                  </div>
                ) : (
                  m.text
                )}
              </div>
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
        <div className="chat-quick-actions">
          <IonButton
            fill="clear"
            size="small"
            onClick={() => quickAsk("Tôi muốn biết thời gian dự kiến của khoa Tai Mũi Họng")}
          >
            Thời gian dự kiến
          </IonButton>
          <IonButton
            fill="clear"
            size="small"
            onClick={() => quickAsk("Làm sao để đặt lịch khám?")}
          >
            Hướng dẫn đặt lịch
          </IonButton>
          <IonButton
            fill="clear"
            size="small"
            onClick={() => quickAsk("Hiện tại số đang khám của Khoa Răng Hàm Mặt là bao nhiêu?")}
          >
            Kiểm tra số đang khám
          </IonButton>
        </div>

        <div className="chat-input-row">
          <IonItem lines="none" className="chat-input-item">
            <IonTextarea
              value={inputText}
              onIonInput={(e) => setInputText(e.detail.value || "")}
              placeholder="Viết câu hỏi... (Ctrl/Cmd+Enter để gửi)"
              onKeyDown={handleKeyPress}
              autoGrow
              rows={1}
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

export default AIChat;
