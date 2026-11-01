export type AppLanguage = 'en' | 'ar' | 'id';

export interface LanguageOption {
  id: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'en', name: 'English (US)', nativeName: 'English (US)', flag: '🇺🇸', dir: 'ltr' },
  { id: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { id: 'id', name: 'Indonesian', nativeName: 'Indonesia', flag: '🇮🇩', dir: 'ltr' },
];

export interface TranslationSchema {
  appTitle: string;
  appBadge: string;
  appSubtitle: string;
  stylesBadge: string;
  aiAssistantBtn: string;
  modelLabel: string;
  connectedStatus: string;
  demoStatus: string;

  stylesTitle: string;
  stylesSubtitle: string;
  availableStyles: string;
  useSampleBtn: string;

  styleNetralName: string;
  styleNetralBadge: string;
  styleNetralDesc: string;

  styleGembiraName: string;
  styleGembiraBadge: string;
  styleGembiraDesc: string;

  styleFormalName: string;
  styleFormalBadge: string;
  styleFormalDesc: string;

  scriptTitle: string;
  writeWithAiBtn: string;
  tashkeelBtn: string;
  tashkeelingBtn: string;
  tashkeelDoneBtn: string;
  clearBtn: string;
  sampleChipsLabel: string;
  textareaPlaceholder: string;
  tashkeelTip: string;
  wordsCount: string;
  charsCount: string;

  generateVoiceBtn: string;
  generatingVoiceBtn: string;
  compareAllBtn: string;
  comparingBtn: string;

  voiceTitle: string;
  voiceSubtitle: string;
  voiceFemale: string;
  voiceMale: string;
  speedLabel: string;
  tempoNormal: string;
  tempoSlow: string;
  tempoWordByWord: string;
  tempoHintNormal: string;
  tempoHintSlow: string;
  tempoHintWord: string;
  loginTitle: string;
  loginSubtitle: string;
  loginPlaceholder: string;
  loginButton: string;
  loginChecking: string;
  loginErrorWrong: string;
  logoutBtn: string;
  customExpressionLabel: string;
  customNuanceToggle: string;
  customNuanceClose: string;
  customNuanceLabel: string;
  customNuanceOptional: string;
  baseDirectivePrefix: string;
  customNuancePlaceholder: string;

  playerEmptyTitle: string;
  playerEmptyDesc: string;
  styleLabel: string;
  voiceLabel: string;
  demoToneLabel: string;
  copyTextBtn: string;
  copiedBtn: string;
  downloadWavBtn: string;
  restartAudioTooltip: string;
  playAudioAria: string;
  pauseAudioAria: string;
  muteAria: string;
  unmuteAria: string;

  compareModalTitle: string;
  compareModalSubtitle: string;
  compareCloseBtn: string;
  comparedTextLabel: string;
  playBtn: string;
  pauseBtn: string;
  failedAudio: string;

  historyTitle: string;
  clearHistoryBtn: string;
  loadToEditorTooltip: string;

  aiModalTitle: string;
  aiModalSubtitle: string;
  aiTabGenerate: string;
  aiTabEnhance: string;
  aiTargetStyleLabel: string;
  aiSuggestionsLabel: string;
  aiPromptLabel: string;
  aiPromptPlaceholder: string;
  aiGenerateBtn: string;
  aiGeneratingBtn: string;
  aiEnhanceLabel: string;
  aiEnhancePlaceholder: string;
  aiEnhanceBtn: string;
  aiEnhancingBtn: string;
  aiResultTitle: string;
  aiApplyBtn: string;

  alertTitle: string;
  closeBtn: string;
  footerText: string;

