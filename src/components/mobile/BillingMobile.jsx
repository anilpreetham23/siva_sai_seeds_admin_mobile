import React, { useState } from 'react';
import MobileStatusPill from './MobileStatusPill';
import MobileSheet from './MobileSheet';
import MobileEmptyState from './MobileEmptyState';
import {
  FileText, Search, Plus, Printer, Download, CheckCircle,
  ArrowDownRight, ArrowUpRight, DollarSign, Calendar, User
} from 'lucide-react';

function formatDate(dStr) {
  if (!dStr) return '-';
  const d = new Date(dStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BillingMobile({
  billingTx = [],
  farmers = [],
  loading = false,
  onCreateBill,
  onPrintInvoice,
  saving = false,
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  // Form State
  const [farmerSelection, setFarmerSelection] = useState('other');
  const [customName, setCustomName] = useState('');
  const [txType, setTxType] = useState('Seed Purchase');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [direction, setDirection] = useState('credit');
  const [remarks, setRemarks] = useState('');

  // Metrics
  const total = billingTx.length;
  const paid = billingTx.filter((t) => t.status === 'completed' || t.status === 'paid').length;
  const pending = billingTx.filter((t) => t.status === 'pending').length;
  const overdue = billingTx.filter((t) => t.status === 'overdue').length;

  const filtered = billingTx.filter((t) => {
    let matchFilter = true;
    if (filter === 'paid') matchFilter = t.status === 'completed' || t.status === 'paid';
    else if (filter === 'pending') matchFilter = t.status === 'pending';
    else if (filter === 'overdue') matchFilter = t.status === 'overdue';

    const q = search.toLowerCase();
    const name = (t.farmer_name || t.description || '').toLowerCase();
    const inv = (t.invoice_number || '').toLowerCase();
    const matchSearch = !search || name.includes(q) || inv.includes(q);
    return matchFilter && matchSearch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onCreateBill({
      farmerSelection,
      customName,
      txType,
      amount,
      paymentMethod,
      direction,
      remarks,
    });
    setShowAddSheet(false);
    setAmount('');
    setCustomName('');
    setRemarks('');
  };

  return (
    <div className="pb-24 px-4 pt-3 flex flex-col gap-4 font-manrope">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-fraunces text-[22px] font-extrabold text-[var(--text)] tracking-tight">
            Billing & Invoices
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] font-medium">
            Financial receipts & customer billing
          </p>
        </div>
        <button
          onClick={() => setShowAddSheet(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--canopy-deep)] text-white text-[12.5px] font-bold shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={15} />
          Add Bill
        </button>
      </div>

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-2xl bg-white border border-[var(--line)] shadow-sm">
          <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Total Invoices
          </div>
          <div className="font-fraunces text-[20px] font-extrabold text-[var(--text)] mt-1">
            {total}
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-white border border-[var(--line)] shadow-sm">
          <div className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">
            Paid
          </div>
          <div className="font-fraunces text-[20px] font-extrabold text-[#16A34A] mt-1">
            {paid}
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-white border border-[var(--line)] shadow-sm">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            Pending
          </div>
          <div className="font-fraunces text-[20px] font-extrabold text-amber-600 mt-1">
            {pending}
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-white border border-[var(--line)] shadow-sm">
          <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
            Overdue
          </div>
          <div className="font-fraunces text-[20px] font-extrabold text-red-600 mt-1">
            {overdue}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search invoices or customer..."
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
          { key: 'paid', label: 'Paid' },
          { key: 'pending', label: 'Pending' },
          { key: 'overdue', label: 'Overdue' },
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

      {/* Invoice List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-[var(--canopy-leaf)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <MobileEmptyState
            title="No invoices found"
            subtitle="Try changing your search or create a new bill."
          />
        ) : (
          filtered.map((t) => {
            const customer = t.farmer_name || (t.description?.includes('-') ? t.description.split('-')[1]?.split('(')[0]?.trim() : 'Walk-in Customer');
            const isCompleted = t.status === 'completed' || t.status === 'paid';
            const isCredit = t.direction === 'credit';

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTx(t)}
                className="p-4 rounded-2xl bg-white border border-[var(--line)] shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[var(--admin-navy)] bg-[var(--surface-alt)] px-2 py-0.5 rounded">
                      {t.invoice_number || `BILL-${t.id}`}
                    </span>
                    <h3 className="text-[14.5px] font-bold text-[var(--text)] mt-1">
                      {customer}
                    </h3>
                    <p className="text-[11.5px] text-[var(--text-muted)] font-medium mt-0.5">
                      {t.description || 'General Billing'}
                    </p>
                  </div>
                  <MobileStatusPill
                    status={isCompleted ? 'good' : t.status === 'overdue' ? 'bad' : 'warn'}
                    label={isCompleted ? 'Paid' : t.status === 'overdue' ? 'Overdue' : 'Pending'}
                  />
                </div>

                <div className="mt-3 pt-2 border-t border-[var(--line-light)] flex items-center justify-between text-[12px]">
                  <span className="text-[var(--text-muted)] text-[11.5px] font-medium">
                    {formatDate(t.created_at)}
                  </span>
                  <span className="font-fraunces font-extrabold text-[15px] text-[var(--text)]">
                    ₹{parseFloat(t.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invoice Detail Sheet */}
      <MobileSheet
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Invoice Details"
      >
        {selectedTx && (
          <div className="space-y-4 pt-1 font-manrope">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-mono font-bold text-[var(--admin-navy)] bg-[var(--surface-alt)] px-3 py-1 rounded-full">
                {selectedTx.invoice_number || `BILL-${selectedTx.id}`}
              </span>
              <MobileStatusPill
                status={selectedTx.status === 'completed' || selectedTx.status === 'paid' ? 'good' : 'warn'}
                label={selectedTx.status === 'completed' || selectedTx.status === 'paid' ? 'Paid' : 'Pending'}
              />
            </div>

            <div>
              <h2 className="text-[18px] font-extrabold text-[var(--text)]">
                {selectedTx.farmer_name || 'Walk-in Customer'}
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] font-medium mt-0.5">
                {selectedTx.description}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] space-y-2 text-[12.5px]">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)] font-bold">Transaction Type</span>
                <span className="font-extrabold text-[var(--text)] uppercase">
                  {selectedTx.direction === 'credit' ? 'Receipt / Income' : 'Payout'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)] font-bold">Payment Method</span>
                <span className="font-extrabold text-[var(--text)]">
                  {selectedTx.upi_id || 'Cash'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)] font-bold">Date</span>
                <span className="font-extrabold text-[var(--text)]">
                  {new Date(selectedTx.created_at).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[var(--line)] text-[15px]">
                <span className="font-extrabold text-[var(--text)]">Total Amount</span>
                <span className="font-fraunces font-extrabold text-[var(--canopy-deep)] text-[18px]">
                  ₹{parseFloat(selectedTx.amount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => onPrintInvoice(selectedTx)}
              className="w-full py-3 rounded-xl bg-[var(--admin-navy)] text-white font-bold text-[14px] shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-transform"
            >
              <Printer size={16} />
              Print / Save Invoice
            </button>
          </div>
        )}
      </MobileSheet>

      {/* Add Bill Sheet */}
      <MobileSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title="Create New Bill"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1 font-manrope">
          <div>
            <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
              Customer / Farmer *
            </label>
            <select
              value={farmerSelection}
              onChange={(e) => setFarmerSelection(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              required
            >
              <option value="other">-- Walk-in Customer --</option>
              {farmers.filter((f) => f.status === 'active').map((f) => (
                <option key={f.id} value={f.id.toString()}>
                  {f.name} ({f.phone})
                </option>
              ))}
            </select>
          </div>

          {farmerSelection === 'other' && (
            <div>
              <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                Transaction Type
              </label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              >
                <option value="Seed Purchase">Seed Purchase</option>
                <option value="Crop Procurement">Crop Procurement</option>
                <option value="Equipment Rental">Equipment Rental</option>
                <option value="Service Fee">Service Fee</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / Online</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit">Credit (Pending)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
              Remarks (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. 2 bags certified paddy"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[var(--canopy-deep)] text-white font-bold text-[14px] shadow-sm active:scale-98 transition-transform mt-2 disabled:opacity-50"
          >
            {saving ? 'Creating Bill...' : 'Create & Generate Bill'}
          </button>
        </form>
      </MobileSheet>
    </div>
  );
}
