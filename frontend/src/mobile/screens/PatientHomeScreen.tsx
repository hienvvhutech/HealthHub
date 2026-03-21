//cspell:disable
import React, { useEffect, useState, useRef } from "react";
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonChip,
  IonLabel,
  IonButton,
  IonIcon,
  IonItem,
  IonModal,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonSearchbar,
  IonToast,
  IonAlert,
  IonSelect,
  IonSelectOption,
  useIonViewWillEnter,
  IonToggle
} from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import {
  calendarOutline,
  personCircleOutline,
  pulseOutline,
  searchOutline,
  refreshOutline,
  chatbubbleEllipsesOutline,
  fitnessOutline,
  qrCodeOutline,
  timeOutline,
  locationOutline,
  micOutline,
  warningOutline,
  scanOutline,
  accessibilityOutline,
  chevronUpOutline,
  chevronDownOutline
} from "ionicons/icons";
import axios from "../../services/axiosInstance";
import "../../pages/patient/HomePatient.css"; // Reuse CSS from Web
import { jwtDecode } from "jwt-decode";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { LocalNotifications } from "@capacitor/local-notifications";
import { Haptics, NotificationType } from "@capacitor/haptics";
import io from "socket.io-client";

// ====== TYPES ======
type Department = {
  specialty: string;
  doctor: string;
  color?: string;
  currentNumber: number; 
  nextTime?: string;
};

type Appointment = {
  id: number;
  doctorName: string;
  sequenceNumber: number;
  status: string;
  date: string;
};

interface IoTData {
  time: string;
  bloodPressure: number;
  glucose: number;
  heartRate: number;
}
interface DecodedToken {
  id: number;
  email: string;
  role: string;
  patientId?: number;
  doctorId?: number;
  userId?: number;
  exp?: number;
  iat?: number;
}
type AlertType = {
  type: "danger" | "warning";
  msg: string;
  advice: string;
};

interface PublicMessage {
  id: string | number;
  sender: "user" | "admin" | "system";
  text: string;
  time: string;
}

// ✅ Added Interface
interface PublicChatRecord {
  id: number;
  guestId: string;
  sender: "user" | "admin" | "system";
  message: string;
  createdAt: string;
}

// SOCKET CONFIG
const SOCKET_URL = "http://10.0.2.2:5000"; // For Android Emulator

