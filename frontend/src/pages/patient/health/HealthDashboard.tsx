import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonIcon,
  IonButton,
  IonButtons,
  IonBackButton,
  IonSegment, // ✅ Added
  IonSegmentButton, // ✅ Added
  IonLabel, // ✅ Added
} from "@ionic/react";
import { calendar, fileTrayFull, pulse } from "ionicons/icons";
import axios from "../../../services/axiosInstance";
import { getApiUrl } from "../../../services/apiConfig";
import "./HealthDashboardSidebar.css";
import Header from "../../../components/Header";

interface CanLamSang {
  type: string;
  result: string;
  note?: string;
  date: string;
}

interface Appointment {
  id: number;
  date: string;
  status: string;
  canLamSangs?: CanLamSang[];
}

interface Doctor {
  fullName: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  note?: string;
}

interface Prescription {
  id: number;
  instructions: string;
  medications: Medication[];
}

interface MedicalRecord {
  id: number;
  date: string;
  description: string;
  note?: string;
  type: string;
  doctor?: Doctor;
  appointment?: Appointment;
  prescription?: Prescription;
  reExamDate?: string;
}

const getBaseApiUrl = () => getApiUrl();

const HealthDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("records");
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const recordRes = await axios.get(
          "/medical-records/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setRecords(recordRes.data);
      } catch (error) {
        console.error("❌ Lỗi khi tải dữ liệu:", error);
      }
    };
    fetchData();
  }, []);

  const handleDownloadPdf = async (recordId: number) => {
    const API_URL = getBaseApiUrl();
    const res = await fetch(
      `${API_URL}/medical-records/prescription/${recordId}/pdf`
    );
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `don-thuoc-${recordId}.pdf`;
    a.click();
  };

  return (
    <IonPage>
      <Header />
      
      {/* Mobile Header with Back Button (Header handles back, but we can keep standard header for title) */}
      <IonHeader className="mobile-header">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/patient/home" />
          </IonButtons>
          <IonTitle>Sổ Khám Bệnh</IonTitle>
        </IonToolbar>
        {/* ✅ Mobile Tabs (IonSegment) */}
        <IonToolbar>
          <IonSegment value={activeTab} onIonChange={e => setActiveTab(e.detail.value as string)} scrollable>
            <IonSegmentButton value="records">
              <IonLabel>Lịch sử</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="prescriptions">
              <IonLabel>Đơn thuốc</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="tests">
              <IonLabel>Xét nghiệm</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <div className="health-dashboard-container">
        {/* ✅ Sidebar (Desktop Only) */}
        <div className="health-sidebar desktop-sidebar">
          <div className="sidebar-title">Sổ Khám Bệnh</div>
          <div
            className={`sidebar-item${activeTab === "records" ? " active" : ""}`}
            onClick={() => setActiveTab("records")}
          >
            <IonIcon icon={fileTrayFull} /> Lịch sử khám
          </div>
          <div
            className={`sidebar-item${activeTab === "prescriptions" ? " active" : ""}`}
            onClick={() => setActiveTab("prescriptions")}
          >
            <IonIcon icon={pulse} /> Đơn thuốc
          </div>
          <div
            className={`sidebar-item${activeTab === "tests" ? " active" : ""}`}
            onClick={() => setActiveTab("tests")}
          >
            <IonIcon icon={calendar} /> Xét nghiệm
          </div>
        </div>

        <div className="health-content">
          <IonContent className="ion-padding">
            {/* TAB 1: Lịch sử khám */}
            {activeTab === "records" &&
              (records.length > 0 ? (
                records.map((record) => (
                  <IonCard key={record.id} className="health-card">
                    <IonCardHeader>
                      <IonCardTitle className="rules-title1">
                        {record.description}
                      </IonCardTitle>
                      <IonCardSubtitle className="rules-section-title">
                        <IonIcon icon={calendar} />{" "}
                        {new Date(record.date).toLocaleDateString("vi-VN")}
                      </IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p><strong>Bác sĩ:</strong> {record.doctor?.fullName || "Không rõ"}</p>
                      <p><strong>Trạng thái:</strong> {record.appointment?.status || "Không rõ"}</p>
                      {record.note && <p><strong>Chẩn đoán:</strong> {record.note}</p>}
                      {record.reExamDate && (
                        <p><strong>Ngày tái khám:</strong> {new Date(record.reExamDate).toLocaleDateString("vi-VN")}</p>
                      )}
                    </IonCardContent>
                  </IonCard>
                ))
              ) : (
                <div className="empty-state">Chưa có lịch sử khám.</div>
              ))}

            {/* TAB 2: Đơn thuốc */}
            {activeTab === "prescriptions" && (
              <>
                {records.filter((r) => r.prescription).length > 0 ? (
                  records
                    .filter((r) => r.prescription)
                    .map((record) => (
                      <IonCard key={record.id} className="health-card">
                        <IonCardHeader>
                          <IonCardTitle className="rules-title1" color={"black"}>
                            Đơn thuốc
                          </IonCardTitle>
                          <IonCardSubtitle className="rules-section-title">
                            <IonIcon icon={calendar} />{" "}
                            {new Date(record.date).toLocaleDateString("vi-VN")}
                          </IonCardSubtitle>
                        </IonCardHeader>
                        <IonCardContent>
                          <p><strong>Bác sĩ:</strong> {record.doctor?.fullName || "Không rõ"}</p>
                          <p><strong>Hướng dẫn:</strong> {record.prescription?.instructions || "Không có"}</p>

                          {record.prescription?.medications?.length ? (
                            <ul className="medication-list">
                              {record.prescription.medications.map((m, idx) => (
                                <li key={idx}>
                                  <b>{m.name}</b>: {m.dosage}, {m.frequency} ({m.duration}) 
                                  {m.note && <span className="med-note"> - {m.note}</span>}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>Không có thuốc nào được kê.</p>
                          )}

                          <IonButton
                            onClick={() => handleDownloadPdf(record.id)}
                            color="primary"
                            fill="outline"
                            expand="block"
                          >
                            Tải PDF
                          </IonButton>
                        </IonCardContent>
                      </IonCard>
                    ))
                ) : (
                  <div className="empty-state">Chưa có đơn thuốc nào.</div>
                )}
              </>
            )}

            {/* TAB 3: Xét nghiệm */}
            {activeTab === "tests" &&
              (() => {
                const seen = new Set<string>();
                const testCards: React.ReactNode[] = [];

                records.forEach((record) => {
                  const appointment = record.appointment;
                  if (appointment?.canLamSangs) {
                    appointment.canLamSangs.forEach((cls) => {
                      const key = `${cls.type}-${cls.result}-${
                        new Date(cls.date).toISOString().split("T")[0]
                      }`;
                      if (!seen.has(key)) {
                        seen.add(key);
                        testCards.push(
                          <IonCard key={key} className="health-card">
                            <IonCardHeader>
                              <IonCardTitle className="rules-title1">{cls.type}</IonCardTitle>
                              <IonCardSubtitle className="rules-section-title">
                                <IonIcon icon={calendar} />{" "}
                                {new Date(record.date).toLocaleDateString("vi-VN")}
                              </IonCardSubtitle>
                            </IonCardHeader>
                            <IonCardContent>
                              <p><strong>Kết quả:</strong> {cls.result}</p>
                              {cls.note && <p><strong>Ghi chú:</strong> {cls.note}</p>}
                            </IonCardContent>
                          </IonCard>
                        );
                      }
                    });
                  }
                });

                return testCards.length > 0 ? testCards : <div className="empty-state">Không có kết quả xét nghiệm.</div>;
              })()}
          </IonContent>
        </div>
      </div>
    </IonPage>
  );
};

export default HealthDashboard;
