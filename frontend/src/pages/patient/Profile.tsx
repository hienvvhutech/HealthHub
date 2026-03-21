import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonDatetime,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonToast,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonBackButton,
} from "@ionic/react";
import axios from "../../services/axiosInstance";
import provinces from "../../data/provinces.json";
import "./Profile.css";
// Tạo avatar từ tên
const getInitialAvatar = (name: string) => {
  const initials = name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff&size=100`;
};

const Profile: React.FC = () => {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    province: "",
    district: "",
    ward: "",
    houseNumber: "",
    address: "",
    avatarUrl: "",
  });

  const [health, setHealth] = useState({
    height: "",
    weight: "",
    bloodType: "",
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const fetchProfile = async () => {
    try {
      const id = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Không có token");

      // ✅ Use relative path
      const res = await axios.get(`/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const patient = res.data;
      const [houseNumber, ward, district, province] =
        patient.address?.split(",").map((s: string) => s.trim()) || [];

      setProfile({
        ...patient,
        province: province ?? "",
        district: district ?? "",
        ward: ward ?? "",
        houseNumber: houseNumber ?? "",
        gender: patient.gender ?? "",
        avatarUrl: patient.avatarUrl ?? "",
      });

      setHealth({
        height: patient.height || "",
        weight: patient.weight || "",
        bloodType: patient.bloodType || "",
      });
    } catch (err) {
      console.error("❌ Lỗi lấy hồ sơ:", err);
      setToastMsg("Không thể tải hồ sơ. Vui lòng đăng nhập lại.");
      setShowToast(true);
    }
  };

  const handleUpdate = async () => {
    try {
      const id = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Không có token");

      const fullAddress = `${profile.houseNumber}, ${profile.ward}, ${profile.district}, ${profile.province}`;

      // ✅ Use relative path
      await axios.put(
        `/patients/${id}`,
        {
          ...profile,
          address: fullAddress,
          ...health,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchProfile();
      setToastMsg("Cập nhật hồ sơ thành công!");
      setShowToast(true);
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err);
      setToastMsg("Cập nhật thất bại!");
      setShowToast(true);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <IonPage>
      <IonButtons slot="start">
        <IonBackButton defaultHref="/patient/home" />
      </IonButtons>
      <IonContent className="ion-padding profile-page">
        <h2 className="profile-title">👤 Hồ Sơ Y Tế Cá Nhân</h2>
        <IonGrid className="profile-grid">
          <IonRow>
            {/* Hồ sơ trái */}
            <IonCol sizeMd="4" sizeSm="12">
              <IonCard className="profile-card-left">
                <IonCardContent className="profile-avatar-section">
                  <img
                    src={
                      profile.avatarUrl ||
                      getInitialAvatar(profile.fullName || "User")
                    }
                    alt="avatar"
                    className="profile-avatar"
                  />
                  <div className="profile-name">{profile.fullName}</div>
                  <div className="profile-role">Bệnh nhân</div>
                  <div className="profile-info-quick">
                    <div>
                      <b>Ngày sinh:</b> {profile.dob?.split("T")[0]}
                    </div>
                    <div>
                      <b>Giới tính:</b> {profile.gender || "Chưa chọn"}
                    </div>
                    <div>
                      <b>Email:</b> {profile.email}
                    </div>
                    <div>
                      <b>SĐT:</b> {profile.phone}
                    </div>
                    <div>
                      <b>Địa chỉ:</b> {profile.houseNumber}, {profile.ward},{" "}
                      {profile.district}, {profile.province}
                    </div>
                  </div>
                  <div className="profile-health-title">📈 Chỉ Số Sức Khoẻ</div>
                  <div className="profile-health-stats">
                    <div>
                      <b>Chiều cao:</b> {health.height} cm
                    </div>
                    <div>
                      <b>Cân nặng:</b> {health.weight} kg
                    </div>
                    <div>
                      <b>Nhóm máu:</b> {health.bloodType}
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Form phải */}
            <IonCol sizeMd="8" sizeSm="12">
              <IonCard className="profile-card-form">
                <IonCardHeader>
                  <IonCardTitle>Chỉnh Sửa Thông Tin Cá Nhân</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="profile-form-grid">
                    <IonItem>
                      <IonLabel position="stacked">Họ tên</IonLabel>
                      <IonInput
                        value={profile.fullName}
                        onIonChange={(e) =>
                          setProfile({
                            ...profile,
                            fullName: e.detail.value ?? "",
                          })
                        }
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Email</IonLabel>
                      <IonInput value={profile.email} readonly />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Số điện thoại</IonLabel>
                      <IonInput
                        value={profile.phone}
                        onIonChange={(e) =>
                          setProfile({
                            ...profile,
                            phone: e.detail.value ?? "",
                          })
                        }
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Ngày sinh</IonLabel>
                      <IonDatetime
                        presentation="date"
                        value={profile.dob}
                        onIonChange={(e) => {
                          const value = e.detail.value;
                          setProfile({
                            ...profile,
                            dob: Array.isArray(value)
                              ? value[0] ?? ""
                              : value ?? "",
                          });
                        }}
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Giới tính</IonLabel>
                      <IonSelect
                        value={profile.gender}
                        placeholder="Chọn giới tính"
                        onIonChange={(e) =>
                          setProfile({ ...profile, gender: e.detail.value })
                        }
                      >
                        <IonSelectOption value="Nam">Nam</IonSelectOption>
                        <IonSelectOption value="Nữ">Nữ</IonSelectOption>
                        <IonSelectOption value="Khác">Khác</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Số nhà / Đường</IonLabel>
                      <IonInput
                        value={profile.houseNumber}
                        onIonChange={(e) =>
                          setProfile({
                            ...profile,
                            houseNumber: e.detail.value ?? "",
                          })
                        }
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Phường / Xã</IonLabel>
                      <IonInput
                        value={profile.ward}
                        onIonChange={(e) =>
                          setProfile({ ...profile, ward: e.detail.value ?? "" })
                        }
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Quận / Huyện</IonLabel>
                      <IonInput
                        value={profile.district}
                        onIonChange={(e) =>
                          setProfile({
                            ...profile,
                            district: e.detail.value ?? "",
                          })
                        }
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Tỉnh / Thành phố</IonLabel>
                      <IonSelect
                        value={profile.province}
                        placeholder="Chọn tỉnh"
                        onIonChange={(e) =>
                          setProfile({ ...profile, province: e.detail.value })
                        }
                      >
                        {provinces.map((p: string) => (
                          <IonSelectOption key={p} value={p}>
                            {p}
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Chiều cao (cm)</IonLabel>
                      <IonInput
                        value={health.height}
                        onIonChange={(e) =>
                          setHealth({ ...health, height: e.detail.value ?? "" })
                        }
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Cân nặng (kg)</IonLabel>
                      <IonInput
                        value={health.weight}
                        onIonChange={(e) =>
                          setHealth({ ...health, weight: e.detail.value ?? "" })
                        }
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Nhóm máu</IonLabel>
                      <IonSelect
                        value={health.bloodType}
                        placeholder="Chọn nhóm máu"
                        onIonChange={(e) =>
                          setHealth({ ...health, bloodType: e.detail.value })
                        }
                      >
                        <IonSelectOption value="A">A</IonSelectOption>
                        <IonSelectOption value="B">B</IonSelectOption>
                        <IonSelectOption value="AB">AB</IonSelectOption>
                        <IonSelectOption value="O">O</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                  </div>
                  <IonButton
                    className="profile-update-btn center-btn"
                    onClick={handleUpdate}
                  >
                    CẬP NHẬT THÔNG TIN
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonToast
          isOpen={showToast}
          message={toastMsg}
          duration={1500}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
