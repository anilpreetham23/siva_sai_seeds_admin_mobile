import React, { useState } from 'react';
import MobileEmptyState from './MobileEmptyState';
import { Sprout, Search, Plus, Edit2, Trash2 } from 'lucide-react';

export default function MarketRatesMobile({
  groupedRates = {},
  loading = false,
  onOpenAdd,
  onOpenEdit,
  onDeleteRate,
  isSuperAdmin = false,
}) {
  const [search, setSearch] = useState('');

  const cropKeys = Object.keys(groupedRates).filter((crop) =>
    crop.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-24 px-4 pt-3 flex flex-col gap-4 font-manrope">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">
            Live mandi prices
          </div>
          <h1 className="font-fraunces text-[22px] font-extrabold text-[var(--text)] tracking-tight">
            Market Rates
          </h1>
        </div>
        {isSuperAdmin && (
          <button
            onClick={onOpenAdd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--canopy-deep)] text-white text-[12.5px] font-bold shadow-sm active:scale-95 transition-transform"
          >
            <Plus size={15} />
            Set Rate
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search crop or commodity..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--line)] bg-white text-[13.5px] focus:outline-none focus:ring-2 focus:ring-[var(--canopy-leaf)] transition-all"
        />
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
      </div>

      {/* Commodity Cards */}
      <div className="flex flex-col gap-3.5">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-[var(--canopy-leaf)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cropKeys.length === 0 ? (
          <MobileEmptyState
            title="No market rates"
            subtitle="No commodity prices recorded at the moment."
          />
        ) : (
          cropKeys.map((crop) => {
            const cropRates = groupedRates[crop] || [];
            const sortedRates = [...cropRates].sort((a, b) => a.grade.localeCompare(b.grade));

            return (
              <div
                key={crop}
                className="p-4 rounded-2xl bg-white border border-[var(--line)] shadow-sm flex flex-col gap-3 font-manrope"
              >
                {/* Crop Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#16A34A] flex items-center justify-center flex-shrink-0">
                      <Sprout size={20} />
                    </div>
                    <h3 className="font-fraunces text-[18px] font-extrabold text-[var(--text)]">
                      {crop}
                    </h3>
                  </div>
                </div>

                {/* Grade Strips */}
                <div className="flex flex-col gap-2">
                  {sortedRates.map((r) => {
                    const isA = r.grade === 'A';
                    const isB = r.grade === 'B';
                    const badgeBg = isA
                      ? 'bg-[#D1FAE5] text-[#065F46]'
                      : isB
                      ? 'bg-[#FEF9C3] text-[#92400E]'
                      : 'bg-[var(--surface-alt)] text-[var(--text-muted)]';

                    return (
                      <div
                        key={r.id}
                        className="flex justify-between items-center bg-[#FAFAFA] border border-[var(--line-light)] rounded-xl px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${badgeBg}`}
                          >
                            Grade {r.grade}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-fraunces font-extrabold text-[15px] text-[var(--text)]">
                              ₹{r.price_per_kg}
                            </span>
                            <span className="text-[11px] font-semibold text-[var(--text-muted)] ml-1">
                              /Quintals
                            </span>
                          </div>
                          {isSuperAdmin && (
                            <div className="flex items-center gap-1 ml-1">
                              <button
                                onClick={() => onOpenEdit(r)}
                                className="p-1 rounded-lg bg-white text-[var(--text-muted)] hover:text-[#16A34A] border border-[var(--line)]"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => onDeleteRate(r.id)}
                                className="p-1 rounded-lg bg-white text-[var(--text-muted)] hover:text-red-600 border border-[var(--line)]"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
