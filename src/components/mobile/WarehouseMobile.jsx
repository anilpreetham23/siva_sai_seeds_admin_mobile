import React, { useState } from 'react';
import MobileStatusPill from './MobileStatusPill';
import MobileSheet from './MobileSheet';
import MobileEmptyState from './MobileEmptyState';
import { Warehouse as WarehouseIcon, Plus, PackageSearch, Calendar, Clock, Edit2 } from 'lucide-react';

export default function WarehouseMobile({
  warehouses = [],
  loading = false,
  selectedInventory,
  onSelectWarehouse,
  slots = [],
  onOpenAddWarehouse,
  onOpenEditWarehouse,
  onOpenAddInv,
  onOpenAddSlot,
  isAdmin = false,
}) {
  const [detailWarehouse, setDetailWarehouse] = useState(null);

  const handleCardClick = (w) => {
    setDetailWarehouse(w);
    if (onSelectWarehouse) onSelectWarehouse(w);
  };

  return (
    <div className="pb-24 px-4 pt-3 flex flex-col gap-4 font-manrope">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-fraunces text-[22px] font-extrabold text-[var(--text)] tracking-tight">
            Warehouse
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] font-medium">
            Storage locations & capacity
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={onOpenAddWarehouse}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--canopy-deep)] text-white text-[12.5px] font-bold shadow-sm active:scale-95 transition-transform"
          >
            <Plus size={15} />
            Add Warehouse
          </button>
        )}
      </div>

      {/* Warehouse Cards */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-[var(--canopy-leaf)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : warehouses.length === 0 ? (
          <MobileEmptyState
            title="No warehouses"
            subtitle="No warehouse storage facilities on file."
          />
        ) : (
          warehouses.map((w) => {
            const usedQtl = Math.round((w.current_load_kg || 0) / 100);
            const capQtl = Math.round((w.total_capacity_kg || 1) / 100);
            const pct = Math.min(100, Math.round((w.current_load_kg / (w.total_capacity_kg || 1)) * 100));
            const isFull = pct >= 90;

            return (
              <div
                key={w.id}
                onClick={() => handleCardClick(w)}
                className="p-4 rounded-2xl bg-white border border-[var(--line)] shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F4F2F7] flex items-center justify-center text-[#6B4C9A]">
                      <WarehouseIcon size={18} />
                    </div>
                    <div>
                      <h3 className="text-[14.5px] font-extrabold text-[var(--text)]">
                        {w.name}
                      </h3>
                      <p className="text-[12px] text-[var(--text-muted)] font-medium mt-0.5">
                        {w.address || 'Central Storage'}
                      </p>
                    </div>
                  </div>
                  <MobileStatusPill
                    status={isFull ? 'warn' : 'good'}
                    label={isFull ? 'Near Full' : 'Active'}
                  />
                </div>

                {/* Progress Bar */}
                <div className="mt-3.5">
                  <div className="w-full h-2 rounded-full bg-[var(--surface-alt)] overflow-hidden border border-[var(--line-light)]">
                    <div
                      className={`h-full transition-all rounded-full ${
                        isFull
                          ? 'bg-red-500'
                          : pct > 70
                          ? 'bg-amber-500'
                          : 'bg-[#16A34A]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11.5px] font-bold text-[var(--text-muted)] mt-1.5">
                    <span>{usedQtl.toLocaleString('en-IN')} / {capQtl.toLocaleString('en-IN')} Qtl capacity</span>
                    <span className="font-extrabold text-[var(--text)]">{pct}% used</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Warehouse Detail Bottom Sheet */}
      <MobileSheet
        isOpen={!!detailWarehouse}
        onClose={() => setDetailWarehouse(null)}
        title="Warehouse Inventory"
      >
        {detailWarehouse && (
          <div className="space-y-4 pt-1 font-manrope">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-extrabold text-[var(--text)]">
                  {detailWarehouse.name}
                </h2>
                <p className="text-[12px] text-[var(--text-muted)] font-medium mt-0.5">
                  {detailWarehouse.address}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => {
                    if (onOpenEditWarehouse) onOpenEditWarehouse(detailWarehouse);
                    setDetailWarehouse(null);
                  }}
                  className="p-2 rounded-xl bg-[var(--surface-alt)] text-[var(--text)] active:scale-95 transition-transform"
                >
                  <Edit2 size={15} />
                </button>
              )}
            </div>

            {/* Capacity Meter */}
            <div className="p-3.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)]">
              <div className="flex justify-between text-[12.5px] font-bold text-[var(--text)] mb-1.5">
                <span>Storage Utilization</span>
                <span>
                  {Math.round(
                    (detailWarehouse.current_load_kg / (detailWarehouse.total_capacity_kg || 1)) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white overflow-hidden border border-[var(--line)]">
                <div
                  className="h-full bg-[var(--canopy-deep)] rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (detailWarehouse.current_load_kg /
                        (detailWarehouse.total_capacity_kg || 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[var(--text-muted)] font-bold mt-1.5">
                <span>Used: {(detailWarehouse.current_load_kg / 100).toFixed(1)} Qtl</span>
                <span>Total: {(detailWarehouse.total_capacity_kg / 100).toFixed(1)} Qtl</span>
              </div>
            </div>

            {/* Inventory List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[13px] font-extrabold text-[var(--text)] flex items-center gap-1.5">
                  <PackageSearch size={15} className="text-[var(--canopy-deep)]" />
                  Grain Stored
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (onOpenAddInv) onOpenAddInv();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[var(--canopy-deep)] text-white text-[11px] font-bold active:scale-95"
                  >
                    + Add Inv
                  </button>
                  <button
                    onClick={() => {
                      if (onOpenAddSlot) onOpenAddSlot();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[var(--admin-navy)] text-white text-[11px] font-bold active:scale-95"
                  >
                    + Add Slot
                  </button>
                </div>
              </div>

              {detailWarehouse.inventory && detailWarehouse.inventory.length > 0 ? (
                <div className="space-y-2">
                  {detailWarehouse.inventory.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl border border-[var(--line)] bg-white flex items-center justify-between"
                    >
                      <div>
                        <div className="font-extrabold text-[13.5px] text-[var(--text)]">
                          {inv.grain_type}
                        </div>
                        <div className="text-[10.5px] text-[var(--text-muted)] font-medium mt-0.5">
                          Updated: {new Date(inv.last_updated).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-fraunces font-extrabold text-[15px] text-[#16A34A]">
                          {(inv.quantity_kg / 100).toFixed(1)} Qtl
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[var(--text-muted)] py-3 text-center bg-white rounded-xl border border-[var(--line-light)]">
                  No grains recorded in this warehouse.
                </p>
              )}
            </div>
          </div>
        )}
      </MobileSheet>
    </div>
  );
}
