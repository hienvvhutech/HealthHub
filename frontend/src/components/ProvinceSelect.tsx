import React from "react";
import { IonItem, IonLabel, IonSelect, IonSelectOption } from "@ionic/react";
import provinces from "../data/provinces.json";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const ProvinceSelect: React.FC<Props> = ({ value, onChange }) => {
  return (
    <IonItem>
      <IonLabel position="stacked">Tỉnh / Thành phố</IonLabel>
      <IonSelect
        value={value}
        placeholder="Chọn tỉnh / thành phố"
        onIonChange={(e) => onChange(e.detail.value)}
      >
        {provinces.map((p) => (
          <IonSelectOption key={p} value={p}>
            {p}
          </IonSelectOption>
        ))}
      </IonSelect>
    </IonItem>
  );
};

export default ProvinceSelect;
