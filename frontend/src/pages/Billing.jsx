import {
  AlertTriangle,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Clock3,
  CreditCard,
  ExternalLink,
  Eye,
  FileText,
  MapPin,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../api/apiClient';
import { generateMonthlyBills, updateBillStatus } from '../api/billApi';
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
                          {!isPaid && (
                            <button
                              type="button"
                              className="table-action pay-btn"
                              disabled={isBusy}
                              onClick={() => markPaid(bill.id, isResident ? 'Online - UPI' : 'Cash / Counter')}
                            >
                              <CreditCard size={13} /> {isBusy ? 'Processing...' : isResident ? 'Pay Now' : 'Mark Paid'}
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
                {selected.paymentStatus === 'Pending' && (
                  <button
                    type="button"
                    className="primary-button pay-cta-btn"
                    disabled={busyBillId === selected.id}
                    onClick={() =>
                      markPaid(
                        selected.id,
                        isResident ? 'Online - UPI / Card' : 'Direct Counter Cash'
                      )
                    }
                  >
                    <CreditCard size={16} />
                    <span>
                      {busyBillId === selected.id
                        ? 'Processing Payment...'
                        : isResident
                        ? `Pay Now (₹${selected.totalAmount})`
                        : 'Confirm & Mark Paid'}
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
