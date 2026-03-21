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
  IonText,
  IonSpinner,
  IonAlert,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  const { login } = useAuth();
  const history = useHistory();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      setShowAlert(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      history.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    history.push('/register');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding auth-content">
        <div className="auth-container">
          <div className="auth-logo">
            <h1>HealthHub</h1>
            <p>Healthcare at your fingertips</p>
          </div>

          <IonCard className="auth-card">
            <IonCardHeader>
              <IonCardTitle>Sign In</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="auth-form">
                <IonInput
                  label="Email"
                  labelPlacement="stacked"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value || '')}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />

                <IonInput
                  label="Password"
                  labelPlacement="stacked"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value || '')}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />

                <IonButton
                  expand="block"
                  onClick={handleLogin}
                  disabled={loading || !email || !password}
                  className="login-button"
                >
                  {loading ? <IonSpinner name="crescent" /> : 'Sign In'}
                </IonButton>

                <div className="auth-divider">
                  <span>Don't have an account?</span>
                </div>

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleRegisterClick}
                  disabled={loading}
                >
                  Create Account
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Login Error"
          message={error}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
