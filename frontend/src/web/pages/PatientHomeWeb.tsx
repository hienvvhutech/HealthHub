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
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import {
  calendarOutline,
  personCircleOutline,
  pulseOutline,
  searchOutline,
  refreshOutline,
  chatbubbleEllipsesOutline,
} from "ionicons/icons";
import axios from "../../services/axiosInstance";
import "../../pages/patient/HomePatient.css"; // Reuse CSS for now
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

// WEB VERSION: No Capacitor imports

// ====== TYPES ======
type Department = {
  specialty: string;
  doctor: string;
  color?: string;
  currentNumber: number; // STT đang khám
  nextTime?: string;
};

type Appointment = {
  id: number;
  doctorName: string; // Tên bác sĩ từ API
  sequenceNumber: number; // STT của mình
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
type DoctorRecommendation = {
  id: number;
  fullName: string;
  experience: number;
};

const PatientHomeWeb: React.FC = () => {
  const history = useHistory();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  
  // Tránh thông báo lặp lại cho cùng 1 số
  const notifiedRef = useRef<Set<string>>(new Set());

  // --- REQUEST PERMISSION (WEB) ---
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const queueRes = await axios.get("/appointments/queue-status");
      const queueData: Department[] = queueRes.data;
      setDepartments(queueData);

      if (!token) return;

      const patientId = localStorage.getItem("userId");
      if (patientId) {
        const myRes = await axios.get("/appointments/patient", {
          params: { patientId },
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const todayStr = new Date().toLocaleDateString("en-CA");
        const myPending = (myRes.data as Appointment[]).filter(a => {
           const apptDate = a.date.split("T")[0];
           return apptDate === todayStr && (a.status === "pending" || a.status === "waiting");
        });
        
        setMyAppointments(myPending);
        checkAndNotify(queueData, myPending);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
    }
  };

  const checkAndNotify = async (queues: Department[], myAppts: Appointment[]) => {
    for (const myAppt of myAppts) {
      const matchingQueue = queues.find(q => 
        q.doctor.includes(myAppt.doctorName) || myAppt.doctorName.includes(q.doctor)
      );

      if (matchingQueue) {
        const mySeq = myAppt.sequenceNumber;
        const currentSeq = matchingQueue.currentNumber;
        const diff = mySeq - currentSeq;
        const notifyKey = `${myAppt.id}-${currentSeq}`;

        if (diff === 1 && !notifiedRef.current.has(notifyKey)) {
          notifiedRef.current.add(notifyKey);
          
          const title = "🔔 Sắp đến lượt bạn!";
          const body = `Bác sĩ ${myAppt.doctorName} đang khám số ${currentSeq}. Bạn là số ${mySeq}. Hãy chuẩn bị vào khám!`;

          // WEB NOTIFICATION ONLY
          if (Notification.permission === "granted") {
            new Notification(title, { body });
          }
        }
      }
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const [bloodPressure, setBloodPressure] = useState("");
  const [glucose, setGlucose] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [iotData, setIotData] = useState<IoTData[]>([]);
  const [alerts, setAlerts] = useState<AlertType[]>([]);

  useEffect(() => {
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
    fetchIoTData();
  }, []);
  const handleIoTSubmit = async () => {
    if (!bloodPressure || !glucose || !heartRate) return;
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("Không tìm thấy token, vui lòng đăng nhập lại!");
      return;
    }
    const decoded = jwtDecode<DecodedToken>(token);
    const patientId = decoded?.patientId;

    if (!patientId) {
      console.error("Token không chứa patientId!");
      return;
    }
    const newData = {
      time: new Date().toLocaleTimeString(),
      bloodPressure: Number(bloodPressure),
      glucose: Number(glucose),
      heartRate: Number(heartRate),
    };
    setIotData((prev) => [...prev.slice(-9), newData]);
    try {
      await axios.post(
        "/healthdata",
        {
          patientId,
          metric: "IoT",
          value: JSON.stringify(newData),
          source: "Device",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Gửi dữ liệu IoT thành công!");
    } catch (err) {
      console.error("Lỗi khi gửi dữ liệu IoT:", err);
    }
    const alerts = getHealthAlert(newData);
    setAlerts(alerts);
    const alertsGenerated = getHealthAlert(newData);
    setAlerts(alertsGenerated);
    setBloodPressure("");
    setGlucose("");
    setHeartRate("");
  };
  const getHealthAlert = (data: IoTData): AlertType[] => {
    const alerts: AlertType[] = [];
    if (data.bloodPressure > 140) {
      alerts.push({
        type: "danger",
        msg: "Huyết áp quá cao!",
        advice:
          "Hãy ngồi nghỉ, uống nước và thư giãn. Nếu kéo dài hãy liên hệ bác sĩ.",
      });
    }
    if (data.bloodPressure < 90) {
      alerts.push({
        type: "warning",
        msg: "Huyết áp thấp!",
        advice: "Hãy bổ sung nước và muối nhẹ, tránh thay đổi tư thế đột ngột.",
      });
    }
    if (data.glucose > 180) {
      alerts.push({
        type: "danger",
        msg: "Đường huyết cao!",
        advice: "Hạn chế ăn ngọt, uống nước lọc và kiểm tra lại sau 30 phút.",
      });
    }
    if (data.glucose < 70) {
      alerts.push({
        type: "warning",
        msg: "Đường huyết thấp!",
        advice: "Hãy uống nước đường hoặc ăn kẹo, kiểm tra lại sau 10 phút.",
      });
    }
    if (data.heartRate > 120) {
      alerts.push({
        type: "danger",
        msg: "Nhịp tim cao bất thường!",
        advice:
          "Ngừng vận động, ngồi nghỉ và hít thở sâu. Nếu không giảm hãy đi khám.",
      });
    }
    if (data.heartRate < 50) {
      alerts.push({
        type: "warning",
        msg: "Nhịp tim thấp!",
        advice: "Kiểm tra thuốc đang dùng và theo dõi thêm.",
      });
    }
    return alerts;
  };
  // ====== AI RECOMMENDATION ======
  const [aiResult, setAiResult] = useState<{
    message: string;
    specialty: string;
    riskLevel: string;
    doctors: DoctorRecommendation[];
    tests: string[];
  } | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAISearchClick = async () => {
    const input = document.querySelector(
      ".ai-search-input"
    ) as HTMLInputElement;
    const symptom = input?.value.trim();
    if (!symptom) return;

    setAiLoading(true);

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "/recommendations",
        { message: symptom },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setAiResult(res.data.data);
      setAiModalOpen(true);
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setAiLoading(false);
    }
  };
  // ====== AI CHATBOX ======
  interface PublicMessage {
    id: string | number;
    sender: "user" | "admin" | "system";
    text: string;
    time: string;
  }

  const [pChatOpen, setPChatOpen] = useState(false);
  const [pInput, setPInput] = useState("");
  const [pMessages, setPMessages] = useState<PublicMessage[]>([]);
  const guestId = localStorage.getItem("guestId") || `guest-${Date.now()}`;
  if (!localStorage.getItem("guestId")) {
    localStorage.setItem("guestId", guestId);
  }

  interface PublicChatRecord {
    id: number;
    guestId: string;
    sender: "user" | "admin" | "system";
    message: string;
    createdAt: string;
  }

  const loadHistory = async () => {
    try {
      const res = await axios.get(`/public-chat/history/${guestId}`);

      setPMessages(
        res.data.map((m: PublicChatRecord) => ({
          id: m.id,
          sender: m.sender,
          text: m.message,
          time: m.createdAt,
        }))
      );
    } catch {
      setPMessages([]);
    }
  };
  const sendPublicMessage = async () => {
    const text = pInput.trim();
    if (!text) return;

    const newMsg: PublicMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toISOString(),
    };

    setPMessages((prev) => [...prev, newMsg]);
    setPInput("");

    try {
      await axios.post("/public-chat/send", {
        chatId: guestId,
        message: text,
      });

      // reload tin nhắn sau khi backend tạo auto-reply
      loadHistory();
    } catch (err) {
      console.error("Send failed", err);
    }
  };
  useEffect(() => {
    if (pChatOpen) loadHistory();
  }, [pChatOpen]);

  // ====== UI ======
  return (
    <IonPage className="full-height-page">
      <Header />
      <IonContent className="ion-padding home-bg content-expand">
        {/* === HERO SECTION === */}
        <div className="hero-section">
          <div className="hero-text">
            <h1>Chăm Sóc Sức Khỏe Thông Minh & Toàn Diện</h1>
            <p>
              Đặt lịch khám, theo dõi chỉ số sức khỏe và nhận tư vấn từ đội ngũ
              y bác sĩ chuyên nghiệp trên nền tảng kỹ thuật số.
            </p>
            <div className="hero-buttons">
              <IonButton
                expand="block"
                color="primary"
                onClick={() => history.push("/patient/book")}
              >
                📅 Đặt Lịch Khám
              </IonButton>
            </div>
          </div>
          <div className="hero-image">
            <img src="/assets/health.png" alt="patients" />
          </div>
        </div>

        {/* === SERVICES === */}
        <section className="services-section">
          <h2>Dịch Vụ Chăm Sóc Sức Khỏe Toàn Diện</h2>
          <p className="desc">
            Chúng tôi cung cấp các dịch vụ chất lượng cao qua nền tảng kỹ thuật
            số hiện đại.
          </p>
          <div className="service-grid">
            <div
              className="service-card"
              onClick={() => history.push("/patient/book")}
            >
              <IonIcon icon={calendarOutline} />
              <h5>Đặt Lịch Khám</h5>
              <p>Đặt lịch nhanh chóng, linh hoạt, không cần chờ đợi.</p>
            </div>
            <div
              className="service-card"
              onClick={() => history.push("/patient/profile")}
            >
              <IonIcon icon={personCircleOutline} />
              <h5>Hồ Sơ Y Tế</h5>
              <p>
                Quản lý hồ sơ, lưu kết quả khám, dễ dàng chia sẻ với bác sĩ.
              </p>
            </div>
            <div
              className="service-card"
              onClick={() => history.push("/patient/health")}
            >
              <IonIcon icon={pulseOutline} />
              <h5>Sổ Khám Bệnh Điện Tử</h5>
              <p>Hiển thị lịch sử khám, đơn thuốc, kết quả xét nghiệm.</p>
            </div>
            <div
              className="service-card"
              onClick={() => history.push("/patient/find-doctor")}
            >
              <IonIcon icon={searchOutline} />
              <h5>Tìm Bác Sĩ</h5>
              <p>Tìm bác sĩ theo chuyên khoa, bệnh viện, tư vấn nhanh chóng.</p>
            </div>
          </div>
        </section>

        {/* === THEO DÕI KHÁM BỆNH === */}
        <div className="section-container queue-followup">
          <div className="section-header">
            <div className="section-title-row">
              <div>
                <h2 className="section-title">Theo dõi khám bệnh</h2>
                <p className="section-subtitle">
                  Cập nhật thời gian thực từng khoa (Tự động cập nhật mỗi 10s)
                </p>
              </div>

              <IonButton fill="outline" size="small" onClick={fetchData}>
                <IonIcon icon={refreshOutline} slot="start" />
                Làm mới
              </IonButton>
            </div>
          </div>

          <IonGrid className="queue-grid-modern">
            <IonRow>
              {departments.length === 0 && (
                <IonCol size="12">
                  <p style={{ textAlign: "center", opacity: 0.6 }}>
                    Không có khoa nào đang hoạt động.
                  </p>
                </IonCol>
              )}

              {departments.map((dept, idx) => (
                <IonCol size="12" sizeMd="6" key={idx}>
                  <IonCard className="queue-card-modern">
                    <IonCardContent className="queue-card-content">
                      <div className="queue-header">
                        <div className="dept-info">
                          <span
                            className="dept-icon"
                            style={{ color: dept.color }}
                          >
                            🩺
                          </span>
                          <div>
                            <h3>{dept.specialty}</h3>
                            <p>{dept.doctor}</p>
                          </div>
                        </div>

                        <IonChip className="status-chip" color="success">
                          <IonLabel>Đang khám</IonLabel>
                        </IonChip>
                      </div>

                      <div className="current-number-section">
                        <span
                          className="current-number"
                          style={{ color: dept.color }}
                        >
                          {String(dept.currentNumber || 0).padStart(2, "0")}
                        </span>
                        <span className="current-label">Đang khám</span>
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

        {/* === AI RECOMMENDATION SEARCH === */}
        <div className="ai-recommend-container">
          <div className="ai-card">
            <IonChip className="ai-chip" color="light">
              <IonLabel>✨ Tìm kiếm bằng AI</IonLabel>
            </IonChip>
            <h1 className="ai-title">Tìm bác sĩ phù hợp cho bạn</h1>
            <p className="ai-subtitle">
              Nhập triệu chứng của bạn — AI sẽ gợi ý chuyên khoa và bác sĩ phù
              hợp nhất
            </p>
            <div className="ai-search-bar">
              <div className="ai-input-wrapper">
                <IonIcon icon={searchOutline} className="ai-input-icon" />
                <input
                  type="text"
                  className="ai-search-input"
                  placeholder="Nhập triệu chứng, chuyên khoa hoặc tên bác sĩ..."
                />
              </div>

              <IonButton className="ai-btn" onClick={handleAISearchClick}>
                Tư Vấn
              </IonButton>
            </div>
          </div>
        </div>

        {/* === PHẦN IOT === */}
        <section className="iot-section">
          <h2 className="iot-title">📟 Theo dõi chỉ số sức khỏe (IoT)</h2>
          <p className="iot-subtitle">
            Nhập dữ liệu đo từ thiết bị (huyết áp, đường huyết, nhịp tim) để
            hiển thị biểu đồ.
          </p>

          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="5">
                <IonCard className="iot-card">
                  <IonCardContent>
                    <IonItem>
                      <IonLabel position="stacked">Huyết áp (mmHg)</IonLabel>
                      <input
                        type="number"
                        value={bloodPressure}
                        onChange={(e) => setBloodPressure(e.target.value)}
                        placeholder="Ví dụ: 120"
                        className="iot-input"
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">
                        Đường huyết (mg/dL)
                      </IonLabel>
                      <input
                        type="number"
                        value={glucose}
                        onChange={(e) => setGlucose(e.target.value)}
                        placeholder="Ví dụ: 95"
                        className="iot-input"
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Nhịp tim (bpm)</IonLabel>
                      <input
                        type="number"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value)}
                        placeholder="Ví dụ: 78"
                        className="iot-input"
                      />
                    </IonItem>
                    <IonButton
                      expand="block"
                      color="primary"
                      onClick={handleIoTSubmit}
                      className="iot-submit"
                    >
                      Gửi dữ liệu IoT
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="7">
                <IonCard className="iot-chart-card">
                  <IonCardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={iotData}>
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="bloodPressure"
                          name="Huyết áp"
                          stroke="#ff6b6b"
                        />
                        <Line
                          type="monotone"
                          dataKey="glucose"
                          name="Đường huyết"
                          stroke="#4dabf7"
                        />
                        <Line
                          type="monotone"
                          dataKey="heartRate"
                          name="Nhịp tim"
                          stroke="#51cf66"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>
        {alerts.length > 0 && (
          <IonRow>
            <IonCol size="12">
              {alerts.map((a, i) => (
                <IonCard
                  key={i}
                  color={a.type === "danger" ? "danger" : "warning"}
                  style={{ padding: "16px", marginTop: "16px" }}
                >
                  <IonCardContent>
                    <h3 style={{ color: "black", fontWeight: "bold" }}>
                      {a.msg}
                    </h3>
                    <p style={{ color: "black", marginTop: "6px" }}>
                      👉 {a.advice}
                    </p>
                  </IonCardContent>
                </IonCard>
              ))}
            </IonCol>
          </IonRow>
        )}
        {/* === AI RESULT MODAL === */}
        <IonModal
          isOpen={aiModalOpen}
          onDidDismiss={() => setAiModalOpen(false)}
        >
          <IonContent className="ai-modal-content" scrollY={true}>
            <div className="ai-modal-container">
              <h2 className="ai-modal-title">🧠 AI Medical Recommendation</h2>

              {aiLoading && (
                <div className="ai-loading">
                  <IonSpinner />
                  <p>Đang phân tích triệu chứng...</p>
                </div>
              )}

              {!aiLoading && aiResult && (
                <>
                  <IonCard className="ai-result-card">
                    <IonCardContent>
                      <h3>Kết luận sơ bộ</h3>
                      <p>{aiResult.message}</p>
                    </IonCardContent>
                  </IonCard>

                  <IonCard className="ai-result-card">
                    <IonCardContent>
                      <h3>Chuyên khoa phù hợp</h3>
                      <IonChip color="primary">
                        <IonLabel>{aiResult.specialty}</IonLabel>
                      </IonChip>

                      <h3>Mức độ rủi ro</h3>
                      <IonChip
                        color={
                          aiResult.riskLevel === "high"
                            ? "danger"
                            : aiResult.riskLevel === "medium"
                            ? "warning"
                            : "success"
                        }
                      >
                        <IonLabel>{aiResult.riskLevel.toUpperCase()}</IonLabel>
                      </IonChip>

                      <h3>Bác sĩ đề xuất</h3>
                      {aiResult?.doctors?.map((d: DoctorRecommendation) => (
                        <p key={d.id}>
                          👨‍⚕️ {d.fullName} — {d.experience} năm kinh nghiệm
                        </p>
                      ))}

                      <h3>Xét nghiệm khuyến nghị</h3>
                      <ul>
                        {aiResult.tests?.map((t: string, i: number) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </IonCardContent>
                  </IonCard>

                  <IonButton
                    expand="block"
                    onClick={() => setAiModalOpen(false)}
                  >
                    Đóng
                  </IonButton>
                </>
              )}
            </div>
            <IonFab
              className={pChatOpen ? "hide-fab" : ""}
              vertical="bottom"
              horizontal="end"
              slot="fixed"
            >
              <IonFabButton onClick={() => setPChatOpen(true)}>
                <IonIcon icon={chatbubbleEllipsesOutline} />
              </IonFabButton>
            </IonFab>
          </IonContent>
        </IonModal>
        {!pChatOpen && (
          <IonFab
            className={pChatOpen ? "hide-fab" : ""}
            vertical="bottom"
            horizontal="end"
            slot="fixed"
          >
            <IonFabButton onClick={() => setPChatOpen(true)}>
              <IonIcon icon={chatbubbleEllipsesOutline} />
            </IonFabButton>
          </IonFab>
        )}

        {pChatOpen && (
          <div className="chatbox-container">
            <div className="chatbox-header">
              <span>Hỗ trợ bệnh viện (24/7)</span>
              <button
                onClick={() => {
                  setPChatOpen(false);
                  setPMessages([]);
                  const newGuest = "guest-" + Date.now();
                  localStorage.setItem("guestId", newGuest);
                  window.location.reload();
                }}
              >
                ×
              </button>
            </div>

            <div className="chatbox-messages">
              {pMessages.map((m) => (
                <div key={m.id} className={`msg ${m.sender}`}>
                  <div className="msg-text">{m.text}</div>
                  <div className="msg-time">
                    {new Date(m.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="chatbox-input">
              <input
                value={pInput}
                onChange={(e) => setPInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
              />
              <button onClick={sendPublicMessage}>Gửi</button>
            </div>
          </div>
        )}

        <Footer />
      </IonContent>
    </IonPage>
  );
};

export default PatientHomeWeb;
