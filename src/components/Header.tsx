import React, { useState, useRef, useEffect } from 'react';
import { Mic, Zap, Wand2, Globe, ChevronDown, Check } from 'lucide-react';
import { TTS_MODEL } from '../utils/tts-helper';
import { AppLanguage, LANGUAGE_OPTIONS, TranslationSchema } from '../utils/i18n';

interface HeaderProps {
  hasApiKey: boolean | null;
  activeModel: string;
  onOpenAiAssistant: () => void;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  t: TranslationSchema;
}

export const Header: React.FC<HeaderProps> = ({
  hasApiKey,
  activeModel,
  onOpenAiAssistant,
  language,
  onChangeLanguage,
  t,
}) => {
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const activeLang = LANGUAGE_OPTIONS.find((l) => l.id === language) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/10 shrink-0">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                {t.appTitle}
              </h1>
              <span className="text-[11px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {t.appBadge}
              </span>
              <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {t.stylesBadge}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Language Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-600 text-xs font-medium transition-colors cursor-pointer shadow-sm"
              title="Ganti Bahasa Petunjuk / Switch Language / تغيير لغة التطبيق"
              aria-label="Language selector"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-sm mr-0.5">{activeLang.flag}</span>
              <span className="font-semibold">{activeLang.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {isLangDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-800">
                  Select Language / اختر اللغة
                </div>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChangeLanguage(opt.id);
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-zinc-800 transition-colors cursor-pointer ${
                      language === opt.id
                        ? 'text-indigo-400 font-bold bg-indigo-950/30'
                        : 'text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{opt.flag}</span>
                      <span>{opt.nativeName}</span>
                      <span className="text-[10px] text-zinc-500">({opt.name})</span>
                    </div>
                    {language === opt.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Assistant Quick Trigger */}
          <button
            type="button"
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-300" />
            <span>{t.aiAssistantBtn}</span>
          </button>

          {/* Model Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[11px] text-zinc-400">{t.modelLabel}</span>
            <span className="font-mono font-medium text-emerald-400">{activeModel || TTS_MODEL}</span>
          </div>

          {/* Key status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
              hasApiKey
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                hasApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-medium text-[11px]">
              {hasApiKey ? t.connectedStatus : t.demoStatus}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
