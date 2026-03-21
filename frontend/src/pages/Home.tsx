import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonLabel,
  IonButton,
  IonIcon,
  IonAlert,
  IonFab,
  IonFabButton,
} from "@ionic/react";
import {
  logInOutline,
  refreshOutline,
  chatbubbleEllipsesOutline,
} from "ionicons/icons";
import axios from "../services/axiosInstance"; // ✅ Sử dụng axiosInstance
import "./Home.css";
import { useHistory } from "react-router-dom";
import Footer from "../components/Footer";

interface Department {
  specialty: string;
  doctor: string;
  currentNumber: number;
  nextTime: string;
  color: string;
}
interface PublicChatAPI {
  id: number;
  guestId: string;
  message: string;
  sender: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "admin" | "system";
  text: string;
  time: string;
}

const Home: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const history = useHistory();

  const [guestId] = useState(() => {
    let id = localStorage.getItem("guestId");
    if (!id) {
      id = "guest-" + Date.now();
      localStorage.setItem("guestId", id);
    }
    return id;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQueue = async () => {
    try {
      // ✅ Use relative path
      const res = await axios.get("/appointments/queue-status");
      setDepartments(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách khoa:", err);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  const formatMessage = (m: PublicChatAPI): ChatMessage => ({
    id: String(m.id),
    sender: m.sender as "user" | "admin" | "system",
    text: m.message,
    time: m.createdAt,
  });

  const loadHistory = async () => {
    try {
      // ✅ Use relative path
      const res = await axios.get(`/public-chat/history/${guestId}`);
      setMessages(res.data.map((m: PublicChatAPI) => formatMessage(m)));
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    if (chatOpen) loadHistory();
  }, [chatOpen]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setSending(true);

    try {
      // ✅ Use relative path
      await axios.post("/public-chat/send", {
        chatId: guestId,
        message: text,
      });

      await loadHistory(); // Load cả auto reply
    } catch (e) {
      console.error("Lỗi gửi tin:", e);
    }

    setSending(false);
  };
  return (
    <IonPage className="home-full-wrapper">
      <IonHeader className="modern-header">
        <IonToolbar className="modern-toolbar">
          <IonTitle className="modern-title">
            <div className="title-content">
              <span className="app-name">HealthHub</span>
              <span className="current-time">
                {currentTime.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </IonTitle>
          <div slot="end" className="header-actions">
            <IonButton
              className="login-button-modern"
              fill="solid"
              size="small"
              onClick={() => history.push("/login")}
            >
              <IonIcon icon={logInOutline} slot="start" />
              Đăng nhập
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="modern-content">
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Chăm Sóc Sức Khỏe Thông Minh & Toàn Diện
              </h1>
              <p className="hero-subtitle">
                Kết nối với dịch vụ y tế uy tín, tiện lợi và hiện đại
              </p>
              <p className="hero-description">
                Đặt lịch khám bệnh chỉ trong vài click.
              </p>
              <div className="hero-actions">
                <IonButton
                  className="hero-button-primary"
                  fill="solid"
                  onClick={() => setShowLoginAlert(true)}
                >
                  📅 Đặt lịch ngay
                </IonButton>
              </div>
            </div>
          </div>

          <div className="stats-section">
            <div className="stat-item">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-number">100+</div>
              <div className="stat-label">Bác sĩ</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🏥</div>
              <div className="stat-number">50+</div>
              <div className="stat-label">Chuyên khoa</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🕒</div>
              <div className="stat-number">24/7</div>
              <div className="stat-label">Hỗ trợ</div>
            </div>
          </div>
        </div>

        {/* About HealthHub Section */}
        <div className="about-section">
          <div className="about-container">
            <div className="about-content">
              <div className="about-text">
                <h2 className="about-title">Giới thiệu về HealthHub</h2>
                <p className="about-description">
                  HealthHub là nền tảng kết nối bệnh nhân với đội ngũ bác sĩ uy
                  tín và chuyên nghiệp trên toàn quốc. Chúng tôi mang đến trải
                  nghiệm đặt lịch khám bệnh nhanh chóng, tiện lợi và minh bạch.
                </p>
                <div className="about-features">
                  <div className="feature-item">
                    <div className="feature-icon">⚡</div>
                    <div className="feature-text">
                      <h4>Đặt lịch nhanh chóng</h4>
                      <p>Chỉ vài bước đơn giản để đăng ký khám bệnh.</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">📋</div>
                    <div className="feature-text">
                      <h4>Quản lý sổ khám bệnh</h4>
                      <p>
                        Theo dõi lịch sử khám, đơn thuốc và kết quả xét nghiệm
                        mọi lúc.
                      </p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-icon">💬</div>
                    <div className="feature-text">
                      <h4>Tư vấn & hỗ trợ</h4>
                      <p>
                        Đội ngũ CSKH hỗ trợ 24/7 giải đáp mọi thắc mắc của bạn.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="about-image">
                <img
                  src="/assets/health.png"
                  alt="About HealthHub"
                  className="about-image-real"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Theo dõi khám bệnh */}
        <div className="section-container">
          <div className="section-header">
            <div className="section-title-row">
              <div>
                <h2 className="section-title">Theo dõi khám bệnh</h2>
                <p className="section-subtitle">
                  Cập nhật thời gian thực từng khoa
                </p>
              </div>
              <IonButton fill="outline" size="small" onClick={fetchQueue}>
                <IonIcon icon={refreshOutline} slot="start" />
                Làm mới
              </IonButton>
            </div>
          </div>

          <IonGrid className="queue-grid-modern">
            <IonRow>
              {departments.map((dept, idx) => (
                <IonCol size="12" sizeMd="6" key={idx}>
                  <IonCard className="queue-card-modern">
                    <IonCardContent className="queue-card-content">
                      <div className="queue-header">
                        <div className="dept-info">
                          <div className="dept-icon-wrapper">
                            <span
                              className="dept-icon"
                              style={{ color: dept.color }}
                            >
                              🩺
                            </span>
                          </div>
                          <div>
                            <h3 className="dept-name">{dept.specialty}</h3>
                            <p className="dept-doctor">{dept.doctor}</p>
                          </div>
                        </div>
                        <IonChip className="status-chip" color="success">
                          <IonLabel>Đang khám</IonLabel>
                        </IonChip>
                      </div>

                      <div className="current-number-section">
                        <div className="current-number-display">
                          <span
                            className="current-number"
                            style={{ color: dept.color }}
                          >
                            {String(dept.currentNumber || 0).padStart(2, "0")}
                          </span>
                          <span className="current-label">Đang khám</span>
                        </div>
                        <div className="next-time">
                          Dự kiến: {dept.nextTime || "--:--"}
                        </div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </div>

        <Footer />

        <IonAlert
          isOpen={showLoginAlert}
          onDidDismiss={() => setShowLoginAlert(false)}
          header="Yêu cầu đăng nhập"
          message="Vui lòng đăng nhập để đặt lịch khám bệnh."
          buttons={[
            {
              text: "Hủy",
              role: "cancel",
            },
            {
              text: "Đăng nhập",
              handler: () => {
                history.push("/login");
              },
            },
          ]}
        />

        {/* --- Floating Chat button & Modal --- */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton
            onClick={() => setChatOpen(true)}
            className="chat-fab-button"
            title="Hỏi AI"
          >
            <IonIcon icon={chatbubbleEllipsesOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>
      {chatOpen && (
        <div className="chatbox-container">
          <div className="chatbox-header">
            <span>Hỗ trợ bệnh viện (24/7)</span>
            <button
              onClick={() => {
                setChatOpen(false);
                setMessages([]);
                const newGuest = "guest-" + Date.now();
                localStorage.setItem("guestId", newGuest);
                window.location.reload();
              }}
            >
              ×
            </button>
          </div>

          <div className="chatbox-messages">
            {messages.map((m) => (
              <div key={m.id} className={`msg ${m.sender}`}>
                <div className="msg-text">{m.text}</div>
                <div className="msg-time">
                  {m.time
                    ? new Date(m.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </div>
              </div>
            ))}
          </div>

          <div className="chatbox-input">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập tin nhắn..."
            />
            <button onClick={sendMessage} disabled={sending}>
              {sending ? "Đang gửi..." : "Gửi"}
            </button>
          </div>
        </div>
      )}
    </IonPage>
  );
};

export default Home;
