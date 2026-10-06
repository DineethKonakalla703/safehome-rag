import { Building2, Plus, Star, Phone, Mail, ShieldCheck, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createVendor, listVendors } from '../api/vendorApi';
import PageHeader from '../components/PageHeader';
import { getCurrentUser } from '../utils/auth';

export default function VendorManagement() {
  const user = getCurrentUser();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'Plumbing',
    phone: '',
    email: '',
    hourlyRate: 500,
    rating: 4.8,
    warrantyPeriodMonths: 6,
    emergencyAvailable: true,
    location: '',
  });

  const canManage = ['MAIN_ADMIN', 'FACILITY_MANAGER'].includes(user.role);

  const load = () => {
    setLoading(true);
    setError('');
    listVendors()
      .then(setVendors)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createVendor({ ...form, communityId: user.communityId });
      setShowAdd(false);
      setForm({ name: '', category: 'Plumbing', phone: '', email: '', hourlyRate: 500, rating: 4.8, warrantyPeriodMonths: 6, emergencyAvailable: true, location: '' });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="External operations"
        title="Vendor Management"
        subtitle="Verified external maintenance vendors ranked by AI recommendations for residential repairs."
        actions={
          canManage && (
            <button className="primary-button" onClick={() => setShowAdd(!showAdd)}>
              <Plus size={16} /> {showAdd ? 'Close Form' : 'Register Vendor'}
            </button>
          )
        }
      />

      {error && <div className="form-error mb-4"><AlertCircle size={16} />{error}</div>}

      {showAdd && (
        <form className="content-card mb-6" onSubmit={handleCreate}>
          <div className="card-title">
            <Building2 size={19} />
            <h2>Register New External Vendor</h2>
          </div>
          <div className="form-grid">
            <label>Vendor Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Category
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Lift Emergency">Lift Emergency</option>
                <option value="Structural">Structural</option>
                <option value="Gas Safety">Gas Safety</option>
                <option value="Housekeeping">Housekeeping</option>
              </select>
            </label>
            <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></label>
            <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label>Hourly Rate (₹)<input type="number" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })} /></label>
            <label>Rating (1-5)<input type="number" step="0.1" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></label>
            <label>Warranty (Months)<input type="number" value={form.warrantyPeriodMonths} onChange={(e) => setForm({ ...form, warrantyPeriodMonths: Number(e.target.value) })} /></label>
            <label>Location / Branch<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
          </div>
          <label className="checkbox-label mt-3">
            <input type="checkbox" checked={form.emergencyAvailable} onChange={(e) => setForm({ ...form, emergencyAvailable: e.target.checked })} />
            24/7 Emergency Service Available
          </label>
          <div className="form-actions mt-4">
            <button className="primary-button" type="submit">Save Vendor</button>
          </div>
        </form>
      )}

      <div className="content-card">
        <div className="card-title">
          <Building2 size={19} />
          <h2>Approved External Vendors ({vendors.length})</h2>
        </div>

        {loading ? (
          <p className="muted">Loading vendors...</p>
        ) : vendors.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor ID</th>
                  <th>Name & Category</th>
                  <th>Contact</th>
                  <th>Rate</th>
                  <th>Rating</th>
                  <th>Warranty</th>
                  <th>Emergency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.vendorId}>
                    <td><code>{v.vendorId}</code></td>
                    <td>
                      <strong>{v.name}</strong>
                      <span className="vendor-category-badge" style={{ display: 'block', width: 'fit-content', marginTop: 4 }}>
                        {v.category}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12 }}>
                        <span><Phone size={12} /> {v.phone}</span>
                        {v.email && <span><Mail size={12} /> {v.email}</span>}
                      </div>
                    </td>
                    <td>₹{v.hourlyRate}/hr</td>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Star size={13} className="text-amber" /> {v.rating}</span></td>
                    <td>{v.warrantyPeriodMonths} months</td>
                    <td>
                      {v.emergencyAvailable ? (
                        <span className="badge-resolved" style={{ fontSize: 11 }}>24/7 Support</span>
                      ) : (
                        <span className="muted" style={{ fontSize: 11 }}>Standard hours</span>
                      )}
                    </td>
                    <td><span className="badge-detected">{v.status || 'Active'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No vendors registered yet.</p>
        )}
      </div>
    </>
  );
}
