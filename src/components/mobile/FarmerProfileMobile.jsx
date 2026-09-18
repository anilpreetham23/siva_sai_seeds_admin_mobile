import React, { useState } from 'react';
import { 
  User, CreditCard, Save, AlertCircle, CheckCircle, Edit3, Sprout,
  FileText, UploadCloud, Link as LinkIcon, ArrowRight, ChevronRight,
  LogOut, Shield, Phone, Mail, MapPin, Sparkles, X, History, Wheat,
  Calendar, Check, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import MobileSheet from './MobileSheet';
import MobileStatusPill from './MobileStatusPill';

export default function FarmerProfileMobile({
  user,
  profile,
  dash,
  personalForm,
  setPersonalForm,
  agriForm,
  setAgriForm,
  bankForm,
  setBankForm,
  docForm,
  isPersonalDirty,
  isAgriDirty,
  isBankDirty,
  saving,
  savePersonal,
  saveAgri,
  requestBankChange,
  handleFileUpload,
  onLogout,
  t
}) {
  const navigate = useNavigate();
  const [activeSheet, setActiveSheet] = useState(null); // 'personal' | 'agri' | 'bank' | 'docs' | null

  const getInitials = (name) => {
    if (!name) return 'F';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const fieldsCount = dash?.total_crops || dash?.crops_count || 1;
  const totalAcres = profile?.acres_of_land || '0';
  const primaryCrop = profile?.primary_crop || 'Rice';

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)] font-manrope">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[var(--line)] px-4 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/farmer/home')}
            className="w-9 h-9 rounded-full bg-[var(--surface-alt)] flex items-center justify-center text-[var(--forest)] active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-fraunces text-xl font-bold text-[var(--forest)] leading-tight">
              My Profile
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Farmer account & agricultural details
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Card matching ui-ux (#screen-profile) */}
        <div className="bg-white border border-[var(--line)] rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--forest)] to-[var(--canopy)] text-white font-fraunces text-xl font-bold flex items-center justify-center shadow-sm shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-[var(--text)] truncate">{user?.name || 'Farmer'}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                  {user?.status || 'active'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                <Phone size={11} className="text-[var(--text-faint)]" />
                <span>{user?.phone || 'Phone not set'}</span>
              </p>
              {profile?.address && (
                <p className="text-[11px] text-[var(--text-faint)] flex items-center gap-1 mt-0.5 truncate">
                  <MapPin size={11} />
                  <span className="truncate">{profile.address}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => setActiveSheet('personal')}
              className="w-9 h-9 rounded-full bg-[var(--surface-alt)] text-[var(--canopy-deep)] flex items-center justify-center active:scale-95 transition-transform shrink-0"
              title="Edit Profile"
            >
              <Edit3 size={16} />
            </button>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100">
            <div className="p-2.5 bg-[var(--surface-alt)] rounded-xl text-center">
              <div className="font-fraunces text-base font-bold text-[var(--forest)]">{totalAcres}</div>
              <div className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5 uppercase">Total Acres</div>
            </div>
            <div className="p-2.5 bg-[var(--surface-alt)] rounded-xl text-center">
              <div className="font-fraunces text-base font-bold text-[var(--forest)]">{primaryCrop}</div>
              <div className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5 uppercase">Main Crop</div>
            </div>
            <div className="p-2.5 bg-[var(--surface-alt)] rounded-xl text-center">
              <div className="font-fraunces text-base font-bold text-[var(--forest)]">{profile?.soil_type || 'Loamy'}</div>
              <div className="text-[10px] font-bold text-[var(--text-muted)] mt-0.5 uppercase">Soil Type</div>
            </div>
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            to="/farmer/transactions"
            className="p-3 bg-white border border-[var(--line)] rounded-xl flex items-center gap-2.5 active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[var(--canopy-deep)] flex items-center justify-center shrink-0">
              <History size={16} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-[var(--text)]">Transactions</p>
              <p className="text-[10px] text-[var(--text-muted)]">Order & ledger history</p>
            </div>
          </Link>
          <Link
            to="/farmer/booking-slots"
            className="p-3 bg-white border border-[var(--line)] rounded-xl flex items-center gap-2.5 active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Wheat size={16} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-[var(--text)]">Grain Sales</p>
              <p className="text-[10px] text-[var(--text-muted)]">Book warehouse slots</p>
            </div>
          </Link>
        </div>

        {/* Setting Rows Group */}
        <div className="bg-white border border-[var(--line)] rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">
          <button
            onClick={() => setActiveSheet('personal')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[var(--forest)] flex items-center justify-center">
                <User size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-[var(--text)]">Personal Information</p>
                <p className="text-[10px] text-[var(--text-muted)]">Name, phone, contact address</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={() => setActiveSheet('agri')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[var(--forest)] flex items-center justify-center">
                <Sprout size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-[var(--text)]">Agricultural Details</p>
                <p className="text-[10px] text-[var(--text-muted)]">Land acreage, soil, irrigation method</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={() => setActiveSheet('bank')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-xs text-[var(--text)]">Bank Details</p>
                  {profile?.bank_status && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      profile.bank_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {profile.bank_status}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">Account number, IFSC, UPI ID</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>

          <button
            onClick={() => setActiveSheet('docs')}
            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-[var(--text)]">Required Documents</p>
                <p className="text-[10px] text-[var(--text-muted)]">Aadhaar, passbook, land records</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Log out button */}
        <button
          onClick={onLogout}
          className="w-full p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center gap-2 text-red-600 font-bold text-xs active:scale-95 transition-transform"
        >
          <LogOut size={16} />
          <span>Log Out</span>
        </button>

        <p className="text-center text-[10px] text-[var(--text-faint)] font-medium pt-2">
          Sri Siva Sai Seeds · Mobile Farmer Portal v1.0.4
        </p>
      </div>

      {/* ================= EDIT SHEETS ================= */}

      {/* 1. Personal Information Sheet */}
      <MobileSheet
        isOpen={activeSheet === 'personal'}
        onClose={() => setActiveSheet(null)}
        title="Personal Information"
      >
        <div className="space-y-3.5 pt-1 font-manrope text-xs">
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={personalForm.name || ''}
              onChange={(e) => setPersonalForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={personalForm.email || ''}
              onChange={(e) => setPersonalForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              Contact Address
            </label>
            <textarea
              rows={2}
              value={personalForm.address || ''}
              onChange={(e) => setPersonalForm(f => ({ ...f, address: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--forest)] resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              Farm Location / Crop Address
            </label>
            <input
              type="text"
              value={personalForm.crop_address || ''}
              onChange={(e) => setPersonalForm(f => ({ ...f, crop_address: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={saving || !isPersonalDirty}
              onClick={async () => {
                await savePersonal();
                setActiveSheet(null);
              }}
              className="w-full py-3 bg-[var(--forest)] text-white text-xs font-bold rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? 'Saving...' : 'Save Personal Details'}
            </button>
          </div>
        </div>
      </MobileSheet>

      {/* 2. Agricultural Details Sheet */}
      <MobileSheet
        isOpen={activeSheet === 'agri'}
        onClose={() => setActiveSheet(null)}
        title="Agricultural Details"
      >
        <div className="space-y-3.5 pt-1 font-manrope text-xs">
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              Land Size (Acres) *
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={agriForm.acres_of_land || ''}
              onChange={(e) => setAgriForm(f => ({ ...f, acres_of_land: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              Soil Type
            </label>
            <input
              type="text"
              placeholder="e.g. Black Clay, Red Loamy, Sandy"
              value={agriForm.soil_type || ''}
              onChange={(e) => setAgriForm(f => ({ ...f, soil_type: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              Irrigation Type
            </label>
            <select
              value={agriForm.irrigation_type || ''}
              onChange={(e) => setAgriForm(f => ({ ...f, irrigation_type: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
            >
              <option value="">Select Irrigation Method</option>
              <option value="Drip">Drip Irrigation</option>
              <option value="Sprinkler">Sprinkler Irrigation</option>
              <option value="Flood">Flood Irrigation</option>
              <option value="Rainfed">Rainfed</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              Primary Crop
            </label>
            <input
              type="text"
              placeholder="e.g. Paddy / Rice"
              value={agriForm.primary_crop || ''}
              onChange={(e) => setAgriForm(f => ({ ...f, primary_crop: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              Secondary Crop
            </label>
            <input
              type="text"
              placeholder="e.g. Cotton, Groundnut"
              value={agriForm.secondary_crop || ''}
              onChange={(e) => setAgriForm(f => ({ ...f, secondary_crop: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={saving || !isAgriDirty}
              onClick={async () => {
                await saveAgri();
                setActiveSheet(null);
              }}
              className="w-full py-3 bg-[var(--forest)] text-white text-xs font-bold rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? 'Saving...' : 'Save Agricultural Details'}
            </button>
          </div>
        </div>
      </MobileSheet>

      {/* 3. Bank Details Sheet */}
      <MobileSheet
        isOpen={activeSheet === 'bank'}
        onClose={() => setActiveSheet(null)}
        title="Bank & Payment Details"
      >
        <div className="space-y-3.5 pt-1 font-manrope text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
            <span>
              Bank account modifications require verification by manager before payouts can be routed to the new account.
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              Bank Name *
            </label>
            <input
              type="text"
              placeholder="e.g. State Bank of India"
              value={bankForm.bank_name || ''}
              onChange={(e) => setBankForm(f => ({ ...f, bank_name: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              Account Number *
            </label>
            <input
              type="text"
              placeholder="Account number"
              value={bankForm.account_number || ''}
              onChange={(e) => setBankForm(f => ({ ...f, account_number: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              IFSC Code *
            </label>
            <input
              type="text"
              placeholder="e.g. SBIN0001234"
              value={bankForm.ifsc_code || ''}
              onChange={(e) => setBankForm(f => ({ ...f, ifsc_code: e.target.value.toUpperCase() }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--forest)] font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">
              UPI ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. farmer@upi"
              value={bankForm.upi_id || ''}
              onChange={(e) => setBankForm(f => ({ ...f, upi_id: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-alt)] border border-[var(--line)] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[var(--forest)]"
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={saving || !isBankDirty}
              onClick={async () => {
                await requestBankChange();
                setActiveSheet(null);
              }}
              className="w-full py-3 bg-[var(--forest)] text-white text-xs font-bold rounded-xl shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? 'Submitting...' : 'Submit Bank Change Request'}
            </button>
          </div>
        </div>
      </MobileSheet>

      {/* 4. Required Documents Sheet */}
      <MobileSheet
        isOpen={activeSheet === 'docs'}
        onClose={() => setActiveSheet(null)}
        title="Required Documents"
      >
        <div className="space-y-3.5 pt-1 font-manrope text-xs">
          {[
            { id: 'aadhaar_card_url', label: 'Aadhaar Card', desc: 'Government photo identification' },
            { id: 'bank_passbook_url', label: 'Bank Passbook / Cheque', desc: 'Account number & IFSC proof' },
            { id: 'land_ownership_url', label: 'Land Ownership Record', desc: 'Pattadar passbook or 1B record' },
          ].map(doc => (
            <div key={doc.id} className="p-3.5 border border-[var(--line)] rounded-xl bg-[var(--surface-alt)] space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-xs text-[var(--text)]">{doc.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{doc.desc}</p>
                </div>
                {docForm[doc.id] ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <Check size={10} /> Uploaded
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Pending
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                {docForm[doc.id] && (
                  <a
                    href={docForm[doc.id]}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[var(--forest)] font-bold flex items-center gap-1 hover:underline"
                  >
                    <LinkIcon size={12} /> View File
                  </a>
                )}
                <label className="ml-auto px-3 py-1.5 bg-white border border-[var(--line)] text-[var(--forest)] font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-transform">
                  <UploadCloud size={13} />
                  <span>{docForm[doc.id] ? 'Re-upload' : 'Upload File'}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg,.pdf"
                    onChange={(e) => handleFileUpload(e, doc.id)}
                  />
                </label>
              </div>
            </div>
          ))}

          <button
            onClick={() => setActiveSheet(null)}
            className="w-full py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs active:scale-95 transition-transform mt-3"
          >
            Done
          </button>
        </div>
      </MobileSheet>
    </div>
  );
}
