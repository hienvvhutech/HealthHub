//cspell:disable
import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "../../services/axiosInstance";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonItem,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonBackButton,
  IonAccordionGroup,
  IonAccordion,
} from "@ionic/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./DoctorAppointmentDetail.css";

interface CanLamSang {
  type: string;
  result: string;
  note?: string;
}

interface AppointmentDetail {
  id: number;
  date: string;
  note: string;
  status: string;
  patient: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
  };
  doctor: {
    id: number;
    fullName: string;
  };
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  note: string;
}

interface Medicine {
  id: number;
  name: string;
  unit: string;
  dosage: string;
  description: string;
  price: number;
}

interface IoTData {
  time: string;
  bloodPressure: number;
  glucose: number;
  heartRate: number;
}

// Interface cho Lịch sử khám
interface MedicalRecord {
  id: number;
  date: string;
  note?: string;
  description?: string;
  doctor: { fullName: string };
  prescription?: {
    medications: Medication[];
  };
}

const DoctorAppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(
    null
  );
  const [patientHistory, setPatientHistory] = useState<MedicalRecord[]>([]);
  const [reExamDate, setReExamDate] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [status, setStatus] = useState<string>("pending");

  const [cls, setCls] = useState<CanLamSang>({
    type: "",
    result: "",
    note: "",
  });

  const [clsTypes, setClsTypes] = useState<{ id: number; name: string }[]>([]);

  const [medications, setMedications] = useState<Medication[]>([
    { name: "", dosage: "", frequency: "", duration: "", note: "" },
  ]);

  const [instructions, setInstructions] = useState<string>("");

  const [iotData, setIotData] = useState<IoTData[]>([]);
  const [availableMedicines, setAvailableMedicines] = useState<Medicine[]>([]);

  // -----------------------
  // FETCH DATA
  // -----------------------
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchDetail = async () => {
      try {
        const res = await axios.get(
          `/appointments/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAppointment(res.data);
        setNote(res.data.note || "");
        setStatus(res.data.status || "pending");

        if (res.data.patient?.id) {
          fetchPatientHistory(res.data.patient.id);
          fetchIoTData(res.data.patient.id);
        }

      } catch (err) {
        console.error("Lỗi khi lấy chi tiết lịch hẹn:", err);
      }
    };

    fetchDetail();
    
    const fetchCatalogs = async () => {
        try {
            const [medRes, clsRes] = await Promise.all([
                axios.get("/medicines", { headers: { Authorization: `Bearer ${token}` } }),
                axios.get("/cls/types", { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setAvailableMedicines(medRes.data);
            setClsTypes(clsRes.data);
        } catch (e) { console.error(e) }
    }
    fetchCatalogs();

  }, [id]);

  const fetchPatientHistory = async (patientId: number) => {
      try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`/medical-records/patient/${patientId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setPatientHistory(res.data);
      } catch (err) {
          console.error("Lỗi lấy lịch sử bệnh nhân:", err);
      }
  }

  const fetchIoTData = async (patientId: number) => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `/healthdata/patient/${patientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
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


  // -----------------------
  // ACTION HANDLERS
  // -----------------------

  const handleSaveCLS = async () => {
    const token = localStorage.getItem("token");
    await axios.post(
      "/cls",
      { appointmentId: Number(id), ...cls },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert("Đã lưu kết quả CLS");
  };

  const handleSavePrescription = async () => {
    const token = localStorage.getItem("token");
    if (!appointment) return;

    await axios.post(
      "/prescriptions",
      {
        appointmentId: Number(id),
        instructions,
        medications,
        patientId: appointment.patient.id,
        doctorId: appointment.doctor.id,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Đã lưu đơn thuốc và cập nhật hồ sơ!");
  };

  const handleUpdateStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const reExamDateToSend = reExamDate
        ? new Date(reExamDate).toISOString()
        : null;

      await axios.put(
        `/appointments/${id}/status`,
        {
          status,
          note,
          reExamDate: reExamDateToSend,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Cập nhật trạng thái thành công!");
      
      // ✅ SỬA LOGIC: Chỉ quay lại nếu trạng thái là "completed" (Đã khám) hoặc "cancelled"
      // Nếu là "examining" (Đang khám), giữ nguyên trang để bác sĩ nhập liệu tiếp.
      if (status === "completed" || status === "cancelled") {
          history.goBack();
      }
      
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
    }
  };

  const handleAddMedicine = () =>
    setMedications([
      ...medications,
      { name: "", dosage: "", frequency: "", duration: "", note: "" },
    ]);

  const handleChangeMedicine = (
    index: number,
    field: keyof Medication,
    value: string
  ) => {
    const newMeds = [...medications];
    if (field === "name") {
      const selectedMed = availableMedicines.find((m) => m.name === value);
      if (selectedMed) {
        newMeds[index].name = selectedMed.name;
        newMeds[index].dosage = selectedMed.dosage;
      }
    } else {
      newMeds[index][field] = value;
    }
    setMedications(newMeds);
  };

  // -----------------------
  // RENDER
  // -----------------------

  if (!appointment)
    return (
      <IonContent className="ion-padding">
        <p style={{ color: "red" }}>Đang tải dữ liệu...</p>
      </IonContent>
    );

  return (
    <IonPage className="doctor-detail-page">
      <IonButtons slot="start">
        <IonBackButton defaultHref="/doctoc" />
      </IonButtons>

      <IonHeader>
        <IonToolbar>
          <IonTitle>Chi Tiết Lịch Hẹn</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            {/* LEFT COLUMN: Thông tin & Lịch sử */}
            <IonCol size="12" sizeMd="6">
              {/* --- THÔNG TIN BỆNH NHÂN --- */}
              <IonCard className="detail-card">
                <IonCardHeader>
                  <IonCardTitle>
                    Bệnh nhân: {appointment.patient.fullName}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p><strong>Email:</strong> {appointment.patient.email}</p>
                  <p><strong>SĐT:</strong> {appointment.patient.phone}</p>
                  <p><strong>Lý do khám:</strong> {appointment.note || "Không có"}</p>
                </IonCardContent>
              </IonCard>

              {/* --- LỊCH SỬ KHÁM BỆNH --- */}
              <IonCard className="detail-card">
                  <IonCardHeader>
                      <IonCardTitle>📜 Lịch sử khám bệnh</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                      {patientHistory.length === 0 ? (
                          <p>Chưa có lịch sử khám.</p>
                      ) : (
                          <IonAccordionGroup>
                              {patientHistory.map((record) => (
                                  <IonAccordion key={record.id} value={`hist-${record.id}`}>
                                      {/* ✅ XÓA color="light", style bằng CSS */}
                                      <IonItem slot="header" className="history-header" lines="none">
                                          <IonLabel>
                                              {new Date(record.date).toLocaleDateString("vi-VN")} - BS. {record.doctor.fullName}
                                          </IonLabel>
                                      </IonItem>
                                      <div className="ion-padding" slot="content">
                                          <p><strong>Chẩn đoán:</strong> {record.note || record.description}</p>
                                          {record.prescription && (
                                              <ul style={{paddingLeft: '20px', margin: '5px 0'}}>
                                                  {record.prescription.medications.map((m, i) => (
                                                      <li key={i}>{m.name} - {m.dosage}</li>
                                                  ))}
                                              </ul>
                                          )}
                                      </div>
                                  </IonAccordion>
                              ))}
                          </IonAccordionGroup>
                      )}
                  </IonCardContent>
              </IonCard>

              {/* --- CẬP NHẬT TRẠNG THÁI --- */}
              <IonCard className="detail-card">
                <IonCardHeader>
                  <IonCardTitle>🩺 Cập nhật thông tin khám</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem>
                    <IonLabel position="stacked">Ngày tái khám</IonLabel>
                    <IonInput
                      type="date"
                      value={reExamDate}
                      onIonChange={(e) => setReExamDate(e.detail.value ?? "")}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Chuẩn đoán bệnh</IonLabel>
                    <IonTextarea
                      value={note}
                      onIonChange={(e) => setNote(e.detail.value ?? "")}
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Trạng thái</IonLabel>
                    <IonSelect
                      value={status}
                      onIonChange={(e) => setStatus(e.detail.value)}
                    >
                      {/* Removed "pending" and "waiting" options as requested */}
                      <IonSelectOption value="examining">Đang khám</IonSelectOption>
                      <IonSelectOption value="completed">Đã khám</IonSelectOption>
                    </IonSelect>
                  </IonItem>

                  <IonButton expand="block" onClick={handleUpdateStatus}>
                    Lưu cập nhật
                  </IonButton>
                </IonCardContent>
              </IonCard>

              {/* --- CLS (ĐÃ KHÔI PHỤC) --- */}
              <IonCard className="detail-card">
                <IonCardHeader>
                  <IonCardTitle>🧪 Nhập kết quả CLS</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem>
                    <IonLabel position="stacked">Loại CLS</IonLabel>
                    <IonSelect
                      value={cls.type}
                      placeholder="Chọn loại CLS"
                      onIonChange={(e) =>
                        setCls({ ...cls, type: e.detail.value })
                      }
                    >
                      {clsTypes.map((t) => (
                        <IonSelectOption key={t.id} value={t.name}>
                          {t.name}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Kết quả</IonLabel>
                    <IonInput
                      value={cls.result}
                      onIonChange={(e) =>
                        setCls({ ...cls, result: e.detail.value ?? "" })
                      }
                    />
                  </IonItem>

                  <IonItem>
                    <IonLabel position="stacked">Ghi chú</IonLabel>
                    <IonTextarea
                      value={cls.note}
                      onIonChange={(e) =>
                        setCls({ ...cls, note: e.detail.value ?? "" })
                      }
                    />
                  </IonItem>

                  <IonButton expand="block" onClick={handleSaveCLS}>
                    Lưu kết quả CLS
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* RIGHT COLUMN: ĐƠN THUỐC + IOT */}
            <IonCol size="12" sizeMd="6">
              {/* --- ĐƠN THUỐC --- */}
              <IonCard className="detail-card">
                <IonCardHeader>
                  <IonCardTitle>💊 Đơn thuốc</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {medications.map((med, idx) => (
                    <div key={idx} className="medicine-box">
                      <IonItem>
                        <IonLabel position="stacked">Tên thuốc</IonLabel>
                        <IonSelect
                          value={med.name}
                          placeholder="Chọn thuốc"
                          onIonChange={(e) =>
                            handleChangeMedicine(idx, "name", e.detail.value ?? "")
                          }
                        >
                          {availableMedicines.map((medicine) => (
                            <IonSelectOption key={medicine.id} value={medicine.name}>
                              {medicine.name}
                            </IonSelectOption>
                          ))}
                        </IonSelect>
                      </IonItem>

                      <IonItem><IonLabel position="stacked">Liều dùng</IonLabel><IonInput value={med.dosage} readonly /></IonItem>
                      <IonItem><IonLabel position="stacked">Tần suất</IonLabel><IonInput value={med.frequency} onIonChange={e => handleChangeMedicine(idx, 'frequency', e.detail.value!)} /></IonItem>
                      <IonItem><IonLabel position="stacked">Số ngày</IonLabel><IonInput value={med.duration} onIonChange={e => handleChangeMedicine(idx, 'duration', e.detail.value!)} /></IonItem>
                      <IonItem><IonLabel position="stacked">Ghi chú</IonLabel><IonInput value={med.note} onIonChange={e => handleChangeMedicine(idx, 'note', e.detail.value!)} /></IonItem>
                    </div>
                  ))}

                  <IonButton expand="block" fill="outline" onClick={handleAddMedicine}>+ Thêm thuốc</IonButton>
                  <IonItem style={{ marginTop: "16px" }}>
                    <IonLabel position="stacked">Hướng dẫn sử dụng</IonLabel>
                    <IonTextarea value={instructions} onIonChange={(e) => setInstructions(e.detail.value ?? "")} />
                  </IonItem>
                  <IonButton expand="block" style={{ marginTop: "16px" }} onClick={handleSavePrescription}>Lưu đơn thuốc</IonButton>
                </IonCardContent>
              </IonCard>

              {/* --- IOT CHART --- */}
              <IonCard className="detail-card">
                <IonCardHeader>
                  <IonCardTitle>📟 Chỉ số sức khỏe (IoT)</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {iotData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={iotData}>
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="bloodPressure" stroke="#ff6b6b" />
                        <Line type="monotone" dataKey="glucose" stroke="#4dabf7" />
                        <Line type="monotone" dataKey="heartRate" stroke="#51cf66" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ textAlign: "center", color: "#666", padding: "20px" }}>Chưa có dữ liệu IoT</p>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default DoctorAppointmentDetail;
