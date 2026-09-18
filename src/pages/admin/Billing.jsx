import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import adminService from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { CACHE_TIMES } from '../../lib/queryConfig';
import {
  FileText, Search, Plus, DollarSign, Calendar, User, ArrowDownRight, ArrowUpRight, Download, Printer, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BRAND_NAME, BRAND_LOGO_DATA_URI } from '../../utils/brandLogo';
import BillingMobile from '../../components/mobile/BillingMobile';

export default function Billing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [farmerSelection, setFarmerSelection] = useState('other'); // 'other' or farmer ID
  const [customName, setCustomName] = useState('');
  const [txType, setTxType] = useState('Seed Purchase');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [direction, setDirection] = useState('credit'); // credit = income, debit = payout
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');

  // Fetch active farmers
  const { data: farmers = [], isLoading: farmersLoading } = useQuery({
    queryKey: ['admin-farmers'],
    queryFn: () => adminService.getFarmers(),
    ...CACHE_TIMES.MEDIUM
  });

  // Fetch billing transactions
  const { data: billingTx = [], isLoading: txLoading } = useQuery({
    queryKey: ['admin-billing-tx'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, farmer:users(name, phone)')
        .eq('reference_type', 'billing')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(t => ({
        ...t,
        farmer_name: t.farmer?.name,
        phone: t.farmer?.phone
      }));
    }
  });

  const executeBillCreation = async ({
    farmerId,
    customerName,
    billType,
    billAmount,
    payMethod,
    billDirection,
    billRemarks,
    txId,
  }) => {
    if (!billAmount || parseFloat(billAmount) <= 0) {
      return toast.error('Please enter a valid amount');
    }
    if (farmerId === 'other' && !customerName?.trim()) {
      return toast.error('Please enter customer name');
    }

    setSaving(true);
    const selectedFarmerObj =
      farmerId !== 'other'
        ? farmers.find((f) => f.id.toString() === farmerId)
        : null;
    const finalCustomerName = selectedFarmerObj
      ? selectedFarmerObj.name
      : customerName;
    const finalDescription = `${billType} - ${finalCustomerName}${
      billRemarks ? ` (${billRemarks})` : ''
    }`;
    const invoiceNumber = `BILL-${Date.now().toString().slice(-8)}`;

    try {
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert({
          farmer_id: selectedFarmerObj ? selectedFarmerObj.id : null,
          amount: parseFloat(billAmount),
          direction: billDirection || 'credit',
          status: 'completed',
          description: finalDescription,
          reference_type: 'billing',
          upi_id: payMethod,
          transaction_id: txId || null,
          invoice_number: invoiceNumber,
        })
        .select('*')
        .single();

      if (txError) throw txError;

      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'Generate Bill',
        entity_type: 'transaction',
        entity_id: tx.id,
        details: `Billing receipt generated: ${invoiceNumber} for ₹${billAmount}`,
      });

      toast.success('Billing transaction logged successfully!');

      handlePrintInvoice({
        ...tx,
        farmer_name: finalCustomerName,
      });

      queryClient.invalidateQueries({ queryKey: ['admin-billing-tx'] });
    } catch (err) {
      toast.error(err.message || 'Failed to log billing');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    await executeBillCreation({
      farmerId: farmerSelection,
      customerName: customName,
      billType: txType,
      billAmount: amount,
      payMethod: paymentMethod,
      billDirection: direction,
      billRemarks: remarks,
      txId: transactionId,
    });
    setAmount('');
    setCustomName('');
    setTransactionId('');
    setRemarks('');
  };

  const handlePrintInvoice = (tx) => {
    const totalRowColor = tx.direction === 'credit' ? '#15803d' : '#b91c1c';
    const printWindow = window.open('', '_blank');
    const customerName = tx.farmer_name || tx.description?.split(' - ')?.[1] || 'Walk-in Customer';

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${tx.invoice_number}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #16a34a; display: flex; align-items: center; gap: 10px; }
            .logo img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; object-position: center; }
            .invoice-title { font-size: 28px; font-weight: bold; color: #1f2937; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .detail-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #f1f5f9; }
            .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
            .value { font-size: 14px; font-weight: 600; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px; background: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .total-row { text-align: right; font-size: 18px; font-weight: bold; color: ${totalRowColor}; padding-top: 20px; }
            .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo"><img src="${BRAND_LOGO_DATA_URI}" alt="${BRAND_NAME}" />${BRAND_NAME}</div>
            <div class="invoice-title">BILL / RECEIPT</div>
          </div>
          
          <div class="details-grid">
            <div class="detail-box">
              <div class="label">Bill Number</div>
              <div class="value">${tx.invoice_number}</div>
              <div class="label" style="margin-top: 10px;">Date / Time</div>
              <div class="value">${new Date(tx.created_at || Date.now()).toLocaleString('en-IN')}</div>
            </div>
            <div class="detail-box">
              <div class="label">Customer / Farmer</div>
              <div class="value">${customerName}</div>
              <div class="label" style="margin-top: 10px;">Payment Method</div>
              <div class="value">${tx.upi_id || 'Cash'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Billing Item / Description</th>
                <th>Type</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${tx.description || 'Billing Transaction'}</strong></td>
                <td><span style="text-transform: uppercase; font-weight: 500;">${tx.direction === 'credit' ? 'Receipt' : 'Payout'}</span></td>
                <td style="text-align: right; font-weight: 600;">₹${parseFloat(tx.amount || 0).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-row">
            ${tx.direction === 'credit' ? 'Total Collected' : 'Total Paid Out'}: ₹${parseFloat(tx.amount || 0).toLocaleString('en-IN')}
          </div>

          <div class="footer">
            Thank you for choosing ${BRAND_NAME}!<br>
            <small>This is a system-generated electronic billing statement.</small>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const filteredTx = billingTx.filter(t => {
    const name = t.farmer_name || t.description || '';
    return name.toLowerCase().includes(search.toLowerCase()) || t.invoice_number?.includes(search);
  });

  return (
    <div className="animate-fade-in">
      {/* Mobile View */}
      <div className="md:hidden">
        <BillingMobile
          billingTx={billingTx}
          farmers={farmers}
          loading={txLoading}
          onCreateBill={async (mobileData) => {
            await executeBillCreation({
              farmerId: mobileData.farmerSelection,
              customerName: mobileData.customName,
              billType: mobileData.txType,
              billAmount: mobileData.amount,
              payMethod: mobileData.paymentMethod,
              billDirection: mobileData.direction,
              billRemarks: mobileData.remarks,
            });
          }}
          onPrintInvoice={handlePrintInvoice}
          saving={saving}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="page-header">
          <div>
            <h1 className="page-title">Billing & Invoices</h1>
            <p className="page-subtitle">Enter payment transactions, generate official customer bills, and download invoices</p>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Column */}
        <div className="lg:col-span-5">
          <div className="glass-card p-5">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="text-primary-600" size={18} />
              Log New Transaction
            </h3>
            
            <form onSubmit={handleCreateBill} className="space-y-4">
              <div>
                <label className="label">Farmer / Customer *</label>
                <select 
                  value={farmerSelection} 
                  onChange={e => setFarmerSelection(e.target.value)} 
                  className="input-field"
                  required
                >
                  <option value="other">-- Other / Walk-in Customer --</option>
                  {farmers.filter(f => f.status === 'active').map(f => (
                    <option key={f.id} value={f.id.toString()}>{f.name} ({f.phone})</option>
                  ))}
                </select>
              </div>

              {farmerSelection === 'other' && (
                <div>
                  <label className="label">Customer Name *</label>
                  <input 
                    type="text" 
                    value={customName} 
                    onChange={e => setCustomName(e.target.value)} 
                    placeholder="Enter walk-in customer name"
                    className="input-field" 
                    required 
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Transaction Type *</label>
                  <select 
                    value={txType} 
                    onChange={e => setTxType(e.target.value)} 
                    className="input-field"
                    required
                  >
                    <option value="Seed Purchase">Seed Purchase</option>
                    <option value="Grain Procurement">Grain Procurement</option>
                    <option value="Service Fee">Service Fee</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Direction *</label>
                  <select 
                    value={direction} 
                    onChange={e => setDirection(e.target.value)} 
                    className="input-field"
                    required
                  >
                    <option value="credit">Receipt (We Collect)</option>
                    <option value="debit">Payout (We Refund/Pay)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount (₹) *</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    placeholder="e.g. 500" 
                    className="input-field font-semibold text-lg" 
                    min="0.01" 
                    step="0.01" 
                    required 
                  />
                </div>
                <div>
                  <label className="label">Payment Method *</label>
                  <select 
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)} 
                    className="input-field"
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Reference / Tx ID (Optional)</label>
                <input 
                  type="text" 
                  value={transactionId} 
                  onChange={e => setTransactionId(e.target.value)} 
                  placeholder="e.g. UPI Ref # or Bank Ref" 
                  className="input-field" 
                />
              </div>

              <div>
                <label className="label">Remarks / Description</label>
                <textarea 
                  value={remarks} 
                  onChange={e => setRemarks(e.target.value)} 
                  placeholder="Add details, specific quantity or seed types..." 
                  className="input-field resize-none" 
                  rows={2}
                />
              </div>

              <button 
                type="submit" 
                disabled={saving || !amount}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Printer size={16} />
                )}
                {saving ? 'Processing...' : 'Log & Print Bill'}
              </button>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-7">
          <div className="glass-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold text-gray-800">Recent Billing Invoices</h3>
              <div className="relative w-full sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by customer or invoice..." 
                  className="input-field pl-8 py-1.5 text-xs" 
                />
              </div>
            </div>

            <div className="table-container max-h-[550px] overflow-y-auto">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th>Bill #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {txLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : filteredTx.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">
                        No billing transactions logged yet.
                      </td>
                    </tr>
                  ) : (
                    filteredTx.map(t => {
                      const custName = t.farmer_name || t.description?.split(' - ')?.[1]?.split(' (')?.[0] || 'Walk-in Customer';
                      return (
                        <tr key={t.id}>
                          <td className="font-bold text-gray-800">{t.invoice_number}</td>
                          <td>
                            <p className="font-medium text-gray-700">{custName}</p>
                            <p className="text-[10px] text-gray-400">{new Date(t.created_at).toLocaleDateString('en-IN')}</p>
                          </td>
                          <td className={`font-semibold ${t.direction === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                            {t.direction === 'credit' ? '+' : '-'} ₹{parseFloat(t.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="font-medium text-gray-600">{t.upi_id || 'Cash'}</td>
                          <td>
                            <button 
                              onClick={() => handlePrintInvoice(t)} 
                              className="p-1 rounded-lg bg-gray-100 hover:bg-primary-50 text-gray-500 hover:text-primary-600 transition-all"
                              title="Print Invoice"
                            >
                              <Printer size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}
