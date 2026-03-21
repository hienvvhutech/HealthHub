import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { IonIcon, useIonRouter, IonToggle, IonItem, IonLabel, IonAlert } from "@ionic/react"; // ✅ Import IonAlert
import {
  logOutOutline,
  personCircleOutline,
  logInOutline,
  menuOutline,
  closeOutline,
  homeOutline,
  calendarOutline,
  timeOutline,
  documentTextOutline,
  notificationsOutline,
  arrowBackOutline,
  accessibilityOutline,
  pulseOutline
} from "ionicons/icons";
import "./Header.css";
import axios from "../services/axiosInstance";
import io from "socket.io-client"; 
import { getSocketUrl } from "../services/apiConfig";
import { jwtDecode } from "jwt-decode"; 

interface HeaderProps {
  onMenuToggle?: () => void;
}

const SOCKET_URL = getSocketUrl();

interface DecodedToken {
  id: number; // User ID
  email: string;
  role: string;
  patientId?: number;
}

// ====== AI CHATBOX (REAL-TIME) TYPES ======
interface PublicMessage {
    id: string | number;
    sender: "user" | "admin" | "system";
    text: string;
    time: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const history = useHistory();
  const location = useLocation();
  const router = useIonRouter();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Chat State
  const [pChatOpen, setPChatOpen] = useState(false);
  const [pInput, setPInput] = useState("");
  const [pMessages, setPMessages] = useState<PublicMessage[]>([]);
  
  // Elderly Mode State for Drawer
  const [isElderlyMode, setIsElderlyMode] = useState(false);
  
  // Re-exam Reminder Popup
  const [showReminderAlert, setShowReminderAlert] = useState(false);
  const [reminderData, setReminderData] = useState<any>(null);

  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  const userRole = localStorage.getItem("role");
  
  // Lấy User ID thực từ token để join socket room
  const token = localStorage.getItem("token");
  let realUserId: number | null = null;
  if (token) {
      try {
          const decoded = jwtDecode<DecodedToken>(token);
          realUserId = decoded.id;
      } catch (e) {
          console.error("Invalid token", e);
      }
  }

  // Guest ID for Public Chat
  const guestId = realUserId ? `patient-${realUserId}` : (localStorage.getItem("guestId") || `guest-${Date.now()}`);
  if (!localStorage.getItem("guestId") && !realUserId) localStorage.setItem("guestId", guestId);

  // Sync Elderly Mode with LocalStorage/Event
  useEffect(() => {
    const checkElderly = () => {
        setIsElderlyMode(localStorage.getItem("elderlyMode") === "true");
    }
    checkElderly();
    window.addEventListener('storage', checkElderly); // Listen to storage changes
    // Custom event listener for internal updates
    window.addEventListener('elderly-mode-change', checkElderly);
    
    return () => {
        window.removeEventListener('storage', checkElderly);
        window.removeEventListener('elderly-mode-change', checkElderly);
    }
  }, []);

  const handleElderlyToggle = (e: any) => {
      const checked = e.detail.checked;
      setIsElderlyMode(checked);
      localStorage.setItem("elderlyMode", String(checked));
      window.dispatchEvent(new Event("elderly-mode-change")); // Notify other components
  };

