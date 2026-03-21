import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonCard,
  IonCardContent,
  IonButton,
  IonList,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonChip,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { personOutline, medkitOutline, businessOutline, languageOutline, timeOutline, cashOutline } from "ionicons/icons";
import axios from "../../services/axiosInstance";
import "./FindDoctor.css";

document.body.classList.remove("dark");

interface Doctor {
  id: number;
  fullName: string;
  specialty?: {
    id: number;
    name: string;
  };
  hospital: string;
  experience: number;
  rating: number;
  price?: number;
  available: number;
  languages: string;
  verified: boolean;
}

const FindDoctor = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();

  const token = localStorage.getItem("token");

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/doctors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Lỗi tải danh sách bác sĩ:", error);
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const getFilteredDoctors = () => {
    const query = searchQuery.toLowerCase();
    return doctors.filter((doc) => {
      const name = doc.fullName?.toLowerCase() || "";
      const spec = doc.specialty?.name?.toLowerCase() || "";
      const hosp = doc.hospital?.toLowerCase() || "";

      return (
        name.includes(query) || spec.includes(query) || hosp.includes(query)
      );
    });
  };

  return (
    <IonPage className="find-doctor-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/patient/home" />
          </IonButtons>
          <IonTitle>Tìm kiếm bác sĩ</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding bg-light">
        <IonGrid>
          <IonRow>
            {/* Search Bar Full Width */}
            <IonCol size="12">
              <IonSearchbar
                placeholder="Nhập tên bác sĩ, chuyên khoa..."
                value={searchQuery}
                onIonInput={(e) => setSearchQuery(e.detail.value ?? "")}
                className="custom-searchbar"
              />
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12">
              {isLoading ? (
                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                  <IonSpinner name="crescent" />
                </div>
              ) : (
                <div className="doctor-list">
                  {getFilteredDoctors().length > 0 ? (
                    getFilteredDoctors().map((d) => (
                      <IonCard key={d.id} className="doctor-card-modern">
                        <IonCardContent>
                          <div className="doctor-card-layout">
                            {/* Avatar */}
                            <div className="doctor-avatar-col">
                              <div className="doctor-avatar">
                                <IonIcon icon={personOutline} />
                              </div>
                            </div>

                            {/* Info */}
                            <div className="doctor-info-col">
                              <h2 className="doctor-name">BS. {d.fullName}</h2>
                              <div className="doctor-tags">
                                <IonChip color="primary" outline>
                                  <IonIcon icon={medkitOutline} />
                                  {d.specialty?.name || "Đa khoa"}
                                </IonChip>
                                <IonChip color="success" outline>
                                  <IonIcon icon={timeOutline} />
                                  {d.experience} năm KN
                                </IonChip>
                              </div>
                              
                              <div className="doctor-details">
                                <p><IonIcon icon={businessOutline} /> {d.hospital}</p>
                                <p><IonIcon icon={languageOutline} /> {d.languages || "Tiếng Việt"}</p>
                                <p className="price"><IonIcon icon={cashOutline} /> {d.price ? d.price.toLocaleString() : "200,000"} đ</p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="doctor-actions-col">
                              <IonButton
                                className="btn-action"
                                onClick={() =>
                                  history.push("/patient/book", { 
                                      doctorId: d.id,
                                      specialtyName: d.specialty?.name || "Đa khoa" // Handle null specialty
                                  })
                                }
                              >
                                Đặt lịch
                              </IonButton>
                              <IonButton
                                className="btn-action"
                                fill="outline"
                                onClick={async () => {
                                  try {
                                    const res = await axios.post("/chat/session", { doctorId: d.id }, { headers: { Authorization: `Bearer ${token}` } });
                                    history.push(`/patient/chat/${res.data.id}`);
                                  } catch (e) { console.error(e); }
                                }}
                              >
                                Tư vấn
                              </IonButton>
                            </div>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>Không tìm thấy bác sĩ nào phù hợp.</p>
                    </div>
                  )}
                </div>
              )}
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default FindDoctor;
