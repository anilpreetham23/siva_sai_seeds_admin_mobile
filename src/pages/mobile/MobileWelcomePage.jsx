import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { 
  Sprout, TrendingUp, ShoppingBag, Truck, UserCheck, Shield, 
  Phone, ArrowRight, CheckCircle2, ChevronRight, Lock, Eye, EyeOff, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिंदी' },
];

export default function MobileWelcomePage({ onSwitchToDesktop }) {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { t, i18n } = useTranslation();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('agro_lang', code);
  };

  const handleQuickDemo = async (role) => {
    // Quick demo shortcuts removed for security.
    // Navigate to the login page to sign in with your real credentials.
    navigate('/login');
    toast('Please sign in with your credentials.');
  };

  const handleFormLogin = async (e) => {
    e.preventDefault();
    if (!phone) return toast.error('Please enter mobile number');
    if (!password) return toast.error('Please enter password');
    setLoading(true);
    try {
      const res = await login(phone, password);
      toast.success(`Welcome back, ${res.user?.name || 'User'}!`);
      if (res.user?.role === 'farmer') navigate('/farmer');
      else if (res.user?.role === 'manager') navigate('/manager/dashboard');
      else navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1F1A] text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-10">
      {/* Top Mobile Bar */}
      <div className="pt-safe px-4 pt-4 pb-3 flex items-center justify-between border-b border-emerald-900/40 bg-[#152B24]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img 
            src="/logo-icon.jpeg" 
            alt="Sri Siva Sai Seeds" 
            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400/80 shadow-md"
            onError={(e) => { e.target.src = '/assets/crops/image.png'; }}
          />
          <div>
            <h1 className="text-[17px] font-bold text-emerald-50 leading-tight tracking-tight">Sri Siva Sai Seeds</h1>
            <p className="text-[11px] text-emerald-400/90 font-medium">Smart Agro System</p>
          </div>
        </div>

        {/* Language Pill Selector */}
        <div className="flex items-center bg-[#0C1A16] rounded-full p-1 border border-emerald-800/50">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => changeLang(l.code)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
                i18n.language === l.code
                  ? 'bg-emerald-500 text-emerald-950 shadow-sm'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Weather & Mandi Banner */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#1E3D31] shadow-lg border border-emerald-600/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌾</span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Kurnool & Nandyal Hub</span>
            </div>
            <div className="mt-1 text-xl font-black text-white">Live Mandi & Seed Depot</div>
            <p className="text-xs text-emerald-100/90 mt-0.5">High-germination certified hybrid seeds</p>
          </div>
          <div className="text-right bg-black/25 px-3 py-2 rounded-xl border border-white/10">
            <div className="text-lg font-black text-amber-300">31°C</div>
            <div className="text-[10px] text-emerald-200 font-medium">Clear · Rain 10%</div>
          </div>
        </div>

        {/* Quick Action Buttons Grid */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 px-1">Quick Services</div>
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={() => navigate('/seeds-catalog')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#17332A] hover:bg-[#1E4237] active:scale-95 transition-all border border-emerald-800/40 text-center"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-1.5 shadow-inner">
                <Sprout className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-emerald-100">Buy Seeds</span>
            </button>

            <button 
              onClick={() => navigate('/market-rates')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#17332A] hover:bg-[#1E4237] active:scale-95 transition-all border border-emerald-800/40 text-center"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-1.5 shadow-inner">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-emerald-100">Live Rates</span>
            </button>

            <button 
              onClick={() => handleQuickDemo('farmer')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#17332A] hover:bg-[#1E4237] active:scale-95 transition-all border border-emerald-800/40 text-center"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center mb-1.5 shadow-inner">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-emerald-100">Grain Sales</span>
            </button>

            <button 
              onClick={() => handleQuickDemo('farmer')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#17332A] hover:bg-[#1E4237] active:scale-95 transition-all border border-emerald-800/40 text-center"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center mb-1.5 shadow-inner">
                <Truck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-emerald-100">Delivery Slot</span>
            </button>
          </div>
        </div>

        {/* 1-Tap Team Lead & Demo Portals */}
        <div className="bg-[#152B24] rounded-2xl p-4 border border-emerald-700/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-800/50 pb-2">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>⚡</span> Quick 1-Tap Portals (Demo)
              </h2>
              <p className="text-[11px] text-emerald-300/80">Tap to test full mobile application</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Interactive
            </span>
          </div>

          <div className="space-y-2">
            {/* Farmer Demo Button */}
            <button
              onClick={() => handleQuickDemo('farmer')}
              disabled={loading}
              className="w-full p-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold flex items-center justify-between shadow-md active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-xl">
                  🌾
                </div>
                <div>
                  <div className="text-sm font-black">Farmer App (Ramesh Kumar)</div>
                  <div className="text-[11px] text-emerald-100/90 font-medium">5 Tabs: Crops, Seeds, Sales, Booking, Ledger</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-200" />
            </button>

            {/* Manager Demo Button */}
            <button
              onClick={() => handleQuickDemo('manager')}
              disabled={loading}
              className="w-full p-3 rounded-xl bg-[#1B382F] hover:bg-[#234A3E] text-white font-bold flex items-center justify-between border border-emerald-700/50 shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center text-lg">
                  🏢
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Manager Dashboard (Suresh Reddy)</div>
                  <div className="text-[10px] text-emerald-300/70">Farmers Directory, Warehouse & Field Visits</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Admin Demo Button */}
            <button
              onClick={() => handleQuickDemo('admin')}
              disabled={loading}
              className="w-full p-3 rounded-xl bg-[#1B382F] hover:bg-[#234A3E] text-white font-bold flex items-center justify-between border border-emerald-700/50 shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center text-lg">
                  👑
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Super Admin Console</div>
                  <div className="text-[10px] text-emerald-300/70">Rates, Inventory, Billing & Reports</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Custom Login Form Toggle */}
        <div className="bg-[#152B24]/80 rounded-2xl p-4 border border-emerald-800/40 space-y-3">
          <button
            onClick={() => setShowLoginForm(!showLoginForm)}
            className="w-full flex items-center justify-between text-left text-xs font-bold text-emerald-300 hover:text-white"
          >
            <span>Have registered credentials? Sign in with mobile</span>
            <span className="text-emerald-400 text-sm">{showLoginForm ? '▲' : '▼'}</span>
          </button>

          {showLoginForm && (
            <form onSubmit={handleFormLogin} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-emerald-300 mb-1">Mobile Number or Email</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9123456780"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0C1A16] border border-emerald-700/60 text-white placeholder-emerald-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0C1A16] border border-emerald-700/60 text-white placeholder-emerald-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-2.5 text-emerald-400"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-sm shadow-md transition-all active:scale-[0.98]"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>

        {/* Live Mandi Rates Preview Strip */}
        <div className="bg-[#152B24] rounded-2xl p-3.5 border border-emerald-800/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Mandi Crop Prices
            </span>
            <button 
              onClick={() => navigate('/market-rates')}
              className="text-[11px] text-emerald-400 hover:text-emerald-200 font-bold"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-[#0C1A16] border border-emerald-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌸</span>
                <div>
                  <div className="text-xs font-bold text-white">Cotton</div>
                  <div className="text-[10px] text-emerald-400">Grade A</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-amber-300">₹75/kg</div>
                <div className="text-[9px] text-emerald-400 font-semibold">+1.8%</div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0C1A16] border border-emerald-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌾</span>
                <div>
                  <div className="text-xs font-bold text-white">Paddy / Rice</div>
                  <div className="text-[10px] text-emerald-400">Grade A</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-amber-300">₹32/kg</div>
                <div className="text-[9px] text-emerald-400 font-semibold">+2.4%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Helpline & Footer */}
        <div className="text-center pt-2 space-y-2">
          <a
            href="tel:+919502662924"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-700/40 text-emerald-300 text-xs font-bold transition-all"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Support Helpline: +91 9502662924</span>
          </a>

          {onSwitchToDesktop && (
            <div>
              <button
                onClick={onSwitchToDesktop}
                className="text-[11px] text-emerald-400/80 hover:text-emerald-200 underline font-medium"
              >
                Switch to Full Desktop Website View
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
