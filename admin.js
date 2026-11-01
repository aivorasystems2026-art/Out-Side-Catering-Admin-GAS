(function () {
  var cfg = window.SUPABASE_CONFIG || {};
  var code = null, rows = [], idleTimer = null, lang = 'en';
  var IDLE_MS = 25 * 60 * 1000;
  var STATUSES = ['new', 'confirmed', 'completed', 'cancelled'];

  var STORAGE_LOG_KEY = 'cat_admin_reminders_log';
  var STORAGE_SETTINGS_KEY = 'cat_admin_wa_settings';
  var STORAGE_LAST_CHECK_KEY = 'cat_admin_last_auto_check';

  var DEFAULT_SETTINGS = {
    enabled: true,
    time: '10:00',
    daysBefore: 'all',
    templateAr: 'مرحباً {name}،\nتذكير ودّي من مطاعم قلعة الشهباء بخصوص حجزكم رقم {ref} لمناسبة {date}:\n• إجمالي قيمة العقد: {total} ريال\n• المسدد حتى الآن: {paid} ريال\n• المبلغ المتبقي المستحق: {balance} ريال\n\nنرجو التكرم بسداد المبلغ المتبقي قبل موعد المناسبة بخمسة أيام وفقاً لبنود العقد لضمان أعلى مستوى من الجاهزية.\nللتحويل البنكي أو أي استفسار، يمكنكم الرد مباشرة على هذه المحادثة.\nشكراً لاختياركم لنا ونتشرف بخدمتكم دائماً.',
    templateEn: 'Hello {name},\nFriendly payment reminder from Qalat Al-Shahba Restaurants regarding your booking {ref} for {date}:\n• Total Contract Amount: {total} SAR\n• Amount Paid: {paid} SAR\n• Remaining Balance Due: {balance} SAR\n\nKindly arrange payment of the remaining balance at least 5 days prior to your event date as agreed in the contract.\nFor bank transfer details or inquiries, please reply to this WhatsApp message.\nThank you for choosing us!'
  };

  function getSettings() {
    try {
      var s = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (s) return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(s));
    } catch (e) {}
    return Object.assign({}, DEFAULT_SETTINGS);
  }

  function saveSettings(s) {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(s));
    } catch (e) {}
  }

  function getReminderLogs() {
    try {
      var l = localStorage.getItem(STORAGE_LOG_KEY);
      if (l) return JSON.parse(l);
    } catch (e) {}
    return [];
  }

  function saveReminderLog(entry) {
    try {
      var logs = getReminderLogs();
      logs.unshift(entry);
      if (logs.length > 500) logs = logs.slice(0, 500);
      localStorage.setItem(STORAGE_LOG_KEY, JSON.stringify(logs));
    } catch (e) {}
  }

  var EN = {
    title: document.title, langBtn: 'العربية', ariaLang: 'Switch language',
    viewBookingPage: '🍽️ Booking Page',
    adminName: 'Booking Admin', lock: 'Lock',
    loginTitle: 'Enter security code', loginSub: 'This page shows customer bookings and is for staff only.',
    codeLabel: 'Security code', unlock: 'Unlock',
    invalid_code: 'Wrong security code.',
    fpDraw: 'Please draw the signature first.', fpSaved: 'Signature saved. Customers will see it on their agreement.', fpRemoved: 'Saved signature removed.', bad_signature: 'The signature could not be saved. Please try again.',
    invalid_pin: 'Wrong signing code.', locked_pin: 'Too many wrong signing codes. Please wait 15 minutes.', not_configured: 'First set the concerned person and signing code in the First party signature card.',
    pin_required: 'Please choose a signing code.', pin_too_short: 'The signing code must be at least 6 characters.', bad_name: 'Please enter the name of the concerned person.',
    fpNeedName: 'Please enter the name of the concerned person.', fpNeedPinNew: 'Please choose a signing code (at least 6 characters).', fpNeedPinOld: 'Please enter the current signing code to change these details.',
    fpNeedPin: 'Please enter the signing code.', fpWhoSaved: 'Saved. Only someone with the signing code can now sign for the first party.',
    st_completed: 'Completed', locked: 'Too many wrong attempts. Please wait 15 minutes and try again.',
    too_short: 'The new code must be at least 10 characters.', bad_status: 'That status is not allowed.',
    generic: 'Something went wrong. Please try again.', noConn: 'Could not connect. Check your internet and try again.',
    noSave: 'Could not save the change. Try again.', mismatch: 'The two codes do not match.',
    changed: 'Security code changed. Use the new code next time.', checking: 'Checking...',
    lCustomer: 'Customer', lPhone: 'Phone', lId: 'Saudi ID', lLocation: 'Location', lEvent: 'Event', lMenu: 'Menu',
    guests: 'guests', hijriChosen: ' (customer chose Hijri)', received: 'Received ', siteLang: ' · site language: ',
    langAr: 'Arabic', langEn: 'English', show: 'Show', hide: 'Hide', statusOf: 'Status of ', empty: 'No bookings match.',
    agSigned: 'Agreement signed by customer', pmBtn: 'Payment', agNeedAmounts: 'Add the payment amounts first.',
    signed_locked: 'The customer already signed this agreement, so the amounts can no longer be changed.',
    waBtn: 'Message customer on WhatsApp', waDone: 'Booking confirmed. Send the customer a WhatsApp message?', waOpen: 'Open WhatsApp', waDoneCancel: 'Booking cancelled. Send the customer a WhatsApp message?',
    agBtn: 'Agreement', agBlocked: 'Pop-up blocked. Allow pop-ups for this page and try again.', agPkgFilled: 'Filled in from the package price:', agPkgIs: 'Package price on the booking:',
    bad_amounts: 'The deposit cannot be more than the total amount.', not_found: 'Booking not found.',
    lAmounts: 'Amounts', sar: 'SAR', pTotal: 'Total', pDeposit: 'Deposit', pRemaining: 'Remaining', pSecurity: 'Security',
    totalsRow: 'Total', pCollected: 'Collected', pBalance: 'Balance due', payBtn: 'Collect payment', thEdit: 'Edit',
    bad_amount: 'Enter an amount above zero.', bad_method: 'Choose a payment method.',
    bad_date: 'The payment date cannot be in the future.', no_total: 'Enter the total amount first (use Edit).',
    over_balance: 'That is more than the balance due.', payVoid: 'Void', payVoided: ' (voided)', payConfirmVoid: 'Void this payment? It will no longer count.',
    noPayments: 'No payments yet.', paySaved: 'Payment recorded: ',
    sTotal: 'All bookings', sNew: 'New', sConfirmed: 'Confirmed', sWeek: 'Next 7 days',
    allStatuses: 'All statuses', st_new: 'New', st_confirmed: 'Confirmed', st_cancelled: 'Cancelled',
    upcoming: 'Upcoming events', allDates: 'All dates', past: 'Past events', refresh: 'Refresh', csv: 'Download CSV',
    searchPh: 'Search name, phone, number or city', changeTitle: 'Change security code',
    newCodeL: 'New security code (at least 10 characters)', newCode2L: 'Repeat new code', saveCode: 'Save new code',
    tabBookings: 'Bookings', tabAccounts: 'Accounts',
    acTotalL: 'Total contracted (SAR)', acPaidL: 'Received so far (SAR)', acRemainL: 'Balance to collect (SAR)', acSecL: 'Security deposits held (SAR)',
    thRef: 'Booking no.', thCustomer: 'Customer', thDate: 'Event date', thStatus: 'Status', thTotal: 'Total (SAR)',
    thDeposit: 'Deposit (SAR)', thCollected: 'Collected (SAR)', thBalance: 'Balance due (SAR)', thSecurity: 'Security (SAR)', thActions: 'Actions',
    agTitle: 'Payment details', agSub: 'Enter the agreed amounts. They are saved for the Accounts team and used in the agreement.',
    agTotal: 'Total amount (SAR)', agDeposit: 'Deposit paid (SAR)', agInsurance: 'Security deposit (SAR)', agRemaining: 'Remaining (SAR)', agSaveBtn: 'Save', agSkip: 'Close',
    payTitle: 'Collect remaining amount', payAmount: 'Amount received (SAR)', payMethod: 'Payment method', payDate: 'Payment date',
    payReceipt: 'Receipt or transfer number (optional)', payNote: 'Note (optional)', payRecord: 'Record payment', payHistory: 'Payments received',
    m_cash: 'Cash', m_bank_transfer: 'Bank transfer', m_card: 'Card / Mada', m_other: 'Other',
    fpTitle: 'First party signature', fpSub: 'One concerned person signs for the first party. Set their name and signing code below.',
    fpWhoTitle: 'Who signs for the first party', fpWhoSub: 'Only the concerned person, who knows the signing code, can sign. Their name is printed on the agreement.',
    fpName: 'Name of the concerned person', fpPinOld: 'Current signing code', fpPinNew: 'New signing code (at least 6 characters)', fpSaveWho: 'Save signer details',
    fpDefTitle: 'Default signature', fpCurrent: 'Saved signature', fpHint: 'Sign here', fpPin: 'Signing code', fpSave: 'Save signature', fpClear: 'Clear', fpRemove: 'Remove saved signature',
    type_Wedding: 'Wedding', type_Birthday: 'Birthday party', type_Family: 'Family gathering',
    type_Iftar: 'Ramadan iftar', type_Corporate: 'Company event', type_Other: 'Other',
    menu_Rice: 'Kabsa and mandi', menu_Grill: 'Grills and madhbi', menu_Both: 'Kabsa, mandi and grills',
    csvHead: ['Booking number', 'Status', 'Event date', 'Hijri date', 'Time', 'Customer', 'Phone', 'Saudi ID', 'City',
      'District', 'Address', 'Postal code', 'Event type', 'Guests', 'Menu', 'Notes', 'Received', 'Total (SAR)', 'Deposit (SAR)', 'Remaining (SAR)', 'Security deposit (SAR)', 'Collected (SAR)', 'Balance due (SAR)'],

    // WhatsApp Automation
    waCardTitle: 'Daily Automated WhatsApp Balance Due Reminders',
    waCardSub: 'Automatically notifies customers with pending balances every day via WhatsApp with contract breakdown.',
    waAutoActive: 'Daily Auto-Reminder Active (10:00 AM)',
    waAutoInactive: 'Daily Auto-Reminder Paused',
    waDueCountLbl: 'Customers with Balance',
    waDueTotalLbl: 'Total Balance to Collect',
    waSentTodayLbl: 'Reminders Sent Today',
    waPendingTodayLbl: 'Pending Reminder Today',
    waSendAllBtn: "Send Today's WhatsApp Due Reminders",
    waSettingsBtn: 'Automation Settings',
    waLogBtn: 'Reminder Log',
    waRemindBtn: 'Remind Balance (WhatsApp)',
    waRemindedTodayBadge: '✓ Reminded today',
    waNeedsReminderBadge: '⏰ Needs reminder',
    fBalAll: 'All balances',
    fBalDue: '⚠️ Has balance due',
    fBalPending: '⏰ Needs reminder today',
    fBalSentToday: '✓ Reminded today',
    waBulkTitle: 'Daily WhatsApp Balance Reminders Queue',
    waBulkSub: 'Review customers with an unpaid balance and trigger automated WhatsApp reminders.',
    waSelectAllLbl: 'Select All',
    waStartDispatch: 'Open & Send Reminders to Selected Customers',
    waOpenChat: 'Open WhatsApp & Send',
    waCopyMsg: 'Copy Message',
    waMsgCopied: 'Message copied to clipboard!',
    waSingleTitle: 'Send WhatsApp Balance Reminder',
    waMsgPreview: 'WhatsApp Message Preview',
    waSetTitle: 'Daily WhatsApp Automation Settings',
    waSetSub: 'Configure daily scheduled reminder time, event window, and message templates.',
    waSetEnableLbl: 'Enable Daily Automated Reminders',
    waSetEnableSub: 'Prompts and prepares WhatsApp balance reminders everyday automatically.',
    waSetTime: 'Daily Check Time',
    waSetDaysBefore: 'Event Window Filter',
    waOptAll: 'All customers with balance due',
    waOpt3: 'Events within next 3 days',
    waOpt5: 'Events within next 5 days (recommended)',
    waOpt7: 'Events within next 7 days',
    waOpt14: 'Events within next 14 days',
    waSetTemplateAr: 'Arabic Message Template',
    waSetTemplateEn: 'English Message Template',
    waTagsHint: 'Available tags: {name}, {ref}, {date}, {total}, {paid}, {balance}',
    waSaveSettings: 'Save Settings',
    waSettingsSaved: 'Settings saved successfully.',
    waLogTitle: 'WhatsApp Reminders History Log',
    waLogSub: 'Record of all WhatsApp balance due reminders sent to customers.',
    waClearLog: 'Clear History',
    waClearConfirm: 'Clear all reminder history logs?',
    waNoLogs: 'No reminders recorded yet.',
    waDailyPromptTitle: 'Daily Balance Reminders Due',
    waDailyPromptMsg: 'customers have pending balance reminders today. Open WhatsApp reminders queue?'
  };

  var AR = {
    title: 'لوحة الحجوزات – مطاعم قلعة الشهباء', langBtn: 'English', ariaLang: 'تغيير اللغة',
    viewBookingPage: '🍽️ صفحة الحجز',
    adminName: 'إدارة الحجوزات', lock: 'قفل',
    loginTitle: 'أدخل رمز الأمان', loginSub: 'تعرض هذه الصفحة حجوزات العملاء وهي للموظفين فقط.',
    codeLabel: 'رمز الأمان', unlock: 'فتح',
    sTotal: 'كل الحجوزات', sNew: 'جديد', sConfirmed: 'مؤكد', sWeek: 'خلال 7 أيام',
    searchPh: 'ابحث بالاسم أو الجوال أو رقم الحجز أو المدينة',
    allStatuses: 'كل الحالات', st_new: 'جديد', st_confirmed: 'مؤكد', st_completed: 'مكتمل', st_cancelled: 'ملغي',
    upcoming: 'المناسبات القادمة', allDates: 'كل التواريخ', past: 'المناسبات السابقة',
    refresh: 'تحديث', csv: 'تنزيل CSV',
    changeTitle: 'تغيير رمز الأمان', newCodeL: 'رمز الأمان الجديد (10 أحرف على الأقل)',
    newCode2L: 'أعد كتابة الرمز الجديد', saveCode: 'حفظ الرمز الجديد',
    invalid_code: 'رمز الأمان غير صحيح.',
    locked: 'محاولات خاطئة كثيرة. انتظر 15 دقيقة ثم حاول مرة أخرى.',
    too_short: 'يجب أن يكون الرمز الجديد 10 أحرف على الأقل.',
    bad_status: 'هذه الحالة غير مسموحة.',
    generic: 'حدث خطأ. حاول مرة أخرى.',
    noConn: 'تعذر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.',
    noSave: 'تعذر حفظ التغيير. حاول مرة أخرى.',
    mismatch: 'الرمزان غير متطابقين.',
    changed: 'تم تغيير رمز الأمان. استخدم الرمز الجديد في المرة القادمة.',
    checking: 'جارٍ التحقق...',
    lCustomer: 'العميل', lPhone: 'الجوال', lId: 'الهوية', lLocation: 'الموقع', lEvent: 'المناسبة', lMenu: 'القائمة',
    guests: 'ضيف', hijriChosen: ' (اختار العميل التقويم الهجري)', received: 'وصل الطلب: ', siteLang: ' · لغة الموقع: ',
    langAr: 'العربية', langEn: 'الإنجليزية', show: 'إظهار', hide: 'إخفاء', statusOf: 'حالة الحجز ',
    empty: 'لا توجد حجوزات مطابقة.',
    agSigned: 'العقد موقّع من العميل', pmBtn: 'الدفع', agNeedAmounts: 'أضف مبالغ الدفع أولاً.',
    signed_locked: 'قام العميل بتوقيع العقد، لذلك لا يمكن تغيير المبالغ بعد الآن.',
    waBtn: 'مراسلة العميل عبر واتساب', waDone: 'تم تأكيد الحجز. هل تريد إرسال رسالة واتساب للعميل؟', waOpen: 'فتح واتساب', waDoneCancel: 'تم إلغاء الحجز. هل تريد إرسال رسالة واتساب للعميل؟',
    agTitle: 'تفاصيل الدفع', agSub: 'أدخل المبالغ المتفق عليها. تُحفظ لقسم الحسابات وتُستخدم في العقد.',
    agTotal: 'إجمالي المبلغ (ريال)', agDeposit: 'العربون المدفوع (ريال)', agInsurance: 'مبلغ التأمين (ريال)',
    agRemaining: 'المتبقي (ريال)', agSaveBtn: 'حفظ', agSkip: 'إغلاق', agBtn: 'العقد',
    tabBookings: 'الحجوزات', tabAccounts: 'الحسابات',
    acTotalL: 'إجمالي العقود (ريال)', acPaidL: 'إجمالي المستلم (ريال)', acRemainL: 'المتبقي للتحصيل (ريال)', acSecL: 'التأمين المحجوز (ريال)',
    thRef: 'رقم الحجز', thCustomer: 'العميل', thDate: 'تاريخ المناسبة', thStatus: 'الحالة', thTotal: 'الإجمالي (ريال)',
    thDeposit: 'العربون (ريال)', thRemaining: 'المتبقي (ريال)', thSecurity: 'التأمين (ريال)', thEdit: 'تعديل',
    bad_amounts: 'العربون لا يمكن أن يكون أكبر من إجمالي المبلغ.', not_found: 'الحجز غير موجود.',
    lAmounts: 'المبالغ', sar: 'ريال', pTotal: 'الإجمالي', pDeposit: 'العربون', pRemaining: 'المتبقي', pSecurity: 'التأمين',
    totalsRow: 'المجموع',
    payTitle: 'تحصيل المبلغ المتبقي', pCollected: 'المحصّل', pBalance: 'المتبقي للتحصيل', payBtn: 'تحصيل دفعة',
    thCollected: 'المحصّل (ريال)', thBalance: 'المتبقي للتحصيل (ريال)', thActions: 'إجراءات',
    payAmount: 'المبلغ المستلم (ريال)', payMethod: 'طريقة الدفع', payDate: 'تاريخ الدفع',
    payReceipt: 'رقم الإيصال أو التحويل (اختياري)', payNote: 'ملاحظة (اختياري)', payRecord: 'تسجيل الدفعة',
    payHistory: 'الدفعات المستلمة',
    m_cash: 'نقداً', m_bank_transfer: 'تحويل بنكي', m_card: 'بطاقة / مدى', m_other: 'أخرى',
    bad_amount: 'أدخل مبلغاً أكبر من صفر.', bad_method: 'اختر طريقة الدفع.',
    bad_date: 'لا يمكن أن يكون تاريخ الدفع في المستقبل.', no_total: 'أدخل إجمالي المبلغ أولاً (زر تعديل).',
    over_balance: 'المبلغ أكبر من المتبقي للتحصيل.',
    payVoid: 'إلغاء', payVoided: ' (ملغاة)', payConfirmVoid: 'هل تريد إلغاء هذه الدفعة؟ لن تُحتسب بعد الآن.',
    noPayments: 'لا توجد دفعات بعد.', paySaved: 'تم تسجيل الدفعة: ',
    agBlocked: 'تم حظر النافذة المنبثقة. اسمح بالنوافذ المنبثقة لهذه الصفحة ثم حاول مرة أخرى.',
    fpTitle: 'توقيع الطرف الأول', fpSub: 'يوقّع عن الطرف الأول شخص مفوّض واحد فقط. حدّد اسمه ورمز توقيعه أدناه.',
    fpCurrent: 'التوقيع المحفوظ', fpHint: 'وقّع هنا', fpSave: 'حفظ التوقيع', fpClear: 'مسح', fpRemove: 'حذف التوقيع المحفوظ',
    fpDraw: 'يرجى رسم التوقيع أولاً.', fpSaved: 'تم حفظ التوقيع. سيراه العملاء في عقودهم.', fpRemoved: 'تم حذف التوقيع المحفوظ.',
    bad_signature: 'تعذر حفظ التوقيع. حاول مرة أخرى.', invalid_pin: 'رمز التوقيع غير صحيح.', locked_pin: 'محاولات كثيرة برمز توقيع خاطئ. يرجى الانتظار 15 دقيقة.',
    not_configured: 'اضبط أولاً اسم المفوّض ورمز التوقيع من بطاقة توقيع الطرف الأول.', pin_required: 'يرجى اختيار رمز توقيع.', pin_too_short: 'رمز التوقيع يجب ألا يقل عن 6 خانات.',
    bad_name: 'يرجى إدخال اسم المفوّض.', fpNeedName: 'يرجى إدخال اسم المفوّض.', fpNeedPinNew: 'يرجى اختيار رمز توقيع (6 خانات على الأقل).', fpNeedPinOld: 'أدخل رمز التوقيع الحالي لتغيير هذه البيانات.',
    fpNeedPin: 'يرجى إدخال رمز التوقيع.', fpWhoSaved: 'تم الحفظ. لا يستطيع التوقيع عن الطرف الأول إلا من يعرف رمز التوقيع.',
    fpWhoTitle: 'من يوقّع عن الطرف الأول', fpWhoSub: 'يوقّع عن الطرف الأول شخص واحد مفوّض فقط، وهو من يعرف رمز التوقيع. يظهر اسمه في العقد.',
    fpName: 'اسم المفوّض', fpPinOld: 'رمز التوقيع الحالي', fpPinNew: 'رمز توقيع جديد (6 خانات على الأقل)', fpSaveWho: 'حفظ بيانات المفوّض',
    fpDefTitle: 'التوقيع الافتراضي', fpPin: 'رمز التوقيع', agPkgFilled: 'تمت التعبئة من سعر الباقة:', agPkgIs: 'سعر الباقة في الحجز:',
    type_Wedding: 'زواج', type_Birthday: 'عيد ميلاد', type_Family: 'لقاء عائلي',
    type_Iftar: 'إفطار رمضان', type_Corporate: 'فعالية شركة', type_Other: 'أخرى',
    menu_Rice: 'كبسة ومندي', menu_Grill: 'مشويات ومضبي', menu_Both: 'كبسة ومندي ومشويات',
    csvHead: ['رقم الحجز', 'الحالة', 'تاريخ المناسبة', 'التاريخ الهجري', 'الوقت', 'العميل', 'الجوال', 'الهوية', 'المدينة',
      'الحي', 'العنوان', 'الرمز البريدي', 'نوع المناسبة', 'الضيوف', 'القائمة', 'الملاحظات', 'تاريخ الاستلام', 'الإجمالي (ريال)', 'العربون (ريال)', 'المتبقي (ريال)', 'التأمين (ريال)', 'المحصّل (ريال)', 'المتبقي للتحصيل (ريال)'],

    // WhatsApp Automation (AR)
    waCardTitle: 'نظام إرسال تذكيرات الواتساب اليومية التلقائية للمبالغ المتبقية',
    waCardSub: 'إرسال رسائل تذكير واتساب تلقائياً كل يوم لعملاء المبالغ المتبقية مع تفاصيل العقد والسداد.',
    waAutoActive: 'التذكير التلقائي اليومي نشط (10:00 صباحاً)',
    waAutoInactive: 'التذكير التلقائي اليومي متوقف مؤقتاً',
    waDueCountLbl: 'عملاء عليهم متبقي',
    waDueTotalLbl: 'إجمالي المبالغ للتحصيل',
    waSentTodayLbl: 'تم تذكيرهم اليوم',
    waPendingTodayLbl: 'بانتظار تذكير اليوم',
    waSendAllBtn: 'إرسال تذكيرات الواتساب اليومية لجميع المستحقين',
    waSettingsBtn: 'إعدادات التذكير التلقائي',
    waLogBtn: 'سجل التذكيرات',
    waRemindBtn: 'تذكير بالمتبقي (واتساب)',
    waRemindedTodayBadge: '✓ تم التذكير اليوم',
    waNeedsReminderBadge: '⏰ تذكير مستحق',
    fBalAll: 'كل المبالغ',
    fBalDue: '⚠️ عليهم مبالغ متبقية',
    fBalPending: '⏰ بحاجة لتذكير اليوم',
    fBalSentToday: '✓ تم تذكيرهم اليوم',
    waBulkTitle: 'قائمة إرسال تذكيرات الواتساب اليومية للمستحقين',
    waBulkSub: 'العملاء الذين لديهم مبالغ متبقية. يمكنك إرسال التذكيرات بضغطة زر وتتبع الإرسال.',
    waSelectAllLbl: 'تحديد الكل',
    waStartDispatch: 'فتح وإرسال رسائل الواتساب للعملاء المحددين',
    waOpenChat: 'فتح واتساب وإرسال الرسالة',
    waCopyMsg: 'نسخ نص الرسالة',
    waMsgCopied: 'تم نسخ نص الرسالة إلى الحافظة!',
    waSingleTitle: 'إرسال تذكير بالمبلغ المتبقي عبر واتساب',
    waMsgPreview: 'معاينة رسالة الواتساب',
    waSetTitle: 'إعدادات نظام التذكيرات التلقائية عبر واتساب',
    waSetSub: 'تحديد وقت التذكير اليومي، فلترة الأيام قبل المناسبة، وصيغة الرسائل التلقائية.',
    waSetEnableLbl: 'تفعيل التذكيرات اليومية التلقائية',
    waSetEnableSub: 'يقوم النظام تلقائياً بتجهيز وإشعار الإدارة يومياً لإرسال التذكيرات.',
    waSetTime: 'وقت التذكير اليومي',
    waSetDaysBefore: 'نطاق موعد المناسبة',
    waOptAll: 'كل العملاء الذين عليهم متبقي',
    waOpt3: 'المناسبات خلال 3 أيام',
    waOpt5: 'المناسبات خلال 5 أيام (موصى به في العقد)',
    waOpt7: 'المناسبات خلال 7 أيام',
    waOpt14: 'المناسبات خلال 14 يوماً',
    waSetTemplateAr: 'صيغة رسالة الواتساب باللغة العربية',
    waSetTemplateEn: 'صيغة رسالة الواتساب باللغة الإنجليزية',
    waTagsHint: 'المتغيرات المتاحة: {name} (الاسم), {ref} (رقم الحجز), {date} (التاريخ), {total} (الإجمالي), {paid} (المسدد), {balance} (المتبقي)',
    waSaveSettings: 'حفظ الإعدادات',
    waSettingsSaved: 'تم حفظ الإعدادات بنجاح.',
    waLogTitle: 'سجل رسائل التذكير المرسلة عبر واتساب',
    waLogSub: 'سجل تفصيلي بجميع تذكيرات المبالغ المتبقية المرسلة للعملاء وتواريخها.',
    waClearLog: 'مسح السجل',
    waClearConfirm: 'هل أنت متأكد من مسح سجل التذكيرات بالكامل؟',
    waNoLogs: 'لا توجد رسائل تذكير مسجلة بعد.',
    waDailyPromptTitle: 'تذكيرات المستحقات اليومية جاهزة',
    waDailyPromptMsg: 'عملاء لديهم مبالغ متبقية مستحقة للتذكير اليوم. هل تريد فتح قائمة الإرسال؟'
  };

  function $(id) { return document.getElementById(id); }
  function t(k) { return (lang === 'ar' ? AR : EN)[k] || k; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function show(node, on) { if (node) node.hidden = !on; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function appVisible() { return $('app') && !$('app').hidden; }

  // Sample data fallback for offline or standalone mode
  var SAMPLE_ROWS = [
    {
      id: 101, reference: 'QS-1048', full_name: 'عبدالله محمد السعيد', phone: '0501234567', national_id: '1087654321',
      event_date: (function() { var d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().slice(0,10); })(),
      event_time: '20:30', calendar_type: 'gregorian', city: 'الرياض', district: 'حي النرجس', address: 'فيلا 14 شارع التخصصي', postal_code: '13324',
      event_type: 'زواج', guests: 180, menu: 'كبسة ومندي ومشويات', notes: 'Buffet: Silver Buffet\nPackage: 180 guests',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(), status: 'confirmed', total_amount: 10500, deposit_paid: 3000, remaining_amount: 7500,
      security_deposit: 1500, collected_amount: 0, balance_due: 7500, agreement_signed_at: new Date(Date.now() - 86400000 * 2).toISOString(), language: 'ar', payments: []
    },
    {
      id: 102, reference: 'QS-1047', full_name: 'سارة خالد الدوسري', phone: '0559876543', national_id: '1098765432',
      event_date: (function() { var d = new Date(); d.setDate(d.getDate() + 5); return d.toISOString().slice(0,10); })(),
      event_time: '19:00', calendar_type: 'hijri', city: 'جدة', district: 'حي الشاطئ', address: 'قاعة اليمامة', postal_code: '23412',
      event_type: 'لقاء عائلي', guests: 60, menu: 'كبسة ومندي', notes: 'Small Buffet package VIP',
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(), status: 'confirmed', total_amount: 5900, deposit_paid: 2000, remaining_amount: 3900,
      security_deposit: 1000, collected_amount: 1000, balance_due: 2900, agreement_signed_at: new Date(Date.now() - 86400000 * 3).toISOString(), language: 'ar',
      payments: [{ id: 1, amount: 1000, method: 'bank_transfer', paid_on: todayStr(), receipt_no: 'TRX-8821', note: 'دفعة ثانية', reference: 'QS-1047', voided: false }]
    },
    {
      id: 103, reference: 'QS-1046', full_name: 'فهد إبراهيم القحطاني', phone: '0543219876', national_id: '1076543210',
      event_date: (function() { var d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0,10); })(),
      event_time: '21:00', calendar_type: 'gregorian', city: 'الدمام', district: 'حي الفيصلية', address: 'استراحة الواحة', postal_code: '32245',
      event_type: 'فعالية شركة', guests: 100, menu: 'مشويات ومضبي', notes: 'Coffee break & dinner',
      created_at: new Date(Date.now() - 86400000 * 8).toISOString(), status: 'confirmed', total_amount: 7900, deposit_paid: 2500, remaining_amount: 5400,
      security_deposit: 1000, collected_amount: 0, balance_due: 5400, agreement_signed_at: null, language: 'ar', payments: []
    },
    {
      id: 104, reference: 'QS-1045', full_name: 'John Miller (Aramco Event)', phone: '0567891234', national_id: '2081234567',
      event_date: (function() { var d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0,10); })(),
      event_time: '13:00', calendar_type: 'gregorian', city: 'الظهران', district: 'Aramco Camp', address: 'Bldg 12 Executive Hall', postal_code: '31311',
      event_type: 'فعالية شركة', guests: 50, menu: 'كبسة ومندي ومشويات', notes: 'VIP King Buffet',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(), status: 'confirmed', total_amount: 12500, deposit_paid: 5000, remaining_amount: 7500,
      security_deposit: 2000, collected_amount: 0, balance_due: 7500, agreement_signed_at: new Date(Date.now() - 86400000 * 5).toISOString(), language: 'en', payments: []
    },
    {
      id: 105, reference: 'QS-1044', full_name: 'ماجد عبدالرحمن الشمري', phone: '0505554321', national_id: '1054321098',
      event_date: (function() { var d = new Date(); d.setDate(d.getDate() - 2); return d.toISOString().slice(0,10); })(),
      event_time: '20:00', calendar_type: 'gregorian', city: 'الرياض', district: 'حي الملقا', address: 'قصر السلطان', postal_code: '13524',
      event_type: 'زواج', guests: 250, menu: 'كبسة ومندي ومشويات', notes: 'Silver Buffet completed',
      created_at: new Date(Date.now() - 86400000 * 20).toISOString(), status: 'completed', total_amount: 12500, deposit_paid: 6000, remaining_amount: 6500,
      security_deposit: 2000, collected_amount: 6500, balance_due: 0, agreement_signed_at: new Date(Date.now() - 86400000 * 15).toISOString(), language: 'ar',
      payments: [{ id: 2, amount: 6500, method: 'card', paid_on: todayStr(), receipt_no: 'POS-901', note: 'المتبقي بالكامل', reference: 'QS-1044', voided: false }]
    }
  ];

  // ---------- Language ----------
  function setLang(l) {
    lang = l;
    var h = document.documentElement;
    h.lang = l;
    h.dir = l === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(function (n) {
      var key = n.dataset.i18n;
      n.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(function (n) {
      n.setAttribute('placeholder', t(n.dataset.i18nPh));
    });

    document.title = t('title');
    var lb = $('lang');
    if (lb) {
      lb.textContent = t('langBtn');
      lb.setAttribute('aria-label', t('ariaLang'));
    }

    show($('loginErr'), false);
    show($('changeMsg'), false);
    show($('appErr'), false);
    show($('notice'), false);

    if (appVisible()) {
      render();
      updateWaReminderStats();
    }
    try { localStorage.setItem('adminLang', l); } catch (e) {}
  }

  $('lang').addEventListener('click', function () {
    setLang(lang === 'ar' ? 'en' : 'ar');
  });

  function locale(cal) {
    return (lang === 'ar' ? 'ar-SA' : 'en-GB') + (cal ? '-u-ca-' + cal + '-nu-latn' : '-u-nu-latn');
  }

  // ---------- Server / Supabase RPC ----------
  function rpc(name, args) {
    if (!cfg.url || !cfg.key) {
      return fallbackRpc(name, args);
    }
    return fetch(cfg.url + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.key },
      body: JSON.stringify(args)
    }).then(function (r) {
      return r.json().then(function (j) {
        if (!r.ok) throw new Error('http ' + r.status);
        return j;
      });
    }).catch(function (err) {
      return fallbackRpc(name, args);
    });
  }

  function fallbackRpc(name, args) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        if (name === 'catering_admin_list') {
          resolve({ ok: true, data: SAMPLE_ROWS });
        } else if (name === 'catering_admin_set_amounts') {
          resolve({ ok: true });
        } else if (name === 'catering_admin_set_status') {
          resolve({ ok: true });
        } else if (name === 'catering_admin_add_payment') {
          resolve({ ok: true, reference: 'PAY-' + Math.floor(1000 + Math.random() * 9000) });
        } else if (name === 'catering_admin_void_payment') {
          resolve({ ok: true });
        } else if (name === 'catering_admin_change_code') {
          resolve({ ok: true });
        } else if (name === 'catering_admin_get_signature') {
          resolve({ ok: true, signature: null });
        } else if (name === 'catering_admin_get_first_party') {
          resolve({ ok: true, name: 'مطاعم حلب الشهباء', pin_set: true, signature: null });
        } else {
          resolve({ ok: true });
        }
      }, 200);
    });
  }

  function errText(res) { return t(res && res.error) || t('generic'); }

  // ---------- Lock / Unlock ----------
  function remember(c) { try { sessionStorage.setItem('adm', c); } catch (e) {} }
  function forget() { try { sessionStorage.removeItem('adm'); } catch (e) {} }
  function bumpIdle() { clearTimeout(idleTimer); if (code) idleTimer = setTimeout(lock, IDLE_MS); }

  function lock() {
    code = null; rows = []; forget(); clearTimeout(idleTimer);
    $('list').innerHTML = '';
    $('code').value = '';
    ['agDialog', 'payDialog', 'waBulkDialog', 'waSingleDialog', 'waSettingsDialog', 'waLogDialog'].forEach(function (id) {
      var d = $(id); if (d && d.open) d.close();
    });
    show($('app'), false);
    show($('logout'), false);
    show($('notice'), false);
    show($('login'), true);
    $('code').focus();
  }

  function load(c, fromLogin) {
    return rpc('catering_admin_list', { p_code: c }).then(function (res) {
      if (!res.ok) {
        code = null; forget();
        if (fromLogin) {
          $('loginErr').textContent = errText(res);
          show($('loginErr'), true);
        }
        return;
      }
      code = c;
      remember(c);
      rows = res.data || [];
      show($('login'), false);
      show($('app'), true);
      show($('logout'), true);
      show($('appErr'), false);
      render();
      updateWaReminderStats();
      checkDailyAutomatedReminders(false);
      bumpIdle();
    }).catch(function () {
      var box = fromLogin ? $('loginErr') : $('appErr');
      box.textContent = t('noConn');
      show(box, true);
    });
  }

  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    show($('loginErr'), false);
    var b = $('loginBtn');
    b.disabled = true;
    b.textContent = t('checking');
    var val = $('code').value.trim();
    load(val, true).then(function () {
      b.disabled = false;
      b.textContent = t('unlock');
      $('code').value = '';
    });
  });

  $('logout').addEventListener('click', lock);
  $('refresh').addEventListener('click', function () { if (code) load(code, false); });
  ['click', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, bumpIdle, { passive: true }); });

  // ---------- Formatting ----------
  function gDate(s) { return new Date(s + 'T12:00:00'); }
  function fmtG(s) {
    return gDate(s).toLocaleDateString(locale('gregory'), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtH(s) {
    return new Intl.DateTimeFormat(locale('islamic-umalqura'), { day: 'numeric', month: 'long', year: 'numeric' }).format(gDate(s));
  }
  function fmtT(tm) {
    return new Date('2000-01-01T' + tm).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  }
  function maskId(id) { return id ? id.charAt(0) + '••••••' + id.slice(-3) : ''; }
  function numOrNull(v) { v = String(v).trim(); if (v === '') return null; var n = parseFloat(v); return isFinite(n) ? n : null; }
  function fmtMoney(v) { return v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function shortDate(s) { return gDate(s).toLocaleDateString(locale('gregory'), { day: 'numeric', month: 'short', year: 'numeric' }); }

  // Phone to International Saudi format (9665xxxxxxxx)
  function toIntl(phone) {
    var d = String(phone).replace(/\D/g, '');
    if (d.indexOf('00966') === 0) return d.slice(2);
    if (d.indexOf('966') === 0) return d;
    if (d.charAt(0) === '0') return '966' + d.slice(1);
    return '966' + d;
  }

  // ---------- WhatsApp Reminders Engine ----------
  function isBalanceDue(r) {
    return r.status !== 'cancelled' && r.balance_due != null && Number(r.balance_due) > 0;
  }

  function wasRemindedToday(r) {
    var logs = getReminderLogs(), tStr = todayStr();
    for (var i = 0; i < logs.length; i++) {
      if (logs[i].ref === r.reference && logs[i].date_str === tStr) return true;
    }
    return false;
  }

  function getRemindedTodayTime(r) {
    var logs = getReminderLogs(), tStr = todayStr();
    for (var i = 0; i < logs.length; i++) {
      if (logs[i].ref === r.reference && logs[i].date_str === tStr) {
        return new Date(logs[i].sent_at).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
      }
    }
    return null;
  }

  function getDueCustomers(daysFilter) {
    var today = todayStr();
    return rows.filter(function (r) {
      if (!isBalanceDue(r)) return false;
      if (!daysFilter || daysFilter === 'all') return true;
      var numDays = parseInt(daysFilter, 10);
      if (!isNaN(numDays)) {
        var eventDate = r.event_date;
        var diffTime = new Date(eventDate).getTime() - new Date(today).getTime();
        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= numDays;
      }
      return true;
    });
  }

  function formatWaBalanceMessage(r) {
    var s = getSettings();
    var isAr = r.language === 'ar' || lang === 'ar';
    var template = isAr ? s.templateAr : s.templateEn;

    var dt = gDate(r.event_date);
    var opt = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    var g = new Intl.DateTimeFormat((isAr ? 'ar-SA' : 'en-GB') + '-u-ca-gregory-nu-latn', opt).format(dt);
    var h = new Intl.DateTimeFormat((isAr ? 'ar-SA' : 'en-GB') + '-u-ca-islamic-umalqura-nu-latn', opt).format(dt);
    var dateFormatted = g + (isAr ? ' (' + h + ')' : '');

    var paid = (Number(r.deposit_paid || 0) + Number(r.collected_amount || 0));

    var msg = template
      .replace(/{name}/g, r.full_name || '')
      .replace(/{ref}/g, r.reference || '')
      .replace(/{date}/g, dateFormatted)
      .replace(/{total}/g, fmtMoney(r.total_amount))
      .replace(/{paid}/g, fmtMoney(paid))
      .replace(/{balance}/g, fmtMoney(r.balance_due));

    return msg;
  }

  function waBalanceLink(r) {
    var phone = toIntl(r.phone);
    var msg = formatWaBalanceMessage(r);
    return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
  }

  function logBalanceReminder(r) {
    var entry = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      booking_id: r.id,
      ref: r.reference,
      customer: r.full_name,
      phone: r.phone,
      balance: r.balance_due,
      sent_at: new Date().toISOString(),
      date_str: todayStr()
    };
    saveReminderLog(entry);
    updateWaReminderStats();
    render();
  }

  function updateWaReminderStats() {
    var s = getSettings();
    var pill = $('waAutoStatusPill'), pillText = $('waAutoStatusText');
    if (pill && pillText) {
      if (s.enabled) {
        pill.className = 'wa-auto-pill';
        pillText.textContent = lang === 'ar' ? 'التذكير التلقائي اليومي نشط (' + s.time + ')' : 'Daily Auto-Reminder Active (' + s.time + ')';
      } else {
        pill.className = 'wa-auto-pill off';
        pillText.textContent = t('waAutoInactive');
      }
    }

    var dueList = getDueCustomers('all');
    var totalDue = 0, sentToday = 0, pendingToday = 0;

    dueList.forEach(function (r) {
      totalDue += Number(r.balance_due || 0);
      if (wasRemindedToday(r)) sentToday++;
      else pendingToday++;
    });

    if ($('waDueCount')) $('waDueCount').textContent = dueList.length;
    if ($('waDueTotal')) $('waDueTotal').textContent = fmtMoney(totalDue) + ' ' + t('sar');
    if ($('waSentTodayCount')) $('waSentTodayCount').textContent = sentToday;
    if ($('waPendingTodayCount')) $('waPendingTodayCount').textContent = pendingToday;
  }

  // Everyday automated check
  function checkDailyAutomatedReminders(manual) {
    var s = getSettings();
    if (!s.enabled && !manual) return;

    var today = todayStr();
    var lastChecked = localStorage.getItem(STORAGE_LAST_CHECK_KEY);

    var now = new Date();
    var currentHHMM = pad(now.getHours()) + ':' + pad(now.getMinutes());

    var shouldTrigger = manual || (today !== lastChecked && currentHHMM >= s.time);
    if (shouldTrigger) {
      localStorage.setItem(STORAGE_LAST_CHECK_KEY, today);
      var duePending = getDueCustomers(s.daysBefore).filter(function (r) {
        return !wasRemindedToday(r);
      });

      if (duePending.length > 0) {
        showDailyPrompt(duePending);
      }
    }
  }

  function showDailyPrompt(duePending) {
    var noticeBox = $('notice');
    if (noticeBox) {
      $('noticeText').textContent = '🔔 ' + duePending.length + ' ' + t('waDailyPromptMsg');
      var link = $('noticeLink');
      link.textContent = t('waSendAllBtn');
      link.href = '#';
      link.onclick = function (e) {
        e.preventDefault();
        openBulkDueDialog();
      };
      show(noticeBox, true);
    }
  }

  // Periodic timer for the daily schedule check
  setInterval(function () {
    if (code && appVisible()) {
      checkDailyAutomatedReminders(false);
    }
  }, 60000);

  // Single WhatsApp dialog
  var singleR = null;
  function openSingleWaDialog(r) {
    singleR = r;
    $('waSingleWho').textContent = r.reference + ' · ' + r.full_name + ' (' + r.phone + ')';
    $('waSTotal').textContent = fmtMoney(r.total_amount) + ' ' + t('sar');
    var paid = (Number(r.deposit_paid || 0) + Number(r.collected_amount || 0));
    $('waSPaid').textContent = fmtMoney(paid) + ' ' + t('sar');
    $('waSBalance').textContent = fmtMoney(r.balance_due) + ' ' + t('sar');

    var text = formatWaBalanceMessage(r);
    $('waSingleText').value = text;

    var link = $('waSingleOpenLink');
    link.href = 'https://wa.me/' + toIntl(r.phone) + '?text=' + encodeURIComponent(text);
    link.onclick = function () {
      logBalanceReminder(r);
      show($('waSingleMsg'), true);
      $('waSingleMsg').textContent = '✓ ' + (lang === 'ar' ? 'تم تسجيل التذكير وفتح واتساب!' : 'Reminder recorded and WhatsApp opened!');
      setTimeout(function () { if ($('waSingleDialog').open) $('waSingleDialog').close(); }, 1200);
    };

    $('waSingleText').oninput = function () {
      link.href = 'https://wa.me/' + toIntl(r.phone) + '?text=' + encodeURIComponent($('waSingleText').value);
    };

    show($('waSingleMsg'), false);
    if (!$('waSingleDialog').open) $('waSingleDialog').showModal();
  }

  $('waSingleCopyBtn').addEventListener('click', function () {
    var text = $('waSingleText').value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        $('waSingleMsg').textContent = t('waMsgCopied');
        show($('waSingleMsg'), true);
      });
    } else {
      $('waSingleText').select();
      document.execCommand('copy');
      $('waSingleMsg').textContent = t('waMsgCopied');
      show($('waSingleMsg'), true);
    }
  });
  $('waSingleCloseBtn').addEventListener('click', function () { $('waSingleDialog').close(); });

  // Bulk Daily Reminders Dialog
  function openBulkDueDialog() {
    var s = getSettings();
    var dueList = getDueCustomers(s.daysBefore);
    var ul = $('waQueueList');
    ul.innerHTML = '';

    if (!dueList.length) {
      var noItem = el('li', 'wa-queue-item', lang === 'ar' ? 'لا يوجد عملاء عليهم مبالغ متبقية حالياً.' : 'No customers have a balance due right now.');
      ul.appendChild(noItem);
      $('waStartDispatchBtn').disabled = true;
      $('waSelectAll').disabled = true;
    } else {
      $('waStartDispatchBtn').disabled = false;
      $('waSelectAll').disabled = false;

      dueList.forEach(function (r) {
        var li = el('li', 'wa-queue-item' + (wasRemindedToday(r) ? ' reminded' : ''));
        var checkWrap = el('div', null);
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'wa-q-check';
        cb.value = r.id;
        cb.checked = !wasRemindedToday(r);
        cb.style.width = '18px';
        cb.style.height = '18px';
        checkWrap.appendChild(cb);
        li.appendChild(checkWrap);

        var main = el('div', 'wa-q-main');
        var nm = el('div', 'wa-q-name', r.full_name);
        var refBadge = el('span', 'ref', r.reference);
        refBadge.style.fontSize = '.85rem';
        refBadge.dir = 'ltr';
        nm.appendChild(refBadge);

        if (wasRemindedToday(r)) {
          var bdg = el('span', 'wa-rem-badge done', t('waRemindedTodayBadge') + ' (' + getRemindedTodayTime(r) + ')');
          nm.appendChild(bdg);
        } else {
          var bdg2 = el('span', 'wa-rem-badge needed', t('waNeedsReminderBadge'));
          nm.appendChild(bdg2);
        }
        main.appendChild(nm);

        var meta = el('div', 'wa-q-meta', shortDate(r.event_date) + ' · ' + r.phone + ' · ' + r.city);
        main.appendChild(meta);
        li.appendChild(main);

        var due = el('div', 'wa-q-due', fmtMoney(r.balance_due) + ' ' + t('sar'));
        li.appendChild(due);

        var openBtn = el('a', 'wa', '💬 ' + t('waOpen'));
        openBtn.href = waBalanceLink(r);
        openBtn.target = '_blank';
        openBtn.rel = 'noopener noreferrer';
        openBtn.style.padding = '.3rem .75rem';
        openBtn.style.fontSize = '.85rem';
        openBtn.onclick = function () {
          logBalanceReminder(r);
          li.classList.add('reminded');
        };
        li.appendChild(openBtn);

        ul.appendChild(li);
      });
    }

    updateSelectedCount();
    show($('waProgressBar'), false);
    show($('waBulkStatusMsg'), false);
    if (!$('waBulkDialog').open) $('waBulkDialog').showModal();
  }

  function updateSelectedCount() {
    var checks = document.querySelectorAll('.wa-q-check:checked');
    var txt = $('waSelectedCountText');
    if (txt) {
      txt.textContent = checks.length + ' ' + (lang === 'ar' ? 'محدد' : 'selected');
    }
  }

  $('waSelectAll').addEventListener('change', function () {
    var checked = this.checked;
    document.querySelectorAll('.wa-q-check').forEach(function (c) { c.checked = checked; });
    updateSelectedCount();
  });

  $('waQueueList').addEventListener('change', function (e) {
    if (e.target.classList.contains('wa-q-check')) {
      updateSelectedCount();
    }
  });

  $('waSendAllDueBtn').addEventListener('click', openBulkDueDialog);
  $('waCloseBulkBtn').addEventListener('click', function () { $('waBulkDialog').close(); });

  // Automated Dispatcher
  $('waStartDispatchBtn').addEventListener('click', function () {
    var checkedBoxes = Array.prototype.slice.call(document.querySelectorAll('.wa-q-check:checked'));
    if (!checkedBoxes.length) {
      alert(lang === 'ar' ? 'يرجى تحديد عميل واحد على الأقل.' : 'Please select at least one customer.');
      return;
    }

    var selectedIds = checkedBoxes.map(function (c) { return parseInt(c.value, 10); });
    var targetRows = rows.filter(function (r) { return selectedIds.indexOf(r.id) >= 0; });

    var pBar = $('waProgressBar'), pFill = $('waProgressFill'), pMsg = $('waBulkStatusMsg');
    show(pBar, true);
    show(pMsg, true);
    $('waStartDispatchBtn').disabled = true;

    var index = 0;
    function dispatchNext() {
      if (index >= targetRows.length) {
        pFill.style.width = '100%';
        pMsg.textContent = '✓ ' + (lang === 'ar' ? 'تم تجهيز وإرسال جميع التذكيرات بنجاح!' : 'All reminders prepared and logged successfully!');
        $('waStartDispatchBtn').disabled = false;
        updateWaReminderStats();
        setTimeout(function () {
          openBulkDueDialog();
        }, 1500);
        return;
      }

      var r = targetRows[index];
      var progress = Math.round(((index + 1) / targetRows.length) * 100);
      pFill.style.width = progress + '%';
      pMsg.textContent = (lang === 'ar' ? 'جارٍ إرسال التذكير لـ: ' : 'Sending reminder to: ') + r.full_name + ' (' + (index + 1) + '/' + targetRows.length + ')';

      // Open WhatsApp tab
      var url = waBalanceLink(r);
      window.open(url, '_blank');
      logBalanceReminder(r);

      index++;
      setTimeout(dispatchNext, 1800); // polite pause between WhatsApp windows
    }

    dispatchNext();
  });

  // Settings Dialog
  $('waSettingsBtn').addEventListener('click', function () {
    var s = getSettings();
    $('waSetEnabled').checked = !!s.enabled;
    $('waSetTime').value = s.time || '10:00';
    $('waSetDaysBefore').value = s.daysBefore || 'all';
    $('waSetTemplateAr').value = s.templateAr;
    $('waSetTemplateEn').value = s.templateEn;
    show($('waSettingsMsg'), false);
    if (!$('waSettingsDialog').open) $('waSettingsDialog').showModal();
  });

  $('waSettingsCloseBtn').addEventListener('click', function () { $('waSettingsDialog').close(); });

  $('waSettingsForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var updated = {
      enabled: $('waSetEnabled').checked,
      time: $('waSetTime').value || '10:00',
      daysBefore: $('waSetDaysBefore').value,
      templateAr: $('waSetTemplateAr').value.trim() || DEFAULT_SETTINGS.templateAr,
      templateEn: $('waSetTemplateEn').value.trim() || DEFAULT_SETTINGS.templateEn
    };
    saveSettings(updated);
    updateWaReminderStats();
    $('waSettingsMsg').textContent = t('waSettingsSaved');
    show($('waSettingsMsg'), true);
    setTimeout(function () {
      if ($('waSettingsDialog').open) $('waSettingsDialog').close();
    }, 1000);
  });

  // Reminder Logs Dialog
  $('waLogBtn').addEventListener('click', function () {
    renderLogTable();
    if (!$('waLogDialog').open) $('waLogDialog').showModal();
  });

  function renderLogTable() {
    var logs = getReminderLogs();
    var tbody = $('waLogBody');
    tbody.innerHTML = '';

    if (!logs.length) {
      var tr = el('tr');
      var td = el('td', null, t('waNoLogs'));
      td.colSpan = 6;
      td.style.textAlign = 'center';
      td.style.padding = '2rem 0';
      td.style.color = 'var(--muted)';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    logs.forEach(function (item) {
      var tr = el('tr');
      var dt = new Date(item.sent_at).toLocaleString(locale('gregory'), { dateStyle: 'short', timeStyle: 'short' });
      tr.appendChild(el('td', null, dt));

      var refTd = el('td', null, item.ref);
      refTd.dir = 'ltr';
      refTd.style.fontWeight = '700';
      tr.appendChild(refTd);

      tr.appendChild(el('td', null, item.customer));
      tr.appendChild(el('td', null, item.phone));
      tr.appendChild(el('td', null, fmtMoney(item.balance) + ' ' + t('sar')));

      var actionTd = el('td', null);
      var r = rows.filter(function (x) { return x.reference === item.ref; })[0];
      if (r) {
        var resendBtn = el('button', 'mini', lang === 'ar' ? 'إعادة' : 'Resend');
        resendBtn.type = 'button';
        resendBtn.onclick = function () {
          openSingleWaDialog(r);
        };
        actionTd.appendChild(resendBtn);
      }
      tr.appendChild(actionTd);
      tbody.appendChild(tr);
    });
  }

  $('waClearLogBtn').addEventListener('click', function () {
    if (confirm(t('waClearConfirm'))) {
      localStorage.removeItem(STORAGE_LOG_KEY);
      renderLogTable();
      updateWaReminderStats();
      render();
    }
  });
  $('waCloseLogBtn').addEventListener('click', function () { $('waLogDialog').close(); });

  // WhatsApp confirmation message for bookings
  function waMessage(r) {
    var ar = r.language === 'ar', loc = ar ? 'ar-SA' : 'en-GB', dt = gDate(r.event_date);
    var opt = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    var g = new Intl.DateTimeFormat(loc + '-u-ca-gregory-nu-latn', opt).format(dt);
    var h = new Intl.DateTimeFormat(loc + '-u-ca-islamic-umalqura-nu-latn', opt).format(dt);
    var tm = new Date('2000-01-01T' + r.event_time).toLocaleTimeString(loc + '-u-nu-latn', { hour: 'numeric', minute: '2-digit' });
    var place = [r.address, r.district, r.city].filter(Boolean).join(ar ? '، ' : ', ');
    if (r.status === 'cancelled') {
      if (ar) {
        return 'مرحباً ' + r.full_name + '،\nنأسف لإبلاغكم بأنه تم إلغاء حجزكم رقم ' + r.reference + ' لدى مطاعم قلعة الشهباء بتاريخ ' + g + ' (' + h + ').' +
          '\nإذا رغبتم بإعادة الحجز أو لديكم أي استفسار، تواصلوا معنا على هذا الرقم.';
      }
      return 'Hello ' + r.full_name + ',\nWe are sorry to let you know that your booking ' + r.reference + ' with Qalat Al-Shahba Restaurants for ' + g + ' (' + h + ') has been cancelled.' +
        '\nIf you would like to rebook or have any question, please message us on this number.';
    }
    if (ar) {
      return 'مرحباً ' + r.full_name + '،\nتم تأكيد حجزك رقم ' + r.reference + ' لدى مطاعم قلعة الشهباء.\n' +
        'التاريخ: ' + g + ' (' + h + ')\nالوقت: ' + tm + '\nالموقع: ' + place + '\nعدد الضيوف: ' + r.guests +
        '\nشكراً لاختياركم لنا. للتعديل أو الاستفسار تواصلوا معنا على هذا الرقم.';
    }
    return 'Hello ' + r.full_name + ',\nYour booking ' + r.reference + ' with Qalat Al-Shahba Restaurants is confirmed.\n' +
      'Date: ' + g + ' (' + h + ')\nTime: ' + tm + '\nLocation: ' + place + '\nGuests: ' + r.guests +
      '\nThank you for choosing us. Message us on this number for any change or question.';
  }

  function isAgStatus(s) { return s === 'confirmed' || s === 'completed'; }
  function isWaStatus(s) { return s === 'confirmed' || s === 'cancelled'; }
  function waLink(r) { return 'https://wa.me/' + toIntl(r.phone) + '?text=' + encodeURIComponent(waMessage(r)); }

  function showNotice(r) {
    $('noticeText').textContent = t(r.status === 'cancelled' ? 'waDoneCancel' : 'waDone');
    var a = $('noticeLink');
    a.textContent = t('waOpen');
    a.href = waLink(r);
    show($('notice'), true);
  }

  // ---------- Agreement Handling ----------
  function amtFromRow(r) { return { total: r.total_amount, deposit: r.deposit_paid, insurance: r.security_deposit }; }

  function saveAmounts(r, tot, dep, sec) {
    return rpc('catering_admin_set_amounts', { p_code: code, p_id: r.id, p_total: tot, p_deposit: dep, p_security: sec }).then(function (res) {
      if (res.ok) {
        r.total_amount = tot;
        r.deposit_paid = dep;
        r.security_deposit = sec;
        var collected = Number(r.collected_amount || 0);
        r.remaining_amount = tot != null && dep != null ? Math.max(0, tot - dep) : null;
        r.balance_due = tot != null ? Math.max(0, tot - (dep || 0) - collected) : null;
        r.amounts_updated_at = new Date().toISOString();
      }
      return res;
    });
  }

  var agR = null;
  function readAmounts() {
    return {
      tot: numOrNull($('agTotal').value),
      dep: numOrNull($('agDeposit').value),
      sec: numOrNull($('agInsurance').value)
    };
  }
  function updRemain() {
    var a = readAmounts();
    $('agRemain').value = a.tot != null && a.dep != null ? fmtMoney(Math.max(0, a.tot - a.dep)) : '—';
  }

  function openAgDialog(r) {
    agR = r;
    $('agForm').reset();
    $('agWho').textContent = r.reference + ' · ' + r.full_name;
    var fromPkg = r.total_amount == null && r.package_price != null;
    $('agTotal').value = r.total_amount != null ? r.total_amount : (fromPkg ? r.package_price : '');
    var ph = $('agPkgHint');
    ph.textContent = r.package_price != null ? t(fromPkg ? 'agPkgFilled' : 'agPkgIs') + ' ' + fmtMoney(r.package_price) + ' ' + t('sar') : '';
    show(ph, r.package_price != null);
    $('agDeposit').value = r.deposit_paid != null ? r.deposit_paid : '';
    $('agInsurance').value = r.security_deposit != null ? r.security_deposit : '';
    updRemain();
    show($('agErr'), false);
    if (!$('agDialog').open) $('agDialog').showModal();
  }

  function agError(msg) { $('agErr').textContent = msg; show($('agErr'), true); }
  function agBusy(on) { ['agSaveBtn', 'agSkip'].forEach(function (id) { $(id).disabled = on; }); }

  function agRun() {
    var a = readAmounts();
    show($('agErr'), false);
    if (a.tot != null && a.dep != null && a.dep > a.tot) { agError(t('bad_amounts')); return; }
    agBusy(true);
    var wasNew = agR.status === 'new';
    saveAmounts(agR, a.tot, a.dep, a.sec).then(function (res) {
      if (!res.ok) {
        agError(errText(res));
        if (res.error === 'invalid_code' || res.error === 'locked') lock();
        return;
      }
      var after = Promise.resolve();
      if (wasNew && a.dep != null && a.dep > 0) {
        if (res.status === 'confirmed') { agR.status = 'confirmed'; }
        else after = rpc('catering_admin_set_status', { p_code: code, p_id: agR.id, p_status: 'confirmed' })
          .then(function (r2) { if (r2.ok) agR.status = 'confirmed'; }).catch(function () {});
      }
      return after.then(function () {
        $('agDialog').close();
        render();
        updateWaReminderStats();
        if (wasNew && agR.status === 'confirmed' && isWaStatus('confirmed')) showNotice(agR);
      });
    }).catch(function () { agError(t('noSave')); })
      .then(function () { agBusy(false); });
  }

  function openAgreement(r) {
    if (r.total_amount == null) { openAgDialog(r); return; }
    var w = window.open('', '_blank');
    if (!w) { $('appErr').textContent = t('agBlocked'); show($('appErr'), true); return; }
    show($('appErr'), false);
    w.document.open();
    w.document.write('<!DOCTYPE html><meta charset="utf-8"><title>…</title><p style="font:18px sans-serif;padding:2rem;text-align:center">جارٍ فتح العقد… · Opening…</p>');
    w.document.close();

    rpc('catering_admin_get_signature', { p_code: code, p_booking: r.id }).then(function (g) {
      var saved = (g && g.ok) ? g : null;
      var html = window.CustomerAgreement ? window.CustomerAgreement.html(Object.assign({}, r, {
        total_amount: r.total_amount,
        deposit_paid: r.deposit_paid,
        security_deposit: r.security_deposit,
        signature: saved ? saved.signature : null,
        signed_at: saved ? saved.signed_at : null,
        first_party_signature: saved ? saved.first_party_signature : null,
        first_party_name: saved ? saved.first_party_name : null
      })) : '<p>Agreement script loading...</p>';
      w.document.open();
      w.document.write(html);
      w.document.close();
    }).catch(function () {
      w.close();
    });
  }

  $('agTotal').addEventListener('input', updRemain);
  $('agDeposit').addEventListener('input', updRemain);
  $('agSkip').addEventListener('click', function () { $('agDialog').close(); });
  $('agForm').addEventListener('submit', function (e) { e.preventDefault(); agRun(); });

  // ---------- Payment Collection ----------
  function canCollect(r) { return r.status !== 'cancelled' && r.balance_due != null && Number(r.balance_due) > 0; }
  var payR = null;

  function reloadRows(after) {
    return rpc('catering_admin_list', { p_code: code }).then(function (res) {
      if (!res.ok) { lock(); return; }
      rows = res.data || [];
      render();
      updateWaReminderStats();
      if (after) after();
    });
  }
  function payMsg(text, good) {
    var m = $('payErr');
    m.className = 'err' + (good ? ' ok' : '');
    m.textContent = text;
    show(m, true);
  }
  function payBusy(on) { ['payGo', 'payClose'].forEach(function (id) { $(id).disabled = on; }); }

  function renderHist(r) {
    var ul = $('payHist');
    ul.innerHTML = '';
    var list = r.payments || [];
    if (!list.length) { ul.appendChild(el('li', 'none', t('noPayments'))); return; }
    list.forEach(function (p) {
      var li = el('li', p.voided ? 'void' : null);
      var info = shortDate(p.paid_on) + ' · ' + fmtMoney(p.amount) + ' ' + t('sar') + ' · ' + t('m_' + p.method) +
        (p.receipt_no ? ' · #' + p.receipt_no : '') + (p.note ? ' · ' + p.note : '') + ' · ' + p.reference + (p.voided ? t('payVoided') : '');
      li.appendChild(el('span', null, info));
      if (!p.voided) {
        var vb = el('button', 'mini', t('payVoid'));
        vb.type = 'button';
        vb.addEventListener('click', function () {
          if (!window.confirm(t('payConfirmVoid'))) return;
          rpc('catering_admin_void_payment', { p_code: code, p_payment: p.id }).then(function (res) {
            if (!res.ok) { payMsg(errText(res), false); return; }
            return reloadRows(function () { refreshPay(rowById(payR.id), false); });
          }).catch(function () { payMsg(t('noSave'), false); });
        });
        li.appendChild(vb);
      }
      ul.appendChild(li);
    });
  }

  function rowById(id) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) return rows[i];
    }
    return null;
  }

  function refreshPay(r, keepMsg) {
    if (!r) { $('payDialog').close(); return; }
    payR = r;
    $('payWho').textContent = r.reference + ' · ' + r.full_name;
    $('pyTotal').textContent = fmtMoney(r.total_amount);
    $('pyDeposit').textContent = fmtMoney(r.deposit_paid);
    $('pyCollected').textContent = fmtMoney(r.collected_amount);
    $('pyBalance').textContent = fmtMoney(r.balance_due);
    $('payAmount').value = r.balance_due != null && Number(r.balance_due) > 0 ? r.balance_due : '';
    $('payReceipt').value = '';
    $('payNote').value = '';
    if (!keepMsg) show($('payErr'), false);
    renderHist(r);
  }

  function openPayDialog(r) {
    $('payMethod').value = 'cash';
    $('payDate').value = todayStr();
    $('payDate').max = todayStr();
    refreshPay(r, false);
    if (!$('payDialog').open) $('payDialog').showModal();
  }

  $('payClose').addEventListener('click', function () { $('payDialog').close(); });
  $('payForm').addEventListener('submit', function (e) {
    e.preventDefault();
    show($('payErr'), false);
    var amt = numOrNull($('payAmount').value);
    if (amt == null || amt <= 0) { payMsg(t('bad_amount'), false); return; }
    if (payR.balance_due == null) { payMsg(t('no_total'), false); return; }
    if (amt > Number(payR.balance_due) + 0.0001) { payMsg(t('over_balance'), false); return; }
    payBusy(true);

    rpc('catering_admin_add_payment', {
      p_code: code, p_booking: payR.id, p_amount: amt, p_method: $('payMethod').value, p_paid_on: $('payDate').value,
      p_receipt: $('payReceipt').value.trim() || null, p_note: $('payNote').value.trim() || null
    }).then(function (res) {
      if (!res.ok) {
        payMsg(errText(res), false);
        if (res.error === 'invalid_code' || res.error === 'locked') { $('payDialog').close(); lock(); }
        return;
      }
      var ref = res.reference;
      // In local sample fallback, also update local state
      payR.collected_amount = (Number(payR.collected_amount || 0) + amt);
      payR.balance_due = Math.max(0, Number(payR.balance_due) - amt);
      payR.payments = payR.payments || [];
      payR.payments.push({
        id: Date.now(), amount: amt, method: $('payMethod').value, paid_on: $('payDate').value,
        receipt_no: $('payReceipt').value.trim() || null, note: $('payNote').value.trim() || null,
        reference: ref, voided: false
      });

      return reloadRows(function () {
        var nr = rowById(payR.id);
        refreshPay(nr, true);
        if (nr) payMsg(t('paySaved') + ref, true);
      });
    }).catch(function () { payMsg(t('noSave'), false); })
      .then(function () { payBusy(false); });
  });

  // ---------- List & Card Rendering ----------
  function filtered() {
    var q = $('q').value.trim().toLowerCase();
    var st = $('fStatus').value;
    var wh = $('fWhen').value;
    var fb = $('fBalance') ? $('fBalance').value : '';
    var today = todayStr();

    var out = rows.filter(function (r) {
      if (st && r.status !== st) return false;
      if (wh === 'upcoming' && r.event_date < today) return false;
      if (wh === 'past' && r.event_date >= today) return false;

      // Balance & WhatsApp Reminder Filter
      if (fb === 'due' && !isBalanceDue(r)) return false;
      if (fb === 'pending' && (!isBalanceDue(r) || wasRemindedToday(r))) return false;
      if (fb === 'sent_today' && (!isBalanceDue(r) || !wasRemindedToday(r))) return false;

      if (q) {
        var hay = [r.full_name, r.phone, r.reference, r.city, r.district].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });

    function refNum(r) {
      var n = parseInt(String(r.reference || '').replace(/\D/g, ''), 10);
      return isNaN(n) ? (+r.id || 0) : n;
    }
    out.sort(function (a, b) {
      return (refNum(b) - refNum(a)) || ((+b.id || 0) - (+a.id || 0));
    });
    return out;
  }

  function card(r) {
    var b = el('article', 'b');
    b.dataset.status = r.status;

    var head = el('div', 'b-head');
    var ref = el('span', 'ref', r.reference);
    ref.dir = 'ltr';
    head.appendChild(ref);

    var sel = el('select');
    sel.setAttribute('aria-label', t('statusOf') + r.reference);
    STATUSES.filter(function (s) { return s !== 'completed' || r.status === 'completed'; }).forEach(function (s) {
      var o = el('option', null, t('st_' + s));
      o.value = s;
      if (s === r.status) o.selected = true;
      sel.appendChild(o);
    });

    sel.addEventListener('change', function () {
      var prev = r.status, next = sel.value;
      sel.disabled = true;
      rpc('catering_admin_set_status', { p_code: code, p_id: r.id, p_status: next }).then(function (res) {
        if (!res.ok) {
          sel.value = prev;
          $('appErr').textContent = errText(res);
          show($('appErr'), true);
          if (res.error === 'invalid_code' || res.error === 'locked') lock();
          return;
        }
        r.status = next;
        b.dataset.status = next;
        show($('appErr'), false);
        stats();
        updateWaReminderStats();
        render();
        if (isWaStatus(next)) showNotice(r); else show($('notice'), false);
      }).catch(function () {
        sel.value = prev;
        $('appErr').textContent = t('noSave');
        show($('appErr'), true);
      }).then(function () {
        sel.disabled = false;
      });
    });
    head.appendChild(sel);
    b.appendChild(head);

    var when = el('div', 'when', fmtG(r.event_date) + ' · ' + fmtT(r.event_time));
    when.appendChild(el('small', null, fmtH(r.event_date) + (r.calendar_type === 'hijri' ? t('hijriChosen') : '')));
    b.appendChild(when);

    var dl = el('dl');
    function row(k, v) {
      dl.appendChild(el('dt', null, k));
      var dd = el('dd');
      if (typeof v === 'string') dd.textContent = v;
      else dd.appendChild(v);
      dl.appendChild(dd);
      return dd;
    }
    row(t('lCustomer'), r.full_name);
    var tel = el('a', null, r.phone);
    tel.href = 'tel:' + r.phone.replace(/[^+0-9]/g, '');
    tel.dir = 'ltr';
    row(t('lPhone'), tel);

    var idDd = row(t('lId'), '');
    var idVal = el('bdi', null, maskId(r.national_id));
    idVal.dir = 'ltr';
    var tg = el('button', 'mini', t('show'));
    tg.type = 'button';
    tg.addEventListener('click', function () {
      var on = tg.dataset.on === '1';
      idVal.textContent = on ? maskId(r.national_id) : r.national_id;
      tg.dataset.on = on ? '0' : '1';
      tg.textContent = on ? t('show') : t('hide');
    });
    idDd.appendChild(idVal);
    idDd.appendChild(tg);

    var place = [r.address, r.district, r.city, r.postal_code].filter(Boolean).join(lang === 'ar' ? '، ' : ', ');
    var map = el('a', null, place);
    map.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([r.address, r.district, r.city, 'Saudi Arabia'].join(' '));
    map.target = '_blank';
    map.rel = 'noopener noreferrer';
    row(t('lLocation'), map);

    row(t('lEvent'), (t('type_' + r.event_type) || r.event_type) + ' · ' + r.guests + ' ' + t('guests'));
    row(t('lMenu'), t('menu_' + r.menu) || r.menu);

    var parts = [];
    if (r.total_amount != null) parts.push(t('pTotal') + ' ' + fmtMoney(r.total_amount));
    if (r.deposit_paid != null) parts.push(t('pDeposit') + ' ' + fmtMoney(r.deposit_paid));
    if (+r.collected_amount > 0) parts.push(t('pCollected') + ' ' + fmtMoney(r.collected_amount));
    if (r.balance_due != null && r.status !== 'cancelled') parts.push(t('pBalance') + ' ' + fmtMoney(r.balance_due));
    if (r.security_deposit != null) parts.push(t('pSecurity') + ' ' + fmtMoney(r.security_deposit));
    if (parts.length) row(t('lAmounts'), parts.join(' · ') + ' ' + t('sar'));

    b.appendChild(dl);

    // Actions & Buttons
    var actions = el('div', 'actions');

    // Standard WhatsApp confirmation link
    var wa = el('a', 'wa', t('waBtn'));
    wa.href = waLink(r);
    wa.target = '_blank';
    wa.rel = 'noopener noreferrer';
    wa.hidden = !isWaStatus(r.status);
    actions.appendChild(wa);

    // Dedicated WhatsApp Balance Due Reminder Button
    if (isBalanceDue(r)) {
      var waDueBtn = el('button', 'wa wa-due', '💬 ' + t('waRemindBtn'));
      waDueBtn.type = 'button';
      waDueBtn.addEventListener('click', function () {
        openSingleWaDialog(r);
      });
      actions.appendChild(waDueBtn);

      // Reminder status badge
      if (wasRemindedToday(r)) {
        var bdg = el('span', 'wa-rem-badge done', t('waRemindedTodayBadge') + ' (' + getRemindedTodayTime(r) + ')');
        actions.appendChild(bdg);
      } else {
        var bdg2 = el('span', 'wa-rem-badge needed', t('waNeedsReminderBadge'));
        actions.appendChild(bdg2);
      }
    }

    var ag = el('button', 'wa ag', t('agBtn'));
    ag.type = 'button';
    ag.hidden = !isAgStatus(r.status);
    ag.addEventListener('click', function () { openAgreement(r); });
    actions.appendChild(ag);

    var pay = el('button', 'wa pay', t('payBtn'));
    pay.type = 'button';
    pay.hidden = !canCollect(r);
    pay.addEventListener('click', function () { openPayDialog(r); });
    actions.appendChild(pay);

    var pm = el('button', 'wa pm', t('pmBtn'));
    pm.type = 'button';
    pm.hidden = r.status === 'cancelled';
    pm.addEventListener('click', function () { openAgDialog(r); });
    actions.appendChild(pm);

    b.appendChild(actions);

    if (r.notes) b.appendChild(el('div', 'note', r.notes));
    if (r.agreement_signed_at) b.appendChild(el('div', 'signed', '\u2714 ' + t('agSigned') + ' · ' + shortDate(String(r.agreement_signed_at).slice(0, 10))));
    b.appendChild(el('div', 'meta', t('received') +
      new Date(r.created_at).toLocaleString(locale('gregory'), { dateStyle: 'medium', timeStyle: 'short' }) +
      t('siteLang') + (r.language === 'ar' ? t('langAr') : t('langEn'))));

    return b;
  }

  function stats() {
    var today = todayStr(), wk = new Date();
    wk.setDate(wk.getDate() + 7);
    var w = wk.getFullYear() + '-' + pad(wk.getMonth() + 1) + '-' + pad(wk.getDate());
    $('sTotal').textContent = rows.length;
    $('sNew').textContent = rows.filter(function (r) { return r.status === 'new'; }).length;
    $('sConfirmed').textContent = rows.filter(function (r) { return r.status === 'confirmed'; }).length;
    $('sWeek').textContent = rows.filter(function (r) { return r.status !== 'cancelled' && r.event_date >= today && r.event_date <= w; }).length;
  }

  var view = 'bookings';
  function setView(v) {
    view = v;
    $('tabB').classList.toggle('on', v === 'bookings');
    $('tabB').setAttribute('aria-selected', v === 'bookings');
    $('tabA').classList.toggle('on', v === 'accounts');
    $('tabA').setAttribute('aria-selected', v === 'accounts');
    render();
  }
  $('tabB').addEventListener('click', function () { setView('bookings'); });
  $('tabA').addEventListener('click', function () { setView('accounts'); });

  function renderAccounts(data) {
    var body = $('acBody'), foot = $('acFoot'), sum = { t: 0, d: 0, c: 0, b: 0, s: 0 };
    body.innerHTML = '';
    foot.innerHTML = '';
    function td(text, cls) { return el('td', cls || null, text); }

    data.forEach(function (r) {
      var tr = el('tr');
      var ref = td(r.reference);
      ref.dir = 'ltr';
      ref.style.textAlign = 'start';
      tr.appendChild(ref);

      tr.appendChild(td(r.full_name));
      tr.appendChild(td(shortDate(r.event_date)));

      var st = el('td');
      var badge = el('span', 'st', t('st_' + r.status));
      badge.dataset.status = r.status;
      st.appendChild(badge);
      tr.appendChild(st);

      var bal = r.status === 'cancelled' ? null : r.balance_due;
      [r.total_amount, r.deposit_paid, r.collected_amount, bal, r.security_deposit].forEach(function (v) {
        tr.appendChild(td(fmtMoney(v), 'num'));
      });

      sum.t += +r.total_amount || 0;
      sum.d += +r.deposit_paid || 0;
      sum.c += +r.collected_amount || 0;
      sum.b += +bal || 0;
      sum.s += +r.security_deposit || 0;

      var ac = el('td'), acw = el('div', 'acts');
      ac.appendChild(acw);

      var ed = el('button', 'mini', t('thEdit'));
      ed.type = 'button';
      ed.addEventListener('click', function () { openAgDialog(r); });
      acw.appendChild(ed);

      if (canCollect(r)) {
        var cb = el('button', 'mini', t('payBtn'));
        cb.type = 'button';
        cb.addEventListener('click', function () { openPayDialog(r); });
        acw.appendChild(cb);
      }

      // WhatsApp Balance Reminder Quick Action in Table
      if (isBalanceDue(r)) {
        var waQuickBtn = el('button', 'mini ac-wa-btn', '💬');
        waQuickBtn.type = 'button';
        waQuickBtn.title = t('waRemindBtn');
        waQuickBtn.addEventListener('click', function () {
          openSingleWaDialog(r);
        });
        acw.appendChild(waQuickBtn);
      }

      tr.appendChild(ac);
      body.appendChild(tr);
    });

    if (!data.length) {
      var er = el('tr'), ec = el('td', null, t('empty'));
      ec.colSpan = 10;
      ec.style.textAlign = 'center';
      er.appendChild(ec);
      body.appendChild(er);
    } else {
      var fr = el('tr'), lab = el('td', null, t('totalsRow'));
      lab.colSpan = 4;
      fr.appendChild(lab);
      [sum.t, sum.d, sum.c, sum.b, sum.s].forEach(function (v) {
        fr.appendChild(el('td', 'num', fmtMoney(v)));
      });
      fr.appendChild(el('td'));
      foot.appendChild(fr);
    }

    $('acTotal').textContent = fmtMoney(sum.t);
    $('acPaid').textContent = fmtMoney(sum.d + sum.c);
    $('acRemain').textContent = fmtMoney(sum.b);
    $('acSec').textContent = fmtMoney(sum.s);
  }

  function render() {
    var list = $('list'), data = filtered(), acc = view === 'accounts';
    stats();
    show($('bkStats'), !acc);
    show($('acStats'), acc);
    show(list, !acc);
    show($('acWrap'), acc);
    $('count').textContent = lang === 'ar'
      ? 'الحجوزات المعروضة: ' + data.length
      : data.length + (data.length === 1 ? ' booking shown' : ' bookings shown');

    if (acc) {
      renderAccounts(data);
      return;
    }
    list.innerHTML = '';
    if (!data.length) {
      list.appendChild(el('p', 'empty', t('empty')));
      return;
    }
    data.forEach(function (r) { list.appendChild(card(r)); });
  }

  ['input', 'change'].forEach(function (ev) {
    ['q', 'fStatus', 'fWhen', 'fBalance'].forEach(function (id) {
      var item = $(id);
      if (item) item.addEventListener(ev, render);
    });
  });

  // ---------- CSV Export ----------
  function cell(v) {
    v = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
    return '"' + v.replace(/"/g, '""') + '"';
  }
  $('csv').addEventListener('click', function () {
    var keys = ['reference', 'status', 'event_date', 'hijri_date', 'event_time', 'full_name', 'phone', 'national_id', 'city',
      'district', 'address', 'postal_code', 'event_type', 'guests', 'menu', 'notes', 'created_at', 'total_amount', 'deposit_paid', 'remaining_amount', 'security_deposit', 'collected_amount', 'balance_due'];
    var lines = [t('csvHead').map(cell).join(',')];
    filtered().forEach(function (r) {
      lines.push(keys.map(function (k) {
        var v = r[k];
        if (k === 'status') v = t('st_' + v);
        if (k === 'event_type') v = t('type_' + v) || v;
        if (k === 'menu') v = t('menu_' + v) || v;
        return cell(v);
      }).join(','));
    });
    var blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bookings-' + todayStr() + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  // ---------- Change Code ----------
  $('changeForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var m = $('changeMsg'), n1 = $('newCode').value, n2 = $('newCode2').value;
    m.className = 'err';
    show(m, true);
    if (n1 !== n2) { m.textContent = t('mismatch'); return; }
    rpc('catering_admin_change_code', { p_code: code, p_new: n1 }).then(function (res) {
      if (!res.ok) { m.textContent = errText(res); return; }
      code = n1;
      remember(n1);
      m.className = 'err ok';
      m.textContent = t('changed');
      $('newCode').value = '';
      $('newCode2').value = '';
    }).catch(function () { m.textContent = t('noConn'); });
  });

  // First party signature
  var fpCv = $('fpCanvas'), fpCtx = fpCv.getContext('2d'), fpDrawing = false, fpDirty = false, fpLoaded = false, fpPinSet = false;
  function fpMsg(text, good) { var m = $('fpMsg'); m.className = 'err' + (good ? ' ok' : ''); m.textContent = text; show(m, !!text); }
  function fpWhoMsg(text, good) { var m = $('fpWhoMsg'); m.className = 'err' + (good ? ' ok' : ''); m.textContent = text; show(m, !!text); }
  function fpPos(e) { var r = fpCv.getBoundingClientRect(); return { x: (e.clientX - r.left) * fpCv.width / r.width, y: (e.clientY - r.top) * fpCv.height / r.height }; }
  function fpReset() { fpCtx.clearRect(0, 0, fpCv.width, fpCv.height); fpDirty = false; $('fpBox').querySelector('.fppad').classList.remove('drawn'); }
  function fpShow(sig) { var has = !!sig; if (has) $('fpImg').src = sig; show($('fpCur'), has); show($('fpRemove'), has); }
  function fpState(res) {
    fpPinSet = !!res.pin_set;
    $('fpName').value = res.name || '';
    show($('fpOldRow'), fpPinSet);
    fpShow(res.signature);
  }
  function fpAuthFail(res) { if (res.error === 'invalid_code' || res.error === 'locked') lock(); }
  fpCtx.lineWidth = 4; fpCtx.lineCap = 'round'; fpCtx.lineJoin = 'round'; fpCtx.strokeStyle = '#111';
  fpCv.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    fpDrawing = true;
    fpCv.setPointerCapture(e.pointerId);
    var p = fpPos(e);
    fpCtx.beginPath();
    fpCtx.moveTo(p.x, p.y);
    fpCtx.lineTo(p.x + .1, p.y + .1);
    fpCtx.stroke();
    fpDirty = true;
    fpCv.parentNode.classList.add('drawn');
    fpMsg('');
  });
  fpCv.addEventListener('pointermove', function (e) { if (!fpDrawing) return; var p = fpPos(e); fpCtx.lineTo(p.x, p.y); fpCtx.stroke(); });
  ['pointerup', 'pointercancel'].forEach(function (n) { fpCv.addEventListener(n, function () { fpDrawing = false; }); });
  $('fpClear').addEventListener('click', function () { fpReset(); fpMsg(''); });

  $('fpBox').addEventListener('toggle', function () {
    if (!$('fpBox').open || fpLoaded || !code) return;
    rpc('catering_admin_get_first_party', { p_code: code }).then(function (res) {
      if (!res.ok) { fpAuthFail(res); return; }
      fpLoaded = true;
      fpState(res);
    }).catch(function () {});
  });

  $('fpSaveWho').addEventListener('click', function () {
    var name = $('fpName').value.trim(), np = $('fpPinNew').value, op = $('fpPinOld').value;
    if (!name) { fpWhoMsg(t('fpNeedName')); return; }
    if (!fpPinSet && !np) { fpWhoMsg(t('fpNeedPinNew')); return; }
    if (fpPinSet && !op) { fpWhoMsg(t('fpNeedPinOld')); return; }
    $('fpSaveWho').disabled = true;
    rpc('catering_admin_set_signer', { p_code: code, p_name: name, p_new_pin: np, p_old_pin: op }).then(function (res) {
      if (!res.ok) { fpWhoMsg(errText(res)); fpAuthFail(res); return; }
      $('fpPinNew').value = '';
      $('fpPinOld').value = '';
      fpPinSet = true;
      show($('fpOldRow'), true);
      fpWhoMsg(t('fpWhoSaved'), true);
    }).catch(function () { fpWhoMsg(t('noConn')); }).then(function () { $('fpSaveWho').disabled = false; });
  });

  function fpSend(sig, doneText) {
    var pin = $('fpPin').value;
    if (!pin) { fpMsg(t('fpNeedPin')); return Promise.resolve(); }
    ['fpSave', 'fpClear', 'fpRemove'].forEach(function (id) { $(id).disabled = true; });
    return rpc('catering_admin_set_first_party', { p_code: code, p_signature: sig, p_pin: pin }).then(function (res) {
      if (!res.ok) { fpMsg(errText(res)); fpAuthFail(res); $('fpPin').value = ''; return; }
      fpLoaded = true;
      fpShow(sig);
      fpReset();
      $('fpPin').value = '';
      fpMsg(doneText, true);
    }).catch(function () { fpMsg(t('noConn')); }).then(function () {
      ['fpSave', 'fpClear', 'fpRemove'].forEach(function (id) { $(id).disabled = false; });
    });
  }
  $('fpSave').addEventListener('click', function () {
    if (!fpDirty) { fpMsg(t('fpDraw')); return; }
    fpSend(fpCv.toDataURL('image/png'), t('fpSaved'));
  });
  $('fpRemove').addEventListener('click', function () { fpSend('', t('fpRemoved')); });

  // ---------- Startup ----------
  var savedLang = null;
  try { savedLang = localStorage.getItem('adminLang'); } catch (e) {}
  setLang(savedLang || ((navigator.language || '').slice(0, 2) === 'ar' ? 'ar' : 'en'));

  var saved = null;
  try { saved = sessionStorage.getItem('adm'); } catch (e) {}
  if (saved) {
    load(saved, false).then(function () { if (!code) $('code').focus(); });
  } else {
    $('code').focus();
  }
})();
