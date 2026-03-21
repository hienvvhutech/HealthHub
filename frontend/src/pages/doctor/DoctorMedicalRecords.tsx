import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonModal,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from "@ionic/react";
import { eyeOutline, searchOutline } from "ionicons/icons";
import axios from "../../services/axiosInstance";
import "../Home.css";

interface MedicalRecord {
  id: number;
  patient: {
    code?: string;
    fullName: string;
    address: string;
  };
  appointment: {
    date: string;
    reExamDate: string | null;
    canLamSangs?: {
      id: number;
      name: string;
      type?: string;
      result?: string;
    }[];
  };
  note: string;
  prescription?: {
    medications: { name: string; dosage: string; quantity: number }[];
  };
}

const DoctorMedicalRecords: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [searchText, setSearchText] = useState("");
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(
    null
  );

  const fetchRecords = async () => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) return;
    const user = JSON.parse(userStr);
    if (user.role !== "doctor" || !user.id) return;

    try {
      // ✅ Use relative path
      const res = await axios.get(
        "/medical-records/me-doctor",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRecords(res.data);
    } catch (err) {
      console.error("❌ Lỗi khi lấy hồ sơ bệnh:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredRecords = records.filter(
    (r) =>
      r.id.toString().includes(searchText.trim()) ||
      r.patient.fullName.toLowerCase().includes(searchText.trim().toLowerCase())
  );

  return (
    <IonPage>
      <IonButtons slot="start">
        <IonBackButton defaultHref="/doctoc" />
      </IonButtons>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Hồ Sơ Y Tế</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding doctor-medical-records-page">
        <div className="doctor-medical-records">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div className="doctor-medical-title">🩺 Hồ Sơ Bệnh Nhân</div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ marginRight: 8 }}>Tìm kiếm</span>
              <IonInput
                placeholder="Tìm theo mã hồ sơ hoặc tên..."
                value={searchText}
                onIonChange={(e) => setSearchText(e.detail.value ?? "")}
                style={{ width: "250px" }}
              />
              <IonIcon icon={searchOutline} style={{ marginLeft: 8 }} />
            </div>
          </div>
          <div className="doctor-medical-desc">
            Danh sách hồ sơ bệnh nhân đã từng khám
          </div>
          <div className="doctor-medical-table-wrap">
            <table className="doctor-medical-table">
              <thead>
                <tr>
                  <th>Mã Hồ Sơ</th>
                  <th>Bệnh Nhân</th>
                  <th>Ngày Khám</th>
                  <th>Địa chỉ</th>
                  <th>Chuẩn đoán</th>
                  <th>Hẹn Tái Khám</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7}>⛔ Không có hồ sơ nào</td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.id}</td>
                      <td>
                        <b>{rec.patient.fullName || "Chưa cập nhật"}</b>
                      </td>
                      <td>
                        {new Date(rec.appointment.date).toLocaleDateString()}
                      </td>
                      <td>{rec.patient.address || "Chưa cập nhật"}</td>
                      <td>{rec.note || "Chưa có chuẩn đoán"}</td>
                      <td>
                        {rec.appointment.reExamDate
                          ? new Date(
                              rec.appointment.reExamDate
                            ).toLocaleDateString()
                          : "Không có"}
                      </td>
                      <td>
                        <IonButton
                          color="primary"
                          size="small"
                          fill="clear"
                          onClick={() => setViewingRecord(rec)}
                        >
                          <IonIcon icon={eyeOutline} slot="icon-only" />
                        </IonButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <IonModal
          isOpen={!!viewingRecord}
          onDidDismiss={() => setViewingRecord(null)}
        >
          <IonContent className="ion-padding">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle className="rules-title">
                  Chi Tiết Hồ Sơ #{viewingRecord?.id}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  <strong>Bệnh nhân:</strong> {viewingRecord?.patient.fullName}
                </p>
                <p>
                  <strong>Ngày khám:</strong>{" "}
                  {viewingRecord?.appointment.date &&
                    new Date(
                      viewingRecord.appointment.date
                    ).toLocaleDateString()}
                </p>
                <p>
                  <strong>Chuẩn đoán:</strong>{" "}
                  {viewingRecord?.note || "Chưa có"}
                </p>
                <p>
                  <strong>Địa chỉ:</strong> {viewingRecord?.patient.address}
                </p>
                <p>
                  <strong>Hẹn tái khám:</strong>{" "}
                  {viewingRecord?.appointment.reExamDate
                    ? new Date(
                        viewingRecord.appointment.reExamDate
                      ).toLocaleDateString()
                    : "Không có"}
                </p>

                {viewingRecord?.appointment.canLamSangs?.length ? (
                  <>
                    <h4 style={{ marginTop: "16px" }}>📋 Cận lâm sàng:</h4>
                    <ul>
                      {viewingRecord.appointment.canLamSangs.map((cls) => (
                        <li key={cls.id}>
                          {cls.type}: {cls.result || "Chưa có kết quả"}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {viewingRecord?.prescription?.medications?.length ? (
                  <>
                    <h4 style={{ marginTop: "16px" }}>💊 Thuốc:</h4>
                    <ul>
                      {viewingRecord.prescription.medications.map(
                        (med, idx) => (
                          <li key={idx}>
                            {med.name} - {med.dosage} - SL: {med.quantity}
                          </li>
                        )
                      )}
                    </ul>
                  </>
                ) : null}
              </IonCardContent>
              <IonButton expand="block" onClick={() => setViewingRecord(null)}>
                Đóng
              </IonButton>
            </IonCard>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default DoctorMedicalRecords;
