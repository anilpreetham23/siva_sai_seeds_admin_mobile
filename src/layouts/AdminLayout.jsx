import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Package, Warehouse, BarChart2,
  Calendar, MapPin, TrendingUp, Wheat, LogOut, Menu, X,
  Globe, Shield, Leaf, User, FileText, DollarSign, ShoppingBag, Database, ClipboardCheck, MessageSquare,
  ShoppingCart
} from 'lucide-react';
import NotificationCenter from '../components/shared/NotificationCenter';
import LiveMarketRatesWidget from '../components/shared/LiveMarketRatesWidget';
import { BRAND_NAME } from '../utils/brandLogo';
import { MobileHeader, MobileBottomNav, MobileDrawer } from '../components/mobile';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
];

export default function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Default open on desktop, closed on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) return false;
    return localStorage.getItem('admin_sidebar') !== 'false';
  });
  const [showLang, setShowLang] = useState(false);

  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin/dashboard/op')
    ? '/admin/dashboard/op'
    : '/manager/dashboard';

  const mobileManagerTabs = [
    { to: `${basePath}/seed-purchases`, icon: <ShoppingCart size={19} />, label: 'Seed Purchase' },
    { to: `${basePath}/booking-slots`, icon: <Calendar size={19} />, label: 'Booking Slot' },
    { to: `${basePath}/visits`, icon: <MapPin size={19} />, label: 'Farm Visits' },
    { to: `${basePath}/grain-sales`, icon: <Wheat size={19} />, label: 'Grain Sales' },
    { to: `${basePath}/profile`, icon: <User size={19} />, label: 'Account' },
  ];

  const managerDrawerGroups = [
    {
      label: 'Overview',
      items: [
        { to: `${basePath}`, icon: <LayoutDashboard size={17} />, label: 'Dashboard', end: true },
      ],
    },
    {
      label: 'Operations',
      items: [
        { to: `${basePath}/seed-purchases`, icon: <ShoppingCart size={17} />, label: 'Seed Purchase' },
        { to: `${basePath}/seeds`, icon: <Package size={17} />, label: 'Seeds Inventory' },
        { to: `${basePath}/warehouse`, icon: <Warehouse size={17} />, label: 'Warehouse' },
        { to: `${basePath}/booking-slots`, icon: <Calendar size={17} />, label: 'Booking Slot' },
        { to: `${basePath}/billing`, icon: <DollarSign size={17} />, label: 'Billing & Invoices' },
        { to: `${basePath}/visits`, icon: <MapPin size={17} />, label: 'Farm Visits' },
        { to: `${basePath}/grain-sales`, icon: <Wheat size={17} />, label: 'Grain Sales' },
        { to: `${basePath}/market-rates`, icon: <TrendingUp size={17} />, label: 'Market Rates' },
        { to: `${basePath}/farmers`, icon: <Users size={17} />, label: 'Farmers' },
      ],
    },
    {
      label: 'Account',
      items: [
        { to: `${basePath}/profile`, icon: <User size={17} />, label: 'My Account' },
      ],
    },
  ];

  const navItems = [
    { to: `${basePath}`, icon: <LayoutDashboard size={18} />, label: t('dashboard'), end: true, roles: ['manager', 'admin', 'super_admin'] },
    { to: `${basePath}/farmers`, icon: <Users size={18} />, label: t('farmers'), roles: ['manager', 'admin', 'super_admin'] },
    { to: `${basePath}/seeds`, icon: <Package size={18} />, label: t('seeds_inventory'), roles: ['manager', 'admin', 'super_admin'] },
    { to: `${basePath}/seed-purchases`, icon: <ShoppingBag size={18} />, label: t('seed_purchases') || 'Seed Purchases', roles: ['manager', 'admin', 'super_admin'] },
    { to: `${basePath}/warehouse`, icon: <Warehouse size={18} />, label: t('warehouse'), roles: ['manager', 'admin', 'super_admin'] },
    { to: `${basePath}/booking-slots`, icon: <Calendar size={18} />, label: t('booking_slot'), roles: ['manager', 'admin', 'super_admin'] },
    { to: `${basePath}/procurement`, icon: <ClipboardCheck size={18} />, label: t('grain_procurement', 'Grain Procurement'), roles: ['admin', 'super_admin'] },
    { to: `${basePath}/billing`, icon: <DollarSign size={18} />, label: t('billing_invoices', 'Billing & Invoices'), roles: ['manager', 'admin', 'super_admin'] },
    { to: `${basePath}/visits`, icon: <MapPin size={18} />, label: t('farm_visits'), roles: ['manager', 'admin', 'super_admin'] },
    { to: `${basePath}/reports`, icon: <BarChart2 size={18} />, label: t('reports'), roles: ['admin', 'super_admin'] },
    { to: `${basePath}/market-rates`, icon: <TrendingUp size={18} />, label: t('market_rates'), roles: ['manager', 'admin', 'super_admin'] },
    { to: `${basePath}/grain-sales`, icon: <Wheat size={18} />, label: t('grain_sales'), roles: ['manager', 'admin', 'super_admin'] },
    { to: `${basePath}/credits`, icon: <DollarSign size={18} />, label: t('credits') || 'Credits', roles: ['admin', 'super_admin'] },
    { to: `${basePath}/event-logs`, icon: <FileText size={18} />, label: t('event_logs'), roles: ['admin', 'super_admin'] },
    { to: `${basePath}/contact-messages`, icon: <MessageSquare size={18} />, label: 'Contact Messages', roles: ['manager', 'admin', 'super_admin'] },
    { to: `${basePath}/cache`, icon: <Database size={18} />, label: t('cache_management', 'Cache Management'), roles: ['admin', 'super_admin'] },
    { to: `${basePath}/profile`, icon: <User size={18} />, label: t('profile_settings'), roles: ['manager', 'admin', 'super_admin'] },
    { to: `/admin/dashboard`, icon: <Shield size={18} />, label: t('super_admin_portal'), roles: ['admin', 'super_admin'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(user?.role));

  useEffect(() => { localStorage.setItem('admin_sidebar', sidebarOpen); }, [sidebarOpen]);

  // Auto-close sidebar on mobile when navigating to a new page
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [location.pathname]);

  const changeLang = (code) => { i18n.changeLanguage(code); localStorage.setItem('agro_lang', code); setShowLang(false); };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%)' }}>

      {/* Mobile backdrop — only visible when sidebar is open on small screens */}
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
        <div className="w-64 h-full bg-gradient-to-b from-primary-800 to-primary-950 flex flex-col shadow-xl overflow-y-auto">
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                <img src="/logo-icon.jpeg" alt={BRAND_NAME} className="w-full h-full object-cover object-center scale-[1.05]" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-none">{t('app_name', BRAND_NAME)}</h1>
                <p className="text-white/50 text-xs mt-0.5">Manager Portal</p>
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
                <span className="badge-green text-[10px]">Manager</span>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {visibleNavItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                {item.icon}<span className="flex-1">{item.label}</span>
                {item.badge && <span className="ml-auto badge bg-red-500 text-white text-[10px]">{item.badge}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="p-3 border-t border-white/10">
            <button onClick={() => { navigate('/'); logout(); }}
              className="sidebar-link w-full text-red-300 hover:text-red-200 hover:bg-red-500/20">
              <LogOut size={18} /><span>{t('logout')}</span>
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
          role="manager"
          groups={managerDrawerGroups}
          onLogout={() => { navigate('/'); logout(); }}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* Mobile Header (UI/UX design) */}
        <div className="md:hidden">
          <MobileHeader
            title={t('app_name', BRAND_NAME)}
            subtitle="Manager Console"
            onOpenDrawer={() => setDrawerOpen(true)}
            onOpenNotifications={() => navigate(`${basePath}/notifications`)}
          />
        </div>

        {/* Desktop Header */}
        <header className="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center gap-3 shadow-sm z-30 flex-shrink-0">
          <button onClick={() => setSidebarOpen(v => !v)} className="btn-icon flex-shrink-0">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex-1 min-w-0">
            <span className="text-gray-600 text-sm font-medium truncate">Manager Dashboard</span>
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
            <div className="pl-2 border-l border-gray-200 ml-1">
              <p className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">{user?.name}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative bg-[var(--bg)] md:bg-transparent">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (Matching Manager Dashboard UIUX.html) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <MobileBottomNav tabs={mobileManagerTabs} role="manager" />
      </div>

      <LiveMarketRatesWidget />
    </div>
  );
}
