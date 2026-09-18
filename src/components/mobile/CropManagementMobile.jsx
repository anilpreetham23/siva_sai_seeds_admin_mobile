import React, { useState } from 'react';
import MobileStatusPill from './MobileStatusPill';
import MobileSheet from './MobileSheet';
import MobileEmptyState from './MobileEmptyState';
import { Sprout, Plus, Calendar, Check, AlertCircle } from 'lucide-react';

const CROP_TYPES = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Groundnut', 'Sugarcane', 'Turmeric', 'Chili', 'Other'];

export default function CropManagementMobile({
  crops = [],
  visits = [],
  loading = false,
  onRegisterCrop,
  saving = false,
}) {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [form, setForm] = useState({
    crop_type: 'Rice',
    custom_crop_type: '',
    acres: '',
    sowing_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cropType = form.crop_type === 'Other' ? form.custom_crop_type.trim() : form.crop_type;
    if (!cropType || !form.acres) return;
    await onRegisterCrop({
      crop_type: cropType,
      acres: parseFloat(form.acres),
      sowing_date: form.sowing_date,
    });
    setShowAddSheet(false);
    setForm({
      crop_type: 'Rice',
      custom_crop_type: '',
      acres: '',
      sowing_date: new Date().toISOString().split('T')[0],
    });
  };

  const getVisitsForCrop = (cropId) => visits.filter((v) => v.crop_id === cropId);

  return (
    <div className="pb-24 px-4 pt-3 flex flex-col gap-4 font-manrope">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-fraunces text-[22px] font-extrabold text-[var(--text)] tracking-tight">
            Crops & Cycles
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] font-medium">
            Manage your registered crops & stages
          </p>
        </div>
        <button
          onClick={() => setShowAddSheet(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--canopy-deep)] text-white text-[12.5px] font-bold shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={15} />
          Add Crop
        </button>
      </div>

      {/* Crop Cards List */}
      <div className="flex flex-col gap-3.5">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-[var(--canopy-leaf)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : crops.length === 0 ? (
          <MobileEmptyState
            title="No crops registered"
            subtitle="Register your first crop to track growth and schedule farm visits."
          />
        ) : (
          crops.map((c) => {
            const cropVisits = getVisitsForCrop(c.id);
            const sowing = new Date(c.sowing_date);
            const now = new Date();
            const monthsElapsed = Math.min(4, Math.floor((now - sowing) / (1000 * 60 * 60 * 24 * 30)));

            return (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-white border border-[var(--line)] shadow-sm flex flex-col gap-3 font-manrope"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#E7F4EB] flex items-center justify-center text-[22px] flex-shrink-0">
                      🌾
                    </div>
                    <div>
                      <h3 className="font-fraunces text-[16px] font-extrabold text-[var(--text)]">
                        {c.crop_type}
                      </h3>
                      <p className="text-[12px] text-[var(--text-muted)] font-medium mt-0.5">
                        {c.acres} acres
                      </p>
                    </div>
                  </div>
                  <MobileStatusPill
                    status={c.status === 'growing' ? 'good' : 'neutral'}
                    label={c.status || 'growing'}
                  />
                </div>

                {/* Sowed Date */}
                <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--text-muted)]">
                  <Calendar size={13} className="text-[var(--text-faint)]" />
                  <span>Sowed: {c.sowing_date}</span>
                </div>

                {/* 4-Stage Timeline */}
                <div className="relative py-2 px-1">
                  <div className="absolute top-[21px] left-5 right-5 h-[2px] bg-[var(--line)] z-0" />
                  <div className="flex justify-between items-center relative z-10">
                    {[
                      { num: 1, label: 'Sowing' },
                      { num: 2, label: 'Growing' },
                      { num: 3, label: 'Maturity' },
                      { num: 4, label: 'Harvest' },
                    ].map((stage, idx) => {
                      const isPassed = idx < monthsElapsed;
                      const isCurrent = idx === monthsElapsed;
                      return (
                        <div key={stage.num} className="flex flex-col items-center gap-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-colors ${
                              isPassed
                                ? 'bg-[var(--canopy-deep)] text-white'
                                : isCurrent
                                ? 'bg-amber-400 text-amber-900 ring-2 ring-amber-200'
                                : 'bg-white border-2 border-[var(--line)] text-[var(--text-faint)]'
                            }`}
                          >
                            {isPassed ? <Check size={12} /> : stage.num}
                          </div>
                          <span className="text-[10px] font-bold text-[var(--text-muted)]">
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Farm Visits */}
                {cropVisits.length > 0 && (
                  <div className="pt-2.5 border-t border-[var(--line-light)]">
                    <div className="text-[11.5px] font-extrabold text-[var(--text-muted)] mb-1.5">
                      Scheduled Farm Visits
                    </div>
                    <div className="space-y-1.5">
                      {cropVisits.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between text-[11.5px] p-2 rounded-xl bg-[var(--surface-alt)]"
                        >
                          <span className="font-bold text-[var(--text)]">
                            Month {v.visit_month} Inspection
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                              v.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Crop Sheet */}
      <MobileSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title="Register New Crop"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1 font-manrope">
          <div>
            <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
              Crop Type *
            </label>
            <select
              value={form.crop_type}
              onChange={(e) => setForm({ ...form, crop_type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
            >
              {CROP_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {form.crop_type === 'Other' && (
            <div>
              <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
                Custom Crop Name *
              </label>
              <input
                type="text"
                value={form.custom_crop_type}
                onChange={(e) => setForm({ ...form, custom_crop_type: e.target.value })}
                placeholder="Enter crop name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
              Acres of Land *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={form.acres}
              onChange={(e) => setForm({ ...form, acres: e.target.value })}
              placeholder="e.g. 5"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[var(--text-muted)] mb-1">
              Sowing Date *
            </label>
            <input
              type="date"
              value={form.sowing_date}
              onChange={(e) => setForm({ ...form, sowing_date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] text-[14px] bg-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[var(--canopy-deep)] text-white font-bold text-[14px] shadow-sm active:scale-98 transition-transform mt-2 disabled:opacity-50"
          >
            {saving ? 'Registering Crop...' : 'Save & Register Crop'}
          </button>
        </form>
      </MobileSheet>
    </div>
  );
}
