import { useCallback, useEffect, useRef, useState } from 'react';

const Recognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
export const voiceInputSupported = Boolean(Recognition);
export const voiceOutputSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

// Turns markdown-ish assistant text into something pleasant to hear.
export function speakableText(text = '') {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*\|.*\|\s*$/gm, ' ')
    .replace(/[*_#>`~]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700);
}

/**
 * Speech-to-text + text-to-speech with the browser's Web Speech API.
 * onFinal(transcript) fires when the user finishes an utterance.
 */
export function useVoice({ onFinal, lang = 'en-IN' }) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
    setInterim('');
  }, []);

  const start = useCallback(() => {
    if (!Recognition) { setError('Voice input needs Chrome or Edge.'); return; }
    if (voiceOutputSupported) window.speechSynthesis.cancel();
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      let finalText = '';
      let partial = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript; else partial += result[0].transcript;
      }
      setInterim(partial || finalText);
      if (finalText.trim()) { setInterim(''); onFinalRef.current?.(finalText.trim()); }
    };
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') setError('Microphone permission was blocked.');
      else if (event.error !== 'no-speech' && event.error !== 'aborted') setError(`Voice error: ${event.error}`);
      setListening(false);
    };
    recognition.onend = () => { setListening(false); setInterim(''); };
    recognitionRef.current = recognition;
    setError('');
    try { recognition.start(); setListening(true); } catch { setListening(false); }
  }, [lang]);

  const speak = useCallback((text, { onEnd } = {}) => {
    const spoken = speakableText(text);
    if (!voiceOutputSupported || !spoken) { onEnd?.(); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.lang = lang;
    utterance.rate = 1.03;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => v.lang === lang) || voices.find((v) => v.lang?.startsWith('en'));
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => { setSpeaking(false); onEnd?.(); };
    utterance.onerror = () => { setSpeaking(false); onEnd?.(); };
    window.speechSynthesis.speak(utterance);
  }, [lang]);

  const stopSpeaking = useCallback(() => { if (voiceOutputSupported) window.speechSynthesis.cancel(); setSpeaking(false); }, []);

  useEffect(() => () => {
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    if (voiceOutputSupported) window.speechSynthesis.cancel();
  }, []);

  return { listening, interim, speaking, error, start, stop, speak, stopSpeaking, supported: voiceInputSupported };
}
