import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, UserCheck, LogOut, Menu, X, Globe, Crown, DollarSign,
  Package, Warehouse, Calendar, MapPin, BarChart2, TrendingUp, Wheat, FileText, User, ShoppingBag, Database
} from 'lucide-react';
import NotificationCenter from '../components/shared/NotificationCenter';
import { BRAND_NAME } from '../utils/brandLogo';
import { MobileHeader, MobileBottomNav, MobileDrawer } from '../components/mobile';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
];

export default function SuperAdminLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Default open on desktop, closed on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) return false;
    return true;
  });
  const [showLang, setShowLang] = useState(false);

  const superAdminTabs = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={19} />, label: 'Super Admin', end: true },
    { to: '/admin/dashboard/farmers', icon: <Users size={19} />, label: 'Farmers' },
    { to: '/admin/dashboard/op/seed-purchases', icon: <ShoppingBag size={19} />, label: 'Orders' },
    { to: '/admin/dashboard/op/booking-slots', icon: <Calendar size={19} />, label: 'Slots' },
    { to: '/admin/dashboard/profile', icon: <User size={19} />, label: 'Profile' },
  ];

  const superAdminDrawerGroups = [
    {
      label: 'Super Admin Controls',
      items: [
        { to: '/admin/dashboard', icon: <LayoutDashboard size={17} />, label: 'Executive Dashboard', end: true },
        { to: '/admin/dashboard/managers', icon: <UserCheck size={17} />, label: 'Manage Managers' },
        { to: '/admin/dashboard/farmers', icon: <Users size={17} />, label: 'All Registered Farmers' },
        { to: '/admin/dashboard/credits', icon: <DollarSign size={17} />, label: 'Credit Ledgers' },
        { to: '/admin/dashboard/cache', icon: <Database size={17} />, label: 'System Cache' },
      ],
    },
    {
      label: 'Operational Management',
      items: [
        { to: '/admin/dashboard/op', icon: <LayoutDashboard size={17} />, label: 'Operations Dashboard', end: true },
        { to: '/admin/dashboard/op/seed-purchases', icon: <ShoppingBag size={17} />, label: 'Seed Purchases' },
        { to: '/admin/dashboard/op/seeds', icon: <Package size={17} />, label: 'Seeds Inventory' },
        { to: '/admin/dashboard/op/warehouse', icon: <Warehouse size={17} />, label: 'Warehouse Capacity' },
        { to: '/admin/dashboard/op/booking-slots', icon: <Calendar size={17} />, label: 'Booking Slots' },
        { to: '/admin/dashboard/op/billing', icon: <DollarSign size={17} />, label: 'Billing & Invoices' },
        { to: '/admin/dashboard/op/visits', icon: <MapPin size={17} />, label: 'Farm Field Visits' },
        { to: '/admin/dashboard/op/market-rates', icon: <TrendingUp size={17} />, label: 'Market Mandi Rates' },
        { to: '/admin/dashboard/op/grain-sales', icon: <Wheat size={17} />, label: 'Grain Sales' },
      ],
    },
    {
      label: 'System & Profile',
      items: [
        { to: '/admin/dashboard/profile', icon: <User size={17} />, label: 'Super Admin Profile' },
      ],
    },
  ];

  const navItems = [
    // Super Admin Section
    { type: 'header', label: t('super_admin_portal') || 'Super Admin' },
    { to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: t('dashboard'), end: true },
    { to: '/admin/dashboard/managers', icon: <UserCheck size={18} />, label: t('manage_admins') },
    { to: '/admin/dashboard/farmers', icon: <Users size={18} />, label: t('all_farmers') || 'All Farmers' },
    { to: '/admin/dashboard/credits', icon: <DollarSign size={18} />, label: t('credits') || 'Credits' },
    { to: '/admin/dashboard/cache', icon: <Database size={18} />, label: t('cache_management', 'Cache Management') },

    // Settings Section
    { type: 'header', label: t('settings') || 'Settings' },
    { to: '/admin/dashboard/profile', icon: <User size={18} />, label: t('profile_settings', 'Profile Settings') },

    // Operational Section
    { type: 'header', label: t('operational_portal') || 'Operational Portal' },
    { to: '/admin/dashboard/op', icon: <LayoutDashboard size={18} />, label: t('op_dashboard') || 'Op. Dashboard', end: true },
    { to: '/admin/dashboard/op/farmers', icon: <Users size={18} />, label: t('farmers') },
    { to: '/admin/dashboard/op/seeds', icon: <Package size={18} />, label: t('seeds_inventory') },
    { to: '/admin/dashboard/op/seed-purchases', icon: <ShoppingBag size={18} />, label: t('seed_purchases') || 'Seed Purchases' },
    { to: '/admin/dashboard/op/warehouse', icon: <Warehouse size={18} />, label: t('warehouse') },
    { to: '/admin/dashboard/op/booking-slots', icon: <Calendar size={18} />, label: t('booking_slot') },
    { to: '/admin/dashboard/op/billing', icon: <DollarSign size={18} />, label: t('billing_invoices', 'Billing & Invoices') },
    { to: '/admin/dashboard/op/visits', icon: <MapPin size={18} />, label: t('farm_visits') },
    { to: '/admin/dashboard/op/reports', icon: <BarChart2 size={18} />, label: t('reports') },
    { to: '/admin/dashboard/op/market-rates', icon: <TrendingUp size={18} />, label: t('market_rates') },
    { to: '/admin/dashboard/op/grain-sales', icon: <Wheat size={18} />, label: t('grain_sales') },
    { to: '/admin/dashboard/op/event-logs', icon: <FileText size={18} />, label: t('event_logs') },
  ];

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [location.pathname]);

  const changeLang = (code) => { i18n.changeLanguage(code); localStorage.setItem('agro_lang', code); setShowLang(false); };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%)' }}>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar
          Desktop only → relative flex element. Mobile → fixed drawer */}
      <aside className={`
        flex flex-col fixed md:relative z-50 md:z-auto h-full flex-shrink-0 overflow-hidden transition-all duration-300
        ${sidebarOpen ? 'w-64' : 'w-0'}
      `}>
        <div className="w-64 h-full bg-gradient-to-b from-primary-800 to-primary-950 flex flex-col shadow-xl">
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                <img src="/logo-icon.jpeg" alt={BRAND_NAME} className="w-full h-full object-cover object-center scale-[1.05]" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-none">{t('app_name', BRAND_NAME)}</h1>
                <p className="text-white/50 text-xs mt-0.5">Super Admin</p>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                <span className="badge-green text-[10px]">Super Admin</span>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item, idx) => {
              if (item.type === 'header') {
                return (
                  <div key={idx} className="pt-4 pb-1.5 px-3 first:pt-1">
                    <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">{item.label}</p>
                  </div>
                );
              }
              return (
                <NavLink key={item.to} to={item.to} end={item.end}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  {item.icon}<span className="flex-1">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
          <div className="p-3 border-t border-white/10">
            <button onClick={() => { navigate('/'); logout(); }}
              className="sidebar-link w-full text-red-300 hover:text-red-200 hover:bg-red-500/20">
              <LogOut size={18} /><span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <div className="md:hidden">
        <MobileDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={user}
          role="super_admin"
          groups={superAdminDrawerGroups}
          onLogout={() => { navigate('/'); logout(); }}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* Mobile Header (UI/UX design) */}
        <div className="md:hidden">
          <MobileHeader
            title={t('app_name', BRAND_NAME)}
            subtitle="Super Admin Portal"
            onOpenDrawer={() => setDrawerOpen(true)}
            onOpenNotifications={() => navigate('/admin/dashboard/op/reports')}
          />
        </div>

        {/* Desktop Header */}
        <header className="hidden md:flex bg-white border-b border-gray-200 px-4 sm:px-6 py-3 items-center gap-3 shadow-sm z-30 flex-shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)} className="btn-icon flex-shrink-0 flex">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex-1 min-w-0">
            <span className="text-gray-600 text-sm font-medium truncate">Super Admin Control Panel</span>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <div className="relative">
              <button onClick={() => setShowLang(v => !v)} className="btn-icon flex items-center gap-1">
                <Globe size={18} />
              </button>
              {showLang && (
                <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-40 z-50">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => changeLang(l.code)}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-primary-50 flex items-center gap-2 ${i18n.language === l.code ? 'text-primary-700 font-semibold' : 'text-gray-700'}`}>
                      <span>{l.flag}</span><span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <NotificationCenter />
            <div className="pl-2 border-l border-gray-200 ml-1 hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 relative bg-[var(--bg)] md:bg-transparent">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <MobileBottomNav tabs={superAdminTabs} role="super_admin" />
      </div>
    </div>
  );
}
