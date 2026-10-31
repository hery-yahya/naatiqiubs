/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Wand2,
  Layers,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Volume2,
  KeyRound,
  X,
} from 'lucide-react';
import { Header } from './components/Header';
import { StyleSelector } from './components/StyleSelector';
import { TextInputPanel } from './components/TextInputPanel';
import { VoiceAndSettings } from './components/VoiceAndSettings';
import { AudioPlayer } from './components/AudioPlayer';
import { ComparisonMatrix, ComparisonResult } from './components/ComparisonMatrix';
import { HistoryList, HistoryItem } from './components/HistoryList';
import { AiAssistantModal } from './components/AiAssistantModal';
import { LoginScreen } from './components/LoginScreen';
import {
  TTSStyleId,
  STYLE_CONFIGS,
  validateTtsInput,
  TTS_MODEL,
  TempoId,
} from './utils/tts-helper';
import { AppLanguage, getTranslation } from './utils/i18n';
import {
  apiPost,
  AUTH_REQUIRED_EVENT,
  clearStoredPassword,
  getStoredPassword,
  verifyPassword,
} from './utils/api';
import { addHistoryItem, clearHistoryStore, loadHistory, MAX_HISTORY_ITEMS } from './utils/history-store';

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>(() => {
    try {
      const savedLang = localStorage.getItem('gemini_tts_language') as AppLanguage;
      if (savedLang && (savedLang === 'en' || savedLang === 'ar' || savedLang === 'id')) {
        return savedLang;
      }
    } catch {
      // ignore
    }
    return 'id';
  });

  const t = getTranslation(language);

  const [selectedStyle, setSelectedStyle] = useState<TTSStyleId>('netral');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [text, setText] = useState<string>(STYLE_CONFIGS.netral.sampleText);
  const [tempo, setTempo] = useState<TempoId>('normal');
  const [customDirective, setCustomDirective] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showQuotaBanner, setShowQuotaBanner] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const [currentAudio, setCurrentAudio] = useState<{
    audioBase64: string;
    styleId: TTSStyleId;
    voiceName: string;
    textSnippet: string;
  } | null>(null);

  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[] | null>(null);

  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [activeModel, setActiveModel] = useState<string>(TTS_MODEL);

  // Save language to localStorage
  const handleLanguageChange = (newLang: AppLanguage) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('gemini_tts_language', newLang);
    } catch {
      // ignore
    }
  };

  // Status masuk: 'checking' = sedang memeriksa, 'locked' = perlu sandi, 'open' = boleh dipakai
  const [authState, setAuthState] = useState<'checking' | 'locked' | 'open'>('checking');
  const [passwordRequired, setPasswordRequired] = useState(false);

  // Riwayat audio (disimpan di IndexedDB agar tidak cepat penuh)
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  // Cek status server dan sandi saat aplikasi dibuka
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        if (cancelled) return;
        if (data.status === 'ok') {
          setHasApiKey(data.hasKey);
          if (data.model) setActiveModel(data.model);
        }
        const needsPassword = Boolean(data.passwordRequired);
        setPasswordRequired(needsPassword);
        if (!needsPassword) {
          setAuthState('open');
          return;
        }
        const saved = getStoredPassword();
        const ok = saved ? await verifyPassword(saved) : false;
        if (cancelled) return;
        if (!ok) clearStoredPassword();
        setAuthState(ok ? 'open' : 'locked');
      } catch (err) {
        console.warn('Status check warning:', err);
        if (!cancelled) setAuthState('open');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Kalau server menolak sandi (misalnya sandi diganti), kembali ke layar masuk
  useEffect(() => {
    const onAuthRequired = () => setAuthState('locked');
    window.addEventListener(AUTH_REQUIRED_EVENT, onAuthRequired);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, onAuthRequired);
  }, []);

  const handleLogout = () => {
    clearStoredPassword();
    setAuthState('locked');
  };

  const handleGenerate = async () => {
    setErrorMessage(null);
    setShowQuotaBanner(false);
    const validation = validateTtsInput(text);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Invalid text script.');
      return;
    }

    setIsGenerating(true);
    try {
      const { res, data } = await apiPost('/api/tts/generate', {
          text: text.trim(),
          styleId: selectedStyle,
          voiceName: selectedVoice,
          customDirective: customDirective.trim() || undefined,
          tempo,
        });
      if (!res.ok || !data.success) {
        if (data.isQuota) {
          setShowQuotaBanner(true);
        }
        throw new Error(data.error || 'Failed to synthesize Arabic audio.');
      }

      const newAudioItem = {
        audioBase64: data.audioBase64,
        styleId: data.styleId as TTSStyleId,
        voiceName: data.voiceName,
        textSnippet: data.text,
      };

      setCurrentAudio(newAudioItem);

      // Add to history
      const newHistoryEntry: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        text: data.text,
        styleId: data.styleId as TTSStyleId,
        voiceName: data.voiceName,
        audioBase64: data.audioBase64,
        tempo: data.tempo as TempoId,
      };
      setHistory((prev) => [newHistoryEntry, ...prev].slice(0, MAX_HISTORY_ITEMS));
      addHistoryItem(newHistoryEntry);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error occurred while contacting Gemini TTS.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompareAll = async () => {
    setErrorMessage(null);
    setShowQuotaBanner(false);
    const validation = validateTtsInput(text);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Invalid text script.');
      return;
    }

    setIsComparing(true);
    try {
      const { res, data } = await apiPost('/api/tts/compare-all', {
          text: text.trim(),
          voiceName: selectedVoice,
          tempo,
        });
      if (!res.ok || !data.success) {
        if (data.isQuota) {
          setShowQuotaBanner(true);
        }
        throw new Error(data.error || 'Failed to compare all 3 styles.');
      }

      if (data.isQuotaExceeded) {
        setShowQuotaBanner(true);
      }

      setComparisonResults(data.results);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error occurred while comparing styles.');
    } finally {
      setIsComparing(false);
    }
  };

  const handleStyleChange = (styleId: TTSStyleId) => {
    setSelectedStyle(styleId);
  };

  const handleApplySample = (sample: string) => {
    setText(sample);
  };

  const handleClearHistory = () => {
    setHistory([]);
    clearHistoryStore();
  };

  const isArabicUI = language === 'ar';
  const activeStyleName =
    selectedStyle === 'netral'
      ? t.styleNetralName
      : selectedStyle === 'gembira'
      ? t.styleGembiraName
      : t.styleFormalName;

  if (authState !== 'open') {
    return (
      <LoginScreen
        isChecking={authState === 'checking'}
        onSuccess={() => setAuthState('open')}
        t={t}
        language={language}
      />
    );
  }

  return (
    <div
      className={`min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white ${
        isArabicUI ? 'font-cairo' : ''
      }`}
    >
      <Header
        hasApiKey={hasApiKey}
        activeModel={activeModel}
        onOpenAiAssistant={() => setIsAiModalOpen(true)}
        language={language}
        onChangeLanguage={handleLanguageChange}
        t={t}
      />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Quota Exceeded Friendly Banner */}
        {showQuotaBanner && (
          <div
            className={`bg-amber-950/40 border border-amber-600/40 rounded-xl p-4 flex items-start gap-3.5 text-amber-200 text-xs shadow-lg animate-in fade-in ${
              isArabicUI ? 'flex-row-reverse text-right' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300 text-sm">{t.quotaExceededTitle}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[10px]">
                  HTTP 429
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed">{t.quotaExceededDesc}</p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-400">
                <KeyRound className="w-3.5 h-3.5" />
                <span>
                  Cloudflare &gt; Settings &gt; Variables and Secrets &bull; {TTS_MODEL}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQuotaBanner(false)}
              className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
              title={t.closeBtn}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Regular Error Alert (Only if not quota banner) */}
        {errorMessage && !showQuotaBanner && (
          <div
            className={`bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 flex items-start gap-3 text-rose-200 text-sm ${
              isArabicUI ? 'flex-row-reverse text-right' : ''
            }`}
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 max-w-full overflow-hidden">
              <p className="font-semibold text-rose-300 font-cairo">{t.alertTitle}</p>
              <p className="text-xs text-rose-300/90 break-words">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-400 hover:text-white cursor-pointer"
            >
              {t.closeBtn}
            </button>
          </div>
        )}

        {/* 3 Styles Showcase Section (Arabic Fusha) */}
        <StyleSelector
          selectedStyle={selectedStyle}
          onSelectStyle={handleStyleChange}
          onApplySampleText={handleApplySample}
          t={t}
          language={language}
        />

        {/* Editor & Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Script input & Generation actions */}
          <div className="lg:col-span-7 space-y-4">
            <TextInputPanel
              text={text}
              onChangeText={setText}
              activeStyle={selectedStyle}
              onOpenAiAssistant={() => setIsAiModalOpen(true)}
              t={t}
              language={language}
            />

            {/* Action Buttons */}
            <div
              className={`flex flex-wrap items-center gap-3 ${
                isArabicUI ? 'flex-row-reverse' : ''
              }`}
            >
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || isComparing}
                className={`flex-1 py-3 px-5 rounded-xl font-semibold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-cairo ${
                  selectedStyle === 'netral'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/40'
                    : selectedStyle === 'gembira'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-950/40'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-950/40'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.generatingVoiceBtn}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>
                      {t.generateVoiceBtn} {activeStyleName}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCompareAll}
                disabled={isGenerating || isComparing}
                className="py-3 px-4 rounded-xl font-medium text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-600 shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-cairo"
                title={t.compareAllBtn}
              >
                {isComparing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>{t.comparingBtn}</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t.compareAllBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Voice and Audio Player */}
          <div className="lg:col-span-5 space-y-4">
            <VoiceAndSettings
              selectedVoice={selectedVoice}
              onSelectVoice={setSelectedVoice}
              tempo={tempo}
              onChangeTempo={setTempo}
              customDirective={customDirective}
              onChangeCustomDirective={setCustomDirective}
              activeStyle={selectedStyle}
              t={t}
              language={language}
            />

            {/* Audio Player if generated */}
            {currentAudio ? (
              <AudioPlayer
                audioBase64={currentAudio.audioBase64}
                styleId={currentAudio.styleId}
                voiceName={currentAudio.voiceName}
                textSnippet={currentAudio.textSnippet}
                playbackSpeed={1}
                t={t}
                language={language}
              />
            ) : (
              <div className="border border-dashed border-zinc-800 rounded-2xl p-8 text-center bg-zinc-900/20 flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                  <Volume2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-300 font-cairo">
                  {t.playerEmptyTitle}
                </h4>
                <p className="text-xs text-zinc-500 max-w-xs leading-relaxed font-cairo">
                  {t.playerEmptyDesc}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3 Styles Comparison Matrix */}
        {comparisonResults && (
          <ComparisonMatrix
            results={comparisonResults}
            text={text}
            voiceName={selectedVoice}
            onClose={() => setComparisonResults(null)}
            t={t}
            language={language}
          />
        )}

        {/* History List */}
        <HistoryList
          history={history}
          onClearHistory={handleClearHistory}
          onSelectHistoryItem={(item) => {
            setCurrentAudio({
              audioBase64: item.audioBase64,
              styleId: item.styleId,
              voiceName: item.voiceName,
              textSnippet: item.text,
            });
            setSelectedStyle(item.styleId);
            setSelectedVoice(item.voiceName);
            if (item.tempo) setTempo(item.tempo);
          }}
          onLoadTextToEditor={(newText) => setText(newText)}
          t={t}
          language={language}
        />
      </main>

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        activeStyle={selectedStyle}
        onApplyScript={(newScript) => setText(newScript)}
        t={t}
        language={language}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 mt-12 py-6 text-center text-xs text-zinc-600 font-cairo">
        <p>{t.footerText}</p>
        {passwordRequired && (
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
          >
            {t.logoutBtn}
          </button>
        )}
      </footer>
    </div>
  );
}
