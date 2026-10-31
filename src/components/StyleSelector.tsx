import React from 'react';
import { Sparkles, Smile, Newspaper, CheckCircle2, Volume2 } from 'lucide-react';
import { STYLE_CONFIGS, TTSStyleId } from '../utils/tts-helper';
import { TranslationSchema, AppLanguage } from '../utils/i18n';

interface StyleSelectorProps {
  selectedStyle: TTSStyleId;
  onSelectStyle: (styleId: TTSStyleId) => void;
  onApplySampleText: (sample: string) => void;
  t: TranslationSchema;
  language: AppLanguage;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyle,
  onSelectStyle,
  onApplySampleText,
  t,
  language,
}) => {
  const getStyleLocalizedDetails = (id: TTSStyleId) => {
    switch (id) {
      case 'netral':
        return {
          title: t.styleNetralName,
          badge: t.styleNetralBadge,
          description: t.styleNetralDesc,
        };
      case 'gembira':
        return {
          title: t.styleGembiraName,
          badge: t.styleGembiraBadge,
          description: t.styleGembiraDesc,
        };
      case 'formal_berita':
        return {
          title: t.styleFormalName,
          badge: t.styleFormalBadge,
          description: t.styleFormalDesc,
        };
    }
  };

  const styles: {
    id: TTSStyleId;
    icon: React.ReactNode;
    colorClasses: {
      cardActive: string;
      badge: string;
      iconBg: string;
      button: string;
    };
  }[] = [
    {
      id: 'netral',
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      colorClasses: {
        cardActive: 'ring-2 ring-emerald-500 bg-emerald-950/20 border-emerald-500/50 shadow-emerald-900/20 shadow-lg',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        button: 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10',
      },
    },
    {
      id: 'gembira',
      icon: <Smile className="w-5 h-5 text-amber-400" />,
      colorClasses: {
        cardActive: 'ring-2 ring-amber-500 bg-amber-950/20 border-amber-500/50 shadow-amber-900/20 shadow-lg',
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        button: 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10',
      },
    },
    {
      id: 'formal_berita',
      icon: <Newspaper className="w-5 h-5 text-indigo-400" />,
      colorClasses: {
        cardActive: 'ring-2 ring-indigo-500 bg-indigo-950/20 border-indigo-500/50 shadow-indigo-900/20 shadow-lg',
        badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        button: 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10',
      },
    },
  ];

  const isArabicUI = language === 'ar';

  return (
    <div className="space-y-3">
      <div className={`flex items-center justify-between ${isArabicUI ? 'flex-row-reverse' : ''}`}>
        <div className={isArabicUI ? 'text-right' : 'text-left'}>
          <label className="text-sm font-semibold text-zinc-200">
            {t.stylesTitle}
          </label>
          <p className="text-xs text-zinc-400">
            {t.stylesSubtitle}
          </p>
        </div>
        <span className="text-xs text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
          {t.availableStyles}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {styles.map(({ id, icon, colorClasses }) => {
          const cfg = STYLE_CONFIGS[id];
          const localized = getStyleLocalizedDetails(id);
          const isSelected = selectedStyle === id;

          return (
            <div
              key={id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectStyle(id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectStyle(id);
                }
              }}
              className={`group relative rounded-xl p-4 border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? colorClasses.cardActive
                  : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
              } ${isArabicUI ? 'text-right' : 'text-left'}`}
            >
              {/* Header inside card */}
              <div
                className={`flex items-start justify-between gap-2 mb-2.5 ${
                  isArabicUI ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`flex items-center gap-2.5 ${
                    isArabicUI ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border ${colorClasses.iconBg}`}
                  >
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base leading-snug flex items-center gap-1.5 font-cairo">
                      {localized.title}
                    </h3>
                    <span
                      className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-md border ${colorClasses.badge}`}
                    >
                      {localized.badge}
                    </span>
                  </div>
                </div>

                <div className="pt-0.5">
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-white fill-current" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-zinc-700 group-hover:border-zinc-500" />
                  )}
                </div>
              </div>

              {/* Description */}
              <p
                dir={isArabicUI ? 'rtl' : 'ltr'}
                className="text-xs text-zinc-300 leading-relaxed min-h-[48px] mb-3 font-cairo"
              >
                {localized.description}
              </p>

              {/* Quick sample loader button */}
              <div
                className={`pt-2 border-t border-zinc-800/80 flex items-center justify-between ${
                  isArabicUI ? 'flex-row-reverse' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStyle(id);
                    onApplySampleText(cfg.sampleText);
                  }}
                  className={`text-[11px] font-medium px-2 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${colorClasses.button}`}
                  title={t.useSampleBtn}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {t.useSampleBtn}
                </button>

                <span className="text-[10px] text-zinc-500 font-mono">
                  {cfg.nameArabic}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
