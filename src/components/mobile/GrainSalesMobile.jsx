import React, { useState } from 'react';
import MobileStatusPill from './MobileStatusPill';
import MobileSheet from './MobileSheet';
import MobileEmptyState from './MobileEmptyState';
import { Wheat, Search, Plus, User, CheckCircle, Clock } from 'lucide-react';

const GRAIN_TYPES = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Groundnut', 'Sugarcane'];

function formatDate(dStr) {
  if (!dStr) return '-';
  const d = new Date(dStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function GrainSalesMobile({
  sales = [],
  farmers = [],
  loading = false,
  onLogCrop,
  saving = false,
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [showLogSheet, setShowLogSheet] = useState(false);

  // Form
  const [form, setForm] = useState({
    farmer_id: '',
    grain_type: 'Rice',
    grade: 'A',
    raw_material_kg: '',
    good_material_kg: '',
    wastage_kg: '',
  });

  const filtered = sales.filter((s) => {
    let matchFilter = true;
    if (filter === 'received') {
      matchFilter = s.status === 'received' || s.status === 'pending';
    } else if (filter === 'paid') {
      matchFilter = s.status === 'paid';
    }
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      s.farmer_name?.toLowerCase().includes(q) ||
      s.grain_type?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onLogCrop(form);
    setShowLogSheet(false);
    setForm({
      farmer_id: '',
      grain_type: 'Rice',
      grade: 'A',
      raw_material_kg: '',
      good_material_kg: '',
      wastage_kg: '',
    });
  };

  return (
    <div className="pb-24 px-4 pt-3 flex flex-col gap-4 font-manrope">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-fraunces text-[22px] font-extrabold text-[var(--text)] tracking-tight">
            Crop Procurement
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] font-medium">
            Log and manage crops received from farmers
          </p>
        </div>
        <button
          onClick={() => setShowLogSheet(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--canopy-deep)] text-white text-[12.5px] font-bold shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={15} />
          Log Crop
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search farmer or grain..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--line)] bg-white text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[var(--canopy-leaf)] transition-all"
        />
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'all', label: 'All' },
          { key: 'received', label: 'Received' },
          { key: 'paid', label: 'Paid' },
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

      {/* Sales List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-[var(--canopy-leaf)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <MobileEmptyState
            title="No crops logged"
            subtitle="Nothing matches this filter right now."
          />
        ) : (
          filtered.map((s) => {
            const isPending = s.status === 'pending' || s.status === 'received';
            const goodQtl = (parseFloat(s.good_material_kg || 0) / 100).toFixed(2);
            return (
              <div
                key={s.id}
                onClick={() => setSelectedSale(s)}
                className="p-4 rounded-2xl bg-white border border-[var(--line)] shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[14.5px] font-bold text-[var(--text)]">
                      {s.farmer_name}
                    </h3>
                    <p className="text-[12px] text-[var(--text-muted)] font-medium mt-0.5">
                      {s.grain_type} · Grade {s.grade || 'A'}
                    </p>
                  </div>
                  <MobileStatusPill
                    status={isPending ? 'warn' : 'good'}
                    label={isPending ? 'received' : 'paid'}
                  />
                </div>
                <div className="mt-2.5 pt-2 border-t border-[var(--line-light)] flex items-center justify-between text-[12px]">
                  <span className="font-extrabold text-[var(--canopy-deep)]">
                    {goodQtl} Quintals good
                  </span>
                  <span className="text-[var(--text-muted)] text-[11px] font-medium">
                    {formatDate(s.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sale Details Sheet */}
      <MobileSheet
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title="Procurement Details"
      >
        {selectedSale && (
          <div className="space-y-4 pt-1 font-manrope">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-[var(--admin-navy)] bg-[var(--surface-alt)] px-3 py-1 rounded-full tracking-wider">
                ID #{selectedSale.id}
              </span>
              <MobileStatusPill
                status={
                  selectedSale.status === 'paid'
                    ? 'good'
                    : 'warn'
                }
                label={selectedSale.status === 'paid' ? 'paid' : 'received'}
              />
            </div>

            <div>
              <h2 className="text-[18px] font-extrabold text-[var(--text)]">
                {selectedSale.farmer_name}
              </h2>
              <p className="text-[12.5px] text-[var(--text-muted)] font-medium mt-0.5">
                {selectedSale.grain_type} — Grade {selectedSale.grade || 'A'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] space-y-2 text-[12.5px]">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)] font-bold">Total Raw Material</span>
                <span className="font-extrabold text-[var(--text)]">
                  {(parseFloat(selectedSale.raw_material_kg || 0) / 100).toFixed(2)} Qtl
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)] font-bold">Good Material (Net)</span>
                <span className="font-extrabold text-[#16A34A]">
                  {(parseFloat(selectedSale.good_material_kg || 0) / 100).toFixed(2)} Qtl
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)] font-bold">Wastage / Moisture</span>
                <span className="font-extrabold text-amber-700">
                  {(parseFloat(selectedSale.wastage_kg || 0) / 100).toFixed(2)} Qtl
                </span>
              </div>
              {selectedSale.total_amount && (
                <div className="flex justify-between pt-2 border-t border-[var(--line)] text-[14px]">
                  <span className="font-extrabold text-[var(--text)]">Estimated Payout</span>
                  <span className="font-fraunces font-extrabold text-[var(--canopy-deep)] text-[16px]">
                    ₹{parseFloat(selectedSale.total_amount).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </MobileSheet>

      {/* Log Crop Sheet */}
      <MobileSheet
        isOpen={showLogSheet}
        onClose={() => setShowLogSheet(false)}
        title="Log Received Crop"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1 font-manrope">
          <div>
            <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
              Select Farmer *
            </label>
            <select
              value={form.farmer_id}
              onChange={(e) => setForm({ ...form, farmer_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              required
            >
              <option value="">-- Choose Farmer --</option>
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                Grain Type *
              </label>
              <select
                value={form.grain_type}
                onChange={(e) => setForm({ ...form, grain_type: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              >
                {GRAIN_TYPES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                Quality Grade *
              </label>
              <select
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              >
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
              Total Raw Material (Quintals) *
            </label>
            <input
              type="number"
              step="0.01"
              value={form.raw_material_kg}
              onChange={(e) => setForm({ ...form, raw_material_kg: e.target.value })}
              placeholder="e.g. 50"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                Good Material (Qtl) *
              </label>
              <input
                type="number"
                step="0.01"
                value={form.good_material_kg}
                onChange={(e) => setForm({ ...form, good_material_kg: e.target.value })}
                placeholder="e.g. 48"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                Wastage (Qtl)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.wastage_kg}
                onChange={(e) => setForm({ ...form, wastage_kg: e.target.value })}
                placeholder="e.g. 2"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[var(--canopy-deep)] text-white font-bold text-[14px] shadow-sm active:scale-98 transition-transform mt-2 disabled:opacity-50"
          >
            {saving ? 'Logging Crop...' : 'Save & Log Crop'}
          </button>
        </form>
      </MobileSheet>
    </div>
  );
}
