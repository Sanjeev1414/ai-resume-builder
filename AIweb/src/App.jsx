import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import ProtectedLayout from './components/ProtectedLayout.jsx';
import Toast from './components/Toast.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import AnalysisPage from './pages/AnalysisPage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import CoverLetterPage from './pages/CoverLetterPage.jsx';
import InterviewPrepPage from './pages/InterviewPrepPage.jsx';
import JobTrackerPage from './pages/JobTrackerPage.jsx';
import ResumeBuilderPage from './pages/ResumeBuilderPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  const { user, checking } = useAuth();

  if (checking) {
    return <div className="center-screen"><span className="spinner spinner-large" aria-label="Loading" /></div>;
  }

  const publicOnly = (page) => (user ? <Navigate to="/dashboard" replace /> : page);

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />

        {/* Public pages - signed-in users are sent to the dashboard */}
        <Route path="/login" element={publicOnly(<AuthPage mode="login" />)} />
        <Route path="/register" element={publicOnly(<AuthPage mode="register" />)} />
        <Route path="/forgot-password" element={publicOnly(<ForgotPasswordPage />)} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Pages that need sign-in */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/analyses/:id" element={<AnalysisPage />} />
          <Route path="/cover-letter" element={<CoverLetterPage />} />
          <Route path="/interview-prep" element={<InterviewPrepPage />} />
          <Route path="/resume-builder" element={<ResumeBuilderPage />} />
          <Route path="/job-tracker" element={<JobTrackerPage />} />
          <Route path="/account/password" element={<ChangePasswordPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toast />
    </>
  );
}