  const fetchUnreadCount = async () => {
    if (!isLoggedIn || userRole !== 'patient') return;
    try {
      const res = await axios.get("/notifications/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("🔔 Unread Count:", res.data.count);
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error("Failed to fetch unread notifications count", error);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Socket & Notification & Chat Logic
  useEffect(() => {
    if (isLoggedIn) fetchUnreadCount();

    // Socket Initialization (Shared for both Notification and Chat)
    console.log("🔌 Connecting Socket to:", SOCKET_URL);
    const socket = io(SOCKET_URL);
        
    socket.on("connect", () => {
        console.log("✅ Socket Connected! ID:", socket.id);
        if (realUserId) {
            socket.emit("joinUserRoom", realUserId);
        }
        // Join public chat room
        socket.emit("joinPublicChat", guestId); 
    });

    socket.on("connect_error", (err: any) => {
        console.error("❌ Socket Connection Error:", err);
    });

    // Notification Handlers
    const handleNotificationUpdate = (data: any) => {
        console.log("📩 New Notification received via Socket:", data);
        fetchUnreadCount(); 
    };

    socket.on("healthAlert", handleNotificationUpdate); 
    socket.on("newNotification", handleNotificationUpdate); 
    socket.on("appointmentReminder", handleNotificationUpdate);
    
    // ✅ Lắng nghe sự kiện nhắc tái khám
    socket.on("reExamReminder", (notif: any) => {
        console.log("🔔 Re-exam Reminder:", notif);
        setReminderData(notif);
        setShowReminderAlert(true);
    });

    // Chat Handlers
    socket.on("newPublicMessage", (msg: any) => {
        setPMessages((prev) => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, {
                id: msg.id,
                sender: msg.sender,
                text: msg.message,
                time: msg.createdAt
            }];
        });
        // Auto open chat if admin replies? Optional
        // if (msg.sender === 'admin') setPChatOpen(true);
    });

    return () => {
        if(socket) {
            socket.disconnect();
        }
    };
  }, [isLoggedIn, realUserId, guestId]);

  // Load chat history when opened
  useEffect(() => {
    if (pChatOpen) {
        const loadHistory = async () => {
            try {
              const res = await axios.get(`/public-chat/history/${guestId}`);
              setPMessages(res.data.map((m: any) => ({
                  id: m.id,
                  sender: m.sender,
                  text: m.message,
                  time: m.createdAt,
              })));
            } catch { setPMessages([]); }
        };
        loadHistory();
    }
  }, [pChatOpen, guestId]);

  const sendPublicMessage = async () => {
    const text = pInput.trim();
    if (!text) return;
    setPInput("");
    try {
      await axios.post("/public-chat/send", { chatId: guestId, message: text });
    } catch (err) { console.error("Send failed", err); }
  };

  useEffect(() => {
    if (!onMenuToggle) {
      setMenuOpen(false);
    }
  }, [location.pathname, onMenuToggle]);

  const handleLogout = () => {
    localStorage.clear(); 
    history.push("/login");
  };

  const handleLogin = () => {
    history.push("/login");
  };

  const handleProfile = () => {
    if (userRole === "patient") {
      history.push("/patient/profile");
    } else if (userRole === "doctor") {
      history.push("/doctor/profile");
    }
  };

  const toggleMenu = () => {
    if (onMenuToggle) {
      onMenuToggle();
    } else {
      setMenuOpen(!menuOpen);
    }
  };
  
  const handleScrollToIoT = () => {
    if (location.pathname !== '/patient/home') {
        history.push('/patient/home');
        // Wait for page to load then scroll
        setTimeout(() => {
            window.dispatchEvent(new Event('scroll-to-iot'));
        }, 500);
    } else {
        window.dispatchEvent(new Event('scroll-to-iot'));
    }
    setMenuOpen(false);
  }

  const getHomePath = () => {
      switch(userRole) {
          case 'admin': return '/admin/admin-dashboard';
          case 'doctor': return '/doctor/home';
          case 'patient':
          default:
            return '/patient/home';
      }
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.goBack();
    } else {
      router.push(getHomePath(), "back");
    }
  };
  
  const handleNotificationsClick = () => {
      history.push("/patient/notifications");
  }

  const isHomePage = location.pathname === getHomePath() || location.pathname === '/login' || location.pathname === '/';

