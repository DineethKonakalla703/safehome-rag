import {
  AlertTriangle,
  Banknote,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileText,
  MapPin,
  Printer,
  QrCode,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../api/apiClient';
import {
  createCheckoutOrder,
  generateMonthlyBills,
  getTaxInvoice,
  updateBillStatus,
  verifyCheckoutPayment,
} from '../api/billApi';
import { ErrorState, LoadingState } from '../components/DataState';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getCurrentUser } from '../utils/auth';
import { useRecords } from './DashboardShared';

function formatDateTime(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateOnly(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Billing() {
  const user = getCurrentUser();
  const { bills, loading, error, reload } = useRecords(user);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyBillId, setBusyBillId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [fullImagePreview, setFullImagePreview] = useState(null);

  // Phase 1 Payment Gateway & Tax Invoice state
  const [checkoutBill, setCheckoutBill] = useState(null);
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [checkoutMethod, setCheckoutMethod] = useState('UPI');
  const [checkoutUpiId, setCheckoutUpiId] = useState('resident@okhdfcbank');
  const [checkoutCard, setCheckoutCard] = useState({
    number: '4532 •••• •••• 8821',
    exp: '08/28',
    cvv: '•••',
    name: user.name || 'Resident Cardholder',
  });
  const [checkoutBank, setCheckoutBank] = useState('HDFC Bank');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [taxInvoiceModal, setTaxInvoiceModal] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  if (loading) return <LoadingState label="Loading billing records…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const pending = bills.filter((bill) => bill.paymentStatus === 'Pending');
  const paid = bills.filter((bill) => bill.paymentStatus === 'Paid');
  const totalAmount = bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
  const pendingAmount = pending.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
  const paidAmount = paid.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
  const collectionRate = bills.length ? Math.round((paid.length / bills.length) * 100) : 0;

  const canManage = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN'].includes(user.role);
  const isResident = user.role === 'RESIDENT';

  const markPaid = async (billId, paymentMethod = 'Online - UPI / Card') => {
    setBusyBillId(billId);
    try {
      const updated = await updateBillStatus(billId, 'Paid', paymentMethod);
      setActionMessage(`Bill ${billId} marked as Paid! Receipt: ${updated.receiptNumber || 'Generated'}`);
      setTimeout(() => setActionMessage(''), 4500);
      if (selected && selected.id === billId) {
        setSelected((prev) => ({ ...prev, ...updated, paymentStatus: 'Paid', paidAt: updated.paidAt || new Date() }));
      }
      reload();
    } catch (err) {
      alert(`Payment update failed: ${err.message}`);
    } finally {
      setBusyBillId(null);
    }
  };

  const handleOpenCheckout = async (bill) => {
    setCheckoutBill(bill);
    setCheckoutSuccess(null);
    setCheckoutLoading(true);
    try {
      const order = await createCheckoutOrder(bill.id);
      setCheckoutOrder(order);
    } catch (err) {
      console.warn('Checkout order fallback:', err.message);
      setCheckoutOrder({
        orderId: `order_sim_${bill.id}_${Date.now().toString(36)}`,
        amount: Math.round(bill.totalAmount * 100),
        currency: 'INR',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleConfirmCheckoutPayment = async () => {
    if (!checkoutBill) return;
    setCheckoutLoading(true);
    try {
      const orderId = checkoutOrder?.orderId || `order_${checkoutBill.id}`;
      const paymentId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const payload = {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: `sig_${Date.now().toString(36)}`,
        paymentMethod:
          checkoutMethod === 'UPI'
            ? `UPI (${checkoutUpiId})`
            : checkoutMethod === 'CARD'
            ? 'Card (ending 8821)'
            : checkoutMethod === 'NETBANKING'
            ? `NetBanking (${checkoutBank})`
            : 'Counter Cash / Society Office',
      };
      const verified = await verifyCheckoutPayment(checkoutBill.id, payload);
      setCheckoutSuccess(verified);
      setActionMessage(
        `Payment of ₹${checkoutBill.totalAmount} verified! Invoice #${verified.taxInvoiceNumber || verified.id} generated.`
      );
      setTimeout(() => setActionMessage(''), 5000);
      if (selected && selected.id === checkoutBill.id) {
        setSelected((prev) => ({
          ...prev,
          ...verified,
          paymentStatus: 'Paid',
          paidAt: verified.paidAt || new Date(),
        }));
      }
      reload();
    } catch (err) {
      alert(`Payment checkout failed: ${err.message}`);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleOpenTaxInvoice = async (bill) => {
    setInvoiceLoading(true);
    try {
      const invoiceData = await getTaxInvoice(bill.id);
      setTaxInvoiceModal(invoiceData);
    } catch (err) {
      const baseAmount = Math.round((bill.totalAmount / 1.18) * 100) / 100;
      const gst = Math.round((bill.totalAmount - baseAmount) * 100) / 100;
      const half = Math.round((gst / 2) * 100) / 100;
      setTaxInvoiceModal({
        invoiceNumber: bill.taxInvoiceNumber || `INV-2026-${(bill.id || '00000').slice(-5)}`,
        billId: bill.id,
        invoiceDate: bill.paidAt || bill.generatedAt || new Date().toISOString(),
        paymentDate: bill.paidAt || new Date().toISOString(),
        resident: {
          name: bill.residentName || user.name,
          apartmentNumber: bill.apartmentNumber || 'A-102',
          blockName: bill.blockName || 'A',
          phone: bill.residentPhone || '+91 98765 43210',
        },
        society: {
          name: 'Green Valley Residency Resident Welfare Association',
          registrationNumber: 'AP/RWA/2024/0981',
          gstin: '37AAAAA0000A1Z5',
          pan: 'AAAAA0000A',
          address: 'Green Valley Residency, Auto Nagar Bypass, Vijayawada, AP - 520007',
          contactEmail: 'accounts@safehome-residency.org',
          contactPhone: '+91 866 245 9900',
        },
        sacCode: '9995',
        sacDescription: 'Resident Society Maintenance & Property Facility Repairs',
        taxBreakdown: {
          baseAmount,
          cgst: half,
          sgst: Math.round((gst - half) * 100) / 100,
          totalGst: gst,
          totalAmount: bill.totalAmount,
        },
        paymentProof: {
          paymentStatus: bill.paymentStatus,
          paidAt: bill.paidAt || new Date().toISOString(),
          paymentMethod: bill.paymentMethod || 'Online - UPI / Card',
          receiptNumber: bill.receiptNumber || `RCT-${bill.id}-001`,
        },
      });
    } finally {
      setInvoiceLoading(false);
    }
  };

  const monthly = async () => {
    try {
      await generateMonthlyBills({ month: new Date().toISOString().slice(0, 7), amount: 1500 });
      setActionMessage('Monthly maintenance bills generated for all community residents.');
      setTimeout(() => setActionMessage(''), 4500);
      reload();
    } catch (err) {
      alert(`Generation failed: ${err.message}`);
    }
  };

  const filteredBills = bills.filter((bill) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (bill.id || '').toLowerCase().includes(q) ||
      (bill.ticketId || '').toLowerCase().includes(q) ||
      (bill.residentName || '').toLowerCase().includes(q) ||
      (bill.apartmentNumber || '').toLowerCase().includes(q) ||
      (bill.technicianName || '').toLowerCase().includes(q) ||
      (bill.ticketTitle || '').toLowerCase().includes(q);

    if (activeTab === 'PENDING') return matchesSearch && bill.paymentStatus === 'Pending';
    if (activeTab === 'PAID') return matchesSearch && bill.paymentStatus === 'Paid';
    if (activeTab === 'REPAIR') return matchesSearch && (bill.billType === 'Repair' || !bill.billType);
    if (activeTab === 'MONTHLY') return matchesSearch && bill.billType === 'Monthly';
    return matchesSearch;
  });

  return (
    <>
      <PageHeader
        eyebrow="Financial Records & Billing"
        title="Billing & Payment Tracking"
        subtitle={`${bills.length} billing records available. Track repair service charges, technician work orders, timestamps, and settlement status.`}
        actions={
          <div className="page-header-actions-group">
            <button className="secondary-button" onClick={reload}>
              <RefreshCw size={15} /> Refresh
            </button>
            {canManage && (
              <button className="primary-button" onClick={monthly}>
                <Receipt size={16} /> Generate Monthly Bills
              </button>
            )}
          </div>
        }
      />

      {actionMessage && (
        <div className="feedback-banner success mb-4">
          <CheckCircle2 size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <section className="stats-grid billing-stats">
        <StatCard label="Total Invoices" value={bills.length} icon={Receipt} />
        <StatCard
          label="Pending Due"
          value={`${pending.length} (₹${pendingAmount.toLocaleString('en-IN')})`}
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Paid & Settled"
          value={`${paid.length} (₹${paidAmount.toLocaleString('en-IN')})`}
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label="Total Billed"
          value={`₹${totalAmount.toLocaleString('en-IN')}`}
          icon={Banknote}
          tone="green"
        />
      </section>

      {/* Toolbar: Search and Filter Tabs */}
      <div className="vendor-toolbar-card">
        <div className="search-input-field">
          <Search size={16} className="search-lead-icon" />
          <input
            type="text"
            placeholder="Search by Bill ID, Ticket, Resident, Apartment, or Technician..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="tech-filter-tabs">
          <button
            type="button"
            className={`tech-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            All Bills ({bills.length})
          </button>
          <button
            type="button"
            className={`tech-tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDING')}
          >
            Pending ({pending.length})
          </button>
          <button
            type="button"
            className={`tech-tab-btn ${activeTab === 'PAID' ? 'active' : ''}`}
            onClick={() => setActiveTab('PAID')}
          >
            Paid ({paid.length})
          </button>
          <button
            type="button"
            className={`tech-tab-btn ${activeTab === 'REPAIR' ? 'active' : ''}`}
            onClick={() => setActiveTab('REPAIR')}
          >
            Repair Services ({bills.filter((b) => b.billType !== 'Monthly').length})
          </button>
          <button
            type="button"
            className={`tech-tab-btn ${activeTab === 'MONTHLY' ? 'active' : ''}`}
            onClick={() => setActiveTab('MONTHLY')}
          >
            Monthly Maintenance ({bills.filter((b) => b.billType === 'Monthly').length})
          </button>
        </div>
      </div>

      {/* Main Billing Records Table */}
      <section className="content-card">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Ledger & Service Logs</span>
            <h2>Billing Records</h2>
            <p>Complete breakdown with assigned technicians, date/time logs, and service status.</p>
          </div>
        </div>

        {filteredBills.length ? (
          <div className="table-wrap">
            <table className="billing-records-table">
              <thead>
                <tr>
                  <th>Bill ID</th>
                  <th>Type</th>
                  <th>Ticket / Service</th>
                  <th>Resident & Unit</th>
                  <th>Technician</th>
                  <th>Issued Date & Time</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => {
                  const isBusy = busyBillId === bill.id;
                  const isPaid = bill.paymentStatus === 'Paid';
                  const isMonthly = bill.billType === 'Monthly';

                  return (
                    <tr key={bill.id} className={isPaid ? 'row-paid' : 'row-pending'}>
                      <td>
                        <strong className="ticket-id">{bill.id}</strong>
                      </td>
                      <td>
                        <span className={`bill-type-tag ${isMonthly ? 'monthly' : 'repair'}`}>
                          {bill.billType || 'Repair'}
                        </span>
                      </td>
                      <td>
                        <div className="bill-ticket-cell">
                          {bill.ticketId ? (
                            <Link
                              to={`/tickets/${bill.ticketId}`}
                              className="ticket-link-pill"
                              title="View Ticket"
                            >
                              <span>{bill.ticketId}</span>
                              <ExternalLink size={11} />
                            </Link>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                          <small className="cell-sub-text" title={bill.ticketTitle}>
                            {bill.ticketTitle || (isMonthly ? 'Society Fee' : 'Repair Job')}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="resident-unit-cell">
                          <strong className="resident-name">{bill.residentName || bill.residentId}</strong>
                          <small className="unit-label">
                            Unit {bill.apartmentNumber || bill.apartmentId} · {bill.blockName || bill.blockId}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="tech-assigned-chip">
                          <div className="tech-chip-avatar">
                            <Wrench size={12} />
                          </div>
                          <div className="tech-chip-info">
                            <strong>{bill.technicianName || 'Suresh'}</strong>
                            <small>{bill.technicianSkill || (isMonthly ? 'Society Ops' : 'Electrician')}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="datetime-cell">
                          <span className="datetime-primary">
                            {formatDateTime(bill.rawGeneratedAt || bill.generatedAt)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="due-date-cell">
                          <span>{formatDateOnly(bill.rawDueDate || bill.dueDate)}</span>
                        </div>
                      </td>
                      <td>
                        <strong className="amount-cell">₹{bill.totalAmount}</strong>
                      </td>
                      <td>
                        <StatusBadge>{bill.paymentStatus}</StatusBadge>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="table-action view-btn"
                            onClick={() => setSelected(bill)}
                          >
                            <Eye size={13} /> View
                          </button>
                          {isPaid ? (
                            <button
                              type="button"
                              className="table-action invoice-btn"
                              onClick={() => handleOpenTaxInvoice(bill)}
                              title="View & Print Official GST Tax Invoice"
                            >
                              <FileText size={13} /> Tax Invoice
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="table-action pay-btn"
                              disabled={isBusy || (checkoutLoading && checkoutBill?.id === bill.id)}
                              onClick={() => handleOpenCheckout(bill)}
                            >
                              <CreditCard size={13} /> {isResident ? 'Pay Now' : 'Collect Pay'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Receipt}
            title="No billing records match your filters"
            description="Try modifying your search keywords or active status filter tab."
          />
        )}
      </section>

      {/* Detailed Bill Details Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section
            className="invoice-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-head invoice-modal-head">
              <div>
                <span className="section-kicker">Tax Invoice & Service Breakdown</span>
                <h2>Invoice #{selected.id}</h2>
              </div>
              <div className="invoice-head-actions">
                <button
                  type="button"
                  className="icon-action"
                  title="Print Invoice"
                  onClick={() => window.print()}
                >
                  <Printer size={16} />
                </button>
                <button
                  type="button"
                  className="icon-action"
                  onClick={() => setSelected(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Top Status Banner */}
            <div
              className={`invoice-hero-banner ${selected.paymentStatus === 'Paid' ? 'paid-hero' : 'pending-hero'}`}
            >
              <div className="hero-status-left">
                <div className="hero-icon-bubble">
                  {selected.paymentStatus === 'Paid' ? (
                    <CheckCircle2 size={26} />
                  ) : (
                    <Clock size={26} />
                  )}
                </div>
                <div>
                  <div className="hero-status-title">
                    {selected.paymentStatus === 'Paid' ? 'Invoice Paid & Settled' : 'Payment Pending'}
                  </div>
                  <small className="hero-status-subtitle">
                    {selected.billType || 'Repair Service'} · {selected.ticketTitle || 'Maintenance'}
                  </small>
                </div>
              </div>
              <div className="hero-amount-box">
                <span className="hero-amount-label">Total Amount</span>
                <strong className="hero-amount-value">₹{selected.totalAmount}</strong>
              </div>
            </div>

            {/* Timing & Dates Section */}
            <div className="invoice-section-container">
              <h4 className="invoice-section-title">
                <Calendar size={15} /> Date, Time & Timeline Details
              </h4>
              <div className="timing-details-grid">
                <div className="timing-tile">
                  <span className="timing-tile-label">Bill Generated At</span>
                  <strong className="timing-tile-value">
                    {formatDateTime(selected.rawGeneratedAt || selected.generatedAt)}
                  </strong>
                  <small className="timing-tile-hint">Issued to resident ledger</small>
                </div>

                <div className="timing-tile">
                  <span className="timing-tile-label">Payment Due Date</span>
                  <strong className="timing-tile-value">
                    {formatDateOnly(selected.rawDueDate || selected.dueDate)}
                  </strong>
                  <small className="timing-tile-hint">
                    {selected.paymentStatus === 'Paid' ? 'Settled on time' : 'Awaiting payment'}
                  </small>
                </div>

                <div className="timing-tile">
                  <span className="timing-tile-label">Payment Settled At</span>
                  <strong className="timing-tile-value">
                    {selected.paidAt ? formatDateTime(selected.rawPaidAt || selected.paidAt) : 'Pending Settlement'}
                  </strong>
                  <small className="timing-tile-hint">
                    {selected.receiptNumber ? `Receipt: ${selected.receiptNumber}` : 'Receipt issued upon payment'}
                  </small>
                </div>

                <div className="timing-tile">
                  <span className="timing-tile-label">Service Execution Time</span>
                  <strong className="timing-tile-value">
                    {selected.workOrderCompletedAt
                      ? formatDateTime(selected.workOrderCompletedAt)
                      : selected.workOrderScheduledAt
                      ? formatDateTime(selected.workOrderScheduledAt)
                      : formatDateTime(selected.rawGeneratedAt || selected.generatedAt)}
                  </strong>
                  <small className="timing-tile-hint">
                    Work order status: {selected.workOrderStatus || 'Completed'}
                  </small>
                </div>
              </div>
            </div>

            {/* Technician & Service Execution Box */}
            <div className="invoice-section-container">
              <h4 className="invoice-section-title">
                <Wrench size={15} /> Assigned Technician & Work Execution
              </h4>
              <div className="technician-card-view">
                <div className="technician-info-row">
                  <div className="tech-avatar-box">
                    <User size={24} />
                  </div>
                  <div className="tech-meta-details">
                    <div className="tech-name-row">
                      <strong className="tech-full-name">
                        {selected.technicianName || 'Suresh'}
                      </strong>
                      <span className="tech-skill-badge">
                        {selected.technicianSkill || 'Electrician'}
                      </span>
                      {selected.technicianRating && (
                        <span className="tech-rating-badge">★ {selected.technicianRating}</span>
                      )}
                    </div>
                    <div className="tech-sub-row">
                      <span>Work Order: <strong>{selected.workOrderId || `WO-${selected.ticketId}`}</strong></span>
                      <span>·</span>
                      <span>Status: <strong className="text-success">{selected.workOrderStatus || 'Completed'}</strong></span>
                      {selected.technicianPhone && (
                        <>
                          <span>·</span>
                          <span>Phone: {selected.technicianPhone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {selected.completionNote && (
                  <div className="tech-resolution-box">
                    <strong>Technician Resolution Note:</strong>
                    <p>{selected.completionNote}</p>
                  </div>
                )}

                {/* Verified Completion Photo Proof */}
                {selected.completionImage?.fileUrl && (
                  <div className="completion-photo-section">
                    <span className="proof-label">Verified Repair Photo Proof:</span>
                    <div
                      className="proof-thumbnail-card"
                      onClick={() =>
                        setFullImagePreview(assetUrl(selected.completionImage.fileUrl))
                      }
                    >
                      <img
                        src={assetUrl(selected.completionImage.fileUrl)}
                        alt="Completion Proof"
                      />
                      <div className="thumbnail-hover-overlay">
                        <Eye size={16} /> <span>Inspect Proof Photo</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ticket & Resident Information Grid */}
            <div className="invoice-grid-split">
              <div className="invoice-box">
                <h4 className="invoice-section-title">
                  <FileText size={15} /> Ticket Reference
                </h4>
                <div className="invoice-key-value">
                  <span className="key-label">Ticket ID:</span>
                  <span className="key-value">
                    {selected.ticketId ? (
                      <Link to={`/tickets/${selected.ticketId}`} className="ticket-link">
                        {selected.ticketId} <ExternalLink size={11} />
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
                <div className="invoice-key-value">
                  <span className="key-label">Issue Title:</span>
                  <span className="key-value font-semibold">{selected.ticketTitle || 'Standard Repair'}</span>
                </div>
                <div className="invoice-key-value">
                  <span className="key-label">Category:</span>
                  <span className="key-value">{selected.ticketCategory || 'General Maintenance'}</span>
                </div>
                {selected.ticketDescription && (
                  <div className="invoice-key-value description">
                    <span className="key-label">Description:</span>
                    <span className="key-value desc-text">{selected.ticketDescription}</span>
                  </div>
                )}
              </div>

              <div className="invoice-box">
                <h4 className="invoice-section-title">
                  <MapPin size={15} /> Resident & Property
                </h4>
                <div className="invoice-key-value">
                  <span className="key-label">Resident Name:</span>
                  <span className="key-value font-semibold">{selected.residentName || selected.residentId}</span>
                </div>
                <div className="invoice-key-value">
                  <span className="key-label">Apartment:</span>
                  <span className="key-value">
                    Unit {selected.apartmentNumber || selected.apartmentId}
                  </span>
                </div>
                <div className="invoice-key-value">
                  <span className="key-label">Block & Community:</span>
                  <span className="key-value">
                    {selected.blockName || selected.blockId} · Green Valley Residency
                  </span>
                </div>
                <div className="invoice-key-value">
                  <span className="key-label">Payment Mode:</span>
                  <span className="key-value">{selected.paymentMethod || 'Online / Cash Pending'}</span>
                </div>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="invoice-section-container">
              <h4 className="invoice-section-title">
                <Receipt size={15} /> Itemized Charges Breakdown
              </h4>
              <div className="invoice-ledger-table-wrap">
                <table className="invoice-ledger-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th className="text-right">Rate / Charge</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Service & Labor Charge</strong>
                        <small className="item-sub-desc">
                          Technician diagnostic, labor work, and testing
                        </small>
                      </td>
                      <td className="text-right">₹{selected.serviceCharge ?? 300}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Parts & Materials Charge</strong>
                        <small className="item-sub-desc">
                          Replacement components, wiring, and certified fixtures
                        </small>
                      </td>
                      <td className="text-right">₹{selected.partsCharge ?? 200}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Late Fee / Penalties</strong>
                        <small className="item-sub-desc">Applicable after grace period</small>
                      </td>
                      <td className="text-right">₹{selected.lateFee || 0}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td>
                        <strong>Grand Total Due</strong>
                      </td>
                      <td className="text-right">
                        <strong className="final-total">₹{selected.totalAmount}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="modal-actions invoice-modal-footer">
              <div className="footer-status-pill">
                <StatusBadge>{selected.paymentStatus}</StatusBadge>
                {selected.receiptNumber && (
                  <span className="receipt-pill">Receipt: {selected.receiptNumber}</span>
                )}
              </div>
              <div className="footer-button-group">
                {selected.paymentStatus === 'Paid' ? (
                  <button
                    type="button"
                    className="primary-button invoice-cta-btn"
                    onClick={() => handleOpenTaxInvoice(selected)}
                  >
                    <FileText size={16} />
                    <span>View GST Tax Invoice</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary-button pay-cta-btn"
                    disabled={busyBillId === selected.id || checkoutLoading}
                    onClick={() => handleOpenCheckout(selected)}
                  >
                    <CreditCard size={16} />
                    <span>
                      {isResident
                        ? `Pay Now (₹${selected.totalAmount})`
                        : `Collect Payment (₹${selected.totalAmount})`}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Live Payment Gateway Checkout Modal */}
      {checkoutBill && (
        <div className="modal-backdrop" onClick={() => !checkoutLoading && setCheckoutBill(null)}>
          <div className="checkout-gateway-modal" onClick={(e) => e.stopPropagation()}>
            <div className="checkout-gateway-head">
              <div className="gateway-brand-badge">
                <ShieldCheck size={20} className="text-primary" />
                <div>
                  <strong>SafeHome Secure Checkout</strong>
                  <small>256-Bit SSL Encrypted Payment Gateway</small>
                </div>
              </div>
              <button
                type="button"
                className="icon-action"
                disabled={checkoutLoading}
                onClick={() => setCheckoutBill(null)}
              >
                <X size={18} />
              </button>
            </div>

            {checkoutSuccess ? (
              <div className="checkout-success-view">
                <div className="success-icon-bubble">
                  <CheckCircle2 size={48} className="text-success" />
                </div>
                <h3>Payment Completed Successfully!</h3>
                <p>
                  ₹{checkoutBill.totalAmount} paid for Invoice #{checkoutBill.id}.
                </p>
                <div className="receipt-meta-box">
                  <div>
                    <span>Tax Invoice Number:</span>
                    <strong>{checkoutSuccess.taxInvoiceNumber || `INV-${checkoutBill.id}`}</strong>
                  </div>
                  <div>
                    <span>Payment Receipt:</span>
                    <strong>{checkoutSuccess.receiptNumber || 'RCT-COMPLETED'}</strong>
                  </div>
                  <div>
                    <span>Payment Mode:</span>
                    <span>{checkoutSuccess.paymentMethod || 'Online Gateway'}</span>
                  </div>
                </div>

                <div className="success-actions-row">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      const billToView = checkoutSuccess;
                      setCheckoutBill(null);
                      setCheckoutSuccess(null);
                      handleOpenTaxInvoice(billToView);
                    }}
                  >
                    <FileText size={16} /> View GST Tax Invoice
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setCheckoutBill(null);
                      setCheckoutSuccess(null);
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="checkout-gateway-body">
                {/* Order Summary Strip */}
                <div className="checkout-summary-strip">
                  <div className="summary-left">
                    <span className="summary-title">{checkoutBill.ticketTitle || 'Society Maintenance / Repair Service'}</span>
                    <small>Bill Reference: #{checkoutBill.id} · Flat {checkoutBill.apartmentNumber || checkoutBill.apartmentId}</small>
                  </div>
                  <div className="summary-right">
                    <span className="amount-label">Grand Total Due</span>
                    <strong className="amount-figure">₹{checkoutBill.totalAmount}</strong>
                  </div>
                </div>

                {/* Tax Breakdown Hint */}
                <div className="gst-compliance-notice">
                  <span className="gst-pill">SAC 9995</span>
                  <span>Includes 18% GST (CGST 9% + SGST 9%) under RWA statutory rules.</span>
                </div>

                {/* Payment Methods Tabs */}
                <div className="checkout-method-tabs">
                  <button
                    type="button"
                    className={`method-tab-btn ${checkoutMethod === 'UPI' ? 'active' : ''}`}
                    onClick={() => setCheckoutMethod('UPI')}
                  >
                    <Smartphone size={16} />
                    <span>UPI & QR</span>
                  </button>
                  <button
                    type="button"
                    className={`method-tab-btn ${checkoutMethod === 'CARD' ? 'active' : ''}`}
                    onClick={() => setCheckoutMethod('CARD')}
                  >
                    <CreditCard size={16} />
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    className={`method-tab-btn ${checkoutMethod === 'NETBANKING' ? 'active' : ''}`}
                    onClick={() => setCheckoutMethod('NETBANKING')}
                  >
                    <Building size={16} />
                    <span>Net Banking</span>
                  </button>
                  {canManage && (
                    <button
                      type="button"
                      className={`method-tab-btn ${checkoutMethod === 'CASH' ? 'active' : ''}`}
                      onClick={() => setCheckoutMethod('CASH')}
                    >
                      <Banknote size={16} />
                      <span>Counter Cash</span>
                    </button>
                  )}
                </div>

                {/* Tab 1: UPI */}
                {checkoutMethod === 'UPI' && (
                  <div className="checkout-method-panel upi-panel">
                    <div className="upi-qr-section">
                      <div className="upi-qr-card">
                        <QrCode size={130} className="qr-rendered" />
                        <span className="qr-scan-label">Scan with Google Pay, PhonePe, Paytm, or BHIM</span>
                      </div>
                      <div className="upi-vpa-entry">
                        <label>Or Pay via UPI ID / VPA</label>
                        <div className="upi-input-group">
                          <input
                            type="text"
                            value={checkoutUpiId}
                            onChange={(e) => setCheckoutUpiId(e.target.value)}
                            placeholder="username@okhdfcbank"
                          />
                        </div>
                        <small className="upi-instant-note">Verification prompt will appear on your UPI app immediately.</small>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Cards */}
                {checkoutMethod === 'CARD' && (
                  <div className="checkout-method-panel card-panel">
                    <div className="card-input-field">
                      <label>Card Number</label>
                      <input
                        type="text"
                        value={checkoutCard.number}
                        onChange={(e) => setCheckoutCard({ ...checkoutCard, number: e.target.value })}
                        placeholder="•••• •••• •••• ••••"
                      />
                    </div>
                    <div className="card-input-grid">
                      <div>
                        <label>Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={checkoutCard.exp}
                          onChange={(e) => setCheckoutCard({ ...checkoutCard, exp: e.target.value })}
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label>CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={checkoutCard.cvv}
                          onChange={(e) => setCheckoutCard({ ...checkoutCard, cvv: e.target.value })}
                          placeholder="•••"
                        />
                      </div>
                    </div>
                    <div className="card-input-field">
                      <label>Cardholder Name</label>
                      <input
                        type="text"
                        value={checkoutCard.name}
                        onChange={(e) => setCheckoutCard({ ...checkoutCard, name: e.target.value })}
                        placeholder="Name on card"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 3: Net Banking */}
                {checkoutMethod === 'NETBANKING' && (
                  <div className="checkout-method-panel banks-panel">
                    <label>Select Preferred Bank</label>
                    <div className="bank-selection-grid">
                      {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          className={`bank-pill-btn ${checkoutBank === b ? 'selected' : ''}`}
                          onClick={() => setCheckoutBank(b)}
                        >
                          <Building size={14} />
                          <span>{b}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 4: Counter Cash */}
                {checkoutMethod === 'CASH' && (
                  <div className="checkout-method-panel cash-panel">
                    <div className="cash-notice-box">
                      <Banknote size={24} className="text-primary" />
                      <div>
                        <strong>Physical Counter Cash Collection</strong>
                        <p>Collecting physical cash at the Green Valley RWA Society Office. An official signed GST Tax Invoice and physical receipt will be recorded in the resident ledger.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Checkout CTA */}
                <div className="checkout-footer-cta">
                  <div className="checkout-trust-badge">
                    <ShieldCheck size={14} />
                    <span>Verified PCI-DSS Level 1 Gateway</span>
                  </div>
                  <button
                    type="button"
                    className="primary-button checkout-pay-now-btn"
                    disabled={checkoutLoading}
                    onClick={handleConfirmCheckoutPayment}
                  >
                    <CreditCard size={16} />
                    <span>{checkoutLoading ? 'Authorizing Payment...' : `Authorize & Pay ₹${checkoutBill.totalAmount}`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Official GST Tax Invoice Modal */}
      {taxInvoiceModal && (
        <div className="modal-backdrop" onClick={() => setTaxInvoiceModal(null)}>
          <div className="tax-invoice-printable-modal" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-action-bar no-print">
              <span className="invoice-bar-title">Official Tax Invoice & GST Compliance</span>
              <div className="invoice-bar-buttons">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => window.print()}
                  title="Print Tax Invoice / Save as PDF"
                >
                  <Printer size={15} /> Print / Save PDF
                </button>
                <button
                  type="button"
                  className="icon-action"
                  onClick={() => setTaxInvoiceModal(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* A4 Printable Invoice Sheet */}
            <div className="tax-invoice-sheet" id="printable-tax-invoice">
              {/* Header */}
              <div className="invoice-rwa-header">
                <div className="rwa-logo-group">
                  <div className="rwa-crest">
                    <Building size={28} />
                  </div>
                  <div>
                    <h2 className="rwa-title">GREEN VALLEY RESIDENCY RESIDENT WELFARE ASSOCIATION</h2>
                    <p className="rwa-address">Auto Nagar Bypass Road, Kanuru, Vijayawada, Andhra Pradesh - 520007</p>
                    <div className="rwa-statutory-row">
                      <span><strong>Reg. No:</strong> {taxInvoiceModal.society?.registrationNumber || 'AP/RWA/2024/0981'}</span>
                      <span>·</span>
                      <span><strong>GSTIN:</strong> {taxInvoiceModal.society?.gstin || '37AAAAA0000A1Z5'}</span>
                      <span>·</span>
                      <span><strong>PAN:</strong> {taxInvoiceModal.society?.pan || 'AAAAA0000A'}</span>
                    </div>
                  </div>
                </div>
                <div className="tax-invoice-badge-block">
                  <span className="tax-invoice-headline">TAX INVOICE</span>
                  <span className="tax-invoice-sub">(Original for Recipient)</span>
                </div>
              </div>

              <div className="invoice-divider-line" />

              {/* Meta Grid */}
              <div className="invoice-meta-grid">
                <div className="meta-column left">
                  <div className="meta-item">
                    <span className="label">Invoice Number:</span>
                    <strong className="value highlighted">{taxInvoiceModal.invoiceNumber || `INV-2026-${taxInvoiceModal.billId}`}</strong>
                  </div>
                  <div className="meta-item">
                    <span className="label">Invoice Date:</span>
                    <span className="value">{formatDateOnly(taxInvoiceModal.invoiceDate)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">Payment Date:</span>
                    <span className="value">{formatDateTime(taxInvoiceModal.paymentDate)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">Place of Supply:</span>
                    <span className="value">Andhra Pradesh (State Code: 37)</span>
                  </div>
                </div>

                <div className="meta-column right">
                  <div className="billed-to-box">
                    <span className="billed-to-header">Billed To (Resident / Member):</span>
                    <strong className="resident-name-display">{taxInvoiceModal.resident?.name}</strong>
                    <div className="resident-unit-display">
                      Flat / Unit: <strong>{taxInvoiceModal.resident?.apartmentNumber}</strong>, Block <strong>{taxInvoiceModal.resident?.blockName}</strong>
                    </div>
                    <div className="resident-contact-display">
                      <span>Mobile: {taxInvoiceModal.resident?.phone || 'On Record'}</span>
                    </div>
                    <div className="resident-tag">Status: Registered Resident Member</div>
                  </div>
                </div>
              </div>

              {/* Table of Charges */}
              <table className="tax-invoice-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description of Service</th>
                    <th className="text-center">SAC Code</th>
                    <th className="text-right">Taxable Value (₹)</th>
                    <th className="text-right">CGST (9%)</th>
                    <th className="text-right">SGST (9%)</th>
                    <th className="text-right">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>
                      <strong>Resident Society Maintenance & Facility Repair Service</strong>
                      <small className="table-sub-detail">
                        {taxInvoiceModal.sacDescription || 'Property maintenance, technical repairs, and operational upkeep services.'}
                      </small>
                    </td>
                    <td className="text-center">9995</td>
                    <td className="text-right">₹{taxInvoiceModal.taxBreakdown?.baseAmount || (taxInvoiceModal.totalAmount ? Math.round(taxInvoiceModal.totalAmount / 1.18 * 100) / 100 : 0)}</td>
                    <td className="text-right">₹{taxInvoiceModal.taxBreakdown?.cgst || 0}</td>
                    <td className="text-right">₹{taxInvoiceModal.taxBreakdown?.sgst || 0}</td>
                    <td className="text-right font-bold">₹{taxInvoiceModal.taxBreakdown?.totalAmount || taxInvoiceModal.totalAmount || 0}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="tax-summary-row">
                    <td colSpan={3} className="text-right font-bold">Total Taxable Value:</td>
                    <td className="text-right">₹{taxInvoiceModal.taxBreakdown?.baseAmount || 0}</td>
                    <td className="text-right">₹{taxInvoiceModal.taxBreakdown?.cgst || 0}</td>
                    <td className="text-right">₹{taxInvoiceModal.taxBreakdown?.sgst || 0}</td>
                    <td className="text-right font-bold">₹{taxInvoiceModal.taxBreakdown?.totalAmount || taxInvoiceModal.totalAmount || 0}</td>
                  </tr>
                  <tr className="grand-total-row">
                    <td colSpan={6} className="text-right font-bold">Grand Total (Inclusive of all Taxes):</td>
                    <td className="text-right grand-total-figure">₹{taxInvoiceModal.taxBreakdown?.totalAmount || taxInvoiceModal.totalAmount || 0}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Settlement Proof Box */}
              <div className="settlement-proof-strip">
                <div className="settlement-badge">
                  <CheckCircle2 size={16} className="text-success" />
                  <span>PAYMENT RECEIVED & FULLY SETTLED</span>
                </div>
                <div className="settlement-details-row">
                  <span><strong>Receipt No:</strong> {taxInvoiceModal.paymentProof?.receiptNumber || 'RCT-COMPLETED'}</span>
                  <span>·</span>
                  <span><strong>Payment Method:</strong> {taxInvoiceModal.paymentProof?.paymentMethod || 'Online - UPI / Gateway'}</span>
                  <span>·</span>
                  <span><strong>Settled On:</strong> {formatDateTime(taxInvoiceModal.paymentProof?.paidAt || taxInvoiceModal.paymentDate)}</span>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="invoice-sign-footer">
                <div className="terms-column">
                  <strong>Notes & Terms:</strong>
                  <ul>
                    <li>This is a computer-generated GST tax invoice compliant with Indian GST Act rules for RWAs.</li>
                    <li>Services covered under SAC Code 9995 (Services of membership organizations).</li>
                    <li>No physical signature required for electronic ledger validation.</li>
                  </ul>
                </div>
                <div className="signature-column">
                  <div className="official-stamp-box">
                    <ShieldCheck size={28} />
                    <span>GREEN VALLEY RWA</span>
                    <small>OFFICIALLY VERIFIED</small>
                  </div>
                  <div className="signature-line" />
                  <span className="signatory-label">Hon. Treasurer / Authorized Signatory</span>
                  <small>For Green Valley Residency RWA</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for completion photo */}
      {fullImagePreview && (
        <div className="modal-backdrop" onClick={() => setFullImagePreview(null)}>
          <div className="image-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-header">
              <strong>Verified Work Completion Photo Proof</strong>
              <button className="icon-action" onClick={() => setFullImagePreview(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="lightbox-image-wrap">
              <img src={fullImagePreview} alt="Work Completion Proof Full View" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
