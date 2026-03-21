import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
  IonAlert,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  const { register } = useAuth();
  const history = useHistory();

  const validateForm = (): boolean => {
    if (!email || !password || !confirmPassword || !fullName) {
      setError('Please fill in all fields');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      setShowAlert(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(email, password, fullName, role);
      history.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    history.push('/login');
  };

  return (
    <IonPage>
      <IonContent className="ion-padding auth-content">
        <div className="auth-container">
          <div className="auth-logo">
            <h1>HealthHub</h1>
            <p>Create your account</p>
          </div>

          <IonCard className="auth-card">
            <IonCardHeader>
              <IonCardTitle>Sign Up</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="auth-form">
                <IonInput
                  label="Full Name"
                  labelPlacement="stacked"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onIonChange={(e) => setFullName(e.detail.value || '')}
                  disabled={loading}
                />

                <IonInput
                  label="Email"
                  labelPlacement="stacked"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value || '')}
                  disabled={loading}
                />

                <IonSelect
                  label="I am a"
                  labelPlacement="stacked"
                  value={role}
                  onIonChange={(e) => setRole(e.detail.value)}
                  disabled={loading}
                >
                  <IonSelectOption value="patient">Patient</IonSelectOption>
                  <IonSelectOption value="doctor">Doctor</IonSelectOption>
                </IonSelect>

                <IonInput
                  label="Password"
                  labelPlacement="stacked"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value || '')}
                  disabled={loading}
                />

                <IonInput
                  label="Confirm Password"
                  labelPlacement="stacked"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onIonChange={(e) => setConfirmPassword(e.detail.value || '')}
                  disabled={loading}
                />

                <IonButton
                  expand="block"
                  onClick={handleRegister}
                  disabled={loading}
                  className="login-button"
                >
                  {loading ? <IonSpinner name="crescent" /> : 'Create Account'}
                </IonButton>

                <div className="auth-divider">
                  <span>Already have an account?</span>
                </div>

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleLoginClick}
                  disabled={loading}
                >
                  Sign In
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Registration Error"
          message={error}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default RegisterPage;
