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
  IonGrid,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonAlert,
} from '@ionic/react';
import {
  logOut,
  medicalOutline,
  chatbubblesOutline,
  settingsOutline,
  addOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import appointmentService from '../services/appointment.service';
import healthDataService from '../services/healthData.service';
import { Appointment, HealthData } from '../types';
import '../styles/Dashboard.css';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const history = useHistory();
  const [segment, setSegment] = useState<'appointments' | 'health' | 'more'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (user?.role === 'patient' && user?.id) {
        const appts = await appointmentService.getAppointments(user.id);
        setAppointments(appts);

        const health = await healthDataService.getLatestHealthData(user.id);
        setHealthData(health);
      } else if (user?.role === 'doctor' && user?.id) {
        const appts = await appointmentService.getDoctorAppointments(user.id);
        setAppointments(appts);
      }
    } catch (error: any) {
      setAlertMessage(error.message || 'Failed to load dashboard data');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    history.push('/login');
  };

  const handleScheduleAppointment = () => {
    history.push('/schedule-appointment');
  };

  const handleViewAppointments = () => {
    history.push('/appointments');
  };

  const handleHealthData = () => {
    history.push('/health-data');
  };

  const handleChat = () => {
    history.push('/chat');
  };

  const handleSettings = () => {
    history.push('/settings');
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'pending' || apt.status === 'confirmed'
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>HealthHub Dashboard</IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            onClick={handleLogout}
            title="Logout"
          >
            <IonIcon icon={logOut} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h2>Welcome, {user?.email}!</h2>
          <p>Role: {user?.role?.toUpperCase()}</p>
        </div>

        {/* Segment Buttons */}
        <IonSegment
          value={segment}
          onIonChange={(e) => setSegment(e.detail.value as any)}
          className="dashboard-segment"
        >
          <IonSegmentButton value="appointments">
            <IonLabel>Appointments</IonLabel>
          </IonSegmentButton>
          {user?.role === 'patient' && (
            <IonSegmentButton value="health">
              <IonLabel>Health</IonLabel>
            </IonSegmentButton>
          )}
          <IonSegmentButton value="more">
            <IonLabel>More</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {loading ? (
          <div className="loading-container">
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <>
            {/* Appointments Section */}
            {segment === 'appointments' && (
              <div className="section-content">
                <div className="section-header">
                  <h3>Your Appointments</h3>
                  {user?.role === 'patient' && (
                    <IonButton
                      size="small"
                      onClick={handleScheduleAppointment}
                      fill="solid"
                    >
                      <IonIcon icon={addOutline} slot="start" />
                      Schedule
                    </IonButton>
                  )}
                </div>

                {upcomingAppointments.length > 0 ? (
                  <div className="appointments-list">
                    {upcomingAppointments.map((apt) => (
                      <IonCard key={apt.id} className="appointment-card">
                        <IonCardContent>
                          <div className="appointment-info">
                            <p className="appointment-doctor">
                              <strong>
                                {apt.doctorName || apt.patientName || 'Unknown'}
                              </strong>
                            </p>
                            <p className="appointment-date">
                              {new Date(apt.appointmentDate).toLocaleDateString()}
                              {' at '}
                              {apt.appointmentTime}
                            </p>
                            <p className="appointment-status">
                              Status: <span className={`status-${apt.status}`}>{apt.status}</span>
                            </p>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    ))}
                  </div>
                ) : (
                  <IonCard>
                    <IonCardContent>
                      <p className="empty-state">No upcoming appointments</p>
                    </IonCardContent>
                  </IonCard>
                )}

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleViewAppointments}
                  className="view-all-button"
                >
                  View All Appointments
                </IonButton>
              </div>
            )}

            {/* Health Data Section (Patient only) */}
            {segment === 'health' && user?.role === 'patient' && (
              <div className="section-content">
                <div className="section-header">
                  <h3>Health Data</h3>
                  <IonButton
                    size="small"
                    onClick={handleHealthData}
                    fill="solid"
                  >
                    <IonIcon icon={addOutline} slot="start" />
                    Add
                  </IonButton>
                </div>

                {healthData ? (
                  <IonCard className="health-card">
                    <IonCardContent>
                      <IonGrid>
                        <IonRow>
                          <IonCol size="6">
                            <div className="health-item">
                              <p>Blood Pressure</p>
                              <p className="health-value">{healthData.bloodPressure || 'N/A'}</p>
                            </div>
                          </IonCol>
                          <IonCol size="6">
                            <div className="health-item">
                              <p>Heart Rate</p>
                              <p className="health-value">{healthData.heartRate || 'N/A'} bpm</p>
                            </div>
                          </IonCol>
                        </IonRow>
                        <IonRow>
                          <IonCol size="6">
                            <div className="health-item">
                              <p>Weight</p>
                              <p className="health-value">{healthData.weight || 'N/A'} kg</p>
                            </div>
                          </IonCol>
                          <IonCol size="6">
                            <div className="health-item">
                              <p>Temperature</p>
                              <p className="health-value">{healthData.temperature || 'N/A'}°C</p>
                            </div>
                          </IonCol>
                        </IonRow>
                      </IonGrid>
                    </IonCardContent>
                  </IonCard>
                ) : (
                  <IonCard>
                    <IonCardContent>
                      <p className="empty-state">No health data recorded</p>
                    </IonCardContent>
                  </IonCard>
                )}
              </div>
            )}

            {/* More Section */}
            {segment === 'more' && (
              <div className="section-content">
                <div className="action-buttons">
                  <IonButton
                    expand="block"
                    className="action-button"
                    onClick={handleChat}
                  >
                    <IonIcon icon={chatbubblesOutline} slot="start" />
                    Chat with Doctor
                  </IonButton>

                  {user?.role === 'patient' && (
                    <IonButton
                      expand="block"
                      className="action-button"
                      onClick={handleHealthData}
                    >
                      <IonIcon icon={medicalOutline} slot="start" />
                      Health Records
                    </IonButton>
                  )}

                  <IonButton
                    expand="block"
                    className="action-button"
                    onClick={handleSettings}
                  >
                    <IonIcon icon={settingsOutline} slot="start" />
                    Settings
                  </IonButton>

                  <IonButton
                    expand="block"
                    color="danger"
                    className="action-button"
                    onClick={handleLogout}
                  >
                    <IonIcon icon={logOut} slot="start" />
                    Logout
                  </IonButton>
                </div>
              </div>
            )}
          </>
        )}

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Error"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default DashboardPage;
