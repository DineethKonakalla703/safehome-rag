import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Bot,
  Building,
  Building2,
  Calendar,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Megaphone,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  Receipt,
  Search,
  Send,
  Sparkles,
  User,
  UserCheck,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const slashCommands = [
  { cmd: '/ticket', label: 'Raise complaint', desc: 'Create a maintenance ticket', icon: AlertTriangle, template: 'Raise a complaint for ' },
  { cmd: '/notice', label: 'Publish notice', desc: 'Create a community announcement', icon: FileText, template: 'Publish a notice about ' },
  { cmd: '/bill', label: 'Generate bill', desc: 'Create a repair or maintenance bill', icon: Receipt, template: 'Generate bill for ticket ' },
  { cmd: '/visitor', label: 'Visitor pass', desc: 'Register a visitor entry request', icon: UserCheck, template: 'Create visitor pass for ' },
  { cmd: '/amenity', label: 'Book amenity', desc: 'Reserve clubhouse or badminton court', icon: Calendar, template: 'Book amenity for ' },
  { cmd: '/assign', label: 'Assign technician', desc: 'Assign work order to staff', icon: Wrench, template: 'Assign technician to ticket ' },
  { cmd: '/incidents', label: 'View incidents', desc: 'Check collective building issues', icon: Zap, template: 'Show collective incidents' },
  { cmd: '/knowledge', label: 'Search SOPs', desc: 'Query GraphRAG knowledge base', icon: Search, template: 'Ask knowledge base: ' },
];

const mentionOptions = [
  { mention: '@Block A', desc: 'Scope to Block A apartments', icon: Building },
  { mention: '@Block B', desc: 'Scope to Block B apartments', icon: Building },
  { mention: '@Community', desc: 'All society records', icon: Building },
  { mention: '@Technicians', desc: 'Maintenance staff roster', icon: Wrench },
];

const availableModels = [
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash High', tag: 'Fast & Multimodal' },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', tag: 'Recommended' },
  { id: 'claude-3.5-haiku', name: 'Claude 3.5 Haiku', tag: 'Lightweight' },
  { id: 'rules-fallback', name: 'Deterministic Rule Engine', tag: 'Offline Safe' },
];

const promptSuggestionsRow1 = [
  { text: 'Show unresolved tickets in Block A', icon: Sparkles, active: true },
  { text: 'Raise a complaint for water leakage in bathroom', icon: FileText },
  { text: 'Publish a notice about elevator maintenance tomorrow', icon: Megaphone },
  { text: 'Generate bill for ticket TK001', icon: Receipt },
];

const promptSuggestionsRow2 = [
  { text: 'Assign technician T001 to ticket TK001', icon: Users },
  { text: 'Show collective incidents', icon: BarChart3 },
  { text: 'Show SLA-risk tickets', icon: AlertTriangle },
  { text: 'Ask knowledge support about electrical safety', icon: BookOpen },
  { text: 'Create a new block named C', icon: Building2 },
];