const PatientHomeScreen: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ scrollToIoT?: boolean }>();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  
  // Queue Logic
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [queueSearchQuery, setQueueSearchQuery] = useState("");
  const [uniqueSpecialties, setUniqueSpecialties] = useState<string[]>([]);
  const [showQueueSheet, setShowQueueSheet] = useState(false); // For expanding sticky bar

  // Elderly Mode
  const [isElderlyMode, setIsElderlyMode] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Check-in & UI
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  
  const iotSectionRef = useRef<HTMLDivElement>(null);
  
  // Chat
  const [pChatOpen, setPChatOpen] = useState(false);
  const [pInput, setPInput] = useState("");
  const [pMessages, setPMessages] = useState<PublicMessage[]>([]);
  const userId = localStorage.getItem("userId");
  const guestId = userId ? `patient-${userId}` : (localStorage.getItem("guestId") || `guest-${Date.now()}`);
  if (!localStorage.getItem("guestId") && !userId) localStorage.setItem("guestId", guestId);

  // Sync Elderly Mode with Header/LocalStorage
  useIonViewWillEnter(() => {
    const elderly = localStorage.getItem("elderlyMode") === "true";
    setIsElderlyMode(elderly);
    
    if (location.state?.scrollToIoT) {
        setTimeout(() => {
            iotSectionRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 500);
        history.replace({ ...history.location, state: {} });
    }
  });

  useEffect(() => {
    const handleElderlyChange = () => {
        setIsElderlyMode(localStorage.getItem("elderlyMode") === "true");
    };
    const handleScrollRequest = () => {
        iotSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    window.addEventListener("elderly-mode-change", handleElderlyChange);
    window.addEventListener("scroll-to-iot", handleScrollRequest);
    
    return () => {
        window.removeEventListener("elderly-mode-change", handleElderlyChange);
        window.removeEventListener("scroll-to-iot", handleScrollRequest);
    };
  }, []);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await LocalNotifications.requestPermissions();
      } catch (e) {
        console.error("Không thể yêu cầu quyền thông báo", e);
      }
    };
    requestPermissions();
  }, []);

  // --- IOT & NOTIFICATION LOGIC (Socket) ---
  useEffect(() => {
    const socket = io(SOCKET_URL);
    if(userId) {
        socket.emit("joinUserRoom", userId); 
        socket.on("healthAlert", (data: any) => {
            // Native Alert or Toast for Mobile
            setToastMsg(`⚠️ CẢNH BÁO SỨC KHỎE: ${data.message}`);
            setShowToast(true);
            Haptics.vibrate();
            fetchIoTData();
        });
    }
    return () => { socket.disconnect(); }
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const queueRes = await axios.get("/appointments/queue-status");
      const queueData: Department[] = queueRes.data;
      setDepartments(queueData);
      
      const specialties = Array.from(new Set(queueData.map(d => d.specialty)));
      setUniqueSpecialties(specialties);

      if (!token) return;

      const patientId = localStorage.getItem("userId");
      if (patientId) {
        const myRes = await axios.get("/appointments/patient", {
          params: { patientId },
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const myPending = (myRes.data as Appointment[]).filter(a => {
           return (a.status === "pending" || a.status === "waiting" || a.status === "confirmed");
        });
        
        setMyAppointments(myPending);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // QR CHECK-IN LOGIC
  const handleSimulateScan = async (apptId: number) => {
    setShowQRScanner(true);
    setTimeout(async () => {
        setShowQRScanner(false);
        try {
            await axios.put(`/appointments/${apptId}/check-in`, { status: "waiting" });
            
            setToastMsg("✅ Check-in thành công! Bạn đang ở trạng thái 'Chờ khám'.");
            setShowToast(true);
            await Haptics.vibrate();
            fetchData();
        } catch (e: any) {
            console.error(e);
            setToastMsg(`❌ ${e.response?.data?.message || "Check-in thất bại"}`);
            setShowToast(true);
        }
    }, 2000);
  };

  const filteredDepartments = departments.filter(d => {
      const matchesSpecialty = selectedSpecialty === "all" || d.specialty === selectedSpecialty;
      const q = queueSearchQuery.toLowerCase();
      const matchesSearch = d.specialty.toLowerCase().includes(q) || d.doctor.toLowerCase().includes(q);
      return matchesSpecialty && matchesSearch;
  });

  // ... (IOT & Chatbox keep same)
  const [bloodPressure, setBloodPressure] = useState("");
  const [glucose, setGlucose] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [iotData, setIotData] = useState<IoTData[]>([]);
  const [alerts, setAlerts] = useState<AlertType[]>([]);

  const fetchIoTData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const decoded = jwtDecode<DecodedToken>(token);
        const patientId = decoded?.patientId;
        if (!patientId) return;

        const response = await axios.get(`/healthdata/patient/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        type ApiHealthRecord = { metric: string; value: string };
        const records = response.data.data as ApiHealthRecord[];
        const parsed = records
          .filter((item) => item.metric === "IoT")
          .map((item) => JSON.parse(item.value) as IoTData);

        setIotData(parsed);
      } catch (err) {
        console.error("Lỗi tải dữ liệu IoT:", err);
      }
    };

  useEffect(() => {
    fetchIoTData();
  }, []);

  const handleIoTSubmit = async () => {
    if (!bloodPressure || !glucose || !heartRate) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const decoded = jwtDecode<DecodedToken>(token);
    const patientId = decoded?.patientId;
    if (!patientId) return;
    
    try {
      await axios.post("/healthdata/iot", {
          patientId, bloodPressure, glucose, heartRate
        }, { headers: { Authorization: `Bearer ${token}` } });
      
      setToastMsg("✅ Dữ liệu IoT đã gửi thành công!");
      setShowToast(true);
      fetchIoTData();
    } catch (err) { console.error(err); }

    const newData = {
      time: new Date().toLocaleTimeString(),
      bloodPressure: Number(bloodPressure),
      glucose: Number(glucose),
      heartRate: Number(heartRate),
    };
    setAlerts(getHealthAlert(newData));
    setBloodPressure(""); setGlucose(""); setHeartRate("");
  };

  const getHealthAlert = (data: IoTData): AlertType[] => {
    const alerts: AlertType[] = [];
    if (data.bloodPressure > 140) alerts.push({ type: "danger", msg: "HUYẾT ÁP CAO", advice: "Ngồi nghỉ ngay lập tức." });
    if (data.heartRate > 120) alerts.push({ type: "danger", msg: "NHỊP TIM CAO", advice: "Ngừng vận động." });
    return alerts;
  };

  // Chatbox logic
  const loadHistory = async () => {
    try {
      const res = await axios.get(`/public-chat/history/${guestId}`);
      setPMessages(res.data.map((m: PublicChatRecord) => ({ id: m.id, sender: m.sender, text: m.message, time: m.createdAt })));
    } catch { setPMessages([]); }
  };
  const sendPublicMessage = async () => {
    const text = pInput.trim();
    if (!text) return;
    setPMessages((prev) => [...prev, { id: `u-${Date.now()}`, sender: "user", text, time: new Date().toISOString() }]);
    setPInput("");
    try {
      await axios.post("/public-chat/send", { chatId: guestId, message: text });
      loadHistory();
    } catch (err) { console.error(err); }
  };
  useEffect(() => { if (pChatOpen) loadHistory(); }, [pChatOpen]);

  // --- ELDERLY VOICE ---
  const handleTurnOffElderly = () => {
      setIsElderlyMode(false);
      localStorage.setItem("elderlyMode", "false");
      window.dispatchEvent(new Event("elderly-mode-change"));
  }

  const startVoiceInput = () => {
      setShowVoiceModal(true);
      setVoiceText("Đang lắng nghe...");
      setIsListening(true);
      
      // Fallback Mock for Mobile (Native Speech API might need plugin)
      setTimeout(async () => {
          const mockSymptom = "Tôi bị đau đầu và chóng mặt...";
          setVoiceText(`Bạn nói: "${mockSymptom}"`);
          
          setTimeout(async () => {
              setVoiceText("Đang phân tích triệu chứng...");
              try {
                  const res = await axios.post("/screening/plan", {
                    age: 60, gender: "Male", history: [], symptom: mockSymptom 
                  });
                  const result = res.data.data;
                  if (result && result.doctor) {
                      setVoiceText(`✅ Đã tìm thấy: ${result.doctor.fullName}`);
                      setTimeout(() => {
                          setShowVoiceModal(false);
                          history.push({
                            pathname: "/patient/book",
                            state: { doctorId: result.doctor.id, specialtyName: result.specialty }
                          });
                      }, 2000);
                  } else { setVoiceText("Không tìm thấy bác sĩ phù hợp."); }
              } catch (e) { setVoiceText("Có lỗi xảy ra."); }
          }, 1000);
      }, 1500);
  };
  
  const quickSymptomSelect = (symptom: string) => {
      setShowVoiceModal(true);
      setVoiceText(`Bạn chọn: "${symptom}"`);
      // Reuse logic...
  };

  // --- RENDER ELDERLY ---
  if (isElderlyMode) {
      return (
        <IonPage>
            <IonContent className="elderly-bg">
                <div className="elderly-header">
                    <h1>👴 CHẾ ĐỘ NGƯỜI CAO TUỔI</h1>
                    <IonButton color="medium" onClick={handleTurnOffElderly}>Thoát</IonButton>
                </div>
                <div className="elderly-container">
                    <div className="elderly-card" onClick={() => history.push("/patient/book")}><IonIcon icon={calendarOutline} /><h2>ĐẶT LỊCH KHÁM</h2></div>
                    <div className="elderly-card warning" onClick={() => alert("Đang gọi cấp cứu...")}><IonIcon icon={warningOutline} /><h2>GỌI KHẨN CẤP</h2></div>
                    <div className="elderly-voice-section">
                        <h3>Bạn cảm thấy thế nào?</h3>
                        <IonButton size="large" expand="block" onClick={startVoiceInput} className="voice-btn">
                            <IonIcon icon={micOutline} slot="start" /> NHẤN ĐỂ NÓI
                        </IonButton>
                    </div>
                </div>
                <IonModal isOpen={showVoiceModal} onDidDismiss={() => setShowVoiceModal(false)} className="voice-modal">
                    <div className="voice-content">
                         <IonIcon icon={micOutline} size="large" className={`listening-icon ${isListening ? 'active-pulse' : ''}`} />
                        <h2>{voiceText}</h2>
                        <IonButton fill="clear" onClick={() => setShowVoiceModal(false)}>Hủy</IonButton>
                    </div>
                </IonModal>
            </IonContent>
        </IonPage>
      );
  }

  // --- LOGIC MINI-PLAYER QUEUE ---
  let stickyQueue = filteredDepartments[0];
  if (myAppointments.length > 0) {
      const myFirstAppt = myAppointments[0];
      const found = filteredDepartments.find(d => d.doctor.includes(myFirstAppt.doctorName));
      if (found) stickyQueue = found;
  }

  return (
    <IonPage className="full-height-page">
      <Header />
      <IonContent className="ion-padding home-bg content-expand">
        
        {/* QR SCANNER MOCK MODAL */}
        <IonModal isOpen={showQRScanner} onDidDismiss={() => setShowQRScanner(false)} className="qr-modal">
            <div style={{ height: '100%', background: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="scanner-line"></div>
                <IonIcon icon={qrCodeOutline} style={{ fontSize: '200px', color: 'rgba(255,255,255,0.5)' }} />
                <p style={{ color: 'white', marginTop: '20px' }}>Đang quét mã QR...</p>
            </div>
        </IonModal>
        
        <IonToast isOpen={showToast} message={toastMsg} duration={2000} onDidDismiss={() => setShowToast(false)} />

        {/* HERO */}
        <div className="hero-section">
          <div className="hero-text">
            <h1>Chăm Sóc Sức Khỏe Thông Minh</h1>
            <p>Đặt lịch khám, theo dõi chỉ số sức khỏe và nhận tư vấn.</p>
            <div className="hero-buttons">
              <IonButton expand="block" color="primary" onClick={() => history.push("/patient/book")}>📅 Đặt Lịch</IonButton>
            </div>
          </div>
          <div className="hero-image"><img src="/assets/health.png" alt="patients" /></div>
        </div>

        {/* AI CARD */}
        <div className="ai-recommend-container">
          <div className="ai-card" style={{ background: 'linear-gradient(135deg, #ffffff, #eef2ff)' }}>
            <IonChip className="ai-chip" color="primary"><IonLabel>✨ AI Deep Learning</IonLabel></IonChip>
            <h1 className="ai-title">Trợ Lý Sức Khỏe AI</h1>
            <p className="ai-subtitle">Phân tích rủi ro sức khỏe.</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <IonButton className="ai-btn" size="large" onClick={() => history.push("/patient/screening")}>
                <IonIcon icon={fitnessOutline} slot="start" />Phân Tích Ngay
              </IonButton>
            </div>
          </div>
        </div>

        {/* MY APPOINTMENTS */}
        {myAppointments.length > 0 && (
            <div className="section-container">
                <h2 className="section-title">Lịch khám của bạn</h2>
                {myAppointments.map(appt => (
                    <IonCard key={appt.id} className="active-appt-card">
                        <IonCardContent>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <h3>BS. {appt.doctorName}</h3>
                                    <p>{new Date(appt.date).toLocaleString('vi-VN')}</p>
                                    <IonChip color={appt.status === 'pending' ? 'warning' : 'success'}>
                                        {appt.status === 'pending' ? "Chờ xác nhận" : "Đã xác nhận"}
                                    </IonChip>
                                </div>
                                {appt.status === 'pending' && (
                                    <IonButton fill="outline" onClick={() => handleSimulateScan(appt.id)}>
                                        <IonIcon icon={qrCodeOutline} /> Check-in
                                    </IonButton>
                                )}
                            </div>
                        </IonCardContent>
                    </IonCard>
                ))}
            </div>
        )}

        <section className="services-section">
          <h2>Dịch Vụ</h2>
          <div className="service-grid">
            <div className="service-card" onClick={() => history.push("/patient/book")}><IonIcon icon={calendarOutline} /><h5>Đặt Lịch</h5></div>
            <div className="service-card" onClick={() => history.push("/patient/profile")}><IonIcon icon={personCircleOutline} /><h5>Hồ Sơ</h5></div>
            <div className="service-card" onClick={() => history.push("/patient/history")}><IonIcon icon={pulseOutline} /><h5>Lịch Sử</h5></div>
            <div className="service-card" onClick={() => history.push("/patient/find-doctor")}><IonIcon icon={searchOutline} /><h5>Tìm Bác Sĩ</h5></div>
          </div>
        </section>

        {/* IOT Section */}
        <section className="iot-section" ref={iotSectionRef}>
          <h2 className="iot-title">📟 Theo dõi IoT</h2>
          <IonGrid>
            <IonRow>
              <IonCol size="12">
                <IonCard className="iot-card"><IonCardContent>
                    <IonItem><IonLabel position="stacked">Huyết áp (mmHg)</IonLabel><input type="number" value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} className="iot-input" /></IonItem>
                    <IonItem><IonLabel position="stacked">Nhịp tim (bpm)</IonLabel><input type="number" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} className="iot-input" /></IonItem>
                    <IonButton expand="block" onClick={handleIoTSubmit}>Gửi dữ liệu</IonButton>
                </IonCardContent></IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* STICKY QUEUE BAR (MOBILE ONLY) */}
        {stickyQueue && (
            <div className="queue-sticky-bar" onClick={() => setShowQueueSheet(true)}>
                <div className="qsb-left">
                    <span className="qsb-icon">🩺</span>
                    <div className="qsb-info">
                        <div className="qsb-dept">{stickyQueue.specialty}</div>
                        <div className="qsb-doc">{stickyQueue.doctor}</div>
                    </div>
                </div>
                <div className="qsb-right">
                    <div className="qsb-number">Số {String(stickyQueue.currentNumber).padStart(2, '0')}</div>
                    <IonIcon icon={chevronUpOutline} />
                </div>
            </div>
        )}

        {/* EXPANDED QUEUE SHEET */}
        <IonModal 
            isOpen={showQueueSheet} 
            onDidDismiss={() => setShowQueueSheet(false)} 
            initialBreakpoint={0.75} 
            breakpoints={[0, 0.5, 0.75]}
            className="queue-sheet-modal"
        >
            <IonContent className="queue-sheet-content">
                <div className="queue-sheet-header">
                    <h3>Theo dõi khám bệnh</h3>
                    <IonButton fill="clear" onClick={() => setShowQueueSheet(false)}><IonIcon icon={chevronDownOutline} /></IonButton>
                </div>
                
                <IonGrid style={{ padding: 0, marginBottom: '10px' }}>
                    <IonRow className="filter-row" style={{ alignItems: 'center' }}>
                        <IonCol size="12">
                            <IonSearchbar 
                                placeholder="Tìm khoa..." 
                                value={queueSearchQuery} 
                                onIonInput={e => setQueueSearchQuery(e.detail.value!)} 
                            />
                        </IonCol>
                        <IonCol size="12">
                            <IonItem lines="none">
                                <IonLabel>Khoa:</IonLabel>
                                <IonSelect 
                                    value={selectedSpecialty} 
                                    placeholder="Tất cả" 
                                    onIonChange={e => setSelectedSpecialty(e.detail.value)}
                                >
                                    <IonSelectOption value="all">Tất cả</IonSelectOption>
                                    {uniqueSpecialties.map(spec => (
                                        <IonSelectOption key={spec} value={spec}>{spec}</IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonItem>
                        </IonCol>
                    </IonRow>
                </IonGrid>

                 <div className="queue-sheet-list">
                    {filteredDepartments.map((dept, idx) => (
                      <div key={idx} className="compact-queue-item">
                          <div className="cqi-left">
                              <div className="cqi-dept">{dept.specialty}</div>
                              <div className="cqi-doc">{dept.doctor}</div>
                          </div>
                          <div className="cqi-right">
                              <div className="cqi-num">{String(dept.currentNumber).padStart(2,"0")}</div>
                          </div>
                      </div>
                    ))}
                 </div>
            </IonContent>
        </IonModal>

        {pChatOpen && (
          <div className="chatbox-container mobile-chat">
            <div className="chatbox-header"><span>Hỗ trợ</span><button onClick={() => setPChatOpen(false)}>×</button></div>
            <div className="chatbox-messages">{pMessages.map((m) => (<div key={m.id} className={`msg ${m.sender}`}><div className="msg-text">{m.text}</div></div>))}</div>
            <div className="chatbox-input"><input value={pInput} onChange={(e) => setPInput(e.target.value)} /><button onClick={sendPublicMessage}>Gửi</button></div>
          </div>
        )}
        <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ marginBottom: '60px' }}>
          <IonFabButton onClick={() => setPChatOpen(true)}><IonIcon icon={chatbubbleEllipsesOutline} /></IonFabButton>
        </IonFab>

        <Footer />
      </IonContent>
    </IonPage>
  );
};

export default PatientHomeScreen;
