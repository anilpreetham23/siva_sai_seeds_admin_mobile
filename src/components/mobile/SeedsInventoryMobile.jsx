import React, { useState } from 'react';
import MobileStatusPill from './MobileStatusPill';
import MobileSheet from './MobileSheet';
import MobileEmptyState from './MobileEmptyState';
import { Package, Search, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';

export default function SeedsInventoryMobile({
  seeds = [],
  loading = false,
  onOpenAdd,
  onOpenEdit,
  onDeleteSeed,
}) {
  const [search, setSearch] = useState('');

  const filtered = seeds.filter(
    (s) =>
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      (s.variety || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-24 px-4 pt-3 flex flex-col gap-4 font-manrope">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-fraunces text-[22px] font-extrabold text-[var(--text)] tracking-tight">
            Seeds Inventory
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] font-medium">
            Manage seed stock, pricing & warehouses
          </p>
        </div>
        <button
          onClick={onOpenAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--canopy-deep)] text-white text-[12.5px] font-bold shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={15} />
          Add Seed
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search seeds..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--line)] bg-white text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[var(--canopy-leaf)] transition-all"
        />
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
      </div>

      {/* Seed Cards */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-[var(--canopy-leaf)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <MobileEmptyState
            title="No seeds found"
            subtitle="Try changing the search query or add a new seed."
          />
        ) : (
          filtered.map((s) => {
            const stockQtl = (s.stock_kg / 100).toLocaleString('en-IN');
            const holdQtl = ((s.on_hold_kg || 0) / 100).toLocaleString('en-IN');
            const isLow = s.stock_kg < 500;

            return (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-white border border-[var(--line)] shadow-sm font-manrope"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[15px] font-extrabold text-[var(--text)]">
                      {s.name}
                    </h3>
                    <p className="text-[12px] text-[var(--text-muted)] font-medium mt-0.5">
                      {s.variety || 'Certified Variety'}
                    </p>
                  </div>
                  <MobileStatusPill
                    status={s.is_active ? 'good' : 'neutral'}
                    label={s.is_active ? 'Active' : 'Inactive'}
                  />
                </div>

                {/* Stock & Price Metric Strip */}
                <div className="flex items-center gap-3.5 flex-wrap mt-3 pt-2.5 border-t border-[var(--line-light)] text-[12.5px]">
                  <span className="font-extrabold text-[var(--canopy-deep)] text-[13px]">
                    ₹{s.price_per_kg}/kg
                  </span>
                  <span
                    className={`font-semibold ${
                      isLow ? 'text-red-600 font-bold flex items-center gap-1' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {stockQtl} Qtl stock
                    {isLow && (
                      <span className="bg-[#FFEBEE] text-[#E53935] px-1.5 py-0.2 rounded text-[10px] font-extrabold">
                        LOW
                      </span>
                    )}
                  </span>
                  <span className="font-semibold text-amber-600">
                    {holdQtl} Qtl on hold
                  </span>
                </div>

                {/* Warehouses list chips */}
                {s.warehouses && s.warehouses.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                    {s.warehouses.map((w) => (
                      <span
                        key={w.id}
                        className="bg-[#E3F2FD] text-[#1565C0] px-2 py-0.5 rounded-lg text-[11px] font-bold"
                      >
                        {w.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--line-light)] justify-end">
                  <button
                    onClick={() => onOpenEdit(s)}
                    className="p-2 rounded-xl bg-[#E3F2FD] text-[#1976D2] active:scale-95 transition-transform"
                    title="Edit Seed"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteSeed(s)}
                    className="p-2 rounded-xl bg-[#FFEBEE] text-[#D32F2F] active:scale-95 transition-transform"
                    title="Delete Seed"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
