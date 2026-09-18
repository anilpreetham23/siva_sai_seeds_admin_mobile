import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import managerService from '../../services/managerService';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar, Search, CheckCircle, X, MapPin, Eye,
  AlertTriangle, Check, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import BookingSlotsMobile from '../../components/mobile/BookingSlotsMobile';

const STATUS_META = {
  pending:   { key: 'pending',   badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  approved:  { key: 'approved',  badge: 'bg-green-100 text-green-700 border border-green-200' },
  rejected:  { key: 'rejected',  badge: 'bg-red-100 text-red-600 border border-red-200' },
  completed: { key: 'completed', badge: 'bg-purple-100 text-purple-700 border border-purple-200' },
  cancelled: { key: 'cancelled', badge: 'bg-gray-100 text-gray-600 border border-gray-200' },
};

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const meta = STATUS_META[status] || { key: status, badge: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.badge}`}>
      {t(meta.key, status.charAt(0).toUpperCase() + status.slice(1))}
    </span>
  );
}

export default function BookingSlots() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch]               = useState('');
  const [filter, setFilter]               = useState('all');
  const [selectedSlot, setSelectedSlot]   = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const { data: slots = [], isLoading: loading } = useQuery({
    queryKey: ['admin-booking-slots'],
    queryFn: () => managerService.getBookingSlots(),
  });

  const handleAction = async (id, status) => {
    setActionLoading(id + status);
    try {
      await managerService.updateBookingStatus(id, status, null, user?.name, user?.id);
      toast.success(`Booking ${status}`);
      queryClient.invalidateQueries({ queryKey: ['admin-booking-slots'] });
    } catch (err) { 
      toast.error(err.message || t('action_failed')); 
    } finally { 
      setActionLoading(null); 
    }
  };

  const filtered = slots.filter((s) => {
    const matchFilter = filter === 'all' || s.status === filter;
    const matchSearch = !search
      || s.farmer_name?.toLowerCase().includes(search.toLowerCase())
      || s.grain_type?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filterTabs = ['all', 'pending', 'approved', 'rejected', 'completed', 'cancelled'];

  return (
    <div className="animate-fade-in">
      {/* Mobile View */}
      <div className="md:hidden">
        <BookingSlotsMobile
          slots={slots}
          loading={loading}
          onUpdateStatus={handleAction}
          onCreateSlot={async (slotData) => {
            try {
              toast.success('Slot scheduled successfully');
              queryClient.invalidateQueries({ queryKey: ['admin-booking-slots'] });
            } catch (err) {
              toast.error(err.message || 'Failed to create slot');
            }
          }}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('booking_slot', 'Booking Slots')}</h1>
            <p className="page-subtitle">Approve or reject farmer delivery slot requests</p>
          </div>
        </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by farmer or grain…" className="input-field pl-10" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filterTabs.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                filter === s ? 'bg-primary-600 text-white border-primary-600 shadow' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {s === 'all' ? t('all') : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Cards + Table */}
      <div className="glass-card overflow-hidden">
        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {loading
            ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
            : filtered.length === 0
              ? <p className="text-center py-10 text-gray-400 text-sm">{t('no_booking_slots_found', 'No booking slots found')}</p>
              : filtered.map((s) => (
                <div key={s.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-800">{s.farmer_name}</p>
                      <p className="text-xs text-gray-500">{s.phone}</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span><span className="font-medium">Date:</span> {s.booking_date}</span>
                    <span><span className="font-medium">Grain:</span> {s.grain_type}</span>
                    <span className="text-green-600 font-semibold">{(s.quantity_kg / 100).toFixed(1)} Qtl</span>
                  </div>
                  {s.start_time && (
                    <p className="text-xs text-primary-700 bg-primary-50 px-2 py-1 rounded inline-block font-medium">
                      Slot: {s.start_time} - {s.end_time}
                    </p>
                  )}
                  <p className="text-xs text-gray-500"><span className="font-medium">Warehouse:</span> {s.warehouse_name}</p>
                  
                  <div className="flex gap-1 flex-wrap pt-1">
                    <button onClick={() => setSelectedSlot(s)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-primary-600 hover:bg-primary-50" title={t('view_details')}><Eye size={14} /></button>
                    {s.status === 'pending' && (<>
                      <button onClick={() => handleAction(s.id, 'approved')} disabled={actionLoading === s.id + 'approved'} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50" title="Approve"><Check size={14} /></button>
                      <button onClick={() => handleAction(s.id, 'rejected')} disabled={actionLoading === s.id + 'rejected'} className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 disabled:opacity-50" title="Reject"><X size={14} /></button>
                    </>)}
                  </div>
                </div>
              ))
          }
        </div>
        {/* Desktop table */}
        <div className="hidden sm:block table-container">
          <table className="data-table">
            <thead><tr>
              <th>{t('date')}</th><th>{t('farmer')}</th><th>{t('grain_qty')}</th>
              <th>Time Slot</th><th>{t('warehouse')}</th><th>{t('status')}</th><th>{t('actions')}</th>
            </tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7} className="text-center py-10"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={7} className="text-center py-10 text-gray-400">{t('no_booking_slots_found', 'No booking slots found')}</td></tr>
                  : filtered.map((s) => (
                    <tr key={s.id}>
                      <td className="font-semibold text-gray-800">{s.booking_date}</td>
                      <td>
                        <p className="font-semibold text-gray-800">{s.farmer_name}</p>
                        <p className="text-xs text-gray-500">{s.phone}</p>
                      </td>
                      <td>
                        <p className="font-medium">{s.grain_type}</p>
                        <p className="text-xs text-green-600 font-bold">{(s.quantity_kg / 100).toFixed(1)} Qtl</p>
                      </td>
                      <td className="font-medium text-primary-700">
                        {s.start_time ? `${s.start_time} - ${s.end_time}` : '-'}
                      </td>
                      <td><p className="text-sm font-medium">{s.warehouse_name}</p></td>
                      <td><StatusBadge status={s.status} /></td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          <button onClick={() => setSelectedSlot(s)}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-primary-600 hover:bg-primary-50" title={t('view_details')}>
                            <Eye size={14} />
                          </button>

                          {s.status === 'pending' && (<>
                            <button onClick={() => handleAction(s.id, 'approved')} disabled={actionLoading === s.id + 'approved'}
                              className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50" title="Approve">
                              <Check size={14} />
                            </button>
                            <button onClick={() => handleAction(s.id, 'rejected')} disabled={actionLoading === s.id + 'rejected'}
                              className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 disabled:opacity-50" title="Reject">
                              <X size={14} />
                            </button>
                          </>)}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Slot Details Modal */}
      {selectedSlot && (
        <div className="modal-overlay items-start pt-4 sm:items-center sm:pt-0" onClick={() => setSelectedSlot(null)}>
          <div className="modal-content max-w-lg w-full mx-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-gray-800 text-lg">{t('booking_details')}</h3>
              <button onClick={() => setSelectedSlot(null)} className="btn-icon"><X size={18} /></button>
            </div>
            <div className="modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500 uppercase">Booking ID</p><p className="font-medium">#{selectedSlot.id}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Booked On</p><p className="font-medium">{new Date(selectedSlot.created_at).toLocaleString()}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Delivery Date</p><p className="font-medium">{selectedSlot.booking_date}</p></div>
                {selectedSlot.start_time && <div><p className="text-xs text-gray-500 uppercase">Selected Slot</p><p className="font-medium text-primary-700">{selectedSlot.start_time} - {selectedSlot.end_time}</p></div>}
                <div><p className="text-xs text-gray-500 uppercase">Farmer</p><p className="font-medium">{selectedSlot.farmer_name}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Phone</p><p className="font-medium">{selectedSlot.phone}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Grain Type</p><p className="font-medium">{selectedSlot.grain_type}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Total Quantity</p><p className="font-medium text-green-600">{(selectedSlot.quantity_kg / 100).toFixed(1)} Qtl</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Warehouse</p><p className="font-medium">{selectedSlot.warehouse_name}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Status</p><StatusBadge status={selectedSlot.status} /></div>
                <div className="col-span-2"><p className="text-xs text-gray-500 uppercase">Delivery Address</p><p className="font-medium text-sm">{selectedSlot.delivery_address}</p></div>
                
                {/* Procurement details inside slot viewer if procured */}
                {selectedSlot.procurement_status && selectedSlot.procurement_status !== 'pending_procurement' && (
                  <div className="col-span-2 p-3 bg-primary-50 rounded-xl border border-primary-200 mt-2 space-y-2">
                    <h4 className="font-bold text-sm text-primary-900">Procurement Record</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500 block">Received Weight</span><span className="font-semibold text-gray-800">{(parseFloat(selectedSlot.received_quantity_kg || 0) / 100).toFixed(2)} Qtl</span></div>
                      <div><span className="text-gray-500 block">Grain Quality</span><span className="font-semibold text-gray-800">{selectedSlot.grain_quality}</span></div>
                      <div><span className="text-gray-500 block">Moisture %</span><span className="font-semibold text-gray-800">{selectedSlot.moisture_pct ? `${selectedSlot.moisture_pct}%` : 'N/A'}</span></div>
                      <div><span className="text-gray-500 block">Procurement Status</span><span className="font-semibold text-gray-800">{selectedSlot.procurement_status}</span></div>
                      <div className="col-span-2"><span className="text-gray-500 block">Remarks</span><span className="font-semibold text-gray-800">{selectedSlot.procurement_remarks || 'None'}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
