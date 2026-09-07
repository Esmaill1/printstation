import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    brand: {
      name: 'PrintStation',
      sub: 'Upload · Pay · Print',
      simulatorTitle: 'PrintStation Hardware Simulator',
      footer: 'PrintStation v0.1 — University Graduation Project Prototype',
    },
    nav: {
      studentView: 'Student View',
      kioskView: 'Kiosk Touchscreen',
      studentPhoneView: 'Student Phone View',
      kioskTouchscreenView: 'Kiosk Touchscreen View',
      langToggle: 'العربية',
    },
    steps: {
      upload: 'Upload',
      options: 'Options',
      payment: 'Payment',
      confirmation: 'Done',
    },
    upload: {
      title: 'Upload your document',
      description: 'Drop in a PDF and it goes straight into the print queue. PDF is the only format this prototype accepts.',
      dragText: 'Drag & drop your PDF here',
      browseText: 'or click to browse',
      fileLimit: 'PDF only · Max 50MB · No page limit',
      uploading: 'Uploading {filename}...',
      errorExt: 'Only PDF files are accepted. Export your document as PDF first, then upload it.',
      errorSize: 'File is too large. Maximum size is 50MB.',
      errorFailed: 'Upload failed. Is the backend running?',
    },
    options: {
      title: 'Configure your print',
      studioTitle: 'Print Studio',
      studioSubtitle: 'Check the preview, set your print options, and watch the sheet count and price update as you go.',
      docDetails: 'Document details',
      fileName: 'File name',
      totalPages: 'Total pages',
      page: 'page',
      pages: 'pages',
      estimatedSheets: 'Estimated sheets',
      printOptions: 'Print options',
      colorLabel: 'Color',
      colorHint: 'B&W is recommended for text lectures',
      bw: 'Black & White',
      bwRate: '1.25 EGP / side',
      color: 'Full Color',
      colorRate: '3.50 EGP / side',
      sides: 'Sides',
      duplexEco: 'Saves 50% paper',
      duplex: 'Double-Sided',
      duplexDesc: 'Print on both sides',
      simplex: 'Single-Sided',
      simplexDesc: 'One page per sheet',
      pagesPerSheet: 'Pages per sheet',
      pagesHint: 'Compress slides or handouts',
      standard: 'Standard',
      sideBySide: 'Side-by-side',
      handoutGrid: 'Handout grid',
      pageRange: 'Pages',
      allPages: 'All Pages',
      allPagesDesc: '1 to {total}',
      customRange: 'Custom Range',
      customRangeDesc: 'Pick pages',
      customRangePlaceholder: 'e.g. 1-2, 4 (doc has {total} pages)',
      customRangeFeedback: 'Selected {effective} of {total} pages',
      copies: 'Copies',
      copiesHint: 'For teammates or extra sets',
      aiCardTitle: 'AI Study Summarizer',
      aiCardDesc: 'Condense long lectures into key points and formulas',
      aiSavesPages: 'Saves ~{count} pages',
      aiFeeBadge: '+2.00 EGP AI fee',
      aiPromptPlaceholder: 'Custom focus (optional, e.g. "Focus on Chapter 4 formulas")',
      liveSummaryTitle: 'Calculated summary',
      sheetsSavedBadge: '{count} sheets saved',
      contentPagesMetric: 'Content pages',
      paperSheetsMetric: 'Paper sheets',
      copiesMetric: 'Copies',
      totalPriceMetric: 'Total price',
      backToUpload: '← Back to upload',
      continueToPayment: 'Continue to payment ({price} EGP) →',
      configuringJob: 'Configuring job...',
      originalPdfTab: 'Original PDF',
      aiSummaryTab: 'AI Summary',
      fullscreenBtn: 'Fullscreen ↗',
      aiSummaryActiveTitle: 'AI Summary is on',
      aiSummaryActiveDesc: 'Your document will be condensed from {total} pages to ~{summaryPages} study sheets with key concepts and formulas highlighted.',
      aiWillGenerateBadge: 'Summary generates automatically when you continue',
      previewFooterInfo: 'Scroll and zoom the preview to verify your pages before paying.',
    },
    payment: {
      title: 'Pay for your print',
      description: 'Select your preferred Egyptian payment method to generate your pickup code.',
      orderSummary: 'Order Summary',
      file: 'File',
      pagesToPrint: 'Pages to print',
      physicalSheets: 'Physical sheets',
      copies: 'Copies',
      totalAmount: 'Total Amount',
      selectMethod: 'Select Payment Method',
      fawry: 'Fawry',
      fawryDesc: 'Pay via reference code at any Fawry kiosk or Fawry app',
      vodafoneCash: 'Vodafone Cash',
      vodafoneCashDesc: 'Pay with mobile wallet (Vodafone / Orange / Etisalat Cash)',
      instapay: 'InstaPay',
      instapayDesc: 'Instant bank transfer via Egypt national payment network',
      card: 'Credit / Debit Card',
      cardDesc: 'Visa, MasterCard, Meeza',
      payNowBtn: 'Confirm & Pay {amount} EGP →',
      processingPayment: 'Processing payment...',
      simulatedNotice: 'Demo mode: In this prototype, payment is simulated instantly without real charges.',
      backBtn: '← Back to Options',
    },
    confirmation: {
      badge: 'PRINT READY',
      title: 'Your print is queued!',
      description: 'Head to the kiosk on campus and enter your 6-digit pickup code to collect your paper.',
      pickupCodeLabel: 'YOUR PICKUP CODE',
      instructionsTitle: 'How to collect your printout:',
      step1: 'Walk to any PrintStation kiosk on campus.',
      step2: 'Type the 6-digit code on the touchscreen keypad.',
      step3: 'Your pages will immediately print and dispense into the tray.',
      detailsTitle: 'Job Details',
      jobId: 'Job ID',
      file: 'Document',
      sheets: 'Sheets',
      totalPaid: 'Amount Paid',
      paymentMethod: 'Payment',
      printAnotherBtn: '+ Print Another Document',
      kioskBannerTitle: 'Ready to collect?',
      kioskBannerDesc: 'Switch to the Kiosk Touchscreen, enter code {code}, and collect.',
      kioskBannerBtn: 'Open Kiosk Screen →',
    },
    kiosk: {
      kioskName: 'PrintStation Kiosk #01',
      kioskLocation: 'Campus Library · Main Entrance Hall',
      statusOnline: 'Online',
      paperLabel: 'Paper',
      tonerLabel: 'Toner',
      refillPaperTitle: 'Click to refill paper tray',
      collectPrints: 'COLLECT YOUR PRINTS',
      enterCode: 'Enter your 6-digit pickup code',
      codeSubtext: 'The code was generated when you paid in the student portal',
      clear: 'Clear',
      del: 'DEL',
      clearAll: 'CLEAR',
      lookingUp: 'Looking up your print job...',
      demoTag: 'Demo',
      demoReady: 'Paid jobs ready',
      demoLoad: 'Load',
      demoLoadBtn: 'Load #{id} ({filename})',
      demoSubtext: 'Upload & pay a document in Student View to get a pickup code',
      checkingCode: 'Checking code {pin}...',
      verifyingServer: 'Verifying with the PrintStation server...',
      confirmBadge: 'Print job ready',
      confirmTitle: 'Confirm your document',
      confirmSubhead: 'Check the job details and pick a printer.',
      docLabel: 'Document',
      sheetsLabel: 'Sheets to print',
      copiesLabel: 'Copies',
      jobIdLabel: 'Job ID',
      printerLabel: 'Printer hardware',
      windowsHardware: '(Windows Hardware)',
      virtualTray: '(Virtual Tray)',
      defaultSpooler: 'Virtual Kiosk Tray Spooler (Default)',
      paymentLabel: 'Payment',
      paidVerified: 'Paid & verified ✓',
      cancelReenterBtn: '← Cancel & re-enter code',
      startPrintingBtn: 'Start printing',
      printingTitle: 'Printing your document...',
      printingSheetInfo: '{printer} · Sheet {current} of {total}',
      feedTray: 'Feed tray',
      outputTray: 'Output tray',
      ready: 'Ready',
      spoolingFile: 'Spooling {filename}',
      spoolerHint: 'OS spooler active · producing verified sheets',
      dispensedTitle: 'Printing complete',
      dispensedInstruction: '{total} printed sheet{suffix} produced and verified.',
      receiptBadge: 'KIOSK PRINT RECEIPT',
      spoolerJob: 'Spooler job',
      hardwareDevice: 'Hardware device',
      sheetsProduced: 'Sheets produced',
      outputFile: 'Output file',
      openOutputPdf: 'Open printed output PDF →',
      collectTray: 'COLLECT PAPERS FROM THE TRAY',
      screenResetsIn: 'Screen resets in {seconds}s',
      finishedBtn: '✓ Finished — next student',
      footerSlotInstruction: 'Output paper tray below · kiosk-simulator/printed_output/',
      switchToStudent: 'Switch to Student Portal →',
      connectionError: 'Connection error. Is the backend server running?',
      codeNotFound: 'Code not found. Check the 6-digit code and try again.',
      jobNotPaid: 'This job is \'{status}\'. Only paid jobs can be printed.',
    }
  },
  ar: {
    brand: {
      name: 'برنت ستيشن',
      sub: 'ارفع · ادفع · اطبع',
      simulatorTitle: 'محاكي كشك الطباعة الذاتي (PrintStation)',
      footer: 'برنت ستيشن v0.1 — نموذج مشروع التخرج بالجامعة',
    },
    nav: {
      studentView: 'واجهة الطالب',
      kioskView: 'شاشة الكشك',
      studentPhoneView: 'واجهة الموبايل (الطالب)',
      kioskTouchscreenView: 'شاشة الكشك التفاعلية',
      langToggle: 'English',
    },
    steps: {
      upload: 'رفع الملف',
      options: 'الخيارات',
      payment: 'الدفع',
      confirmation: 'الاستلام',
    },
    upload: {
      title: 'ارفع مستندك للطباعة',
      description: 'اسحب ملف PDF وسيتم وضعه مباشرة في قائمة الطباعة. يدعم هذا النموذج ملفات PDF فقط.',
      dragText: 'اسحب ملف PDF وأفلته هنا',
      browseText: 'أو اضغط لتصفح ملفات جهازك',
      fileLimit: 'ملفات PDF فقط · أقصى حجم 50 ميجابايت · بدون حد للصفحات',
      uploading: 'جاري رفع {filename}...',
      errorExt: 'نقبل ملفات PDF فقط. يرجى تصدير ملفك بصيغة PDF أولاً ثم رفعه.',
      errorSize: 'حجم الملف كبير جداً. الحد الأقصى المسموح به هو 50 ميجابايت.',
      errorFailed: 'فشل رفع الملف. هل الخادم السحابي يعمل؟',
    },
    options: {
      title: 'خيارات الطباعة والورق',
      studioTitle: 'استوديو الطباعة',
      studioSubtitle: 'عاين المستند، حدد خيارات الطباعة، وتابع تحديث عدد الأوراق والسعر لحظة بلحظة.',
      docDetails: 'بيانات المستند',
      fileName: 'اسم الملف',
      totalPages: 'إجمالي الصفحات',
      page: 'صفحة',
      pages: 'صفحات',
      estimatedSheets: 'عدد الأوراق المقدر',
      printOptions: 'إعدادات الطباعة',
      colorLabel: 'الألوان',
      colorHint: 'ننصح بالأبيض والأسود للمذكرات والمحاضرات',
      bw: 'أبيض وأسود',
      bwRate: '1.25 ج.م / وجه',
      color: 'ألوان كاملة',
      colorRate: '3.50 ج.م / وجه',
      sides: 'الطباعة على الوجهين',
      duplexEco: 'يوفر 50% من الورق',
      duplex: 'على الوجهين',
      duplexDesc: 'طباعة على كلا الوجهين',
      simplex: 'وجه واحد',
      simplexDesc: 'صفحة واحدة لكل ورقة',
      pagesPerSheet: 'الصفحات لكل ورقة',
      pagesHint: 'ضغط السلايدات والملازم',
      standard: 'قياسي',
      sideBySide: 'صفحتان متجاورتان',
      handoutGrid: 'شبكة مذكرات',
      pageRange: 'نطاق الصفحات',
      allPages: 'جميع الصفحات',
      allPagesDesc: 'من 1 إلى {total}',
      customRange: 'نطاق مخصص',
      customRangeDesc: 'تحديد صفحات معينة',
      customRangePlaceholder: 'مثال: 1-2, 4 (المستند به {total} صفحة)',
      customRangeFeedback: 'تم تحديد {effective} من أصل {total} صفحة',
      copies: 'عدد النسخ',
      copiesHint: 'لزملائك في الفريق أو نسخ إضافية',
      aiCardTitle: 'ملخص المذاكرة الذكي',
      aiCardDesc: 'تلخيص المحاضرات الطويلة إلى أهم النقاط والقوانين الأساسية',
      aiSavesPages: 'يوفر ~{count} صفحة',
      aiFeeBadge: '+2.00 ج.م رسوم الذكاء الاصطناعي',
      aiPromptPlaceholder: 'تركيز مخصص (اختياري، مثلاً: "ركز على قوانين الفصل الرابع")',
      liveSummaryTitle: 'ملخص الحساب',
      sheetsSavedBadge: 'تم توفير {count} ورقة',
      contentPagesMetric: 'صفحات المحتوى',
      paperSheetsMetric: 'أوراق الطباعة',
      copiesMetric: 'النسخ',
      totalPriceMetric: 'السعر الإجمالي',
      backToUpload: '→ رجوع لرفع الملف',
      continueToPayment: 'المتابعة للدفع ({price} ج.م) ←',
      configuringJob: 'جاري تجهيز الطلب...',
      originalPdfTab: 'ملف الـ PDF الأصلي',
      aiSummaryTab: 'ملخص الذكاء الاصطناعي',
      fullscreenBtn: 'شاشة كاملة ↗',
      aiSummaryActiveTitle: 'ملخص الذكاء الاصطناعي مفعّل',
      aiSummaryActiveDesc: 'سيتم تلخيص المستند من {total} صفحة إلى حوالي {summaryPages} ورقة دراسية مركزة بأهم المفاهيم والمعادلات.',
      aiWillGenerateBadge: 'سيتم توليد التلخيص تلقائياً عند المتابعة',
      previewFooterInfo: 'مرر وكبّر المعاينة للتأكد من صفحاتك قبل الدفع.',
    },
    payment: {
      title: 'سداد قيمة الطباعة',
      description: 'اختر طريقة الدفع المناسبة لك لإصدار كود الاستلام الفوري.',
      orderSummary: 'ملخص الطلب',
      file: 'المستند',
      pagesToPrint: 'الصفحات المطلوب طباعتها',
      physicalSheets: 'الأوراق الفعلية الخارجة',
      copies: 'عدد النسخ',
      totalAmount: 'المبلغ الإجمالي',
      selectMethod: 'اختر وسيلة الدفع',
      fawry: 'فوري (Fawry)',
      fawryDesc: 'ادفع بكود الدفع من أي منفذ فوري أو تطبيق فوري',
      vodafoneCash: 'فودافون كاش / المحافظ الإلكترونية',
      vodafoneCashDesc: 'الدفع المباشر عبر المحفظة الإلكترونية (فودافون، أورانج، اتصالات)',
      instapay: 'إنستاباي (InstaPay)',
      instapayDesc: 'تحويل بنكي فوري عبر شبكة المدفوعات اللحظية المصرية',
      card: 'بطاقة بنكية (فيزا / ميزة / ماستركارد)',
      cardDesc: 'خصم مباشر أو بطاقات الائتمان',
      payNowBtn: 'تأكيد ودفع {amount} ج.م ←',
      processingPayment: 'جاري معالجة الدفع...',
      simulatedNotice: 'وضع التجربة: في هذا النموذج يتم محاكاة الدفع فورياً بدون أي خصم حقيقي.',
      backBtn: '→ رجوع للخيارات',
    },
    confirmation: {
      badge: 'جاهز للاستلام',
      title: 'تم إرسال طلبك لطابور الكشك!',
      description: 'توجه إلى أي كشك PrintStation في الحرم الجامعي وأدخل كود الاستلام المكون من 6 أرقام لاستلام أوراقك.',
      pickupCodeLabel: 'كود الاستلام الخاص بك',
      instructionsTitle: 'طريقة استلام مطبوعاتك:',
      step1: 'توجه إلى أي ماكينة أو كشك برنت ستيشن في الجامعة.',
      step2: 'أدخل الكود المكون من 6 أرقام على الشاشة التفاعلية للكشك.',
      step3: 'ستبدأ الطابعة في العمل وتخرج الأوراق في درج الاستلام مباشرة.',
      detailsTitle: 'بيانات الطلب',
      jobId: 'رقم الطلب',
      file: 'اسم المستند',
      sheets: 'الأوراق',
      totalPaid: 'المبلغ المدفوع',
      paymentMethod: 'وسيلة الدفع',
      printAnotherBtn: '+ طباعة مستند جديد',
      kioskBannerTitle: 'جاهز للاستلام الآن؟',
      kioskBannerDesc: 'انتقل إلى شاشة الكشك، أدخل الكود {code}، واستلم مطبوعاتك.',
      kioskBannerBtn: 'فتح شاشة الكشك ←',
    },
    kiosk: {
      kioskName: 'كشك برنت ستيشن #01',
      kioskLocation: 'مكتبة الحرم الجامعي · البهو الرئيسي',
      statusOnline: 'متصل',
      paperLabel: 'الورق',
      tonerLabel: 'الحبر',
      refillPaperTitle: 'اضغط لإعادة ملء درج الورق',
      collectPrints: 'استلام المطبوعات',
      enterCode: 'أدخل كود الاستلام (6 أرقام)',
      codeSubtext: 'تم إنشاء هذا الكود بعد إتمام عملية الدفع في بوابة الطالب',
      clear: 'مسح',
      del: 'حذف',
      clearAll: 'مسح الكل',
      lookingUp: 'جاري البحث عن طلبك في النظام...',
      demoTag: 'تجربة',
      demoReady: 'الطلبات الجاهزة للاستلام',
      demoLoad: 'تحميل',
      demoLoadBtn: 'تحميل #{id} ({filename})',
      demoSubtext: 'ارفع وادفع مستندك من واجهة الطالب للحصول على كود الاستلام',
      checkingCode: 'جاري فحص الكود {pin}...',
      verifyingServer: 'جاري التحقق مع خادم PrintStation...',
      confirmBadge: 'طلب الطباعة جاهز',
      confirmTitle: 'تأكيد بيانات المستند',
      confirmSubhead: 'راجع تفاصيل الطلب واختر الطابعة المطلوبة.',
      docLabel: 'المستند',
      sheetsLabel: 'الأوراق المطلوب طباعتها',
      copiesLabel: 'النسخ',
      jobIdLabel: 'رقم الطلب',
      printerLabel: 'جهاز الطابعة',
      windowsHardware: '(طابعة ويندوز)',
      virtualTray: '(درج افتراضي)',
      defaultSpooler: 'طابعة الكشك الافتراضية (Virtual Kiosk Tray Spooler)',
      paymentLabel: 'حالة الدفع',
      paidVerified: 'تم السداد ومؤكد ✓',
      cancelReenterBtn: '→ إلغاء وإعادة إدخال الكود',
      startPrintingBtn: 'ابدأ الطباعة الآن',
      printingTitle: 'جاري طباعة مستندك...',
      printingSheetInfo: '{printer} · ورقة {current} من {total}',
      feedTray: 'درج التغذية',
      outputTray: 'درج الإخراج',
      ready: 'جاهز',
      spoolingFile: 'إرسال {filename} للطابعة',
      spoolerHint: 'نظام الطباعة نشط · يتم سحب وطباعة الأوراق',
      dispensedTitle: 'اكتملت الطباعة بنجاح',
      dispensedInstruction: 'تم إخراج وتأكيد {total} ورقة مطبوعة.',
      receiptBadge: 'إيصال طباعة الكشك',
      spoolerJob: 'رقم مهمة الطباعة',
      hardwareDevice: 'الجهاز المستخدم',
      sheetsProduced: 'الأوراق المطبوعة',
      outputFile: 'الملف الناتج',
      openOutputPdf: 'فتح ملف الـ PDF المطبوع ←',
      collectTray: 'استلم أوراقك من الدرج بالأسفل',
      screenResetsIn: 'ستعود الشاشة للرئيسية خلال {seconds} ثانية',
      finishedBtn: '✓ انتهيت — الطالب التالي',
      footerSlotInstruction: 'درج خروج الورق بالأسفل · kiosk-simulator/printed_output/',
      switchToStudent: 'الانتقال لبوابة الطالب →',
      connectionError: 'خطأ في الاتصال. هل خادم النظام يعمل؟',
      codeNotFound: 'الكود غير موجود. تأكد من الأرقام الستة وحاول مجدداً.',
      jobNotPaid: 'حالة هذا الطلب هي \'{status}\'. يمكن طباعة الطلبات المدفوعة فقط.',
    }
  }
};

