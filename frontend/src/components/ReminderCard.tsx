import React from "react";
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonToggle,
  IonButton,
} from "@ionic/react";
import {
  mailOutline,
  callOutline,
  notificationsOutline,
  calendarOutline,
  timeOutline,
} from "ionicons/icons";

interface ReminderCardProps {
  specialty: string;
  doctorName: string;
  date: string;
  time: string;
  location: string;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  specialty,
  doctorName,
  date,
  time,
  location,
}) => {
  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{specialty}</IonCardTitle>
        <p>Bác sĩ: {doctorName}</p>
      </IonCardHeader>
      <IonCardContent>
        <IonItem lines="none">
          <IonIcon icon={calendarOutline} slot="start" />
          <IonLabel>{date}</IonLabel>
          <IonIcon icon={timeOutline} slot="end" />
          <IonLabel>{time}</IonLabel>
        </IonItem>
        <p>{location}</p>

        <IonItem>
          <IonIcon icon={mailOutline} slot="start" />
          <IonLabel>Email</IonLabel>
          <IonToggle checked />
        </IonItem>
        <IonItem>
          <IonIcon icon={callOutline} slot="start" />
          <IonLabel>SMS</IonLabel>
          <IonToggle checked />
        </IonItem>
        <IonItem>
          <IonIcon icon={notificationsOutline} slot="start" />
          <IonLabel>Thông báo App</IonLabel>
          <IonToggle checked />
        </IonItem>

        <IonButton expand="block" color="medium" className="ion-margin-top">
          Đổi lịch hẹn
        </IonButton>
        <IonButton expand="block" color="primary">
          Xác nhận sẽ đến
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default ReminderCard;
