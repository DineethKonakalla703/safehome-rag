import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  Droplets,
  Eye,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createVendor, listVendors } from '../api/vendorApi';
import PageHeader from '../components/PageHeader';
import { getCurrentUser } from '../utils/auth';

const defaultVendorsData = [
  {
    vendorId: 'VEN-001',
    rank: 1,
    name: 'AquaFix Plumbing Solutions',
    category: 'Plumbing',
    experience: '8+ years experience',
    rating: 4.8,
    reviewsCount: 124,
    responseTime: '< 2 hours',
    priceTier: '$$ Moderate',
    location: 'Green Valley & 5 nearby areas',
    distanceKm: 3.2,
    availability: 'Available 24/7',
    emergencyAvailable: true,
    services: ['Leak Repair', 'Pipe Installation', 'Drain Cleaning', 'Water Heater'],
    matchScore: 95,
    matchBadge: '#1 Match',
    completedJobs: 240,
    costRange: '₹800 - ₹2,500 for standard residential plumbing repairs.',
    whyRecommended: [
      { label: 'Proven Track Record', detail: 'High customer satisfaction with 124 positive reviews.', icon: CheckCircle2, type: 'success' },
      { label: 'Fast Response Time', detail: 'Typically responds within 2 hours for urgent issues.', icon: Clock, type: 'primary' },
      { label: 'Warranty Support', detail: 'Provides 6–12 months warranty on all repair work.', icon: ShieldCheck, type: 'primary' },
      { label: 'Close Proximity', detail: '3.2 km from Green Valley Residency.', icon: MapPin, type: 'primary' },
      { label: 'Strong Past Performance', detail: 'Successfully completed 240+ work orders in the community.', icon: BarChart3, type: 'primary' },
      { label: 'Estimated Cost Range', detail: '₹800 - ₹2,500 for standard residential plumbing repairs.', icon: CreditCard, type: 'success' },
    ],
  },
  {
    vendorId: 'VEN-002',
    rank: 2,
    name: 'PowerPro Electrical Services',
    category: 'Electrical',
    experience: '10+ years experience',
    rating: 4.7,
    reviewsCount: 98,
    responseTime: '< 3 hours',
    priceTier: '$$ Moderate',
    location: 'Green Valley & 8 nearby areas',
    distanceKm: 4.5,
    availability: 'Available 24/7',
    emergencyAvailable: true,
    services: ['Switchboard Repair', 'Wiring & Rewiring', 'Lighting', 'Electrical Safety Audit'],
    matchScore: 91,
    matchBadge: '#2 Match',
    completedJobs: 185,
    costRange: '₹600 - ₹2,000 for electrical diagnosis and circuit fixes.',
    whyRecommended: [
      { label: 'Proven Track Record', detail: '98 positive residential reviews with verified licenses.', icon: CheckCircle2, type: 'success' },
      { label: 'Fast Response Time', detail: 'Urgent electrician dispatch under 3 hours guaranteed.', icon: Clock, type: 'primary' },
      { label: 'Certified Technicians', detail: 'All staff hold state government wireman certifications.', icon: ShieldCheck, type: 'primary' },
      { label: 'Close Proximity', detail: '4.5 km from society main gate.', icon: MapPin, type: 'primary' },
      { label: 'Safety Compliance', detail: 'Zero safety hazard incidents recorded in 3 years.', icon: BarChart3, type: 'primary' },
      { label: 'Transparent Rates', detail: '₹600 - ₹2,000 standard hourly breakdown with bill receipts.', icon: CreditCard, type: 'success' },
    ],
  },
  {
    vendorId: 'VEN-003',
    rank: 3,
    name: 'ElevateCare Maintenance',
    category: 'Elevator Maintenance',
    experience: '12+ years experience',
    rating: 4.6,
    reviewsCount: 76,
    responseTime: '< 4 hours',
    priceTier: '$$$ Premium',
    location: 'Green Valley & 10 nearby areas',
    distanceKm: 6.1,
    availability: 'Available 24/7',
    emergencyAvailable: true,
    services: ['Lift Servicing', 'Breakdown Support', 'Safety Inspection', 'AMC Services'],
    matchScore: 88,
    matchBadge: '#3 Match',
    completedJobs: 92,
    costRange: '₹2,500 - ₹8,000 for lift diagnostics and component servicing.',
    whyRecommended: [
      { label: 'OEM Certification', detail: 'Authorized partner for Otis, Johnson, and Schindler elevators.', icon: CheckCircle2, type: 'success' },
      { label: '24/7 Rescue Team', detail: 'Dedicated breakdown crew for passenger entrapment emergencies.', icon: Clock, type: 'primary' },
      { label: 'Comprehensive AMC', detail: 'Includes monthly preventive check and government safety certificates.', icon: ShieldCheck, type: 'primary' },
      { label: 'Society Track Record', detail: 'Manages Block A and Block B passenger lifts smoothly.', icon: BarChart3, type: 'primary' },
      { label: 'High Reliability', detail: '99.4% uptime across serviced elevators in the region.', icon: Star, type: 'primary' },
      { label: 'Parts Guarantee', detail: 'Genuine OEM replacement parts with 2-year warranty.', icon: CreditCard, type: 'success' },
    ],
  },
  {
    vendorId: 'VEN-004',
    rank: 4,
    name: 'CleanSpace Facilities',
    category: 'Cleaning Services',
    experience: '6+ years experience',
    rating: 4.5,
    reviewsCount: 63,
    responseTime: '< 6 hours',
    priceTier: '$ Budget Friendly',
    location: 'Green Valley & 6 nearby areas',
    distanceKm: 2.8,
    availability: 'Available (6 AM - 10 PM)',
    emergencyAvailable: false,
    services: ['Deep Cleaning', 'Water Tank Disinfection', 'Façade Wash', 'Corridor Sanitize'],
    matchScore: 84,
    matchBadge: '#4 Match',
    completedJobs: 140,
    costRange: '₹500 - ₹1,800 for apartment cleaning and common wash.',
    whyRecommended: [
      { label: 'Eco-Friendly Chemicals', detail: '100% biodegradable and child-safe cleaning agents.', icon: CheckCircle2, type: 'success' },
      { label: 'Mechanized Equipment', detail: 'Industrial scrubbers, pressure washers, and suction vacuums.', icon: Sparkles, type: 'primary' },
      { label: 'Background Verified', detail: 'Full police verification and identity checks for all staff.', icon: ShieldCheck, type: 'primary' },
      { label: 'Very Close Proximity', detail: 'Located only 2.8 km from Green Valley Residency.', icon: MapPin, type: 'primary' },
      { label: 'Consistent Ratings', detail: 'Average 4.5 star feedback across residential apartments.', icon: Star, type: 'primary' },
      { label: 'Affordable Rates', detail: '₹500 - ₹1,800 with bulk residential society discounts.', icon: CreditCard, type: 'success' },
    ],
  },
];

