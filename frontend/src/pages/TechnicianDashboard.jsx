import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  MapPin,
  RefreshCw,
  Search,
  UploadCloud,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../api/apiClient';
import {
  getWorkOrders,
  updateWorkOrderStatus,
  uploadWorkOrderCompletionImage,
} from '../api/workOrderApi';
import DataState from '../components/DataState';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { getCurrentUser } from '../utils/auth';

export default function TechnicianDashboard() {
  const user = getCurrentUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING, COMPLETED
  const [searchQuery, setSearchQuery] = useState('');
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Form states per order ID
  const [notesState, setNotesState] = useState({});
  const [filesState, setFilesState] = useState({});
  const [previewsState, setPreviewsState] = useState({});

  // Image modal state for viewing full size proof
  const [fullImagePreview, setFullImagePreview] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getWorkOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFileChange = (orderId, file) => {
    if (!file) return;
    setFilesState((prev) => ({ ...prev, [orderId]: file }));
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewsState((prev) => ({ ...prev, [orderId]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (orderId) => {
    setFilesState((prev) => {
      const copy = { ...prev };
      delete copy[orderId];
      return copy;
    });
    setPreviewsState((prev) => {
      const copy = { ...prev };
      delete copy[orderId];
      return copy;
    });
  };

  const handleUpdateStatusAndUpload = async (order, targetStatus) => {
    setBusyOrderId(order.workOrderId);
    try {
      const note =
        notesState[order.workOrderId] !== undefined
          ? notesState[order.workOrderId]
          : order.completionNote || '';
      const file = filesState[order.workOrderId];

      if (file) {
        await uploadWorkOrderCompletionImage(order.workOrderId, file, targetStatus, note);
      } else {
        await updateWorkOrderStatus(order.workOrderId, targetStatus, note);
      }

      setFeedbackMsg(`Work Order ${order.workOrderId} updated to ${targetStatus}!`);
      setTimeout(() => setFeedbackMsg(''), 4000);

      // Clean local upload buffer for this order
      handleRemoveFile(order.workOrderId);
      await load();
    } catch (err) {
      alert(`Error updating work order: ${err.message}`);
    } finally {
      setBusyOrderId(null);
    }
  };

  if (loading && !orders.length) {
    return <DataState loading={loading} error={error} onRetry={load} />;
  }

  const assignedCount = orders.length;
  const inProgressCount = orders.filter((o) => o.status === 'In Progress').length;
  const completedCount = orders.filter((o) => o.status === 'Completed').length;
  const pendingCount = orders.filter((o) => o.status !== 'Completed').length;
  const emergencyCount = orders.filter(
    (o) => o.safetyRisk || o.severity === 'Critical' || o.severity === 'High'
  ).length;

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.workOrderId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.ticketId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.apartmentId || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'PENDING') return matchesSearch && order.status !== 'Completed';
    if (activeTab === 'COMPLETED') return matchesSearch && order.status === 'Completed';
    return matchesSearch;
  });

  return (
    <>
      <PageHeader
        eyebrow="Field Operations Desk"
        title="Technician Dashboard"
        subtitle={`Welcome back, ${user?.name || 'Technician'}. Manage your maintenance tasks, upload completion photos, and update resolution statuses.`}
        actions={
          <button className="secondary-button" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh Tasks
          </button>
        }
      />

      {feedbackMsg && (
        <div className="feedback-banner success mb-4">
          <CheckCircle2 size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Top 4 Stat Metrics */}
      <div className="vendor-stats-grid">
        <div className="vendor-stat-box">
          <div className="stat-icon-tile blue">
            <Wrench size={22} />
          </div>
          <div className="stat-info-tile">
            <span className="stat-label-text">Total Assigned</span>
            <div className="stat-value-row">
              <strong>{assignedCount}</strong>
              <span className="stat-sub-note">Work orders</span>
            </div>
          </div>
        </div>

        <div className="vendor-stat-box">
          <div className="stat-icon-tile amber">
            <Clock size={22} />
          </div>
          <div className="stat-info-tile">
            <span className="stat-label-text">Pending & In Progress</span>
            <div className="stat-value-row">
              <strong>{pendingCount}</strong>
              <span className="stat-sub-note">{inProgressCount} active now</span>
            </div>
          </div>
        </div>

        <div className="vendor-stat-box">
          <div className="stat-icon-tile green">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info-tile">
            <span className="stat-label-text">Completed Work</span>
            <div className="stat-value-row">
              <strong>{completedCount}</strong>
              <span className="stat-trend-up">Verified resolutions</span>
            </div>
          </div>
        </div>

        <div className="vendor-stat-box">
          <div className="stat-icon-tile red">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-info-tile">
            <span className="stat-label-text">Urgent / Safety Risks</span>
            <div className="stat-value-row">
              <strong>{emergencyCount}</strong>
              <span className="stat-sub-note">High priority items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="vendor-toolbar-card">
        <div className="search-input-field">
          <Search size={16} className="search-lead-icon" />
          <input
            type="text"
            placeholder="Search by order ID, ticket, title, or apartment..."
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
            All Tasks ({orders.length})
          </button>
          <button
            type="button"
            className={`tech-tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDING')}
          >
            Pending / In Progress ({pendingCount})
          </button>
          <button
            type="button"
            className={`tech-tab-btn ${activeTab === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setActiveTab('COMPLETED')}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="tech-tasks-grid">
        {filteredOrders.length === 0 ? (
          <div className="content-card tech-empty-card">
            <Wrench size={36} className="text-muted mb-2" />
            <h3>No work orders found</h3>
            <p>You have no assigned tasks matching the selected filter criteria.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isCompleted = order.status === 'Completed';
            const isBusy = busyOrderId === order.workOrderId;
            const previewUrl = previewsState[order.workOrderId];
            const currentNote =
              notesState[order.workOrderId] !== undefined
                ? notesState[order.workOrderId]
                : order.completionNote || '';
            const hasExistingImage = Boolean(order.completionImage?.fileUrl);

            return (
              <div
                key={order.workOrderId}
                className={`tech-card ${isCompleted ? 'completed-card' : ''}`}
              >
                <div className="tech-card-header">
                  <div className="tech-card-ids">
                    <strong className="order-pill">{order.workOrderId}</strong>
                    <Link
                      to={`/tickets/${order.ticketId}`}
                      className="ticket-link-pill"
                      title="View Ticket Case File"
                    >
                      <span>{order.ticketId}</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                  <StatusBadge>{order.status}</StatusBadge>
                </div>

                <div className="tech-card-body">
                  <h3 className="tech-task-title">{order.title}</h3>

                  <div className="tech-location-row">
                    <MapPin size={15} className="text-primary" />
                    <span>
                      {order.apartmentId ? <strong>Unit {order.apartmentId}</strong> : null}
                      {order.apartmentId && order.blockId ? ' · ' : ''}
                      {order.blockId || 'Green Valley Community'}
                    </span>
                  </div>

                  {order.description && (
                    <p className="tech-description-text">{order.description}</p>
                  )}

                  {/* Completion Status & Evidence Area */}
                  <div className="tech-completion-zone">
                    <div className="completion-zone-header">
                      <Camera size={16} className="text-primary" />
                      <strong>Work Completion Evidence & Status</strong>
                    </div>

                    {isCompleted ? (
                      <div className="completed-evidence-box">
                        <div className="evidence-badge-row">
                          <span className="completion-verified-tag">
                            <CheckCircle2 size={13} /> Work Completed
                          </span>
                          {order.completedAt && (
                            <small className="completed-timestamp">
                              Completed: {new Date(order.completedAt).toLocaleString()}
                            </small>
                          )}
                        </div>

                        {order.completionNote && (
                          <div className="completion-note-display">
                            <strong>Technician Note:</strong>
                            <p>{order.completionNote}</p>
                          </div>
                        )}

                        {hasExistingImage ? (
                          <div className="proof-image-container">
                            <span className="proof-label">Verified Photo Proof:</span>
                            <div
                              className="proof-thumbnail-card"
                              onClick={() => setFullImagePreview(assetUrl(order.completionImage.fileUrl))}
                            >
                              <img
                                src={assetUrl(order.completionImage.fileUrl)}
                                alt="Completion Proof"
                              />
                              <div className="thumbnail-hover-overlay">
                                <Eye size={16} /> <span>View Full</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="add-missing-proof-box">
                            <p className="no-image-text">No completion photo was attached.</p>
                            <label className="upload-photo-btn">
                              <Camera size={14} /> Upload Completion Photo
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) =>
                                  handleFileChange(order.workOrderId, e.target.files?.[0])
                                }
                                style={{ display: 'none' }}
                              />
                            </label>

                            {previewUrl && (
                              <div className="upload-preview-row">
                                <img src={previewUrl} alt="Preview" className="inline-preview-thumb" />
                                <button
                                  type="button"
                                  className="save-proof-btn"
                                  disabled={isBusy}
                                  onClick={() => handleUpdateStatusAndUpload(order, 'Completed')}
                                >
                                  {isBusy ? 'Saving...' : 'Save Photo'}
                                </button>
                                <button
                                  type="button"
                                  className="cancel-btn"
                                  onClick={() => handleRemoveFile(order.workOrderId)}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Form to Complete and Upload Image */
                      <div className="active-completion-form">
                        <label className="form-label">
                          Resolution / Completion Note
                          <textarea
                            rows="2"
                            placeholder="Describe what was repaired or fixed (e.g. replaced circuit breaker, tested wiring)..."
                            value={currentNote}
                            onChange={(e) =>
                              setNotesState((prev) => ({
                                ...prev,
                                [order.workOrderId]: e.target.value,
                              }))
                            }
                          />
                        </label>

                        {/* Image Upload Area */}
                        <div className="photo-upload-section">
                          <label className="form-label">Attach Completion Photo Proof</label>
                          {previewUrl ? (
                            <div className="staged-preview-box">
                              <img src={previewUrl} alt="Staged Preview" />
                              <div className="staged-info">
                                <small>{filesState[order.workOrderId]?.name}</small>
                                <button
                                  type="button"
                                  className="remove-thumb-btn"
                                  onClick={() => handleRemoveFile(order.workOrderId)}
                                >
                                  <X size={14} /> Remove Photo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="photo-dropzone">
                              <UploadCloud size={22} className="text-primary" />
                              <span>Click to attach completion photo (JPG, PNG, WEBP)</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) =>
                                  handleFileChange(order.workOrderId, e.target.files?.[0])
                                }
                                style={{ display: 'none' }}
                              />
                            </label>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="tech-card-actions">
                          {order.status !== 'In Progress' && (
                            <button
                              type="button"
                              className="secondary-button"
                              disabled={isBusy}
                              onClick={() => handleUpdateStatusAndUpload(order, 'In Progress')}
                            >
                              <Wrench size={14} /> Set In Progress
                            </button>
                          )}

                          <button
                            type="button"
                            className="primary-button complete-btn"
                            disabled={isBusy}
                            onClick={() => handleUpdateStatusAndUpload(order, 'Completed')}
                          >
                            <CheckCircle2 size={16} />
                            <span>{isBusy ? 'Saving & Uploading...' : 'Complete & Submit Proof'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox Modal for Viewing Full Resolution Proof Image */}
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
