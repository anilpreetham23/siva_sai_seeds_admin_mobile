import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Sprout, ShoppingCart, Calendar,
  History, User, LogOut, Menu, X, Globe,
  Bot, Leaf, Wheat
} from 'lucide-react';
import farmerService from '../services/farmerService';
import toast from 'react-hot-toast';
import NotificationCenter from '../components/shared/NotificationCenter';
import { CACHE_TIMES } from '../lib/queryConfig';
import { BRAND_NAME } from '../utils/brandLogo';
import { MobileHeader, MobileBottomNav, MobileDrawer } from '../components/mobile';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
];

export default function FarmerLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Default open on desktop, closed on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) return false;
    return localStorage.getItem('sidebar_open') !== 'false';
  });
  const [showLang, setShowLang] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { from: 'bot', text: 'Hello! I can help you with current crop prices and market forecasts. Ask me anything!' }
  ]);
  // Same queryKey + fetcher as GrainSales.jsx's market rates query, so both
  // share one cached fetch instead of each triggering its own request.
  const { data: marketRates = [] } = useQuery({
    queryKey: ['farmer-market-rates'],
    queryFn: () => farmerService.getMarketRates(),
    ...CACHE_TIMES.LONG
  });

  const navItems = [
    { to: '/farmer/profile', icon: <LayoutDashboard size={18} />, label: t('account_details', 'Account Details'), end: false },
    { to: '/farmer/crops', icon: <Sprout size={18} />, label: t('crops_cycles') },
    { to: '/farmer/seeds', icon: <ShoppingCart size={18} />, label: t('seed_purchase') },
    { to: '/farmer/booking-slots', icon: <Wheat size={18} />, label: t('grain_sales') },
    { to: '/farmer/transactions', icon: <History size={18} />, label: t('transaction_history') },
  ];

  const mobileNavItems = [
    { to: '/farmer', icon: <LayoutDashboard size={19} />, label: 'Home', end: true },
    { to: '/farmer/seeds', icon: <ShoppingCart size={19} />, label: 'Seed Store' },
    { to: '/farmer/crops', icon: <Sprout size={19} />, label: 'Crops' },
    { to: '/farmer/booking-slots', icon: <Wheat size={19} />, label: 'Grain Sales' },
    { to: '/farmer/profile', icon: <User size={19} />, label: 'Account' },
  ];

  const drawerGroups = [
    {
      label: 'Overview',
      items: [
        { to: '/farmer', icon: <LayoutDashboard size={17} />, label: 'Dashboard', end: true },
      ],
    },
    {
      label: 'Operations',
      items: [
        { to: '/farmer/seeds', icon: <ShoppingCart size={17} />, label: 'Seed Store' },
        { to: '/farmer/crops', icon: <Sprout size={17} />, label: 'Crops & Cycles' },
        { to: '/farmer/booking-slots', icon: <Wheat size={17} />, label: 'Grain Sales & Slots' },
        { to: '/farmer/transactions', icon: <History size={17} />, label: 'Transactions Ledger' },
      ],
    },
    {
      label: 'Account',
      items: [
        { to: '/farmer/profile', icon: <User size={17} />, label: 'My Account' },
      ],
    },
  ];

  useEffect(() => {
    localStorage.setItem('sidebar_open', sidebarOpen);
  }, [sidebarOpen]);

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [location.pathname]);

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('agro_lang', code);
    setShowLang(false);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const sendChat = async () => {
    if (!chatMsg.trim()) return;
    const msg = chatMsg.trim();
    setChatMsg('');
    setChatHistory(h => [...h, { from: 'user', text: msg }]);

    // Simple rule-based bot
    const lower = msg.toLowerCase();
    let response = '';
    const cropMatch = marketRates.find(r => lower.includes(r.crop_type.toLowerCase()));

    if (cropMatch) {
      const related = marketRates.filter(r => r.crop_type === cropMatch.crop_type);
      response = `📊 Current rates for ${cropMatch.crop_type}:\n` +
        related.map(r => `Grade ${r.grade}: ₹${r.price_per_kg}/kg`).join('\n') +
        '\n\nForecast: Prices expected to rise 5-8% next month due to seasonal demand.';
    } else if (lower.includes('price') || lower.includes('rate') || lower.includes('market')) {
      response = '📈 Here are today\'s rates:\n' +
        [...new Set(marketRates.map(r => r.crop_type))].slice(0, 5)
          .map(ct => { const a = marketRates.find(r => r.crop_type === ct && r.grade === 'A'); return `${ct}: ₹${a?.price_per_kg || 'N/A'}/kg (Grade A)`; })
          .join('\n');
    } else if (lower.includes('forecast') || lower.includes('future')) {
      response = '🔮 Market Forecast:\n• Rice: +6% next month\n• Wheat: Stable\n• Cotton: +10% (festive season)\n• Maize: -3% (surplus)\nSource: Agricultural Price Index 2024';
    } else {
      response = 'I can tell you about:\n• Current crop prices (e.g., "Rice price")\n• Market rates for any grain\n• Price forecasts\n\nJust ask!';
    }
    setTimeout(() => setChatHistory(h => [...h, { from: 'bot', text: response }]), 500);
  };

  const currentPage = navItems.find(item => location.pathname.startsWith(item.to))?.label || t('farm_overview');

  return (
    <div className="flex h-screen overflow-hidden agro-bg">

      {/* Mobile backdrop — only visible when sidebar open on small screens */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar
          Desktop only → relative flex element */}
      <aside className={`
        hidden md:flex flex-col relative z-auto flex-shrink-0 overflow-hidden transition-all duration-300
        ${sidebarOpen ? 'w-64' : 'w-0'}
      `}>
        <div className="w-64 h-full bg-gradient-to-b from-agro-green to-agro-dark flex flex-col shadow-green overflow-y-auto">
          {/* Logo */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                <img src="/logo-icon.jpeg" alt={BRAND_NAME} className="w-full h-full object-cover object-center scale-[1.05]" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-none">{t('app_name', BRAND_NAME)}</h1>
                <p className="text-white/50 text-xs mt-0.5">{t('farmer_portal')}</p>
              </div>
            </div>
          </div>

          {/* Farmer info */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-white/50 text-xs truncate">{user?.phone}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                {item.icon}<span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-white/10">
            <button onClick={handleLogout}
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
          role="farmer"
          groups={drawerGroups}
          onLogout={handleLogout}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* Mobile Header (from UI/UX design) */}
        <div className="md:hidden">
          <MobileHeader
            title={t('app_name', BRAND_NAME)}
            subtitle="Farmer Portal"
            onOpenDrawer={() => setDrawerOpen(true)}
            onOpenNotifications={() => navigate('/farmer/profile')}
          />
        </div>

        {/* Desktop Topbar */}
        <header className="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center gap-3 flex-shrink-0 shadow-sm z-30">
          <button onClick={() => setSidebarOpen(v => !v)} className="btn-icon flex-shrink-0">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <h2 className="text-gray-700 font-semibold text-base flex-1 min-w-0 truncate">
            {t('app_name')} — {currentPage}
          </h2>

          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {/* Language Switcher */}
            <div className="relative">
              <button onClick={() => { setShowLang(v => !v); }}
                className="btn-icon flex items-center gap-1.5 text-sm font-medium">
                <Globe size={18} />
                <span className="hidden sm:block">{LANGUAGES.find(l => l.code === i18n.language)?.flag}</span>
              </button>
              {showLang && (
                <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-40 z-50">
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => changeLang(l.code)}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-primary-50 flex items-center gap-2
                        ${i18n.language === l.code ? 'text-primary-700 font-semibold' : 'text-gray-700'}`}>
                      <span>{l.flag}</span><span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <NotificationCenter />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative bg-[var(--bg)] md:bg-transparent">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (Matching Farmers UIUX.html) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <MobileBottomNav tabs={mobileNavItems} role="farmer" />
      </div>

      {/* Chatbot — cleared above the fixed bottom nav (min-h-16 + safe-area
          inset) by the same breakpoint (md) the nav itself hides at, so the
          two never disagree about which one is on screen. */}
      <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+20px)] right-4 md:bottom-6 md:right-6 z-40">
        {chatOpen && (
          <div className="mb-3 bg-white rounded-2xl shadow-2xl border border-gray-200 w-72 sm:w-80 flex flex-col overflow-hidden animate-fade-in">
            <div className="bg-agro-green text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={18} />
                <span className="font-semibold text-sm">{t('chatbot')}</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white"><X size={16} /></button>
            </div>
            <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-52 sm:max-h-60">
              {chatHistory.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] whitespace-pre-line leading-relaxed
                    ${m.from === 'user' ? 'bg-agro-green text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2">
              <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder={t('ask_market')} className="input-field py-2 text-xs flex-1" />
              <button onClick={sendChat} className="btn-primary py-2 px-3 text-xs">➤</button>
            </div>
          </div>
        )}
        <button onClick={() => setChatOpen(v => !v)}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-agro-green hover:bg-primary-700 text-white rounded-full shadow-green flex items-center justify-center transition-all duration-300 active:scale-95">
          {chatOpen ? <X size={20} /> : <Bot size={20} />}
        </button>
      </div>
    </div>
  );
}
