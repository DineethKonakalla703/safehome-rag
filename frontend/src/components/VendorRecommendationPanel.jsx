import { Building2, Sparkles, Star } from 'lucide-react';

export default function VendorRecommendationPanel({ recommendations = [], onGenerate, busy, canManage }) {
  return (
    <section className="content-card action-card">
      <div className="card-title">
        <Building2 size={19} />
        <h2>AI Vendor Recommendations</h2>
      </div>
      <p className="muted">
        Ranks verified external vendors using category, rating, cost, warranty, and emergency availability.
      </p>

      {recommendations.length > 0 ? (
        recommendations.map((item) => (
          <div className="recommendation" key={item.vendorId}>
            <div className="recommendation-header">
              <div>
                <strong>{item.name}</strong>
                <span className="vendor-category-badge">{item.category}</span>
              </div>
              <span className="vendor-score">{item.score}/100</span>
            </div>
            <div className="vendor-meta-row">
              <span><Star size={13} className="text-amber" /> {item.rating}★</span>
              <span>₹{item.hourlyRate}/hr</span>
              {item.emergencyAvailable && <span className="text-success font-semibold">24/7 Emergency</span>}
              {item.warrantyMonths > 0 && <span>{item.warrantyMonths}m warranty</span>}
            </div>
            <p className="vendor-reason">{item.reason}</p>
          </div>
        ))
      ) : (
        <p className="muted">No vendor recommendations generated yet.</p>
      )}

      {canManage && (
        <button
          className="secondary-button full"
          disabled={busy}
          onClick={onGenerate}
        >
          <Sparkles size={16} /> Recommend external vendors
        </button>
      )}
    </section>
  );
}
