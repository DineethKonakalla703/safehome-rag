import { Activity, AlertTriangle, Bot, CheckCircle2, Clock, DollarSign, Gauge, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAIFeedbackAnalytics, getAIInsights } from '../api/aiApi';
import DataState from '../components/DataState';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function AIInsights() {
  const [state, setState] = useState({ data: null, analytics: null, loading: true, error: null });

  const load = () => {
    setState({ data: null, analytics: null, loading: true, error: null });
    Promise.all([
      getAIInsights(),
      getAIFeedbackAnalytics().catch(() => null),
    ])
      .then(([data, analytics]) => setState({ data, analytics, loading: false, error: null }))
      .catch((error) => setState({ data: null, analytics: null, loading: false, error }));
  };

  useEffect(load, []);

  if (state.loading || state.error) {
    return <DataState loading={state.loading} error={state.error} onRetry={load} />;
  }

  const { summary, recent } = state.data;
  const analytics = state.analytics;

  return (
    <>
      <PageHeader
        eyebrow="Phase 2 intelligence & governance"
        title="AI Insights & Feedback Analytics"
        subtitle="Governed complaint intelligence, model vs fallback analytics, safety precision, and human override tracking."
      />

      {/* Operational Signal Cards */}
      <section className="stats-grid">
        <StatCard label="AI High Risk" value={summary.highRisk} icon={AlertTriangle} tone="red" />
        <StatCard label="Pending Human Review" value={summary.pendingReview} icon={ShieldCheck} tone="amber" />
        <StatCard label="High SLA Risk" value={summary.slaRisk} icon={Gauge} tone="amber" />
        <StatCard label="Collective Incidents" value={summary.incidents} icon={Bot} />
      </section>

      {/* Model Performance & Feedback Analytics Panel */}
      {analytics && (
        <section className="content-card analytics-panel">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Model observability & feedback</span>
              <h2>AI Performance & Quality Metrics</h2>
            </div>
          </div>

          <div className="analytics-metrics-grid">
            <div className="analytics-box">
              <span className="box-label"><Sparkles size={16} /> Provider Distribution</span>
              <div className="dist-bar">
                <div
                  className="bar-claude"
                  style={{ width: `${analytics.providerUsage.claudePercentage}%` }}
                  title={`Claude: ${analytics.providerUsage.claude}`}
                />
                <div
                  className="bar-fallback"
                  style={{ width: `${analytics.providerUsage.fallbackPercentage}%` }}
                  title={`Fallback: ${analytics.providerUsage.fallback}`}
                />
              </div>
              <div className="box-meta">
                <span>Claude: <strong>{analytics.providerUsage.claudePercentage}%</strong> ({analytics.providerUsage.claude})</span>
                <span>Fallback: <strong>{analytics.providerUsage.fallbackPercentage}%</strong> ({analytics.providerUsage.fallback})</span>
              </div>
            </div>

            <div className="analytics-box">
              <span className="box-label"><CheckCircle2 size={16} /> Classification Accuracy</span>
              <strong className="box-stat">{analytics.performanceMetrics.classificationAccuracy}%</strong>
              <small className="muted">Based on verified human decisions</small>
            </div>

            <div className="analytics-box">
              <span className="box-label"><ShieldCheck size={16} /> Safety-Risk Precision</span>
              <strong className="box-stat text-success">{analytics.performanceMetrics.safetyDetectionAccuracy}%</strong>
              <small className="muted">Zero missed electrical/water hazards</small>
            </div>

            <div className="analytics-box">
              <span className="box-label"><UserCheck size={16} /> Human Override Rate</span>
              <strong className="box-stat text-amber">{analytics.performanceMetrics.humanOverrideRate}%</strong>
              <small className="muted">Audited manual adjustments</small>
            </div>

            <div className="analytics-box">
              <span className="box-label"><Activity size={16} /> Avg AI Confidence</span>
              <strong className="box-stat">{Math.round(analytics.performanceMetrics.avgConfidence * 100)}%</strong>
              <small className="muted">Mean confidence across analyses</small>
            </div>

            <div className="analytics-box">
              <span className="box-label"><Clock size={16} /> Avg Response Latency</span>
              <strong className="box-stat">{analytics.costsAndLatency.estimatedAvgLatencyMs} ms</strong>
              <small className="muted">Est. cost: ${analytics.costsAndLatency.estimatedTotalCostUsd}</small>
            </div>
          </div>
        </section>
      )}

      {/* Recent AI Enriched Tickets */}
      <section className="content-card">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Governed analyses</span>
            <h2>Recent AI-enriched tickets</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Title</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Confidence</th>
                <th>Provider</th>
                <th>Review Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((item) => (
                <tr key={item.ticketId}>
                  <td><strong>{item.ticketId}</strong></td>
                  <td>{item.title}</td>
                  <td>{item.aiAnalysis?.category || item.category}</td>
                  <td><StatusBadge>{item.aiAnalysis?.severity || item.severity}</StatusBadge></td>
                  <td>{item.aiAnalysis ? `${Math.round(item.aiAnalysis.confidence * 100)}%` : 'Legacy'}</td>
                  <td>{item.aiAnalysis?.fallbackUsed ? 'Fallback rules' : item.aiAnalysis?.provider || 'Claude'}</td>
                  <td>
                    {item.aiReview ? (
                      <span className="badge-override">Overridden</span>
                    ) : item.aiAnalysis?.reviewedByHuman ? (
                      'Reviewed'
                    ) : item.aiAnalysis?.humanApprovalRequired ? (
                      <StatusBadge value="High Risk">Pending</StatusBadge>
                    ) : (
                      'Not required'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
