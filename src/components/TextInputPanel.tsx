import React, { useState } from 'react';
import {
  Type,
  Sparkles,
  X,
  Wand2,
  Loader2,
  AlignRight,
  AlignLeft,
  Check,
} from 'lucide-react';
import { TTSStyleId, validateTtsInput } from '../utils/tts-helper';
import { TranslationSchema, AppLanguage } from '../utils/i18n';

interface TextInputPanelProps {
  text: string;
  onChangeText: (text: string) => void;
  activeStyle: TTSStyleId;
  onOpenAiAssistant: () => void;
  t: TranslationSchema;
  language: AppLanguage;
}

const ARABIC_STYLE_SAMPLES: Record<
  TTSStyleId,
  { labelEn: string; labelAr: string; labelId: string; text: string }[]
> = {
  netral: [
    {
      labelEn: 'Welcome Greeting',
      labelAr: 'أهلاً بكم (تحية هادئة)',
      labelId: 'Sambutan Hangat',
      text: 'أَهْلًا وَسَهْلًا بِكُمْ فِي تَطْبِيقِ نَاطِقٍ لِتَحْوِيلِ النَّصِّ إِلَى صَوْتٍ، حَيْثُ نَسْعَى لِتَقْدِيمِ تَجْرِبَةٍ صَوْتِيَّةٍ عَرَبِيَّةٍ فَرِيدَةٍ.',
    },
    {
      labelEn: 'Audiobook Excerpt',
      labelAr: 'كتاب مسموع (ثقافة)',
      labelId: 'Kutipan Buku Audio',
      text: 'تُعَدُّ اللُّغَةُ الْعَرَبِيَّةُ الْفُصْحَى مِنْ أَغْنَى لُغَاتِ الْعَالَمِ بِمُفْرَدَاتِهَا وَبَلَاغَتِهَا، حَيْثُ تَحْمِلُ فِي طَيَّاتِهَا إِرْثًا حَضَارِيًّا خَالِدًا.',
    },
    {
      labelEn: 'Educational Lesson',
      labelAr: 'حوار تعليمي (هادئ)',
      labelId: 'Pelajaran Tata Bahasa',
      text: 'مَرْحَبًا بِكُمْ فِي دَرْسِ الْيَوْمِ حَوْلَ قَوَاعِدِ النَّحْوِ وَالْإِعْرَابِ، سَنَتَعَلَّمُ كَيْفِيَّةَ ضَبْطِ الْحَرَكَاتِ بِدِقَّةٍ.',
    },
  ],
  gembira: [
    {
      labelEn: 'Congratulatory Joy',
      labelAr: 'تهنئة وفرحة (حماسي)',
      labelId: 'Ucapan Selamat Bahagia',
      text: 'مَبْرُوكٌ أَلْفُ مَبْرُوكٍ! أُهَنِّئُكُمْ مِنْ كُلِّ قَلْبِي عَلَى هَذَا النَّجَاحِ الْبَاهِرِ وَالْإِنْجَازِ الْمُسْتَحَقِّ! يَوْمٌ مَلِيءٌ بِالْفَرَحِ وَالسُّرُورِ!',
    },
    {
      labelEn: 'Teaser Announcement',
      labelAr: 'إعلان تشويقي (مبهج)',
      labelId: 'Pengumuman Promo Heboh',
      text: 'بُشْرَى سَارَّةٌ لِجَمِيعِ عُمَلَائِنَا الْأَعِزَّاءِ! عَايِشُوا مَعَنَا تَجْرِبَةً جَدِيدَةً كُلِّيًّا مَعَ خُصُومَاتٍ اسْتِثْنَائِيَّةٍ لَا تُفَوَّتُ!',
    },
    {
      labelEn: 'Celebratory Welcome',
      labelAr: 'ترحيب مشرق (احتفالي)',
      labelId: 'Sambutan Ceria Penuh Tawa',
      text: 'يَا لَهَا مِنْ فَرْحَةٍ كَبِيرَةٍ بِلِقَائِكُمْ! طَابَتْ أَيَّامُكُمْ وَدَامَتْ حَيَاتُكُمْ مَفْعَمَةً بِالْبَهْجَةِ وَالْأَمَلِ وَالسَّعَادَةِ!',
    },
  ],
  formal_berita: [
    {
      labelEn: 'News Headline Anchor',
      labelAr: 'مقدمة نشرة أخبار (رسمي)',
      labelId: 'Warta Siang TV',
      text: 'سَيِّدَاتِي وَسَادَتِي، طَابَتْ أَوْقَاتُكُمْ. نُحَيِّيكُمْ مِنْ هُنَا وَنُقَدِّمُ لَكُمْ نَشْرَةَ الْأَخْبَارِ الرَّئِيسِيَّةَ لِهَذَا الْيَوْمِ.',
    },
    {
      labelEn: 'Economic & Projects Report',
      labelAr: 'تقرير اقتصادي ومشاريع',
      labelId: 'Laporan Proyek Ekonomi',
      text: 'أَعْلَنَتْ وَزَارَةُ الِاقْتِصَادِ الْيَوْمَ عَنِ ارْتِفَاعِ حَجْمِ الِاسْتِثْمَارَاتِ الْمُبَاشِرَةِ فِي قِطَاعِ الطَّاقَةِ النَّظِيفَةِ وَالتِّكْنُولُوجْيَا الرَّقْمِيَّةِ.',
    },
    {
      labelEn: 'Official Press Briefing',
      labelAr: 'بيان حكومي رسمي',
      labelId: 'Pernyataan Resmi Juru Bicara',
      text: 'أَكَّدَ الْمُتَحَدِّثُ الرَّسْمِيُّ فِي مُؤْتَمَرٍ صَحَفِيٍّ عَقَدَهُ صَبَاحَ الْيَوْمِ اسْتِمْرَارَ الْعَمَلِ فِي الْمَشَارِيعِ الْوَطَنِيَّةِ الْمُعْتَمَدَةِ.',
    },
  ],
};

