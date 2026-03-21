import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonAlert,
  IonInput,
  IonDatetime,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import appointmentService from '../services/appointment.service';
import userService from '../services/user.service';
import { Doctor, Appointment } from '../types';
import '../styles/Form.css';

const ScheduleAppointmentPage: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('error');

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const doctorsList = await userService.getDoctors();
      setDoctors(doctorsList);
    } catch (error: any) {
      setAlertMessage(error.message || 'Failed to load doctors');
      setAlertType('error');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!selectedDoctor) {
      setAlertMessage('Please select a doctor');
      return false;
    }
    if (!appointmentDate) {
      setAlertMessage('Please select an appointment date');
      return false;
    }
    if (!appointmentTime) {
      setAlertMessage('Please select an appointment time');
      return false;
    }
    if (!reason) {
      setAlertMessage('Please enter the reason for appointment');
      return false;
    }
    return true;
  };

  const handleScheduleAppointment = async () => {
    if (!validateForm()) {
      setShowAlert(true);
      return;
    }

    setSubmitting(true);
    try {
      const appointmentData: Partial<Appointment> = {
        doctorId: selectedDoctor || 0,
        patientId: user?.id || 0,
        appointmentDate,
        appointmentTime,
        reason,
        notes,
        status: 'pending' as any,
      };

      await appointmentService.createAppointment(appointmentData);
      setAlertMessage('Appointment scheduled successfully!');
      setAlertType('success');
      setShowAlert(true);

      setTimeout(() => {
        history.push('/appointments');
      }, 1500);
    } catch (error: any) {
      setAlertMessage(error.response?.data?.message || 'Failed to schedule appointment');
      setAlertType('error');
      setShowAlert(true);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctorInfo = doctors.find((d) => d.id === selectedDoctor);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton slot="start" fill="clear" onClick={() => history.goBack()}>
            <IonIcon slot="icon-only" icon={arrowBack} />
          </IonButton>
          <IonTitle>Schedule Appointment</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding form-content">
        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <>
            <IonCard className="form-card">
              <IonCardHeader>
                <IonCardTitle>Select a Doctor</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonSelect
                  label="Doctor"
                  labelPlacement="stacked"
                  placeholder="Choose a doctor"
                  value={selectedDoctor}
                  onIonChange={(e) => setSelectedDoctor(e.detail.value)}
                >
                  {doctors.map((doctor) => (
                    <IonSelectOption key={doctor.id} value={doctor.id}>
                      {doctor.fullName} ({doctor.department || 'General'})
                    </IonSelectOption>
                  ))}
                </IonSelect>

                {selectedDoctorInfo && (
                  <IonCard className="doctor-info-card">
                    <IonCardContent>
                      <p>
                        <strong>Name:</strong> {selectedDoctorInfo.fullName}
                      </p>
                      {selectedDoctorInfo.department && (
                        <p>
                          <strong>Department:</strong> {selectedDoctorInfo.department}
                        </p>
                      )}
                      {selectedDoctorInfo.experience && (
                        <p>
                          <strong>Experience:</strong> {selectedDoctorInfo.experience} years
                        </p>
                      )}
                      {selectedDoctorInfo.bio && (
                        <p>
                          <strong>Bio:</strong> {selectedDoctorInfo.bio}
                        </p>
                      )}
                    </IonCardContent>
                  </IonCard>
                )}
              </IonCardContent>
            </IonCard>

            <IonCard className="form-card">
              <IonCardHeader>
                <IonCardTitle>Appointment Details</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonInput
                  label="Reason for Visit"
                  labelPlacement="stacked"
                  placeholder="E.g., Regular checkup, Consultation, etc."
                  value={reason}
                  onIonChange={(e) => setReason(e.detail.value || '')}
                  disabled={submitting}
                />

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500' }}>Appointment Date</label>
                  <IonDatetime
                    value={appointmentDate}
                    onIonChange={(e) => {
                      const val = e.detail.value;
                      setAppointmentDate(Array.isArray(val) ? val[0] : val || '');
                    }}
                    presentation="date"
                    disabled={submitting}
                  />
                </div>

                <IonInput
                  label="Appointment Time"
                  labelPlacement="stacked"
                  type="time"
                  value={appointmentTime}
                  onIonChange={(e) => setAppointmentTime(e.detail.value as string || '')}
                  disabled={submitting}
                />

                <IonInput
                  label="Additional Notes"
                  labelPlacement="stacked"
                  placeholder="Any additional information for the doctor..."
                  value={notes}
                  onIonChange={(e) => setNotes(e.detail.value || '')}
                  disabled={submitting}
                />

                <IonButton
                  expand="block"
                  onClick={handleScheduleAppointment}
                  disabled={submitting || !selectedDoctor}
                  className="submit-button"
                >
                  {submitting ? <IonSpinner name="crescent" /> : 'Schedule Appointment'}
                </IonButton>
              </IonCardContent>
            </IonCard>
          </>
        )}

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={alertType === 'success' ? 'Success' : 'Error'}
          message={alertMessage}
          buttons={['OK']}
          color={alertType === 'success' ? 'success' : 'danger'}
        />
      </IonContent>
    </IonPage>
  );
};

export default ScheduleAppointmentPage;
