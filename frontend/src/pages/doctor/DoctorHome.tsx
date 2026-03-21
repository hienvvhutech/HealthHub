import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonInput, // Import IonInput for date
} from "@ionic/react";
import axios from "../../services/axiosInstance";
import { useHistory } from "react-router-dom";
import "./DoctorHome.css";

interface Appointment {
  id: number;
  date: string;
  note: string;
  status: string;
  sequenceNumber: number;
  patient: {
    fullName: string;
  };
}

const DoctorHome: React.FC = () => {
  const history = useHistory();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorName, setDoctorName] = useState<string>("");
  const [currentSequence, setCurrentSequence] = useState<number>(0);
  // ✅ State cho ngày được chọn, mặc định là hôm nay
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    history.push("/");
  };

  const handleHide = async (id: number) => {
    const confirm = window.confirm("Bạn có chắc muốn ẩn lịch này?");
    if (!confirm) return;
    try {
      await axios.patch(`/appointments/${id}/hide`);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert("Lỗi khi ẩn lịch.");
    }
  };

  const getStatusLabel = (status: string) => {
    const s = status?.toLowerCase() || "";
    switch (s) {
      case "pending":
      case "waiting":
        return "Đang chờ";
      case "examining":
        return "Đang khám";
      case "completed":
        return "Đã khám";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Đang chờ";
    }
  };

  // ✅ Tách fetchData ra ngoài để có thể gọi lại với ngày mới
  const fetchData = async (date: string) => {
    try {
      const res1 = await axios.get("/doctors/me");
      setDoctorName(res1.data.fullName);

      // ✅ Gửi yêu cầu với tham số `date`
      const res2 = await axios.get(
        `/appointments/doctor/me?date=${date}`
      );
      const list = res2.data;
      setAppointments(list);

      // Tính STT hiện tại dựa trên dữ liệu trả về (của ngày đã chọn)
      const examining = list.find((a: Appointment) => a.status === "examining");
      let displaySequence = 0;
      if (examining) {
        displaySequence = examining.sequenceNumber;
      } else {
        const completed = list.filter((a: Appointment) => a.status === "completed");
        if (completed.length > 0) {
          displaySequence = Math.max(...completed.map((a: Appointment) => a.sequenceNumber));
        }
      }
      setCurrentSequence(displaySequence);

    } catch (error) {
      console.error("Lỗi lấy dữ liệu:", error);
    }
  };
  
  // ✅ useEffect sẽ chạy khi selectedDate thay đổi
  useEffect(() => {
    if (selectedDate) {
      fetchData(selectedDate);
    }
  }, [selectedDate]);


  // ✅ Lọc các lịch hẹn bị hủy ở phía client
  const filteredAppointments = appointments.filter(a => a.status !== "cancelled");
  
  const getWeekDays = () => {
    const today = new Date();
    const week = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() + i);
        week.push(day);
    }
    return week;
  };

  const weekDays = getWeekDays();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="header-content">
            📋 Bảng Điều Khiển Bác Sĩ
          </IonTitle>
          <IonButtons slot="end">
            <button className="logout-btn" onClick={handleLogout}>
              🔋 Đăng xuất
            </button>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="dashboard-container">
          {/* Sidebar */}
          <div className="dashboard-sidebar">
            <div className="avatar-circle">👨‍⚕️</div>
            <div className="welcome-text">
              <h2>Bảng Điều Khiển Bác Sĩ</h2>
              <p>Chào mừng, TS. BS. {doctorName}</p>
            </div>

            <div className="stats-card">
              <div className="stats-icon">📊</div>
              <div className="stats-number">{currentSequence}</div>
              <div className="stats-label">Số thứ tự đang xử lý</div>
              <div className="stats-sublabel">
                của ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
              </div>
              <button
                onClick={() => fetchData(selectedDate)}
                style={{
                  marginTop: "10px",
                  padding: "8px 16px",
                  background: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                🔄 Làm mới
              </button>
            </div>

            <div className="nav-section">
              <div className="nav-item active">📅 Lịch làm việc</div>
              <div
                className="nav-item"
                onClick={() => history.push("/doctor/profile")}
              >
                👤 Hồ sơ cá nhân
              </div>
              <div
                className="nav-item"
                onClick={() => history.push("/doctor/medical-records")}
              >
                📋 Hồ sơ bệnh nhân
              </div>
              <div
                className="nav-item"
                onClick={() => history.push("/doctor/chats")}
              >
                💬 Phản hồi
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="dashboard-main">
            <div className="section-card">
              <div className="section-header">
                  <div className="section-title">📅 Lịch Làm Việc</div>
                  <div className="date-selector">
                      <label>Chọn ngày: </label>
                      <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={e => setSelectedDate(e.target.value)}
                        className="date-input"
                      />
                  </div>
              </div>
               <div className="week-view">
                  {weekDays.map(day => (
                      <button 
                          key={day.toISOString()}
                          className={`week-day-btn ${selectedDate === day.toISOString().split('T')[0] ? 'active' : ''}`}
                          onClick={() => setSelectedDate(day.toISOString().split('T')[0])}
                      >
                          <div className="day-of-week">{day.toLocaleDateString('vi-VN', { weekday: 'short' })}</div>
                          <div className="day-of-month">{day.getDate()}</div>
                      </button>
                  ))}
              </div>


              {filteredAppointments.length === 0 ? (
                <div className="empty-state">
                  <p>⛔ Không có lịch hẹn nào cho ngày này.</p>
                </div>
              ) : (
                filteredAppointments.map((a) => (
                  <div className="patient-card" key={a.id}>
                    <div className="patient-header">
                      👤 {a.patient.fullName}
                    </div>
                    <div className="patient-info">
                      🕐{" "}
                      {new Date(a.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="patient-info">
                      📌 {getStatusLabel(a.status)} - STT: {a.sequenceNumber}
                    </div>
                    <div className="patient-info">
                      📝 {a.note || "Không có ghi chú"}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "12px",
                      }}
                    >
                      <button
                        className="logout-btn"
                        style={{ backgroundColor: "#3498db" }}
                        onClick={() =>
                          history.push(`/doctor/appointment/${a.id}`)
                        }
                      >
                        👁️ XEM CHI TIẾT
                      </button>
                      <button
                        className="logout-btn"
                        style={{ backgroundColor: "#ff4d4f" }}
                        onClick={() => handleHide(a.id)}
                      >
                        ❌ ẨN LỊCH
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DoctorHome;
