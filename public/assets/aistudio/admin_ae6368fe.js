(function () {
  var cfg = window.SUPABASE_CONFIG;
  var code = null, rows = [], idleTimer = null, lang = 'en';
  var IDLE_MS = 15 * 60 * 1000;
  var STATUSES = ['new', 'confirmed', 'completed', 'cancelled'];

  // English text for the page is read from admin.html; the rest of the English text is here.
  var EN = {
    title: document.title, langBtn: 'العربية', ariaLang: 'Switch language',
    invalid_code: 'Wrong security code.',
    fpDraw: 'Please draw the signature first.', fpSaved: 'Signature saved. Customers will see it on their agreement.', fpRemoved: 'Saved signature removed.', bad_signature: 'The signature could not be saved. Please try again.',
    invalid_pin: 'Wrong signing code.', locked_pin: 'Too many wrong signing codes. Please wait 15 minutes.', not_configured: 'First set the concerned person and signing code in the First party signature card.',
    pin_required: 'Please choose a signing code.', pin_too_short: 'The signing code must be at least 6 characters.', bad_name: 'Please enter the name of the concerned person.',
    fpNeedName: 'Please enter the name of the concerned person.', fpNeedPinNew: 'Please choose a signing code (at least 6 characters).', fpNeedPinOld: 'Please enter the current signing code to change these details.',
    fpNeedPin: 'Please enter the signing code.', fpWhoSaved: 'Saved. Only someone with the signing code can now sign for the first party.',
    st_completed: 'Completed', // not offered any more, but older bookings may still have this status
    locked: 'Too many wrong attempts. Please wait 15 minutes and try again.',
    too_short: 'The new code must be at least 10 characters.',
    bad_status: 'That status is not allowed.',
    generic: 'Something went wrong. Please try again.',
    noConn: 'Could not connect. Check your internet and try again.',
    noSave: 'Could not save the change. Try again.',
    mismatch: 'The two codes do not match.',
    changed: 'Security code changed. Use the new code next time.',
    checking: 'Checking...',
    lCustomer: 'Customer', lPhone: 'Phone', lId: 'Saudi ID', lLocation: 'Location', lEvent: 'Event', lMenu: 'Menu',
    guests: 'guests', hijriChosen: ' (customer chose Hijri)', received: 'Received ', siteLang: ' · site language: ',
    langAr: 'Arabic', langEn: 'English', show: 'Show', hide: 'Hide', statusOf: 'Status of ',
    empty: 'No bookings match.',
    agSigned: 'Agreement signed by customer', pmBtn: 'Payment', agNeedAmounts: 'Add the payment amounts first.',
    signed_locked: 'The customer already signed this agreement, so the amounts can no longer be changed.',
    waBtn: 'Message customer on WhatsApp', waDone: 'Booking confirmed. Send the customer a WhatsApp message?', waOpen: 'Open WhatsApp', waDoneCancel: 'Booking cancelled. Send the customer a WhatsApp message?',
    agBtn: 'Agreement', agBlocked: 'Pop-up blocked. Allow pop-ups for this page and try again.', agPkgFilled: 'Filled in from the package price:', agPkgIs: 'Package price on the booking:',
    bad_amounts: 'The deposit cannot be more than the total amount.', not_found: 'Booking not found.',
    lAmounts: 'Amounts', sar: 'SAR', pTotal: 'Total', pDeposit: 'Deposit', pRemaining: 'Remaining', pSecurity: 'Security',
    totalsRow: 'Total',
    pCollected: 'Collected', pBalance: 'Balance due', payBtn: 'Collect payment', thEdit: 'Edit',
    bad_amount: 'Enter an amount above zero.', bad_method: 'Choose a payment method.',
    bad_date: 'The payment date cannot be in the future.', no_total: 'Enter the total amount first (use Edit).',
    over_balance: 'That is more than the balance due.',
    payVoid: 'Void', payVoided: ' (voided)', payConfirmVoid: 'Void this payment? It will no longer count.',
    noPayments: 'No payments yet.', paySaved: 'Payment recorded: ',
    type_Wedding: 'Wedding', type_Birthday: 'Birthday party', type_Family: 'Family gathering',
    type_Iftar: 'Ramadan iftar', type_Corporate: 'Company event', type_Other: 'Other',
    menu_Rice: 'Kabsa and mandi', menu_Grill: 'Grills and madhbi', menu_Both: 'Kabsa, mandi and grills',
    csvHead: ['Booking number', 'Status', 'Event date', 'Hijri date', 'Time', 'Customer', 'Phone', 'Saudi ID', 'City',
      'District', 'Address', 'Postal code', 'Event type', 'Guests', 'Menu', 'Notes', 'Received', 'Total (SAR)', 'Deposit (SAR)', 'Remaining (SAR)', 'Security deposit (SAR)', 'Collected (SAR)', 'Balance due (SAR)']
  };
  var AR = {
    title: 'لوحة الحجوزات – مطاعم قلعة الشهباء', langBtn: 'English', ariaLang: 'تغيير اللغة',
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
    agBlocked: 'تم حظر النافذة المنبثقة. اسمح بالنوافذ المنبثقة لهذه الصفحة ثم حاول مرة أخرى.', fpTitle: 'توقيع الطرف الأول', fpSub: 'يوقّع عن الطرف الأول شخص مفوّض واحد فقط. حدّد اسمه ورمز توقيعه أدناه؛ لا يستطيع غيره التوقيع عن الطرف الأول حتى لو كان مسؤولاً آخر في الإدارة. يمكنك أيضاً حفظ توقيع افتراضي يظهر في العقود.', fpCurrent: 'التوقيع المحفوظ', fpHint: 'وقّع هنا', fpSave: 'حفظ التوقيع', fpClear: 'مسح', fpRemove: 'حذف التوقيع المحفوظ', fpDraw: 'يرجى رسم التوقيع أولاً.', fpSaved: 'تم حفظ التوقيع. سيراه العملاء في عقودهم.', fpRemoved: 'تم حذف التوقيع المحفوظ.', bad_signature: 'تعذر حفظ التوقيع. حاول مرة أخرى.', invalid_pin: 'رمز التوقيع غير صحيح.', locked_pin: 'محاولات كثيرة برمز توقيع خاطئ. يرجى الانتظار 15 دقيقة.', not_configured: 'اضبط أولاً اسم المفوّض ورمز التوقيع من بطاقة توقيع الطرف الأول.', pin_required: 'يرجى اختيار رمز توقيع.', pin_too_short: 'رمز التوقيع يجب ألا يقل عن 6 خانات.', bad_name: 'يرجى إدخال اسم المفوّض.', fpNeedName: 'يرجى إدخال اسم المفوّض.', fpNeedPinNew: 'يرجى اختيار رمز توقيع (6 خانات على الأقل).', fpNeedPinOld: 'أدخل رمز التوقيع الحالي لتغيير هذه البيانات.', fpNeedPin: 'يرجى إدخال رمز التوقيع.', fpWhoSaved: 'تم الحفظ. لا يستطيع التوقيع عن الطرف الأول إلا من يعرف رمز التوقيع.', fpWhoTitle: 'من يوقّع عن الطرف الأول', fpWhoSub: 'يوقّع عن الطرف الأول شخص واحد مفوّض فقط، وهو من يعرف رمز التوقيع. يظهر اسمه في العقد.', fpName: 'اسم المفوّض', fpPinOld: 'رمز التوقيع الحالي', fpPinNew: 'رمز توقيع جديد (6 خانات على الأقل)', fpSaveWho: 'حفظ بيانات المفوّض', fpDefTitle: 'التوقيع الافتراضي', fpPin: 'رمز التوقيع', agPkgFilled: 'تمت التعبئة من سعر الباقة:', agPkgIs: 'سعر الباقة في الحجز:',
    type_Wedding: 'زواج', type_Birthday: 'عيد ميلاد', type_Family: 'لقاء عائلي',
    type_Iftar: 'إفطار رمضان', type_Corporate: 'فعالية شركة', type_Other: 'أخرى',
    menu_Rice: 'كبسة ومندي', menu_Grill: 'مشويات ومضبي', menu_Both: 'كبسة ومندي ومشويات',
    csvHead: ['رقم الحجز', 'الحالة', 'تاريخ المناسبة', 'التاريخ الهجري', 'الوقت', 'العميل', 'الجوال', 'الهوية', 'المدينة',
      'الحي', 'العنوان', 'الرمز البريدي', 'نوع المناسبة', 'الضيوف', 'القائمة', 'الملاحظات', 'تاريخ الاستلام', 'الإجمالي (ريال)', 'العربون (ريال)', 'المتبقي (ريال)', 'التأمين (ريال)', 'المحصّل (ريال)', 'المتبقي للتحصيل (ريال)']
  };

  function $(id) { return document.getElementById(id); }
  function t(k) { return (lang === 'ar' ? AR : EN)[k]; }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;   // textContent only: customer text is never treated as HTML
    return e;
  }
  function show(node, on) { node.hidden = !on; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function appVisible() { return !$('app').hidden; }

  // ---------- language ----------
  var textNodes = document.querySelectorAll('[data-i18n]');
  var phNodes = document.querySelectorAll('[data-i18n-ph]');
  textNodes.forEach(function (n) { EN[n.dataset.i18n] = EN[n.dataset.i18n] || n.textContent; });
  phNodes.forEach(function (n) { EN[n.dataset.i18nPh] = n.getAttribute('placeholder'); });

  function setLang(l) {
    lang = l;
    var h = document.documentElement;
    h.lang = l; h.dir = l === 'ar' ? 'rtl' : 'ltr';
    textNodes.forEach(function (n) { n.textContent = t(n.dataset.i18n); });
    phNodes.forEach(function (n) { n.setAttribute('placeholder', t(n.dataset.i18nPh)); });
    document.title = t('title');
    $('lang').textContent = t('langBtn'); $('lang').setAttribute('aria-label', t('ariaLang'));
    show($('loginErr'), false); show($('changeMsg'), false); show($('appErr'), false); show($('notice'), false);
    if (appVisible()) render();
    try { localStorage.setItem('adminLang', l); } catch (e) {}
  }
  $('lang').addEventListener('click', function () { setLang(lang === 'ar' ? 'en' : 'ar'); });

  function locale(cal) { return (lang === 'ar' ? 'ar-SA' : 'en-GB') + (cal ? '-u-ca-' + cal + '-nu-latn' : '-u-nu-latn'); }

  // ---------- server calls ----------
  function rpc(name, args) {
    return fetch(cfg.url + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.key },
      body: JSON.stringify(args)
    }).then(function (r) {
      return r.json().then(function (j) { if (!r.ok) throw new Error('http ' + r.status); return j; });
    });
  }
  function errText(res) { return t(res && res.error) || t('generic'); }

  // ---------- lock / unlock ----------
  function remember(c) { try { sessionStorage.setItem('adm', c); } catch (e) {} }
  function forget() { try { sessionStorage.removeItem('adm'); } catch (e) {} }
  function bumpIdle() { clearTimeout(idleTimer); if (code) idleTimer = setTimeout(lock, IDLE_MS); }
  function lock() {
    code = null; rows = []; forget(); clearTimeout(idleTimer); fpLoaded = false; ['fpPin', 'fpPinNew', 'fpPinOld'].forEach(function (id) { $(id).value = ''; });
    $('list').innerHTML = ''; $('code').value = '';
    if ($('agDialog').open) $('agDialog').close();
    if ($('payDialog').open) $('payDialog').close();
    show($('app'), false); show($('logout'), false); show($('notice'), false); show($('login'), true);
    $('code').focus();
  }
  function load(c, fromLogin) {
    return rpc('catering_admin_list', { p_code: c }).then(function (res) {
      if (!res.ok) {
        code = null; forget();
        if (fromLogin) { $('loginErr').textContent = errText(res); show($('loginErr'), true); }
        return;
      }
      code = c; remember(c); rows = res.data || [];
      show($('login'), false); show($('app'), true); show($('logout'), true);
      show($('appErr'), false); render(); bumpIdle();
    }).catch(function () {
      var box = fromLogin ? $('loginErr') : $('appErr');
      box.textContent = t('noConn'); show(box, true);
    });
  }

  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    show($('loginErr'), false);
    var b = $('loginBtn'); b.disabled = true; b.textContent = t('checking');
    load($('code').value.trim(), true).then(function () { b.disabled = false; b.textContent = t('unlock'); $('code').value = ''; });
  });
  $('logout').addEventListener('click', lock);
  $('refresh').addEventListener('click', function () { if (code) load(code, false); });
  ['click', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, bumpIdle, { passive: true }); });

  // ---------- formatting ----------
  function gDate(s) { return new Date(s + 'T12:00:00'); }
  function fmtG(s) { return gDate(s).toLocaleDateString(locale('gregory'), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
  function fmtH(s) { return new Intl.DateTimeFormat(locale('islamic-umalqura'), { day: 'numeric', month: 'long', year: 'numeric' }).format(gDate(s)); }
  function fmtT(tm) { return new Date('2000-01-01T' + tm).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }); }
  function maskId(id) { return id.charAt(0) + '••••••' + id.slice(-3); }

  // ---------- list ----------
  function filtered() {
    var q = $('q').value.trim().toLowerCase(), st = $('fStatus').value, wh = $('fWhen').value, today = todayStr();
    var out = rows.filter(function (r) {
      if (st && r.status !== st) return false;
      if (wh === 'upcoming' && r.event_date < today) return false;
      if (wh === 'past' && r.event_date >= today) return false;
      if (q) {
        var hay = [r.full_name, r.phone, r.reference, r.city, r.district].join(' ').toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
    // newest reservation first: the booking number, highest to lowest (QS-1010 above QS-1009 above QS-999)
    function refNum(r) { var n = parseInt(String(r.reference || '').replace(/\D/g, ''), 10); return isNaN(n) ? (+r.id || 0) : n; }
    out.sort(function (a, b) { return (refNum(b) - refNum(a)) || ((+b.id || 0) - (+a.id || 0)); });
    return out;
  }

  // ---------- WhatsApp confirmation message (written in the customer's own language) ----------
  function toIntl(phone) {
    var d = String(phone).replace(/\D/g, '');
    if (d.indexOf('00966') === 0) return d.slice(2);
    if (d.indexOf('966') === 0) return d;
    if (d.charAt(0) === '0') return '966' + d.slice(1);
    return '966' + d;
  }
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
    var a = $('noticeLink'); a.textContent = t('waOpen'); a.href = waLink(r);
    show($('notice'), true);
  }

  // ---------- Agreement (Arabic "عقد بوفيه خارجي"), filled from the booking ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var BLANK = '..........';
  function money(v) {
    var n = parseFloat(v);
    return isFinite(n) && n >= 0 ? n.toLocaleString('en-US', { maximumFractionDigits: 2 }) : BLANK;
  }
  var MENU_AR = { Rice: 'كبسة ومندي', Grill: 'مشويات ومضبي', Both: 'كبسة ومندي ومشويات' };

  // first party's box. The concerned person signs here with their signing code; a saved signature shows as an image.
  var FP_LABEL = 'الطرف الأول:', FP_NAME = 'مطاعم حلب الشهباء لتقديم الوجبات';
  function fpWho(name) { return name ? '<span class="nm">يمثلها: ' + esc(name) + '</span>' : ''; }
  function fpPadHtml(id, name, ready) {
    return '<b>' + FP_LABEL + '</b><span class="nm">' + FP_NAME + '</span>' + fpWho(name) +
      '<div class="sbox"><canvas id="s1" width="800" height="200"></canvas>' +
      '<div class="hint">وقّع هنا · Sign here</div><button type="button" class="clr" data-for="s1">مسح · Clear</button></div>' +
      '<div class="cap">التوقيع · Signature <span class="sd" id="s1d"></span></div>' +
      (ready ? '<input type="password" id="fppin" class="fppin" placeholder="رمز التوقيع · Signing code" autocomplete="off">' : '') +
      '<button type="button" class="fpbtn" id="fpsave" data-ready="' + (ready ? '1' : '0') + '" data-id="' + id + '">حفظ توقيع الطرف الأول · Save first party signature</button>' +
      '<div class="fpmsg' + (ready ? '' : ' bad') + '" id="fpmsg" aria-live="polite">' + (ready ? '' : 'اضبط اسم المفوّض ورمز التوقيع من صفحة الإدارة (بطاقة توقيع الطرف الأول) · Set the concerned person\'s name and signing code on the admin page (First party signature card)') + '</div>';
  }
  function fpImgHtml(src, id, locked, name) {
    return '<b>' + FP_LABEL + '</b><span class="nm">' + FP_NAME + '</span>' + fpWho(name) +
      '<div class="sbox done"><img class="simg" src="' + esc(src) + '" alt=""></div>' +
      '<div class="cap">التوقيع · Signature</div>' +
      (locked ? '' : '<button type="button" class="fpbtn alt" id="fpchg" data-id="' + id + '">تغيير التوقيع · Change signature</button>') +
      '<div class="fpmsg" id="fpmsg" aria-live="polite"></div>';
  }
  function firstBox(r, saved) {
    var locked = !!(saved && saved.signature), name = (saved && saved.first_party_name) || '', ready = !!(saved && saved.signer_ready);
    return '<div class="s" id="fps">' +
      (saved && saved.first_party_signature ? fpImgHtml(saved.first_party_signature, r.id, locked, name) : fpPadHtml(r.id, name, ready)) + '</div>';
  }
  function sigBox(id, label, name, saved) {
    if (saved && saved.signature) {
      var when = saved.signed_at ? new Date(saved.signed_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '';
      return '<div class="s"><b>' + label + '</b><span class="nm">' + name + '</span>' +
        '<div class="sbox done"><img class="simg" src="' + esc(saved.signature) + '" alt=""></div>' +
        '<div class="cap">وُقّع إلكترونياً · Signed electronically <span class="sd">' + esc(when) + '</span></div></div>';
    }
    return '<div class="s"><b>' + label + '</b><span class="nm">' + name + '</span>' +
      '<div class="sbox"><canvas id="' + id + '" width="800" height="200"></canvas>' +
      '<div class="hint">وقّع هنا · Sign here</div><button type="button" class="clr" data-for="' + id + '">مسح · Clear</button></div>' +
      '<div class="cap">التوقيع · Signature <span class="sd" id="' + id + 'd"></span></div></div>';
  }

  function agreementHtml(r, amt, saved) {
    var fpNameV = (saved && saved.first_party_name) || '', fpReady = !!(saved && saved.signer_ready);
    var dt = gDate(r.event_date), opt = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    var g = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', opt).format(dt);
    var h = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', opt).format(dt);
    var tm = new Date('2000-01-01T' + r.event_time).toLocaleTimeString('ar-SA-u-nu-latn', { hour: 'numeric', minute: '2-digit' });
    var now = new Date();
    var todayAr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    var todayEn = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    var total = parseFloat(amt.total), dep = parseFloat(amt.deposit);
    var remain = isFinite(total) && isFinite(dep) ? Math.max(0, total - dep) : null;
    var place = [r.address, r.district, r.city].filter(Boolean).join('، ');
    var row = function (k, v) { return '<div class="r"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>'; };
    var ltr = function (v) { return '<bdi dir="ltr">' + esc(v) + '</bdi>'; };

    return '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>عقد بوفيه خارجي – ' + esc(r.reference) + '</title>' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap">' +
      '<style>' +
      '@page{size:A4;margin:38mm 18mm 22mm}' +
      '*{box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      'body{margin:0;background:#e9ede9;color:#111;font-family:"Tajawal","Segoe UI",Tahoma,sans-serif}' +
      '.bar{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px 12px;min-height:66px;padding:.55rem 1rem;background:#1E4D39;border-bottom:1px solid rgba(255,255,255,.15)}' +
      '.bar .brand{display:flex;align-items:center;gap:.8rem}.bar .mark{height:52px;width:auto;background:#fff;border-radius:10px;padding:4px 8px}' +
      '.bar .name{font:800 1.25rem/1.3 "Tajawal",sans-serif;color:#F5BE2E}.bar .tools{display:flex;align-items:center;flex-wrap:wrap;gap:.5rem}' +
      '.bar button{font:700 .95rem "Tajawal",sans-serif;padding:.45rem 1rem;border:2px solid #F5BE2E;border-radius:999px;background:#F5BE2E;color:#16261E;cursor:pointer}.bar button.alt{background:transparent;color:#F5BE2E}.bar button:hover{filter:brightness(1.08)}.bar label{color:#fff;font:600 .95rem "Tajawal",sans-serif;cursor:pointer}' +
      '@media(max-width:560px){.bar{position:static}.bar .name{font-size:1rem}.bar .mark{height:42px}}' +
      '.page{width:210mm;max-width:100%;min-height:297mm;margin:16px auto;background:#fff;padding:38mm 18mm 22mm;font-size:14px;line-height:1.7;box-shadow:0 2px 12px rgba(0,0,0,.15);display:flex;flex-direction:column;justify-content:center}.in{width:100%}' +
      '.top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:.8em;border-bottom:.2em solid #1E4D39;padding-bottom:.5em;margin-bottom:.5em}' +
      '.top img{height:4em;width:auto;justify-self:start}.top h1{margin:0;font-size:1.8em;font-weight:800;color:#1E4D39;line-height:1.3;text-align:center}' +
      '.ref{font-size:.9em;color:#555;justify-self:end;text-align:left}' +
      '.dates{display:flex;justify-content:space-between;align-items:center;gap:.8em;font-weight:700;margin-bottom:.1em}.dates .en{text-align:left}' +
      'h2{font-size:1.2em;font-weight:800;margin:.6em 0 .15em}' +
      '.r{display:flex;gap:.5em;padding:.05em 0;border-bottom:1px dotted #999}.k{font-weight:700;min-width:8.5em}.v{flex:1}' +
      '.cl{width:100%;border-collapse:collapse}.cl td{vertical-align:top;padding:.12em 0;text-align:right}.cl .n{width:2.4em;font-weight:700;white-space:nowrap}' +
      window.CustomerAgreement.termsCss +
      '.sig{display:flex;gap:2em;margin-top:1.1em}.sig .s{flex:1;min-width:0;display:flex;flex-direction:column}.sig b{font-weight:800}' +
      '.sig .nm{font-size:.95em;margin-bottom:.3em}' +
      '.sbox.done{border-style:solid;border-color:#cfd8d2}.sbox .simg{display:block;width:100%;height:auto}' +
      '.sbox{position:relative;border:1.5px dashed #8a9a90;border-radius:.5em;background:#fbfcfb}.sbox canvas{display:block;width:100%;height:auto;touch-action:none;cursor:crosshair}' +
      '.fpbtn{display:block;margin-top:.45em;font:700 .8em "Tajawal",sans-serif;padding:.3em 1em;border:1.5px solid #1E4D39;border-radius:999px;background:#1E4D39;color:#fff;cursor:pointer}.fpbtn.alt{background:#fff;color:#1E4D39}.fpbtn:disabled{opacity:.6;cursor:wait}.fpmsg{min-height:1.2em;margin-top:.25em;font-size:.8em;color:#1E4D39}.fpmsg.bad{color:#b3321f}.fppin{display:block;width:100%;box-sizing:border-box;margin-top:.45em;padding:.3em .6em;font:inherit;font-size:.8em;border:1.5px solid #8a9a90;border-radius:6px;direction:ltr;text-align:center}' +
      '.sbox .hint{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center;color:#a9b4ad;font-size:.95em;pointer-events:none}' +
      '.sbox .clr{position:absolute;top:.3em;left:.3em;font:600 .75em "Tajawal",sans-serif;padding:.1em .7em;border:1px solid #999;border-radius:999px;background:#fff;color:#333;cursor:pointer}' +
      '.sig .cap{font-size:.8em;color:#555;text-align:center;margin-top:.2em}' +
      '@media print{body{background:#fff}.bar{display:none}.sbox{border:0;border-bottom:1.5px solid #111;border-radius:0;background:none}.sbox .hint,.sbox .clr,.fpbtn,.fpmsg,.fppin{display:none}.page{box-shadow:none;margin:0;padding:0;width:auto;max-width:none;min-height:230mm;font-size:var(--fs,12px)}.in{break-inside:avoid;page-break-inside:avoid}}' +
      '</style></head><body>' +
      '<div class="bar"><div class="brand"><img class="mark" src="logo.png" alt="" onerror="this.style.display=\'none\'"><span class="name"><bdi>العقد</bdi> · <bdi>Agreement</bdi></span></div><div class="tools">' +
      '<button onclick="window.print()"><bdi>طباعة / حفظ PDF</bdi> · <bdi>Print / Save PDF</bdi></button>' +
      '<button class="alt" onclick="goBack()"><bdi>رجوع</bdi> · <bdi>Go Back</bdi></button>' +
      '<label><input type="checkbox" id="lg" checked> <bdi>الشعار</bdi> · <bdi>Logo</bdi></label></div></div>' +
      '<div class="page"><div class="in">' +
      '<div class="top"><img src="logo.png" alt="" onerror="this.style.visibility=\'hidden\'"><h1>عقد بوفيه خارجي</h1><div class="ref">رقم الحجز: ' + ltr(r.reference) + '</div></div>' +
      '<div class="dates"><span>التاريخ: ' + esc(todayAr) + '</span><span class="en" dir="ltr">Date: ' + esc(todayEn) + '</span></div>' +
      '<h2>تم الاتفاق بين كل من:</h2>' +
      row('الطرف الأول:', 'مطاعم حلب الشهباء لتقديم الوجبات' + (fpNameV ? ' — يمثلها: ' + esc(fpNameV) : '')) +
      row('الطرف الثاني:', esc(r.full_name)) +
      row('رقم الجوال:', ltr(r.phone)) +
      row('رقم السجل المدني:', ltr(r.national_id)) +
      row('تاريخ البوفيه:', esc(h) + ' الموافق ' + esc(g)) +
      '<h2>بيانات الحجز</h2>' +
      row('وقت التقديم:', esc(tm)) +
      row('موقع البوفيه:', '<bdi>' + esc(place) + '</bdi>') +
      row('عدد الأشخاص:', esc(r.guests)) +
      row('نوع القائمة:', esc(MENU_AR[r.menu] || r.menu)) +
      '<h2>وقد تم الاتفاق على ما يلي:</h2><table class="cl">' +
      '<tr><td class="n">1.</td><td>وذلك على أن يقوم الطرف الأول بتجهيز بوفيه مفتوح خارجي في المكان الذي يرغب به الطرف الثاني، حسب الاتفاق.</td></tr>' +
      '<tr><td class="n">2.</td><td>يتم تجهيز البوفيه بعدد الأشخاص المتفق عليه، مع تحديد الأصناف حسب الاتفاق.</td></tr>' +
      '<tr><td class="n">3.</td><td>إجمالي المبلغ المتفق عليه لإعداد البوفيه هو <b>' + money(amt.total) + '</b> ريال، دُفع منه مبلغ <b>' + money(amt.deposit) + '</b> ريال عربون، والمتبقي منه <b>' + (remain == null ? BLANK : money(remain)) + '</b> ريال.</td></tr>' +
      '<tr><td class="n">4.</td><td>يتم دفع مبلغ تأمين <b>' + money(amt.insurance) + '</b> ريال، ويُسترد بعد إقامة البوفيه في حال سلامة جميع معدات البوفيه.</td></tr>' +
      '<tr><td class="n">5.</td><td>يتم سداد كامل المبلغ قبل موعد البوفيه بخمسة أيام، وفي حال لم يتم ذلك يعتبر العقد لاغياً.</td></tr>' +
      '<tr><td class="n">6.</td><td>العربون لا يُسترد في حالة الإلغاء قبل موعد البوفيه بأقل من 30 يومًا، وفي حال تم الإلغاء قبل 30 يومًا من موعد البوفيه يتم خصم 50% من قيمة العربون.</td></tr>' +
      '<tr><td class="n">7.</td><td>البوفيه خدمة ذاتية، ويتم تسليمها للطرف الثاني عند انتهاء التجهيز. وفي حال رغبة العميل في طلب عمال لخدمة البوفيه، يتحمل رسومًا إضافية.</td></tr>' +
      '<tr><td class="n">8.</td><td>يتم اختيار قائمة الأصناف من المنيو اليومي حسب تحديد الشيف.</td></tr>' +
      '<tr><td class="n">9.</td><td>يتم احتساب رسوم إضافية في حال رغبة العميل في شراء وطبخ طليان، غير رسوم البوفيه.</td></tr>' +
      '</table>' + window.CustomerAgreement.termsHtml() +
      '<div class="sig">' + firstBox(r, saved) + sigBox('s2', 'الطرف الثاني:', esc(r.full_name), saved) + '</div>' +
      '</div></div>' +
      // Shrinks the text just enough (in a hidden A4-width copy) so the whole agreement prints on ONE page.
      '<script>' +
      'function fit(){var s=document.querySelector(".in"),b=document.createElement("div");' +
      'b.style.cssText="position:absolute;left:-9999px;top:0;width:174mm;visibility:hidden;line-height:1.7";' +
      'var c=s.cloneNode(true);Array.prototype.forEach.call(c.querySelectorAll(".fpbtn,.fpmsg,.fppin"),function(e){e.parentNode.removeChild(e);});b.appendChild(c);var m=document.createElement("div");m.style.cssText="height:233mm;width:1px";b.appendChild(m);' +
      'document.body.appendChild(b);var a=m.offsetHeight,f=14;' +
      'for(;f>8;f-=0.25){b.style.fontSize=f+"px";if(c.scrollHeight<=a)break;}' +
      'document.documentElement.style.setProperty("--fs",f+"px");document.body.removeChild(b);}' +
      'function goBack(){try{if(window.opener&&!window.opener.closed)window.opener.focus();}catch(e){}window.close();setTimeout(function(){location.href="admin.html";},300);}' +
      'document.getElementById("lg").addEventListener("change",function(){var i=document.querySelector(".top img");if(i)i.style.visibility=this.checked?"visible":"hidden";fit();});' +
      'function initPad(id){var c=document.getElementById(id);if(!c)return;var x=c.getContext("2d"),on=false,l=null,hint=c.parentNode.querySelector(".hint"),sd=document.getElementById(id+"d");' +
      'x.lineWidth=3.4;x.lineCap="round";x.lineJoin="round";x.strokeStyle="#0a2a8a";x.fillStyle="#0a2a8a";' +
      'function pt(e){var r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height};}' +
      'c.addEventListener("pointerdown",function(e){on=true;l=pt(e);try{c.setPointerCapture(e.pointerId);}catch(z){}if(hint)hint.style.display="none";' +
      'if(sd&&!sd.textContent)sd.textContent="· "+new Date().toLocaleDateString("en-GB");x.beginPath();x.arc(l.x,l.y,1.7,0,6.3);x.fill();e.preventDefault();});' +
      'c.addEventListener("pointermove",function(e){if(!on)return;var p=pt(e);x.beginPath();x.moveTo(l.x,l.y);x.lineTo(p.x,p.y);x.stroke();l=p;});' +
      'function up(){on=false;}c.addEventListener("pointerup",up);c.addEventListener("pointercancel",up);' +
      'var cb=c.parentNode.querySelector(".clr");cb.addEventListener("click",function(){x.clearRect(0,0,c.width,c.height);if(hint)hint.style.display="";if(sd)sd.textContent="";});}' +
      'var FP_PAD=' + JSON.stringify(fpPadHtml(r.id, fpNameV, fpReady)).replace(/</g, '\\u003c') + ';' +
      'var FP_HEAD=' + JSON.stringify(fpImgHtml('@@', r.id, false, fpNameV).split('@@')[0]).replace(/</g, '\\u003c') + ',FP_TAIL=' + JSON.stringify(fpImgHtml('@@', r.id, false, fpNameV).split('@@')[1]).replace(/</g, '\\u003c') + ';' +
      'var FP_ERR={invalid_pin:"رمز التوقيع غير صحيح · Wrong signing code",locked_pin:"محاولات كثيرة، انتظر 15 دقيقة · Too many attempts, wait 15 minutes",not_configured:"اضبط اسم المفوّض ورمز التوقيع من صفحة الإدارة · Set the signer name and signing code on the admin page",signed_locked:"وقّع العميل العقد ولا يمكن تغييره · The customer already signed",bad_signature:"تعذر حفظ التوقيع · Could not save the signature"};' +
      'function fpMsg(t,bad){var m=document.getElementById("fpmsg");if(m){m.textContent=t;m.className="fpmsg"+(bad?" bad":"");}}' +
      'function bindFirst(){var sv=document.getElementById("fpsave"),ch=document.getElementById("fpchg"),pn=document.getElementById("fppin"),box=document.getElementById("fps");' +
      'if(sv)sv.addEventListener("click",function(){if(sv.getAttribute("data-ready")!=="1"){fpMsg(FP_ERR.not_configured,true);return;}var c=document.getElementById("s1"),h=c.parentNode.querySelector(".hint");' +
      'if(h&&h.style.display!=="none"){fpMsg("وقّع أولاً · Please sign first",true);return;}' +
      'var pin=pn?pn.value:"";if(!pin){fpMsg("أدخل رمز التوقيع · Enter the signing code",true);return;}' +
      'var op=window.opener,url=c.toDataURL("image/png");' +
      'if(!op||op.closed||!op.catAdminSaveFirstParty){fpMsg("تعذر الحفظ، افتح العقد من صفحة الإدارة · Could not save, open the agreement from the admin page",true);return;}' +
      'sv.disabled=true;op.catAdminSaveFirstParty(+sv.getAttribute("data-id"),url,pin).then(function(res){' +
      'if(res&&res.ok){box.innerHTML=FP_HEAD+url+FP_TAIL;bindFirst();fpMsg("تم حفظ توقيع الطرف الأول · First party signature saved");fit();}' +
      'else{sv.disabled=false;if(pn)pn.value="";fpMsg(FP_ERR[res&&res.error]||FP_ERR.bad_signature,true);}' +
      '}).catch(function(){sv.disabled=false;fpMsg("تعذر الاتصال · No connection",true);});});' +
      'if(ch)ch.addEventListener("click",function(){box.innerHTML=FP_PAD;initPad("s1");bindFirst();fit();});}' +
      'initPad("s1");initPad("s2");bindFirst();' +
      'window.addEventListener("load",fit);window.addEventListener("beforeprint",fit);' +
      'if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);' +
      '<\/script>' +
      '</body></html>';
  }

  function numOrNull(v) { v = String(v).trim(); if (v === '') return null; var n = parseFloat(v); return isFinite(n) ? n : null; }
  function fmtMoney(v) { return v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function amtFromRow(r) { return { total: r.total_amount, deposit: r.deposit_paid, insurance: r.security_deposit }; }

  // Saves the amounts in Supabase so the Accounts team can see them.
  function saveAmounts(r, tot, dep, sec) {
    return rpc('catering_admin_set_amounts', { p_code: code, p_id: r.id, p_total: tot, p_deposit: dep, p_security: sec }).then(function (res) {
      if (res.ok) {
        r.total_amount = tot; r.deposit_paid = dep; r.security_deposit = sec;
        r.remaining_amount = tot != null && dep != null ? Math.max(0, tot - dep) : null;
        r.amounts_updated_at = new Date().toISOString();
      }
      return res;
    });
  }

  var agR = null;
  function readAmounts() { return { tot: numOrNull($('agTotal').value), dep: numOrNull($('agDeposit').value), sec: numOrNull($('agInsurance').value) }; }
  function updRemain() {
    var a = readAmounts();
    $('agRemain').value = a.tot != null && a.dep != null ? fmtMoney(Math.max(0, a.tot - a.dep)) : '—';
  }
  function openAgDialog(r) {
    agR = r; $('agForm').reset();
    $('agWho').textContent = r.reference + ' · ' + r.full_name;
    // the package price chosen on the booking form fills the Total amount until the admin saves a different figure
    var fromPkg = r.total_amount == null && r.package_price != null;
    $('agTotal').value = r.total_amount != null ? r.total_amount : (fromPkg ? r.package_price : '');
    var ph = $('agPkgHint');
    ph.textContent = r.package_price != null ? t(fromPkg ? 'agPkgFilled' : 'agPkgIs') + ' ' + fmtMoney(r.package_price) + ' ' + t('sar') : '';
    show(ph, r.package_price != null);
    $('agDeposit').value = r.deposit_paid != null ? r.deposit_paid : '';
    $('agInsurance').value = r.security_deposit != null ? r.security_deposit : '';
    updRemain(); show($('agErr'), false);
    if (!$('agDialog').open) $('agDialog').showModal();
  }
  function agError(msg) { $('agErr').textContent = msg; show($('agErr'), true); }
  function agBusy(on) { ['agSaveBtn', 'agSkip'].forEach(function (id) { $(id).disabled = on; }); }

  // Save the amounts (the agreement is opened separately with the Agreement button)
  function agRun() {
    var a = readAmounts(); show($('agErr'), false);
    if (a.tot != null && a.dep != null && a.dep > a.tot) { agError(t('bad_amounts')); return; }
    agBusy(true);
    var wasNew = agR.status === 'new';
    saveAmounts(agR, a.tot, a.dep, a.sec).then(function (res) {
      if (!res.ok) {
        agError(errText(res));
        if (res.error === 'invalid_code' || res.error === 'locked') lock();
        return;
      }
      // a deposit has been paid and saved: a NEW booking becomes CONFIRMED
      var after = Promise.resolve();
      if (wasNew && a.dep != null && a.dep > 0) {
        if (res.status === 'confirmed') { agR.status = 'confirmed'; }          // the database already did it
        else after = rpc('catering_admin_set_status', { p_code: code, p_id: agR.id, p_status: 'confirmed' })
          .then(function (r2) { if (r2.ok) agR.status = 'confirmed'; }).catch(function () {});
      }
      return after.then(function () {
        $('agDialog').close(); render();
        if (wasNew && agR.status === 'confirmed' && isWaStatus('confirmed')) showNotice(agR);   // same WhatsApp prompt as choosing Confirmed by hand
      });
    }).catch(function () { agError(t('noSave')); })
      .then(function () { agBusy(false); });
  }

  // Opens the saved agreement (saved amounts + the customer's signature, if they signed)
  function showSavedAgreement(w, r) {
    var write = function (saved) { w.document.open(); w.document.write(agreementHtml(r, amtFromRow(r), saved)); w.document.close(); };
    w.document.open();
    w.document.write('<!DOCTYPE html><meta charset="utf-8"><title>…</title><p style="font:18px sans-serif;padding:2rem;text-align:center">جارٍ فتح العقد… · Opening…</p>');
    w.document.close();
    return rpc('catering_admin_get_signature', { p_code: code, p_booking: r.id }).then(function (g) {
      if (g && !g.ok && (g.error === 'invalid_code' || g.error === 'locked')) { w.close(); lock(); return; }
      if (g && g.ok) {
        if (g.signature && !r.agreement_signed_at) { r.agreement_signed_at = g.signed_at; render(); }   // customer signed after the list was loaded
        write(g);   // carries the first party's signature too, even if the customer has not signed yet
      } else { write(null); }
    }).catch(function () { write(null); });
  }
  function openAgreement(r) {
    if (r.total_amount == null) { openAgDialog(r); return; }      // amounts must be saved first
    var w = window.open('', '_blank');                           // opened inside the tap so browsers allow it
    if (!w) { $('appErr').textContent = t('agBlocked'); show($('appErr'), true); return; }
    show($('appErr'), false);
    showSavedAgreement(w, r);
  }
  $('agTotal').addEventListener('input', updRemain);
  $('agDeposit').addEventListener('input', updRemain);
  $('agSkip').addEventListener('click', function () { $('agDialog').close(); });
  $('agForm').addEventListener('submit', function (e) { e.preventDefault(); agRun(); });

  // ---------- Collect the remaining amount ----------
  function canCollect(r) { return r.status !== 'cancelled' && r.balance_due != null && +r.balance_due > 0; }
  function shortDate(s) { return gDate(s).toLocaleDateString(locale('gregory'), { day: 'numeric', month: 'short', year: 'numeric' }); }
  var payR = null;

  function reloadRows(after) {
    return rpc('catering_admin_list', { p_code: code }).then(function (res) {
      if (!res.ok) { lock(); return; }
      rows = res.data || []; render(); if (after) after();
    });
  }
  function payMsg(text, good) { var m = $('payErr'); m.className = 'err' + (good ? ' ok' : ''); m.textContent = text; show(m, true); }
  function payBusy(on) { ['payGo', 'payClose'].forEach(function (id) { $(id).disabled = on; }); }

  function renderHist(r) {
    var ul = $('payHist'); ul.innerHTML = '';
    var list = r.payments || [];
    if (!list.length) { ul.appendChild(el('li', 'none', t('noPayments'))); return; }
    list.forEach(function (p) {
      var li = el('li', p.voided ? 'void' : null);
      var info = shortDate(p.paid_on) + ' · ' + fmtMoney(p.amount) + ' ' + t('sar') + ' · ' + t('m_' + p.method) +
        (p.receipt_no ? ' · #' + p.receipt_no : '') + (p.note ? ' · ' + p.note : '') + ' · ' + p.reference + (p.voided ? t('payVoided') : '');
      li.appendChild(el('span', null, info));
      if (!p.voided) {
        var vb = el('button', 'mini', t('payVoid')); vb.type = 'button';
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
  function rowById(id) { return rows.filter(function (x) { return x.id === id; })[0]; }

  function refreshPay(r, keepMsg) {
    if (!r) { $('payDialog').close(); return; }
    payR = r;
    $('payWho').textContent = r.reference + ' · ' + r.full_name;
    $('pyTotal').textContent = fmtMoney(r.total_amount); $('pyDeposit').textContent = fmtMoney(r.deposit_paid);
    $('pyCollected').textContent = fmtMoney(r.collected_amount); $('pyBalance').textContent = fmtMoney(r.balance_due);
    $('payAmount').value = r.balance_due != null && +r.balance_due > 0 ? r.balance_due : '';
    $('payReceipt').value = ''; $('payNote').value = '';
    if (!keepMsg) show($('payErr'), false);
    renderHist(r);
  }
  function openPayDialog(r) {
    $('payMethod').value = 'cash'; $('payDate').value = todayStr(); $('payDate').max = todayStr();
    refreshPay(r, false);
    if (!$('payDialog').open) $('payDialog').showModal();
  }
  $('payClose').addEventListener('click', function () { $('payDialog').close(); });
  $('payForm').addEventListener('submit', function (e) {
    e.preventDefault(); show($('payErr'), false);
    var amt = numOrNull($('payAmount').value);
    if (amt == null || amt <= 0) { payMsg(t('bad_amount'), false); return; }
    if (payR.balance_due == null) { payMsg(t('no_total'), false); return; }
    if (amt > +payR.balance_due + 0.0001) { payMsg(t('over_balance'), false); return; }
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
      return reloadRows(function () {
        var nr = rowById(payR.id);
        refreshPay(nr, true);
        if (nr) payMsg(t('paySaved') + ref, true);
      });
    }).catch(function () { payMsg(t('noSave'), false); })
      .then(function () { payBusy(false); });
  });

  function card(r) {
    var b = el('article', 'b'); b.dataset.status = r.status;

    var head = el('div', 'b-head');
    var ref = el('span', 'ref', r.reference); ref.dir = 'ltr';
    head.appendChild(ref);
    var wa, ag, pay, pm, actions, sel = el('select'); sel.setAttribute('aria-label', t('statusOf') + r.reference);
    // "Completed" is no longer offered; a booking that already has that status keeps showing it so nothing is misreported
    STATUSES.filter(function (s) { return s !== 'completed' || r.status === 'completed'; }).forEach(function (s) {
      var o = el('option', null, t('st_' + s)); o.value = s; if (s === r.status) o.selected = true; sel.appendChild(o);
    });
    sel.addEventListener('change', function () {
      var prev = r.status, next = sel.value; sel.disabled = true;
      rpc('catering_admin_set_status', { p_code: code, p_id: r.id, p_status: next }).then(function (res) {
        if (!res.ok) {
          sel.value = prev; $('appErr').textContent = errText(res); show($('appErr'), true);
          if (res.error === 'invalid_code' || res.error === 'locked') lock();
          return;
        }
        r.status = next; b.dataset.status = next; show($('appErr'), false); stats();
        wa.hidden = !isWaStatus(next); wa.href = waLink(r); ag.hidden = !isAgStatus(next);
        pm.hidden = next === 'cancelled';
        pay.hidden = !canCollect(r); actions.hidden = wa.hidden && ag.hidden && pay.hidden && pm.hidden;
        if (next === 'completed' && r.total_amount == null) openAgDialog(r);
        if (isWaStatus(next)) showNotice(r); else show($('notice'), false);
      }).catch(function () { sel.value = prev; $('appErr').textContent = t('noSave'); show($('appErr'), true); })
        .then(function () { sel.disabled = false; });
    });
    head.appendChild(sel); b.appendChild(head);

    var when = el('div', 'when', fmtG(r.event_date) + ' · ' + fmtT(r.event_time));
    when.appendChild(el('small', null, fmtH(r.event_date) + (r.calendar_type === 'hijri' ? t('hijriChosen') : '')));
    b.appendChild(when);

    var dl = el('dl');
    function row(k, v) {
      dl.appendChild(el('dt', null, k));
      var dd = el('dd'); if (typeof v === 'string') dd.textContent = v; else dd.appendChild(v);
      dl.appendChild(dd); return dd;
    }
    row(t('lCustomer'), r.full_name);
    var tel = el('a', null, r.phone); tel.href = 'tel:' + r.phone.replace(/[^+0-9]/g, ''); tel.dir = 'ltr';
    row(t('lPhone'), tel);
    var idDd = row(t('lId'), '');
    var idVal = el('bdi', null, maskId(r.national_id)); idVal.dir = 'ltr';
    var tg = el('button', 'mini', t('show')); tg.type = 'button';
    tg.addEventListener('click', function () {
      var on = tg.dataset.on === '1';
      idVal.textContent = on ? maskId(r.national_id) : r.national_id;
      tg.dataset.on = on ? '0' : '1'; tg.textContent = on ? t('show') : t('hide');
    });
    idDd.appendChild(idVal); idDd.appendChild(tg);
    var place = [r.address, r.district, r.city, r.postal_code].filter(Boolean).join(lang === 'ar' ? '، ' : ', ');
    var map = el('a', null, place);
    map.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([r.address, r.district, r.city, 'Saudi Arabia'].join(' '));
    map.target = '_blank'; map.rel = 'noopener noreferrer';
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

    actions = el('div', 'actions');
    wa = el('a', 'wa', t('waBtn'));
    wa.href = waLink(r); wa.target = '_blank'; wa.rel = 'noopener noreferrer';
    wa.hidden = !isWaStatus(r.status);
    actions.appendChild(wa);

    ag = el('button', 'wa ag', t('agBtn')); ag.type = 'button';
    ag.hidden = !isAgStatus(r.status);
    ag.addEventListener('click', function () { openAgreement(r); });
    actions.appendChild(ag);
    pay = el('button', 'wa pay', t('payBtn')); pay.type = 'button';
    pay.hidden = !canCollect(r);
    pay.addEventListener('click', function () { openPayDialog(r); });
    actions.appendChild(pay);
    pm = el('button', 'wa pm', t('pmBtn')); pm.type = 'button';
    pm.hidden = r.status === 'cancelled';
    pm.addEventListener('click', function () { openAgDialog(r); });
    actions.appendChild(pm);
    actions.hidden = wa.hidden && ag.hidden && pay.hidden && pm.hidden;
    b.appendChild(actions);

    if (r.notes) b.appendChild(el('div', 'note', r.notes));
    if (r.agreement_signed_at) b.appendChild(el('div', 'signed', '\u2714 ' + t('agSigned') + ' · ' + shortDate(String(r.agreement_signed_at).slice(0, 10))));
    b.appendChild(el('div', 'meta', t('received') +
      new Date(r.created_at).toLocaleString(locale('gregory'), { dateStyle: 'medium', timeStyle: 'short' }) +
      t('siteLang') + (r.language === 'ar' ? t('langAr') : t('langEn'))));
    return b;
  }

  function stats() {
    var today = todayStr(), wk = new Date(); wk.setDate(wk.getDate() + 7);
    var w = wk.getFullYear() + '-' + pad(wk.getMonth() + 1) + '-' + pad(wk.getDate());
    $('sTotal').textContent = rows.length;
    $('sNew').textContent = rows.filter(function (r) { return r.status === 'new'; }).length;
    $('sConfirmed').textContent = rows.filter(function (r) { return r.status === 'confirmed'; }).length;
    $('sWeek').textContent = rows.filter(function (r) { return r.status !== 'cancelled' && r.event_date >= today && r.event_date <= w; }).length;
  }

  var view = 'bookings';
  function setView(v) {
    view = v;
    $('tabB').classList.toggle('on', v === 'bookings'); $('tabB').setAttribute('aria-selected', v === 'bookings');
    $('tabA').classList.toggle('on', v === 'accounts'); $('tabA').setAttribute('aria-selected', v === 'accounts');
    render();
  }
  $('tabB').addEventListener('click', function () { setView('bookings'); });
  $('tabA').addEventListener('click', function () { setView('accounts'); });

  function renderAccounts(data) {
    var body = $('acBody'), foot = $('acFoot'), sum = { t: 0, d: 0, c: 0, b: 0, s: 0 };
    body.innerHTML = ''; foot.innerHTML = '';
    function td(text, cls) { return el('td', cls || null, text); }
    data.forEach(function (r) {
      var tr = el('tr');
      var ref = td(r.reference); ref.dir = 'ltr'; ref.style.textAlign = 'start'; tr.appendChild(ref);
      tr.appendChild(td(r.full_name));
      tr.appendChild(td(shortDate(r.event_date)));
      var st = el('td'); var badge = el('span', 'st', t('st_' + r.status)); badge.dataset.status = r.status; st.appendChild(badge); tr.appendChild(st);
      var bal = r.status === 'cancelled' ? null : r.balance_due;            // nothing to collect on cancelled bookings
      [r.total_amount, r.deposit_paid, r.collected_amount, bal, r.security_deposit].forEach(function (v) { tr.appendChild(td(fmtMoney(v), 'num')); });
      sum.t += +r.total_amount || 0; sum.d += +r.deposit_paid || 0; sum.c += +r.collected_amount || 0;
      sum.b += +bal || 0; sum.s += +r.security_deposit || 0;
      var ac = el('td'), acw = el('div', 'acts'); ac.appendChild(acw);
      var ed = el('button', 'mini', t('thEdit')); ed.type = 'button';
      ed.addEventListener('click', function () { openAgDialog(r); }); acw.appendChild(ed);
      if (canCollect(r)) {
        var cb = el('button', 'mini', t('payBtn')); cb.type = 'button';
        cb.addEventListener('click', function () { openPayDialog(r); }); acw.appendChild(cb);
      }
      tr.appendChild(ac); body.appendChild(tr);
    });
    if (!data.length) {
      var er = el('tr'), ec = el('td', null, t('empty')); ec.colSpan = 10; ec.style.textAlign = 'center'; er.appendChild(ec); body.appendChild(er);
    } else {
      var fr = el('tr'), lab = el('td', null, t('totalsRow')); lab.colSpan = 4; fr.appendChild(lab);
      [sum.t, sum.d, sum.c, sum.b, sum.s].forEach(function (v) { fr.appendChild(el('td', 'num', fmtMoney(v))); });
      fr.appendChild(el('td')); foot.appendChild(fr);
    }
    $('acTotal').textContent = fmtMoney(sum.t); $('acPaid').textContent = fmtMoney(sum.d + sum.c);
    $('acRemain').textContent = fmtMoney(sum.b); $('acSec').textContent = fmtMoney(sum.s);
  }

  function render() {
    var list = $('list'), data = filtered(), acc = view === 'accounts';
    stats();
    show($('bkStats'), !acc); show($('acStats'), acc); show(list, !acc); show($('acWrap'), acc);
    $('count').textContent = lang === 'ar'
      ? 'الحجوزات المعروضة: ' + data.length
      : data.length + (data.length === 1 ? ' booking shown' : ' bookings shown');
    if (acc) { renderAccounts(data); return; }
    list.innerHTML = '';
    if (!data.length) { list.appendChild(el('p', 'empty', t('empty'))); return; }
    data.forEach(function (r) { list.appendChild(card(r)); });
  }
  ['input', 'change'].forEach(function (ev) { ['q', 'fStatus', 'fWhen'].forEach(function (id) { $(id).addEventListener(ev, render); }); });

  // ---------- CSV ----------
  function cell(v) {
    v = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;           // stop spreadsheet formulas typed by customers
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
    a.href = URL.createObjectURL(blob); a.download = 'bookings-' + todayStr() + '.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });

  // ---------- change code ----------
  $('changeForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var m = $('changeMsg'), n1 = $('newCode').value, n2 = $('newCode2').value;
    m.className = 'err'; show(m, true);
    if (n1 !== n2) { m.textContent = t('mismatch'); return; }
    rpc('catering_admin_change_code', { p_code: code, p_new: n1 }).then(function (res) {
      if (!res.ok) { m.textContent = errText(res); return; }
      code = n1; remember(n1);
      m.className = 'err ok'; m.textContent = t('changed');
      $('newCode').value = ''; $('newCode2').value = '';
    }).catch(function () { m.textContent = t('noConn'); });
  });

  // called by the agreement window: the concerned person signs ONE agreement (needs the signing code)
  window.catAdminSaveFirstParty = function (bookingId, dataUrl, pin) {
    if (!code) return Promise.resolve({ ok: false, error: 'invalid_code' });
    return rpc('catering_admin_set_booking_first_party', { p_code: code, p_booking: bookingId, p_signature: dataUrl, p_pin: pin || '' });
  };

  // ---------- first party card: who signs, and the default signature ----------
  var fpCv = $('fpCanvas'), fpCtx = fpCv.getContext('2d'), fpDrawing = false, fpDirty = false, fpLoaded = false, fpPinSet = false;
  function fpMsg(text, good) { var m = $('fpMsg'); m.className = 'err' + (good ? ' ok' : ''); m.textContent = text; show(m, !!text); }
  function fpWhoMsg(text, good) { var m = $('fpWhoMsg'); m.className = 'err' + (good ? ' ok' : ''); m.textContent = text; show(m, !!text); }
  function fpPos(e) { var r = fpCv.getBoundingClientRect(); return { x: (e.clientX - r.left) * fpCv.width / r.width, y: (e.clientY - r.top) * fpCv.height / r.height }; }
  function fpReset() { fpCtx.clearRect(0, 0, fpCv.width, fpCv.height); fpDirty = false; $('fpBox').querySelector('.fppad').classList.remove('drawn'); }
  function fpShow(sig) { var has = !!sig; if (has) $('fpImg').src = sig; show($('fpCur'), has); show($('fpRemove'), has); }
  function fpState(res) {   // reply of catering_admin_get_first_party
    fpPinSet = !!res.pin_set; $('fpName').value = res.name || '';
    show($('fpOldRow'), fpPinSet); fpShow(res.signature);
  }
  function fpAuthFail(res) { if (res.error === 'invalid_code' || res.error === 'locked') lock(); }
  fpCtx.lineWidth = 4; fpCtx.lineCap = 'round'; fpCtx.lineJoin = 'round'; fpCtx.strokeStyle = '#111';
  fpCv.addEventListener('pointerdown', function (e) {
    e.preventDefault(); fpDrawing = true; fpCv.setPointerCapture(e.pointerId);
    var p = fpPos(e); fpCtx.beginPath(); fpCtx.moveTo(p.x, p.y); fpCtx.lineTo(p.x + .1, p.y + .1); fpCtx.stroke();
    fpDirty = true; fpCv.parentNode.classList.add('drawn'); fpMsg('');
  });
  fpCv.addEventListener('pointermove', function (e) { if (!fpDrawing) return; var p = fpPos(e); fpCtx.lineTo(p.x, p.y); fpCtx.stroke(); });
  ['pointerup', 'pointercancel'].forEach(function (n) { fpCv.addEventListener(n, function () { fpDrawing = false; }); });
  $('fpClear').addEventListener('click', function () { fpReset(); fpMsg(''); });
  $('fpBox').addEventListener('toggle', function () {
    if (!$('fpBox').open || fpLoaded || !code) return;
    rpc('catering_admin_get_first_party', { p_code: code }).then(function (res) {
      if (!res.ok) { fpAuthFail(res); return; }
      fpLoaded = true; fpState(res);
    }).catch(function () {});
  });
  // who signs for the first party: the concerned person's name and their signing code
  $('fpSaveWho').addEventListener('click', function () {
    var name = $('fpName').value.trim(), np = $('fpPinNew').value, op = $('fpPinOld').value;
    if (!name) { fpWhoMsg(t('fpNeedName')); return; }
    if (!fpPinSet && !np) { fpWhoMsg(t('fpNeedPinNew')); return; }
    if (fpPinSet && !op) { fpWhoMsg(t('fpNeedPinOld')); return; }
    $('fpSaveWho').disabled = true;
    rpc('catering_admin_set_signer', { p_code: code, p_name: name, p_new_pin: np, p_old_pin: op }).then(function (res) {
      if (!res.ok) { fpWhoMsg(errText(res)); fpAuthFail(res); return; }
      $('fpPinNew').value = ''; $('fpPinOld').value = ''; fpPinSet = true; show($('fpOldRow'), true); fpWhoMsg(t('fpWhoSaved'), true);
    }).catch(function () { fpWhoMsg(t('noConn')); }).then(function () { $('fpSaveWho').disabled = false; });
  });
  // the default first-party signature (also needs the signing code)
  function fpSend(sig, doneText) {
    var pin = $('fpPin').value;
    if (!pin) { fpMsg(t('fpNeedPin')); return Promise.resolve(); }
    ['fpSave', 'fpClear', 'fpRemove'].forEach(function (id) { $(id).disabled = true; });
    return rpc('catering_admin_set_first_party', { p_code: code, p_signature: sig, p_pin: pin }).then(function (res) {
      if (!res.ok) { fpMsg(errText(res)); fpAuthFail(res); $('fpPin').value = ''; return; }
      fpLoaded = true; fpShow(sig); fpReset(); $('fpPin').value = ''; fpMsg(doneText, true);
    }).catch(function () { fpMsg(t('noConn')); }).then(function () {
      ['fpSave', 'fpClear', 'fpRemove'].forEach(function (id) { $(id).disabled = false; });
    });
  }
  $('fpSave').addEventListener('click', function () {
    if (!fpDirty) { fpMsg(t('fpDraw')); return; }
    fpSend(fpCv.toDataURL('image/png'), t('fpSaved'));
  });
  $('fpRemove').addEventListener('click', function () { fpSend('', t('fpRemoved')); });

  // ---------- start ----------
  var savedLang = null;
  try { savedLang = localStorage.getItem('adminLang'); } catch (e) {}
  setLang(savedLang || ((navigator.language || '').slice(0, 2) === 'ar' ? 'ar' : 'en'));
  var saved = null;
  try { saved = sessionStorage.getItem('adm'); } catch (e) {}
  if (saved) load(saved, false).then(function () { if (!code) $('code').focus(); }); else $('code').focus();
})();
