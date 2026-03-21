import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonCardSubtitle,
  IonIcon,
  IonText,
  IonChip,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
  IonButtons,
  IonBackButton,
  IonButton,
  IonToast,
  IonAlert
} from "@ionic/react";
import {
  medkitOutline,
  calendarOutline,
  personOutline,
  flaskOutline,
  bandageOutline,
  timeOutline,
  cloudDownloadOutline,
  alarmOutline,
  documentTextOutline
} from "ionicons/icons";
import axios from "../../services/axiosInstance";
import "./History.css";
import { LocalNotifications } from "@capacitor/local-notifications";

// Interface đầy đủ cho MedicalRecord
interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  note: string;
}

interface Prescription {
  instructions: string;
  medications: Medication[];
}

interface CanLamSang {
  type: string;
  result: string;
}

interface MedicalRecord {
  id: number;
  date: string;
  reExamDate?: string;
  note?: string; // Chẩn đoán
  doctor: {
    fullName: string;
    specialty?: { name: string };
  };
  prescription?: Prescription;
  appointment?: {
    canLamSangs?: CanLamSang[];
  };
}

const History: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    // 1. Try to load from API
    try {
      const res = await axios.get("/medical-records/me");
      setRecords(res.data);
      // Save for offline
      localStorage.setItem("offline_medical_records", JSON.stringify(res.data));
    } catch (err) {
      console.error("Lỗi khi lấy hồ sơ:", err);
      // 2. If fail, load from offline
      const offlineData = localStorage.getItem("offline_medical_records");
      if (offlineData) {
        setRecords(JSON.parse(offlineData));
        setToastMsg("Đang xem chế độ Offline (Dữ liệu cũ)");
        setShowToast(true);
      }
    }
  };

  const handleSaveOffline = () => {
      localStorage.setItem("offline_medical_records", JSON.stringify(records));
      setToastMsg("Đã lưu hồ sơ vào máy! Có thể xem khi không có mạng.");
      setShowToast(true);
  }

  const scheduleMedicationReminder = async (med: Medication) => {
    // Simple logic: Schedule for 8:00 AM everyday
    // In real app, parse `frequency` (e.g. "Sáng, Chiều")
    try {
        await LocalNotifications.requestPermissions();
        
        const now = new Date();
        const scheduleTime = new Date();
        scheduleTime.setHours(8, 0, 0, 0);
        if (scheduleTime < now) scheduleTime.setDate(scheduleTime.getDate() + 1);

        await LocalNotifications.schedule({
            notifications: [{
                title: `💊 Nhắc uống thuốc: ${med.name}`,
                body: `${med.dosage} - ${med.note}`,
                id: Math.floor(Math.random() * 100000),
                schedule: { at: scheduleTime, every: 'day' },
                sound: 'beep.wav'
            }]
        });
        setToastMsg(`Đã đặt nhắc nhở cho thuốc ${med.name} lúc 8:00 sáng hàng ngày.`);
        setShowToast(true);
    } catch (e) {
        setToastMsg("Không thể đặt thông báo.");
        setShowToast(true);
    }
  }

  return (
    <IonPage className="history-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/patient/home" />
          </IonButtons>
          <IonTitle>Lịch Sử Khám Bệnh</IonTitle>
          <IonButtons slot="end">
              <IonButton onClick={handleSaveOffline}>
                  <IonIcon icon={cloudDownloadOutline} />
              </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonToast isOpen={showToast} message={toastMsg} duration={2000} onDidDismiss={() => setShowToast(false)} />
        
        {records.length === 0 ? (
          <div className="empty-history">
            <IonIcon icon={medkitOutline} size="large" />
            <p>Bạn chưa có hồ sơ khám bệnh nào.</p>
          </div>
        ) : (
          <div className="history-list">
            {records.map((record) => (
              <IonCard key={record.id} className="history-card">
                <IonCardHeader>
                  <div className="card-top">
                    <IonCardTitle>
                      {new Date(record.date).toLocaleDateString("vi-VN")}
                    </IonCardTitle>
                    <IonChip color="primary" outline>
                      {record.doctor.specialty?.name || "Khám bệnh"}
                    </IonChip>
                  </div>
                  <IonCardSubtitle>
                    <IonIcon icon={personOutline} /> BS. {record.doctor.fullName}
                  </IonCardSubtitle>
                </IonCardHeader>

                <IonCardContent>
                  {/* Chẩn đoán */}
                  <div className="section">
                    <h4>📝 Chẩn đoán & Ghi chú</h4>
                    <p className="note-text">{record.note || "Không có ghi chú"}</p>
                  </div>

                  <IonAccordionGroup>
                    {/* Đơn thuốc */}
                    {record.prescription && (
                      <IonAccordion value="prescription">
                        {/* ✅ Xóa color="light", thêm class accordion-header */}
                        <IonItem slot="header" className="accordion-header" lines="none">
                          <IonIcon icon={bandageOutline} slot="start" />
                          <IonLabel>Đơn thuốc</IonLabel>
                        </IonItem>
                        <div className="accordion-content" slot="content">
                          <p>
                            <strong>Hướng dẫn:</strong>{" "}
                            {record.prescription.instructions}
                          </p>
                          <ul className="med-list">
                            {record.prescription.medications.map((med, idx) => (
                              <li key={idx} style={{ marginBottom: '10px', borderBottom: '1px dashed #eee', paddingBottom: '5px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <b>{med.name}</b> - {med.dosage}, {med.frequency} (
                                        {med.duration})
                                        <div className="med-note" style={{ fontSize: '0.85em', color: '#666' }}>{med.note}</div>
                                    </div>
                                    <IonButton fill="clear" size="small" onClick={() => scheduleMedicationReminder(med)}>
                                        <IonIcon icon={alarmOutline} />
                                    </IonButton>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </IonAccordion>
                    )}

                    {/* Kết quả CLS */}
                    {record.appointment?.canLamSangs &&
                      record.appointment.canLamSangs.length > 0 && (
                        <IonAccordion value="cls">
                          {/* ✅ Xóa color="light", thêm class accordion-header */}
                          <IonItem slot="header" className="accordion-header" lines="none">
                            <IonIcon icon={flaskOutline} slot="start" />
                            <IonLabel>Kết quả xét nghiệm</IonLabel>
                          </IonItem>
                          <div className="accordion-content" slot="content">
                            {record.appointment.canLamSangs.map((cls, idx) => (
                              <div key={idx} className="cls-item">
                                <strong>{cls.type}:</strong>{' '}
                                {cls.result.startsWith('http') ? (
                                    <a href={cls.result} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#3b82f6' }}>
                                        Xem kết quả (File) <IonIcon icon={documentTextOutline} style={{ verticalAlign: 'middle' }} />
                                    </a>
                                ) : (
                                    <span>{cls.result}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </IonAccordion>
                      )}
                  </IonAccordionGroup>

                  {/* Lịch tái khám */}
                  {record.reExamDate && (
                    <div className="reexam-alert">
                      <IonIcon icon={timeOutline} />
                      <span>
                        Hẹn tái khám:{" "}
                        <strong>
                          {new Date(record.reExamDate).toLocaleDateString("vi-VN")}
                        </strong>
                      </span>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default History;
