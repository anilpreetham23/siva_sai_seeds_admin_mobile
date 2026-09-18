import React, { useState } from 'react';
import { 
  Warehouse, Calendar, Plus, Eye, MapPin, AlertTriangle, 
  Search, CheckCircle2, Clock, ChevronRight, ArrowLeft, Filter,
  ShieldCheck, AlertCircle, X, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileSheet from './MobileSheet';
import MobileStatusPill from './MobileStatusPill';
import MobileEmptyState from './MobileEmptyState';
import MobileCard from './MobileCard';

const GRAIN_TYPES = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Groundnut', 'Sugarcane'];

export default function FarmerBookingSlotMobile({
  slots = [],
  warehouses = [],
  availableSlots = [],
  avSlotsLoading = false,
  form,
  setForm,
  handleBook,
  saving,
  capacityWarning,
  available_kg,
  selectedWarehouse,
  showModal,
  setShowModal,
  selectedSlot,
  setSelectedSlot,
  t
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('slots'); // 'slots' | 'warehouses'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredSlots = slots.filter(s => {
    const matchesSearch = 
      (s.grain_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.warehouse_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.id).includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredWarehouses = warehouses.filter(w => 
    (w.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.address || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)] font-manrope">
      {/* Top Navigation Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[var(--line)] px-4 pt-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/farmer/home')}
              className="w-9 h-9 rounded-full bg-[var(--surface-alt)] flex items-center justify-center text-[var(--forest)] active:scale-95 transition-transform"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-fraunces text-xl font-bold text-[var(--forest)] leading-tight">
                Grain Slot Booking
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Schedule warehouse grain delivery
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setForm({ grain_sale_id: '', warehouse_id: '', grain_type: '', quantity_kg: '', booking_date: '', warehouse_slot_id: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--forest)] text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-transform"
          >
            <Plus size={15} />
            <span>Book Slot</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mt-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            type="text"
            placeholder={activeTab === 'slots' ? "Search bookings by crop or warehouse..." : "Search warehouses by name or location..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* View Segment Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--surface-alt)] rounded-xl mt-3">
          <button
            onClick={() => setActiveTab('slots')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'slots'
                ? 'bg-white text-[var(--forest)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--forest)]'
            }`}
          >
            My Bookings ({slots.length})
          </button>
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'warehouses'
                ? 'bg-white text-[var(--forest)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--forest)]'
            }`}
          >
            Warehouses ({warehouses.length})
          </button>
        </div>

        {/* Filter Pills (Slots View) */}
        {activeTab === 'slots' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5 pb-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'approved', label: 'Approved' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id)}
                className={`px-3 py-1 text-[11px] font-bold rounded-full whitespace-nowrap transition-all ${
                  statusFilter === pill.id
                    ? 'bg-[var(--forest)] text-white'
                    : 'bg-white border border-[var(--line)] text-[var(--text-muted)]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-3">
        {activeTab === 'slots' ? (
          filteredSlots.length === 0 ? (
            <MobileEmptyState
              icon={Calendar}
              title={searchQuery || statusFilter !== 'all' ? "No bookings match your filter" : "No grain delivery slots booked"}
              description={searchQuery || statusFilter !== 'all' ? "Try adjusting your search criteria." : "Book a slot to deliver your harvested grain directly to the nearest warehouse."}
              action={
                <button
                  onClick={() => {
                    setForm({ grain_sale_id: '', warehouse_id: '', grain_type: '', quantity_kg: '', booking_date: '', warehouse_slot_id: '' });
                    setShowModal(true);
                  }}
                  className="px-4 py-2 bg-[var(--forest)] text-white text-xs font-bold rounded-xl"
                >
                  Book First Slot
                </button>
              }
            />
          ) : (
            filteredSlots.map(slot => {
              const qtl = (Number(slot.quantity_kg || 0) / 100).toFixed(1);
              return (
                <div
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className="bg-white border border-[var(--line)] rounded-2xl p-3.5 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--text)]">
                          {slot.grain_type || 'Grain Delivery'}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-faint)]">
                          #{slot.id}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[var(--forest)] mt-0.5">
                        {qtl} Quintals
                      </p>
                    </div>
                    <MobileStatusPill status={slot.status} />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      <Warehouse size={13} className="text-[var(--text-faint)] shrink-0" />
                      <span className="truncate">{slot.warehouse_name || 'Warehouse'}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 font-medium text-[var(--text)]">
                      <Calendar size={13} className="text-[var(--text-faint)]" />
                      <span>{slot.booking_date}</span>
                    </div>
                  </div>

                  {slot.start_time && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--canopy-deep)] font-medium">
                      <Clock size={12} />
                      <span>{slot.start_time} - {slot.end_time}</span>
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          /* Warehouses List Tab */
          filteredWarehouses.length === 0 ? (
            <MobileEmptyState
              icon={Warehouse}
              title="No warehouses found"
              description="Could not find any warehouses matching your search."
            />
          ) : (
            filteredWarehouses.map(wh => {
              const totalQtl = (wh.total_capacity_kg / 100).toFixed(0);
              const usedQtl = (wh.current_load_kg / 100).toFixed(0);
              const availQtl = (wh.available_kg / 100).toFixed(0);
              const pct = Math.min(100, Math.round((wh.current_load_kg / (wh.total_capacity_kg || 1)) * 100));

              return (
                <div
                  key={wh.id}
                  className="bg-white border border-[var(--line)] rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Warehouse size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text)]">{wh.name}</h3>
                        <p className="text-[11px] text-[var(--text-faint)] flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {wh.address || 'Address not listed'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {availQtl} Qtl Free
                    </span>
                  </div>

                  {/* Meter */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] font-medium text-[var(--text-muted)] mb-1">
                      <span>Occupancy: {pct}%</span>
                      <span>Total: {totalQtl} Qtl</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          pct > 85 ? 'bg-red-500' : pct > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--text-faint)] mt-1.5">
                      <span>Used: {usedQtl} Qtl</span>
                      <span className="font-bold text-emerald-700">Available: {availQtl} Qtl</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => {
                        setForm({
                          grain_sale_id: '',
                          warehouse_id: String(wh.id),
                          grain_type: '',
                          quantity_kg: '',
                          booking_date: '',
                          warehouse_slot_id: ''
                        });
                        setShowModal(true);
                      }}
                      className="px-3 py-1.5 bg-[var(--forest)] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <Plus size={13} />
                      <span>Book at this Warehouse</span>
                    </button>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* Book Slot Bottom Sheet */}
      <MobileSheet
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Book Grain Delivery Slot"
      >
        <form onSubmit={handleBook} className="space-y-4 pt-1 font-manrope">
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
              Grain Type *
            </label>
            <select
              value={form.grain_type}
              onChange={(e) => setForm(f => ({ ...f, grain_type: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] font-medium text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
              required
            >
              <option value="" disabled>Select Grain</option>
              {GRAIN_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
              Warehouse *
            </label>
            <select
              value={form.warehouse_id}
              onChange={(e) => setForm(f => ({ ...f, warehouse_id: e.target.value, warehouse_slot_id: '' }))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] font-medium text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
              required
            >
              <option value="" disabled>Select Warehouse</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({(w.available_kg / 100).toFixed(0)} Qtl available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
              Delivery Date *
            </label>
            <input
              type="date"
              value={form.booking_date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setForm(f => ({ ...f, booking_date: e.target.value, warehouse_slot_id: '' }))}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] font-medium text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
              required
            />
          </div>

          {/* Time Slots Selector */}
          {form.warehouse_id && form.booking_date && (
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">
                Available Time Slots *
              </label>
              {avSlotsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="w-5 h-5 border-2 border-emerald-300 border-t-[var(--forest)] rounded-full animate-spin" />
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  No delivery slots configured for this date. Please pick a different date.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableSlots.map(slot => {
                    const isFullyBooked = (slot.current_booking_count >= slot.max_bookings) || (slot.booked_capacity_kg >= slot.total_capacity_kg);
                    const isSelected = String(form.warehouse_slot_id) === String(slot.id);
                    const remainingQtl = ((slot.total_capacity_kg - slot.booked_capacity_kg) / 100).toFixed(1);

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isFullyBooked}
                        onClick={() => setForm(f => ({ ...f, warehouse_slot_id: String(slot.id) }))}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                          isFullyBooked
                            ? 'bg-gray-50 border-gray-200 opacity-40 cursor-not-allowed text-gray-400'
                            : isSelected
                              ? 'bg-emerald-50 border-[var(--forest)] text-[var(--forest)] ring-1 ring-[var(--forest)] font-bold'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold">{slot.start_time} - {slot.end_time}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">
                          {isFullyBooked ? 'Fully Booked' : `${remainingQtl} Qtl left`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">
              Quantity (Quintals) *
            </label>
            <input
              type="number"
              value={form.quantity_kg}
              onChange={(e) => setForm(f => ({ ...f, quantity_kg: e.target.value }))}
              placeholder="e.g. 50"
              step="0.01"
              min="0.01"
              max={available_kg ? available_kg / 100 : undefined}
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-alt)] border font-medium text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--forest)] ${
                capacityWarning ? 'border-red-500 bg-red-50' : 'border-[var(--line)]'
              }`}
              required
            />
            {capacityWarning && (
              <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-medium">
                <AlertTriangle size={12} />
                Exceeds remaining warehouse capacity ({(available_kg / 100).toFixed(1)} Qtl)
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || capacityWarning || !form.warehouse_slot_id}
              className="w-full py-3 bg-[var(--forest)] text-white text-xs font-bold rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Booking...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirm Slot Booking</span>
                </>
              )}
            </button>
          </div>
        </form>
      </MobileSheet>

      {/* Booking Details Sheet */}
      <MobileSheet
        isOpen={Boolean(selectedSlot)}
        onClose={() => setSelectedSlot(null)}
        title="Delivery Slot Details"
      >
        {selectedSlot && (
          <div className="space-y-4 pt-1 font-manrope text-xs">
            <div className="p-3.5 bg-[var(--surface-alt)] rounded-xl border border-[var(--line)] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-faint)]">Booking ID</span>
                <p className="font-mono text-sm font-bold text-[var(--text)]">#{selectedSlot.id}</p>
              </div>
              <MobileStatusPill status={selectedSlot.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-[var(--line)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-faint)]">Grain Type</span>
                <p className="font-bold text-sm text-[var(--forest)] mt-0.5">{selectedSlot.grain_type}</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[var(--line)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-faint)]">Quantity</span>
                <p className="font-bold text-sm text-emerald-700 mt-0.5">
                  {(selectedSlot.quantity_kg / 100).toFixed(1)} Qtl
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-[var(--line)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Calendar size={14} className="text-[var(--text-faint)]" />
                <span>Date: <strong className="text-[var(--text)]">{selectedSlot.booking_date}</strong></span>
              </div>
              {selectedSlot.start_time && (
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <Clock size={14} className="text-[var(--text-faint)]" />
                  <span>Slot: <strong className="text-[var(--text)]">{selectedSlot.start_time} - {selectedSlot.end_time}</strong></span>
                </div>
              )}
              <div className="flex items-start gap-2 text-[var(--text-muted)] pt-1 border-t border-gray-100">
                <Warehouse size={14} className="text-[var(--text-faint)] shrink-0 mt-0.5" />
                <span>Warehouse: <strong className="text-[var(--text)]">{selectedSlot.warehouse_name}</strong></span>
              </div>
            </div>

            <button
              onClick={() => setSelectedSlot(null)}
              className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs active:scale-95 transition-transform mt-2"
            >
              Close
            </button>
          </div>
        )}
      </MobileSheet>
    </div>
  );
}