export default function VendorManagement() {
  const user = getCurrentUser();
  const [vendorsList, setVendorsList] = useState(defaultVendorsData);
  const [selectedVendor, setSelectedVendor] = useState(defaultVendorsData[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [sortBy, setSortBy] = useState('Sort by AI Rank');
  const [showAddModal, setShowAddModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    category: 'Plumbing',
    phone: '',
    email: '',
    hourlyRate: 600,
    rating: 4.8,
    warrantyPeriodMonths: 12,
    emergencyAvailable: true,
    location: 'Green Valley Residency',
  });

  const canManage = ['MAIN_ADMIN', 'FACILITY_MANAGER'].includes(user?.role);

  const loadBackend = () => {
    listVendors()
      .then((data) => {
        if (data && data.length > 0) {
          // Merge backend vendors with default template if needed
          const merged = data.map((v, idx) => {
            const matchTemplate = defaultVendorsData[idx] || defaultVendorsData[0];
            return {
              ...matchTemplate,
              vendorId: v.vendorId || `VEN-${idx + 1}`,
              name: v.name || matchTemplate.name,
              category: v.category || matchTemplate.category,
              rating: v.rating || matchTemplate.rating,
              emergencyAvailable: v.emergencyAvailable ?? matchTemplate.emergencyAvailable,
              location: v.location || matchTemplate.location,
              availability: v.emergencyAvailable ? 'Available 24/7' : 'Standard hours',
              rank: idx + 1,
              matchBadge: `#${idx + 1} Match`,
            };
          });
          setVendorsList(merged);
          setSelectedVendor(merged[0]);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadBackend();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createVendor({ ...form, communityId: user?.communityId });
      setShowAddModal(false);
      setFeedbackMsg('New vendor registered successfully!');
      setTimeout(() => setFeedbackMsg(''), 4000);
      loadBackend();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All Categories');
    setStatusFilter('All Status');
    setSortBy('Sort by AI Rank');
  };

  // Filter & sort logic
  const filteredVendors = vendorsList
    .filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'All Categories' || v.category === categoryFilter;
      const matchStatus =
        statusFilter === 'All Status' ||
        (statusFilter === 'Available 24/7' && v.emergencyAvailable) ||
        (statusFilter === 'Standard Hours' && !v.emergencyAvailable);
      return matchSearch && matchCat && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'Highest Rating') return b.rating - a.rating;
      if (sortBy === 'Fastest Response') return a.responseTime.localeCompare(b.responseTime);
      return a.rank - b.rank;
    });

  const getCategoryIcon = (category) => {
    const c = category.toLowerCase();
    if (c.includes('plumb')) return <Droplets size={20} className="cat-icon-blue" />;
    if (c.includes('elect')) return <Zap size={20} className="cat-icon-amber" />;
    if (c.includes('lift') || c.includes('elevat')) return <Building2 size={20} className="cat-icon-purple" />;
    if (c.includes('clean')) return <Sparkles size={20} className="cat-icon-green" />;
    return <Building2 size={20} className="cat-icon-blue" />;
  };

  return (
    <>
      <PageHeader
        eyebrow="External Operations"
        title="Vendor Management"
        subtitle="Verified external maintenance vendors ranked by AI recommendations for residential repairs."
        actions={
          canManage && (
            <button className="primary-button" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Register Vendor
            </button>
          )
        }
      />

      {feedbackMsg && (
        <div className="feedback-banner success mb-4">
          <CheckCircle2 size={16} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 4 Stat Metric Cards Row */}
      <div className="vendor-stats-grid">
        {/* Card 1: Approved Vendors */}
        <div className="vendor-stat-box">
          <div className="stat-icon-tile blue">
            <Users size={22} />
          </div>
          <div className="stat-info-tile">
            <span className="stat-label-text">Approved Vendors</span>
            <div className="stat-value-row">
              <strong>12</strong>
              <span className="stat-trend-up">↑ +2 this month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Verification */}
        <div className="vendor-stat-box">
          <div className="stat-icon-tile amber">
            <Clock size={22} />
          </div>
          <div className="stat-info-tile">
            <span className="stat-label-text">Pending Verification</span>
            <div className="stat-value-row">
              <strong>3</strong>
              <span className="stat-sub-note">Awaiting review</span>
            </div>
          </div>
        </div>

        {/* Card 3: Emergency Available */}
        <div className="vendor-stat-box">
          <div className="stat-icon-tile red">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-info-tile">
            <span className="stat-label-text">Emergency Available</span>
            <div className="stat-value-row">
              <strong>6</strong>
              <span className="stat-sub-note">24/7 service ready</span>
            </div>
          </div>
        </div>

        {/* Card 4: Avg. Rating */}
        <div className="vendor-stat-box">
          <div className="stat-icon-tile green">
            <Star size={22} />
          </div>
          <div className="stat-info-tile">
            <span className="stat-label-text">Avg. Rating</span>
            <div className="stat-value-row">
              <strong>4.6 / 5</strong>
              <span className="stat-sub-note">Based on 128 reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="vendor-toolbar-card">
        <div className="search-input-field">
          <Search size={16} className="search-lead-icon" />
          <input
            type="text"
            placeholder="Search vendors, services, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="toolbar-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="All Categories">All Categories</option>
          <option value="Plumbing">Plumbing</option>
          <option value="Electrical">Electrical</option>
          <option value="Elevator Maintenance">Elevator Maintenance</option>
          <option value="Cleaning Services">Cleaning Services</option>
        </select>

        <select
          className="toolbar-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All Status">All Status</option>
          <option value="Available 24/7">Available 24/7</option>
          <option value="Standard Hours">Standard Hours</option>
        </select>

        <select
          className="toolbar-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="Sort by AI Rank">Sort by AI Rank</option>
          <option value="Highest Rating">Highest Rating</option>
          <option value="Fastest Response">Fastest Response</option>
        </select>

        <button type="button" className="clear-filters-btn" onClick={handleClearFilters}>
          <RotateCcw size={14} />
          <span>Clear Filters</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="vendor-layout-grid">
        {/* Left Column: AI-Ranked Vendors List */}
        <div className="vendor-list-column">
          <div className="column-header-block">
            <div className="column-title-row">
              <Zap size={18} className="text-primary" />
              <h3>AI-Ranked Vendors ({filteredVendors.length})</h3>
            </div>
            <p>Verified vendors sorted by AI recommendations based on quality, response time, pricing and resident feedback.</p>
          </div>

          <div className="vendor-cards-stack">
            {filteredVendors.map((vendor) => {
              const isSelected = selectedVendor?.vendorId === vendor.vendorId;
              return (
                <div
                  key={vendor.vendorId}
                  className={`vendor-item-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedVendor(vendor)}
                >
                  <div className="vendor-card-left">
                    {/* Rank Badge */}
                    <div className="vendor-rank-badge">#{vendor.rank}</div>

                    {/* Category Icon */}
                    <div className="vendor-category-icon-box">
                      {getCategoryIcon(vendor.category)}
                    </div>

                    {/* Main Details */}
                    <div className="vendor-card-details">
                      <div className="vendor-name-row">
                        <h4>{vendor.name}</h4>
                        <CheckCircle2 size={15} className="verified-badge-blue" />
                        <span
                          className={`vendor-availability-pill ${
                            vendor.emergencyAvailable ? 'green' : 'blue'
                          }`}
                        >
                          <span className="dot" /> {vendor.availability}
                        </span>
                      </div>

                      <div className="vendor-subline">
                        <span>{vendor.category}</span>
                        <span className="bullet-sep">|</span>
                        <span>{vendor.experience}</span>
                      </div>

                      {/* Meta Stats Row */}
                      <div className="vendor-meta-metrics-row">
                        <span className="meta-metric-item rating">
                          <Star size={13} className="fill-amber" />
                          <strong>{vendor.rating}</strong> ({vendor.reviewsCount} reviews)
                        </span>
                        <span className="meta-metric-item">
                          <Clock size={13} /> {vendor.responseTime}
                        </span>
                        <span className="meta-metric-item pricing">
                          {vendor.priceTier}
                        </span>
                        <span className="meta-metric-item location">
                          <MapPin size={13} /> {vendor.location}
                        </span>
                      </div>

                      {/* Service Chips */}
                      <div className="vendor-services-tags">
                        {vendor.services?.map((svc) => (
                          <span key={svc} className="service-tag-pill">
                            {svc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions on Bottom Right */}
                  <div className="vendor-card-actions">
                    <button
                      type="button"
                      className="vendor-btn outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVendor(vendor);
                      }}
                    >
                      <Eye size={13} /> View
                    </button>
                    <button
                      type="button"
                      className="vendor-btn primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Assigning ${vendor.name} to active work orders.`);
                      }}
                    >
                      <ClipboardList size={13} /> Assign
                    </button>
                    <button
                      type="button"
                      className="vendor-btn outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Connecting to ${vendor.name}: +91 98480 22334`);
                      }}
                    >
                      <Phone size={13} /> Contact
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: AI Recommendation Insights */}
        {selectedVendor && (
          <aside className="vendor-insights-column">
            <div className="content-card insights-card-box">
              <div className="column-header-block">
                <div className="column-title-row">
                  <Sparkles size={18} className="text-primary" />
                  <h3>AI Recommendation Insights</h3>
                </div>
                <p>Detailed analysis and AI reasoning for the selected vendor.</p>
              </div>

              {/* Selected Vendor Profile Header */}
              <div className="selected-vendor-summary-card">
                <div className="summary-left-group">
                  <div className="vendor-category-icon-box small">
                    {getCategoryIcon(selectedVendor.category)}
                  </div>
                  <div>
                    <div className="name-with-badge">
                      <h4>{selectedVendor.name}</h4>
                      <CheckCircle2 size={14} className="verified-badge-blue" />
                    </div>
                    <small>{selectedVendor.category} | {selectedVendor.experience}</small>
                    <div className="rating-tiny">
                      <Star size={12} className="fill-amber" />
                      <span>{selectedVendor.rating} ({selectedVendor.reviewsCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="summary-match-badge">
                  {selectedVendor.matchBadge}
                </div>
              </div>

              {/* AI Match Confidence Ring Widget */}
              <div className="match-confidence-widget">
                <div className="confidence-radial-circle">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path
                      className="circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="circle"
                      strokeDasharray={`${selectedVendor.matchScore}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="confidence-percentage">{selectedVendor.matchScore}%</span>
                </div>

                <div className="confidence-text-block">
                  <strong>AI Match Confidence</strong>
                  <p>Highly recommended based on performance, reviews, and cost effectiveness.</p>
                </div>
              </div>

              {/* Why This Vendor is Recommended */}
              <div className="why-recommended-section">
                <h5>Why this vendor is recommended</h5>

                <div className="reasons-bullet-list">
                  {selectedVendor.whyRecommended?.map((reason, i) => {
                    const Icon = reason.icon;
                    return (
                      <div className="reason-item-row" key={i}>
                        <div className={`reason-icon-lead ${reason.type}`}>
                          <Icon size={16} />
                        </div>
                        <div className="reason-text-copy">
                          <strong>{reason.label}</strong>
                          <p>{reason.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Prominent Action Buttons */}
              <div className="insights-action-buttons">
                <button
                  type="button"
                  className="primary-action-btn"
                  onClick={() => alert(`Assigning ${selectedVendor.name} to current work order.`)}
                >
                  <ClipboardList size={16} />
                  <span>Assign to Work Order</span>
                </button>
                <button
                  type="button"
                  className="secondary-action-btn"
                  onClick={() => alert(`Dialing ${selectedVendor.name}...`)}
                >
                  <Phone size={15} />
                  <span>Contact Vendor</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Register New Vendor Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="resource-modal">
            <div className="modal-head">
              <h2>Register New External Vendor</h2>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowAddModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="resource-form">
              <label>
                Vendor Name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Metro Plumbers Ltd"
                  required
                />
              </label>

              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Elevator Maintenance">Elevator Maintenance</option>
                  <option value="Cleaning Services">Cleaning Services</option>
                  <option value="Structural">Structural</option>
                </select>
              </label>

              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98480 12345"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@vendor.com"
                />
              </label>

              <label>
                Hourly Rate (₹)
                <input
                  type="number"
                  value={form.hourlyRate}
                  onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
                />
              </label>

              <label>
                Rating (1-5)
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                />
              </label>

              <label>
                Location / Operating Areas
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Green Valley & 5 nearby areas"
                />
              </label>

              <label className="checkbox-label" style={{ gridColumn: '1 / -1' }}>
                <input
                  type="checkbox"
                  checked={form.emergencyAvailable}
                  onChange={(e) => setForm({ ...form, emergencyAvailable: e.target.checked })}
                />
                <span>24/7 Emergency Service Available</span>
              </label>

              <div className="modal-actions" style={{ gridColumn: '1 / -1' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={busy}>
                  {busy ? 'Saving...' : 'Save & Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
