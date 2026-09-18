import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import managerService from '../../services/managerService';
import adminService from '../../services/adminService';
import { Wheat, Search, CheckCircle, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import GrainSalesMobile from '../../components/mobile/GrainSalesMobile';

const GRAIN_TYPES = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Groundnut', 'Sugarcane'];

export default function GrainSalesAdmin() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    farmer_id: '',
    grain_type: 'Rice',
    grade: 'A',
    raw_material_kg: '',
    good_material_kg: '',
    wastage_kg: ''
  });

  const { data: sales = [], isLoading: loading } = useQuery({
    queryKey: ['admin-grain-sales'],
    queryFn: () => managerService.getGrainSales()
  });

  const { data: farmers = [], isLoading: farmersLoading } = useQuery({
    queryKey: ['admin-farmers'],
    queryFn: () => adminService.getFarmers()
  });

  const handleLogCrop = async (e) => {
    e.preventDefault();
    if (!form.farmer_id || !form.raw_material_kg || !form.good_material_kg) {
      return toast.error('Please fill all required fields');
    }
    
    const rawQty = parseFloat(form.raw_material_kg) || 0;
    const goodQty = parseFloat(form.good_material_kg) || 0;
    const wastageQty = parseFloat(form.wastage_kg) || 0;

    if (goodQty + wastageQty > rawQty) {
      return toast.error('Good Quantity + Wastage cannot exceed Total Raw Material');
    }

    setSaving(true);
    try {
      await managerService.procureCrop({
        farmer_id: parseInt(form.farmer_id),
        grain_type: form.grain_type,
        grade: form.grade,
        raw_material_kg: rawQty * 100,
        good_material_kg: goodQty * 100,
        wastage_kg: wastageQty * 100
      }, user?.id);
      toast.success('Crop procurement logged successfully!');
      setShowLogModal(false);
      setForm({ farmer_id: '', grain_type: 'Rice', grade: 'A', raw_material_kg: '', good_material_kg: '', wastage_kg: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-grain-sales'] });
    } catch (err) {
      toast.error(err.message || 'Failed to log crop');
    } finally {
      setSaving(false);
    }
  };

  const filtered = sales.filter(s => {
    const matchFilter = filter === 'all' || s.status === filter;
    const matchSearch = !search || s.farmer_name?.toLowerCase().includes(search.toLowerCase()) || s.grain_type?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const statusBadge = (s) => ({ received: 'badge-yellow', paid: 'badge-blue' }[s] || 'badge-gray');

  return (
    <div className="animate-fade-in">
      {/* Mobile View */}
      <div className="md:hidden">
        <GrainSalesMobile
          sales={sales}
          farmers={farmers}
          loading={loading}
          onLogCrop={async (formData) => {
            const rawQty = parseFloat(formData.raw_material_kg) || 0;
            const goodQty = parseFloat(formData.good_material_kg) || 0;
            const wastageQty = parseFloat(formData.wastage_kg) || 0;
            if (goodQty + wastageQty > rawQty) {
              return toast.error('Good Quantity + Wastage cannot exceed Total Raw Material');
            }
            setSaving(true);
            try {
              await managerService.procureCrop({
                farmer_id: parseInt(formData.farmer_id),
                grain_type: formData.grain_type,
                grade: formData.grade,
                raw_material_kg: rawQty * 100,
                good_material_kg: goodQty * 100,
                wastage_kg: wastageQty * 100
              }, user?.id);
              toast.success('Crop procurement logged successfully!');
              queryClient.invalidateQueries({ queryKey: ['admin-grain-sales'] });
            } catch (err) {
              toast.error(err.message || 'Failed to log crop');
            } finally {
              setSaving(false);
            }
          }}
          saving={saving}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="page-header flex justify-between items-center">
          <div>
            <h1 className="page-title">Crop Procurement</h1>
            <p className="page-subtitle">Log and manage crops received from farmers.</p>
          </div>
          <button onClick={() => setShowLogModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Log Received Crop
          </button>
        </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("search_farmer_grain")} className="input-field pl-10" />
        </div>
        <div className="tab-nav mb-0 flex-shrink-0">
          {['all', 'received', 'paid'].map(s => (
            <button key={s} className={`tab-btn capitalize ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-10 text-gray-400">No procurements found.</p>
          ) : filtered.map(s => (
            <button key={s.id} onClick={() => setSelectedSale(s)} className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{s.farmer_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.grain_type} · Grade {s.grade}</p>
                </div>
                <span className={`badge ${statusBadge(s.status)}`}>{s.status}</span>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{(s.good_material_kg / 100).toFixed(1)} Quintals good</span>
                <span className="font-semibold text-gray-700">₹{(s.total_amount || 0).toLocaleString('en-IN')}</span>
              </div>
            </button>
          ))}
        </div>
        {/* Desktop table */}
        <div className="hidden sm:block table-container">
          <table className="w-full min-w-[840px] table-fixed text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                <th className="w-[15%] py-3 px-3">{t("farmer")}</th>
                <th className="w-[14%] py-3 px-3 whitespace-nowrap">{t("grain_grade")}</th>
                <th className="w-[11%] py-3 px-3 whitespace-nowrap">Good Qty <span className="text-[10px] font-normal text-gray-400 lowercase">(qtl)</span></th>
                <th className="w-[10%] py-3 px-3 whitespace-nowrap">Wastage <span className="text-[10px] font-normal text-gray-400 lowercase">(qtl)</span></th>
                <th className="w-[10%] py-3 px-3 whitespace-nowrap">{t("price_per_kg", "Price/kg")}</th>
                <th className="w-[12%] py-3 px-3 whitespace-nowrap">{t("est_amount")}</th>
                <th className="w-[9%] py-3 px-2 text-center whitespace-nowrap">{t("status")}</th>
                <th className="w-[9%] py-3 px-2 text-center whitespace-nowrap">{t("date")}</th>
                <th className="w-[10%] py-3 px-2 text-center whitespace-nowrap">{t("action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10"><div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">No procurements found.</td></tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} onClick={() => setSelectedSale(s)} className="cursor-pointer hover:bg-primary-50/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-gray-800 truncate">{s.farmer_name}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-semibold text-gray-800">{s.grain_type}</span>
                      <span className="ml-1 badge bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5">{t('grade')} {s.grade}</span>
                    </td>
                    <td className="py-2.5 px-3 text-green-600 font-semibold whitespace-nowrap">{(s.good_material_kg / 100).toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-amber-600 font-semibold whitespace-nowrap">{((s.wastage_kg || 0) / 100).toFixed(1)}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">₹{parseFloat(s.price_per_kg || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-bold text-gray-900 whitespace-nowrap">₹{(s.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-2 whitespace-nowrap text-center"><span className={`badge text-[10px] px-2 py-0.5 ${statusBadge(s.status)}`}>{s.status}</span></td>
                    <td className="py-2.5 px-2 text-xs whitespace-nowrap text-center text-gray-500">{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="py-2.5 px-2 whitespace-nowrap text-center">
                      <div className="flex gap-1 items-center justify-center">
                        {s.status === 'received' && (
                          <span className="text-[11px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded">Crop Received</span>
                        )}
                        {s.status === 'paid' && (
                          <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle size={11} /> Paid
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showLogModal && (
        <div className="modal-overlay items-start pt-4 sm:items-center sm:pt-0" onClick={() => setShowLogModal(false)}>
          <div className="modal-content w-full mx-3 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><Wheat size={20} className="text-amber-600" /></div><div><h3 className="font-bold text-gray-800">Log Received Crop</h3></div></div>
              <button onClick={() => setShowLogModal(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <form id="log-crop-form" onSubmit={handleLogCrop} className="modal-body space-y-4">
              
              <div>
                <label className="label">Farmer *</label>
                <select value={form.farmer_id} onChange={e => setForm(f => ({ ...f, farmer_id: e.target.value }))} className="input-field" required>
                  <option value="">{farmersLoading ? 'Loading farmers...' : '-- Select Farmer --'}</option>
                  {farmers.filter(f => f.status === 'active').map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.phone})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Crop Type *</label>
                  <select value={form.grain_type} onChange={e => setForm(f => ({ ...f, grain_type: e.target.value }))} className="input-field" required>
                    {GRAIN_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Grade *</label>
                  <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} className="input-field" required>
                    {['A', 'B', 'C'].map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Total Raw Qty (Quintals) *</label>
                  <input type="number" value={form.raw_material_kg} onChange={e => {
                    const raw = e.target.value;
                    setForm(f => {
                      const good = parseFloat(f.good_material_kg) || 0;
                      const r = parseFloat(raw) || 0;
                      return { ...f, raw_material_kg: raw, wastage_kg: (r - good) > 0 ? (r - good).toString() : '0' };
                    });
                  }} className="input-field" placeholder="e.g. 10" required />
                </div>
                <div>
                  <label className="label">Good Qty (Quintals) *</label>
                  <input type="number" value={form.good_material_kg} onChange={e => {
                    const good = e.target.value;
                    setForm(f => {
                      const raw = parseFloat(f.raw_material_kg) || 0;
                      const g = parseFloat(good) || 0;
                      return { ...f, good_material_kg: good, wastage_kg: (raw - g) > 0 ? (raw - g).toString() : '0' };
                    });
                  }} className="input-field" placeholder="e.g. 9.5" required />
                </div>
                <div>
                  <label className="label">Wastage (Quintals)</label>
                  <input type="number" value={form.wastage_kg} onChange={e => setForm(f => ({ ...f, wastage_kg: e.target.value }))} className="input-field" placeholder="e.g. 0.5" />
                </div>
              </div>

            </form>
            <div className="modal-footer">
              <button type="button" onClick={() => setShowLogModal(false)} className="btn-ghost">{t("cancel")}</button>
              <button type="submit" form="log-crop-form" disabled={saving || !form.raw_material_kg || !form.good_material_kg} className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={16} />}{saving ? t('processing') : 'Log Crop'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={() => setSelectedSale(null)}>
          <div className="bg-white w-full rounded-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Procurement Details</h3>
              <button onClick={() => setSelectedSale(null)} className="btn-icon"><X size={18} /></button>
            </div>
            {[
              ['Farmer', selectedSale.farmer_name],
              ['Crop Type', selectedSale.grain_type],
              ['Grade', `Grade ${selectedSale.grade}`],
              ['Raw Material', `${(selectedSale.raw_material_kg / 100).toFixed(1)} Quintals`],
              ['Good Qty', `${(selectedSale.good_material_kg / 100).toFixed(1)} Quintals`],
              ['Wastage', `${((selectedSale.wastage_kg || 0) / 100).toFixed(1)} Quintals`],
              ['Est. Amount', `₹${(selectedSale.total_amount || 0).toLocaleString('en-IN')}`],
              ['Date', new Date(selectedSale.created_at).toLocaleDateString('en-IN')],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Status</span>
              <span className={`badge ${statusBadge(selectedSale.status)}`}>{selectedSale.status}</span>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
