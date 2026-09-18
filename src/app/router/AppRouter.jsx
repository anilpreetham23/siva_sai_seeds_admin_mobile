import { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { isNative } from '../../platform/index';

// Every route is code-split with React.lazy so a visitor only downloads the
// JS for the portal they actually use (the bundle was one 1.8MB+ chunk before
// this) — Vite splits each import() into its own chunk automatically.

// Public Pages
const LandingPage = lazy(() => import('../../pages/public/LandingPage'));
const MobileWelcomePage = lazy(() => import('../../pages/mobile/MobileWelcomePage'));
const MarketRatesPage = lazy(() => import('../../pages/public/MarketRatesPage'));
const SeedsCatalogPage = lazy(() => import('../../pages/public/SeedsCatalogPage'));
const HowItWorksPage = lazy(() => import('../../pages/public/HowItWorksPage'));
const FeaturesPage = lazy(() => import('../../pages/public/FeaturesPage'));

function HomeRoute() {
  const { user } = useAuth();

  if (user) {
    if (user.role === 'farmer') return <Navigate to="/farmer" replace />;
    if (user.role === 'manager' || user.role === 'super_admin') return <Navigate to="/manager/dashboard" replace />;
  }

  // On native Android/iOS APK: show the mobile welcome/login screen (NOT the web landing page)
  if (isNative) return <MobileWelcomePage />;

  return <LandingPage />;
}

// Auth Pages
const Login = lazy(() => import('../../pages/auth/Login'));
const Register = lazy(() => import('../../pages/auth/Register'));
const GetStarted = lazy(() => import('../../pages/auth/GetStarted'));
const ForgotPassword = lazy(() => import('../../pages/auth/ForgotPassword'));

// Farmer Pages
const FarmerLayout = lazy(() => import('../../layouts/FarmerLayout'));
const FarmerHome = lazy(() => import('../../pages/farmer/FarmerHome'));
const CropManagement = lazy(() => import('../../pages/farmer/CropManagement'));
const SeedPurchase = lazy(() => import('../../pages/farmer/SeedPurchase'));
const BookingSlot = lazy(() => import('../../pages/farmer/BookingSlot'));
const GrainSales = lazy(() => import('../../pages/farmer/GrainSales'));
const TransactionHistory = lazy(() => import('../../pages/farmer/TransactionHistory'));
const FarmerProfile = lazy(() => import('../../pages/farmer/Profile'));

// Admin Pages
const AdminLayout = lazy(() => import('../../layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('../../pages/admin/Dashboard'));
const FarmersDirectory = lazy(() => import('../../pages/admin/Farmers'));
const SeedsInventory = lazy(() => import('../../pages/admin/SeedsInventory'));
const WarehouseManagement = lazy(() => import('../../pages/admin/Warehouse'));
const AdminReports = lazy(() => import('../../pages/admin/Reports'));
const AdminBookingSlots = lazy(() => import('../../pages/admin/BookingSlots'));
const GrainProcurement = lazy(() => import('../../pages/admin/GrainProcurement'));
const FarmVisits = lazy(() => import('../../pages/admin/FarmVisits'));
const MarketRates = lazy(() => import('../../pages/admin/MarketRates'));
const GrainSalesAdmin = lazy(() => import('../../pages/admin/GrainSalesAdmin'));
const ManagerProfile = lazy(() => import('../../pages/admin/ManagerProfile'));
const EventLogs = lazy(() => import('../../pages/admin/EventLogs'));
const CreditsAdmin = lazy(() => import('../../pages/admin/CreditsAdmin'));
const CacheManagement = lazy(() => import('../../pages/admin/CacheManagement'));
const SeedPurchases = lazy(() => import('../../pages/admin/SeedPurchases'));
const Billing = lazy(() => import('../../pages/admin/Billing'));
const ContactMessages = lazy(() => import('../../pages/admin/ContactMessages'));

// Super Admin Pages
const SuperAdminLayout = lazy(() => import('../../layouts/SuperAdminLayout'));
const SuperAdminDashboard = lazy(() => import('../../pages/superadmin/Dashboard'));
const ManageAdmins = lazy(() => import('../../pages/superadmin/ManageAdmins'));
const AllFarmers = lazy(() => import('../../pages/superadmin/AllFarmers'));

const NotFound = lazy(() => import('../../pages/shared/NotFound'));

export default function AppRouter() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* ===== PUBLIC — visible to everyone ===== */}
        <Route path="/" element={<HomeRoute />} />
        <Route path="/market-rates" element={<MarketRatesPage />} />
        <Route path="/seeds-catalog" element={<SeedsCatalogPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Navigate to="/get-started" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ===== FARMER PORTAL (/farmer) ===== */}
        <Route path="/farmer" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerLayout /></ProtectedRoute>}>
          <Route index element={<FarmerHome />} />
          <Route path="crops" element={<CropManagement />} />
          <Route path="seeds" element={<SeedPurchase />} />
          <Route path="booking-slots" element={<BookingSlot />} />
          <Route path="transactions" element={<TransactionHistory />} />
          <Route path="profile" element={<FarmerProfile />} />
        </Route>

        {/* ===== MANAGER PORTAL (/manager) ===== */}

        <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={['manager', 'admin', 'super_admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="farmers" element={<FarmersDirectory />} />
          <Route path="seeds" element={<SeedsInventory />} />
          <Route path="seed-purchases" element={<SeedPurchases />} />
          <Route path="warehouse" element={<WarehouseManagement />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="booking-slots" element={<AdminBookingSlots />} />
          {/* procurement removed for manager */}
          <Route path="billing" element={<Billing />} />
          <Route path="visits" element={<FarmVisits />} />
          <Route path="market-rates" element={<MarketRates />} />
          <Route path="grain-sales" element={<ProtectedRoute allowedRoles={['manager', 'admin', 'super_admin']}><GrainSalesAdmin /></ProtectedRoute>} />
          <Route path="credits" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><CreditsAdmin /></ProtectedRoute>} />
          <Route path="event-logs" element={<ProtectedRoute allowedRoles={['super_admin']}><EventLogs /></ProtectedRoute>} />
          <Route path="cache" element={<ProtectedRoute allowedRoles={['super_admin']}><CacheManagement /></ProtectedRoute>} />
          <Route path="contact-messages" element={<ProtectedRoute allowedRoles={['manager', 'admin', 'super_admin']}><ContactMessages /></ProtectedRoute>} />
          <Route path="profile" element={<ManagerProfile />} />
        </Route>

        {/* ===== SUPER ADMIN PORTAL (/admin) ===== */}

        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminLayout /></ProtectedRoute>}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="managers" element={<ManageAdmins />} />
          <Route path="farmers" element={<AllFarmers />} />
          <Route path="credits" element={<CreditsAdmin />} />
          <Route path="profile" element={<ManagerProfile />} />

          {/* Operational portal embedded in SuperAdmin */}
          <Route path="op" element={<AdminDashboard />} />
          <Route path="op/farmers" element={<FarmersDirectory />} />
          <Route path="op/seeds" element={<SeedsInventory />} />
          <Route path="op/seed-purchases" element={<SeedPurchases />} />
          <Route path="op/warehouse" element={<WarehouseManagement />} />
          <Route path="op/reports" element={<AdminReports />} />
          <Route path="op/booking-slots" element={<AdminBookingSlots />} />
          <Route path="op/procurement" element={<GrainProcurement />} />
          <Route path="op/billing" element={<Billing />} />
          <Route path="op/visits" element={<FarmVisits />} />
          <Route path="op/market-rates" element={<MarketRates />} />
          <Route path="op/grain-sales" element={<GrainSalesAdmin />} />
          <Route path="op/credits" element={<CreditsAdmin />} />
          <Route path="op/event-logs" element={<EventLogs />} />
          <Route path="op/cache" element={<CacheManagement />} />
          <Route path="op/contact-messages" element={<ContactMessages />} />
          <Route path="cache" element={<CacheManagement />} />
          <Route path="op/profile" element={<ManagerProfile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
