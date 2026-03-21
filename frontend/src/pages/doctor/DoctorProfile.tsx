import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonTextarea,
  IonItem,
  IonLabel,
  IonButton,
  IonToast,
  IonAvatar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonBackButton,
} from "@ionic/react";
import instance from "../../services/axiosInstance";

interface Specialty {
  id: number;
  name: string;
}

interface Doctor {
  id: number;
  fullName: string;
  email: string;
  specialtyId: number | null;
  hospital: string | null;
  experience: number | null;
  phone: string | null;
  languages: string | null;
  bio: string | null;
  dob?: string | null;
}

const DoctorProfile: React.FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const doctorRes = await instance.get("/doctors/me");
        setDoctor(doctorRes.data);

        const specialtiesRes = await instance.get("/specialties");
        setSpecialties(specialtiesRes.data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      }
    };

    fetchData();
  }, []);

  const handleChange = <T extends keyof Doctor>(e: Event, name: T) => {
    const customEvent = e as CustomEvent<{ value: Doctor[T] | undefined }>;
    const value = customEvent.detail?.value ?? null;
    if (!doctor) return;
    setDoctor({ ...doctor, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      if (!doctor || !doctor.id) return;

      const payload = {
        fullName: doctor.fullName?.trim(),
        email: doctor.email?.trim(),
        specialtyId: Number(doctor.specialtyId),
        hospital: doctor.hospital?.trim() || "",
        experience: doctor.experience ? Number(doctor.experience) : 0,
        phone: doctor.phone?.trim() || "",
        languages: doctor.languages?.trim() || "",
        bio: doctor.bio?.trim() || "",
        dob: doctor.dob,
      };

      await instance.put(`/doctors/${doctor.id}`, payload);
      const updated = await instance.get("/doctors/me");
      setDoctor(updated.data);
      setShowToast(true);
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật:", error);
      alert("Đã xảy ra lỗi khi cập nhật hồ sơ.");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  if (!doctor) return null;

  return (
    <IonPage>
      <IonButtons slot="start">
        <IonBackButton defaultHref="/doctoc" />
      </IonButtons>
      <IonHeader>
        <IonToolbar>
          <IonTitle>👤 Hồ sơ của tôi</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "300px" }}>
            <IonCard>
              <IonCardHeader>
                <IonAvatar style={{ width: 80, height: 80, margin: "auto" }}>
                  <div
                    style={{
                      backgroundColor: "#3b82f6",
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      fontWeight: "bold",
                    }}
                  >
                    {getInitials(doctor.fullName)}
                  </div>
                </IonAvatar>
                <IonCardTitle
                  className="rules-title"
                  color="{#333}"
                  style={{ textAlign: "center" }}
                >
                  {doctor.fullName || "Chưa có tên"}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  <strong>Email:</strong> {doctor.email}
                </p>
                <p>
                  <strong>Chuyên khoa:</strong>{" "}
                  {specialties.find((s) => s.id === doctor.specialtyId)?.name ||
                    "Chưa cập nhật"}
                </p>
                <p>
                  <strong>Bệnh viện:</strong>{" "}
                  {doctor.hospital || "Chưa cập nhật"}
                </p>
                <p>
                  <strong>Kinh nghiệm:</strong>{" "}
                  {doctor.experience ?? "Chưa cập nhật"} năm
                </p>
                <p>
                  <strong>SĐT:</strong> {doctor.phone || "Chưa cập nhật"}
                </p>
                <p>
                  <strong>Ngôn ngữ:</strong>{" "}
                  {doctor.languages || "Chưa cập nhật"}
                </p>
                <p>
                  <strong>Giới thiệu:</strong> {doctor.bio || "Chưa có mô tả"}
                </p>
              </IonCardContent>
            </IonCard>
          </div>

          <div style={{ flex: 1, minWidth: "300px" }}>
            <IonItem>
              <IonLabel position="stacked">Họ tên</IonLabel>
              <IonInput
                value={doctor.fullName}
                onIonChange={(e) => handleChange(e, "fullName")}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput value={doctor.email} disabled />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Chuyên khoa</IonLabel>
              <IonSelect
                value={doctor.specialtyId}
                placeholder="Chọn chuyên khoa"
                onIonChange={(e) => handleChange(e, "specialtyId")}
              >
                {specialties.map((s) => (
                  <IonSelectOption key={s.id} value={s.id}>
                    {s.name}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Bệnh viện</IonLabel>
              <IonInput
                value={doctor.hospital ?? ""}
                onIonChange={(e) => handleChange(e, "hospital")}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Kinh nghiệm (năm)</IonLabel>
              <IonInput
                type="number"
                value={doctor.experience ?? ""}
                onIonChange={(e) => handleChange(e, "experience")}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Số điện thoại</IonLabel>
              <IonInput
                value={doctor.phone ?? ""}
                onIonChange={(e) => handleChange(e, "phone")}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Ngôn ngữ</IonLabel>
              <IonSelect
                value={doctor.languages}
                onIonChange={(e) => handleChange(e, "languages")}
              >
                <IonSelectOption value="Việt">Việt</IonSelectOption>
                <IonSelectOption value="Anh">Anh</IonSelectOption>
                <IonSelectOption value="Pháp">Pháp</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Giới thiệu</IonLabel>
              <IonTextarea
                value={doctor.bio ?? ""}
                onIonChange={(e) => handleChange(e, "bio")}
              />
            </IonItem>

            <IonButton
              expand="block"
              className="ion-margin-top"
              onClick={handleSubmit}
            >
              Cập nhật hồ sơ
            </IonButton>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          message="Cập nhật thành công!"
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default DoctorProfile;