const LanguageContext = createContext({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: () => '',
  isRtl: false,
});

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('printstation_lang') || 'en';
  });

  const isRtl = lang === 'ar';

  useEffect(() => {
    localStorage.setItem('printstation_lang', lang);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRtl]);

  const setLang = (newLang) => {
    if (newLang === 'en' || newLang === 'ar') {
      setLangState(newLang);
    }
  };

  const toggleLang = () => {
    setLangState((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  /**
   * Translate helper.
   * Usage: t('upload.title') or t('upload.uploading', { filename: 'test.pdf' })
   */
  const t = (path, params = {}) => {
    const keys = path.split('.');
    let current = translations[lang];
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English if key missing
        let fallback = translations.en;
        for (const fbKey of keys) {
          if (fallback && fallback[fbKey] !== undefined) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current === 'string') {
      let result = current;
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
      return result;
    }

    return current || path;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}

export function LanguageToggle({ className = '' }) {
  const { lang, toggleLang, t } = useTranslation();
  return (
    <button
      type="button"
      className={`lang-toggle-btn ${className}`}
      onClick={toggleLang}
      title={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
      aria-label="Toggle language"
    >
      <span className="lang-globe-icon" aria-hidden="true">🌐</span>
      <span className="lang-text">{lang === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
}
