import React, { useState } from 'react';
import MobileStatusPill from './MobileStatusPill';
import MobileSheet from './MobileSheet';
import MobileEmptyState from './MobileEmptyState';
import { Calendar, Phone, Plus, User, Clock, MapPin, X } from 'lucide-react';

function daysFromNow(d) {
  return new Date(Date.now() + d * 86400000);
}

function initials(name) {
  if (!name) return 'F';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function BookingSlotsMobile({
  slots = [],
  loading = false,
  onUpdateStatus,
  onCreateSlot,
}) {
  const [selectedOffset, setSelectedOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: new Date().toISOString().slice(0, 10),
    start: '09:00',
    end: '11:00',
    capacity: 5,
    officer: 'Ramesh Kumar',
    village: 'Adoni belt',
  });

  const dateCells = [];
  for (let i = 0; i < 7; i++) {
    const d = daysFromNow(i);
    dateCells.push({
      offset: i,
      wd: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      num: d.getDate(),
      dateStr: d.toISOString().slice(0, 10),
    });
  }

  const selectedDateStr = dateCells[selectedOffset]?.dateStr;

  // Filter slots for selected date or fallback if slots have date property
  const daySlots = slots.filter((s) => {
    if (s.booking_date) return s.booking_date === selectedDateStr;
    return true;
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (onCreateSlot) onCreateSlot(newSlot);
    setShowCreateModal(false);
  };

  return (
    <div className="flex flex-col gap-4 pb-6 font-manrope">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-extrabold tracking-wider uppercase text-[var(--admin-navy)]">
            Farm visit scheduling
          </div>
          <div className="display text-[20px] font-bold text-[var(--text)] mt-0.5">
            Booking Slots
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-9 h-9 rounded-xl bg-[var(--admin-navy)] text-white flex items-center justify-center shadow-sm tap-highlight"
          title="Create Booking Slot"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* 7-Day Date Picker Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4">
        {dateCells.map((c) => (
          <button
            key={c.offset}
            onClick={() => setSelectedOffset(c.offset)}
            className={`min-w-[56px] flex-shrink-0 flex flex-col items-center py-2.5 px-3 rounded-[16px] transition-all tap-highlight ${
              selectedOffset === c.offset
                ? 'bg-[var(--admin-navy-deep)] text-white shadow-sm'
                : 'bg-white border border-[var(--line)] text-[var(--text-muted)]'
            }`}
          >
            <span className="text-[10px] font-bold opacity-80">
              {c.offset === 0 ? 'Today' : c.wd}
            </span>
            <span className="text-[14px] font-extrabold mt-0.5">{c.num}</span>
          </button>
        ))}
      </div>

      {/* Slots List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-[var(--text-muted)] text-sm">
            Loading booking slots...
          </div>
        ) : daySlots.length === 0 ? (
          <MobileEmptyState
            title="No slots this day"
            description="Create a new slot for this date to allow farmers to schedule visits."
            action={
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-[var(--admin-navy)] text-white text-xs font-bold"
              >
                + Create Slot
              </button>
            }
          />
        ) : (
          daySlots.map((s, idx) => {
            const booked = s.booked_count || (s.status === 'approved' ? 1 : 0);
            const capacity = s.capacity || 5;
            const pct = Math.min(100, Math.round((booked / capacity) * 100));
            const isFull = booked >= capacity;

            return (
              <div
                key={s.id || idx}
                onClick={() => setSelectedSlot(s)}
                className="bg-white border border-[var(--line)] rounded-[var(--radius-md)] p-4 flex flex-col gap-2.5 shadow-[var(--shadow-sm)] tap-highlight cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[14px] font-extrabold text-[var(--text)]">
                      {s.time_slot || s.start_time || '09:00 AM – 11:00 AM'}
                    </div>
                    <div className="text-[11.5px] text-[var(--text-muted)] mt-0.5 font-semibold">
                      {s.assigned_officer || s.farmer_name || 'Ramesh Kumar'} ·{' '}
                      {s.warehouse_name || s.village || 'Kurnool Hub'}
                    </div>
                  </div>
                  <MobileStatusPill
                    status={isFull ? 'bad' : 'good'}
                    label={isFull ? 'Full' : 'Open'}
                  />
                </div>

                <div className="h-1.5 w-full bg-[var(--surface-alt)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--admin-navy)] rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="text-[11px] font-bold text-[var(--text-faint)]">
                  {booked} / {capacity} farmers booked ({pct}%)
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Slot Detail Sheet */}
      <MobileSheet
        isOpen={Boolean(selectedSlot)}
        onClose={() => setSelectedSlot(null)}
        title={selectedSlot?.time_slot || 'Booking Slot Details'}
        subtitle={`Officer: ${selectedSlot?.assigned_officer || 'Ramesh Kumar'}`}
      >
        {selectedSlot && (
          <div className="space-y-4 font-manrope">
            <div className="bg-white border border-[var(--line)] rounded-[18px] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[var(--text-muted)]">
                  Status
                </span>
                <MobileStatusPill status={selectedSlot.status || 'open'} />
              </div>
              <div className="text-[14px] font-bold text-[var(--text)]">
                Zone: {selectedSlot.village || selectedSlot.warehouse_name || 'Kurnool Zone'}
              </div>
              <div className="text-[12px] text-[var(--text-muted)]">
                Farmer: {selectedSlot.farmer_name || 'Pending assignment'}
              </div>
              <div className="text-[12px] text-[var(--text-muted)]">
                Grain: {selectedSlot.grain_type || 'Paddy / Grain'}
              </div>
              <div className="text-[12px] text-[var(--text-muted)]">
                Quantity: {selectedSlot.quantity_kg ? `${selectedSlot.quantity_kg} kg` : 'N/A'}
              </div>
            </div>

            {selectedSlot.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    if (onUpdateStatus) onUpdateStatus(selectedSlot.id, 'rejected');
                    setSelectedSlot(null);
                  }}
                  className="flex-1 py-3 rounded-xl border border-[var(--line)] text-[var(--text)] font-bold text-[13px] tap-highlight"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    if (onUpdateStatus) onUpdateStatus(selectedSlot.id, 'approved');
                    setSelectedSlot(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-[var(--admin-navy)] text-white font-bold text-[13px] tap-highlight shadow-sm"
                >
                  Approve Slot
                </button>
              </div>
            )}
          </div>
        )}
      </MobileSheet>

      {/* Create Slot Modal */}
      <MobileSheet
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Booking Slot"
        subtitle="Set up a new farm visit / delivery slot"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 font-manrope">
          <div>
            <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
              Date
            </label>
            <input
              type="date"
              value={newSlot.date}
              onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={newSlot.start}
                onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                End Time
              </label>
              <input
                type="time"
                value={newSlot.end}
                onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
              Capacity (Farmers)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={newSlot.capacity}
              onChange={(e) => setNewSlot({ ...newSlot, capacity: parseInt(e.target.value) || 1 })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
              Field Officer Assigned
            </label>
            <input
              type="text"
              value={newSlot.officer}
              onChange={(e) => setNewSlot({ ...newSlot, officer: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              placeholder="e.g. Ramesh Kumar"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
              Zone / Village
            </label>
            <input
              type="text"
              value={newSlot.village}
              onChange={(e) => setNewSlot({ ...newSlot, village: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              placeholder="e.g. Adoni belt"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[var(--admin-navy)] text-white font-bold text-[14px] shadow-sm tap-highlight mt-2"
          >
            Create Slot
          </button>
        </form>
      </MobileSheet>
    </div>
  );
}
