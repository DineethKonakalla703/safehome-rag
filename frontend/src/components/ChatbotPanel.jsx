import {
  ArrowRight,
  Bot,
  ChevronUp,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  UserRound,
  X,
  Zap,
  Building,
  FileText,
  AlertTriangle,
  Receipt,
  UserCheck,
  Calendar,
  Wrench,
  Search,
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

export default function ChatbotPanel({ messages, onSend, busy, suggestions = [] }) {
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

  // Adjust textarea height automatically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [value]);

  const handleChange = (e) => {
    const text = e.target.value;
    setValue(text);

    // Check for trigger characters
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
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.');
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
    <section className="content-card chatbot-panel">
      {/* Messages Feed */}
      <div className="chat-messages">
        {messages.map((item, index) => (
          <div className={`chat-message ${item.role}`} key={`${item.role}-${index}`}>
            <span>
              {item.role === 'assistant' ? <Bot size={17} /> : <UserRound size={17} />}
            </span>
            <div>
              <p>{item.content}</p>
              {item.intent && <small className="chat-intent-tag">{item.intent}</small>}
            </div>
          </div>
        ))}
        {busy && (
          <div className="chat-message assistant">
            <span><Bot size={17} /></span>
            <div className="chat-typing-indicator">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {suggestions.length > 0 && (
        <div className="suggested-prompts-bar">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              className="suggestion-chip"
              onClick={() => onSend(item)}
              disabled={busy}
            >
              <Sparkles size={12} /> {item}
            </button>
          ))}
        </div>
      )}

      {/* Sleek Modern Input Bar */}
      <div className="modern-chat-wrapper">
        {/* Slash Command Autocomplete Popover */}
        {showSlashMenu && (
          <div className="chat-popover">
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
          <div className="chat-popover">
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
          <div className="chat-model-menu">
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

        {/* Main Floating Chat Pill Box */}
        <div className="modern-chat-box">
          {attachedFile && (
            <div className="attached-file-chip">
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
            placeholder="Ask anything, @ to mention, / for actions"
            className="modern-chat-textarea"
            disabled={busy}
          />

          <div className="chat-box-footer">
            <div className="footer-left">
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
                className="chat-icon-btn"
                title="Attach document or photo"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={16} />
              </button>

              {/* Model Selector Pill */}
              <button
                type="button"
                className="chat-model-pill"
                onClick={() => {
                  setShowModelMenu(!showModelMenu);
                  setShowSlashMenu(false);
                  setShowMentionMenu(false);
                }}
              >
                <span>{selectedModel}</span>
                <ChevronUp size={13} />
              </button>
            </div>

            <div className="footer-right">
              {/* Speech-to-Text Microphone Button */}
              <button
                type="button"
                className={`chat-icon-btn ${isListening ? 'listening' : ''}`}
                title={isListening ? 'Listening... click to stop' : 'Voice input'}
                onClick={handleToggleVoice}
              >
                {isListening ? <MicOff size={16} className="text-danger" /> : <Mic size={16} />}
              </button>

              {/* Circular Submit Button */}
              <button
                type="button"
                className={`chat-send-btn ${value.trim() || attachedFile ? 'active' : ''}`}
                disabled={(!value.trim() && !attachedFile) || busy}
                onClick={handleSubmit}
                title="Send message"
              >
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
