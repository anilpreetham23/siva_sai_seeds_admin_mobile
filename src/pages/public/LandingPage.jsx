import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Leaf, TrendingUp, ShoppingBag, Warehouse, ArrowRight, Star,
  Users, Sprout, BarChart3, ChevronRight, Phone, Menu, X,
  Shield, Clock, Award, Wheat, Package, BadgeCheck, Globe, Send, Loader2, MessageSquare
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import publicService from '../../services/publicService';
import marketService from '../../services/marketService';
import { CACHE_TIMES } from '../../lib/queryConfig';
import { BRAND_NAME } from '../../utils/brandLogo';

const contactSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Valid email is required' }),
  phone: z.string().optional(),
  subject: z.string().min(1, { message: 'Subject is required' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }).max(1000, { message: 'Message must be less than 1000 characters' }),
});

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिंदी' },
];

const CROP_ICONS = { Rice: '🌾', Wheat: '🌿', Maize: '🌽', Cotton: '🌸', default: '🌱' };
const GRADE_COLOR = { A: 'text-primary-600 bg-primary-50', B: 'text-amber-600 bg-amber-50', C: 'text-orange-600 bg-orange-50' };
const SEED_COLORS = ['from-green-400 to-primary-600', 'from-amber-400 to-yellow-600', 'from-blue-400 to-cyan-600', 'from-purple-400 to-violet-600', 'from-rose-400 to-pink-600', 'from-teal-400 to-green-600', 'from-indigo-400 to-blue-600'];
const CROP_COLORS = { Rice: 'from-amber-500 to-yellow-600', Wheat: 'from-yellow-600 to-amber-700', Maize: 'from-orange-400 to-amber-500', Cotton: 'from-sky-400 to-blue-500', default: 'from-teal-400 to-green-500' };
const GRAIN_PHOTOS = {
  Rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
  Wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400',
  Maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=400',
  Cotton: '/cotton-seeds.png',
  Sugarcane: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&q=80&w=400',
  Groundnut: 'https://images.unsplash.com/photo-1567892737950-30c4db37cd89?auto=format&fit=crop&q=80&w=400',
  default: 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?auto=format&fit=crop&q=80&w=400'
};

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [seedSearch, setSeedSearch] = useState('');
  const [activeSection, setActiveSection] = useState('hero');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register: registerContact,
    handleSubmit: handleContactSubmit,
    reset: resetContact,
    watch: watchContact,
    formState: { errors: contactErrors },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', phone: '', subject: '', message: '' }
  });

  const messageLength = watchContact('message')?.length || 0;

  const onContactSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await publicService.submitContactForm(data);
      toast.success('Your message has been sent successfully!');
      resetContact();
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Contact form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Highlight nav based on scroll position
  useEffect(() => {
    const sectionIds = ['hero', 'market-rates', 'seeds-catalog', 'how-it-works', 'features'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0 }
    );
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const { data: stats = { farmers: 0, crops: 0, seeds: 0, warehouses: 0 } } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => publicService.getStats(),
    ...CACHE_TIMES.LONG
  });

  const { data: marketRates = [], isLoading: ratesLoading } = useQuery({
    queryKey: ['public-market-rates'],
    queryFn: () => marketService.getRates(),
    ...CACHE_TIMES.LONG
  });

  const { data: seeds = [], isLoading: seedsLoading } = useQuery({
    queryKey: ['public-seeds'],
    queryFn: () => publicService.getSeeds(),
    ...CACHE_TIMES.LONG
  });

  // Staggered card reveal on scroll — re-observe when data changes
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      document.querySelectorAll('.anim-card').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const card = entry.target;
          const parent = card.parentElement;
          const siblings = parent ? Array.from(parent.querySelectorAll(':scope > .anim-card')) : [card];
          const idx = siblings.indexOf(card);
          const delay = idx * 120; // 120ms stagger
          card.style.transitionDelay = `${delay}ms`;
          card.classList.add('anim-card-visible');
          revealObserver.unobserve(card);
          // Clear stagger delay after animation finishes so hover transitions aren't delayed
          setTimeout(() => { card.style.transitionDelay = ''; }, delay + 600);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.anim-card').forEach(el => revealObserver.observe(el));
    return () => revealObserver.disconnect();
  }, [seeds, marketRates, stats]);

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('agro_lang', code);
    setShowLang(false);
  };

  const handleActionClick = (action) => {
    if (user) {
      if (user.role === 'farmer') {
        if (action === 'buy') return navigate('/farmer/seeds');
        if (action === 'sell') return navigate('/farmer/booking-slots');
        return navigate('/farmer');
      }
      navigate('/manager/dashboard');
    } else {
      navigate('/get-started', { state: { from: action } });
    }
  };

  // Market rates data processing
  const grouped = marketRates.reduce((acc, r) => {
    if (!acc[r.crop_type]) acc[r.crop_type] = {};
    acc[r.crop_type][r.grade] = parseFloat(r.price_per_kg);
    return acc;
  }, {});
  const cropList = Object.keys(grouped);
  const filteredCrops = activeTab === 'all' ? cropList : cropList.filter(c => c.trim().toLowerCase() === activeTab.trim().toLowerCase());

  // Seeds data processing – exclude removed crops
  const EXCLUDED_SEEDS = ['soybean', 'jowar', 'abcd'];
  const filteredSeeds = seeds.filter(s => {
    const name = s.name?.toLowerCase() || '';
    if (EXCLUDED_SEEDS.some(ex => name.includes(ex))) return false;
    return name.includes(seedSearch.toLowerCase()) ||
      s.variety?.toLowerCase().includes(seedSearch.toLowerCase());
  });

  // Features data
  const features = [
    { icon: TrendingUp, titleKey: 'feat1_title', descKey: 'feat1_desc', color: 'bg-primary-100 text-primary-700' },
    { icon: ShoppingBag, titleKey: 'feat2_title', descKey: 'feat2_desc', color: 'bg-amber-100 text-amber-700' },
    { icon: Sprout, titleKey: 'feat3_title', descKey: 'feat3_desc', color: 'bg-green-100 text-green-700' },
    { icon: Warehouse, titleKey: 'feat4_title', descKey: 'feat4_desc', color: 'bg-blue-100 text-blue-700' },
    { icon: Shield, titleKey: 'feat5_title', descKey: 'feat5_desc', color: 'bg-purple-100 text-purple-700' },
    { icon: Clock, titleKey: 'feat6_title', descKey: 'feat6_desc', color: 'bg-rose-100 text-rose-700' },
  ];

  const navLinks = [
    { id: 'market-rates', labelKey: 'market_rates_nav' },
    { id: 'seeds-catalog', labelKey: 'seeds_catalog_nav' },
    { id: 'how-it-works', labelKey: 'how_it_works_nav' },
    { id: 'features', labelKey: 'features_nav' },
  ];

  const menuCardRef = useRef(null);
  useEffect(() => {
    const el = menuCardRef.current;
    if (!el) return;
    const preventBgScroll = (e) => {
      e.preventDefault();
    };
    el.addEventListener('touchmove', preventBgScroll, { passive: false });
    el.addEventListener('wheel', preventBgScroll, { passive: false });
    return () => {
      el.removeEventListener('touchmove', preventBgScroll);
      el.removeEventListener('wheel', preventBgScroll);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => scrollTo('hero')}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                <img src="/logo-icon.jpeg" alt={BRAND_NAME} className="w-full h-full object-cover object-center scale-[1.05]" />
              </div>
              <span className="text-xl font-black text-primary-800 tracking-tight">{t('app_name', BRAND_NAME)}</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={`transition-colors pb-0.5 ${activeSection === link.id
                      ? 'text-primary-700 font-semibold border-b-2 border-primary-600'
                      : 'hover:text-primary-700 border-b-2 border-transparent'
                    }`}
                >
                  {t(link.labelKey)}
                </button>
              ))}
            </div>

            {/* CTA Buttons + Lang */}
            <div className="hidden md:flex items-center gap-3">
              {/* Language Switcher */}
              <div className="relative">
                <button onClick={() => setShowLang(v => !v)} className="btn-icon flex items-center gap-1.5 text-sm font-medium">
                  <Globe size={18} />
                  <span className="hidden sm:inline">{LANGUAGES.find(l => l.code === i18n.language)?.label}</span>
                </button>
                {showLang && (
                  <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-gray-100 py-2 w-32 z-50">
                    {LANGUAGES.map(l => (
                      <button key={l.code} onClick={() => changeLang(l.code)}
                        className={`w-full px-4 py-2 text-sm text-left hover:bg-primary-50 flex items-center gap-2 ${i18n.language === l.code ? 'text-primary-700 font-semibold' : 'text-gray-700'}`}>
                        <span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Link to="/get-started" className="flex items-center gap-1.5 bg-primary-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all active:scale-95 shadow-md shadow-primary-200">
                {t('login')} <ArrowRight size={15} />
              </Link>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            ref={menuCardRef}
            className="md:hidden border-t border-gray-100 bg-white px-5 py-5 space-y-4 animate-fade-in shadow-xl rounded-b-2xl"
          >
            <div className="space-y-3.5">
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => { scrollTo(link.id); setMobileMenuOpen(false); }}
                  className={`block w-full text-left text-[15px] font-medium transition-colors ${activeSection === link.id
                      ? 'text-primary-700 font-bold'
                      : 'text-gray-700 hover:text-primary-700'
                    }`}
                >
                  {t(link.labelKey)}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-100">
              <Link
                to="/get-started"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-3 bg-[#16A34A] hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-md shadow-green-600/20 active:scale-98 transition-all"
              >
                {t('login', 'Login')}
              </Link>
            </div>

            {/* Language switcher in mobile */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => changeLang(l.code)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${i18n.language === l.code ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section id="hero" className="relative overflow-hidden text-white" style={{ minHeight: '92vh' }}>
        {/* === Village background video === */}
        <div className="absolute inset-0">
          <video
            src="/videos/farm-bg.mp4"
            poster="/village-hero.png"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center scale-[1.05]"
            style={{ filter: 'brightness(0.55) saturate(1.2)' }}
          />
        </div>
        {/* Dark gradient overlay for readability and fade into next section */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        {/* === Content === */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center pt-12" style={{ minHeight: '92vh', paddingBottom: '140px' }}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left – text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-full px-4 py-1.5 text-sm font-medium text-primary-200 mb-6 shadow-lg">
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
                🇮🇳 {t('india_agri_marketplace')}
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 drop-shadow-xl">
                {t('buy_seeds_hero')}.<br />
                <span className="text-amber-400 drop-shadow-lg">{t('sell_grains_hero')}.</span><br />
                <span className="text-primary-300">{t('grow_better')}.</span>
              </h1>

              <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-xl backdrop-blur-sm">{t('hero_desc_full')}</p>

              <div className="flex flex-wrap gap-4 mb-6">
                <button onClick={() => handleActionClick('buy')}
                  className="flex items-center gap-2 bg-amber-400 text-gray-900 px-8 py-4 rounded-2xl font-bold text-base hover:bg-amber-300 active:scale-95 transition-all shadow-2xl shadow-amber-500/40 hover:shadow-amber-400/60">
                  <ShoppingBag size={20} /> {t('buy_seeds_btn_short')}
                </button>
                <button onClick={() => handleActionClick('sell')}
                  className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/40 text-white px-8 py-4 rounded-2xl font-bold text-base hover:bg-white/30 active:scale-95 transition-all shadow-xl">
                  <TrendingUp size={20} /> {t('sell_grains_btn_short')}
                </button>
              </div>

              <p className="text-white/50 text-xs">{t('hero_badges')}</p>
            </div>

            {/* Right – glassmorphism stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:ml-auto w-max">
              {[
                { icon: Users, labelKey: 'active_farmers', value: stats.farmers, color: 'from-primary-400 to-green-600', glow: 'shadow-primary-500/30' },
                { icon: Sprout, labelKey: 'active_fields', value: stats.crops, color: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/30' },
                { icon: Package, labelKey: 'seeds_inventory', value: stats.seeds, color: 'from-blue-400 to-cyan-600', glow: 'shadow-blue-500/30' },
                { icon: Warehouse, labelKey: 'warehouse', value: stats.warehouses, color: 'from-purple-400 to-violet-600', glow: 'shadow-purple-500/30' },
              ].map((s, i) => (
                <div key={i}
                  className={`anim-card premium-card bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 sm:p-4 hover:bg-white/20 shadow-xl ${s.glow} cursor-default`}>
                  <span className={`inline-flex w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br ${s.color} items-center justify-center mb-1 sm:mb-3 shadow-lg`}>
                    <s.icon className="text-white w-3 h-3 sm:w-4 sm:h-4" />
                  </span>
                  <p className="text-xl sm:text-4xl font-black text-white drop-shadow">{s.value}+</p>
                  <p className="text-white/60 text-[10px] sm:text-xs font-medium mt-0.5 sm:mt-1 leading-tight">{t(s.labelKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MARKET RATES SECTION ── */}
      <section id="market-rates" className="scroll-mt-16">
        {/* Banner */}
        <div className="bg-gradient-to-br from-gray-900 to-primary-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-primary-300 font-semibold text-sm mb-3">
              <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
              {t('mr_live_prices')}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-3">{t('mr_hero_title')}</h2>
            <p className="text-white/70 text-lg max-w-xl">{t('mr_hero_desc')}</p>
          </div>
        </div>

        {/* Content */}
        <div className="py-14 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900">{t('mr_grain_price_index')}</h3>
                <p className="text-gray-500 mt-1">{t('mr_filter_desc')}</p>
              </div>
              <button onClick={() => handleActionClick('sell')}
                className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all active:scale-95 shadow-md shadow-primary-200 self-start sm:self-auto">
                {t('mr_sell_your_grains')} <ArrowRight size={15} />
              </button>
            </div>

            {/* Crop filter tabs */}
            <div className="flex gap-2 mb-8 flex-wrap">
              {['all', ...cropList.map(c => c.toLowerCase())].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'}`}>
                  {tab === 'all' ? t('mr_all_crops') : tab}
                </button>
              ))}
            </div>

            {ratesLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 justify-items-center">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                    <div className="h-20 bg-gray-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-4 bg-gray-100 rounded w-1/2" />
                      <div className="h-4 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCrops.length === 0 ? (
              <div className="text-center py-24 text-gray-400">
                <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">{t('mr_no_rates')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {filteredCrops.map(crop => (
                <div key={crop} className="animate-fade-in premium-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full group">
                    <div className="bg-gradient-to-r from-primary-700 to-primary-900 px-3 py-3 sm:px-5 sm:py-4 flex items-center gap-2 sm:gap-3">
                      <span className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${CROP_COLORS[crop] || CROP_COLORS.default} flex items-center justify-center text-white font-black text-sm sm:text-lg shadow-lg flex-shrink-0`}>{crop[0]}</span>
                      <div className="min-w-0">
                        <h4 className="text-white font-bold text-sm sm:text-lg truncate">{t(crop.toLowerCase(), crop)}</h4>
                        <p className="text-white/60 text-[10px] sm:text-xs truncate">{t('mr_grade_available', 'Available Grades')}</p>
                      </div>
                    </div>
                    <div className="p-2 sm:p-5 space-y-2 sm:space-y-3">
                      {['A', 'B', 'C'].map(grade => grouped[crop]?.[grade] && (
                        <div key={grade} className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-gray-50">
                          <div className="flex flex-col xl:flex-row xl:items-center gap-0.5 sm:gap-2">
                            <span className={`px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-bold w-fit ${GRADE_COLOR[grade]}`}>{t('grade_label')} {grade}</span>
                            <span className="text-gray-400 text-[9px] sm:text-xs truncate">{grade === 'A' ? t('mr_grade_premium') : grade === 'B' ? t('mr_grade_standard') : t('mr_grade_basic')}</span>
                          </div>
                          <span className="text-primary-700 font-semibold text-[10px] sm:text-xs ml-1">✓ {t('available_status', 'Available')}</span>
                        </div>
                      ))}
                      <button onClick={() => handleActionClick('sell')}
                        className="w-full mt-1 sm:mt-2 py-1.5 sm:py-2.5 border-2 border-primary-600 text-primary-700 rounded-xl text-[11px] sm:text-sm font-semibold hover:bg-primary-50 transition-all flex items-center justify-center gap-1">
                        <span className="truncate">{t('mr_sell_btn')} {t(crop.toLowerCase(), crop)}</span> <ChevronRight size={14} className="premium-card-arrow flex-shrink-0" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SEEDS CATALOG SECTION ── */}
      <section id="seeds-catalog" className="scroll-mt-16">
        {/* Banner */}
        <div className="bg-gradient-to-br from-gray-900 to-primary-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-primary-400 font-semibold text-sm mb-3">
              <Sprout size={15} />
              {t('sc_premium_quality')}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-3">{t('sc_hero_title')}</h2>
            <p className="text-white/80 text-lg max-w-xl">{t('sc_hero_desc')}</p>
          </div>
        </div>

        {/* Content */}
        <div className="py-14 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <input
                type="text"
                placeholder={t('sc_search_placeholder')}
                value={seedSearch}
                onChange={e => setSeedSearch(e.target.value)}
                className="w-full sm:w-80 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
              />
              <button onClick={() => handleActionClick('buy')}
                className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-all active:scale-95 shadow-md shadow-amber-200 self-start sm:self-auto">
                {t('sc_browse_buy')} <ArrowRight size={15} />
              </button>
            </div>

            {seedsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                    <div className="h-24 bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSeeds.length === 0 ? (
              <div className="text-center py-24 text-gray-400">
                <Sprout size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">{seeds.length === 0 ? t('sc_no_seeds') : t('sc_no_match')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {filteredSeeds.map((seed) => {
                  const cropName = seed.name?.split(' ')[1] || seed.name?.split(' ')[0] || 'default';
                  const photoUrl = seed.image_url || GRAIN_PHOTOS[cropName] || GRAIN_PHOTOS.default;
                  return (
                    <div key={seed.id} className="animate-fade-in premium-card bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group flex flex-col">
                      <div className="h-32 bg-gray-100 overflow-hidden relative flex-shrink-0">
                        <img
                          src={photoUrl}
                          alt={seed.name}
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = GRAIN_PHOTOS.default; }}
                          className="w-full h-full object-cover premium-card-img"
                        />
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-bold text-gray-900 text-sm leading-tight">{seed.name}</h4>
                          <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full shrink-0">{t('sc_in_stock')}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">{seed.variety}</p>
                        <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{seed.description}</p>
                        <div className="mt-auto">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-500 font-semibold">{t('available', 'Available')}: {(seed.stock_kg / 100).toFixed(1)} {t('qtl', 'Qtl')}</span>
                          </div>
                          <button onClick={() => handleActionClick('buy')}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold hover:from-amber-600 hover:to-orange-600 transition-all active:scale-95 flex items-center justify-center gap-1.5 group-hover:shadow-md">
                            <ShoppingBag size={13} /> {t('sc_buy_now')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION ── */}
      <section id="how-it-works" className="scroll-mt-16">
        {/* Banner */}
        <div className="bg-gradient-to-br from-gray-900 to-primary-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 text-primary-300 font-semibold text-sm mb-3">
              <BadgeCheck size={15} />
              {t('hiw_simple_process')}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-3">{t('hiw_hero_title')}</h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">{t('hiw_hero_desc')}</p>
          </div>
        </div>

        {/* Content */}
        <div className="py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-1 gap-4 sm:gap-16">
              {[
                { step: '01', icon: BadgeCheck, titleKey: 'hiw_step1_title', descKey: 'hiw_step1_desc', color: 'from-primary-500 to-green-600' },
                { step: '02', icon: BarChart3, titleKey: 'hiw_step2_title', descKey: 'hiw_step2_desc', color: 'from-amber-500 to-orange-500' },
                { step: '03', icon: Award, titleKey: 'hiw_step3_title', descKey: 'hiw_step3_desc', color: 'from-blue-500 to-cyan-600' },
              ].map((item, index) => (
                <div key={item.step} className={`flex flex-col ${index % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-4 sm:gap-10`}>
                  <div className="flex-1 w-full">
                    <div className="anim-card premium-card relative bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-10 border border-gray-100 shadow-xl h-full">
                      <div className="text-4xl sm:text-8xl font-black text-gray-50 absolute -top-3 sm:-top-6 right-0 sm:-right-2 select-none z-0">{item.step}</div>
                      <div className="relative z-10">
                        <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 sm:mb-6 shadow-lg`}>
                          <item.icon className="text-white w-5 h-5 sm:w-8 sm:h-8" />
                        </div>
                        <h3 className="font-black text-gray-900 text-sm sm:text-2xl mb-2 sm:mb-4">{t(item.titleKey)}</h3>
                        <p className="text-gray-500 text-xs sm:text-lg leading-relaxed line-clamp-4 sm:line-clamp-none">{t(item.descKey)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 hidden md:flex justify-center">
                    {index === 0 && (
                      <div className="w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-primary-600 to-green-600 px-5 py-4">
                          <p className="text-white font-bold text-sm">{t('hiw_card1_title')}</p>
                          <p className="text-white/60 text-xs mt-0.5">{t('hiw_card1_subtitle')}</p>
                        </div>
                        <div className="p-5 space-y-3">
                          {[[t('hiw_card1_name'), 'Rajesh Kumar'], [t('hiw_card1_village'), 'Nalgonda'], [t('hiw_card1_acres'), '12 acres'], [t('hiw_card1_status'), '✅ Approved']].map(([k, v]) => (
                            <div key={k} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                              <span className="text-xs text-gray-400 font-medium">{k}</span>
                              <span className={`text-xs font-bold ${k === t('hiw_card1_status') ? 'text-primary-600' : 'text-gray-700'}`}>{v}</span>
                            </div>
                          ))}
                        </div>
                        <div className="px-5 pb-5">
                          <div className="bg-primary-50 rounded-xl p-3 flex items-center gap-2">
                            <BadgeCheck size={16} className="text-primary-600 flex-shrink-0" />
                            <p className="text-xs text-primary-700 font-medium">{t('hiw_card1_verified')}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {index === 1 && (
                      <div className="w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between">
                          <div>
                            <p className="text-white font-bold text-sm">{t('hiw_card2_title')}</p>
                            <p className="text-white/70 text-xs mt-0.5">{t('hiw_card2_subtitle')}</p>
                          </div>
                          <span className="flex items-center gap-1 text-white/80 text-xs font-medium">
                            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />{t('hiw_card2_live')}
                          </span>
                        </div>
                        <div className="p-5 space-y-2">
                          {[['Rice', 'A', '₹48/kg'], ['Wheat', 'A', '₹21/kg'], ['Maize', 'A', '₹32/kg']].map(([crop, grade, price]) => (
                            <div key={crop} className="flex justify-between items-center px-3 py-2 rounded-xl bg-amber-50">
                              <span className="text-sm font-semibold text-gray-700">{crop}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">{t('hiw_card2_grade')} {grade}</span>
                                <span className="text-sm font-black text-amber-600">{price}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {index === 2 && (
                      <div className="w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-5 py-4">
                          <p className="text-white font-bold text-sm">{t('hiw_card3_title')}</p>
                          <p className="text-white/60 text-xs mt-0.5">{t('hiw_card3_subtitle')}</p>
                        </div>
                        <div className="p-5 space-y-3">
                          <div className="flex justify-between text-xs text-gray-500"><span>{t('hiw_card3_grain')}</span><span className="font-bold text-gray-700">Rice (Grade A)</span></div>
                          <div className="flex justify-between text-xs text-gray-500"><span>{t('hiw_card3_qty')}</span><span className="font-bold text-gray-700">500 kg</span></div>
                          <div className="flex justify-between text-xs text-gray-500"><span>{t('hiw_card3_rate')}</span><span className="font-bold text-gray-700">₹48/kg</span></div>
                          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-700">{t('hiw_card3_total')}</span>
                            <span className="text-xl font-black text-primary-600">₹24,000</span>
                          </div>
                          <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
                            <Award size={16} className="text-blue-600 flex-shrink-0" />
                            <p className="text-xs text-blue-700 font-medium">{t('hiw_card3_payment')}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>


          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="scroll-mt-16">
        {/* Banner */}
        <div className="bg-gradient-to-br from-gray-900 to-primary-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 text-primary-400 font-semibold text-sm mb-3">
              <Shield size={15} />
              {t('feat_platform')}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black mb-3">{t('feat_hero_title')}</h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">{t('feat_hero_desc')}</p>
          </div>
        </div>

        {/* Content */}
        <div className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {features.map((f, i) => (
                <div key={i} className="anim-card premium-card bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm group">
                  <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${f.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{t(f.titleKey)}</h3>
                  <p className="text-xs sm:text-base text-gray-500 leading-relaxed line-clamp-3 sm:line-clamp-none">{t(f.descKey)}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>



      {/* ── CONTACT US SECTION ── */}
      <section id="contact-us" className="scroll-mt-16 py-20 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-primary-600 font-semibold text-sm mb-3 bg-primary-50 px-4 py-1.5 rounded-full">
              <MessageSquare size={16} />
              Contact Us
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Have questions, suggestions, or need assistance? Send us a message and our team will get back to you as soon as possible.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xl shadow-gray-200/40">
            <form onSubmit={handleContactSubmit(onContactSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    {...registerContact('name')}
                    className={`w-full px-4 py-3 rounded-xl border bg-gray-50/50 focus:bg-white transition-all outline-none focus:ring-2 ${contactErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'}`}
                    placeholder="John Doe"
                    disabled={isSubmitting}
                  />
                  {contactErrors.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{contactErrors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    {...registerContact('email')}
                    className={`w-full px-4 py-3 rounded-xl border bg-gray-50/50 focus:bg-white transition-all outline-none focus:ring-2 ${contactErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'}`}
                    placeholder="john@example.com"
                    disabled={isSubmitting}
                  />
                  {contactErrors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{contactErrors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    {...registerContact('phone')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none"
                    placeholder="+91 9876543210"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    {...registerContact('subject')}
                    className={`w-full px-4 py-3 rounded-xl border bg-gray-50/50 focus:bg-white transition-all outline-none focus:ring-2 ${contactErrors.subject ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'}`}
                    placeholder="How can we help?"
                    disabled={isSubmitting}
                  />
                  {contactErrors.subject && <p className="text-red-500 text-xs mt-1.5 font-medium">{contactErrors.subject.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                <div className="relative">
                  <textarea
                    {...registerContact('message')}
                    rows={5}
                    className={`w-full px-4 py-3 rounded-xl border bg-gray-50/50 focus:bg-white transition-all outline-none focus:ring-2 resize-none ${contactErrors.message ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'}`}
                    placeholder="Write your message here..."
                    disabled={isSubmitting}
                  />
                  <div className={`absolute bottom-3 right-3 text-xs font-medium ${messageLength > 1000 ? 'text-red-500' : 'text-gray-400'}`}>
                    {messageLength} / 1000
                  </div>
                </div>
                {contactErrors.message && <p className="text-red-500 text-xs mt-1.5 font-medium">{contactErrors.message.message}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-primary-600 to-green-600 hover:from-primary-700 hover:to-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-primary-600/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-white pt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/logo-icon.jpeg" alt={BRAND_NAME} className="w-full h-full object-cover object-center scale-[1.05]" />
              </div>
              <span className="font-black text-lg text-white">{t('app_name', BRAND_NAME)}</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <button onClick={() => scrollTo('market-rates')} className="hover:text-white transition-colors">{t('market_rates_nav')}</button>
              <button onClick={() => scrollTo('seeds-catalog')} className="hover:text-white transition-colors">{t('seeds_catalog_nav')}</button>
              <Link to="/get-started" className="hover:text-white transition-colors">{t('farmer_login')}</Link>
            </div>
            <div className="flex flex-col md:items-end gap-1">
              <p className="text-gray-500 text-xs">{t('footer_copyright')}</p>
              <p className="text-gray-500 text-xs font-semibold">Powered by VPD Technologies</p>
            </div>
          </div>

          {/* Sri Siva Sai Seeds Address */}
          <div className="border-t border-white/10 py-6 flex justify-center">
            <a
              href="https://www.google.com/maps/place/Sri+Siva+Sai+Seeds/@15.807285,78.0182831,17z/data=!3m1!4b1!4m6!3m5!1s0x3bb5de09f216fa7f:0x6b0dce73b5349bb6!8m2!3d15.807285!4d78.0182831!16s%2Fg%2F11hcjywrg8?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors group"
            >
              <span className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </span>
              <div>
                <p className="text-white text-xs font-semibold">Sri Siva Sai Seeds</p>
                <p className="text-gray-400 text-xs">View on Google Maps ↗</p>
              </div>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
