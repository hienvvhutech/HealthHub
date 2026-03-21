import React, { useEffect, useState } from "react";
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonText,
} from "@ionic/react";
import axios from "../../../services/axiosInstance";

interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  note: string;
}

interface Prescription {
  id: number;
  instructions: string;
  createdAt: string;
  medications: Medication[];
  appointment: {
    doctor: {
      fullName: string;
    };
  };
}

const MedicalHistory: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrescriptions = async () => {
    try {
      const token = localStorage.getItem("token");
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const patientId = userData?.id;

      // ✅ Use relative path
      const res = await axios.get(
        `/prescriptions/patient/${patientId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Prescriptions:", res.data);
      setPrescriptions(res.data);
    } catch (err) {
      console.error("Lỗi khi tải đơn thuốc:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  if (loading) return <IonSpinner name="dots" />;

  return (
    <>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="rules-title">Đơn Thuốc</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {prescriptions.length === 0 ? (
            <IonText>Không có đơn thuốc nào.</IonText>
          ) : (
            prescriptions.map((prescription, index) => (
              <div key={index}>
                <IonText>
                  <p>
                    <strong>Bác sĩ:</strong>{" "}
                    {prescription.appointment?.doctor?.fullName}
                  </p>
                  <p>
                    <strong>Ngày tạo:</strong>{" "}
                    {new Date(prescription.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Chỉ dẫn:</strong>{" "}
                    {prescription.instructions || "Không có"}
                  </p>
                  <ul>
                    {prescription.medications.map((med, idx) => (
                      <li key={idx}>
                        <strong>{med.name}</strong> - {med.dosage},{" "}
                        {med.frequency}, {med.duration} ngày
                        <br />
                        <em>Ghi chú:</em> {med.note}
                      </li>
                    ))}
                  </ul>
                </IonText>
                <hr />
              </div>
            ))
          )}
        </IonCardContent>
      </IonCard>
    </>
  );
};

export default MedicalHistory;
