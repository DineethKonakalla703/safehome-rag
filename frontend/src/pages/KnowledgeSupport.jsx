import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Droplets,
  ExternalLink,
  FileText,
  Link2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createKnowledgeDocument,
  listKnowledgeDocuments,
  queryKnowledge,
  reindexKnowledgeDocument,
} from '../api/knowledgeApi';
import PageHeader from '../components/PageHeader';
import { getCurrentUser } from '../utils/auth';

const defaultAnswerSteps = [
  'Keep a safe distance from the electrical switchboard and avoid any contact with water.',
  'Immediately switch off the main power supply if it is safe to do so.',
  'Inform the facility management team or technician without delay.',
  'Do not attempt any repairs yourself. Wait for authorized personnel to handle the situation.',
];

const defaultDocsList = [
  {
    documentId: 'KDOC001',
    title: 'Electrical Safety SOP',
    category: 'Electrical Safety',
    chunkCount: 1,
    color: 'red',
  },
  {
    documentId: 'KDOC002',
    title: 'Plumbing Leakage Handling Guide',
    category: 'Plumbing',
    chunkCount: 1,
    color: 'blue',
  },
  {
    documentId: 'KDOC003',
    title: 'Lift Emergency Procedure',
    category: 'Lift Safety',
    chunkCount: 1,
    color: 'green',
  },
  {
    documentId: 'KDOC004',
    title: 'Visitor and Security Rules',
    category: 'Security',
    chunkCount: 1,
    color: 'purple',
  },
];

