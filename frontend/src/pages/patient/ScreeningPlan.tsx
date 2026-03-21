import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonCard,
  IonCardContent,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonIcon,
  IonTextarea,
} from "@ionic/react";
import {
  medkitOutline,
  personOutline,
  businessOutline,
  bulbOutline,
  flaskOutline,
  alarmOutline,
  checkmarkCircle,
} from "ionicons/icons";
import axios from "../../services/axiosInstance";
import { useHistory } from "react-router-dom";
import "./ScreeningPlan.css";

interface Doctor {
  id: number;
  fullName: string;
  experience: number;
  hospital: string;
}

interface ResultData {
  specialty: string;
  doctor: Doctor | null;
  advice: string;
  tests: string[];
  reasoning: string;
  reminder: string;
}

const ScreeningPlan: React.FC = () => {
  const history = useHistory();
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<string>("");
  const [historyList, setHistoryList] = useState<string[]>([]);
  const [symptom, setSymptom] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConsult = async () => {
    if (!age || !gender) {
      alert("Vui lòng nhập đầy đủ thông tin tuổi và giới tính!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("/screening/plan", {
        age: Number(age),
        gender,
        history: historyList,
        symptom: symptom // Gửi thêm triệu chứng
      });
      setResult(res.data.data);
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = () => {
    if (result) {
      history.push({
        pathname: "/patient/book",
        state: {
          doctorId: result.doctor?.id,
          specialtyName: result.specialty
        }
      });
    } else {
      history.push("/patient/book");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/patient/home" />
          </IonButtons>
          <IonTitle>Tư Vấn Gói Khám (AI)</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding screening-page">
        <div className="screening-container">
          {/* FORM INPUT */}
          {!result && (
            <div className="form-section">
              <div className="form-header">
                <h3>📝 Nhập thông tin sức khỏe</h3>
                <p>Hệ thống sẽ phân tích và gợi ý gói khám phù hợp nhất cho bạn.</p>
              </div>

              <div className="input-group">
                <IonItem className="custom-item" lines="none">
                  <div className="label-float">Tuổi</div>
                  <IonInput
                    type="number"
                    placeholder="Ví dụ: 30"
                    value={age}
                    onIonChange={(e) => setAge(parseInt(e.detail.value!, 10))}
                  />
                </IonItem>

                <IonItem className="custom-item" lines="none">
                  <div className="label-float">Giới tính</div>
                  <IonSelect
                    placeholder="Chọn giới tính"
                    value={gender}
                    onIonChange={(e) => setGender(e.detail.value)}
                    interface="popover"
                  >
                    <IonSelectOption value="Male">Nam</IonSelectOption>
                    <IonSelectOption value="Female">Nữ</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem className="custom-item" lines="none">
                  <div className="label-float">Tiền sử bệnh</div>
                  <IonSelect
                    multiple={true}
                    placeholder="Chọn các bệnh đã từng mắc"
                    value={historyList}
                    onIonChange={(e) => setHistoryList(e.detail.value)}
                    interface="alert"
                  >
                    <IonSelectOption value="Diabetes">Tiểu đường</IonSelectOption>
                    <IonSelectOption value="Hypertension">Cao huyết áp</IonSelectOption>
                    <IonSelectOption value="HeartDisease">Bệnh tim mạch</IonSelectOption>
                    <IonSelectOption value="Asthma">Hen suyễn / Phổi</IonSelectOption>
                    <IonSelectOption value="Gastritis">Dạ dày / Tiêu hóa</IonSelectOption>
                    <IonSelectOption value="Arthritis">Xương khớp</IonSelectOption>
                    <IonSelectOption value="Headache">Đau đầu / Thần kinh</IonSelectOption>
                    <IonSelectOption value="Dermatitis">Da liễu / Dị ứng</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem className="custom-item" lines="none">
                  <div className="label-float">Triệu chứng hiện tại (khác)</div>
                  <IonTextarea
                    placeholder="Mô tả triệu chứng (VD: Đau bụng, mờ mắt...)"
                    value={symptom}
                    onIonChange={(e) => setSymptom(e.detail.value!)}
                    rows={3}
                  />
                </IonItem>
              </div>

              <IonButton
                expand="block"
                className="analyze-btn"
                onClick={handleConsult}
                disabled={loading}
              >
                {loading ? <IonSpinner name="crescent" /> : "🔍 PHÂN TÍCH NGAY"}
              </IonButton>
            </div>
          )}

          {/* RESULT CARD */}
          {result && (
            <div className="result-container">
              <div className="ai-header">
                <span className="brain-icon">🧠</span>
                <h2>AI Medical Recommendation</h2>
              </div>

              <IonCard className="recommendation-card">
                <IonCardContent>
                  {/* Chuyên khoa */}
                  <div className="result-group">
                    <div className="label">Chuyên khoa phù hợp</div>
                    <div className="value primary-text">{result.specialty}</div>
                  </div>

                  {/* Bác sĩ đề xuất */}
                  <div className="result-group">
                    <div className="label">
                      <IonIcon icon={personOutline} /> Bác sĩ đề xuất
                    </div>
                    {result.doctor ? (
                      <div className="doctor-info-box">
                        <div className="doc-name">
                           👨‍⚕️ BS. {result.doctor.fullName}
                        </div>
                        <div className="doc-detail">
                          {result.specialty} • {result.doctor.experience} năm kinh nghiệm
                        </div>
                        <div className="doc-hospital">
                          <IonIcon icon={businessOutline} /> {result.doctor.hospital || "Bệnh viện HealthHub"}
                        </div>
                      </div>
                    ) : (
                      <div className="no-doc">Chưa tìm thấy bác sĩ phù hợp</div>
                    )}
                  </div>

                  {/* Nút Đặt Khám */}
                  <IonButton
                    expand="block"
                    className="book-btn"
                    onClick={handleBook}
                  >
                    ĐẶT KHÁM
                  </IonButton>

                  <div className="divider"></div>

                  {/* Lý do AI */}
                  <div className="result-group">
                    <div className="label">
                      <IonIcon icon={bulbOutline} color="warning" /> Vì sao AI chọn bác sĩ này?
                    </div>
                    <p className="reason-text">{result.reasoning}</p>
                  </div>

                  {/* Gợi ý xét nghiệm */}
                  <div className="result-group">
                    <div className="label">
                      <IonIcon icon={flaskOutline} color="success" /> Gợi ý xét nghiệm
                    </div>
                    <ul className="test-list">
                      {result.tests.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Nhắc nhở */}
                  <div className="result-group">
                    <div className="label">
                      <IonIcon icon={alarmOutline} color="danger" /> Nhắc xét nghiệm / tái khám
                    </div>
                    <p className="reminder-text">{result.reminder}</p>
                  </div>
                </IonCardContent>
              </IonCard>

              {/* Nút Đóng */}
              <IonButton
                expand="block"
                className="close-btn"
                onClick={() => setResult(null)}
              >
                ĐÓNG
              </IonButton>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ScreeningPlan;
