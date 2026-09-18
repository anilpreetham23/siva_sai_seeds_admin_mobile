import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart, Calendar, MapPin, Wheat,
  Plus, Package, Warehouse, DollarSign, TrendingUp,
  BarChart2, ChevronRight, Bell, Users
} from 'lucide-react';
import marketService from '../../services/marketService';
import { CACHE_TIMES } from '../../lib/queryConfig';
import MobileStatCard from './MobileStatCard';
import MobileCard from './MobileCard';

function fmtClock(date) {
  let h = date.getHours(), m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  return h + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

export default function ManagerMobileDashboard({ data, user }) {
  const navigate = useNavigate();
  const basePath = '/manager/dashboard';

  const { data: marketRates = [] } = useQuery({
    queryKey: ['manager-mandi-rates'],
    queryFn: () => marketService.getRates(),
    ...CACHE_TIMES.LONG,
  });

  const uniqueRates = marketRates.reduce((acc, r) => {
    if (!acc.some((x) => x.crop_type === r.crop_type)) {
      acc.push(r);
    }
    return acc;
  }, []);

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  const revenueMTD = data?.revenueMTD || 124800;
  const pendingOrders = data?.pendingPayments || 6;
  const activeCrops = data?.activeCrops || 6;
  const totalFarmers = data?.totalFarmers || 4;
  const warehouseInv = data?.warehouseInv ? (data.warehouseInv / 100).toFixed(1) : '15.8';

  return (
    <div className="flex flex-col gap-5 pb-6 font-manrope">
      {/* Date & Greeting */}
      <div>
        <div className="text-[11px] font-extrabold tracking-wider uppercase text-[var(--admin-navy)]">
          Sri Siva Sai Seeds · Kurnool Zone · {todayStr}
        </div>
        <div className="display text-[22px] font-bold text-[var(--text)] mt-1">
          Good Morning, {user?.name?.split(' ')[0] || 'Manager'} 👋
        </div>
        <div className="text-[12.5px] text-[var(--text-muted)] mt-1 font-medium">
          Here's what's happening across your operations today.
        </div>
      </div>

      {/* Summary Strip Banner */}
      <div className="rounded-[22px] p-4 flex items-center gap-3.5 bg-gradient-to-r from-[var(--admin-navy-deep)] to-[var(--admin-navy)] text-[#EEF3F9] shadow-[var(--shadow)]">
        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white flex-shrink-0">
          <BarChart2 size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="display text-[20px] font-extrabold text-white leading-tight">
            ₹{revenueMTD.toLocaleString('en-IN')}{' '}
            <span className="text-[11.5px] font-semibold text-white/80 font-manrope">
              today's revenue
            </span>
          </div>
          <div className="text-[11.5px] text-white/80 mt-0.5 truncate font-medium">
            {pendingOrders} seed orders · 4 grain sales · 3 farm visits
          </div>
        </div>
      </div>

      {/* 2x2 KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <MobileStatCard
          icon={<ShoppingCart size={18} />}
          iconBg="#ECF5FD"
          iconColor="#0369A1"
          value={pendingOrders}
          label="Pending seed orders"
          delta="▲ 2 new today"
          deltaPositive={true}
          onClick={() => navigate(`${basePath}/seed-purchases`)}
        />
        <MobileStatCard
          icon={<Calendar size={18} />}
          iconBg="#F0F8EC"
          iconColor="var(--canopy-deep)"
          value="4"
          label="Bookings today"
          delta="6 slots left"
          deltaPositive={true}
          onClick={() => navigate(`${basePath}/booking-slots`)}
        />
        <MobileStatCard
          icon={<MapPin size={18} />}
          iconBg="#FDF5EC"
          iconColor="var(--amber)"
          value="3"
          label="Farm visits today"
          delta="1 in progress"
          deltaPositive={true}
          onClick={() => navigate(`${basePath}/visits`)}
        />
        <MobileStatCard
          icon={<Wheat size={18} />}
          iconBg="#F4F2F7"
          iconColor="#6B4C9A"
          value="4"
          label="Grain sales today"
          delta="▲ 2 vs yesterday"
          deltaPositive={true}
          onClick={() => navigate(`${basePath}/grain-sales`)}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <div className="text-[15px] font-extrabold text-[var(--text)] mb-3">
          Quick Actions
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <button
            onClick={() => navigate(`${basePath}/seed-purchases`)}
            className="flex flex-col items-center gap-1.5 tap-highlight"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#ECF5FD] flex items-center justify-center text-[#0369A1] shadow-[var(--shadow-sm)] border border-[var(--line)]">
              <ShoppingCart size={22} />
            </div>
            <span className="text-[11px] font-bold text-[var(--text-muted)]">
              Seed Requests
            </span>
          </button>

          <button
            onClick={() => navigate(`${basePath}/visits`)}
            className="flex flex-col items-center gap-1.5 tap-highlight"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FDF5EC] flex items-center justify-center text-[var(--amber)] shadow-[var(--shadow-sm)] border border-[var(--line)]">
              <MapPin size={22} />
            </div>
            <span className="text-[11px] font-bold text-[var(--text-muted)]">
              Farm Visits
            </span>
          </button>

          <button
            onClick={() => navigate(`${basePath}/grain-sales`)}
            className="flex flex-col items-center gap-1.5 tap-highlight"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#F4F2F7] flex items-center justify-center text-[#6B4C9A] shadow-[var(--shadow-sm)] border border-[var(--line)]">
              <Wheat size={22} />
            </div>
            <span className="text-[11px] font-bold text-[var(--text-muted)]">
              Grain Sales
            </span>
          </button>
        </div>
      </div>

      {/* More Tools (Operational portal) */}
      <div>
        <div className="text-[15px] font-extrabold text-[var(--text)] mb-3">
          More Tools
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <button
            onClick={() => navigate(`${basePath}/seeds`)}
            className="flex flex-col items-center gap-1 tap-highlight"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#ECF5FD] flex items-center justify-center text-[#0369A1] shadow-[var(--shadow-sm)] border border-[var(--line)]">
              <Package size={20} />
            </div>
            <span className="text-[10px] font-bold text-[var(--text-muted)]">
              Inventory
            </span>
          </button>

          <button
            onClick={() => navigate(`${basePath}/warehouse`)}
            className="flex flex-col items-center gap-1 tap-highlight"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#F4F2F7] flex items-center justify-center text-[#6B4C9A] shadow-[var(--shadow-sm)] border border-[var(--line)]">
              <Warehouse size={20} />
            </div>
            <span className="text-[10px] font-bold text-[var(--text-muted)]">
              Warehouse
            </span>
          </button>

          <button
            onClick={() => navigate(`${basePath}/billing`)}
            className="flex flex-col items-center gap-1 tap-highlight"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#F0F8EC] flex items-center justify-center text-[var(--canopy-deep)] shadow-[var(--shadow-sm)] border border-[var(--line)]">
              <DollarSign size={20} />
            </div>
            <span className="text-[10px] font-bold text-[var(--text-muted)]">
              Billing
            </span>
          </button>

          <button
            onClick={() => navigate(`${basePath}/market-rates`)}
            className="flex flex-col items-center gap-1 tap-highlight"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FDF5EC] flex items-center justify-center text-[var(--amber)] shadow-[var(--shadow-sm)] border border-[var(--line)]">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold text-[var(--text-muted)]">
              Market Rates
            </span>
          </button>
        </div>
      </div>

      {/* Mandi Prices Strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-extrabold text-[var(--text)]">
            Today's Mandi Prices
          </div>
          <div className="text-[11px] font-bold text-[var(--text-muted)]">
            Updated {fmtClock(new Date())}
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4">
          {uniqueRates.map((p, idx) => (
            <div
              key={idx}
              className="min-w-[145px] bg-white border border-[var(--line)] rounded-[16px] p-3 flex items-center gap-2.5 flex-shrink-0 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--surface-alt)] flex items-center justify-center text-xl flex-shrink-0">
                {p.crop_type === 'Rice' ? '🌾' : p.crop_type === 'Maize' ? '🌽' : p.crop_type === 'Cotton' ? '☁️' : '🌱'}
              </div>
              <div>
                <div className="text-[11px] font-bold text-[var(--text-faint)]">
                  {p.crop_type}
                </div>
                <div className="text-[14px] font-extrabold text-[var(--text)]">
                  ₹{p.price_per_kg}
                  <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                    /kg
                  </span>
                </div>
                <div className="text-[10.5px] font-extrabold text-[#28653F] mt-0.5">
                  ▲ Grade {p.grade}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-extrabold text-[var(--text)]">
            Recent Activity
          </div>
          <button
            onClick={() => navigate(`${basePath}/notifications`)}
            className="text-[12px] font-bold text-[var(--admin-navy)] flex items-center gap-0.5"
          >
            <span>View all</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-2.5">
          {[
            { icon: <ShoppingCart size={16} />, bg: '#ECF5FD', color: '#0369A1', text: 'New seed request from Ramulu Naik', time: '12 min ago' },
            { icon: <Wheat size={16} />, bg: '#F4F2F7', color: '#6B4C9A', text: 'Grain sale GS-330 marked as paid', time: '48 min ago' },
            { icon: <MapPin size={16} />, bg: '#FDF5EC', color: 'var(--amber)', text: 'Farm visit FV-499 completed by Divya Rani', time: '2 hrs ago' },
            { icon: <Calendar size={16} />, bg: '#F0F8EC', color: 'var(--canopy-deep)', text: 'Booking slot BS-101 is now full', time: '3 hrs ago' },
          ].map((act, i) => (
            <div
              key={i}
              className="bg-white border border-[var(--line)] rounded-[16px] p-3.5 flex items-center gap-3 shadow-sm"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: act.bg, color: act.color }}
              >
                {act.icon}
              </div>
              <div className="flex-1 text-[12.5px] font-bold text-[var(--text)] truncate">
                {act.text}
              </div>
              <span className="text-[10.5px] font-bold text-[var(--text-faint)] flex-shrink-0">
                {act.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
