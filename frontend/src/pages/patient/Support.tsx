import React from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/react";

const Support: React.FC = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Hỗ trợ</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent className="ion-padding">
      {/* Hỗ trợ kỹ thuật hoặc trợ giúp */}
      <p>Gửi yêu cầu hỗ trợ.</p>
    </IonContent>
  </IonPage>
);

export default Support;
