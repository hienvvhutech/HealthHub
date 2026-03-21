//cspell:disable
import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "../../services/axiosInstance";
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonAlert,
  IonLabel,
  IonInput,
  IonItem,
  IonSpinner,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonRippleEffect,
} from "@ionic/react";
import {
  cardOutline,
  phonePortraitOutline,
  businessOutline,
  checkmarkCircleOutline,
  timeOutline,
  calendarOutline,
  personOutline,
  medicalOutline,
  walletOutline,
  alertCircleOutline,
} from "ionicons/icons";
import "./PaymentPage.css";

// ✅ Import Haptics & Notifications cho Mobile
import { Haptics } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

type Specialty = {
  id: number;
  name: string;
};

type Appointment = {
  id: number;
  fee: number;
  doctor: {
    fullName: string;
  };
  date: string;
  specialtyId?: number;
};

type MedicalRecord = {
  id: number;
  appointmentId: number;
  date: string;
  appointment?: Appointment;
};

const PaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(
    null
  );
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [method, setMethod] = useState("credit");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cardData, setCardData] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: "",
  });

  // Lấy danh sách chuyên khoa
  const fetchSpecialties = async () => {
    try {
      const res = await axios.get("/specialties");
      setSpecialties(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách chuyên khoa:", err);
      setErrorMessage("Không thể tải danh sách chuyên khoa. Vui lòng thử lại.");
    }
  };

  // Lấy dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const appointmentRes = await axios.get(
          `/appointments/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setAppointment(appointmentRes.data);

        try {
          const medicalRecordRes = await axios.get(
            `/medical-records/appointment/${id}`
          );
          setMedicalRecord(medicalRecordRes.data);
        } catch (err) {
          setMedicalRecord(null);
        }

        await fetchSpecialties();
      } catch (err) {
        console.error("Lỗi khi lấy thông tin lịch hẹn:", err);
        setErrorMessage("Không thể tải thông tin lịch hẹn. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrorMessage("");

    try {
      await axios.post("/payments", {
        appointmentId: id,
        amount: fee,
        paymentMethod: method,
      });

      // ✅ Mobile: Rung + Thông báo thành công
      if (Capacitor.isNativePlatform()) {
        await Haptics.vibrate();
        await LocalNotifications.schedule({
          notifications: [{
            title: "Thanh toán thành công! 💸",
            body: `Đã thanh toán ${fee.toLocaleString()}đ cho lịch khám với BS. ${appointment?.doctor?.fullName}.`,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 1000) },
          }]
        });
      }

      setTimeout(() => {
        setProcessing(false);
        setShowSuccessAlert(true);
      }, 2000);
    } catch (err) {
      console.error("Lỗi khi thanh toán:", err);
      setErrorMessage("Thanh toán thất bại. Vui lòng thử lại.");
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowSuccessAlert(false);
    history.push("/patient/book", { tab: "scheduled" });
  };

  const handleInputChange = (field: string, value: string) => {
    setCardData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar className="payment-header">
            <IonTitle>Thanh Toán</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="payment-content">
          <div className="loading-container">
            <div className="loading-animation">
              <IonSpinner name="crescent" className="loading-spinner" />
              <div className="loading-pulse"></div>
            </div>
            <p className="loading-text">Đang tải thông tin thanh toán...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!appointment) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar className="payment-header">
            <IonTitle>Lỗi</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="payment-content">
          <div className="error-container">
            <IonIcon icon={alertCircleOutline} className="error-icon" />
            <p className="error-text">Không thể tải thông tin lịch hẹn.</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const fee = appointment.fee || 200000;

  let specialtyName = "Chưa rõ";
  const specialtyId =
    medicalRecord?.appointment?.specialtyId ?? appointment.specialtyId;
  if (specialtyId) {
    const foundSpecialty = specialties.find(
      (specialty) => specialty.id === specialtyId
    );
    specialtyName =
      foundSpecialty?.name || "Chưa rõ";
  }

  let time = "Chưa rõ";
  if (medicalRecord?.date) {
    time = new Date(medicalRecord.date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (appointment.date) {
    time = new Date(appointment.date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const paymentMethods = [
    {
      id: "credit",
      name: "Thẻ tín dụng",
      icon: cardOutline,
      description: "Visa, Mastercard, JCB",
      color: "primary",
    },
    {
      id: "momo",
      name: "MoMo",
      icon: phonePortraitOutline,
      description: "Ví điện tử MoMo",
      color: "secondary",
    },
    {
      id: "bank",
      name: "Internet Banking",
      icon: businessOutline,
      description: "Chuyển khoản ngân hàng",
      color: "success",
    },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="payment-header">
          <IonTitle className="payment-title">
            <IonIcon icon={walletOutline} className="title-icon" />
            Thanh Toán Lịch Khám
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="payment-content">
        {errorMessage && (
          <div className="error-banner">
            <IonIcon icon={alertCircleOutline} className="error-banner-icon" />
            <span>{errorMessage}</span>
          </div>
        )}

        <IonGrid className="payment-grid">
          <IonRow>
            {/* Chi tiết đặt lịch */}
            <IonCol size="12" sizeMd="6">
              <IonCard className="appointment-card">
                <IonCardHeader className="appointment-header">
                  <IonCardTitle className="appointment-title">
                    <IonIcon
                      icon={checkmarkCircleOutline}
                      className="success-icon"
                    />
                    Chi Tiết Đặt Lịch
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent className="appointment-content">
                  <div className="appointment-details">
                    <div className="detail-item">
                      <IonIcon
                        icon={medicalOutline}
                        className="detail-icon specialty-icon"
                      />
                      <div className="detail-info">
                        <span className="detail-label">Chuyên khoa</span>
                        <span className="detail-value">{specialtyName}</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <IonIcon
                        icon={personOutline}
                        className="detail-icon doctor-icon"
                      />
                      <div className="detail-info">
                        <span className="detail-label">Bác sĩ</span>
                        <span className="detail-value">
                          {appointment.doctor?.fullName || "Không rõ"}
                        </span>
                      </div>
                    </div>

                    <div className="detail-row">
                      <div className="detail-item">
                        <IonIcon
                          icon={calendarOutline}
                          className="detail-icon date-icon"
                        />
                        <div className="detail-info">
                          <span className="detail-label">Ngày khám</span>
                          <span className="detail-value">
                            {new Date(appointment.date).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="detail-item">
                        <IonIcon
                          icon={timeOutline}
                          className="detail-icon time-icon"
                        />
                        <div className="detail-info">
                          <span className="detail-label">Giờ khám</span>
                          <span className="detail-value">{time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="fee-breakdown">
                    <div className="fee-item">
                      <span>Phí khám:</span>
                      <span>{fee.toLocaleString()} đ</span>
                    </div>
                    <div className="fee-total">
                      <span>Tổng cộng:</span>
                      <span>{fee.toLocaleString()} đ</span>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Phương thức thanh toán */}
            <IonCol size="12" sizeMd="6">
              <IonCard className="payment-card">
                <IonCardHeader className="payment-header-card">
                  <IonCardTitle className="payment-title-card">
                    <IonIcon icon={walletOutline} className="wallet-icon" />
                    Phương Thức Thanh Toán
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent className="payment-content-card">
                  <div className="payment-methods">
                    {paymentMethods.map((paymentMethod) => (
                      <div
                        key={paymentMethod.id}
                        className={`payment-method ${
                          method === paymentMethod.id ? "active" : ""
                        }`}
                        onClick={() => setMethod(paymentMethod.id)}
                      >
                        <IonRippleEffect></IonRippleEffect>
                        <div className="method-icon-container">
                          <IonIcon
                            icon={paymentMethod.icon}
                            className={`method-icon ${paymentMethod.color}`}
                          />
                        </div>
                        <div className="method-info">
                          <div className="method-name">
                            {paymentMethod.name}
                          </div>
                          <div className="method-description">
                            {paymentMethod.description}
                          </div>
                        </div>
                        {method === paymentMethod.id && (
                          <IonBadge className="active-badge">
                            <IonIcon icon={checkmarkCircleOutline} />
                          </IonBadge>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Form thanh toán */}
                  <div className="payment-form">
                    {method === "credit" && (
                      <div className="credit-form">
                        <IonItem className="form-item">
                          <IonLabel position="stacked" className="form-label">
                            Tên chủ thẻ
                          </IonLabel>
                          <IonInput
                            type="text"
                            placeholder="Nhập tên chủ thẻ"
                            className="form-input"
                            value={cardData.name}
                            onIonInput={(e) =>
                              handleInputChange("name", e.detail.value ?? "")
                            }
                            required
                          />
                        </IonItem>

                        <IonItem className="form-item">
                          <IonLabel position="stacked" className="form-label">
                            Số thẻ
                          </IonLabel>
                          <IonInput
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            className="form-input"
                            value={cardData.number}
                            onIonInput={(e) =>
                              handleInputChange("number", e.detail.value ?? "")
                            }
                            required
                          />
                        </IonItem>

                        <div className="form-row">
                          <IonItem className="form-item half">
                            <IonLabel position="stacked" className="form-label">
                              MM/YY
                            </IonLabel>
                            <IonInput
                              type="text"
                              placeholder="12/25"
                              className="form-input"
                              value={cardData.expiry}
                              onIonInput={(e) =>
                                handleInputChange(
                                  "expiry",
                                  e.detail.value ?? ""
                                )
                              }
                              required
                            />
                          </IonItem>
                          <IonItem className="form-item half">
                            <IonLabel position="stacked" className="form-label">
                              CVV
                            </IonLabel>
                            <IonInput
                              type="text"
                              placeholder="123"
                              className="form-input"
                              value={cardData.cvv}
                              onIonInput={(e) =>
                                handleInputChange("cvv", e.detail.value ?? "")
                              }
                              required
                            />
                          </IonItem>
                        </div>
                      </div>
                    )}

                    <IonButton
                      expand="block"
                      className="payment-button"
                      onClick={handlePayment}
                      disabled={processing}
                    >
                      <IonRippleEffect></IonRippleEffect>
                      {processing ? (
                        <>
                          <IonSpinner
                            name="crescent"
                            className="button-spinner"
                          />
                          Đang xử lý...
                        </>
                      ) : (
                        `Thanh toán ${fee.toLocaleString()} đ`
                      )}
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonAlert
          isOpen={showSuccessAlert}
          onDidDismiss={handlePaymentSuccess}
          cssClass="success-alert"
          header="✅ Thanh Toán Thành Công!"
          message="Cảm ơn bạn đã thanh toán. Lịch hẹn của bạn đã được xác nhận thành công."
          buttons={[
            {
              text: "Xác nhận",
              cssClass: "success-button",
              handler: handlePaymentSuccess,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default PaymentPage;
