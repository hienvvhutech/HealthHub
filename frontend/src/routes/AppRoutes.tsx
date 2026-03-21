import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

// Pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Home from "../pages/Home";

// Patient Pages
import HomePatient from "../pages/patient/HomePatient";
import Book from "../pages/patient/Book";
import FeedbackForm from "../pages/patient/FeedbackForm";
import FindDoctor from "../pages/patient/FindDoctor";
import History from "../pages/patient/History";
import Support from "../pages/patient/Support";
import Profile from "../pages/patient/Profile";
import AppointmentsPatient from "../pages/patient/AppointmentsPatient";
import HealthDashboard from "../pages/patient/health/HealthDashboard";
import PaymentPage from "../pages/patient/PaymentPage";
import ReExamReminder from "../pages/patient/ReExamReminder";
import ChatPagePatient from "../pages/patient/ChatPagePatient";
import ChatSessionsPatient from "../pages/patient/ChatSessionsPatient";
import ScreeningPlan from "../pages/patient/ScreeningPlan";
import NotificationPage from "../pages/patient/NotificationPage"; // ✅ NEW

// ✅ MOBILE SPECIFIC SCREEN
import PatientHomeScreen from "../mobile/screens/PatientHomeScreen";

// Doctor
import DoctorHome from "../pages/doctor/DoctorHome";
import DoctorAppointments from "../pages/doctor/DoctorAppointments";
import DoctorFeedbacks from "../pages/doctor/DoctorFeedbacks";
import DoctorProfile from "../pages/doctor/DoctorProfile";
import DoctorAppointmentDetail from "../pages/doctor/DoctorAppointmentDetail";
import DoctorMedicalRecords from "../pages/doctor/DoctorMedicalRecords";
import ChatPageDoctor from "../pages/doctor/ChatPageDoctor";
import ChatSessionsDoctor from "../pages/doctor/ChatSessionsDoctor";

// Admin
import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageUsers from "../pages/admin/ManageUsers";
import ManageDoctors from "../pages/admin/ManageDoctors";
import ManagePatients from "../pages/admin/ManagePatients";
import ManageAppointments from "../pages/admin/ManageAppointments";
import AdminFeedbacks from "../pages/admin/AdminFeedbacks";
import AdminSpecialties from "../pages/admin/AdminSpecialties";
import AdminSupport from "../pages/admin/AdminSupport";
import KPIDashboard from "../pages/admin/KPIDashboard";

// Route guard
import ProtectedRoute from "./ProtectedRoute";

const AppRoutes: React.FC = () => {
  const isNative = Capacitor.isNativePlatform();

  return (
    <Switch>
      {/* PUBLIC ROUTES */}
      <Route exact path="/home" component={Home} />
      
      <Route
        exact
        path="/"
        render={() => {
          if (isNative) {
            return <Redirect to="/login" />;
          }
          return <Redirect to="/home" />;
        }}
      />

      <Route exact path="/login" component={Login} />
      <Route exact path="/register" component={Register} />

      {/* PATIENT ROUTES - SPLIT BY PLATFORM */}
      <ProtectedRoute
        exact
        path="/patient/home"
        component={isNative ? PatientHomeScreen : HomePatient}
        requiredRole="patient"
      />

      <ProtectedRoute
        path="/patient/notifications"
        component={NotificationPage} // ✅ Route cho trang thông báo
        requiredRole="patient"
      />

      <ProtectedRoute
        path="/patient/screening"
        component={ScreeningPlan}
        requiredRole="patient"
      />

      <ProtectedRoute
        path="/patient/book"
        component={Book}
        requiredRole="patient"
      />
      <ProtectedRoute
        path="/patient/feedback"
        component={FeedbackForm}
        requiredRole="patient"
      />
      <ProtectedRoute
        path="/patient/find-doctor"
        component={FindDoctor}
        requiredRole="patient"
      />
      <ProtectedRoute
        path="/patient/history"
        component={History}
        requiredRole="patient"
      />
      <ProtectedRoute
        path="/patient/support"
        component={Support}
        requiredRole="patient"
      />
      <ProtectedRoute
        path="/patient/profile"
        component={Profile}
        requiredRole="patient"
      />
      <ProtectedRoute
        path="/patient/appointments"
        component={AppointmentsPatient}
        requiredRole="patient"
      />
      <ProtectedRoute
        path="/patient/health"
        component={HealthDashboard}
        requiredRole="patient"
      />
      <ProtectedRoute
        path="/patient/payment/:id"
        component={PaymentPage}
        requiredRole="patient"
      />
      <ProtectedRoute
        path="/patient/re-exam-reminder"
        component={ReExamReminder}
        requiredRole="patient"
      />
      <ProtectedRoute
        path="/patient/chat/:sessionId"
        component={ChatPagePatient}
        requiredRole="patient"
      />
      <ProtectedRoute
        path="/patient/chats"
        component={ChatSessionsPatient}
        requiredRole="patient"
      />

      {/* DOCTOR ROUTES */}
      <ProtectedRoute
        exact
        path="/doctor/home"
        component={DoctorHome}
        requiredRole="doctor"
      />
      <ProtectedRoute
        path="/doctor/appointments"
        component={DoctorAppointments}
        requiredRole="doctor"
      />
      <ProtectedRoute
        path="/doctor/feedbacks"
        component={DoctorFeedbacks}
        requiredRole="doctor"
      />
      <ProtectedRoute
        path="/doctor/profile"
        component={DoctorProfile}
        requiredRole="doctor"
      />
      <ProtectedRoute
        path="/doctor/appointment/:id"
        component={DoctorAppointmentDetail}
        requiredRole="doctor"
      />
      <ProtectedRoute
        path="/doctor/medical-records"
        component={DoctorMedicalRecords}
        requiredRole="doctor"
      />
      <ProtectedRoute
        path="/doctor/chat/:sessionId"
        component={ChatPageDoctor}
        requiredRole="doctor"
      />
      <ProtectedRoute
        path="/doctor/chats"
        component={ChatSessionsDoctor}
        requiredRole="doctor"
      />

      {/* ADMIN ROUTES */}
      <ProtectedRoute
        path="/admin/admin-dashboard"
        component={AdminDashboard}
        requiredRole="admin"
      />
      <ProtectedRoute
        path="/admin/kpi-dashboard"
        component={KPIDashboard}
        requiredRole="admin"
      />
      <ProtectedRoute
        path="/admin/manage-users"
        component={ManageUsers}
        requiredRole="admin"
      />
      <ProtectedRoute
        path="/admin/manage-doctors"
        component={ManageDoctors}
        requiredRole="admin"
      />
      <ProtectedRoute
        path="/admin/manage-patients"
        component={ManagePatients}
        requiredRole="admin"
      />
      <ProtectedRoute
        path="/admin/manage-appointments"
        component={ManageAppointments}
        requiredRole="admin"
      />
      <ProtectedRoute
        path="/admin/admin-feedbacks"
        component={AdminFeedbacks}
        requiredRole="admin"
      />
      <ProtectedRoute
        path="/admin/manage-specialties"
        component={AdminSpecialties}
        requiredRole="admin"
      />
      <ProtectedRoute
        path="/admin/support"
        component={AdminSupport}
        requiredRole="admin"
      />
      
      {/* FALLBACK */}
      <Route render={() => {
          if (isNative) {
            return <Redirect to="/login" />;
          }
          return <Redirect to="/home" />;
      }} />
    </Switch>
  );
};

export default AppRoutes;