export default function KnowledgeSupport() {
  const user = getCurrentUser();
  const [docs, setDocs] = useState([]);
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [question, setQuestion] = useState(
    'What should residents do when water is near an electrical switchboard?'
  );
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reindexingId, setReindexingId] = useState(null);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'SOP', category: 'Safety', content: '' });

  const canCreate = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'].includes(user?.role);

  const load = () =>
    listKnowledgeDocuments()
      .then((data) => {
        if (data && data.length > 0) {
          const colors = ['red', 'blue', 'green', 'purple', 'amber'];
          setDocs(
            data.map((d, i) => ({
              ...d,
              color: d.category?.toLowerCase().includes('electric')
                ? 'red'
                : d.category?.toLowerCase().includes('plumb')
                ? 'blue'
                : d.category?.toLowerCase().includes('lift')
                ? 'green'
                : d.category?.toLowerCase().includes('secur')
                ? 'purple'
                : colors[i % colors.length],
            }))
          );
        } else {
          setDocs(defaultDocsList);
        }
      })
      .catch(() => setDocs(defaultDocsList));

  useEffect(() => {
    load();
  }, []);

  const ask = async (e) => {
    e?.preventDefault();
    if (!question.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await queryKnowledge(question);
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleChipClick = (queryText) => {
    setQuestion(queryText);
  };

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createKnowledgeDocument(form);
      setForm({ title: '', type: 'SOP', category: 'Safety', content: '' });
      setShowAddForm(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReindex = async (docId) => {
    setReindexingId(docId);
    try {
      await reindexKnowledgeDocument(docId);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setReindexingId(null);
    }
  };

  const filteredDocs = (docs.length > 0 ? docs : defaultDocsList).filter((doc) =>
    (doc.title + doc.category).toLowerCase().includes(searchDocQuery.toLowerCase())
  );

  // Extract answer steps from result or use default sample steps
  const displaySteps =
    result?.answer
      ? result.answer
          .split(/(?:\r?\n)+/)
          .map((s) => s.replace(/^\d+[\.\)]\s*/, '').trim())
          .filter(Boolean)
      : defaultAnswerSteps;

  return (
    <>
      <PageHeader
        eyebrow="Hybrid GraphRAG-Style Support"
        title="Knowledge Support"
        subtitle="Ask questions grounded in approved documents and authorized CRM context, with semantic retrieval and keyword fallback."
      />

      <div className="knowledge-support-grid">
        {/* Left Column: Ask Form & Preview Response */}
        <div className="knowledge-main-column">
          {/* Card 1: Ask the knowledge base */}
          <section className="content-card knowledge-ask-card">
            <div className="card-custom-header">
              <div className="header-icon-square blue">
                <BookOpen size={20} />
              </div>
              <div className="header-title-box">
                <h2>Ask the knowledge base</h2>
                <p>Get accurate answers from approved documents and CRM context.</p>
              </div>
            </div>

            <form onSubmit={ask} className="ask-box-form">
              <div className="question-textarea-wrapper">
                <textarea
                  rows="3"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 1000))}
                  placeholder="What should residents do when water is near an electrical switchboard?"
                  maxLength={1000}
                />
                <span className="char-counter">{question.length}/1000</span>
              </div>

              {/* Try asking about chips */}
              <div className="try-asking-bar">
                <span className="try-asking-label">Try asking about</span>
                <div className="try-asking-chips">
                  <button
                    type="button"
                    className="topic-chip"
                    onClick={() => handleChipClick('What are the electrical safety guidelines for residents?')}
                  >
                    <Zap size={13} className="text-amber" />
                    <span>Electrical safety</span>
                  </button>
                  <button
                    type="button"
                    className="topic-chip"
                    onClick={() => handleChipClick('How should water leakage issues be handled?')}
                  >
                    <Droplets size={13} className="text-primary" />
                    <span>Water leakage</span>
                  </button>
                  <button
                    type="button"
                    className="topic-chip"
                    onClick={() => handleChipClick('What is the procedure during a lift emergency?')}
                  >
                    <Zap size={13} className="text-primary" />
                    <span>Lift emergency</span>
                  </button>
                  <button
                    type="button"
                    className="topic-chip"
                    onClick={() => handleChipClick('What are the community visitor and security rules?')}
                  >
                    <Shield size={13} className="text-primary" />
                    <span>Visitor rules</span>
                  </button>
                </div>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button
                type="submit"
                className="ask-sources-submit-btn"
                disabled={busy || !question.trim()}
              >
                <BookOpen size={16} />
                <span>{busy ? 'Searching & Grounding...' : 'Ask with sources'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </section>

          {/* Card 2: Preview response */}
          <section className="content-card knowledge-preview-card">
            <div className="card-custom-header">
              <div className="header-icon-square blue">
                <Sparkles size={20} />
              </div>
              <div className="header-title-box">
                <h2>Preview response</h2>
                <p>Sample answer based on your question</p>
              </div>
            </div>

            <div className="response-steps-list">
              {displaySteps.map((step, index) => (
                <div className="response-step-row" key={index}>
                  <div className="step-number-bubble">{index + 1}</div>
                  <p className="step-text">{step}</p>
                </div>
              ))}
            </div>

            {/* Sources section */}
            <div className="response-sources-section">
              <div className="sources-title-row">
                <Link2 size={14} />
                <span>Sources</span>
              </div>

              <div className="sources-cards-grid">
                {/* Source 1: Electrical Safety */}
                <div className="source-reference-card">
                  <div className="source-icon-badge red">
                    <FileText size={18} />
                  </div>
                  <div className="source-info-box">
                    <strong>Electrical Safety SOP</strong>
                    <small>Electrical Safety · 1 chunks</small>
                  </div>
                  <ExternalLink size={14} className="source-external-link" />
                </div>

                {/* Source 2: Plumbing Leakage */}
                <div className="source-reference-card">
                  <div className="source-icon-badge blue">
                    <FileText size={18} />
                  </div>
                  <div className="source-info-box">
                    <strong>Plumbing Leakage Handling Guide</strong>
                    <small>Plumbing · 1 chunks</small>
                  </div>
                  <ExternalLink size={14} className="source-external-link" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Knowledge documents (4) */}
        <aside className="knowledge-side-column">
          <section className="content-card knowledge-docs-card">
            <div className="docs-card-header">
              <div className="docs-header-left">
                <div className="header-icon-square blue">
                  <BookOpen size={19} />
                </div>
                <div>
                  <h2>Knowledge documents ({filteredDocs.length})</h2>
                  <p>Documents indexed and available for search</p>
                </div>
              </div>

              <div className="docs-search-input">
                <Search size={13} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchDocQuery}
                  onChange={(e) => setSearchDocQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="docs-list-vertical">
              {filteredDocs.map((doc) => (
                <div className="doc-item-row" key={doc.documentId || doc.title}>
                  <div className={`doc-lead-icon ${doc.color || 'blue'}`}>
                    <FileText size={18} />
                  </div>
                  <div className="doc-meta-info">
                    <strong>{doc.title}</strong>
                    <span>
                      <FileText size={12} className="inline-doc-icon" /> {doc.category} | {doc.chunkCount || 1} chunks
                    </span>
                  </div>
                  <div className="doc-actions-cluster">
                    <span className="doc-status-badge indexed">
                      <CheckCircle2 size={11} /> INDEXED
                    </span>
                    {canCreate && (
                      <button
                        className="doc-reindex-icon-btn"
                        title="Re-index vector embeddings"
                        disabled={reindexingId === doc.documentId}
                        onClick={() => handleReindex(doc.documentId)}
                      >
                        <RefreshCw size={12} className={reindexingId === doc.documentId ? 'spin' : ''} />
                      </button>
                    )}
                    <ChevronRight size={16} className="doc-arrow-icon" />
                  </div>
                </div>
              ))}
            </div>

            {canCreate && (
              <div className="add-doc-trigger-bar">
                <button
                  type="button"
                  className="secondary-button full"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  <Plus size={15} /> {showAddForm ? 'Close manual ingestion' : 'Add manual document'}
                </button>
              </div>
            )}
          </section>

          {/* Optional manual add knowledge form */}
          {canCreate && showAddForm && (
            <form className="content-card knowledge-form" onSubmit={add}>
              <div className="card-title">
                <Plus size={19} />
                <h2>Add manual knowledge</h2>
              </div>
              <input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <input
                placeholder="Type (e.g. SOP, Guide, Policy)"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
              />
              <input
                placeholder="Category (e.g. Electrical Safety, Lift)"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <textarea
                rows="5"
                placeholder="Document content (chunked automatically into vector embeddings)"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />
              <button className="primary-button" disabled={busy}>
                Ingest & Index Document
              </button>
            </form>
          )}
        </aside>
      </div>
    </>
  );
}
