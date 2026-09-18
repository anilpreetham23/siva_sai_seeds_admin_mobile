import React, { useState } from 'react';
import MobileStatusPill from './MobileStatusPill';
import MobileSheet from './MobileSheet';
import MobileEmptyState from './MobileEmptyState';
import { Search, Filter, ShoppingBag, Download, CheckCircle, Calendar, Warehouse as WarehouseIcon } from 'lucide-react';

export default function FarmerSeedPurchaseMobile({
  seeds = [],
  purchases = [],
  warehouses = [],
  loading = false,
  onBuySeed,
  onDownloadInvoice,
  saving = false,
}) {
  const [activeTab, setActiveTab] = useState('browse');
  const [search, setSearch] = useState('');
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [showOrderSheet, setShowOrderSheet] = useState(false);

  // Order form
  const [orderForm, setOrderForm] = useState({
    quantity_kg: '1',
    warehouse_id: '',
    payment_method: 'warehouse',
    pickup_date: new Date().toISOString().split('T')[0],
  });

  const filteredSeeds = seeds.filter(
    (s) =>
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      (s.variety || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenPurchase = (seed) => {
    const qty = quantities[seed.id] || '1';
    setSelectedSeed(seed);
    setOrderForm((prev) => ({
      ...prev,
      quantity_kg: qty,
      warehouse_id: warehouses[0]?.id ? String(warehouses[0].id) : '',
    }));
    setShowOrderSheet(true);
  };

  const handleConfirmPurchase = async (e) => {
    e.preventDefault();
    if (!selectedSeed || !orderForm.quantity_kg) return;
    await onBuySeed({
      seed_id: selectedSeed.id,
      quantity_kg: parseFloat(orderForm.quantity_kg),
      payment_method: orderForm.payment_method,
      warehouse_id: orderForm.warehouse_id ? parseInt(orderForm.warehouse_id) : null,
      pickup_date: orderForm.pickup_date,
    });
    setShowOrderSheet(false);
  };

  return (
    <div className="pb-24 px-4 pt-3 flex flex-col gap-4 font-manrope">
      {/* Header */}
      <div>
        <h1 className="font-fraunces text-[22px] font-extrabold text-[var(--text)] tracking-tight">
          Seed Purchase
        </h1>
        <p className="text-[12px] text-[var(--text-muted)] font-medium">
          Certified seeds store & order history
        </p>
      </div>

      {/* Tabs: Browse Seeds vs Purchase History */}
      <div className="flex border-b border-[var(--line)]">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex-1 text-center py-2.5 text-[13px] font-extrabold transition-all border-b-2 ${
            activeTab === 'browse'
              ? 'text-[var(--forest)] border-[var(--forest)]'
              : 'text-[var(--text-faint)] border-transparent'
          }`}
        >
          Browse Seeds
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 text-center py-2.5 text-[13px] font-extrabold transition-all border-b-2 ${
            activeTab === 'history'
              ? 'text-[var(--forest)] border-[var(--forest)]'
              : 'text-[var(--text-faint)] border-transparent'
          }`}
        >
          Purchase History ({purchases.length})
        </button>
      </div>

      {activeTab === 'browse' ? (
        <div className="flex flex-col gap-4">
          {/* Search Box */}
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

          {/* Seeds List */}
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-3 border-[var(--canopy-leaf)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredSeeds.length === 0 ? (
              <MobileEmptyState
                title="No seeds available"
                subtitle="Try searching with a different term."
              />
            ) : (
              filteredSeeds.map((s) => {
                const currentQty = quantities[s.id] || '1';
                const originalPrice = Math.round(s.price_per_kg * 1.15);

                return (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-2xl bg-white border border-[var(--line)] shadow-sm flex gap-3.5 items-center font-manrope"
                  >
                    {/* Image / Thumbnail */}
                    <div className="w-20 h-24 rounded-xl bg-[#F5F5F5] flex-shrink-0 overflow-hidden flex items-center justify-center border border-[var(--line-light)]">
                      {s.image_url ? (
                        <img
                          src={s.image_url}
                          alt={s.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[28px]">🌾</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="font-extrabold text-[15px] text-[var(--text)] truncate">
                        {s.name}
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] font-medium truncate mt-0.5">
                        {s.variety || 'Certified high yield seed'}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="font-fraunces font-extrabold text-[16px] text-[var(--forest)]">
                          ₹{s.price_per_kg}
                        </span>
                        <span className="text-[12px] font-semibold text-[var(--text-faint)] line-through">
                          ₹{originalPrice}
                        </span>
                        <span className="text-[11px] font-medium text-[var(--text-muted)]">/kg</span>
                      </div>

                      {/* Qty and Purchase Row */}
                      <div className="flex items-center gap-2 mt-2.5">
                        <div className="flex-1 flex items-center bg-[var(--surface-alt)] border border-[var(--canopy-light)] rounded-lg px-2 py-1 overflow-hidden">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={currentQty}
                            onChange={(e) =>
                              setQuantities({ ...quantities, [s.id]: e.target.value })
                            }
                            className="w-full bg-transparent text-center font-extrabold text-[13px] text-[var(--canopy-deep)] outline-none border-none p-0"
                          />
                          <span className="text-[11px] font-bold text-[var(--canopy-deep)] ml-1">
                            Kg
                          </span>
                        </div>

                        <button
                          onClick={() => handleOpenPurchase(s)}
                          className="flex-1 py-1.5 rounded-lg bg-[var(--canopy-deep)] text-white text-[12.5px] font-extrabold shadow-sm active:scale-95 transition-transform"
                        >
                          Purchase
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Purchase History */
        <div className="flex flex-col gap-3">
          {purchases.length === 0 ? (
            <MobileEmptyState
              title="No purchases yet"
              subtitle="Your seed orders will appear here once booked."
            />
          ) : (
            purchases.map((p) => {
              const isPaid = p.payment_status === 'paid';
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-white border border-[var(--line)] shadow-sm flex flex-col gap-2 font-manrope"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[var(--admin-navy)] bg-[var(--surface-alt)] px-2 py-0.5 rounded">
                        {p.invoice_number || `ORD-${p.id}`}
                      </span>
                      <h3 className="font-extrabold text-[14.5px] text-[var(--text)] mt-1">
                        {p.seed_name}
                      </h3>
                      <p className="text-[11.5px] text-[var(--text-muted)] font-medium">
                        {p.quantity_kg} Kg · ₹{p.price_per_kg}/kg
                      </p>
                    </div>
                    <MobileStatusPill
                      status={isPaid ? 'good' : 'warn'}
                      label={isPaid ? 'Paid' : 'Pending'}
                    />
                  </div>

                  <div className="pt-2 border-t border-[var(--line-light)] flex items-center justify-between">
                    <span className="font-fraunces font-extrabold text-[15px] text-[var(--text)]">
                      ₹{parseFloat(p.total_amount || 0).toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => onDownloadInvoice(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-alt)] text-[var(--canopy-deep)] text-[11.5px] font-bold active:scale-95 transition-transform"
                    >
                      <Download size={13} />
                      Invoice
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Order Confirmation Sheet */}
      <MobileSheet
        isOpen={showOrderSheet}
        onClose={() => setShowOrderSheet(false)}
        title="Confirm Seed Order"
      >
        {selectedSeed && (
          <form onSubmit={handleConfirmPurchase} className="space-y-4 pt-1 font-manrope">
            <div className="p-3.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-[15px] text-[var(--text)]">
                  {selectedSeed.name}
                </h4>
                <p className="text-[11.5px] text-[var(--text-muted)] font-medium">
                  {selectedSeed.variety || 'Certified variety'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[var(--text-muted)] font-bold">Rate</div>
                <div className="font-fraunces font-extrabold text-[15px] text-[var(--forest)]">
                  ₹{selectedSeed.price_per_kg}/kg
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                  Quantity (Kg)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={orderForm.quantity_kg}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, quantity_kg: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white font-extrabold"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={orderForm.pickup_date}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, pickup_date: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
                  required
                />
              </div>
            </div>

            {warehouses.length > 0 && (
              <div>
                <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                  Select Warehouse Pickup
                </label>
                <select
                  value={orderForm.warehouse_id}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, warehouse_id: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} — {w.address}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                Payment Option
              </label>
              <select
                value={orderForm.payment_method}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, payment_method: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              >
                <option value="warehouse">Pay at Warehouse Upon Pickup</option>
                <option value="upi">UPI / Online</option>
                <option value="cash">Cash on Delivery</option>
              </select>
            </div>

            {/* Total Price preview */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-[#F0FDF4] border border-[#CDEBD6] text-[13px]">
              <span className="font-extrabold text-[var(--text)]">Total Estimated Due:</span>
              <span className="font-fraunces font-extrabold text-[18px] text-[var(--canopy-deep)]">
                ₹
                {(
                  parseFloat(orderForm.quantity_kg || 0) * selectedSeed.price_per_kg
                ).toLocaleString('en-IN')}
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-[var(--canopy-deep)] text-white font-bold text-[14px] shadow-sm active:scale-98 transition-transform disabled:opacity-50"
            >
              {saving ? 'Placing Order...' : 'Confirm & Place Order'}
            </button>
          </form>
        )}
      </MobileSheet>
    </div>
  );
}
