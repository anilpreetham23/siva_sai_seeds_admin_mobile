import React, { useState } from 'react';
import MobileStatusPill from './MobileStatusPill';
import MobileSheet from './MobileSheet';
import MobileEmptyState from './MobileEmptyState';
import {
  Calendar, Phone, Plus, User, Clock, MapPin, Camera,
  Upload, CheckCircle, ChevronLeft, Navigation, X, Bell, Eye
} from 'lucide-react';

function initials(name) {
  if (!name) return 'F';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(dStr) {
  if (!dStr) return '-';
  const d = new Date(dStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

export default function FarmVisitsMobile({
  visits = [],
  loading = false,
  onUpdateStatus,
  onScheduleVisit,
  activeCrops = [],
  onCapturePhoto,
  completingId,
  isSuperAdmin = false,
  managers = [],
  onAssignManager,
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [showAssignSheet, setShowAssignSheet] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState('');

  // Form for scheduling visit
  const [scheduleForm, setScheduleForm] = useState({
    crop_id: '',
    visit_month: '1',
    scheduled_date: new Date().toISOString().split('T')[0],
  });

  const filtered = visits.filter((v) => {
    let matchFilter = true;
    if (filter === 'scheduled') {
      matchFilter = v.status === 'scheduled' || v.status === 'pending';
    } else if (filter === 'completed') {
      matchFilter = v.status === 'completed';
    }
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      v.farmer_name?.toLowerCase().includes(q) ||
      v.crop_name?.toLowerCase().includes(q) ||
      v.farmer_phone?.toLowerCase().includes(q) ||
      v.crop_address?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleForm.crop_id || !scheduleForm.scheduled_date) return;
    await onScheduleVisit(scheduleForm);
    setShowScheduleSheet(false);
  };

  return (
    <div className="pb-24 px-4 pt-3 flex flex-col gap-4 font-manrope">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-fraunces text-[22px] font-extrabold text-[var(--text)] tracking-tight">
            Farm Visits
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] font-medium">
            Field inspections & crop reports
          </p>
        </div>
        <button
          onClick={() => setShowScheduleSheet(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--canopy-deep)] text-white text-[12.5px] font-bold shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={15} />
          Schedule Visit
        </button>
      </div>

      {/* Search Box */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by farmer, crop or phone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--line)] bg-white text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[var(--canopy-leaf)] transition-all"
        />
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'all', label: 'All' },
          { key: 'scheduled', label: 'Scheduled' },
          { key: 'completed', label: 'Done' },
        ].map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-[12.5px] font-bold whitespace-nowrap transition-all ${
                active
                  ? 'bg-[var(--canopy-deep)] text-white shadow-sm'
                  : 'bg-white border border-[var(--line)] text-[var(--text-muted)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Visit List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-[var(--canopy-leaf)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <MobileEmptyState
            title="No farm visits found"
            subtitle="Try changing the filter or schedule a new visit."
          />
        ) : (
          filtered.map((v) => {
            const daysUntil = getDaysUntil(v.scheduled_date);
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVisit(v)}
                className="p-4 rounded-2xl bg-white border border-[var(--line)] shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-sun)] text-[var(--canopy-deep)] font-extrabold text-[13px] flex items-center justify-center border border-[#E6DCC8]">
                      {initials(v.farmer_name)}
                    </div>
                    <div>
                      <h3 className="text-[14.5px] font-bold text-[var(--text)]">
                        {v.farmer_name}
                      </h3>
                      <p className="text-[12px] text-[var(--text-muted)] font-medium">
                        {v.crop_name || 'Crop Field'} · Month {v.visit_month}
                      </p>
                    </div>
                  </div>
                  <MobileStatusPill
                    status={
                      v.status === 'completed'
                        ? 'good'
                        : v.status === 'scheduled'
                        ? 'info'
                        : 'warn'
                    }
                    label={v.status}
                  />
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--line-light)] text-[11.5px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1 font-medium truncate max-w-[65%]">
                    <MapPin size={12} className="text-[var(--text-faint)] flex-shrink-0" />
                    <span className="truncate">{v.crop_address || 'Field Location'}</span>
                    {v.report && (
                      <Camera size={12} className="text-[#16A34A] ml-1 flex-shrink-0" />
                    )}
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-[var(--text)] flex-shrink-0">
                    <Calendar size={11} className="text-[var(--text-muted)]" />
                    <span>{formatDate(v.scheduled_date)}</span>
                    {daysUntil === 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                        Today
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Visit Detail Bottom Sheet */}
      <MobileSheet
        isOpen={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
        title="Farm Visit Details"
      >
        {selectedVisit && (
          <div className="space-y-4 pt-1 font-manrope">
            {/* Header info */}
            <div className="flex items-center justify-between gap-2">
              <MobileStatusPill
                status={
                  selectedVisit.status === 'completed'
                    ? 'good'
                    : selectedVisit.status === 'scheduled'
                    ? 'info'
                    : 'warn'
                }
                label={selectedVisit.status}
              />
              <span className="text-[11px] font-bold text-[var(--text-muted)] bg-[var(--surface-alt)] px-2.5 py-1 rounded-full">
                Month {selectedVisit.visit_month}
              </span>
            </div>

            <div>
              <h2 className="text-[18px] font-extrabold text-[var(--text)]">
                {selectedVisit.farmer_name}
              </h2>
              {selectedVisit.farmer_phone && (
                <a
                  href={`tel:${selectedVisit.farmer_phone}`}
                  className="flex items-center gap-1.5 text-[13px] text-[#16A34A] font-bold mt-1"
                >
                  <Phone size={13} />
                  {selectedVisit.farmer_phone}
                </a>
              )}
              {selectedVisit.crop_address && (
                <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--text-muted)] mt-1 font-medium">
                  <MapPin size={13} className="text-[var(--text-faint)] flex-shrink-0" />
                  {selectedVisit.crop_address}
                </p>
              )}
            </div>

            {/* Crop Info Card */}
            <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#CDEBD6] space-y-1.5">
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-[var(--text-muted)] font-bold">Crop</span>
                <span className="font-extrabold text-[var(--text)]">
                  {selectedVisit.crop_name || 'Assigned Crop'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-[var(--text-muted)] font-bold">Scheduled For</span>
                <span className="font-extrabold text-[var(--text)]">
                  {formatDate(selectedVisit.scheduled_date)}
                </span>
              </div>
              {selectedVisit.actual_date && (
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-[var(--text-muted)] font-bold">Completed On</span>
                  <span className="font-extrabold text-[#16A34A]">
                    {formatDate(selectedVisit.actual_date)}
                  </span>
                </div>
              )}
            </div>

            {/* Photo Preview / Capture */}
            <div>
              <div className="text-[12px] font-extrabold text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                <Camera size={14} className="text-[var(--text-faint)]" />
                <span>Farm Inspection Photo</span>
              </div>

              {selectedVisit.report ? (
                <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--surface-alt)] flex items-center gap-3">
                  <img
                    src={selectedVisit.report}
                    alt="Inspection Report"
                    className="w-16 h-16 rounded-xl object-cover border border-[var(--line)]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-bold text-[var(--text)]">
                      Crop photo captured
                    </p>
                    <p className="text-[11px] text-[#16A34A] font-semibold mt-0.5">
                      Verified & stored in Supabase
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onCapturePhoto && onCapturePhoto(selectedVisit.id)}
                  className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--surface-alt)] flex items-center justify-center gap-2 text-[13px] font-bold text-[var(--canopy-deep)] active:scale-[0.99] transition-transform"
                >
                  <Camera size={16} />
                  Take Crop Photo
                </button>
              )}
            </div>

            {/* Action Buttons */}
            {selectedVisit.status !== 'completed' && (
              <div className="pt-2 flex flex-col gap-2">
                <button
                  disabled={completingId === selectedVisit.id}
                  onClick={async () => {
                    await onUpdateStatus(selectedVisit.id, 'completed');
                    setSelectedVisit(null);
                  }}
                  className="w-full py-3 rounded-xl bg-[var(--canopy-deep)] text-white font-bold text-[14px] shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-transform disabled:opacity-50"
                >
                  <CheckCircle size={17} />
                  {completingId === selectedVisit.id ? 'Submitting...' : 'Mark Visit Complete'}
                </button>
              </div>
            )}
          </div>
        )}
      </MobileSheet>

      {/* Schedule Visit Modal Sheet */}
      <MobileSheet
        isOpen={showScheduleSheet}
        onClose={() => setShowScheduleSheet(false)}
        title="Schedule Farm Visit"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-1 font-manrope">
          <div>
            <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
              Select Crop / Farmer
            </label>
            <select
              value={scheduleForm.crop_id}
              onChange={(e) => {
                const c = activeCrops.find((x) => x.id.toString() === e.target.value);
                setScheduleForm({
                  ...scheduleForm,
                  crop_id: e.target.value,
                  farmer_id: c?.farmer_id || '',
                });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              required
            >
              <option value="">-- Choose active crop --</option>
              {activeCrops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.crop_name} - {c.farmer_name} ({c.farmer_phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                Visit Month
              </label>
              <select
                value={scheduleForm.visit_month}
                onChange={(e) => setScheduleForm({ ...scheduleForm, visit_month: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              >
                {[1, 2, 3, 4, 5, 6].map((m) => (
                  <option key={m} value={m}>
                    Month {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                Scheduled Date
              </label>
              <input
                type="date"
                value={scheduleForm.scheduled_date}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[var(--canopy-deep)] text-white font-bold text-[14px] shadow-sm active:scale-98 transition-transform mt-2"
          >
            Confirm Schedule
          </button>
        </form>
      </MobileSheet>
    </div>
  );
}
