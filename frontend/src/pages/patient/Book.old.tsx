import React, { useState, useEffect } from "react";
import {
  IonPage,
  IonContent,
  IonLabel,
  IonItem,
  IonTextarea,
  IonDatetime,
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
} from "@ionic/react";
import axios from "../../services/axiosInstance";
import { useHistory, useLocation } from "react-router-dom";
import "./Book.css"; // Import your updated CSS file
import Header from "../../components/Header";

const Book: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ tab?: string }>();

  const [specialties, setSpecialties] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [doctors, setDoctors] = useState<{ id: number; fullName: string }[]>(
    []
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(0);
  const [date, setDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [note, setNote] = useState("");
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [filteredTimes, setFilteredTimes] = useState<
    { time: string; disabled: boolean }[]
  >([]);
  interface Appointment {
    id: number;
    doctor?: { fullName: string };
    date: string;
    status: string;
    sequenceNumber?: number;
    // Add other fields as needed
  }
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedTab, setSelectedTab] = useState("create");
  const [toastMessage, setToastMessage] = useState("");

  const [appointmentInfo, setAppointmentInfo] = useState<{
    code: string;
    doctor?: string;
    date: string;
    sequenceNumber?: number;
  } | null>(null);

  const currentDate = new Date();
  const currentDateString = currentDate.toISOString().split("T")[0];
  const availableTimes = [
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
  ];

  useEffect(() => {
    if (location.state?.tab) {
      setSelectedTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const token = localStorage.getItem("token");
        // ✅ Use relative path
        const res = await axios.get("/specialties", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSpecialties(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách chuyên khoa:", err);
      }
    };
    fetchSpecialties();
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const token = localStorage.getItem("token");
        // ✅ Use relative path
        const res = await axios.get(
          `/doctors?search=${selectedDepartment}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDoctors(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách bác sĩ:", err);
      }
    };
    if (selectedDepartment) {
      fetchDoctors();
    }
  }, [selectedDepartment]);

  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (selectedDoctorId && date) {
        try {
          const token = localStorage.getItem("token");
          // ✅ Use relative path
          const res = await axios.get(
            `/appointments/booked-times?doctorId=${selectedDoctorId}&date=${date}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setBookedTimes(res.data.bookedTimes || []);
        } catch (err) {
          console.error("Lỗi khi lấy giờ đã đặt:", err);
        }
      }
    };
    fetchBookedTimes();
  }, [selectedDoctorId, date]);

  useEffect(() => {
    const now = new Date();
    const selected = new Date(date);

    const times = availableTimes.map((timeObj) => {
      const [hour, minute] = timeObj.split(":").map(Number);
      const t = new Date(selected);
      t.setHours(hour);
      t.setMinutes(minute);
      t.setSeconds(0);
      t.setMilliseconds(0);

      const isPast = t < now;
      const isBooked = bookedTimes.includes(timeObj);

      return { time: timeObj, disabled: isPast || isBooked };
    });

    setFilteredTimes(times);
  }, [bookedTimes, date]);

  useEffect(() => {
    if (selectedTab === "scheduled") {
      const fetchAppointments = async () => {
        try {
          const token = localStorage.getItem("token");
          // ✅ Use relative path
          const res = await axios.get(
            "/appointments/patient",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setAppointments(res.data);
        } catch (err) {
          console.error("❌ Lỗi khi tải lịch:", err);
        }
      };
      fetchAppointments();
    }
  }, [selectedTab]);

  const handleBookAppointment = async () => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");

    if (
      !token ||
      !email ||
      !selectedDepartment ||
      !selectedDoctorId ||
      !date ||
      !selectedTime
    ) {
      setToastMessage("Vui lòng điền đầy đủ thông tin đặt lịch.");
      setShowToast(true);
      return;
    }

    const selectedDateTime = new Date(`${date}T${selectedTime}:00+07:00`);

    if (selectedDateTime < currentDate) {
      setToastMessage("Không thể chọn thời gian trong quá khứ.");
      setShowToast(true);
      return;
    }

    if (bookedTimes.includes(selectedTime)) {
      setToastMessage("❌ Bác sĩ đã có lịch hẹn khung giờ này.");
      setShowToast(true);
      return;
    }

    try {
      const isoDate = new Date(`${date}T${selectedTime}:00`).toISOString();
      // ✅ Use relative path
      const res = await axios.post(
        "/appointments",
        {
          doctorId: selectedDoctorId,
          date: isoDate,
          note,
          email,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const doctor = doctors.find((doc) => doc.id === selectedDoctorId);
      setAppointmentInfo({
        code: res.data.id.toString(),
        doctor: doctor?.fullName,
        date: new Date(isoDate).toLocaleString("vi-VN"),
        sequenceNumber: res.data.sequenceNumber,
      });

      setShowAlert(true);
    } catch (err) {
      console.error(
        "Bác sĩ đã có lịch hẹn vào giờ này. Vui lòng chọn lịch giờ khác:",
        err
      );
      setToastMessage(
        "Bác sĩ đã có lịch hẹn vào giờ này. Vui lòng chọn lịch giờ khác:"
      );
      setShowToast(true);
    }
  };

  const handleAlertDismiss = () => {
    setShowAlert(false);
    if (appointmentInfo?.code) {
      history.push(`/patient/payment/${appointmentInfo.code}`);
    }
  };
  const handleCancelAppointment = async (appointmentId: number) => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment) return;

    const appointmentTime = new Date(appointment.date).getTime();
    const now = new Date().getTime();
    const diffInMinutes = (appointmentTime - now) / (1000 * 60); // chênh lệch phút

    if (diffInMinutes < 60) {
      alert("Không thể huỷ lịch khi còn dưới 1 tiếng trước giờ khám.");
      return;
    }

    const confirm = window.confirm("Bạn có chắc muốn huỷ lịch này?");
    if (!confirm) return;

    try {
      const token = localStorage.getItem("token");
      // ✅ Use relative path
      await axios.put(
        `/appointments/${appointmentId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status: "cancelled" } : a
        )
      );
    } catch (err) {
      setToastMessage("❌ Huỷ lịch thất bại");
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <Header />
      </IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton defaultHref="/patient/home" />
        </IonButtons>
        <IonTitle>Đặt Lịch Khám</IonTitle>
      </IonToolbar>

      <IonContent className="ion-padding">
        {/* Tab Buttons */}
        <div className="tab-buttons-container">
          <IonButton
            fill={selectedTab === "create" ? "solid" : "outline"}
            onClick={() => setSelectedTab("create")}
          >
            Đặt lịch mới
          </IonButton>
          <IonButton
            fill={selectedTab === "scheduled" ? "solid" : "outline"}
            onClick={() => setSelectedTab("scheduled")}
          >
            Lịch sắp tới
          </IonButton>
        </div>

        {/* Form Đặt Lịch */}
        {selectedTab === "create" && (
          <div className="booking-content">
            {/* Date Picker */}
            <div className="calendar-panel">
              <div className="calendar-container">
                <IonItem className="form-item" lines="none">
                  <IonLabel position="stacked">Ngày khám</IonLabel>
                  <IonDatetime
                    presentation="date"
                    value={date}
                    min={currentDateString}
                    onIonChange={(e) => {
                      const raw = e.detail.value as string;
                      if (raw) {
                        setDate(new Date(raw).toISOString().split("T")[0]);
                        setSelectedTime("");
                      }
                    }}
                  />
                </IonItem>
              </div>
            </div>

            {/* Form Panel */}
            <div className="form-panel">
              <h3>Thông Tin Khám</h3>

              <IonItem className="form-item">
                <IonLabel position="stacked">Chuyên khoa</IonLabel>
                <IonSelect
                  value={selectedDepartment}
                  placeholder="-- Chọn --"
                  onIonChange={(e) => setSelectedDepartment(e.detail.value)}
                >
                  {specialties.map((s) => (
                    <IonSelectOption key={s.id} value={s.name}>
                      {s.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem className="form-item">
                <IonLabel position="stacked">Bác sĩ</IonLabel>
                <IonSelect
                  value={selectedDoctorId}
                  placeholder="-- Chọn bác sĩ --"
                  onIonChange={(e) =>
                    setSelectedDoctorId(Number(e.detail.value))
                  }
                  disabled={!selectedDepartment}
                >
                  {doctors.map((doc) => (
                    <IonSelectOption key={doc.id} value={doc.id}>
                      {doc.fullName}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem className="form-item">
                <IonLabel position="stacked">Giờ khám</IonLabel>
                <IonSelect
                  value={selectedTime}
                  placeholder="-- Chọn giờ --"
                  onIonChange={(e) => setSelectedTime(e.detail.value)}
                  disabled={!date}
                >
                  {filteredTimes.map((t) => (
                    <IonSelectOption
                      key={t.time}
                      value={t.time}
                      disabled={t.disabled}
                    >
                      {t.time}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem className="form-item">
                <IonLabel position="stacked">Ghi chú</IonLabel>
                <IonTextarea
                  placeholder="Triệu chứng, yêu cầu..."
                  value={note}
                  onIonChange={(e) => setNote(e.detail.value || "")}
                />
              </IonItem>

              <IonButton
                expand="block"
                className="confirm-button"
                onClick={handleBookAppointment}
              >
                XÁC NHẬN ĐẶT LỊCH
              </IonButton>

              <div className="contact-info">
                <p>📞 Liên hệ hỗ trợ: 1900 1234</p>
              </div>
            </div>
          </div>
        )}

        {/* Lịch Sắp Tới */}
        {selectedTab === "scheduled" && (
          <div className="form-panel">
            <h3>Lịch sắp tới</h3>
            <div className="scheduled-appointments">
              {appointments.filter((a) => a.status !== "cancelled").length ===
              0 ? (
                <p className="no-appointments">Không có lịch nào.</p>
              ) : (
                appointments
                  .filter((a) => a.status !== "cancelled") // ✅ ẩn lịch đã huỷ
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )
                  .map((a) => (
                    <IonItem key={a.id} className="appointment-item">
                      <IonLabel className="ion-text-wrap">
                        <p>
                          <b>Bác sĩ:</b> {a.doctor?.fullName}
                        </p>
                        <p>
                          <b>Ngày:</b>{" "}
                          {new Date(a.date).toLocaleTimeString("vi-VN")}{" "}
                          {new Date(a.date).toLocaleDateString("vi-VN")}
                        </p>
                        <p>
                          <b>Số thứ tự:</b> {a.sequenceNumber ?? "Chưa có"}
                        </p>
                        <p>
                          <b>Trạng thái:</b> {a.status}
                        </p>
                      </IonLabel>

                      <IonButton
                        size="small"
                        className="cancel-button-modern"
                        slot="end"
                        onClick={() => handleCancelAppointment(a.id)}
                      >
                        ❌ HUỶ LỊCH
                      </IonButton>
                    </IonItem>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Alert khi đặt lịch thành công */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={handleAlertDismiss}
          className="custom-alert"
          header="✅ Đặt Lịch Thành Công!"
          message={
            `Mã: ${appointmentInfo?.code ?? ""}\n` +
            `Số thứ tự: ${appointmentInfo?.sequenceNumber ?? ""}\n` +
            `Bác sĩ: ${appointmentInfo?.doctor ?? ""}\n` +
            `Thời gian: ${appointmentInfo?.date ?? ""}\n\n` +
            `Vui lòng đến sớm 10–15 phút và mang theo CCCD, BHYT và mã đặt lịch.`
          }
          buttons={[{ text: "Đã hiểu", handler: handleAlertDismiss }]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          className="custom-toast"
          message={toastMessage}
          duration={3000}
          color="danger"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Book;
