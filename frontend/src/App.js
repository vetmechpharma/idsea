import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import MembersPage from './pages/public/MembersPage';
import EventsPage from './pages/public/EventsPage';
import PublicationsPage from './pages/public/PublicationsPage';
import GalleryPage from './pages/public/GalleryPage';
import ContactPage from './pages/public/ContactPage';
import MembershipApplyPage from './pages/public/MembershipApplyPage';
import EventRegistrationPage from './pages/public/EventRegistrationPage';
import ECMembersPage from './pages/public/ECMembersPage';
import EventDetailPage from './pages/public/EventDetailPage';
import CertificateVerifyPage from './pages/public/CertificateVerifyPage';
import CustomScripts from './components/CustomScripts';

import LoginPage from './pages/admin/LoginPage';
import AdminLayout from './components/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import MembersAdmin from './pages/admin/MembersAdmin';
import PaymentsAdmin from './pages/admin/PaymentsAdmin';
import EventsAdmin from './pages/admin/EventsAdmin';
import NewsAdmin from './pages/admin/NewsAdmin';
import GalleryAdmin from './pages/admin/GalleryAdmin';
import PublicationsAdmin from './pages/admin/PublicationsAdmin';
import EmailAdmin from './pages/admin/EmailAdmin';
import EmailTemplatesAdmin from './pages/admin/EmailTemplatesAdmin';
import ExecutiveAdmin from './pages/admin/ExecutiveAdmin';
import CertificatesAdmin from './pages/admin/CertificatesAdmin';
import ReportsAdmin from './pages/admin/ReportsAdmin';
import CMSAdmin from './pages/admin/CMSAdmin';
import RolesAdmin from './pages/admin/RolesAdmin';
import SliderAdmin from './pages/admin/SliderAdmin';
import EventRegistrations from './pages/admin/EventRegistrations';
import PaymentSettings from './pages/admin/PaymentSettings';
import WhatsappAdmin from './pages/admin/WhatsappAdmin';
import MembershipAdmin from './pages/admin/MembershipAdmin';
import CertificateDesigner from './pages/admin/CertificateDesigner';
import EventDetailEditor from './pages/admin/EventDetailEditor';
import BackupAdmin from './pages/admin/BackupAdmin';

const ProtectedRoute = ({ children }) => {
  const { admin } = useAuth();
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
};

function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <BrowserRouter>
        <CustomScripts />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/publications" element={<PublicationsPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/apply" element={<MembershipApplyPage />} />
          <Route path="/ec-members" element={<ECMembersPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/verify" element={<CertificateVerifyPage />} />
          <Route path="/events/:eventId/register" element={<EventRegistrationPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="members" element={<MembersAdmin />} />
            <Route path="payments" element={<PaymentsAdmin />} />
            <Route path="events" element={<EventsAdmin />} />
            <Route path="events/:eventId/registrations" element={<EventRegistrations />} />
            <Route path="events/:eventId/details" element={<EventDetailEditor />} />
            <Route path="news" element={<NewsAdmin />} />
            <Route path="gallery" element={<GalleryAdmin />} />
            <Route path="publications" element={<PublicationsAdmin />} />
            <Route path="email" element={<EmailAdmin />} />
            <Route path="email-templates" element={<EmailTemplatesAdmin />} />
            <Route path="executive" element={<ExecutiveAdmin />} />
            <Route path="certificates" element={<CertificatesAdmin />} />
            <Route path="certificates/design/:id" element={<CertificateDesigner />} />
            <Route path="reports" element={<ReportsAdmin />} />
            <Route path="cms" element={<CMSAdmin />} />
            <Route path="sliders" element={<SliderAdmin />} />
            <Route path="payment-settings" element={<PaymentSettings />} />
            <Route path="whatsapp" element={<WhatsappAdmin />} />
            <Route path="membership-plans" element={<MembershipAdmin />} />
            <Route path="backup" element={<BackupAdmin />} />
            <Route path="roles" element={<RolesAdmin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
