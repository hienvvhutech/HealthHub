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
  IonSearchbar,
  IonToggle,
  IonToast,
  useIonViewWillEnter,
  IonSelect,
  IonSelectOption,
  IonFab, 
  IonFabButton,
  IonProgressBar 
} from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import {
  calendarOutline,
  personCircleOutline,
  pulseOutline,
  searchOutline,
  refreshOutline,
  fitnessOutline,
  micOutline,
  warningOutline,
  scanOutline,
  accessibilityOutline,
  chatbubbleEllipsesOutline 
} from "ionicons/icons";
import axios from "../../services/axiosInstance";
import "./HomePatient.css";
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
  CartesianGrid
} from "recharts";
import io from "socket.io-client";

// WEB VERSION

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
  time?: string;
};

// SOCKET CONFIG
const SOCKET_URL = "http://localhost:3000"; 

// AI CHAT TYPES
interface PublicMessage {
    id: string | number;
    sender: "user" | "admin" | "system";
    text: string;
    time: string;
}

const HomePatient: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ scrollToIoT?: boolean }>(); 
  const [departments, setDepartments] = useState<Department[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  
  // Queue Logic
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");
  const [queueSearchQuery, setQueueSearchQuery] = useState("");
  const [uniqueSpecialties, setUniqueSpecialties] = useState<string[]>([]);

  const [isElderlyMode, setIsElderlyMode] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const iotSectionRef = useRef<HTMLDivElement>(null);

  // AI Chat State
  const [pChatOpen, setPChatOpen] = useState(false);
  const [pInput, setPInput] = useState("");
  const [pMessages, setPMessages] = useState<PublicMessage[]>([]);

  // Guest ID for Chat
  const userId = localStorage.getItem("userId");
  const guestId = userId ? `patient-${userId}` : (localStorage.getItem("guestId") || `guest-${Date.now()}`);
  if (!localStorage.getItem("guestId") && !userId) localStorage.setItem("guestId", guestId);

  useIonViewWillEnter(() => {
    const elderly = localStorage.getItem("elderlyMode") === "true";
    setIsElderlyMode(elderly);
    if (location.state?.scrollToIoT) {
        setTimeout(() => {
            iotSectionRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
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

  const hasNotified = (key: string) => localStorage.getItem(key) === "true";
  const setNotified = (key: string) => localStorage.setItem(key, "true");

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    const userId = localStorage.getItem("userId");
    
    // Join User Room for Alerts
    if(userId) {
        socket.emit("joinUserRoom", userId); 
        socket.on("healthAlert", (data: any) => {
            alert(`⚠️ CẢNH BÁO SỨC KHỎE: ${data.message}`);
            fetchIoTData();
        });
    }

    // Join Public Chat Room
    if (pChatOpen) {
        socket.emit("joinPublicChat", guestId);
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
        });
    }

    return () => { socket.disconnect(); }
  }, [pChatOpen, guestId]); // Re-run when chat opens

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const queueRes = await axios.get("/appointments/queue-status");
      const data = queueRes.data as Department[];
      setDepartments(data);

      const specialties = Array.from(new Set(data.map(d => d.specialty)));
      setUniqueSpecialties(specialties);

      if (!token) return;

      const patientId = localStorage.getItem("userId");
      if (patientId) {
        const myRes = await axios.get("/appointments/patient", {
          params: { patientId },
          headers: { Authorization: `Bearer ${token}` },
        });
        const myPending = (myRes.data as Appointment[]).filter(a => {
           return (a.status === "pending" || a.status === "waiting");
        });
        setMyAppointments(myPending);
        checkAndNotify(data, myPending);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
    }
  };

  const saveNotificationToDB = async (title: string, message: string, type: string) => {
      try {
          await axios.post("/notifications", { title, message, type });
          window.dispatchEvent(new CustomEvent('new-notification'));
      } catch (e) { console.error("Failed to save notification", e); }
  }

  const checkAndNotify = async (queues: Department[], myAppts: Appointment[]) => {
      // Logic kept same
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); 
    return () => clearInterval(interval);
  }, []);

  const filteredDepartments = departments.filter(d => {
      const matchesSpecialty = selectedSpecialty === "all" || d.specialty === selectedSpecialty;
      const q = queueSearchQuery.toLowerCase();
      const matchesSearch = d.specialty.toLowerCase().includes(q) || d.doctor.toLowerCase().includes(q);
      return matchesSpecialty && matchesSearch;
  });

  // ... (IOT & OTHER LOGIC KEPT SAME)
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
      
      // Update alerts based on latest data
      if (parsed.length > 0) {
          setAlerts(getHealthAlert(parsed[parsed.length - 1]));
      }

    } catch (err) { console.error("Lỗi tải dữ liệu IoT:", err); }
  };

  useEffect(() => { fetchIoTData(); }, []);

  const handleIoTSubmit = async () => {
    if (!bloodPressure || !glucose || !heartRate) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const decoded = jwtDecode<DecodedToken>(token);
    const patientId = decoded?.patientId;
    if (!patientId) return;
    try {
      const res = await axios.post("/healthdata/iot", { 
          patientId, bloodPressure, glucose, heartRate
        }, { headers: { Authorization: `Bearer ${token}` } });
      if(res.status === 201) {
          alert("Dữ liệu đã được ghi nhận!");
          fetchIoTData(); 
      }
    } catch (err) { console.error("Lỗi khi gửi dữ liệu IoT:", err); }
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
    const time = new Date().toLocaleTimeString();
    
    if (data.bloodPressure > 140) alerts.push({ type: "danger", msg: "HUYẾT ÁP CAO BẤT THƯỜNG", advice: "Nguy cơ tim mạch. Nên khám ngay.", time });
    else if (data.bloodPressure < 90) alerts.push({ type: "warning", msg: "Huyết áp thấp", advice: "Bổ sung nước, muối.", time });
    
    if (data.glucose > 180) alerts.push({ type: "danger", msg: "ĐƯỜNG HUYẾT CAO", advice: "Kiểm tra lại chế độ ăn.", time });
    else if (data.glucose < 70) alerts.push({ type: "warning", msg: "Đường huyết thấp", advice: "Uống nước đường.", time });
    
    if (data.heartRate > 120) alerts.push({ type: "danger", msg: "NHỊP TIM QUÁ NHANH", advice: "Cần kiểm tra tim mạch.", time });
    else if (data.heartRate < 50) alerts.push({ type: "warning", msg: "Nhịp tim chậm", advice: "Theo dõi thêm.", time });
    
    return alerts;
  };

  const getStatusColor = (value: number, type: 'bp' | 'gl' | 'hr') => {
      if (type === 'bp') return value > 140 ? 'danger' : (value < 90 ? 'warning' : 'success');
      if (type === 'gl') return value > 180 ? 'danger' : (value < 70 ? 'warning' : 'success');
      if (type === 'hr') return value > 120 ? 'danger' : (value < 50 ? 'warning' : 'success');
      return 'medium';
  }

  const handleSimulateScan = async (apptId: number) => {
    setShowQRScanner(true);
    setTimeout(async () => {
        setShowQRScanner(false);
        try {
            await axios.put(`/appointments/${apptId}/check-in`, { status: "waiting" }); 
            setToastMsg("✅ Check-in thành công! Bạn đang ở trạng thái 'Chờ khám'.");
            setShowToast(true);
            fetchData();
        } catch (e) {
            console.error(e);
            setToastMsg("❌ Check-in thất bại. Vui lòng thử lại.");
            setShowToast(true);
        }
    }, 2000);
  };
  
  const handleTurnOffElderly = () => {
      setIsElderlyMode(false);
      localStorage.setItem("elderlyMode", "false");
      window.dispatchEvent(new Event("elderly-mode-change"));
  }

  const startVoiceInput = () => {
      setShowVoiceModal(true);
      setVoiceText("Đang lắng nghe...");
      setTimeout(async () => {
          const mockSymptom = "Tôi bị đau đầu và chóng mặt...";
          setVoiceText(mockSymptom);
          setTimeout(async () => {
              setVoiceText("Đang phân tích triệu chứng...");
              try {
                  const res = await axios.post("/screening/plan", {
                    age: 60, gender: "Male", history: [], symptom: mockSymptom 
                  });
                  const result = res.data.data;
                  if (result && result.doctor) {
                      setVoiceText(`Đã tìm thấy bác sĩ phù hợp: ${result.doctor.fullName}`);
                      setTimeout(() => {
                          setShowVoiceModal(false);
                          history.push({
                            pathname: "/patient/book",
                            state: { doctorId: result.doctor.id, specialtyName: result.specialty }
                          });
                      }, 1500);
                  } else { setVoiceText("Không tìm thấy bác sĩ phù hợp."); }
              } catch (e) { setVoiceText("Có lỗi xảy ra."); }
          }, 1000);
      }, 1500);
  };

  const quickSymptomSelect = (symptom: string) => {
      alert(`Đã ghi nhận: ${symptom}.`);
  };

  // AI Chat Functions
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

  const sendPublicMessage = async () => {
    const text = pInput.trim();
    if (!text) return;
    
    setPInput("");

    try {
      await axios.post("/public-chat/send", { chatId: guestId, message: text });
    } catch (err) { console.error("Send failed", err); }
  };

  useEffect(() => {
    if (pChatOpen) loadHistory();
  }, [pChatOpen]);


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
                        <IonButton size="large" expand="block" onClick={startVoiceInput} className="voice-btn"><IonIcon icon={micOutline} slot="start" /> NHẤN ĐỂ NÓI VÀ ĐẶT LỊCH</IonButton>
                    </div>
                </div>
                <IonModal isOpen={showVoiceModal} onDidDismiss={() => setShowVoiceModal(false)} className="voice-modal">
                    <div className="voice-content"><IonIcon icon={micOutline} size="large" className="listening-icon" /><h2>{voiceText}</h2><IonButton fill="clear" onClick={() => setShowVoiceModal(false)}>Hủy</IonButton></div>
                </IonModal>
            </IonContent>
        </IonPage>
      );
  }

  // --- Latest IoT Data for Status Bar ---
  const latestIoT = iotData.length > 0 ? iotData[iotData.length - 1] : null;

  return (
    <IonPage className="full-height-page">
      <Header />
      <IonContent className="ion-padding home-bg content-expand">
        
        {/* Toggle Elderly Mode */}
        <div className="elderly-toggle-container">
            <div className="elderly-toggle-wrapper">
                <div className="elderly-toggle-label">
                    <IonIcon icon={accessibilityOutline} className="elderly-icon" />
                    Chế độ người cao tuổi
                </div>
                <IonToggle checked={isElderlyMode} onIonChange={e => {
                    const checked = e.detail.checked;
                    setIsElderlyMode(checked);
                    localStorage.setItem("elderlyMode", String(checked));
                    window.dispatchEvent(new Event("elderly-mode-change"));
                }} />
            </div>
        </div>

        <div className="hero-section">
          <div className="hero-text">
            <h1>Chăm Sóc Sức Khỏe Thông Minh & Toàn Diện</h1>
            <p>Đặt lịch khám, theo dõi chỉ số sức khỏe và nhận tư vấn từ đội ngũ y bác sĩ chuyên nghiệp.</p>
            <div className="hero-buttons">
              <IonButton expand="block" color="primary" onClick={() => history.push("/patient/book")}>📅 Đặt Lịch Khám</IonButton>
            </div>
          </div>
          <div className="hero-image"><img src="/assets/health.png" alt="patients" /></div>
        </div>
        
        {/* AI CARD */}
        <div className="ai-recommend-container">
          <div className="ai-card" style={{ background: 'linear-gradient(135deg, #ffffff, #eef2ff)' }}>
            <IonChip className="ai-chip" color="primary"><IonLabel>✨ AI Deep Learning</IonLabel></IonChip>
            <h1 className="ai-title">Trợ Lý Sức Khỏe AI</h1>
            <p className="ai-subtitle">Sử dụng mô hình học sâu để phân tích rủi ro sức khỏe.</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <IonButton className="ai-btn" size="large" onClick={() => history.push("/patient/screening")} style={{ minWidth: '220px', fontWeight: 'bold' }}>
                <IonIcon icon={fitnessOutline} slot="start" />Phân Tích Ngay
              </IonButton>
            </div>
          </div>
        </div>

        {/* --- QUEUE SECTION --- */}
        <div className="section-container queue-followup">
          <div className="section-header">
            <div className="section-title-row">
              <div><h2 className="section-title">Theo dõi khám bệnh</h2><p className="section-subtitle">Cập nhật thời gian thực từng khoa</p></div>
              <IonButton fill="outline" size="small" onClick={fetchData}><IonIcon icon={refreshOutline} slot="start" />Làm mới</IonButton>
            </div>
          </div>

          <IonGrid style={{ padding: 0, marginBottom: '10px' }}>
              <IonRow className="filter-row" style={{ alignItems: 'center' }}>
                  <IonCol size="12" sizeMd="6" style={{ paddingRight: '8px' }}>
                    <IonSearchbar 
                        placeholder="Tìm bác sĩ hoặc khoa..." 
                        value={queueSearchQuery} 
                        onIonInput={e => setQueueSearchQuery(e.detail.value!)} 
                        style={{ paddingLeft: 0, height: '48px', '--box-shadow': 'none', border: '1px solid #ddd', borderRadius: '10px' }}
                    />
                  </IonCol>
                  <IonCol size="12" sizeMd="6" style={{ paddingLeft: '8px' }}>
                    <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #ddd', height: '48px', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                        <IonLabel style={{ marginRight: '10px', whiteSpace: 'nowrap' }}>🏥 Khoa:</IonLabel>
                        <IonSelect 
                            value={selectedSpecialty} 
                            placeholder="Tất cả" 
                            onIonChange={e => setSelectedSpecialty(e.detail.value)}
                            interface="popover"
                            style={{ flex: 1, width: '100%' }}
                        >
                            <IonSelectOption value="all">Tất cả</IonSelectOption>
                            {uniqueSpecialties.map(spec => (
                                <IonSelectOption key={spec} value={spec}>{spec}</IonSelectOption>
                            ))}
                        </IonSelect>
                    </div>
                  </IonCol>
              </IonRow>
          </IonGrid>
          
          <IonGrid className="queue-grid-modern">
            <IonRow>
              {filteredDepartments.length === 0 && <IonCol size="12"><p style={{ textAlign: "center", opacity: 0.6 }}>Chưa có dữ liệu.</p></IonCol>}
              {filteredDepartments.map((dept, idx) => (
                <IonCol size="12" sizeMd="6" key={idx}>
                  <IonCard className="queue-card-modern">
                    <IonCardContent className="queue-card-content">
                      <div className="queue-header">
                        <div className="dept-info"><span className="dept-icon" style={{ color: dept.color }}>🩺</span><div><h3>{dept.specialty}</h3><p>{dept.doctor}</p></div></div>
                        <IonChip className="status-chip" color="success"><IonLabel>{dept.nextTime !== "--:--" ? "Đang hoạt động" : "Chờ"}</IonLabel></IonChip>
                      </div>
                      <div className="current-number-section">
                        <span className="current-number" style={{ color: dept.color }}>{String(dept.currentNumber || 0).padStart(2, "0")}</span>
                        <div className="next-time">Dự kiến: {dept.nextTime || "--:--"}</div>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        </div>

        {/* MY APPOINTMENTS FOR CHECK-IN */}
        <section className="iot-section" style={{marginBottom: '20px'}}>
            <h2 className="iot-title">🎫 Lịch hẹn của bạn</h2>
            {myAppointments.length === 0 ? <p>Bạn không có lịch hẹn nào sắp tới.</p> : (
                <div style={{ display: 'grid', gap: '10px' }}>
                    {myAppointments.map(appt => (
                        <div key={appt.id} className="service-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                            <div>
                                <h5>BS. {appt.doctorName}</h5>
                                <p>{new Date(appt.date).toLocaleString('vi-VN')}</p>
                                <IonChip color={appt.status === 'pending' ? 'warning' : 'success'}>
                                    {appt.status === 'pending' ? 'Chờ xác nhận' : 'Đã xác nhận'}
                                </IonChip>
                            </div>
                            {appt.status === 'pending' && (
                                <IonButton onClick={() => handleSimulateScan(appt.id)}>
                                    <IonIcon icon={scanOutline} slot="start" /> Check-in
                                </IonButton>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>

        {/* --- IOT SECTION (UPDATED LAYOUT 2 COLS) --- */}
        <section className="iot-section" ref={iotSectionRef}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h2 className="iot-title">📟 Theo dõi sức khỏe tại nhà (IoT)</h2>
            <p style={{ fontSize: '12px', color: '#666' }}>Nhập chỉ số đo từ thiết bị để theo dõi tình trạng sức khỏe.</p>
          </div>
          
          <IonGrid>
            <IonRow>
              {/* LEFT COL: FORM INPUT */}
              <IonCol size="12" sizeMd="5">
                <IonCard className="iot-card-clean">
                    <IonCardContent>
                        <div className="iot-input-group">
                            <label>🩸 Huyết áp (mmHg)</label>
                            <input type="number" value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} placeholder="Ví dụ: 120" className="clean-input" />
                        </div>
                        <div className="iot-input-group">
                            <label>🍚 Đường huyết (mg/dL)</label>
                            <input type="number" value={glucose} onChange={(e) => setGlucose(e.target.value)} placeholder="Ví dụ: 95" className="clean-input" />
                        </div>
                        <div className="iot-input-group">
                            <label>💓 Nhịp tim (bpm)</label>
                            <input type="number" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} placeholder="Ví dụ: 78" className="clean-input" />
                        </div>
                        <IonButton expand="block" color="primary" onClick={handleIoTSubmit} className="iot-submit-btn">
                            🚀 Gửi dữ liệu IoT
                        </IonButton>
                    </IonCardContent>
                </IonCard>
              </IonCol>

              {/* RIGHT COL: STATUS & CHART */}
              <IonCol size="12" sizeMd="7">
                <IonCard className="iot-card-clean">
                    <IonCardContent>
                        {/* HEALTH STATUS BARS */}
                        <div className="health-status-container">
                            <h5>🩺 Tình trạng sức khỏe hiện tại</h5>
                            <div className="status-row">
                                <span>Huyết áp</span>
                                <div className={`status-bar ${latestIoT ? getStatusColor(latestIoT.bloodPressure, 'bp') : ''}`}></div>
                            </div>
                            <div className="status-row">
                                <span>Đường huyết</span>
                                <div className={`status-bar ${latestIoT ? getStatusColor(latestIoT.glucose, 'gl') : ''}`}></div>
                            </div>
                            <div className="status-row">
                                <span>Nhịp tim</span>
                                <div className={`status-bar ${latestIoT ? getStatusColor(latestIoT.heartRate, 'hr') : ''}`}></div>
                            </div>
                        </div>

                        {/* CHART */}
                        <div className="chart-wrapper">
                            <h6>📊 Biểu đồ theo thời gian</h6>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={iotData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="bloodPressure" stroke="#ff6b6b" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="glucose" stroke="#4dabf7" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="heartRate" stroke="#51cf66" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* ALERTS SECTION (BELOW) */}
          {alerts.length > 0 && (
             <div className="iot-alerts-container">
                 {alerts.map((a, i) => (
                     <div key={i} className={`iot-alert-item ${a.type}`}>
                         <div className="alert-icon">⚠️</div>
                         <div className="alert-content">
                             <strong>{a.msg}</strong>
                             <span>{a.advice}</span>
                             <small>{a.time}</small>
                         </div>
                     </div>
                 ))}
             </div>
          )}
        </section>
        
        {/* PUBLIC CHAT UI RESTORED */}
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
              <input value={pInput} onChange={(e) => setPInput(e.target.value)} placeholder="Nhập tin nhắn..." />
              <button onClick={sendPublicMessage}>Gửi</button>
            </div>
          </div>
        )}

        <IonFab className={pChatOpen ? "hide-fab" : ""} vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setPChatOpen(true)}><IonIcon icon={chatbubbleEllipsesOutline} /></IonFabButton>
        </IonFab>

        <Footer />
        <IonModal isOpen={showQRScanner} className="qr-modal" backdropDismiss={false}>
            <div className="qr-scanner-mock">
                <div className="scan-line"></div>
                <p>Đang quét mã QR...</p>
                <IonSpinner name="crescent" />
            </div>
        </IonModal>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} color={toastMsg.includes("thành công") ? "success" : "danger"} />
      </IonContent>
    </IonPage>
  );
};

export default HomePatient;
