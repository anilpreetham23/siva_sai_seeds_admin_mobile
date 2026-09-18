import React, { useState } from 'react';
import MobileStatusPill from './MobileStatusPill';
import MobileSheet from './MobileSheet';
import MobileEmptyState from './MobileEmptyState';
import {
  Users, Search, Plus, Phone, Mail, MapPin, CheckCircle,
  XCircle, ChevronRight, User, Eye, Trash2
} from 'lucide-react';

function initials(name) {
  if (!name) return 'F';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function FarmersMobile({
  farmers = [],
  loading = false,
  onOpenDetail,
  selectedFarmer,
  detailData,
  detailLoading,
  onCloseDetail,
  onOpenRegister,
  onApprove,
  onReject,
  onDelete,
  isSuperAdmin = false,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const activeCount = farmers.filter((f) => f.status === 'active').length;
  const pendingCount = farmers.filter((f) => f.status === 'pending').length;

  const filtered = farmers.filter((f) => {
    let matchFilter = true;
    if (filter === 'active') matchFilter = f.status === 'active';
    else if (filter === 'pending') matchFilter = f.status === 'pending';

    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      f.name?.toLowerCase().includes(q) ||
      f.phone?.includes(q) ||
      f.email?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div className="pb-24 px-4 pt-3 flex flex-col gap-4 font-manrope">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-fraunces text-[22px] font-extrabold text-[var(--text)] tracking-tight">
            Farmers
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] font-medium">
            Registered farmers & accounts
          </p>
        </div>
        <button
          onClick={onOpenRegister}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--canopy-deep)] text-white text-[12.5px] font-bold shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={15} />
          Add Farmer
        </button>
      </div>

      {/* KPI 2-Card Count */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          onClick={() => setFilter('active')}
          className={`p-3 rounded-2xl bg-white border transition-all cursor-pointer ${
            filter === 'active'
              ? 'border-[#16A34A] ring-1 ring-[#16A34A]'
              : 'border-[var(--line)] shadow-sm'
          }`}
        >
          <div className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">
            Active Farmers
          </div>
          <div className="font-fraunces text-[20px] font-extrabold text-[var(--text)] mt-1">
            {activeCount}
          </div>
        </div>

        <div
          onClick={() => setFilter('pending')}
          className={`p-3 rounded-2xl bg-white border transition-all cursor-pointer ${
            filter === 'pending'
              ? 'border-amber-500 ring-1 ring-amber-500'
              : 'border-[var(--line)] shadow-sm'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            Pending Approval
          </div>
          <div className="font-fraunces text-[20px] font-extrabold text-[var(--text)] mt-1">
            {pendingCount}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone or email..."
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
          { key: 'active', label: 'Active' },
          { key: 'pending', label: 'Pending' },
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

      {/* Farmers List */}
      <div className="flex flex-col gap-2.5">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-[var(--canopy-leaf)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <MobileEmptyState
            title="No farmers found"
            subtitle="Try changing the search or register a new farmer."
          />
        ) : (
          filtered.map((f) => (
            <div
              key={f.id}
              onClick={() => onOpenDetail(f)}
              className="p-3.5 rounded-2xl bg-white border border-[var(--line)] shadow-sm flex items-center gap-3 active:scale-[0.99] transition-transform cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-[var(--surface-sun)] text-[var(--canopy-deep)] font-extrabold text-[14px] flex items-center justify-center border border-[#E6DCC8] flex-shrink-0">
                {initials(f.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[14px] font-extrabold text-[var(--text)] truncate">
                    {f.name}
                  </h3>
                  <MobileStatusPill
                    status={f.status === 'active' ? 'good' : 'warn'}
                    label={f.status}
                  />
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)] font-medium mt-0.5">
                  <span>{f.phone}</span>
                  {f.acres_of_land > 0 && (
                    <>
                      <span>·</span>
                      <span>{f.acres_of_land} acres</span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-[var(--text-faint)] flex-shrink-0" />
            </div>
          ))
        )}
      </div>

      {/* Farmer Detail Sheet */}
      <MobileSheet
        isOpen={!!selectedFarmer}
        onClose={onCloseDetail}
        title="Farmer Profile"
      >
        {selectedFarmer && (
          <div className="space-y-4 pt-1 font-manrope">
            {/* Header Avatar Profile */}
            <div className="p-4 rounded-2xl bg-[var(--surface-alt)] border border-[var(--line)] text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--surface-sun)] text-[var(--canopy-deep)] font-fraunces font-extrabold text-[22px] flex items-center justify-center mx-auto mb-2 border border-[#E6DCC8]">
                {initials(selectedFarmer.name)}
              </div>
              <h2 className="font-fraunces text-[20px] font-extrabold text-[var(--text)]">
                {selectedFarmer.name}
              </h2>
              <p className="text-[12.5px] text-[var(--text-muted)] font-medium mt-0.5">
                {selectedFarmer.phone} · {selectedFarmer.acres_of_land || 0} acres
              </p>
              <div className="mt-2 flex justify-center">
                <MobileStatusPill
                  status={selectedFarmer.status === 'active' ? 'good' : 'warn'}
                  label={selectedFarmer.status}
                />
              </div>
            </div>

            {/* Quick Action: Call */}
            {selectedFarmer.phone && (
              <a
                href={`tel:${selectedFarmer.phone}`}
                className="w-full py-3 rounded-xl bg-[#16A34A] text-white font-bold text-[13.5px] flex items-center justify-center gap-2 active:scale-98 transition-transform shadow-sm"
              >
                <Phone size={16} />
                Call {selectedFarmer.phone}
              </a>
            )}

            {/* Details Box */}
            <div className="p-3.5 rounded-xl bg-white border border-[var(--line)] space-y-2 text-[12.5px]">
              {selectedFarmer.email && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] font-bold">Email</span>
                  <span className="font-semibold text-[var(--text)] truncate max-w-[65%]">
                    {selectedFarmer.email}
                  </span>
                </div>
              )}
              {selectedFarmer.address && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] font-bold">Address</span>
                  <span className="font-semibold text-[var(--text)] text-right max-w-[65%]">
                    {selectedFarmer.address}
                  </span>
                </div>
              )}
              {selectedFarmer.crop_address && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)] font-bold">Crop Field</span>
                  <span className="font-semibold text-[var(--text)] text-right max-w-[65%]">
                    {selectedFarmer.crop_address}
                  </span>
                </div>
              )}
            </div>

            {/* Pending actions */}
            {selectedFarmer.status === 'pending' && (
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => onApprove(selectedFarmer.id)}
                  className="flex-1 py-3 rounded-xl bg-[#16A34A] text-white font-bold text-[13.5px] flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-transform"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button
                  onClick={() => onReject(selectedFarmer.id)}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-[13.5px] flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-transform"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </MobileSheet>
    </div>
  );
}
