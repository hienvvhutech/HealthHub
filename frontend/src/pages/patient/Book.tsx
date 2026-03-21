import React, { useState, useEffect, useRef } from "react";
import {
  IonPage,
  IonContent,
  IonLabel,
  IonItem,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonAlert,
  IonToast,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonTitle,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonChip,
  IonModal,
  useIonViewWillEnter
} from "@ionic/react";
import axios from "../../services/axiosInstance";
import { useHistory, useLocation } from "react-router-dom";
import "./Book.css";
import Header from "../../components/Header";

// ✅ Import Haptics & LocalNotifications cho Mobile
import { Haptics, NotificationType } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

const Book: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ tab?: string; doctorId?: number; specialtyName?: string }>();

  const [specialties, setSpecialties] = useState<{ id: number; name: string }[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [doctors, setDoctors] = useState<{ id: number; fullName: string }[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [note, setNote] = useState("");
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [filteredTimes, setFilteredTimes] = useState<{ time: string; disabled: boolean }[]>([]);

  // Ref to hold pending doctor ID from navigation
  const pendingDoctorIdRef = useRef<number | null>(null);

  interface Appointment {
    id: number;
    doctor?: { fullName: string };
    date: string;
    status: string;
    sequenceNumber?: number;
  }

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [email, setEmail] = useState("");
  const [calendarDays, setCalendarDays] = useState<{ date: string; day: string; num: number }[]>([]);

  const [appointmentInfo, setAppointmentInfo] = useState<{
    code: string;
    doctor?: string;
    date: string;
    sequenceNumber?: number;
  } | null>(null);

  const currentDate = new Date();

  const availableTimes = [
    "07:00", "08:00", "09:00", "10:00", "11:00",
    "13:00", "14:00", "15:00", "16:00"
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Chờ xác nhận";
      case "waiting": return "Đang chờ khám";
      case "examining": return "Đang khám";
      case "completed": return "Đã khám";
      case "cancelled": return "Đã hủy";
      default: return status;
    }
  };

  // ✅ XỬ LÝ NAVIGATE TỪ AI / VOICE
  useIonViewWillEnter(() => {
    if (location.state?.specialtyName) {
        // Nếu chuyên khoa khác với hiện tại, set lại và lưu doctorId vào ref
        if (selectedDepartment !== location.state.specialtyName) {
            if (location.state.doctorId) {
                pendingDoctorIdRef.current = location.state.doctorId;
            }
            setSelectedDepartment(location.state.specialtyName);
        } else if (location.state.doctorId) {
             // Nếu chuyên khoa đã khớp, kiểm tra bác sĩ
             const docId = location.state.doctorId;
             // Nếu danh sách bác sĩ đã có, set luôn
             if (doctors.some(d => d.id === docId)) {
                 setSelectedDoctorId(docId);
             } else {
                 // Nếu chưa có (hoặc cần refresh), lưu ref và fetch lại
                 pendingDoctorIdRef.current = docId;
                 fetchDoctorsForDepartment(location.state.specialtyName);
             }
        }
    }
  });

  useEffect(() => {
    const days = [];
    const dayNames = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`; 

      const dayName = dayNames[date.getDay()];
      const dayNum = date.getDate();
      days.push({ date: dateStr, day: dayName, num: dayNum });
    }
    setCalendarDays(days);
  }, []);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/specialties", { headers: { Authorization: `Bearer ${token}` } });
        setSpecialties(res.data);
      } catch (err) {
        console.error("Lỗi:", err);
      }
    };
    fetchSpecialties();

    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setEmail(user.email);
    }
  }, []);

  const fetchDoctorsForDepartment = async (deptName: string) => {
      if (!deptName) {
        setDoctors([]);
        return;
      }
      // Không reset selectedDoctorId về 0 ngay lập tức để tránh flicker nếu đang auto-select
      
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/doctors?specialty=${deptName}`, { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        setDoctors(res.data);

        // ✅ AUTO-SELECT DOCTOR FROM REF
        if (pendingDoctorIdRef.current) {
            const found = res.data.find((d: any) => d.id === pendingDoctorIdRef.current);
            if (found) {
                setSelectedDoctorId(found.id);
            }
            pendingDoctorIdRef.current = null; // Clear ref after use
        } else {
             setSelectedDoctorId(0); // Reset nếu không có auto-select
        }
      } catch (err) {
        console.error("Lỗi:", err);
      }
  }

  // Fetch Doctors when Department changes
  useEffect(() => {
    fetchDoctorsForDepartment(selectedDepartment);
  }, [selectedDepartment]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/appointments", { headers: { Authorization: `Bearer ${token}` } });
      setAppointments(res.data);
    } catch (err) {
      console.error("Lỗi:", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (!selectedDoctorId || !selectedDate) {
        setFilteredTimes(availableTimes.map((t) => ({ time: t, disabled: false })));
        return;
      }
      try {
        const token = localStorage.getItem("token");
        
        const parts = selectedDate.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);

        const start = new Date(year, month, day, 0, 0, 0).toISOString();
        const end = new Date(year, month, day, 23, 59, 59).toISOString();

        const res = await axios.get(
          `/appointments/booked-times`, {
            params: { doctorId: selectedDoctorId, start, end },
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        const bookedISO: string[] = res.data.bookedTimes || [];
        
        const bookedLocal = bookedISO.map(iso => {
            const d = new Date(iso);
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        });

        setFilteredTimes(
          availableTimes.map((t) => {
              const isBooked = bookedLocal.includes(t);
              return { 
                  time: t, 
                  disabled: isBooked 
              };
          })
        );
      } catch (err) {
        console.error("Lỗi lấy giờ đã đặt:", err);
      }
    };
    fetchBookedTimes();
  }, [selectedDoctorId, selectedDate]);

  const handleBookAppointment = async () => {
    if (!selectedDoctorId || !selectedDate || !selectedTime) {
      setToastMessage("Vui lòng chọn đầy đủ thông tin.");
      setShowToast(true);
      return;
    }

    if (filteredTimes.find(t => t.time === selectedTime)?.disabled) {
      setToastMessage("❌ Giờ này đã có người đặt. Vui lòng chọn giờ khác.");
      setShowToast(true);
      return;
    }

    const token = localStorage.getItem("token");
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}:00`);

    if (selectedDateTime < currentDate) {
      setToastMessage("Không thể chọn thời gian trong quá khứ.");
      setShowToast(true);
      return;
    }

    try {
      const isoDate = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      const res = await axios.post(
        "/appointments",
        { doctorId: selectedDoctorId, date: isoDate, note, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const doctor = doctors.find((doc) => doc.id === selectedDoctorId);
      setAppointmentInfo({
        code: res.data.id.toString(),
        doctor: doctor?.fullName,
        date: new Date(isoDate).toLocaleString("vi-VN"),
        sequenceNumber: res.data.sequenceNumber,
      });

      if (Capacitor.isNativePlatform()) {
        await Haptics.vibrate();
        await LocalNotifications.schedule({
          notifications: [{
            title: "Đặt lịch thành công! 🎉",
            body: `Bạn đã đặt lịch với BS ${doctor?.fullName} vào ${selectedTime} ngày ${new Date(isoDate).toLocaleDateString("vi-VN")}.`,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 1000) },
          }]
        });
      }

      setShowAlert(true);
      fetchAppointments(); 
      setSelectedTime(""); 
      const fakeDate = selectedDate;
      setSelectedDate(""); 
      setTimeout(() => setSelectedDate(fakeDate), 100);

    } catch (err) {
      console.error("Lỗi đặt lịch:", err);
      setToastMessage("Đặt lịch thất bại. Có thể giờ này vừa bị người khác đặt.");
      setShowToast(true);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    const confirm = window.confirm("Bạn có chắc chắn muốn hủy lịch hẹn này?");
    if (!confirm) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/appointments/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAppointments(prev => prev.filter((a) => a.id !== id));
      setToastMessage("✅ Đã hủy lịch hẹn thành công.");
      setShowToast(true);
      const fakeDate = selectedDate;
      setSelectedDate(""); 
      setTimeout(() => setSelectedDate(fakeDate), 100);
    } catch (err) {
      console.error("Lỗi hủy lịch:", err);
      setToastMessage("❌ Không thể hủy lịch. Vui lòng thử lại.");
      setShowToast(true);
    }
  };

  const visibleAppointments = appointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "completed"
  );

  return (
    <IonPage>
      <Header />
      <IonContent className="book-content">
        <div className="book-container">
          
          <div className="form-panel">
            <h2 className="form-title">📅 Đặt Lịch Khám</h2>

            <div className="form-section">
              <label className="section-label">🏥 Chuyên Khoa</label>
              <IonSelect
                value={selectedDepartment}
                placeholder="Chọn chuyên khoa"
                onIonChange={(e) => setSelectedDepartment(e.detail.value)}
                className="custom-select"
              >
                {specialties.map((s) => (
                  <IonSelectOption key={s.id} value={s.name}>{s.name}</IonSelectOption>
                ))}
              </IonSelect>
            </div>

            <div className="form-section">
              <label className="section-label">👨‍⚕️ Bác Sĩ</label>
              <IonSelect
                value={selectedDoctorId}
                placeholder="Chọn bác sĩ"
                onIonChange={(e) => setSelectedDoctorId(Number(e.detail.value))}
                disabled={!selectedDepartment}
                className="custom-select"
              >
                {doctors.map((doc) => (
                  <IonSelectOption key={doc.id} value={doc.id}>{doc.fullName}</IonSelectOption>
                ))}
              </IonSelect>
            </div>

            {selectedDoctorId > 0 ? (
              <div className="form-section">
                <label className="section-label">📆 Chọn Ngày</label>
                <div className="calendar-container">
                  {calendarDays.map((day) => (
                    <button
                      key={day.date}
                      className={`calendar-day ${selectedDate === day.date ? "selected" : ""}`}
                      onClick={() => setSelectedDate(day.date)}
                    >
                      <div className="day-name">{day.day}</div>
                      <div className="day-num">{day.num}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: "#999", fontSize: "0.9rem" }}>⬆️ Vui lòng chọn bác sĩ trước</p>
            )}

            {selectedDate && (
              <div className="form-section">
                <label className="section-label">⏰ Chọn Giờ</label>
                <div className="time-grid">
                  {filteredTimes.map((t) => (
                    <button
                      key={t.time}
                      disabled={t.disabled}
                      className={`time-slot ${selectedTime === t.time ? "selected" : ""} ${t.disabled ? "disabled" : ""}`}
                      onClick={() => !t.disabled && setSelectedTime(t.time)}
                    >
                      {t.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="form-section">
              <label className="section-label">📝 Ghi Chú</label>
              <textarea
                className="notes-textarea"
                placeholder="Triệu chứng, yêu cầu đặc biệt..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <button className="confirm-button" onClick={handleBookAppointment}>
              ✅ XÁC NHẬN ĐẶT LỊCH
            </button>
          </div>

          <div className="form-panel" style={{ marginTop: '24px' }}>
            <h2 className="form-title">📋 Lịch Khám Sắp Tới</h2>
            
            {visibleAppointments.length === 0 ? (
              <p className="no-appointments">Bạn chưa có lịch hẹn nào sắp tới.</p>
            ) : (
              <div className="appointments-list">
                {visibleAppointments
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((a) => (
                    <IonCard key={a.id} className="appointment-card">
                      <IonCardContent>
                        <div className="appointment-info">
                          <div className="info-group">
                            <span className="info-label">👨‍⚕️ Bác sĩ:</span>
                            <span className="info-value">{a.doctor?.fullName}</span>
                          </div>
                          <div className="info-group">
                            <span className="info-label">📅 Thời gian:</span>
                            <span className="info-value">
                              {new Date(a.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(a.date).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <div className="info-group">
                            <span className="info-label">🔢 STT:</span>
                            <span className="info-value">{a.sequenceNumber ?? "Chờ cấp"}</span>
                          </div>
                          <div className="info-group">
                            <span className="info-label">📍 Trạng thái:</span>
                            <span className={`status-badge status-${a.status}`}>
                              {getStatusLabel(a.status)}
                            </span>
                          </div>
                        </div>
                        <button className="cancel-btn" onClick={() => handleCancelAppointment(a.id)}>
                          ❌ HUỶ
                        </button>
                      </IonCardContent>
                    </IonCard>
                  ))}
              </div>
            )}
          </div>

        </div>

        <IonModal isOpen={showAlert} onDidDismiss={() => { setShowAlert(false); history.push(`/patient/payment/${appointmentInfo?.code}`); }} className="success-modal">
          <div className="modal-success-content">
            <div className="success-icon">✅</div>
            <h2 className="success-title">Đặt Lịch Thành Công!</h2>
            <div className="success-info-box">
               <p>Mã: <strong>{appointmentInfo?.code}</strong></p>
               <p>Bác sĩ: <strong>{appointmentInfo?.doctor}</strong></p>
               <p>Thời gian: <strong>{appointmentInfo?.date}</strong></p>
               <p>Số thứ tự: <strong>{appointmentInfo?.sequenceNumber}</strong></p>
            </div>
            <button className="modal-close-btn" onClick={() => { setShowAlert(false); history.push(`/patient/payment/${appointmentInfo?.code}`); }}>
              💳 Thanh Toán Ngay
            </button>
          </div>
        </IonModal>

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={3000} />
      </IonContent>
    </IonPage>
  );
};

export default Book;
