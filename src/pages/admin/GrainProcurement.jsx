import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import managerService from '../../services/managerService';
import { useAuth } from '../../context/AuthContext';
import {
  Wheat, Search, ClipboardCheck, X, AlertTriangle, ShieldCheck, MapPin, Eye, Info, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function GrainProcurement() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [grainFilter, setGrainFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [procureBooking, setProcureBooking] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    received_quantity: '',
    moisture_pct: '',
    remarks: '',
    quality: 'Good',
    procurement_status: 'Received'
  });

  const { data: bookings = [], isLoading: loading } = useQuery({
    queryKey: ['admin-booking-slots'],
    queryFn: () => managerService.getBookingSlots(),
  });

  // Filter only approved booking slots awaiting procurement (status is approved)
  const approvedBookings = bookings.filter(b => b.status === 'approved');

  const filtered = approvedBookings.filter(b => {
    const matchSearch = !search ||
      b.farmer_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.farmer_id?.toString().includes(search) ||
      b.phone?.includes(search);
    const matchGrain = grainFilter === 'all' || b.grain_type === grainFilter;
    return matchSearch && matchGrain;
  });

  const grainTypes = [...new Set(approvedBookings.map(b => b.grain_type))];

  const handleOpenProcure = (booking) => {
    setProcureBooking(booking);
    setForm({
      received_quantity: (booking.quantity_kg / 100).toFixed(2), // autofill with requested qty in Quintals
      moisture_pct: '',
      remarks: '',
      quality: 'Good',
      procurement_status: 'Received'
    });
  };

  const handleProcureSubmit = async (e) => {
    e.preventDefault();
    if (!form.received_quantity || parseFloat(form.received_quantity) < 0) {
      return toast.error('Please enter a valid received quantity');
    }

    setSaving(true);
    try {
      await managerService.procureGrainBooking({
        slot_id: procureBooking.id,
        received_qty_kg: parseFloat(form.received_quantity) * 100, // convert back to kg
        moisture_pct: form.moisture_pct ? parseFloat(form.moisture_pct) : null,
        remarks: form.remarks,
        quality: form.quality,
        procurement_status: form.procurement_status
      }, user?.id, user?.name);

      toast.success('Procurement completed successfully!');
      setProcureBooking(null);
      queryClient.invalidateQueries({ queryKey: ['admin-booking-slots'] });
    } catch (err) {
      toast.error(err.message || 'Procurement failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Grain Procurement</h1>
          <p className="page-subtitle">Inspect and receive grains for approved farmer slot bookings</p>
        </div>
      </div>

      {/* Stats Summary Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5 flex items-center justify-between border-l-4 border-l-primary-500">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Awaiting Delivery</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">{approvedBookings.length}</p>
          </div>
          <Wheat size={24} className="text-primary-500" />
        </div>
        <div className="glass-card p-5 flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Total Weight Booked</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {(approvedBookings.reduce((sum, b) => sum + (b.quantity_kg || 0), 0) / 100).toFixed(1)} Qtl
            </p>
          </div>
          <Info size={24} className="text-blue-500" />
        </div>
        <div className="glass-card p-5 flex items-center justify-between border-l-4 border-l-purple-500">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Unique Farmers</h3>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {[...new Set(approvedBookings.map(b => b.farmer_id))].length}
            </p>
          </div>
          <ShieldCheck size={24} className="text-purple-500" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by farmer name, ID or mobile..."
            className="input-field pl-10"
          />
        </div>
        <select
          value={grainFilter}
          onChange={e => setGrainFilter(e.target.value)}
          className="input-field w-full sm:w-48"
        >
          <option value="all">All Crops</option>
          {grainTypes.map(gt => (
            <option key={gt} value={gt}>{gt}</option>
          ))}
        </select>
      </div>

      {/* Procurement Grid */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">
            No approved bookings awaiting procurement match the criteria.
          </p>
        ) : (
          <>
            {/* Mobile View */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filtered.map(b => (
                <div key={b.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{b.farmer_name}</h4>
                      <p className="text-xs text-gray-500">ID: #{b.farmer_id} · Mobile: {b.phone}</p>
                    </div>
                    <span className="badge badge-green">Approved</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl">
                    <div><span className="font-medium">Crop:</span> {b.grain_type}</div>
                    <div><span className="font-medium">Booked:</span> {(b.quantity_kg / 100).toFixed(1)} Qtl</div>
                    <div><span className="font-medium">Warehouse:</span> {b.warehouse_name}</div>
                    <div><span className="font-medium">Date:</span> {b.booking_date}</div>
                  </div>
                  {b.start_time && (
                    <p className="text-xs text-primary-700 bg-primary-50 px-2 py-1 rounded inline-block font-semibold">
                      Slot: {b.start_time} - {b.end_time}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="p-2 rounded-xl bg-gray-100 text-gray-600 flex-1 flex justify-center items-center"
                    >
                      <Eye size={15} className="mr-1" /> View Details
                    </button>
                    <button
                      onClick={() => handleOpenProcure(b)}
                      className="btn-primary py-2 flex-1 flex justify-center items-center text-xs font-semibold"
                    >
                      <ClipboardCheck size={15} className="mr-1" /> Receive Grain
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Farmer ID / Name</th>
                    <th>Mobile</th>
                    <th>Crop</th>
                    <th>Quantity (Qtl)</th>
                    <th>Warehouse</th>
                    <th>Date / Approved Slot</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id}>
                      <td>
                        <p className="font-semibold text-gray-800">{b.farmer_name}</p>
                        <span className="text-[10px] text-gray-400">ID: #{b.farmer_id}</span>
                      </td>
                      <td>{b.phone}</td>
                      <td className="font-semibold text-primary-700">{b.grain_type}</td>
                      <td className="font-bold">{(b.quantity_kg / 100).toFixed(1)} Qtl</td>
                      <td>{b.warehouse_name}</td>
                      <td>
                        <p className="font-medium text-gray-800">{b.booking_date}</p>
                        <span className="text-xs text-primary-600 block">{b.start_time ? `${b.start_time} - ${b.end_time}` : ''}</span>
                      </td>
                      <td>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-all"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenProcure(b)}
                            className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1"
                          >
                            <ClipboardCheck size={14} /> Receive Grain
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="modal-overlay items-start pt-4 sm:items-center sm:pt-0" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content max-w-md w-full mx-3" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-gray-800 text-lg">Booking Details</h3>
              <button onClick={() => setSelectedBooking(null)} className="btn-icon"><X size={18} /></button>
            </div>
            <div className="modal-body space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-gray-400 block uppercase">Booking ID</span><span className="font-medium">#{selectedBooking.id}</span></div>
                <div><span className="text-xs text-gray-400 block uppercase">Status</span><span className="badge badge-green">Approved</span></div>
                <div><span className="text-xs text-gray-400 block uppercase">Farmer</span><span className="font-semibold">{selectedBooking.farmer_name}</span></div>
                <div><span className="text-xs text-gray-400 block uppercase">Mobile</span><span>{selectedBooking.phone}</span></div>
                <div><span className="text-xs text-gray-400 block uppercase">Crop</span><span className="font-semibold text-primary-700">{selectedBooking.grain_type}</span></div>
                <div><span className="text-xs text-gray-400 block uppercase">Requested Weight</span><span className="font-bold">{(selectedBooking.quantity_kg / 100).toFixed(1)} Qtl</span></div>
                <div><span className="text-xs text-gray-400 block uppercase">Warehouse</span><span>{selectedBooking.warehouse_name}</span></div>
                <div><span className="text-xs text-gray-400 block uppercase">Pickup Date</span><span>{selectedBooking.booking_date}</span></div>
                {selectedBooking.start_time && (
                  <div className="col-span-2"><span className="text-xs text-gray-400 block uppercase">Approved Time Slot</span><span className="font-medium text-primary-600">{selectedBooking.start_time} - {selectedBooking.end_time}</span></div>
                )}
                <div className="col-span-2"><span className="text-xs text-gray-400 block uppercase">Delivery Address</span><p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">{selectedBooking.delivery_address || 'TBD'}</p></div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setSelectedBooking(null)} className="btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Grain Procurement Receipt Form Modal */}
      {procureBooking && (
        <div className="modal-overlay items-start pt-4 sm:items-center sm:pt-0" onClick={() => !saving && setProcureBooking(null)}>
          <div className="modal-content max-w-md w-full mx-3" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-xl">🌾</div>
                <div>
                  <h3 className="font-bold text-gray-800">Grain Receipt Form</h3>
                  <p className="text-xs text-gray-500">{procureBooking.farmer_name} · Booking #{procureBooking.id}</p>
                </div>
              </div>
              {!saving && <button onClick={() => setProcureBooking(null)} className="btn-icon"><X size={18} /></button>}
            </div>

            <form onSubmit={handleProcureSubmit} className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Actual Received Qty (Quintals) *</label>
                  <input
                    type="number"
                    value={form.received_quantity}
                    onChange={e => setForm(f => ({ ...f, received_quantity: e.target.value }))}
                    className="input-field font-semibold"
                    min="0"
                    step="0.01"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Booked: {(procureBooking.quantity_kg / 100).toFixed(2)} Qtl</p>
                </div>
                <div>
                  <label className="label">Moisture % (Optional)</label>
                  <input
                    type="number"
                    value={form.moisture_pct}
                    onChange={e => setForm(f => ({ ...f, moisture_pct: e.target.value }))}
                    className="input-field"
                    placeholder="e.g. 12%"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Quality Grade *</label>
                  <select
                    value={form.quality}
                    onChange={e => setForm(f => ({ ...f, quality: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="Good">Good (Grade A)</option>
                    <option value="Average">Average (Grade B)</option>
                    <option value="Bad">Bad (Grade C)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Procurement Status *</label>
                  <select
                    value={form.procurement_status}
                    onChange={e => setForm(f => ({ ...f, procurement_status: e.target.value }))}
                    className="input-field"
                    required
                  >
                    <option value="Received">Received</option>
                    <option value="Partial Receipt">Partial Receipt</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Procurement Remarks / Notes</label>
                <textarea
                  value={form.remarks}
                  onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Enter moisture, grain condition or reason for rejection/partial receipt..."
                />
              </div>
            </form>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setProcureBooking(null)}
                className="btn-ghost"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleProcureSubmit}
                disabled={saving || !form.received_qty}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                {saving ? 'Saving...' : 'Submit Procurement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