export const TextInputPanel: React.FC<TextInputPanelProps> = ({
  text,
  onChangeText,
  activeStyle,
  onOpenAiAssistant,
  t,
  language,
}) => {
  const [isTashkeeling, setIsTashkeeling] = useState(false);
  const [tashkeelSuccess, setTashkeelSuccess] = useState(false);
  const [isRtl, setIsRtl] = useState(true);

  const validation = validateTtsInput(text, 2000);
  const currentSamples = ARABIC_STYLE_SAMPLES[activeStyle] || ARABIC_STYLE_SAMPLES.netral;

  const handleAutoTashkeel = async () => {
    if (!text.trim()) return;
    setIsTashkeeling(true);
    setTashkeelSuccess(false);

    try {
      const res = await fetch('/api/ai/tashkeel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json().catch(() => ({ error: `Server tidak merespons dengan benar (HTTP ${res.status}).` }));
      if (res.ok && data.success && data.textWithTashkeel) {
        onChangeText(data.textWithTashkeel);
        setTashkeelSuccess(true);
        setTimeout(() => setTashkeelSuccess(false), 2500);
      } else {
        window.alert(data.error || 'Gagal memberi harakat otomatis.');
      }
    } catch (err) {
      console.error('Tashkeel error:', err);
      window.alert('Gagal menghubungi server untuk memberi harakat.');
    } finally {
      setIsTashkeeling(false);
    }
  };

  const isArabicUI = language === 'ar';

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
      {/* Header of input panel */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 ${
          isArabicUI ? 'flex-row-reverse' : ''
        }`}
      >
        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 font-cairo">
          <Type className="w-3.5 h-3.5 text-indigo-400" />
          {t.scriptTitle}
        </label>

        <div className={`flex items-center gap-2 ${isArabicUI ? 'flex-row-reverse' : ''}`}>
          {/* AI Script Writer */}
          <button
            type="button"
            onClick={onOpenAiAssistant}
            className="text-xs px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 transition-colors cursor-pointer"
            title={t.writeWithAiBtn}
          >
            <Wand2 className="w-3 h-3 text-amber-300" />
            <span>{t.writeWithAiBtn}</span>
          </button>

          {/* AI Tashkeel Adder */}
          <button
            type="button"
            onClick={handleAutoTashkeel}
            disabled={isTashkeeling || !text.trim()}
            className="text-xs px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
            title={t.tashkeelBtn}
          >
            {isTashkeeling ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                <span>{t.tashkeelingBtn}</span>
              </>
            ) : tashkeelSuccess ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>{t.tashkeelDoneBtn}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>{t.tashkeelBtn}</span>
              </>
            )}
          </button>

          {/* RTL toggle */}
          <button
            type="button"
            onClick={() => setIsRtl(!isRtl)}
            className="text-xs p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors cursor-pointer"
            title={isRtl ? 'RTL' : 'LTR'}
          >
            {isRtl ? <AlignRight className="w-3.5 h-3.5" /> : <AlignLeft className="w-3.5 h-3.5" />}
          </button>

          {text.length > 0 && (
            <button
              type="button"
              onClick={() => onChangeText('')}
              className="text-xs text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors ml-1 cursor-pointer"
              title={t.clearBtn}
            >
              <X className="w-3 h-3" />
              {t.clearBtn}
            </button>
          )}
        </div>
      </div>

      {/* Quick sample chips */}
      <div
        className={`flex flex-wrap items-center gap-1.5 ${
          isArabicUI ? 'flex-row-reverse' : ''
        }`}
      >
        <span className="text-[11px] text-zinc-500 flex items-center gap-1 mr-1 font-cairo">
          <Sparkles className="w-3 h-3 text-amber-400" />
          {t.sampleChipsLabel}
        </span>
        {currentSamples.map((sample, idx) => {
          const chipLabel =
            language === 'id' ? sample.labelId : language === 'ar' ? sample.labelAr : sample.labelEn;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onChangeText(sample.text)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors cursor-pointer font-cairo"
            >
              {chipLabel}
            </button>
          );
        })}
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          rows={5}
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          dir={isRtl ? 'rtl' : 'ltr'}
          placeholder={t.textareaPlaceholder}
          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y min-h-[120px] font-arabic leading-relaxed"
        />
      </div>

      {/* Tashkeel note & counters */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 pt-1 ${
          isArabicUI ? 'flex-row-reverse' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            {t.tashkeelTip}
          </span>
          {validation.error && (
            <span className="text-rose-400 font-medium">{validation.error}</span>
          )}
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>
            {validation.wordCount} {t.wordsCount}
          </span>
          <span className={validation.charCount > 2000 ? 'text-rose-400 font-bold' : ''}>
            {validation.charCount} / 2.000 {t.charsCount}
          </span>
        </div>
      </div>
    </div>
  );
};
