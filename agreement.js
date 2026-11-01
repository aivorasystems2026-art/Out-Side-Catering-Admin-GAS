/* Builds the customer's agreement (عقد بوفيه خارجي) as a printable HTML page.
   The contract wording is the restaurant's Word file; the customer's details come from the booking. */
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Official seal of Halab Al Shahaba Restaurants (embedded so it always prints)
  var SEAL = 'data:image/png;base64,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';
  var BLANK = '..........';
  function money(v) {
    var n = parseFloat(v);
    return isFinite(n) && n >= 0 ? n.toLocaleString('en-US', { maximumFractionDigits: 2 }) : BLANK;
  }
  var MENU_AR = { Rice: 'كبسة ومندي', Grill: 'مشويات ومضبي', Both: 'كبسة ومندي ومشويات' };
  function ltr(v) { return '<bdi dir="ltr">' + esc(v) + '</bdi>'; }

  // "Terms to know before booking" (wording from the restaurant's terms sheet) - shown in BOTH the customer's and the admin's agreement
  var TERMS = [
    'البوفيه الفضي لا يشمل طاولات الطعام والكراسي، ويبدأ سعر الطاولة منسقة مع 6 كراسي من 115 ريال إلى 230 ريال للطاولة الواحدة.',
    'إذا كانت البوفيه كبيرة قد تتكرر بعض الأصناف.',
    'لكل بوفيه حجم سخانات مختلف يبدأ من 4 لتر إلى 9 لتر للسخان الواحد، بناءً على عدد الأشخاص المتفق عليه.',
    'الأصناف انترنشونال.... يتم اختيار الأصناف من المنيو اليومي الذي يتم تحديده من قبل الشيف.',
    'اعتماد الطلب يكون بتحويل العربون، خلاف ذلك يُعد لاغياً.',
    'يستغرق تجهيز البوفيه في الموقع من ساعة ونصف إلى ساعتين.',
    'لا يتم إلغاء الحجز بعد الاعتماد، ويحق للعميل التأجيل إلى حد سنة كحد أقصى.',
    'يكون التواصل مع الرقم المقيد في العقد فقط، وتنسيق جميع الأعمال معه.',
    'يتم تحديد الحد الأدنى للأشخاص حسب المنطقة.',
    'المطعم غير مسؤول عن نظافة قاعة الطعام سواءً قبل تجهيز البوفيه أو بعد انتهائه.'
  ];
  var TERMS_CSS = '.tc{-webkit-column-count:2;column-count:2;-webkit-column-gap:1.8em;column-gap:1.8em}' +
    '.tc .t{display:flex;-webkit-column-break-inside:avoid;break-inside:avoid;page-break-inside:avoid;padding:.1em 0;font-size:.94em;line-height:1.6}' +
    '.tc .n{flex:none;width:1.9em;font-weight:700}' +
    '@media screen and (max-width:560px){.tc{-webkit-column-count:1;column-count:1}}';
  function termsHtml() {
    return '<h2>بنود يجب معرفتها قبل الحجز:</h2><div class="tc">' +
      TERMS.map(function (s, i) { return '<div class="t"><span class="n">' + (i + 1) + '.</span><span>' + esc(s) + '</span></div>'; }).join('') + '</div>';
  }

  function sigParty(id, label, name, inner, cap, extra) {
    return '<div class="s"><b>' + label + '</b><span class="nm">' + name + '</span>' + inner + '<div class="cap" id="' + id + 'cap">' + cap + '</div>' + (extra || '') + '</div>';
  }

  function build(d) {
    var dt = new Date(d.event_date + 'T12:00:00');
    var opt = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    var g = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', opt).format(dt);
    var h = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', opt).format(dt);
    var tm = new Date('2000-01-01T' + d.event_time).toLocaleTimeString('ar-SA-u-nu-latn', { hour: 'numeric', minute: '2-digit' });
    var now = new Date();
    var todayAr = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    var todayEn = new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    var place = [d.address, d.district, d.city].filter(Boolean).join('، ');
    var total = parseFloat(d.total_amount), dep = parseFloat(d.deposit_paid);
    var remain = isFinite(total) && isFinite(dep) ? Math.max(0, total - dep) : null;
    var signed = !!d.signature;
    var fpName = d.first_party_name ? esc(d.first_party_name) : '';   // the concerned person who signs for the first party
    var row = function (k, v) { return '<div class="r"><span class="k">' + k + '</span><span class="v">' + v + '</span></div>'; };

    var box2;
    var cap2;
    if (signed) {
      var when = d.signed_at ? new Date(d.signed_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '';
      box2 = '<div class="sbox done"><img class="simg" src="' + esc(d.signature) + '" alt=""></div>';
      cap2 = 'وُقّع إلكترونياً · Signed electronically <span class="sd">' + esc(when) + '</span>';
    } else {
      box2 = '<div class="sbox"><canvas id="s2" width="800" height="200"></canvas>' +
        '<div class="hint">وقّع هنا · Sign here</div><button type="button" class="clr" id="clr">مسح · Clear</button></div>';
      cap2 = 'التوقيع · Signature <span class="sd" id="s2d"></span>';
    }
    // first party's signature (saved by the admin); an empty box if none has been saved yet
    var box1 = d.first_party_signature
      ? '<div class="sbox done"><img class="simg" src="' + esc(d.first_party_signature) + '" alt=""></div>'
      : '<div class="sbox static"></div>';
    var sealCol = '<div class="sealcol"><img class="seal" src="' + SEAL + '" alt="ختم مطاعم حلب الشهباء"><div class="cap">الختم · Official seal</div></div>';

    var css = TERMS_CSS +
      '@page{size:A4;margin:12mm}' +
      '*{box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact;-webkit-text-size-adjust:100%}' +
      'body{margin:0;background:#e9ede9;color:#111;font-family:"Tajawal","Segoe UI",Tahoma,sans-serif}' +
      '.bar{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;min-height:66px;padding:.55rem 1rem;background:#1E4D39;border-bottom:1px solid rgba(255,255,255,.15)}' +
      '.bar .brand{display:flex;align-items:center}.bar .mark{height:52px;width:auto;background:#fff;border-radius:10px;padding:4px 8px;margin-inline-end:.8rem}' +
      '.bar .name{font:800 1.25rem/1.3 "Tajawal",sans-serif;color:#F5BE2E}.bar .tools{display:flex;align-items:center;flex-wrap:wrap}.bar .tools>*{margin:.25rem .25rem}' +
      '.bar button{font:700 .95rem "Tajawal",sans-serif;min-height:44px;padding:.45rem 1rem;border:2px solid #F5BE2E;border-radius:999px;background:#F5BE2E;color:#16261E;cursor:pointer;touch-action:manipulation}' +
      '.bar button.alt{background:transparent;color:#F5BE2E}.bar button:disabled{opacity:.6}' +
      '.msg{color:#fff;font:600 .9rem "Tajawal",sans-serif;max-width:18rem}.msg.bad{color:#FFB4A8}' +
      '.page{width:210mm;max-width:100%;min-height:297mm;margin:16px auto;background:#fff;padding:12mm;font-size:14px;line-height:1.7;box-shadow:0 2px 12px rgba(0,0,0,.15)}.in{width:100%}' +
      '.top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;border-bottom:.2em solid #1E4D39;padding-bottom:.5em;margin-bottom:.5em}' +
      '.top img{height:4em;width:auto;justify-self:start}.top h1{margin:0 .8em;font-size:1.8em;font-weight:800;color:#1E4D39;line-height:1.3;text-align:center}' +
      '.ref{font-size:.9em;color:#555;justify-self:end;text-align:left}' +
      '.dates{display:flex;justify-content:space-between;align-items:center;font-weight:700;margin-bottom:.1em}.dates .en{text-align:left}' +
      'h2{font-size:1.2em;font-weight:800;margin:.6em 0 .15em}' +
      '.r{display:flex;padding:.05em 0;border-bottom:1px dotted #999}.k{font-weight:700;min-width:8.5em;margin-inline-end:.5em}.v{flex:1}' +
      '.cl{width:100%;border-collapse:collapse}.cl td{vertical-align:top;padding:.12em 0;text-align:right}.cl .n{width:2.4em;font-weight:700;white-space:nowrap}' +
      '.sig{display:flex;align-items:center;margin-top:1.1em}.sig .s{flex:1;min-width:0;display:flex;flex-direction:column}.sig b{font-weight:800}.sig .nm{font-size:.95em;margin-bottom:.3em}' +
      '.sbox{position:relative;border:1.5px dashed #8a9a90;border-radius:.5em;background:#fbfcfb}.sbox canvas{display:block;width:100%;height:auto;touch-action:none;cursor:crosshair}' +
      '.sealcol{flex:none;display:flex;flex-direction:column;align-items:center;margin:0 1.2em}.sealcol .seal{display:block;height:8.5em;width:auto}.sealcol .cap{margin-top:.2em}.sbox.static{height:0;padding-bottom:25%}.sbox.done{border-style:solid;border-color:#cfd8d2}.sbox .simg{display:block;width:100%;height:auto}' +
      '.sbox .hint{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center;color:#a9b4ad;font-size:.95em;pointer-events:none}' +
      '.sbox .clr{position:absolute;top:.3em;left:.3em;font:600 .75em "Tajawal",sans-serif;padding:.1em .7em;border:1px solid #999;border-radius:999px;background:#fff;color:#333;cursor:pointer}' +
      '.sig .cap{font-size:.8em;color:#555;text-align:center;margin-top:.2em}' +
      '.svbtn{display:block;width:100%;min-height:2.4em;margin-top:.45em;font:700 .8em "Tajawal",sans-serif;padding:.3em 1em;border:1.5px solid #1E4D39;border-radius:999px;background:#1E4D39;color:#fff;cursor:pointer;touch-action:manipulation}.svbtn:disabled{opacity:.6;cursor:wait}' +
      '.smsg{min-height:1.2em;margin-top:.25em;font-size:.8em;font-weight:600;color:#1E4D39;text-align:center}.smsg.bad{color:#b3321f}' +
      '@media print{body{background:#fff}.bar{display:none}.sbox{border:0;border-bottom:1.5px solid #111;border-radius:0;background:none}.sbox .hint,.sbox .clr,.svbtn,.smsg{display:none}' +
      '.page{box-shadow:none;margin:0;padding:0;width:auto;max-width:none;min-height:0;font-size:var(--fs,12px)}.in{break-inside:avoid;page-break-inside:avoid}}' +
      '@media screen and (max-width:560px){.sig{display:block}.sealcol{margin:1.4em auto}.sealcol .seal{height:8em}.sig .cap{font-size:.85em}}' +
      '@media(max-width:560px){.bar .name{font-size:1rem}.bar .mark{height:42px}.bar{position:static}.page{padding:8mm 5mm;margin:0}.top h1{font-size:1.5em}}';

    var head =
      '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' +
      '<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">' +
      '<title>عقد بوفيه خارجي – ' + esc(d.reference) + '</title>' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap">' +
      '<style>' + css + '</style></head><body>';

    var bar =
      '<div class="bar"><div class="brand"><img class="mark" src="logo.png" alt="" onerror="this.style.display=\'none\'">' +
      '<span class="name"><bdi>العقد</bdi> · <bdi>Agreement</bdi></span></div><div class="tools">' +
      '<button type="button" onclick="window.print()"><bdi>طباعة / حفظ PDF</bdi> · <bdi>Print / Save PDF</bdi></button>' +
      '<button type="button" class="alt" onclick="window.close()"><bdi>إغلاق</bdi> · <bdi>Close</bdi></button></div></div>';

    var body =
      '<div class="page"><div class="in">' +
      '<div class="top"><img src="logo.png" alt="" onerror="this.style.visibility=\'hidden\'"><h1>عقد بوفيه خارجي</h1><div class="ref">رقم الحجز: ' + ltr(d.reference) + '</div></div>' +
      '<div class="dates"><span>التاريخ: ' + esc(todayAr) + '</span><span class="en" dir="ltr">Date: ' + esc(todayEn) + '</span></div>' +
      '<h2>تم الاتفاق بين كل من:</h2>' +
      row('الطرف الأول:', 'مطاعم حلب الشهباء لتقديم الوجبات' + (fpName ? ' — يمثلها: ' + fpName : '')) +
      row('الطرف الثاني:', esc(d.full_name)) +
      row('رقم الجوال:', ltr(d.phone)) +
      row('رقم السجل المدني:', ltr(d.national_id)) +
      row('تاريخ البوفيه:', esc(h) + ' الموافق ' + esc(g)) +
      '<h2>بيانات الحجز</h2>' +
      row('وقت التقديم:', esc(tm)) +
      row('موقع البوفيه:', '<bdi>' + esc(place) + '</bdi>') +
      row('عدد الأشخاص:', esc(d.guests)) +
      row('نوع القائمة:', esc(MENU_AR[d.menu] || d.menu)) +
      '<h2>وقد تم الاتفاق على ما يلي:</h2><table class="cl">' +
      '<tr><td class="n">1.</td><td>وذلك على أن يقوم الطرف الأول بتجهيز بوفيه مفتوح خارجي في المكان الذي يرغب به الطرف الثاني، حسب الاتفاق.</td></tr>' +
      '<tr><td class="n">2.</td><td>يتم تجهيز البوفيه بعدد الأشخاص المتفق عليه، مع تحديد الأصناف حسب الاتفاق.</td></tr>' +
      '<tr><td class="n">3.</td><td>إجمالي المبلغ المتفق عليه لإعداد البوفيه هو <b>' + money(d.total_amount) + '</b> ريال، دُفع منه مبلغ <b>' + money(d.deposit_paid) + '</b> ريال عربون، والمتبقي منه <b>' + (remain == null ? BLANK : money(remain)) + '</b> ريال.</td></tr>' +
      '<tr><td class="n">4.</td><td>يتم دفع مبلغ تأمين <b>' + money(d.security_deposit) + '</b> ريال، ويُسترد بعد إقامة البوفيه في حال سلامة جميع معدات البوفيه.</td></tr>' +
      '<tr><td class="n">5.</td><td>يتم سداد كامل المبلغ قبل موعد البوفيه بخمسة أيام، وفي حال لم يتم ذلك يعتبر العقد لاغياً.</td></tr>' +
      '<tr><td class="n">6.</td><td>العربون لا يُسترد في حالة الإلغاء قبل موعد البوفيه بأقل من 30 يومًا، وفي حال تم الإلغاء قبل 30 يومًا من موعد البوفيه يتم خصم 50% من قيمة العربون.</td></tr>' +
      '<tr><td class="n">7.</td><td>البوفيه خدمة ذاتية، ويتم تسليمها للطرف الثاني عند انتهاء التجهيز. وفي حال رغبة العميل في طلب عمال لخدمة البوفيه، يتحمل رسومًا إضافية.</td></tr>' +
      '<tr><td class="n">8.</td><td>يتم اختيار قائمة الأصناف من المنيو اليومي حسب تحديد الشيف.</td></tr>' +
      '<tr><td class="n">9.</td><td>يتم احتساب رسوم إضافية في حال رغبة العميل في شراء وطبخ طليان، غير رسوم البوفيه.</td></tr>' +
      '</table>' + termsHtml() +
      '<div class="sig">' +
      sigParty('s1', 'الطرف الأول:', 'مطاعم حلب الشهباء لتقديم الوجبات' + (fpName ? '<br>يمثلها: ' + fpName : ''), box1, 'التوقيع · Signature') + sealCol +
      sigParty('s2', 'الطرف الثاني:', esc(d.full_name), box2, cap2, signed ? '' : '<button id="sv" type="button" class="svbtn"><bdi>حفظ التوقيع</bdi> · <bdi>Save signature</bdi></button><div class="smsg" id="msg" role="status"></div>') +
      '</div></div></div>';

    // Runs inside the agreement page: shrink text to fit ONE A4 page, drawing pad, saving the signature.
    var js =
      'function fit(){var s=document.querySelector(".in"),b=document.createElement("div");' +
      'b.style.cssText="position:absolute;left:-9999px;top:0;width:186mm;visibility:hidden;line-height:1.7";' +
      'var c=s.cloneNode(true);Array.prototype.forEach.call(c.querySelectorAll(".svbtn,.smsg"),function(e){e.parentNode.removeChild(e);});b.appendChild(c);var m=document.createElement("div");m.style.cssText="height:268mm;width:1px";b.appendChild(m);' +
      'document.body.appendChild(b);var a=m.offsetHeight,f=14;' +
      'for(;f>8;f-=0.25){b.style.fontSize=f+"px";if(c.scrollHeight<=a)break;}' +
      'document.documentElement.style.setProperty("--fs",f+"px");document.body.removeChild(b);}' +
      'var REF=' + JSON.stringify(d.reference) + ';var msg=document.getElementById("msg");' +
      'function say(t,bad){msg.textContent=t;msg.className="smsg"+(bad?" bad":"");}' +
      'var c=document.getElementById("s2");' +
      'if(c){var x=c.getContext("2d"),on=false,drawn=false,l=null,hint=c.parentNode.querySelector(".hint"),sd=document.getElementById("s2d");' +
      'x.lineWidth=3.4;x.lineCap="round";x.lineJoin="round";x.strokeStyle="#0a2a8a";x.fillStyle="#0a2a8a";' +
      'function pt(e){var r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height};}' +
      'c.addEventListener("pointerdown",function(e){on=true;drawn=true;l=pt(e);try{c.setPointerCapture(e.pointerId);}catch(z){}if(hint)hint.style.display="none";' +
      'x.beginPath();x.arc(l.x,l.y,1.7,0,6.3);x.fill();e.preventDefault();});' +
      'c.addEventListener("pointermove",function(e){if(!on)return;var p=pt(e);x.beginPath();x.moveTo(l.x,l.y);x.lineTo(p.x,p.y);x.stroke();l=p;});' +
      'function up(){on=false;}c.addEventListener("pointerup",up);c.addEventListener("pointercancel",up);' +
      'document.getElementById("clr").addEventListener("click",function(){x.clearRect(0,0,c.width,c.height);drawn=false;if(hint)hint.style.display="";say("");});' +
      'var sv=document.getElementById("sv");' +
      'sv.addEventListener("click",function(){' +
      'if(!drawn){say("وقّع أولاً · Please sign first",true);return;}' +
      'if(!window.opener||!window.opener.__customerSign){say("أبقِ صفحة الحجز مفتوحة ثم حاول مجدداً · Keep the booking page open and try again",true);return;}' +
      'var url=c.toDataURL("image/png");sv.disabled=true;say("جارٍ الحفظ... · Saving...");' +
      'Promise.resolve(window.opener.__customerSign(REF,url)).then(function(res){' +
      'if(res&&res.ok){var box=c.parentNode;box.className="sbox done";box.innerHTML="";var im=document.createElement("img");im.className="simg";im.alt="";im.src=url;box.appendChild(im);' +
      'document.getElementById("s2cap").textContent="وُقّع إلكترونياً · Signed electronically "+new Date().toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"});' +
      'sv.style.display="none";say("تم حفظ توقيعك · Your signature was saved");fit();}' +
      'else{sv.disabled=false;say(res&&res.error==="already_signed"?"تم توقيع هذا العقد مسبقاً · Already signed":(res&&res.error==="too_many"?"محاولات كثيرة، حاول لاحقاً · Too many attempts, try later":"تعذر حفظ التوقيع · Could not save the signature"),true);}' +
      '}).catch(function(){sv.disabled=false;say("تعذر الاتصال · Connection problem",true);});});}' +
      'window.addEventListener("load",fit);window.addEventListener("beforeprint",fit);' +
      'if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);';

    return head + bar + body + '<script>' + js + '<\/script></body></html>';
  }

  window.CustomerAgreement = { html: build, terms: TERMS, termsHtml: termsHtml, termsCss: TERMS_CSS };
})();