export default function ChatbotPanel({ messages, onSend, busy }) {
  const [value, setValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('Gemini 3.8 Flash High');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleChange = (e) => {
    const text = e.target.value;
    setValue(text);

    const lastChar = text.slice(-1);
    if (lastChar === '/' || text === '/') {
      setShowSlashMenu(true);
      setShowMentionMenu(false);
    } else if (lastChar === '@') {
      setShowMentionMenu(true);
      setShowSlashMenu(false);
    } else if (!text.includes('/') && !text.includes('@')) {
      setShowSlashMenu(false);
      setShowMentionMenu(false);
    }
  };

  const handleSelectSlash = (item) => {
    setValue((prev) => {
      const idx = prev.lastIndexOf('/');
      const prefix = idx >= 0 ? prev.slice(0, idx) : '';
      return `${prefix}${item.template}`;
    });
    setShowSlashMenu(false);
    textareaRef.current?.focus();
  };

  const handleSelectMention = (item) => {
    setValue((prev) => {
      const idx = prev.lastIndexOf('@');
      const prefix = idx >= 0 ? prev.slice(0, idx) : '';
      return `${prefix}${item.mention} `;
    });
    setShowMentionMenu(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      setShowSlashMenu(false);
      setShowMentionMenu(false);
      setShowModelMenu(false);
    }
  };

  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if ((!value.trim() && !attachedFile) || busy) return;

    let payload = value.trim();
    if (attachedFile) {
      payload = `[Attachment: ${attachedFile.name}] ${payload || 'Please review this file.'}`;
    }

    setValue('');
    setAttachedFile(null);
    setShowSlashMenu(false);
    setShowMentionMenu(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    await onSend(payload);
  };

  return (
    <section className="content-card modern-chatbot-card">
      {/* Messages Stream */}
      <div className="clean-chat-stream">
        {messages.map((item, index) => {
          const isUser = item.role === 'user';
          return (
            <div
              className={`stream-message-row ${isUser ? 'user-row' : 'bot-row'}`}
              key={`${item.role}-${index}`}
            >
              {!isUser && (
                <div className="bot-avatar-box">
                  <Bot size={20} />
                </div>
              )}

              <div className="message-content-wrapper">
                {/* Tickets Table Card or Simple Bubble */}
                {item.tickets && item.tickets.length > 0 ? (
                  <div className="chat-ticket-table-card">
                    <div className="ticket-card-top-bar">
                      <div>
                        <h3>{item.title || 'Here are all unresolved tickets for Block A.'}</h3>
                        <p>{item.subtitle || `Total ${item.tickets.length} tickets · Sorted by last updated (newest first)`}</p>
                      </div>
                      <a href="/tickets" className="view-in-crm-action">
                        <ExternalLink size={13} />
                        <span>View in CRM</span>
                      </a>
                    </div>

                    <div className="chat-table-scroll">
                      <table className="chat-tickets-table">
                        <thead>
                          <tr>
                            <th>Ticket ID</th>
                            <th>Category</th>
                            <th>Issue</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Last Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.tickets.map((t) => {
                            const pLower = (t.priority || 'medium').toLowerCase();
                            return (
                              <tr key={t.ticketId}>
                                <td>
                                  <a href={`/tickets`} className="ticket-id-link">
                                    {t.ticketId}
                                  </a>
                                </td>
                                <td>{t.category}</td>
                                <td className="ticket-title-cell">{t.title}</td>
                                <td>
                                  <span className={`chat-priority-badge ${pLower}`}>
                                    <span className="dot" /> {t.priority}
                                  </span>
                                </td>
                                <td>
                                  <span className="chat-status-pill">
                                    {t.status}
                                  </span>
                                </td>
                                <td className="ticket-date-cell">{t.updatedAt}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className={`clean-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
                    <p>{item.content}</p>
                    {item.intent && <small className="chat-intent-chip">{item.intent}</small>}
                  </div>
                )}

                <div className={`message-time-stamp ${isUser ? 'right-align' : ''}`}>
                  <span>{item.time || '10:24 AM'}</span>
                  {isUser && <CheckCheck size={13} className="double-check-icon" />}
                </div>
              </div>

              {isUser && (
                <div className="user-avatar-circle">
                  <User size={18} />
                </div>
              )}
            </div>
          );
        })}

        {busy && (
          <div className="stream-message-row bot-row">
            <div className="bot-avatar-box">
              <Bot size={20} />
            </div>
            <div className="message-content-wrapper">
              <div className="clean-bubble bot-bubble typing-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts (Matching Reference UI) */}
      <div className="chat-prompts-section">
        <span className="prompts-title-label">Try asking something else</span>
        <div className="prompts-grid-rows">
          <div className="prompts-row">
            {promptSuggestionsRow1.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.text}
                  type="button"
                  className={`prompt-chip-btn ${item.active ? 'highlighted' : ''}`}
                  onClick={() => onSend(item.text)}
                  disabled={busy}
                >
                  <Icon size={14} className="chip-lead-icon" />
                  <span>{item.text}</span>
                </button>
              );
            })}
          </div>
          <div className="prompts-row">
            {promptSuggestionsRow2.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.text}
                  type="button"
                  className="prompt-chip-btn"
                  onClick={() => onSend(item.text)}
                  disabled={busy}
                >
                  <Icon size={14} className="chip-lead-icon" />
                  <span>{item.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Clean White Chat Input Box */}
      <div className="clean-input-container">
        {/* Slash Command Autocomplete Popover */}
        {showSlashMenu && (
          <div className="chat-popover light-popover">
            <div className="popover-header">Action Shortcuts (type /)</div>
            {slashCommands.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.cmd}
                  className="popover-item"
                  onClick={() => handleSelectSlash(item)}
                >
                  <Icon size={14} className="popover-icon" />
                  <div>
                    <strong>{item.cmd}</strong> — <span>{item.label}</span>
                    <small>{item.desc}</small>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mention Scope Popover */}
        {showMentionMenu && (
          <div className="chat-popover light-popover">
            <div className="popover-header">CRM Context Mentions (type @)</div>
            {mentionOptions.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.mention}
                  className="popover-item"
                  onClick={() => handleSelectMention(item)}
                >
                  <Icon size={14} className="popover-icon" />
                  <div>
                    <strong>{item.mention}</strong>
                    <small>{item.desc}</small>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Model Switcher Menu */}
        {showModelMenu && (
          <div className="chat-model-menu light-popover">
            <div className="popover-header">Active AI Reasoning Model</div>
            {availableModels.map((m) => (
              <div
                key={m.id}
                className={`model-menu-item ${selectedModel === m.name ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedModel(m.name);
                  setShowModelMenu(false);
                }}
              >
                <div>
                  <strong>{m.name}</strong>
                  <small>{m.tag}</small>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="clean-input-box">
          {attachedFile && (
            <div className="attached-file-chip-light">
              <Paperclip size={12} />
              <span>{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} aria-label="Remove attachment">
                <X size={12} />
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything, @ to mention, / for actions..."
            className="clean-textarea"
            disabled={busy}
          />

          <div className="clean-input-footer">
            <div className="footer-left-group">
              {/* Attach File Button */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept="image/*,.xlsx,.xls,.pdf"
              />
              <button
                type="button"
                className="clean-circle-btn plus-btn"
                title="Attach file"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={16} />
              </button>

              {/* Model Selector Pill */}
              <button
                type="button"
                className="clean-model-pill"
                onClick={() => {
                  setShowModelMenu(!showModelMenu);
                  setShowSlashMenu(false);
                  setShowMentionMenu(false);
                }}
              >
                <span>{selectedModel}</span>
                <ChevronDown size={13} />
              </button>
            </div>

            <div className="footer-right-group">
              {/* Voice Microphone Button */}
              <button
                type="button"
                className={`clean-tool-icon-btn ${isListening ? 'listening' : ''}`}
                title={isListening ? 'Listening... click to stop' : 'Voice input'}
                onClick={handleToggleVoice}
              >
                {isListening ? <MicOff size={16} className="text-danger" /> : <Mic size={16} />}
              </button>

              {/* Attach Paperclip Button */}
              <button
                type="button"
                className="clean-tool-icon-btn"
                title="Attach document"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={16} />
              </button>

              {/* Send Button */}
              <button
                type="button"
                className="clean-send-btn"
                disabled={(!value.trim() && !attachedFile) || busy}
                onClick={handleSubmit}
                title="Send message"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
