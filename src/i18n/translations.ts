/**
 * InfraLens Multilingual Translation System
 * Supporting 9 Official Indian Regional Languages
 */

export interface LanguageOption {
  code: string;
  nativeName: string;
  englishName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu' },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi' },
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati' },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada' },
  { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam' },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  // Navigation & Core Labels
  'app.title': {
    en: 'InfraLens Civic Intelligence',
    hi: 'इंफ्रालेंस नागरिक अवसंरचना बुद्धिमत्ता',
    bn: 'ইনফ্রালেন্স নাগরিক অবকাঠামো পর্যবেক্ষণ',
    ta: 'இன்ஃப்ராலென்ஸ் குடிமை நுண்ணறிவு',
    te: 'ఇన్‌ఫ్రాలెన్స్ పౌర మౌలిక వసతుల పర్యవేక్షణ',
    mr: 'इन्फ्रालेंस नागरी पायाभूत सुविधा बुद्धिमत्ता',
    gu: 'ઇન્ફ્રాలૅન્સ નાગરિક માળખાગત બુદ્ધિમત્તા',
    kn: 'ಇನ್‌ಫ್ರಾಲೆನ್ಸ್ ನಾಗರಿಕ ಮೂಲಸೌಕರ್ಯ ಬುದ್ಧಿಮತ್ತೆ',
    ml: 'ഇൻഫ്രാലെൻസ് സിവിക് ഇന്റലിജൻസ്',
  },
  'nav.command_center': {
    en: 'Command Center',
    hi: 'कमांड सेंटर',
    bn: 'কমান্ড সেন্টার',
    ta: 'கட்டளை மையம்',
    te: 'కమాండ్ సెంటర్',
    mr: 'कमांड सेंटर',
    gu: 'કમાન્ડ સેન્ટર',
    kn: 'ಕಮಾಂಡ್ ಸೆಂಟರ್',
    ml: 'കമാൻഡ് സെന്റർ',
  },
  'nav.citizen_portal': {
    en: 'Citizen Portal',
    hi: 'नागरिक पोर्टल',
    bn: 'নাগরিক পোর্টাল',
    ta: 'குடிமக்கள் போர்டல்',
    te: 'పౌర పోర్టల్',
    mr: 'नागरिक पोर्टल',
    gu: 'નાગરિક પોર્ટલ',
    kn: 'ನಾಗರಿಕ ಪೋರ್ಟಲ್',
    ml: 'പൗര പോർട്ടൽ',
  },
  'nav.gis_map': {
    en: 'GIS Tactical Map',
    hi: 'जीआईएस सामरिक मानचित्र',
    bn: 'জিআইএস ট্যাকটিক্যাল ম্যাপ',
    ta: 'ஜிஐஎஸ் வரைபடம்',
    te: 'జిఐఎస్ మ్యాప్',
    mr: 'जीआयएस नकाशा',
    gu: 'જીઆઈએસ નકશો',
    kn: 'ಜಿಐಎಸ್ ನಕ್ಷೆ',
    ml: 'ജിഐഎസ് ഭൂപടം',
  },
  'nav.priority_queue': {
    en: 'Priority Queue',
    hi: 'प्राथमिकता कतार',
    bn: 'অগ্রাধিকার সারি',
    ta: 'முன்னுரிமை வரிசை',
    te: 'ప్రాధాన్యతా క్యూ',
    mr: 'प्राधान्य रांग',
    gu: 'પ્રાથમિકતા કતાર',
    kn: 'ಆದ್ಯತಾ ಸರತಿ',
    ml: 'മുൻഗണനാ ക്യൂ',
  },
  'nav.analytics': {
    en: 'Municipal Analytics',
    hi: 'नगरपालिका विश्लेषिकी',
    bn: 'পৌর বিশ্লেষণ',
    ta: 'நகராட்சி பகுப்பாய்வு',
    te: 'మునిసిపల్ విశ్లేషణలు',
    mr: 'महानगरपालिका विश्लेषण',
    gu: 'પાલિકા વિશ્લેષણ',
    kn: 'ಪುರಸಭೆಯ ವಿಶ್ಲೇಷಣೆ',
    ml: 'മുനിസിപ്പൽ അനലിറ്റിക്‌സ്',
  },

  // Actions
  'action.report_issue': {
    en: 'Report Infrastructure Defect',
    hi: 'अवसंरचना दोष दर्ज करें',
    bn: 'অবকাঠামো ত্রুটি রিপোর্ট করুন',
    ta: 'உள்கட்டமைப்பு குறைபாட்டைப் புகாரளிக்கவும்',
    te: 'మౌలిక వసతుల సమస్యను నివేదించండి',
    mr: 'पायाभूत सुविधा दोष नोंदवा',
    gu: 'માળખાકીય ખામી નોંધાવો',
    kn: 'ಮೂಲಸೌಕರ್ಯ ದೋಷವನ್ನು ವರದಿ ಮಾಡಿ',
    ml: 'അടിസ്ഥാന സൗകര്യ തകരാർ റിപ്പോർട്ട് ചെയ്യുക',
  },
  'action.confirm_present': {
    en: 'Confirm Still Present',
    hi: 'पुष्टि करें कि समस्या अभी भी है',
    bn: 'নিশ্চিত করুন সমস্যাটি এখনও উপস্থিত',
    ta: 'இன்னும் உள்ளது என்பதை உறுதிப்படுத்தவும்',
    te: 'ఇంకా ఉందని ధృవీకరించండి',
    mr: 'अजूनही समस्या आहे याची पुष्टी करा',
    gu: 'ખાતરી કરો કે સમસ્યા હજુ પણ છે',
    kn: 'ಇನ್ನೂ ಇದೆ ಎಂದು ದೃಢೀಕರಿಸಿ',
    ml: 'ഇപ്പോഴും നിലനിൽക്കുന്നുവെന്ന് സ്ഥിരീകരിക്കുക',
  },
  'action.track_issue': {
    en: 'Track My Reports',
    hi: 'मेरी रिपोर्ट ट्रैक करें',
    bn: 'আমার রিপোর্ট ট্র্যাক করুন',
    ta: 'என் புகார்களைக் கண்காணிக்கவும்',
    te: 'నా నివేదికలను ట్రాక్ చేయండి',
    mr: 'माझे अहवाल ट्रॅक करा',
    gu: 'મારા અહેવાલો ટ્રૅક કરો',
    kn: 'ನನ್ನ ವರದಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    ml: 'എന്റെ റിപ്പോർട്ടുകൾ ട്രാക്ക് ചെയ്യുക',
  },

  // Defect Categories
  'cat.pothole': {
    en: 'Road Damage & Pothole',
    hi: 'सड़क क्षति एवं गड्ढा',
    bn: 'রাস্তার ক্ষতি এবং খানাখন্দ',
    ta: 'சாலை சேதம் மற்றும் குழி',
    te: 'రోడ్డు దెబ్బతినడం మరియు గుంత',
    mr: 'रस्ता खराब व खड्डे',
    gu: 'રસ્તાનું નુકસાન અને ખાડા',
    kn: 'ರಸ್ತೆ ಹಾನಿ ಮತ್ತು ಗುಂಡಿ',
    ml: 'റോഡ് തകരാറും കുഴികളും',
  },
  'cat.drainage': {
    en: 'Drainage & Stormwater Overflow',
    hi: 'जल निकासी एवं नाला अतिप्रवाह',
    bn: 'নিকাশি ও নর্দমা উপচে পড়া',
    ta: 'வடிகால் மற்றும் மழைநீர் பெருக்கெடுத்தல்',
    te: 'డ్రైనేజీ మరియు మురుగునీటి పొంగిపొర్లడం',
    mr: 'ड्रेनेज व सांडपाणी ओसंडून वाहणे',
    gu: 'ડ્રેનેજ અને વરસાદી પાણી ભરાવું',
    kn: 'ಒಳಚರಂಡಿ ಮತ್ತು ಮಳೆನೀರು ಉಕ್ಕಿ ಹರಿಯುವುದು',
    ml: 'ഡ്രെയിനേജ് കവിഞ്ഞൊഴുകൽ',
  },
  'cat.electrical': {
    en: 'Electrical & Cable Hazard',
    hi: 'विद्युत एवं केबल खतरा',
    bn: 'বৈদ্যুতিক ও তারের বিপজ্জনক অবস্থা',
    ta: 'மின்சாரம் மற்றும் கேபிள் ஆபத்து',
    te: 'విద్యుత్ మరియు కేబుల్ ప్రమాదం',
    mr: 'विद्युत व केबल धोका',
    gu: 'વીજળી અને કેબલ જોખમ',
    kn: 'ವಿದ್ಯುತ್ ಮತ್ತು ಕೇಬಲ್ ಅಪಾಯ',
    ml: 'വൈദ്യുത അപകടസാധ്യത',
  },
};

export function t(key: string, languageCode: string = 'en'): string {
  const entry = TRANSLATIONS[key];
  if (!entry) return key;
  return entry[languageCode] || entry['en'] || key;
}
