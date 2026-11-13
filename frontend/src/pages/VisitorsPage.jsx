import {
  AlertCircle,
  Car,
  CheckCircle2,
  Clock,
  Copy,
  DoorOpen,
  LogOut,
  MapPin,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { visitorApi } from '../api/visitorApi';
import { ErrorState, LoadingState } from '../components/DataState';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getCurrentUser } from '../utils/auth';

export default function VisitorsPage({ security = false }) {
  const user = getCurrentUser();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState('');
  const [passModalVisitor, setPassModalVisitor] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [busyId, setBusyId] = useState(null);

  // New visitor form state
  const [newVisitor, setNewVisitor] = useState({
    name: '',
    phone: '',
    purpose: 'Personal Visit',
    apartmentId: user.apartmentId || 'A-102',
    blockId: user.blockId || 'B001',
    residentId: user.id || 'U003',
    vehicleNumber: '',
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await visitorApi.list();
      setVisitors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleVerifyPass = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    setVerifyError('');
    setVerifyResult(null);
    try {
      const result = await visitorApi.verifyPass(verifyCode.trim());
      setVerifyResult(result);
    } catch (err) {
      setVerifyError(err.message || 'No active gate pass found for this code.');
    }
  };

  const handleCheckIn = async (visitorId) => {
    setBusyId(visitorId);
    try {
      await visitorApi.checkIn(visitorId);
      setFeedbackMsg('Visitor verified and checked in at gate (Marked Inside).');
      setTimeout(() => setFeedbackMsg(''), 4500);
      setVerifyResult(null);
      setVerifyCode('');
      await load();
    } catch (err) {
      alert(`Check-in failed: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleCheckOut = async (visitorId) => {
    setBusyId(visitorId);
    try {
      await visitorApi.exit(visitorId);
      setFeedbackMsg('Visitor departure logged (Marked Exited).');
      setTimeout(() => setFeedbackMsg(''), 4500);
      await load();
    } catch (err) {
      alert(`Check-out failed: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = async (visitorId) => {
    setBusyId(visitorId);
    try {
      await visitorApi.approve(visitorId);
      setFeedbackMsg('Visitor pass approved.');
      setTimeout(() => setFeedbackMsg(''), 4500);
      await load();
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleCreatePass = async (e) => {
    e.preventDefault();
    try {
      const created = await visitorApi.create(newVisitor);
      setShowCreateModal(false);
      setFeedbackMsg(`Digital Gate Pass generated: ${created.passCode || created.visitorId}`);
      setTimeout(() => setFeedbackMsg(''), 4500);
      setPassModalVisitor(created);
      await load();
    } catch (err) {
      alert(`Failed to create gate pass: ${err.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (loading && !visitors.length) return <LoadingState label="Loading visitor records…" />;
  if (error && !visitors.length) return <ErrorState error={error} onRetry={load} />;

  const insideCount = visitors.filter((v) => v.status === 'Inside').length;
  const approvedCount = visitors.filter((v) => v.status === 'Approved' || v.status === 'Pending').length;
  const exitedCount = visitors.filter((v) => v.status === 'Exited').length;

  const filteredVisitors = visitors.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (v.name || '').toLowerCase().includes(q) ||
      (v.phone || '').toLowerCase().includes(q) ||
      (v.passCode || '').toLowerCase().includes(q) ||
      (v.apartmentId || '').toLowerCase().includes(q) ||
      (v.purpose || '').toLowerCase().includes(q);

    if (activeTab === 'INSIDE') return matchesSearch && v.status === 'Inside';
    if (activeTab === 'APPROVED') return matchesSearch && (v.status === 'Approved' || v.status === 'Pending');
    if (activeTab === 'EXITED') return matchesSearch && v.status === 'Exited';
    return matchesSearch;
  });

  return (
    <>
      <PageHeader
        eyebrow={security ? 'Gate Security Desk' : 'Visitor Pass & Access Control'}
        title={security ? 'Security Gate Operations' : 'Visitor Management & Digital Passes'}
        subtitle={
          security
            ? 'Verify resident gate pass codes, scan QR passes, and log entry & exit timestamps.'
            : 'Pre-approve guests, generate digital QR gate passes, and track entry logs.'
        }
        actions={
          <div className="page-header-actions-group">
            <button className="secondary-button" onClick={load}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button className="primary-button" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Pre-Approve Visitor Pass
            </button>
          </div>
        }
      />

      {feedbackMsg && (
        <div className="feedback-banner success mb-4">
          <CheckCircle2 size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Security Quick Gate Pass Verifier */}
      <div className="gate-pass-verifier-card">
        <div className="verifier-header">
          <ShieldCheck size={20} className="text-primary" />
          <div>
            <strong>Quick Gate Pass Verification</strong>
            <p>Scan visitor QR code or enter the 6-digit gate code (e.g. GP-842910) or visitor phone number.</p>
          </div>
        </div>

        <form onSubmit={handleVerifyPass} className="gate-verify-form">
          <div className="gate-verify-input-wrap">
            <QrCode size={18} className="gate-code-icon" />
            <input
              type="text"
              placeholder="Enter Pass Code (e.g. GP-842910) or phone..."
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
            />
          </div>
          <button type="submit" className="primary-button verify-submit-btn">
            <Search size={16} /> Verify Pass
          </button>
        </form>

        {verifyError && (
          <div className="verifier-alert error">
            <AlertCircle size={16} />
            <span>{verifyError}</span>
          </div>
        )}

        {verifyResult && (
          <div className="verified-visitor-result-card">
            <div className="verified-badge-row">
              <span className="verified-badge">
                <CheckCircle2 size={15} /> Valid Gate Pass
              </span>
              <strong className="verified-pass-code">{verifyResult.passCode || verifyResult.visitorId}</strong>
            </div>

            <div className="verified-grid">
              <div>
                <span className="info-label">Visitor Name</span>
                <strong>{verifyResult.name}</strong>
              </div>
              <div>
                <span className="info-label">Phone</span>
                <span>{verifyResult.phone}</span>
              </div>
              <div>
                <span className="info-label">Destination Unit</span>
                <strong>Unit {verifyResult.apartmentId} · Block {verifyResult.blockId}</strong>
              </div>
              <div>
                <span className="info-label">Purpose</span>
                <span>{verifyResult.purpose}</span>
              </div>
              {verifyResult.vehicleNumber && (
                <div>
                  <span className="info-label">Vehicle</span>
                  <span>{verifyResult.vehicleNumber}</span>
                </div>
              )}
              <div>
                <span className="info-label">Current Status</span>
                <StatusBadge>{verifyResult.status}</StatusBadge>
              </div>
            </div>

            <div className="verified-actions">
              {verifyResult.status !== 'Inside' && (
                <button
                  type="button"
                  className="primary-button check-in-btn"
                  disabled={busyId === verifyResult.visitorId}
                  onClick={() => handleCheckIn(verifyResult.visitorId)}
                >
                  <DoorOpen size={16} /> Confirm & Mark Inside
                </button>
              )}
              {verifyResult.status === 'Inside' && (
                <button
                  type="button"
                  className="secondary-button check-out-btn"
                  disabled={busyId === verifyResult.visitorId}
                  onClick={() => handleCheckOut(verifyResult.visitorId)}
                >
                  <LogOut size={16} /> Record Gate Exit
                </button>
              )}
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPassModalVisitor(verifyResult)}
              >
                <QrCode size={16} /> View Digital Pass Card
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setVerifyResult(null);
                  setVerifyCode('');
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <section className="stats-grid">
        <StatCard label="Total Visitor Logs" value={visitors.length} icon={Users} />
        <StatCard label="Currently Inside" value={insideCount} icon={DoorOpen} tone="green" />
        <StatCard label="Expected & Approved" value={approvedCount} icon={Shield} tone="blue" />
        <StatCard label="Checked Out Today" value={exitedCount} icon={Clock} />
      </section>

      {/* Search & Filter Tabs */}
      <div className="vendor-toolbar-card">
        <div className="search-input-field">
          <Search size={16} className="search-lead-icon" />
          <input
            type="text"
            placeholder="Search by Visitor Name, Pass Code, Phone, Unit, or Purpose..."
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
            All Logs ({visitors.length})
          </button>
          <button
            type="button"
            className={`tech-tab-btn ${activeTab === 'INSIDE' ? 'active' : ''}`}
            onClick={() => setActiveTab('INSIDE')}
          >
            Inside Community ({insideCount})
          </button>
          <button
            type="button"
            className={`tech-tab-btn ${activeTab === 'APPROVED' ? 'active' : ''}`}
            onClick={() => setActiveTab('APPROVED')}
          >
            Expected / Approved ({approvedCount})
          </button>
          <button
            type="button"
            className={`tech-tab-btn ${activeTab === 'EXITED' ? 'active' : ''}`}
            onClick={() => setActiveTab('EXITED')}
          >
            Exited ({exitedCount})
          </button>
        </div>
      </div>

      {/* Visitor Records Table */}
      <section className="content-card">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Security Ledger</span>
            <h2>Visitor Access Log</h2>
            <p>Real-time gate passes with digital QR verification codes and entry timestamps.</p>
          </div>
        </div>

        {filteredVisitors.length ? (
          <div className="table-wrap">
            <table className="billing-records-table">
              <thead>
                <tr>
                  <th>Pass Code</th>
                  <th>Visitor Name</th>
                  <th>Destination Unit</th>
                  <th>Purpose</th>
                  <th>Vehicle</th>
                  <th>Entry Time</th>
                  <th>Status</th>
                  <th>Gate Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.map((v) => {
                  const isInside = v.status === 'Inside';
                  return (
                    <tr key={v.visitorId}>
                      <td>
                        <strong className="pass-code-pill">
                          {v.passCode || v.visitorId}
                        </strong>
                      </td>
                      <td>
                        <div className="visitor-meta-cell">
                          <strong>{v.name}</strong>
                          <small><Phone size={11} /> {v.phone}</small>
                        </div>
                      </td>
                      <td>
                        <div className="unit-pill">
                          <MapPin size={12} className="text-primary" />
                          <span>Unit {v.apartmentId} · {v.blockId}</span>
                        </div>
                      </td>
                      <td>{v.purpose}</td>
                      <td>
                        {v.vehicleNumber ? (
                          <span className="vehicle-tag"><Car size={12} /> {v.vehicleNumber}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className="text-muted">
                          {v.entryTime ? new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending Entry'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge>{v.status}</StatusBadge>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="table-action view-btn"
                            onClick={() => setPassModalVisitor(v)}
                            title="View QR Gate Pass"
                          >
                            <QrCode size={13} /> Pass
                          </button>

                          {v.status === 'Pending' && (
                            <button
                              type="button"
                              className="table-action approve-btn"
                              disabled={busyId === v.visitorId}
                              onClick={() => handleApprove(v.visitorId)}
                            >
                              Approve
                            </button>
                          )}

                          {v.status !== 'Inside' && v.status !== 'Exited' && (
                            <button
                              type="button"
                              className="table-action check-in-btn"
                              disabled={busyId === v.visitorId}
                              onClick={() => handleCheckIn(v.visitorId)}
                            >
                              Check In
                            </button>
                          )}

                          {isInside && (
                            <button
                              type="button"
                              className="table-action check-out-btn"
                              disabled={busyId === v.visitorId}
                              onClick={() => handleCheckOut(v.visitorId)}
                            >
                              Check Out
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
            icon={Users}
            title="No visitor records found"
            description="Use the button above to pre-approve visitors or create new digital gate passes."
          />
        )}
      </section>

      {/* Digital QR Gate Pass Card Modal */}
      {passModalVisitor && (
        <div className="modal-backdrop" onClick={() => setPassModalVisitor(null)}>
          <div className="digital-gate-pass-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pass-card-header">
              <div className="pass-community-name">
                <Shield size={18} /> Green Valley Residency
              </div>
              <button className="icon-action" onClick={() => setPassModalVisitor(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="pass-body">
              <span className="pass-title-kicker">Digital Guest Access Pass</span>
              <h2 className="pass-visitor-name">{passModalVisitor.name}</h2>

              {/* Simulated QR Visual */}
              <div className="qr-code-box">
                <div className="qr-pattern-grid">
                  <QrCode size={140} className="qr-actual-svg" />
                </div>
                <div className="qr-pass-code-chip">
                  <span>PASS CODE:</span>
                  <strong>{passModalVisitor.passCode || passModalVisitor.visitorId}</strong>
                  <button
                    type="button"
                    className="copy-chip-btn"
                    onClick={() => copyToClipboard(passModalVisitor.passCode || passModalVisitor.visitorId)}
                  >
                    <Copy size={13} /> {copiedCode ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="pass-details-table">
                <div className="pass-detail-row">
                  <span>Host Unit:</span>
                  <strong>Unit {passModalVisitor.apartmentId} (Block {passModalVisitor.blockId})</strong>
                </div>
                <div className="pass-detail-row">
                  <span>Visitor Phone:</span>
                  <span>{passModalVisitor.phone}</span>
                </div>
                <div className="pass-detail-row">
                  <span>Purpose:</span>
                  <span>{passModalVisitor.purpose}</span>
                </div>
                {passModalVisitor.vehicleNumber && (
                  <div className="pass-detail-row">
                    <span>Vehicle Reg:</span>
                    <span>{passModalVisitor.vehicleNumber}</span>
                  </div>
                )}
                <div className="pass-detail-row">
                  <span>Access Status:</span>
                  <StatusBadge>{passModalVisitor.status}</StatusBadge>
                </div>
              </div>
            </div>

            <div className="pass-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => window.print()}
              >
                Print Pass
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => setPassModalVisitor(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Approve Visitor Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="resource-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="section-kicker">Security Pre-Authorization</span>
                <h2>Generate Visitor Gate Pass</h2>
              </div>
              <button className="icon-action" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePass} className="create-form">
              <label className="form-label">
                Visitor Full Name
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newVisitor.name}
                  onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                />
              </label>

              <label className="form-label">
                Visitor Phone Number
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={newVisitor.phone}
                  onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                />
              </label>

              <label className="form-label">
                Purpose of Visit
                <select
                  value={newVisitor.purpose}
                  onChange={(e) => setNewVisitor({ ...newVisitor, purpose: e.target.value })}
                >
                  <option value="Personal Visit">Personal Visit / Guest</option>
                  <option value="Delivery">Courier / Food Delivery</option>
                  <option value="Home Repair / Service">Home Repair / Service</option>
                  <option value="Cab / Driver">Cab / Taxi Pickup</option>
                  <option value="Official">Society Official</option>
                </select>
              </label>

              <div className="form-row">
                <label className="form-label">
                  Apartment Unit
                  <input
                    type="text"
                    required
                    value={newVisitor.apartmentId}
                    onChange={(e) => setNewVisitor({ ...newVisitor, apartmentId: e.target.value })}
                  />
                </label>

                <label className="form-label">
                  Block
                  <input
                    type="text"
                    required
                    value={newVisitor.blockId}
                    onChange={(e) => setNewVisitor({ ...newVisitor, blockId: e.target.value })}
                  />
                </label>
              </div>

              <label className="form-label">
                Vehicle Registration Number (Optional)
                <input
                  type="text"
                  placeholder="e.g. AP39AB1234"
                  value={newVisitor.vehicleNumber}
                  onChange={(e) => setNewVisitor({ ...newVisitor, vehicleNumber: e.target.value })}
                />
              </label>

              <div className="modal-actions">
                <button type="submit" className="primary-button">
                  <ShieldCheck size={16} /> Generate Gate Pass
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