  return (
    <>
      <div className="header">
        {/* LEFT: Back Button + Logo */}
        <div className="header-left">
          {!isHomePage && (
            <div className="mobile-back-btn mobile-only" onClick={handleBack}>
              <IonIcon icon={arrowBackOutline} />
            </div>
          )}

          <div className="app-logo" onClick={() => history.push(getHomePath())}>
            <span className="app-name-part1">Health</span>
            <span className="app-name-part2">Hub</span>
          </div>
          <span className="current-time">
            {currentTime.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* CENTER/RIGHT: Desktop Nav */}
        <div className="header-nav desktop-only">
          <div onClick={() => history.push(getHomePath())}>TRANG CHỦ</div>

          {userRole === 'patient' && (
            <>
              <div onClick={() => history.push("/patient/book")}>ĐẶT KHÁM</div>
              <div onClick={() => history.push("/patient/history")}>LỊCH SỬ</div>
              <div onClick={() => history.push("/patient/re-exam-reminder")}>TÁI KHÁM</div>
            </>
          )}

          <div onClick={() => alert("Chức năng đang phát triển")}>HƯỚNG DẪN</div>
          <div onClick={() => setPChatOpen(!pChatOpen)} style={{ cursor: 'pointer' }}>LIÊN HỆ</div>

          {isLoggedIn ? (
            <>
              {userRole === 'patient' && (
                <div
                  className="header-icon-wrapper notification-bell"
                  onClick={handleNotificationsClick}
                  title="Thông báo"
                >
                  <IonIcon icon={notificationsOutline} className="header-icon" />
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </div>
              )}

              {(userRole === 'patient' || userRole === 'doctor') && (
                <IonIcon
                  icon={personCircleOutline}
                  className="header-icon"
                  onClick={handleProfile}
                  title="Hồ sơ"
                />
              )}
              <button className="login-btn" onClick={handleLogout}>
                <IonIcon icon={logOutOutline} />
              </button>
            </>
          ) : (
            <button className="login-btn" onClick={handleLogin}>
              <IonIcon icon={logInOutline} />
              Đăng Nhập
            </button>
          )}
        </div>

        {/* RIGHT: Mobile Actions (Bell + Menu) */}
        <div className="mobile-actions mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isLoggedIn && userRole === 'patient' && (
             <div className="notification-bell" onClick={handleNotificationsClick}>
                <IonIcon
                  icon={notificationsOutline}
                  style={{ fontSize: '26px', color: '#1f2937', cursor: 'pointer' }}
                />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
             </div>
          )}

          {/* Nút Menu */}
          <div className="mobile-menu-btn" onClick={toggleMenu}>
            <IonIcon icon={menuOpen ? closeOutline : menuOutline} />
          </div>
        </div>

      </div>

      {/* MOBILE NAV DRAWER */}
      {!onMenuToggle && (
        <>
            <div className={`mobile-nav-overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)}></div>
            <div className={`mobile-nav-drawer ${menuOpen ? "open" : ""}`}>
                <div className="drawer-header">
                <span className="drawer-title">Menu</span>
                <IonIcon icon={closeOutline} onClick={() => setMenuOpen(false)} />
                </div>

                <div className="drawer-items">
                {isLoggedIn && (
                    <div className="drawer-user-info" onClick={handleProfile}>
                    <div className="user-avatar">
                        <IonIcon icon={personCircleOutline} />
                    </div>
                    <div className="user-text">
                        <span className="user-greeting">Xin chào,</span>
                        <span className="user-action">Xem hồ sơ cá nhân</span>
                    </div>
                    </div>
                )}

                {/* --- ELDERLY TOGGLE IN DRAWER --- */}
                {userRole === 'patient' && (
                    <div className="drawer-item" style={{ background: isElderlyMode ? '#fff8e1' : 'transparent' }}>
                        <IonIcon icon={accessibilityOutline} style={{ color: '#f39c12' }} />
                        <IonLabel style={{ flex: 1, marginLeft: '10px' }}>Chế độ người cao tuổi</IonLabel>
                        <IonToggle checked={isElderlyMode} onIonChange={handleElderlyToggle} />
                    </div>
                )}

                <div className="drawer-item" onClick={() => history.push(getHomePath())}>
                    <IonIcon icon={homeOutline} /> Trang chủ
                </div>
                {userRole === 'patient' && (
                  <>
                    <div className="drawer-item" onClick={handleNotificationsClick}>
                        <IonIcon icon={notificationsOutline} /> Thông báo
                        {unreadCount > 0 && <span className="drawer-badge">{unreadCount}</span>}
                    </div>
                    <div className="drawer-item" onClick={() => history.push("/patient/book")}>
                        <IonIcon icon={calendarOutline} /> Đặt khám
                    </div>
                    <div className="drawer-item" onClick={() => history.push("/patient/history")}>
                        <IonIcon icon={documentTextOutline} /> Lịch sử khám
                    </div>
                    <div className="drawer-item" onClick={() => history.push("/patient/re-exam-reminder")}>
                        <IonIcon icon={timeOutline} /> Lịch tái khám
                    </div>
                    {/* Add IoT Section Link HERE - Above Support */}
                    <div className="drawer-item" onClick={handleScrollToIoT}>
                        <IonIcon icon={pulseOutline} /> Đo chỉ số sức khỏe
                    </div>
                    <div className="drawer-item" onClick={() => { setPChatOpen(true); setMenuOpen(false); }}>
                        <IonIcon icon={notificationsOutline} /> Liên hệ hỗ trợ
                    </div>
                  </>
                )}
                
                <div className="drawer-footer">
                    {isLoggedIn ? (
                    <button className="drawer-btn logout" onClick={handleLogout}>
                        <IonIcon icon={logOutOutline} /> Đăng xuất
                    </button>
                    ) : (
                    <button className="drawer-btn login" onClick={handleLogin}>
                        <IonIcon icon={logInOutline} /> Đăng nhập
                    </button>
                    )}
                </div>
                </div>
            </div>
        </>
      )}

      {/* GLOBAL CHATBOX UI */}
      {pChatOpen && (
          <div className="chatbox-container">
            <div className="chatbox-header"><span>Hỗ trợ bệnh viện (24/7)</span><button onClick={() => { setPChatOpen(false); }}>×</button></div>
            <div className="chatbox-messages">
              {pMessages.map((m) => (
                <div key={m.id} className={`msg ${m.sender}`}>
                  <div className="msg-text">{m.text}</div>
                  <div className="msg-time">{new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              ))}
            </div>
            <div className="chatbox-input">
              <input 
                value={pInput} 
                onChange={(e) => setPInput(e.target.value)} 
                placeholder="Nhập tin nhắn..." 
                onKeyDown={(e) => e.key === 'Enter' && sendPublicMessage()}
              />
              <button onClick={sendPublicMessage}>Gửi</button>
            </div>
          </div>
        )}

      {/* --- POPUP NHẮC TÁI KHÁM --- */}
      <IonAlert
          isOpen={showReminderAlert}
          onDidDismiss={() => setShowReminderAlert(false)}
          header={'NHẮC NB TÁI KHÁM 🔔'}
          message={reminderData?.message || "Đã đến lịch tái khám. Vui lòng kiểm tra."}
          buttons={[
            {
              text: 'Đóng',
              role: 'cancel',
              cssClass: 'secondary',
            },
            {
              text: 'Đặt lịch ngay',
              handler: () => {
                  history.push("/patient/book");
              }
            }
          ]}
      />
    </>
  );
};

export default Header;
