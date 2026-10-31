import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  X,
  Loader2,
  Check,
  Languages,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { TTSStyleId, STYLE_CONFIGS } from '../utils/tts-helper';
import { TranslationSchema, AppLanguage } from '../utils/i18n';
import { apiPost } from '../utils/api';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStyle: TTSStyleId;
  onApplyScript: (script: string) => void;
  t: TranslationSchema;
  language: AppLanguage;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  activeStyle,
  onApplyScript,
  t,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'enhance'>('generate');
  const [topicPrompt, setTopicPrompt] = useState('');
  const [inputToEnhance, setInputToEnhance] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<TTSStyleId>(activeStyle);

  const [isLoading, setIsLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickTopicSuggestions = [
    {
      titleEn: 'News: Tech Conference',
      titleAr: 'إخباري: افتتاح مؤتمر تقني',
      titleId: 'Berita: Konferensi Teknologi',
      prompt: 'خبر عاجل عن افتتاح المؤتمر العربي الدولي للذكاء الاصطناعي في الرياض بمشاركة خبراء عالميين',
      style: 'formal_berita' as TTSStyleId,
    },
    {
      titleEn: 'Cheerful: Graduation Wishes',
      titleAr: 'مبهج: تهنئة تخرج وتفوق',
      titleId: 'Ceria: Selamat Kelulusan',
      prompt: 'تهنئة دافئة ومبهجة بمناسبة التخرج الجامعي بمرتبة الشرف الأولى مع خالص التبريكات',
      style: 'gembira' as TTSStyleId,
    },
    {
      titleEn: 'Neutral: Reading Wisdom',
      titleAr: 'محايد: حكمة عن القراءة',
      titleId: 'Netral: Hikmah Membaca',
      prompt: 'فقرة هادئة من كتاب مسموع تتحدث عن أثر القراءة اليومية في توسيع مدارك الإنسان وتنوير فكره',
      style: 'netral' as TTSStyleId,
    },
  ];

  const handleGenerateScript = async () => {
    if (!topicPrompt.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    setGeneratedResult(null);

    try {
      const { res, data } = await apiPost('/api/ai/generate-script', {
          prompt: topicPrompt.trim(),
          styleId: selectedStyle,
        });
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate Arabic script.');
      }
      setGeneratedResult(data.generatedScript);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error occurred while generating text.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhanceToFusha = async () => {
    if (!inputToEnhance.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    setGeneratedResult(null);

    try {
      const { res, data } = await apiPost('/api/ai/enhance-fusha', {
          text: inputToEnhance.trim(),
          targetStyle: selectedStyle,
        });
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to enhance text to Fusha.');
      }
      setGeneratedResult(data.enhancedScript);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error occurred while enhancing text.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToEditor = () => {
    if (generatedResult) {
      onApplyScript(generatedResult);
      onClose();
    }
  };

  const isArabicUI = language === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          className={`p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 ${
            isArabicUI ? 'flex-row-reverse' : ''
          }`}
        >
          <div className={`flex items-center gap-2.5 ${isArabicUI ? 'flex-row-reverse text-right' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-cairo">
                {t.aiModalTitle}
              </h3>
              <p className="text-xs text-zinc-400">
                {t.aiModalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title={t.closeBtn}
            aria-label={t.closeBtn}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div
          className={`flex border-b border-zinc-800 bg-zinc-950/30 px-4 ${
            isArabicUI ? 'flex-row-reverse' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('generate');
              setGeneratedResult(null);
            }}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'generate'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            {t.aiTabGenerate}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('enhance');
              setGeneratedResult(null);
            }}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'enhance'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            {t.aiTabEnhance}
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* Style picker inside modal */}
          <div>
            <label
              className={`text-xs font-semibold text-zinc-300 mb-1.5 block ${
                isArabicUI ? 'text-right' : 'text-left'
              }`}
            >
              {t.aiTargetStyleLabel}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['netral', 'gembira', 'formal_berita'] as TTSStyleId[]).map((st) => {
                const isSelected = selectedStyle === st;
                const nameLabel =
                  st === 'netral'
                    ? t.styleNetralName
                    : st === 'gembira'
                    ? t.styleGembiraName
                    : t.styleFormalName;

                const badgeLabel =
                  st === 'netral'
                    ? t.styleNetralBadge
                    : st === 'gembira'
                    ? t.styleGembiraBadge
                    : t.styleFormalBadge;

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStyle(st)}
                    className={`p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                      isArabicUI ? 'text-right' : 'text-left'
                    } ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/30 text-white ring-1 ring-indigo-500/50'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="font-bold font-cairo">{nameLabel}</div>
                    <div className="text-[10px] text-zinc-500">{badgeLabel}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === 'generate' ? (
            <div className="space-y-3">
              {/* Quick suggestions */}
              <div>
                <span
                  className={`text-[11px] text-zinc-500 flex items-center gap-1 mb-1.5 ${
                    isArabicUI ? 'flex-row-reverse' : ''
                  }`}
                >
                  <Lightbulb className="w-3 h-3 text-amber-400" />
                  {t.aiSuggestionsLabel}
                </span>
                <div className={`flex flex-wrap gap-1.5 ${isArabicUI ? 'flex-row-reverse' : ''}`}>
                  {quickTopicSuggestions.map((sug, i) => {
                    const label =
                      language === 'id'
                        ? sug.titleId
                        : language === 'ar'
                        ? sug.titleAr
                        : sug.titleEn;

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setTopicPrompt(sug.prompt);
                          setSelectedStyle(sug.style);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors cursor-pointer"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  className={`text-xs font-semibold text-zinc-300 mb-1 block ${
                    isArabicUI ? 'text-right' : 'text-left'
                  }`}
                >
                  {t.aiPromptLabel}
                </label>
                <textarea
                  rows={3}
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                  placeholder={t.aiPromptPlaceholder}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-arabic"
                  dir="auto"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateScript}
                disabled={isLoading || !topicPrompt.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.aiGeneratingBtn}</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>{t.aiGenerateBtn}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label
                  className={`text-xs font-semibold text-zinc-300 mb-1 block ${
                    isArabicUI ? 'text-right' : 'text-left'
                  }`}
                >
                  {t.aiEnhanceLabel}
                </label>
                <textarea
                  rows={3}
                  value={inputToEnhance}
                  onChange={(e) => setInputToEnhance(e.target.value)}
                  placeholder={t.aiEnhancePlaceholder}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={handleEnhanceToFusha}
                disabled={isLoading || !inputToEnhance.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.aiEnhancingBtn}</span>
                  </>
                ) : (
                  <>
                    <Languages className="w-4 h-4" />
                    <span>{t.aiEnhanceBtn}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Generated Result Preview */}
          {generatedResult && (
            <div className="p-4 bg-zinc-950 border border-indigo-500/40 rounded-xl space-y-3 animate-in fade-in">
              <div
                className={`flex items-center justify-between text-xs ${
                  isArabicUI ? 'flex-row-reverse' : ''
                }`}
              >
                <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  {t.aiResultTitle}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {STYLE_CONFIGS[selectedStyle].nameArabic}
                </span>
              </div>

              <div
                dir="rtl"
                className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 text-sm font-arabic leading-relaxed text-zinc-100 selection:bg-indigo-500 text-right"
              >
                {generatedResult}
              </div>

              <div
                className={`flex items-center pt-1 ${
                  isArabicUI ? 'justify-start' : 'justify-end'
                }`}
              >
                <button
                  type="button"
                  onClick={handleApplyToEditor}
                  className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  {t.aiApplyBtn}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
