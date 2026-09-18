import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import farmerService from '../../services/farmerService';
import { useAuth } from '../../context/AuthContext';
import { CACHE_TIMES } from '../../lib/queryConfig';
import { Calendar, Plus, X, CheckCircle, Warehouse, AlertTriangle, Eye, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

import FarmerBookingSlotMobile from '../../components/mobile/FarmerBookingSlotMobile';

const GRAIN_TYPES = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Groundnut', 'Sugarcane'];

export default function BookingSlot() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    grain_sale_id: '', warehouse_id: '', grain_type: '', quantity_kg: '',
    booking_date: '', warehouse_slot_id: '',
  });

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['farmer-booking-slots', user?.id],
    queryFn: () => farmerService.getBookingSlots(user.id),
    enabled: !!user?.id,
    ...CACHE_TIMES.SHORT
  });
  const { data: warehouses = [], isLoading: whLoading } = useQuery({
    queryKey: ['farmer-warehouses'],
    queryFn: () => farmerService.getWarehouses(),
    ...CACHE_TIMES.LONG
  });

  // Query for fetching available warehouse slots for selected warehouse and date
  const { data: availableSlots = [], isLoading: avSlotsLoading } = useQuery({
    queryKey: ['available-warehouse-slots', form.warehouse_id, form.booking_date],
    queryFn: () => farmerService.getWarehouseSlots(parseInt(form.warehouse_id), form.booking_date),
    enabled: !!form.warehouse_id && !!form.booking_date,
    staleTime: 5000,
  });

  const loading = slotsLoading || whLoading;

  const selectedWarehouse = warehouses.find(w => w.id === parseInt(form.warehouse_id));
  const available_kg = selectedWarehouse ? selectedWarehouse.available_kg : null;
  const capacityWarning = form.quantity_kg && available_kg !== null && (parseFloat(form.quantity_kg) * 100) > available_kg;

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.grain_type) return toast.error('Please select a grain type');
    if (!form.booking_date) return toast.error('Please select a booking date');
    if (!form.warehouse_id) return toast.error('Please select a warehouse');
    if (!form.warehouse_slot_id) return toast.error('Please select a time slot');
    if (!form.quantity_kg || parseFloat(form.quantity_kg) <= 0) return toast.error('Please enter a valid quantity');
    const requestedKg = parseFloat(form.quantity_kg) * 100;
    if (requestedKg > available_kg) return toast.error(t('insufficient_capacity', { capacity: (available_kg / 100).toFixed(1) }));
    
    // Check local slot limits
    const chosenSlot = availableSlots.find(s => s.id === parseInt(form.warehouse_slot_id));
    if (chosenSlot) {
      const remainingWt = chosenSlot.total_capacity_kg - chosenSlot.booked_capacity_kg;
      if (requestedKg > remainingWt) {
        return toast.error(`Requested quantity exceeds slot capacity. Available: ${(remainingWt / 100).toFixed(1)} Qtl`);
      }
      if (chosenSlot.current_booking_count >= chosenSlot.max_bookings) {
        return toast.error('Time slot is fully booked. Please select another slot.');
      }
    }

    setSaving(true);
    try {
      await farmerService.bookDeliverySlot(user.id, {
        booking_date: form.booking_date,
        delivery_address: profile?.address || '',
        grain_type: form.grain_type,
        warehouse_id: parseInt(form.warehouse_id),
        quantity_kg: requestedKg,
        warehouse_slot_id: parseInt(form.warehouse_slot_id),
      });
      toast.success(t('booking_created'));
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['farmer-booking-slots'] });
    } catch (err) { toast.error(err.message || t('booking_failed')); }
    finally { setSaving(false); }
  };

  const statusBadge = (s) => ({ pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red', completed: 'badge-blue', cancelled: 'badge-red' }[s] || 'badge-gray');

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {/* Mobile-Optimized View (< 768px) */}
      <div className="md:hidden">
        <FarmerBookingSlotMobile
          slots={slots}
          warehouses={warehouses}
          availableSlots={availableSlots}
          avSlotsLoading={avSlotsLoading}
          form={form}
          setForm={setForm}
          handleBook={handleBook}
          saving={saving}
          capacityWarning={capacityWarning}
          available_kg={available_kg}
          selectedWarehouse={selectedWarehouse}
          showModal={showModal}
          setShowModal={setShowModal}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          t={t}
        />
      </div>

      {/* Preserved Desktop View (>= 768px) */}
      <div className="hidden md:block animate-fade-in">
        <div className="page-header">
          <div><h1 className="page-title">{t('grain_sales', 'Grain Sales')}</h1><p className="page-subtitle">{t('booking_slot_desc')}</p></div>
          <button onClick={() => { setForm({ grain_sale_id: '', warehouse_id: '', grain_type: '', quantity_kg: '', booking_date: '', warehouse_slot_id: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus size={16} />{t('book_slot')}</button>
        </div>

      {/* Warehouse Capacity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {warehouses.map(w => {
          const pct = (w.current_load_kg / w.total_capacity_kg) * 100;
          return (
            <div key={w.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{w.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{w.address}</p>
                </div>
                <Warehouse size={20} className="text-primary-500" />
              </div>
              <div className="warehouse-bar mb-2">
                <div className={`${pct > 80 ? 'warehouse-fill-red' : pct > 60 ? 'warehouse-fill-yellow' : 'warehouse-fill-green'}`}
                  style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{t('used_colon')} {(w.current_load_kg / 100).toFixed(0)} Qtl</span>
                <span className="font-semibold text-primary-700">{t('available_colon')} {(w.available_kg / 100).toFixed(0)} Qtl</span>
                <span>{t('total_colon')} {(w.total_capacity_kg / 100).toFixed(0)} Qtl</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking History */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-gray-100"><h3 className="font-semibold">{t('my_booking_slots')}</h3></div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {slots.length === 0
            ? <p className="text-center py-10 text-gray-400 text-sm">{t('no_slots_booked_yet')}</p>
            : slots.map(s => (
              <div key={s.id} className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setSelectedSlot(s)}>
                <div>
                  <p className="font-semibold text-gray-800">{s.grain_type}</p>
                  <p className="text-xs text-gray-500">{s.booking_date} {s.start_time ? `(${s.start_time} - ${s.end_time})` : ''} · {(s.quantity_kg / 100).toFixed(1)} Qtl</p>
                  <p className="text-xs text-gray-400">{s.warehouse_name}</p>
                </div>
                <span className={`badge ${statusBadge(s.status)}`}>{s.status}</span>
              </div>
            ))
          }
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block table-container">
          <table className="data-table">
            <thead><tr>
              <th>{t('date')}</th><th>{t('grain_type')}</th><th>{t('quantity')}</th><th>{t('warehouse')}</th><th>{t('status')}</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {slots.length === 0
                ? <tr><td colSpan={6} className="text-center py-10 text-gray-400">{t('no_slots_booked_yet')}</td></tr>
                : slots.map(s => (
                  <tr key={s.id}>
                    <td className="font-semibold">
                      {s.booking_date}
                      <span className="text-xs text-gray-400 block font-normal">{s.start_time ? `${s.start_time} - ${s.end_time}` : ''}</span>
                    </td>
                    <td>{s.grain_type}</td>
                    <td>{(s.quantity_kg / 100).toFixed(1)} Qtl</td>
                    <td><p className="font-medium">{s.warehouse_name}</p></td>
                    <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                    <td><button onClick={() => setSelectedSlot(s)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-primary-600 hover:bg-primary-50" title="Details"><Eye size={14} /></button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Modal */}
      {showModal && (
        <div className="modal-overlay items-start pt-4 sm:items-center sm:pt-0" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><Calendar size={20} className="text-purple-600" /></div>
                <div><h3 className="font-bold text-gray-800">{t('book_slot')}</h3><p className="text-xs text-gray-500">{t('schedule_grain_delivery')}</p></div>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleBook} className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('grain_type')} *</label>
                  <select value={form.grain_type} onChange={e => setForm(f => ({ ...f, grain_type: e.target.value }))} className="input-field" required>
                    <option value="" disabled>Select Grain</option>
                    {GRAIN_TYPES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">{t('booking_date')} *</label>
                  <input type="date" value={form.booking_date} onChange={e => setForm(f => ({ ...f, booking_date: e.target.value, warehouse_slot_id: '' }))}
                    className="input-field" min={new Date().toISOString().split('T')[0]} required />
                </div>
              </div>
              <div>
                <label className="label">{t('warehouse')} *</label>
                <select value={form.warehouse_id} onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value, warehouse_slot_id: '' }))} className="input-field" required>
                  <option value="" disabled>{t('select_warehouse')}</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{t('warehouse_available', { name: w.name, capacity: (w.available_kg / 100).toFixed(0) })}</option>)}
                </select>
              </div>

              {/* Live Slot Availability Section */}
              {form.warehouse_id && form.booking_date && (
                <div>
                  <label className="label">Available Time Slots *</label>
                  {avSlotsLoading ? (
                    <div className="flex items-center justify-center p-4"><div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-xs text-amber-600 italic bg-amber-50 p-2.5 rounded-lg border border-amber-100">No active time slots defined for this date. Please try another date.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mt-1 max-h-40 overflow-y-auto pr-1">
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
                            className={`text-left p-2.5 border rounded-xl flex flex-col transition-all ${
                              isFullyBooked 
                                ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed text-gray-400' 
                                : isSelected 
                                  ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600 text-primary-900' 
                                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span className="text-xs font-semibold">{slot.start_time} - {slot.end_time}</span>
                            <span className="text-[10px] text-gray-500 mt-1">
                              {isFullyBooked 
                                ? 'Fully Booked' 
                                : `Available: ${remainingQtl} Qtl (${slot.current_booking_count}/${slot.max_bookings} slots)`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="label">{t('quantity_qtl', 'Quantity (Quintals)')} *</label>
                <input type="number" value={form.quantity_kg} onChange={e => setForm(f => ({ ...f, quantity_kg: e.target.value }))}
                  className={`input-field peer ${capacityWarning ? 'input-error' : ''}`} placeholder={t('quantity_in_qtl', 'Quantity in Quintals')} min="0.01" max={available_kg ? available_kg / 100 : undefined} step="0.01" required />
                {capacityWarning && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />{t('exceeds_capacity', { capacity: (available_kg / 100).toFixed(1) })}
                  </p>
                )}
              </div>
            </form>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn-ghost">{t('cancel')}</button>
              <button onClick={handleBook} disabled={saving || capacityWarning || !form.warehouse_slot_id} className="btn-primary flex items-center gap-2">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={16} />}
                {saving ? t('booking') : t('confirm_booking')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSlot && (
        <div className="modal-overlay items-start pt-4 sm:items-center sm:pt-0" onClick={() => setSelectedSlot(null)}>
          <div className="modal-content max-w-lg w-full mx-3 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-gray-800 text-lg">{t('booking_details')}</h3>
              <button onClick={() => setSelectedSlot(null)} className="btn-icon"><X size={18} /></button>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500 uppercase">{t('booking_id_upper')}</p><p className="font-medium">#{selectedSlot.id}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">{t('date_upper')}</p><p className="font-medium">{selectedSlot.booking_date}</p></div>
                {selectedSlot.start_time && (
                  <div className="col-span-2"><p className="text-xs text-gray-500 uppercase">Selected Time Slot</p><p className="font-medium text-primary-700">{selectedSlot.start_time} - {selectedSlot.end_time}</p></div>
                )}
                <div><p className="text-xs text-gray-500 uppercase">{t('grain_type_upper')}</p><p className="font-medium">{selectedSlot.grain_type}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">{t('quantity_upper')}</p><p className="font-medium text-green-600">{(selectedSlot.quantity_kg / 100).toFixed(1)} Qtl</p></div>
                <div><p className="text-xs text-gray-500 uppercase">{t('warehouse_upper')}</p><p className="font-medium">{selectedSlot.warehouse_name}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">{t('status_upper')}</p><span className={`badge ${statusBadge(selectedSlot.status)}`}>{selectedSlot.status}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
