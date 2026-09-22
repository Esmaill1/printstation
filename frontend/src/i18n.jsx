import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    appTitle: 'PrintStation',
    tagline: 'Universal Self-Service Printing for University Students',
    uploadPrompt: 'Tap or drop your document, slides, or photo of notes here',
    uploadLimit: 'Max file size: 50MB (PDF, DOCX, PPTX, JPG, PNG, HEIC)',
    pages: 'Pages',
    bw: 'Black & White',
    color: 'Color',
    singleSided: 'Single-sided',
    doubleSided: 'Double-sided',
    copies: 'Copies',
    aiSummary: 'AI Summarize & Print',
    aiSummaryDesc: 'Condense lectures into clean, bulleted study notes before printing',
    ocrOrganize: '✨ OCR & Organize Notes',
    ocrOrganizeDesc: 'Convert photo of handwriting or whiteboard into structured printable notes',
    totalPrice: 'Total Price',
    minimumOrder: 'Minimum charge: 3.00 EGP',
    proceedToPay: 'Proceed to Payment',
    pickupCodeHeader: 'Your Pickup Code',
    pickupCodeInstruction: 'Go to any PrintStation kiosk on campus and type this 6-digit code or scan the QR code.',
    kioskLocation: 'Campus Kiosks: Main Library (Ground Floor), Engineering Building 2',
    status: {
      uploaded: 'Uploaded',
      processing: 'Converting & Processing',
      ready_for_payment: 'Awaiting Payment',
      paid: 'Ready to Print',
      printing: 'Printing at Kiosk',
      completed: 'Completed',
      failed: 'Failed',
    },
    switchLang: 'العربية',
  },
  ar: {
    appTitle: 'برنت ستيشن',
    tagline: 'طباعة ذاتية فورية لجميع المستندات وصور المحاضرات',
    uploadPrompt: 'اضغط أو اسحب أي ملف، سلايدات، أو صور مذكرات ومحاضرات هنا',
    uploadLimit: 'الحد الأقصى: 50 ميجابايت (PDF, Word, باوربوينت, صور)',
    pages: 'صفحات',
    bw: 'أبيض وأسود',
    color: 'ألوان',
    singleSided: 'وجه واحد',
    doubleSided: 'وجهين (دوبلكس)',
    copies: 'عدد النسخ',
    aiSummary: 'تلخيص الذكاء الاصطناعي والطباعة',
    aiSummaryDesc: 'تكثيف المحاضرات إلى ملخص مركز ونقاط رئيسية لتوفير الورق',
    ocrOrganize: '✨ تنظيم صور المذكرات بالذكاء الاصطناعي',
    ocrOrganizeDesc: 'تحويل صور السبورة والخط اليدوي إلى ملخص دراسي منظم وجاهز للطباعة',
    totalPrice: 'السعر الإجمالي',
    minimumOrder: 'الحد الأدنى للطلب: ٣.٠٠ جنيه',
    proceedToPay: 'المتابعة للدفع',
    pickupCodeHeader: 'كود الاستلام الخاص بك',
    pickupCodeInstruction: 'توجه إلى أي ماكينة برنت ستيشن وأدخل الكود المكون من 6 أرقام أو امسح الباركود بالكاميرا.',
    kioskLocation: 'أماكن الماكينات: المكتبة المركزية (الدور الأرضي)، مبنى هندسة ٢',
    status: {
      uploaded: 'تم الرفع',
      processing: 'جاري التحويل والمعالجة',
      ready_for_payment: 'في انتظار الدفع',
      paid: 'جاهز للطباعة',
      printing: 'جاري الطباعة في الماكينة',
      completed: 'اكتملت الطباعة',
      failed: 'حدث خطأ',
    },
    switchLang: 'English',
  },
};

const I18nContext = createContext({
  lang: 'en',
  t: (key) => key,
  toggleLang: () => {},
});

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('en');

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const t = (path) => {
    const keys = path.split('.');
    let cur = translations[lang];
    for (const k of keys) {
      if (!cur || cur[k] === undefined) return path;
      cur = cur[k];
    }
    return cur;
  };

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`app-lang-${lang}`}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
