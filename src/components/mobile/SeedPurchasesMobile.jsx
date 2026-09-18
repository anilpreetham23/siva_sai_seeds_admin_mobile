import React, { useState } from 'react';
import MobileStatusPill from './MobileStatusPill';
import MobileSheet from './MobileSheet';
import MobileEmptyState from './MobileEmptyState';
import { Phone, Check, X, ArrowLeft, Download } from 'lucide-react';

function initials(name) {
  if (!name) return 'F';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function SeedPurchasesMobile({
  purchases = [],
  loading = false,
  onApproveReject,
  actionLoading,
  onDownloadInvoice,
}) {
  const [filter, setFilter] = useState('all');
  const [selectedReq, setSelectedReq] = useState(null);

  const filterMap = {
    pending: 'pending',
    approved: 'paid',
    delivered: 'completed',
    rejected: 'failed',
  };

  const filtered = purchases.filter((p) => {
    if (filter === 'all') return true;
    const mapped = filterMap[filter] || filter;
    return p.payment_status === mapped || p.payment_status === filter;
  });

  const countPending = purchases.filter(
    (p) => p.payment_status === 'pending'
  ).length;
  const countApproved = purchases.filter(
    (p) => p.payment_status === 'paid' || p.payment_status === 'approved'
  ).length;
  const countDelivered = purchases.filter(
    (p) => p.payment_status === 'delivered' || p.payment_status === 'completed'
  ).length;
  const countRejected = purchases.filter(
    (p) => p.payment_status === 'failed' || p.payment_status === 'rejected'
  ).length;

  return (
    <div className="flex flex-col gap-4 pb-6 font-manrope">
      {/* Header */}
      <div>
        <div className="text-[11px] font-extrabold tracking-wider uppercase text-[var(--admin-navy)]">
          Manage requests
        </div>
        <div className="display text-[20px] font-bold text-[var(--text)] mt-0.5">
          Seed Purchase Requests
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4">
        {[
          { key: 'all', label: 'All', count: purchases.length },
          { key: 'pending', label: 'Pending', count: countPending },
          { key: 'approved', label: 'Approved', count: countApproved },
          { key: 'delivered', label: 'Delivered', count: countDelivered },
          { key: 'rejected', label: 'Rejected', count: countRejected },
        ].map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-[12.5px] font-bold transition-all tap-highlight ${
              filter === c.key
                ? 'bg-[var(--admin-navy-deep)] text-white shadow-sm'
                : 'bg-white border border-[var(--line)] text-[var(--text-muted)]'
            }`}
          >
            {c.label} <span className="mono opacity-70 ml-1">{c.count}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-[var(--text-muted)] text-sm">
            Loading requests...
          </div>
        ) : filtered.length === 0 ? (
          <MobileEmptyState
            title="No requests here"
            description="No seed purchase requests match this filter right now."
          />
        ) : (
          filtered.map((r) => {
            const isPending = r.payment_status === 'pending';
            const reqId = r.invoice_number || `SR-${String(r.id).padStart(4, '0')}`;
            const farmerName = r.farmer_name || 'Farmer';
            const items = `${r.seed_name} · ${(r.quantity_kg / 100).toFixed(1)} Qtl`;
            const amount = parseFloat(r.total_amount || 0);

            return (
              <div
                key={r.id}
                onClick={() => setSelectedReq(r)}
                className="bg-white border border-[var(--line)] rounded-[var(--radius-md)] p-4 flex flex-col gap-2.5 shadow-[var(--shadow-sm)] tap-highlight cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-alt)] flex items-center justify-center font-extrabold text-[13.5px] text-[var(--admin-navy-deep)] flex-shrink-0">
                      {initials(farmerName)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-extrabold text-[var(--text)] truncate">
                        {farmerName}
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)] truncate font-semibold mt-0.5">
                        {items}
                      </div>
                      <div className="text-[11px] text-[var(--text-faint)] font-bold mt-0.5">
                        Kurnool · {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : 'Recent'}
                      </div>
                    </div>
                  </div>
                  <MobileStatusPill status={r.payment_status} />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                  <span className="mono text-[15px] font-black text-[var(--text)]">
                    ₹{amount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--text-faint)]">
                    {reqId}
                  </span>
                </div>

                {isPending && (
                  <div className="flex gap-2 mt-1 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApproveReject(r.id, 'failed');
                      }}
                      disabled={actionLoading === r.id + 'failed'}
                      className="flex-1 py-2 rounded-xl border border-[var(--line)] text-[var(--text)] font-bold text-[12px] tap-highlight hover:bg-gray-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApproveReject(r.id, 'paid');
                      }}
                      disabled={actionLoading === r.id + 'paid'}
                      className="flex-1 py-2 rounded-xl bg-[var(--admin-navy)] text-white font-bold text-[12px] shadow-sm tap-highlight hover:bg-blue-900 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Detail Bottom Sheet */}
      <MobileSheet
        isOpen={Boolean(selectedReq)}
        onClose={() => setSelectedReq(null)}
        title={selectedReq?.invoice_number || `SR-${selectedReq?.id}`}
        subtitle="Seed Purchase Request Details"
        footer={
          selectedReq && (
            <div className="flex gap-2">
              {selectedReq.payment_status === 'pending' ? (
                <>
                  <button
                    onClick={() => {
                      onApproveReject(selectedReq.id, 'failed');
                      setSelectedReq(null);
                    }}
                    className="flex-1 py-3 rounded-xl border border-[var(--line)] text-[var(--text)] font-bold text-[13.5px] tap-highlight"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      onApproveReject(selectedReq.id, 'paid');
                      setSelectedReq(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-[var(--admin-navy)] text-white font-bold text-[13.5px] tap-highlight shadow-md"
                  >
                    Approve
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    if (onDownloadInvoice) onDownloadInvoice(selectedReq);
                    setSelectedReq(null);
                  }}
                  className="w-full py-3 rounded-xl bg-[var(--canopy)] text-white font-bold text-[13.5px] flex items-center justify-center gap-2 tap-highlight"
                >
                  <Download size={16} /> Download Invoice
                </button>
              )}
            </div>
          )
        }
      >
        {selectedReq && (
          <div className="space-y-4 font-manrope">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--surface-alt)] flex items-center justify-center font-black text-lg text-[var(--admin-navy-deep)]">
                {initials(selectedReq.farmer_name)}
              </div>
              <div>
                <div className="display text-[18px] font-bold text-[var(--text)]">
                  {selectedReq.farmer_name}
                </div>
                <div className="text-[12px] text-[var(--text-muted)] font-medium">
                  {selectedReq.farmer_phone || 'Phone not registered'}
                </div>
              </div>
            </div>

            {selectedReq.farmer_phone && (
              <a
                href={`tel:${selectedReq.farmer_phone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[var(--line)] text-[12.5px] font-bold text-[var(--forest)] tap-highlight"
              >
                <Phone size={15} /> Call Farmer
              </a>
            )}

            <div className="bg-white border border-[var(--line)] rounded-[18px] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[var(--text-muted)]">
                  Order Status
                </span>
                <MobileStatusPill status={selectedReq.payment_status} />
              </div>
              <div className="text-[14px] font-bold text-[var(--text)]">
                {selectedReq.seed_name} ({selectedReq.seed_variety || 'Hybrid'})
              </div>
              <div className="text-[12px] text-[var(--text-muted)] font-medium">
                Quantity: {(selectedReq.quantity_kg / 100).toFixed(2)} Quintals @ ₹
                {selectedReq.price_per_kg}/kg
              </div>
              <div className="text-[11px] text-[var(--text-faint)] font-bold pt-1">
                Requested on:{' '}
                {selectedReq.created_at
                  ? new Date(selectedReq.created_at).toLocaleDateString('en-IN')
                  : 'N/A'}
              </div>
            </div>

            <div className="flex items-center justify-between bg-white border border-[var(--line)] rounded-[18px] p-4">
              <span className="text-[13px] font-bold text-[var(--text-muted)]">
                Total Amount
              </span>
              <span className="mono text-[20px] font-black text-[var(--text)]">
                ₹{parseFloat(selectedReq.total_amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </MobileSheet>
    </div>
  );
}