  quotaExceededTitle: string;
  quotaExceededDesc: string;
  quotaExceededBadge: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationSchema> = {
  en: {
    appTitle: 'Nāṭiq — Arabic Fusha TTS',
    appBadge: 'Modern Standard Arabic',
    appSubtitle: 'Speech synthesis: Neutral, Cheerful, and Formal News Anchor',
    stylesBadge: '3 Vocal Styles',
    aiAssistantBtn: 'AI Assistant',
    modelLabel: 'Model:',
    connectedStatus: 'Gemini TTS Ready',
    demoStatus: 'API Key Not Set',

    stylesTitle: 'Select Vocal Expression Style',
    stylesSubtitle: 'Define the tone, inflection, and vocal energy for your Arabic script',
    availableStyles: '3 Styles Available',
    useSampleBtn: 'Load Sample Script',

    styleNetralName: 'Neutral & Natural',
    styleNetralBadge: 'Calm & Balanced',
    styleNetralDesc: 'Even-tempered, natural pace in Arabic Fusha, ideal for audiobooks, cultural podcasts, and educational dialogues.',

    styleGembiraName: 'Cheerful & Upbeat',
    styleGembiraBadge: 'Joyful & Dynamic',
    styleGembiraDesc: 'Full of excitement, smiling vocal cadence, and positive momentum for greetings, celebratory promos, and vibrant stories.',

    styleFormalName: 'Formal News Anchor',
    styleFormalBadge: 'Authoritative & Resonant',
    styleFormalDesc: 'Authoritative broadcast cadence, resonant articulation, and precise grammatical pronunciation for news bulletins.',

    scriptTitle: 'Arabic Fusha Script',
    writeWithAiBtn: 'Draft with AI',
    tashkeelBtn: 'AI Tashkeel (Vowel Diacritics)',
    tashkeelingBtn: 'Adding Harakat...',
    tashkeelDoneBtn: 'Diacritics Added!',
    clearBtn: 'Clear',
    sampleChipsLabel: 'Ready-to-use samples:',
    textareaPlaceholder: 'Type or paste your text in Modern Standard Arabic here. Adding tashkeel ensures 100% pronunciation accuracy...',
    tashkeelTip: 'Tip: Adding full diacritic vowels (Tashkeel) gives perfect grammatical pronunciation.',
    wordsCount: 'words',
    charsCount: 'characters',

    generateVoiceBtn: 'Generate Voice:',
    generatingVoiceBtn: 'Synthesizing Arabic Speech...',
    compareAllBtn: 'Compare All 3 Styles Side-by-Side',
    comparingBtn: 'Processing 3 Styles...',

    voiceTitle: 'AI Voice Personas',
    voiceSubtitle: 'Gemini 3.8 Prebuilt Voices',
    voiceFemale: 'Female',
    voiceMale: 'Male',
    speedLabel: 'Speaking Pace:',
    tempoNormal: 'Normal',
    tempoSlow: 'Slow',
    tempoWordByWord: 'Slow + pauses',
    tempoHintNormal: 'Natural speed.',
    tempoHintSlow: 'Spoken slowly and clearly, good for beginners.',
    tempoHintWord: 'Very slow with a pause after every word, for listening and dictation practice.',
    loginTitle: 'Enter Password',
    loginSubtitle: 'This app is for IUBS teachers and students. Enter the password from your teacher.',
    loginPlaceholder: 'Password',
    loginButton: 'Sign in',
    loginChecking: 'Checking…',
    loginErrorWrong: 'Incorrect password. Please try again.',
    logoutBtn: 'Sign out',
    customExpressionLabel: 'Extra expression:',
    customNuanceToggle: 'Custom Vocal Direction (+)',
    customNuanceClose: 'Hide Custom Direction',
    customNuanceLabel: 'Additional Vocal Nuances (Custom Style Prompt):',
    customNuanceOptional: 'Optional',
    baseDirectivePrefix: 'Base directive for active style:',
    customNuancePlaceholder: 'e.g. Whispered softly, documentary style, or slightly faster tempo...',

    playerEmptyTitle: 'Arabic Audio Player Ready',
    playerEmptyDesc: 'Select an expression style above and click Generate Voice to hear authentic Arabic Fusha pronunciation.',
    styleLabel: 'Style:',
    voiceLabel: 'Voice:',
    demoToneLabel: 'Demo Tone',
    copyTextBtn: 'Copy Script',
    copiedBtn: 'Copied!',
    downloadWavBtn: 'Download (.wav)',
    restartAudioTooltip: 'Restart from beginning',
    playAudioAria: 'Play audio',
    pauseAudioAria: 'Pause audio',
    muteAria: 'Mute volume',
    unmuteAria: 'Unmute volume',

    compareModalTitle: 'Compare All 3 Arabic Styles Side-by-Side',
    compareModalSubtitle: 'Listen to the distinct vocal contrast between Neutral, Cheerful, and Formal News',
    compareCloseBtn: 'Close Comparison',
    comparedTextLabel: 'Compared Script:',
    playBtn: 'Play',
    pauseBtn: 'Pause',
    failedAudio: 'Audio generation failed',

    historyTitle: 'Generated Audio Clips',
    clearHistoryBtn: 'Clear History',
    loadToEditorTooltip: 'Load script into editor',

    aiModalTitle: 'AI Script & Tashkeel Assistant',
    aiModalSubtitle: 'Compose, refine, and diacritize Arabic Fusha text with Gemini AI',
    aiTabGenerate: 'Generate Script from Topic',
    aiTabEnhance: 'Enhance & Translate to Fusha',
    aiTargetStyleLabel: 'Target Vocal Style:',
    aiSuggestionsLabel: 'Suggested topics:',
    aiPromptLabel: 'Enter your topic or concept (in English, Indonesian, or Arabic):',
    aiPromptPlaceholder: 'e.g. Breaking news on renewable energy project, or warm graduation congratulations...',
    aiGenerateBtn: 'Generate Diacritized Fusha Script with AI',
    aiGeneratingBtn: 'Generating and diacritizing text...',
    aiEnhanceLabel: 'Enter any draft (colloquial, rough, or other languages):',
    aiEnhancePlaceholder: 'Paste draft text to convert into eloquent Fusha with full vowel marks...',
    aiEnhanceBtn: 'Convert & Enhance to Fusha',
    aiEnhancingBtn: 'Refining grammar and adding harakat...',
    aiResultTitle: 'Generated Arabic Script (Ready to Speak):',
    aiApplyBtn: 'Apply to Script Editor',

    alertTitle: 'Notice',
    closeBtn: 'Close',
    footerText: 'Nāṭiq • IUBS • Gemini 3.8 Flash TTS • Arabic Fusha',

    quotaExceededTitle: 'Gemini API Quota Exceeded (429)',
    quotaExceededDesc: 'The Gemini API quota has been used up, so no audio was generated. Wait a while (or until the daily quota resets) and try again. For a larger quota, enable billing on the Google AI Studio project that owns the API key.',
    quotaExceededBadge: 'Quota exceeded (429)',
  },

  ar: {
    appTitle: 'ناطق — الصوت العربي الفصيح',
    appBadge: 'العربية الفصحى',
    appSubtitle: 'تحويل النص إلى صوت فصيح: محايد، مبتهج، وإخباري رسمي',
    stylesBadge: '3 أنماط صوتية',
    aiAssistantBtn: 'مساعد الذكاء الاصطناعي',
    modelLabel: 'النموذج:',
    connectedStatus: 'Gemini TTS متصل',
    demoStatus: 'مفتاح API غير مضبوط',

    stylesTitle: 'اختر نمط الإلقاء الصوتي الفصيح',
    stylesSubtitle: 'حدد أسلوب النبرة والتلوين الصوتي ومخارج الحروف المناسبة لنصك',
    availableStyles: '3 أنماط متوفرة',
    useSampleBtn: 'استخدم نص النموذج',

    styleNetralName: 'محايد وطبيعي',
    styleNetralBadge: 'طبيعي وهادئ',
    styleNetralDesc: 'إلقاء هادئ ومتزن باللغة العربية الفصحى، مناسب للمحادثات، البودكاست الثقافي، والكتب المسموعة.',

    styleGembiraName: 'مبتهج وحماسي',
    styleGembiraBadge: 'فرح وحماسي',
    styleGembiraDesc: 'نبرة مفعمة بالفرح والسرور والحماس والابتسامة، مثالية للتهاني، الإعلانات التشويقية، والقصص الحيوية.',

    styleFormalName: 'إخباري رسمي',
    styleFormalBadge: 'وقور وفصيح',
    styleFormalDesc: 'نبرة مذيع نشرات الأخبار التلفزيونية الرسمية، إلقاء جهوري وقور، إيقاع رصين ودقة تامة في الضبط والتشكيل.',

    scriptTitle: 'النص العربي الفصيح',
    writeWithAiBtn: 'كتابة بالذكاء الاصطناعي',
    tashkeelBtn: 'تشكيل آلي بالحركات (Tashkeel AI)',
    tashkeelingBtn: 'جاري التشكيل...',
    tashkeelDoneBtn: 'تم التشكيل!',
    clearBtn: 'مسح',
    sampleChipsLabel: 'نماذج فصيحة جاهزة:',
    textareaPlaceholder: 'اكتب أو الصق النص باللغة العربية الفصحى هنا مع التشكيل للحصول على أعلى دقة نطق...',
    tashkeelTip: 'نصيحة: ضبط التشكيل بالحركات يُعطي نطقًا عربياً فصيحاً بنسبة 100%.',
    wordsCount: 'كلمة',
    charsCount: 'حرف',

    generateVoiceBtn: 'توليد الصوت: نمط',
    generatingVoiceBtn: 'جاري التوليد الصوتي الفصيح...',
    compareAllBtn: 'مقارنة الأنماط الثلاثة معًا',
    comparingBtn: 'جاري معالجة 3 أنماط...',

    voiceTitle: 'أصوات الذكاء الاصطناعي',
    voiceSubtitle: 'أصوات Gemini 3.8 المدمجة',
    voiceFemale: 'أنثى',
    voiceMale: 'ذكر',
    speedLabel: 'سرعة الإلقاء:',
    tempoNormal: 'عادي',
    tempoSlow: 'بطيء',
    tempoWordByWord: 'بطيء مع وقفات',
    tempoHintNormal: 'السرعة الطبيعية.',
    tempoHintSlow: 'إلقاء بطيء وواضح، مناسب للمبتدئين.',
    tempoHintWord: 'بطيء جدًا مع وقفة بعد كل كلمة، لتدريب الاستماع والإملاء.',
    loginTitle: 'أدخل كلمة المرور',
    loginSubtitle: 'هذا التطبيق خاص بمعلمي وطلاب IUBS. أدخل كلمة المرور من معلمك.',
    loginPlaceholder: 'كلمة المرور',
    loginButton: 'دخول',
    loginChecking: 'جارٍ التحقق…',
    loginErrorWrong: 'كلمة المرور غير صحيحة. حاول مرة أخرى.',
    logoutBtn: 'خروج',
    customExpressionLabel: 'تعبير إضافي:',
    customNuanceToggle: 'توجيهات إضافية للنبرة (+)',
    customNuanceClose: 'إخفاء التوجيهات الخاصة',
    customNuanceLabel: 'توجيهات صوتية إضافية (Custom Style Prompt):',
    customNuanceOptional: 'اختياري',
    baseDirectivePrefix: 'التوجيه الأساسي للنمط الحالي:',
    customNuancePlaceholder: 'مثال: نبرة وثائقية تأملية، أو صوت دافئ مع وقفات مريحة بين الجمل...',

    playerEmptyTitle: 'مشغل الصوت العربي الفصيح',
    playerEmptyDesc: 'اختر نمط الإلقاء الصوتي واضغط على توليد الصوت للاستماع إلى النطق العربي الفصيح.',
    styleLabel: 'النمط:',
    voiceLabel: 'الصوت:',
    demoToneLabel: 'معاينة تجريبية',
    copyTextBtn: 'نسخ النص',
    copiedBtn: 'تم النسخ!',
    downloadWavBtn: 'تحميل الصوت (.wav)',
    restartAudioTooltip: 'إعادة التشغيل من البداية',
    playAudioAria: 'تشغيل الصوت',
    pauseAudioAria: 'إيقاف مؤقت',
    muteAria: 'كتم الصوت',
    unmuteAria: 'إلغاء كتم الصوت',

    compareModalTitle: 'مقارنة الأنماط الصوتية الثلاثة بالفصحى',
    compareModalSubtitle: 'استمع إلى الفارق الواضح في النبرة والإلقاء بين: محايد، مبتهج، وإخباري رسمي',
    compareCloseBtn: 'إغلاق المقارنة',
    comparedTextLabel: 'النص المُراد مقارنته:',
    playBtn: 'تشغيل',
    pauseBtn: 'إيقاف',
    failedAudio: 'فشل تحميل الصوت',

    historyTitle: 'سجل المقاطع الصوتية المنشأة',
    clearHistoryBtn: 'مسح السجل',
    loadToEditorTooltip: 'تحميل النص إلى المحرر',

    aiModalTitle: 'مساعد الذكاء الاصطناعي للنصوص الفصيحة',
    aiModalSubtitle: 'صياغة وتشكيل نصوص عربية فصحى مشكولة بدقة عبر Gemini AI',
    aiTabGenerate: 'توليد نصوص فصيحة من فكرة',
    aiTabEnhance: 'تحسين وترجمة أي نص إلى الفصحى',
    aiTargetStyleLabel: 'النمط الصوتي المستهدف:',
    aiSuggestionsLabel: 'أفكار ومواضيع مقترحة:',
    aiPromptLabel: 'اكتب موضوع أو فكرة النص (بالعربية، الإندونيسية، أو الإنجليزية):',
    aiPromptPlaceholder: 'مثال: خبر عاجل عن استكشاف الفضاء، أو نص ترحيبي دافئ للزوار الجدد...',
    aiGenerateBtn: 'توليد نص فصيح مشكول بالذكاء الاصطناعي',
    aiGeneratingBtn: 'جاري توليد وضبط النص الفصيح المشكول...',
    aiEnhanceLabel: 'أدخل أي نص أو مسودة (عامية، إندونيسية، إنجليزية، أو نص غير مدقق):',
    aiEnhancePlaceholder: 'أدخل النص هنا لتحويله وصياغته إلى العربية الفصحى البليغة مع التشكيل الكامل...',
    aiEnhanceBtn: 'تحويل وصياغة إلى الفصحى المشكولة',
    aiEnhancingBtn: 'جاري تحسين الصياغة وإضافة الحركات الإعرابية...',
    aiResultTitle: 'النص الفصيح المشكول الجاهز:',
    aiApplyBtn: 'اعتماد النص في المحرر',

    alertTitle: 'تنبيه',
    closeBtn: 'إغلاق',
    footerText: 'ناطق • IUBS • Gemini 3.8 Flash TTS • العربية الفصحى',

    quotaExceededTitle: 'تم استهلاك حصة Gemini API (429)',
    quotaExceededDesc: 'نفدت حصة Gemini API، لذلك لم يتم توليد أي صوت. انتظر قليلًا (أو حتى تتجدد الحصة اليومية) ثم حاول مرة أخرى. لحصة أكبر، فعّل الفوترة في مشروع Google AI Studio المرتبط بمفتاح API.',
    quotaExceededBadge: 'نفدت الحصة (429)',
  },

  id: {
    appTitle: 'Nāṭiq — TTS Arab Fusha',
    appBadge: 'Bahasa Arab Fusha',
    appSubtitle: 'Sintesis Suara Arab Fusha: Netral, Gembira, dan Formal Berita',
    stylesBadge: '3 Gaya Suara',
    aiAssistantBtn: 'Asisten AI',
    modelLabel: 'Model:',
    connectedStatus: 'Gemini TTS Terhubung',
    demoStatus: 'Kunci API Belum Dipasang',

    stylesTitle: 'Pilih Gaya Ekspresi Suara Arab Fusha',
    stylesSubtitle: 'Tentukan karakter intonasi, artikulasi, dan energi vokal untuk naskah Arab Anda',
    availableStyles: '3 Gaya Tersedia',
    useSampleBtn: 'Gunakan Contoh Teks',

    styleNetralName: 'Netral & Alami (محايد)',
    styleNetralBadge: 'Tenang & Seimbang',
    styleNetralDesc: 'Intonasi tenang dan seimbang dalam bahasa Arab Fusha, cocok untuk audiobook, siniar budaya, dan percakapan edukasi.',

    styleGembiraName: 'Gembira & Antusias (مبتهج)',
    styleGembiraBadge: 'Ceria & Bersemangat',
    styleGembiraDesc: 'Penuh antusiasme, nada ceria berenergi positif dengan senyum vokal untuk ucapan selamat, promo menarik, dan cerita hidup.',

    styleFormalName: 'Formal Berita (إخباري رسمي)',
    styleFormalBadge: 'Wibawa & Berbobot',
    styleFormalDesc: 'Intonasi wibawa khas presenter warta berita televisi resmi, vokal جهوري mantap dengan ketepatan makhraj dan harakat.',

    scriptTitle: 'Naskah Arab Fusha (النص العربي)',
    writeWithAiBtn: 'Tulis dengan AI',
    tashkeelBtn: 'Tashkeel Otomatis AI (تشكيل بالحركات)',
    tashkeelingBtn: 'Menyusun Harakat...',
    tashkeelDoneBtn: 'Harakat Selesai!',
    clearBtn: 'Bersihkan',
    sampleChipsLabel: 'Contoh teks siap pakai:',
    textareaPlaceholder: 'Tulis atau tempel teks bahasa Arab Fusha di sini. Menambahkan harakat lengkap menjamin keakuratan pelafalan 100%...',
    tashkeelTip: 'Tips: Harakat lengkap (Tashkeel) menghasilkan pelafalan tata bahasa Arab Fusha yang sempurna.',
    wordsCount: 'kata',
    charsCount: 'karakter',

    generateVoiceBtn: 'Generate Suara: Gaya',
    generatingVoiceBtn: 'Menyintesis Suara Arab Fusha...',
    compareAllBtn: 'Bandingkan 3 Gaya Sekaligus',
    comparingBtn: 'Memproses 3 Gaya...',

    voiceTitle: 'Karakter Suara AI (Voice Avatars)',
    voiceSubtitle: 'Suara Prebuilt Gemini 3.8',
    voiceFemale: 'Wanita',
    voiceMale: 'Pria',
    speedLabel: 'Tempo Bicara:',
    tempoNormal: 'Normal',
    tempoSlow: 'Lambat',
    tempoWordByWord: 'Lambat + jeda',
    tempoHintNormal: 'Kecepatan biasa.',
    tempoHintSlow: 'Dibacakan pelan dan jelas, cocok untuk pemula.',
    tempoHintWord: 'Sangat pelan dengan jeda setiap kata, untuk latihan menyimak dan imla.',
    loginTitle: 'Masukkan Sandi',
    loginSubtitle: 'Aplikasi ini khusus guru dan murid IUBS. Masukkan sandi dari guru Anda.',
    loginPlaceholder: 'Sandi',
    loginButton: 'Masuk',
    loginChecking: 'Memeriksa…',
    loginErrorWrong: 'Sandi salah. Silakan coba lagi.',
    logoutBtn: 'Keluar',
    customExpressionLabel: 'Ekspresi tambahan:',
    customNuanceToggle: 'Kustomisasi Nuansa Vokal (+)',
    customNuanceClose: 'Tutup Kustomisasi',
    customNuanceLabel: 'Petunjuk Nuansa Suara Tambahan (Custom Style Prompt):',
    customNuanceOptional: 'Opsional',
    baseDirectivePrefix: 'Arahan dasar gaya aktif:',
    customNuancePlaceholder: 'Contoh: Berbisik lembut, gaya dokumenter sejarah, atau tempo sedikit lebih cepat...',

    playerEmptyTitle: 'Pemutar Audio Arab Siap',
    playerEmptyDesc: 'Pilih salah satu gaya suara di atas lalu klik tombol Generate Suara untuk mendengar pelafalan Fusha aslinya.',
    styleLabel: 'Gaya:',
    voiceLabel: 'Suara:',
    demoToneLabel: 'Pratinjau Demo',
    copyTextBtn: 'Salin Naskah',
    copiedBtn: 'Tersalin!',
    downloadWavBtn: 'Unduh Audio (.wav)',
    restartAudioTooltip: 'Ulangi dari awal',
    playAudioAria: 'Putar audio',
    pauseAudioAria: 'Jeda audio',
    muteAria: 'Bisukan volume',
    unmuteAria: 'Aktifkan suara',

    compareModalTitle: 'Perbandingan 3 Gaya Suara Arab Fusha Sekaligus',
    compareModalSubtitle: 'Dengarkan kontras intonasi antara Netral, Gembira, dan Formal Berita',
    compareCloseBtn: 'Tutup Perbandingan',
    comparedTextLabel: 'Naskah yang dibandingkan:',
    playBtn: 'Putar',
    pauseBtn: 'Jeda',
    failedAudio: 'Gagal memproses audio',

    historyTitle: 'Riwayat Klip Suara',
    clearHistoryBtn: 'Hapus Riwayat',
    loadToEditorTooltip: 'Muat naskah ini ke editor',

    aiModalTitle: 'Asisten AI Naskah & Tashkeel Arab Fusha',
    aiModalSubtitle: 'Buat, sempurnakan, dan berikan harakat naskah Arab Fusha dengan Gemini AI',
    aiTabGenerate: 'Buat Naskah dari Topik',
    aiTabEnhance: 'Sempurnakan & Terjemahkan ke Fusha',
    aiTargetStyleLabel: 'Gaya Suara Sasaran:',
    aiSuggestionsLabel: 'Saran topik cepat:',
    aiPromptLabel: 'Tuliskan topik atau ide naskah (Bahasa Indonesia, Arab, atau Inggris):',
    aiPromptPlaceholder: 'Contoh: Berita terkini proyek energi terbarukan, atau ucapan selamat kelulusan yang hangat...',
    aiGenerateBtn: 'Buat Naskah Fusha Berharakat dengan AI',
    aiGeneratingBtn: 'Menyusun naskah dan harakat...',
    aiEnhanceLabel: 'Masukkan naskah mentah (bahasa gaul, Indonesia, Inggris, atau draf):',
    aiEnhancePlaceholder: 'Tempel naskah untuk diubah menjadi bahasa Arab Fusha sastra berharakat lengkap...',
    aiEnhanceBtn: 'Ubah & Sempurnakan ke Fusha',
    aiEnhancingBtn: 'Menyempurnakan tata bahasa dan harakat...',
    aiResultTitle: 'Naskah Arab Fusha Berharakat Siap Baca:',
    aiApplyBtn: 'Terapkan ke Editor Naskah',

    alertTitle: 'Pemberitahuan',
    closeBtn: 'Tutup',
    footerText: 'Nāṭiq • IUBS • Gemini 3.8 Flash TTS • Bahasa Arab Fusha',

    quotaExceededTitle: 'Kuota Gemini API Habis (429)',
    quotaExceededDesc: 'Kuota Gemini API sedang habis, jadi suara tidak dibuat. Tunggu beberapa saat (atau sampai kuota harian pulih), lalu coba lagi. Untuk kuota lebih besar, aktifkan penagihan (billing) pada proyek Google AI Studio pemilik kunci API.',
    quotaExceededBadge: 'Kuota habis (429)',
  },
};

export function getTranslation(lang: AppLanguage): TranslationSchema {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
