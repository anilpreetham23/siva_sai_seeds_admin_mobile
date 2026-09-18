import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import farmerService from '../../services/farmerService';
import marketService from '../../services/marketService';
import { CACHE_TIMES } from '../../lib/queryConfig';
import {
  Sun, Droplets, Wind, Plus, ShoppingBag, ShoppingCart,
  Wheat, ChevronRight, Sprout, TrendingUp, Calendar, AlertCircle
} from 'lucide-react';
import { MobileCard, MobileStatusPill } from '../../components/mobile';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function FarmerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: rawProfile } = useQuery({
    queryKey: ['farmer-profile', user?.id],
    queryFn: () => farmerService.getProfile(user?.id),
    enabled: !!user?.id,
    ...CACHE_TIMES.MEDIUM,
  });

  const { data: crops = [] } = useQuery({
    queryKey: ['farmer-crops', user?.id],
    queryFn: () => farmerService.getCrops(user?.id),
    enabled: !!user?.id,
    ...CACHE_TIMES.MEDIUM,
  });

  const { data: dash = {} } = useQuery({
    queryKey: ['farmer-dashboard', user?.id],
    queryFn: () => farmerService.getDashboard(user?.id),
    enabled: !!user?.id,
    ...CACHE_TIMES.SHORT,
  });

  const { data: marketRates = [] } = useQuery({
    queryKey: ['farmer-market-rates'],
    queryFn: () => marketService.getRates(),
    ...CACHE_TIMES.LONG,
  });

  const farmerName = user?.name || rawProfile?.user?.name || 'Farmer';
  const villageName = rawProfile?.profile?.village || rawProfile?.profile?.address || 'Kurnool Zone';
  const fieldsCount = crops.length || 2;

  // Derive unique crops from market rates
  const uniqueRates = marketRates.reduce((acc, r) => {
    if (!acc.some((x) => x.crop_type === r.crop_type)) {
      acc.push(r);
    }
    return acc;
  }, []);

  return (
    <div className="flex flex-col gap-5 pb-6 font-manrope">
      {/* Eyebrow & Greeting */}
      <div>
        <div className="text-[11px] font-extrabold tracking-wider uppercase text-[var(--canopy-deep)]">
          {villageName} · {fieldsCount} fields
        </div>
        <div className="display text-[23px] font-bold text-[var(--text)] mt-1">
          {getGreeting()}, {farmerName.split(' ')[0]} 🌾
        </div>
      </div>

      {/* Weather & Agri Forecast Banner */}
      <div className="rounded-[22px] p-4 flex items-center gap-3.5 bg-gradient-to-r from-[var(--forest-soft)] to-[var(--canopy)] text-[#EFF6E8] shadow-[var(--shadow)]">
        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-[#F6E2BE] flex-shrink-0">
          <Sun size={26} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="display text-[20px] font-extrabold text-white leading-tight">
            31°C{' '}
            <span className="text-[12px] font-semibold text-white/80 font-manrope">
              Clear · feels 34°
            </span>
          </div>
          <div className="text-[11.5px] text-white/85 mt-0.5 truncate font-medium">
            Good day to irrigate before noon
          </div>
        </div>
        <div className="text-right text-[11px] text-white/85 flex flex-col gap-1 flex-shrink-0 font-medium">
          <span className="inline-flex items-center gap-1 justify-end">
            <Droplets size={12} /> 58%
          </span>
          <span className="inline-flex items-center gap-1 justify-end">
            <Wind size={12} /> 9km/h
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="text-[15px] font-extrabold text-[var(--text)] mb-3">
          Quick Actions
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <button
            onClick={() => navigate('/farmer/seeds')}
            className="flex flex-col items-center gap-1.5 tap-highlight"
          >
            <div className="w-13 h-13 w-[52px] h-[52px] rounded-2xl bg-[#F0F8EC] flex items-center justify-center text-2xl shadow-[var(--shadow-sm)] border border-[var(--line)]">
              🌱
            </div>
            <span className="text-[10.5px] font-bold text-[var(--text-muted)]">
              Buy Seeds
            </span>
          </button>

          <button
            onClick={() => navigate('/farmer/booking-slots')}
            className="flex flex-col items-center gap-1.5 tap-highlight"
          >
            <div className="w-[52px] h-[52px] rounded-2xl bg-[#FDF5EC] flex items-center justify-center text-2xl shadow-[var(--shadow-sm)] border border-[var(--line)]">
              🏭
            </div>
            <span className="text-[10.5px] font-bold text-[var(--text-muted)]">
              Grain Sales
            </span>
          </button>

          <button
            onClick={() => navigate('/farmer/crops')}
            className="flex flex-col items-center gap-1.5 tap-highlight"
          >
            <div className="w-[52px] h-[52px] rounded-2xl bg-[#ECFDF1] flex items-center justify-center text-[var(--canopy-deep)] shadow-[var(--shadow-sm)] border border-[var(--line)]">
              <Plus size={22} />
            </div>
            <span className="text-[10.5px] font-bold text-[var(--text-muted)]">
              Add Field
            </span>
          </button>

          <button
            onClick={() => navigate('/farmer/transactions')}
            className="flex flex-col items-center gap-1.5 tap-highlight"
          >
            <div className="w-[52px] h-[52px] rounded-2xl bg-[#ECF5FD] flex items-center justify-center text-[#0369A1] shadow-[var(--shadow-sm)] border border-[var(--line)]">
              <Wheat size={22} />
            </div>
            <span className="text-[10.5px] font-bold text-[var(--text-muted)]">
              Ledger
            </span>
          </button>
        </div>
      </div>

      {/* Your Fields Carousel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-extrabold text-[var(--text)]">
            Your Fields
          </div>
          <Link
            to="/farmer/crops"
            className="text-[12px] font-bold text-[var(--canopy-deep)] flex items-center gap-0.5"
          >
            <span>See all</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4">
          {crops.length > 0 ? (
            crops.map((crop, idx) => {
              const sowing = new Date(crop.sowing_date || Date.now());
              const days = Math.floor((Date.now() - sowing.getTime()) / (1000 * 60 * 60 * 24));
              const progressPct = Math.min(100, Math.max(10, Math.round((days / 120) * 100)));
              const strokeOffset = 150.8 - (150.8 * progressPct) / 100;

              return (
                <div
                  key={crop.id || idx}
                  onClick={() => navigate('/farmer/crops')}
                  className="w-[155px] flex-shrink-0 bg-white border border-[var(--line)] rounded-[18px] p-3.5 shadow-sm tap-highlight cursor-pointer"
                >
                  <div className="relative w-14 h-14 mx-auto">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke="var(--surface-alt)"
                        strokeWidth="5"
                        fill="none"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke="var(--canopy-deep)"
                        strokeWidth="5"
                        fill="none"
                        strokeDasharray="150.8"
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="mono text-[12px] font-bold text-[var(--text)]">
                        {progressPct}%
                      </span>
                    </div>
                  </div>

                  <div className="text-[13px] font-extrabold text-[var(--text)] mt-2.5 truncate">
                    {crop.crop_name || crop.crop_type}
                  </div>
                  <div className="text-[10.5px] font-semibold text-[var(--text-muted)] mt-0.5 truncate">
                    {crop.crop_type} · {crop.acres} acres
                  </div>
                  <div className="mt-2">
                    <MobileStatusPill status={crop.health_status || 'Healthy'} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full bg-white border border-[var(--line)] rounded-[18px] p-4 text-center">
              <Sprout className="mx-auto text-[var(--canopy)] mb-1" size={24} />
              <div className="text-[13px] font-bold">No active crop fields</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                Tap Add Field above to register your first crop.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Today's Mandi Prices */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-extrabold text-[var(--text)]">
            Today's Mandi Prices
          </div>
          <div className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--canopy)] animate-pulse" />
            Live Market
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4">
          {uniqueRates.slice(0, 6).map((rate, idx) => (
            <div
              key={idx}
              className="min-w-[135px] bg-white border border-[var(--line)] rounded-[16px] p-3 flex items-center gap-2.5 flex-shrink-0 shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-[var(--surface-alt)] flex items-center justify-center text-lg flex-shrink-0">
                {rate.crop_type === 'Rice'
                  ? '🌾'
                  : rate.crop_type === 'Maize'
                  ? '🌽'
                  : rate.crop_type === 'Cotton'
                  ? '☁️'
                  : rate.crop_type === 'Wheat'
                  ? '🌿'
                  : rate.crop_type === 'Groundnut'
                  ? '🥜'
                  : '🌱'}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-[var(--text-faint)] truncate">
                  {rate.crop_type}
                </div>
                <div className="text-[13.5px] font-extrabold text-[var(--text)] leading-tight">
                  ₹{rate.price_per_kg}
                  <span className="text-[9.5px] font-medium text-[var(--text-muted)]">
                    /kg
                  </span>
                </div>
                <div className="text-[10px] font-bold text-[#28653F] mt-0.5">
                  Grade {rate.grade}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary KPI Stats */}
      <div className="grid grid-cols-2 gap-3">
        <MobileCard>
          <div className="text-[11px] font-extrabold tracking-wider uppercase text-[var(--text-faint)]">
            Active Crops
          </div>
          <div className="display text-[22px] font-extrabold text-[var(--canopy-deep)] mt-1">
            {dash.activeCrops || crops.length || 0}
          </div>
          <div className="text-[11px] font-bold text-[var(--text-muted)] mt-0.5">
            Across {rawProfile?.profile?.acres_of_land || 0} acres
          </div>
        </MobileCard>

        <MobileCard>
          <div className="text-[11px] font-extrabold tracking-wider uppercase text-[var(--text-faint)]">
            Grain Sales
          </div>
          <div className="display text-[22px] font-extrabold text-[var(--text)] mt-1">
            ₹{((dash.totalEarnings || 0) / 1000).toFixed(1)}k
          </div>
          <div className="text-[11px] font-bold text-[#28653F] mt-0.5">
            {dash.recentSales?.length || 0} batches delivered
          </div>
        </MobileCard>
      </div>
    </div>
  );
}
