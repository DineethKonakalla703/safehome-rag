import { BookOpen, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createKnowledgeDocument, listKnowledgeDocuments, queryKnowledge, reindexKnowledgeDocument } from '../api/knowledgeApi';
import KnowledgeAnswerCard from '../components/KnowledgeAnswerCard';
import PageHeader from '../components/PageHeader';
import { getCurrentUser } from '../utils/auth';

export default function KnowledgeSupport() {
  const user = getCurrentUser();
  const [docs, setDocs] = useState([]);
  const [question, setQuestion] = useState('What should residents do when water is near an electrical switchboard?');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reindexingId, setReindexingId] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', type: 'SOP', category: 'Safety', content: '' });

  const canCreate = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'].includes(user.role);

  const load = () =>
    listKnowledgeDocuments()
      .then(setDocs)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const ask = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      setResult(await queryKnowledge(question));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createKnowledgeDocument(form);
      setForm({ title: '', type: 'SOP', category: 'Safety', content: '' });
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

  return (
    <>
      <PageHeader
        eyebrow="Hybrid GraphRAG-style support"
        title="Knowledge Support"
        subtitle="Answers are grounded in stored documents and authorized CRM context, combining vector embeddings and keyword fallback."
      />
      <div className="knowledge-layout">
        <div>
          <form className="content-card knowledge-query" onSubmit={ask}>
            <label>
              Ask the knowledge base
              <textarea
                rows="4"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask any policy, SOP, or building operations question..."
              />
            </label>
            <button className="primary-button" disabled={busy || !question.trim()}>
              <BookOpen size={16} /> {busy ? 'Searching & Grounding...' : 'Ask with sources'}
            </button>
            {error && <p className="form-error">{error}</p>}
          </form>
          <KnowledgeAnswerCard result={result} />
        </div>

        <aside>
          <section className="content-card">
            <div className="card-title">
              <BookOpen size={19} />
              <h2>Knowledge documents ({docs.length})</h2>
            </div>
            {docs.map((doc) => (
              <div className="knowledge-doc" key={doc.documentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{doc.title}</strong>
                  <span>
                    {doc.category} · {doc.type} · {doc.chunkCount || 1} chunks · <span className="text-success">{doc.indexingStatus || 'INDEXED'}</span>
                  </span>
                </div>
                {canCreate && (
                  <button
                    className="icon-button"
                    style={{ width: 28, height: 28 }}
                    title="Re-index document embeddings"
                    disabled={reindexingId === doc.documentId}
                    onClick={() => handleReindex(doc.documentId)}
                  >
                    <RefreshCw size={13} className={reindexingId === doc.documentId ? 'spin' : ''} />
                  </button>
                )}
              </div>
            ))}
          </section>

          {canCreate && (
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
                rows="6"
                placeholder="Document content (chunked automatically into vector embeddings)"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />
              <button className="secondary-button" disabled={busy}>
                Ingest & Index Document
              </button>
            </form>
          )}
        </aside>
      </div>
    </>
  );
}
