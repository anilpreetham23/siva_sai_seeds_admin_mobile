import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, User, Shield, Phone, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MobileWelcomePage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [step, setStep] = useState('splash'); // 'splash' | 'login'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If user is already authenticated, automatically redirect based on role
  useEffect(() => {
    if (user) {
      if (user.role === 'farmer') {
        toast.error('This application is restricted to Managers and Admins. Please use the Farmer Mobile App.');
      } else if (user.role === 'manager') {
        navigate('/manager/dashboard', { replace: true });
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter email or mobile number.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(identifier, password);
      const userRole = res.user?.role || res.profile?.role;

      if (userRole === 'farmer') {
        toast.error('This mobile app is restricted to Managers and Admins. Please use the separate Farmer Mobile App.');
        setLoading(false);
        return;
      }

      toast.success(`Welcome back, ${res.user?.name || 'Manager'}!`);
      if (userRole === 'manager') {
        navigate('/manager/dashboard', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
      toast.error(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#16293F] text-white flex flex-col justify-between font-sans selection:bg-[#4C7BAA] selection:text-white">
      {step === 'splash' ? (
        /* ================= SPLASH VIEW (AdminMobile UIUX matching) ================= */
        <div 
          onClick={() => setStep('login')}
          className="flex-1 flex flex-col items-center justify-between p-8 text-center cursor-pointer relative overflow-hidden bg-gradient-to-b from-[#16293F] to-[#1E3A5C]"
        >
          {/* Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />

          {/* Top Filler */}
          <div className="pt-8 z-10">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              SRI SIVA SAI SEEDS
            </span>
          </div>

          {/* Center Brand Logo & Titles */}
          <div className="flex flex-col items-center z-10 space-y-5 my-auto">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white/90 shadow-2xl bg-white p-3 flex items-center justify-center">
              <img 
                src="/logo-icon.jpeg" 
                alt="Sri Siva Sai Seeds Logo" 
                className="w-full h-full object-contain"
                onError={(e) => { e.target.src = '/assets/crops/image.png'; }}
              />
            </div>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-white font-serif">Sri Siva Sai Seeds</h1>
              <p className="text-xs font-semibold text-sky-200/90 tracking-wide uppercase">Admin & Manager Console</p>
            </div>

            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              Enterprise management portal for seed inventory, farm visits, grain sales, and operational analytics.
            </p>
          </div>

          {/* Bottom Tap Hint */}
          <div className="pb-6 z-10 animate-pulse">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/15 border border-white/25 text-xs font-bold text-white shadow-lg backdrop-blur-md">
              <span>Tap to Continue to Sign In</span>
              <ChevronRight className="w-4 h-4 text-sky-300" />
            </button>
          </div>
        </div>
      ) : (
        /* ================= LOGIN VIEW (AdminMobile UIUX matching) ================= */
        <div className="flex-1 flex flex-col justify-between p-6 bg-[#F3F6EC] text-[#1C2A21] max-w-md mx-auto w-full font-sans">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E1E8D8] pt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#1E3A5C] overflow-hidden bg-white p-0.5">
                <img src="/logo-icon.jpeg" alt="Logo" className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#1E3A5C] leading-tight">Sri Siva Sai Seeds</h2>
                <p className="text-[10px] font-bold text-[#4C7BAA] uppercase tracking-wider">Admin Console</p>
              </div>
            </div>
            <button 
              onClick={() => setStep('splash')}
              className="text-xs font-semibold text-[#657268] hover:text-[#1E3A5C]"
            >
              Back
            </button>
          </div>

          {/* Form Content */}
          <div className="my-auto py-6 space-y-6">
            <div>
              <h3 className="text-2xl font-black text-[#16293F] font-serif">Admin & Manager Sign In</h3>
              <p className="text-xs font-semibold text-[#657268] mt-1">
                Enter your authorized credentials to access the management portal.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Identifier Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-[#657268]">
                  Mobile Number or Email
                </label>
                <div className="flex items-center gap-2.5 bg-white border-2 border-[#E1E8D8] rounded-xl px-3.5 py-3 focus-within:border-[#1E3A5C] transition-all">
                  <User className="w-4 h-4 text-[#8B9689] flex-shrink-0" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter email or mobile number"
                    className="w-full bg-transparent text-sm font-bold text-[#1C2A21] placeholder-[#8B9689] outline-none"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-[#657268]">
                  Password
                </label>
                <div className="flex items-center gap-2.5 bg-white border-2 border-[#E1E8D8] rounded-xl px-3.5 py-3 focus-within:border-[#1E3A5C] transition-all relative">
                  <Lock className="w-4 h-4 text-[#8B9689] flex-shrink-0" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-transparent text-sm font-bold text-[#1C2A21] placeholder-[#8B9689] outline-none pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 text.text-faint hover:text-[#1E3A5C]"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4 text-[#657268]" /> : <Eye className="w-4 h-4 text-[#657268]" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#1E3A5C] hover:bg-[#16293F] active:scale-[0.98] text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Console'}
              </button>
            </form>

            <div className="p-3.5 rounded-xl bg-[#E9F0DD] border border-[#C5D8B0] text-[11px] text-[#1F4438] leading-relaxed">
              <span className="font-bold text-[#15302A]">Role Protection:</span> Authenticated role determines whether you access the Manager Dashboard or Admin Console.
            </div>
          </div>

          {/* Footer Helpline */}
          <div className="pt-4 border-t border-[#E1E8D8] text-center">
            <a 
              href="tel:+919502662924"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1E3A5C] hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Helpline Support: +91 9502662924</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
