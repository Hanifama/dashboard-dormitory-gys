/* GYS Dormitory Energy Management System — vanilla JS (no framework).
 * Part 1: chrome (theme/sidebar/dropdowns), toasts, pills, generic modal + forms.
 * Part 2 (below): data tables, detail viewers, charts, tabs, page init.
 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function refreshIcons() { if (window.lucide) window.lucide.createIcons(); }
  function DB(name) { return (window.DBM && window.DBM[name]) || []; }
  try {
    var __savedAccess = JSON.parse(localStorage.getItem('verdant-access') || 'null');
    if (__savedAccess && window.DBM) window.DBM.access = Object.assign({}, window.DBM.access, __savedAccess);
  } catch (err) { /* prototype: ignore corrupt cache */ }

  /* ---------- Theme (persisted) ---------- */
  var root = document.documentElement;
  try { if (localStorage.getItem('verdant-theme') === 'dark') root.classList.add('dark'); } catch (e) {}
  function isDark() { return root.classList.contains('dark'); }
  var themeBtn = $('#theme-btn');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    root.classList.toggle('dark');
    try { localStorage.setItem('verdant-theme', isDark() ? 'dark' : 'light'); } catch (e) {}
    buildConsumption();
    toast(isDark() ? 'Mode gelap aktif.' : 'Mode terang aktif.', 'theme');
  });

  /* ---------- Header labels ---------- */
  var now = new Date();
  var hour = now.getHours();
  var greet = $('#greeting');
  if (greet) greet.textContent = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam';
  var PAGE_CRUMB = {
    dashboard: ['Ringkasan', 'Dashboard'],
    buildings: ['Manajemen', 'Gedung'],
    floors: ['Manajemen', 'Lantai'], rooms: ['Manajemen', 'Kamar'],
    employees: ['Manajemen', 'Karyawan'], meters: ['Manajemen', 'Meter'],
    dcu: ['Manajemen', 'DCU & IoT'],
    tokens: ['Energi & Token', 'Token'], transactions: ['Energi & Token', 'Transaksi'],
    payments: ['Energi & Token', 'Pembayaran'], tariffs: ['Energi & Token', 'Tarif'],
    notifications: ['Pemantauan', 'Notifikasi'], reports: ['Pemantauan', 'Laporan'],
    users: ['Sistem', 'Pengguna'], roles: ['Sistem', 'Peran & Akses'], accessmenu: ['Sistem', 'Pengaturan Akses'], auditlog: ['Sistem', 'Audit Log'],
    settings: ['Sistem', 'Konfigurasi Sistem'],
  };
  function paintCrumb(parts) {
    var crumb = $('#breadcrumb');
    if (!crumb) return;
    crumb.innerHTML = (parts || []).map(function (p, i) {
      return i === 0
        ? '<span class="font-medium text-slate-400 dark:text-slate-500">' + esc(p) + '</span>'
        : '<span class="font-bold text-pine-700 dark:text-white">' + esc(p) + '</span>';
    }).join('<span class="text-slate-300 dark:text-slate-600">/</span>');
  }
  paintCrumb(PAGE_CRUMB[document.body.getAttribute('data-page')] || []);
  function initSettingsCrumb() {
    if (document.body.getAttribute('data-page') !== 'settings') return;
    $$('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('data-tab') === 'dormitory') paintCrumb(['Sistem', 'Konfigurasi Sistem', 'Asrama']);
        else paintCrumb(PAGE_CRUMB.settings);
      });
    });
  }
  $$('input[type="date"][data-today]').forEach(function (d) { d.value = now.toISOString().slice(0, 10); });

  /* ---------- Active nav (body[data-page]) ---------- */
  (function activeNav() {
    var page = document.body.getAttribute('data-page');
    if (!page) return;
    var BASE = 'nav-link flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ';
    var ON = 'relative overflow-hidden bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300';
    var OFF = 'font-medium text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-800 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-emerald-300';
    $$('#sidebar [data-nav]').forEach(function (a) {
      var isOn = a.getAttribute('data-nav') === page;
      a.className = BASE + (isOn ? ON : OFF);
      var icon = a.querySelector('svg, i');
      if (icon) { icon.classList.toggle('text-emerald-600', isOn); icon.classList.toggle('dark:text-emerald-400', isOn); }
      var old = a.querySelector('.nav-active-bar');
      if (old) old.remove();
      if (isOn) {
        var bar = document.createElement('span');
        bar.className = 'nav-active-bar absolute inset-y-2 left-0 w-1 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-700';
        a.insertBefore(bar, a.firstChild);
      }
    });
  })();

  /* ---------- Sidebar ---------- */
  var sidebar = $('#sidebar');
  var overlay = $('#side-overlay');
  var mq = window.matchMedia ? window.matchMedia('(min-width: 1024px)') : { matches: true };
  function openMobile() {
    if (!sidebar) return;
    sidebar.classList.remove('-translate-x-full');
    if (overlay) overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeMobile() {
    if (!sidebar) return;
    sidebar.classList.add('-translate-x-full');
    if (overlay) overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
  var menuBtn = $('#menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', function () {
    if (mq.matches) document.body.classList.toggle('sidebar-collapsed');
    else if (sidebar.classList.contains('-translate-x-full')) openMobile(); else closeMobile();
  });
  if (overlay) overlay.addEventListener('click', closeMobile);
  $$('#sidebar a').forEach(function (a) { a.addEventListener('click', function () { if (!mq.matches) closeMobile(); }); });
  var sideTip = null;
  function hideSideTip() { if (sideTip) { sideTip.remove(); sideTip = null; } }
  $$('#sidebar [data-nav]').forEach(function (a) {
    var lab = a.querySelector('.nav-label');
    if (lab && lab.textContent.trim()) a.setAttribute('data-tip', lab.textContent.trim());
    a.addEventListener('mouseenter', function () {
      if (!document.body.classList.contains('sidebar-collapsed') || !mq.matches) return;
      hideSideTip();
      var r = a.getBoundingClientRect();
      sideTip = document.createElement('div');
      sideTip.className = 'side-tip';
      sideTip.textContent = a.getAttribute('data-tip') || '';
      sideTip.style.top = (r.top + r.height / 2) + 'px';
      document.body.appendChild(sideTip);
    });
    a.addEventListener('mouseleave', hideSideTip);
  });
  if (sidebar) {
    sidebar.addEventListener('mouseleave', hideSideTip);
    var sideNav = sidebar.querySelector('nav');
    if (sideNav) sideNav.addEventListener('scroll', hideSideTip);
  }

  /* ---------- Dropdowns (topbar + generic menus incl. export) ---------- */
  function closeAllDrops(except) {
    $$('.drop').forEach(function (d) { if (d !== except) d.classList.add('drop-hidden'); });
  }
  function bindMenu(btn, menu) {
    btn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var willOpen = menu.classList.contains('drop-hidden');
      closeAllDrops();
      if (willOpen) menu.classList.remove('drop-hidden');
    });
    menu.addEventListener('click', function (ev) { ev.stopPropagation(); });
  }
  [['notif-btn', 'notif-drop'], ['profile-btn', 'profile-drop']].forEach(function (pair) {
    var b = document.getElementById(pair[0]), m = document.getElementById(pair[1]);
    if (b && m) bindMenu(b, m);
  });
  $$('[data-menu-btn]').forEach(function (btn) {
    var menu = btn.parentElement ? btn.parentElement.querySelector('[data-menu]') : null;
    if (menu) bindMenu(btn, menu);
  });
  document.addEventListener('click', function () { closeAllDrops(); });

  /* ---------- Toasts ---------- */
  var toastWrap = $('#toast-wrap');
  var TOAST_STYLE = {
    info: { bar: 'bg-emerald-500', icon: 'check-circle-2', iconCls: 'text-emerald-500' },
    theme: { bar: 'bg-teal-500', icon: 'moon-star', iconCls: 'text-teal-500' },
    warn: { bar: 'bg-amber-400', icon: 'alert-triangle', iconCls: 'text-amber-500' },
    danger: { bar: 'bg-rose-500', icon: 'trash-2', iconCls: 'text-rose-500' },
  };
  function toast(message, type) {
    if (!toastWrap) return;
    var s = TOAST_STYLE[type] || TOAST_STYLE.info;
    var el = document.createElement('div');
    el.className = 'toast relative flex items-start gap-3 overflow-hidden rounded-2xl border border-emerald-900/10 bg-white py-3 pl-4 pr-3 shadow-pop dark:border-white/10 dark:bg-pine-900';
    el.innerHTML = '<span class="absolute inset-y-0 left-0 w-1 ' + s.bar + '"></span>' +
      '<i data-lucide="' + s.icon + '" class="mt-0.5 h-[18px] w-[18px] shrink-0 ' + s.iconCls + '"></i>' +
      '<p class="flex-1 text-[13px] font-medium leading-snug text-slate-700 dark:text-slate-200"></p>' +
      '<button type="button" class="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-cream hover:text-slate-600 dark:hover:bg-white/10" aria-label="Tutup"><i data-lucide="x" class="h-3.5 w-3.5"></i></button>';
    el.querySelector('p').textContent = message;
    toastWrap.appendChild(el);
    refreshIcons();
    var killed = false;
    function dismiss() {
      if (killed) return; killed = true;
      el.classList.add('toast-out');
      setTimeout(function () { el.remove(); }, 260);
    }
    el.querySelector('button').addEventListener('click', dismiss);
    setTimeout(dismiss, 3600);
    while (toastWrap.children.length > 4) toastWrap.firstChild.remove();
  }
  $$('[data-toast]').forEach(function (el) {
    el.addEventListener('click', function () {
      closeAllDrops();
      toast(el.getAttribute('data-toast'), el.getAttribute('data-toast-type') || 'info');
    });
  });

  /* ---------- Status pills + formatters ---------- */
  var PILL_TONE = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300|bg-emerald-500',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300|bg-amber-400',
    slate: 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400|bg-slate-400',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300|bg-sky-500',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300|bg-rose-500',
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300|bg-teal-500',
  };
  var STATUS_TONE = {
    online: 'emerald', active: 'emerald', available: 'emerald', successful: 'emerald', read: 'slate',
    connected: 'emerald', current: 'emerald', matched: 'emerald', synced: 'emerald', enabled: 'emerald',
    warning: 'amber', pending: 'amber', expired: 'amber', idle: 'amber',
    offline: 'slate', inactive: 'slate', occupied: 'teal', scheduled: 'slate',
    maintenance: 'sky', unread: 'sky', info: 'sky', delivered: 'sky',
    failed: 'rose', critical: 'rose', declined: 'rose', error: 'rose', low: 'rose',
    open: 'rose', handling: 'amber', resolved: 'emerald', completed: 'slate',
  };
  var STATUS_LABEL = {
    online: 'Online', active: 'Aktif', available: 'Tersedia', successful: 'Berhasil', success: 'Berhasil', read: 'Dibaca',
    connected: 'Terhubung', current: 'Saat Ini', matched: 'Cocok', synced: 'Tersinkron', enabled: 'Aktif',
    warning: 'Peringatan', pending: 'Menunggu', expired: 'Kedaluwarsa', idle: 'Siaga',
    offline: 'Offline', inactive: 'Tidak Aktif', occupied: 'Terisi', scheduled: 'Terjadwal',
    maintenance: 'Pemeliharaan', unread: 'Belum Dibaca', info: 'Info', delivered: 'Terkirim',
    failed: 'Gagal', critical: 'Kritis', declined: 'Ditolak', error: 'Kesalahan', low: 'Rendah',
    open: 'Terbuka', handling: 'Sedang Ditangani', resolved: 'Selesai', completed: 'Selesai',
  };
  function pill(status, label) {
    var key = String(status).toLowerCase();
    var tone = PILL_TONE[STATUS_TONE[key] || 'slate'].split('|');
    return '<span class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ' + tone[0] + '"><span class="h-1.5 w-1.5 rounded-full ' + tone[1] + '"></span>' + esc(label || STATUS_LABEL[key] || status) + '</span>';
  }
  function idr(n) {
    n = Math.round(Number(n) || 0);
    return 'Rp ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function kwh(n) { return (Math.round(Number(n) * 10) / 10) + ' kWh'; }

  /* ---------- Generic modal ---------- */
  var gOverlay = $('#gmodal-overlay'), gCard = $('#gmodal-card'),
      gTitle = $('#gmodal-title'), gBody = $('#gmodal-body'), gFoot = $('#gmodal-foot');
  function openModal(opts) {
    if (!gOverlay) return;
    gTitle.textContent = opts.title || 'Dialog';
    gBody.innerHTML = '';
    gFoot.innerHTML = '';
    gFoot.style.display = '';
    if (typeof opts.body === 'string') gBody.innerHTML = opts.body;
    else if (opts.body) gBody.appendChild(opts.body);
    if (opts.hideFoot) gFoot.style.display = 'none';
    else if (opts.foot) {
      if (typeof opts.foot === 'string') gFoot.innerHTML = opts.foot;
      else gFoot.appendChild(opts.foot);
    } else {
      gFoot.innerHTML = '<button type="button" data-close-modal class="flex-1 rounded-xl border border-emerald-900/10 py-2.5 text-[13px] font-bold text-slate-600 transition hover:bg-cream dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5">Tutup</button>';
    }
    if (gCard) {
      gCard.classList.toggle('max-w-lg', !opts.wide);
      gCard.classList.toggle('max-w-2xl', !!opts.wide);
    }
    gOverlay.classList.remove('hidden');
    gOverlay.classList.add('flex');
    document.body.style.overflow = 'hidden';
    refreshIcons();
    if (opts.onOpen) opts.onOpen(gBody, gFoot);
  }
  function closeModal() {
    if (!gOverlay || gOverlay.classList.contains('hidden')) return;
    gOverlay.classList.add('hidden');
    gOverlay.classList.remove('flex');
    document.body.style.overflow = '';
  }
  document.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-close-modal]')) closeModal();
  });
  if (gOverlay) gOverlay.addEventListener('click', function (ev) { if (ev.target === gOverlay) closeModal(); });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { closeAllDrops(); closeModal(); closeNotifPanel(); }
    if (ev.key === '/' && !/input|textarea|select/i.test((document.activeElement || {}).tagName || '')) {
      var s = $('#global-search') || $('#global-search-mobile');
      if (s) { ev.preventDefault(); s.focus(); }
    }
  });

  var BTN_PRIMARY = 'flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-moss-600 py-2.5 text-[13px] font-bold text-white transition hover:brightness-110 active:scale-[.99]';
  var BTN_GHOST = 'flex-1 rounded-xl border border-emerald-900/10 py-2.5 text-[13px] font-bold text-slate-600 transition hover:bg-cream dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5';
  var BTN_DANGER = 'flex-1 rounded-xl bg-rose-600 py-2.5 text-[13px] font-bold text-white transition hover:bg-rose-700 active:scale-[.99]';
  var INPUT_CLS = 'w-full rounded-xl border border-emerald-900/10 bg-white px-3 py-2.5 text-[13px] font-semibold text-pine-700 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-pine-800 dark:text-white';
  var LABEL_CLS = 'mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400';

  function detailRows(row, fields) {
    return '<dl class="divide-y divide-emerald-900/5 text-[13px] dark:divide-white/5">' + fields.map(function (f) {
      var v = row[f.key];
      var html = f.pill ? pill(v) : (f.render ? f.render(v, row) : '<span class="font-bold text-pine-700 dark:text-white">' + esc(v) + '</span>');
      return '<div class="flex items-center justify-between gap-3 py-2.5"><dt class="font-medium text-slate-500 dark:text-slate-400">' + esc(f.label) + '</dt><dd class="text-right">' + html + '</dd></div>';
    }).join('') + '</dl>';
  }

  function formHTML(fields, values) {
    values = values || {};
    return '<div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">' + fields.map(function (f) {
      var val = values[f.name] != null ? values[f.name] : (f.value || '');
      var ctl;
      if (f.type === 'location') {
        ctl = '<div data-loc-picker>' +
          '<div data-loc-map class="h-48 w-full overflow-hidden rounded-xl border border-emerald-900/10 dark:border-white/10"></div>' +
          '<p class="mt-1.5 text-[11px] font-medium text-slate-400">Klik peta atau seret penanda untuk memilih titik lokasi.</p>' +
          '<div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">' +
          '<label class="block"><span class="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">Latitude</span><input name="lat" data-loc="lat" readonly value="' + esc(values.lat || '') + '" placeholder="-6.359700" class="' + INPUT_CLS + ' num"></label>' +
          '<label class="block"><span class="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">Longitude</span><input name="lng" data-loc="lng" readonly value="' + esc(values.lng || '') + '" placeholder="107.144400" class="' + INPUT_CLS + ' num"></label></div>' +
          '<label class="mt-2 block"><span class="mb-1 block text-[11px] font-bold text-slate-500 dark:text-slate-400">Alamat Lokasi</span><input name="address" data-loc="addr" value="' + esc(values.address || values.location || '') + '" placeholder="Alamat terisi otomatis dari titik..." class="' + INPUT_CLS + '"></label>' +
          '<p data-loc-note class="mt-1.5 hidden text-[11px] font-semibold text-amber-600 dark:text-amber-400"></p></div>';
      }
      else if (f.type === 'select') {
        ctl = '<select name="' + f.name + '" class="' + INPUT_CLS + '">' + (f.options || []).map(function (o) {
          var ov = Array.isArray(o) ? o[0] : o, ot = Array.isArray(o) ? o[1] : o;
          return '<option value="' + esc(ov) + '"' + (String(ov) === String(val) ? ' selected' : '') + '>' + esc(ot) + '</option>';
        }).join('') + '</select>';
      } else if (f.type === 'textarea') {
        ctl = '<textarea name="' + f.name + '" rows="2" placeholder="' + esc(f.placeholder || '') + '" class="' + INPUT_CLS + '">' + esc(val) + '</textarea>';
      } else {
        ctl = '<input name="' + f.name + '" type="' + (f.type || 'text') + '" value="' + esc(val) + '" placeholder="' + esc(f.placeholder || '') + '" class="' + INPUT_CLS + '"' + (f.min != null ? ' min="' + f.min + '"' : '') + ' />';
      }
      return '<label class="block' + (f.full ? ' sm:col-span-2' : '') + '"><span class="' + LABEL_CLS + '">' + esc(f.label) + '</span>' + ctl + '</label>';
    }).join('') + '</div>';
  }
  function collectForm(body) {
    var out = {};
    $$('input[name], select[name], textarea[name]', body).forEach(function (el) { out[el.name] = el.value.trim(); });
    return out;
  }
  function initLocationPicker(body, row) {
    var wrap = body.querySelector('[data-loc-picker]');
    if (!wrap) return;
    var latI = wrap.querySelector('[data-loc="lat"]'), lngI = wrap.querySelector('[data-loc="lng"]'),
        addrI = wrap.querySelector('[data-loc="addr"]'), note = wrap.querySelector('[data-loc-note]');
    function say(m) { if (note) { note.textContent = m; note.classList.toggle('hidden', !m); } }
    var lat = parseFloat(row.lat), lng = parseFloat(row.lng);
    if (isNaN(lat) || isNaN(lng)) { lat = -6.3597; lng = 107.1444; }
    function revgeo(la, ln) {
      if (!window.fetch) return;
      say('Mencari alamat...');
      fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + la.toFixed(6) + '&lon=' + ln.toFixed(6))
        .then(function (r) { return r.json(); })
        .then(function (j) { say(''); if (j && j.display_name && addrI) addrI.value = j.display_name; })
        .catch(function () { say('Alamat otomatis tidak tersedia (offline). Silakan isi manual.'); });
    }
    if (!window.L) {
      say('Peta tidak dapat dimuat (offline). Isi koordinat manual.');
      if (latI) latI.removeAttribute('readonly');
      if (lngI) lngI.removeAttribute('readonly');
      return;
    }
    var map = window.L.map(wrap.querySelector('[data-loc-map]')).setView([lat, lng], 13);
    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    var mk = window.L.marker([lat, lng], { draggable: true }).addTo(map);
    function sync(p, geo) {
      if (latI) latI.value = p.lat.toFixed(6);
      if (lngI) lngI.value = p.lng.toFixed(6);
      if (geo) revgeo(p.lat, p.lng);
    }
    mk.on('dragend', function () { sync(mk.getLatLng(), true); });
    map.on('click', function (e) { mk.setLatLng(e.latlng); sync(e.latlng, true); });
    if (row.lat && row.lng) sync({ lat: parseFloat(row.lat), lng: parseFloat(row.lng) }, false);
    setTimeout(function () { map.invalidateSize(); }, 80);
  }
  function setSelectVal(sel, val) {
    if (!sel || val == null) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === String(val) || sel.options[i].text === String(val)) { sel.selectedIndex = i; return; }
    }
  }

  function confirmDelete(label, onYes) {
    openModal({
      title: 'Hapus data',
      body: '<div class="flex flex-col items-center py-2 text-center">' +
        '<span class="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-400/10"><i data-lucide="trash-2" class="h-5 w-5"></i></span>' +
        '<p class="mt-3 text-sm font-bold text-pine-700 dark:text-white">Apakah Anda yakin ingin menghapus data ini?</p>' +
        '<p class="mt-1 text-[13px] text-slate-500 dark:text-slate-400"></p></div>',
      foot: '<button type="button" data-close-modal class="' + BTN_GHOST + '">Batal</button>' +
        '<button type="button" data-confirm-yes class="' + BTN_DANGER + '">Hapus</button>',
      onOpen: function (body, foot) {
        body.querySelector('p + p').textContent = label;
        foot.querySelector('[data-confirm-yes]').addEventListener('click', function () { closeModal(); onYes(); });
      },
    });
  }

  /* ================= PART 2: data tables ================= */
  var LABELS = { dormitories: 'Asrama', buildings: 'Gedung', floors: 'Lantai', rooms: 'Kamar', employees: 'Karyawan', meters: 'Meter', dcus: 'DCU', tokens: 'Token', transactions: 'Transaksi', payments: 'Pembayaran', tariffs: 'Tarif', notifications: 'Notifikasi', users: 'Pengguna', roles: 'Peran', tokenreports: 'Laporan Token', consumption: 'Konsumsi Energi', trxreports: 'Transaksi', payreports: 'Pembayaran', meterreports: 'Laporan Meter', incidents: 'Insiden' };
  /* Hierarchy counters (Dormitory -> Building -> Floor -> Room), always live. */
  function numCell(n) { return '<span class="num font-bold text-pine-700 dark:text-white">' + n + '</span>'; }
  function roomsIn(dorm, building, number, status) {
    return DB('rooms').filter(function (r) {
      return (!dorm || r.dorm === dorm) && (!building || r.building === building) &&
        (!number || r.floor === number) && (!status || r.status === status);
    }).length;
  }
  function buildingsIn(dorm) { return DB('buildings').filter(function (b) { return b.dorm === dorm; }).length; }
  function floorsIn(dorm, building) {
    return DB('floors').filter(function (f) { return (!dorm || f.dorm === dorm) && (!building || f.building === building); }).length;
  }
  function dormOf() { return DB('dorms')[0] || {}; }
  function roomCode(no) { return 'GYS-ROOM-' + String(no || '').replace(/-/g, ''); }
  function dcuMeters(id) { return DB('meters').filter(function (m) { return m.dcu === id; }).length; }
  function floorsOf(bcode) { return DB('floors').filter(function (f) { return f.building === bcode; }).map(function (f) { return f.number; }); }
  function roomsOf(bcode, num, noTenant) {
    return DB('rooms').filter(function (r) {
      if (r.building !== bcode || String(r.floor) !== String(num)) return false;
      if (noTenant && r.tenant) return false;
      return true;
    }).map(function (r) { return r.room; });
  }
  function dormRec(key) { return DB('dorms').filter(function (x) { return x.code === key || x.name === key; })[0] || null; }
  function buildingsOf(dormKey) { var d = dormRec(dormKey); return DB('buildings').filter(function (b) { return !d || b.dorm === d.name || b.dorm === d.code; }); }
  function roomsInBuilding(bcode) { return DB('rooms').filter(function (r) { return r.building === bcode; }).map(function (r) { return r.room; }); }
  function dcusOf(building) { return DB('dcus').filter(function (d) { return (d.building || dcuBuilding(d.id)) === building; }).map(function (d) { return d.id; }); }
  function roomOccupants(roomNo) { return DB('employees').filter(function (e) { return e.room === roomNo; }); }
  function placedRoomOf(empRow) { return DB('rooms').filter(function (x) { return x.room === empRow.room; })[0] || null; }
  var MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  function periodKeyOf(dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'); }
  function periodLabelOf(dt) { return MONTHS_ID[dt.getMonth()] + ' ' + dt.getFullYear(); }
  function currentTokenPeriod() {
    var best = '';
    DB('monthlyTokens').forEach(function (t) { if (t.period > best) best = t.period; });
    return best || periodKeyOf(now);
  }
  function tokenFor(empId, period) { return DB('monthlyTokens').filter(function (t) { return t.empId === empId && t.period === period; })[0] || null; }
  function currentTokenFor(empId) { return tokenFor(empId, currentTokenPeriod()); }
  function tokenHistory(empId) {
    return DB('monthlyTokens').filter(function (t) { return t.empId === empId; }).sort(function (a, b) { return a.period < b.period ? 1 : -1; });
  }
  function derivePlacement(row) {
    var rm = placedRoomOf(row);
    row.meter = rm ? rm.meter : '-';
    row.occupancy = (row.room && row.room !== '-') ? 'Occupied' : 'Available';
    return rm;
  }
  function syncRoomPlacement(row, prevRoom) {
    function vacate(rno) {
      if (!rno || rno === '-') return;
      var still = DB('employees').some(function (e) { return e.id !== row.id && e.room === rno; });
      if (still) return;
      var rm = DB('rooms').filter(function (x) { return x.room === rno; })[0];
      if (!rm) return;
      rm.employee = '-'; rm.empId = '-';
      if (rm.status === 'Occupied') rm.status = 'Available';
    }
    if (prevRoom && prevRoom !== row.room) vacate(prevRoom);
    if (row.room && row.room !== '-') {
      var rm2 = DB('rooms').filter(function (x) { return x.room === row.room; })[0];
      if (rm2) {
        rm2.employee = row.name; rm2.empId = row.id;
        if (rm2.status === 'Available') rm2.status = 'Occupied';
        var mt2 = DB('meters').filter(function (x) { return x.id === rm2.meter; })[0];
        if (mt2) mt2.employee = row.name;
      }
    }
  }
  var AVATARS = ['from-emerald-500 to-pine-700', 'from-teal-400 to-emerald-700', 'from-amber-400 to-orange-600', 'from-sky-400 to-teal-600', 'from-emerald-400 to-teal-700'];
  function avatarHTML(name, initials) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AVATARS.length;
    var ini = initials || name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
    return '<span class="flex items-center gap-2.5"><span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[11px] font-extrabold text-white ' + AVATARS[h] + '">' + esc(ini) + '</span><strong class="font-bold text-pine-700 dark:text-white">' + esc(name) + '</strong></span>';
  }

  var TABLES = {
    dormitories: { data: 'dorms', idKey: 'id', searchKeys: ['id', 'code', 'name', 'alias', 'location', 'lat', 'lng'],
      columns: [
        { key: 'code', label: 'Kode Asrama', mono: true, bold: true },
        { key: 'name', label: 'Nama Asrama', bold: true, sub: 'alias' },
        { key: 'location', label: 'Lokasi' },
        { key: 'lat', label: 'Latitude', num: true, mono: true },
        { key: 'lng', label: 'Longitude', num: true, mono: true },
        { key: 'status', label: 'Status', pill: true },
      ], actions: ['view', 'edit', 'delete'] },
    buildings: { data: 'buildings', idKey: 'id', searchKeys: ['id', 'code', 'name', 'dorm'],
      columns: [
        { key: 'code', label: 'Kode Gedung', mono: true, bold: true },
        { key: 'name', label: 'Nama Gedung', bold: true },
        { key: '_loc', label: 'Lokasi', render: function () { return '<span class="text-slate-600 dark:text-slate-300">' + esc(dormOf().location || '-') + '</span>'; } },
        { key: '_lat', label: 'Latitude', render: function () { return '<span class="num whitespace-nowrap font-mono text-[12px] text-slate-600 dark:text-slate-300">' + esc(dormOf().lat || '-') + '</span>'; } },
        { key: '_lng', label: 'Longitude', render: function () { return '<span class="num whitespace-nowrap font-mono text-[12px] text-slate-600 dark:text-slate-300">' + esc(dormOf().lng || '-') + '</span>'; } },
        { key: 'status', label: 'Status', pill: true },
      ], actions: ['view', 'edit', 'delete'] },
    floors: { data: 'floors', idKey: 'id', searchKeys: ['id', 'code', 'dorm', 'building'],
      columns: [
        { key: 'code', label: 'Kode Lantai', mono: true, bold: true },
        { key: 'number', label: 'Lantai', bold: true },
        { key: 'building', label: 'Gedung' },
        { key: 'status', label: 'Status', pill: true },
      ], actions: ['view', 'edit', 'delete'] },
    rooms: { data: 'rooms', idKey: 'id', searchKeys: ['id', 'room', 'employee', 'dorm', 'building', 'meter'],
      columns: [
        { key: '_rcode', label: 'Kode Kamar', render: function (v, r) { return '<span class="font-mono text-[12px] font-bold text-pine-700 dark:text-white">' + esc(roomCode(r.room)) + '</span>'; } },
        { key: 'room', label: 'Nomor Kamar', bold: true },
        { key: 'building', label: 'Gedung' }, { key: 'floor', label: 'Lantai' },
        { key: 'capacity', label: 'Kapasitas', num: true },
        { key: 'status', label: 'Status', pill: true },
      ], actions: ['view', 'edit', 'delete'] },
    employees: { data: 'employees', idKey: 'id', searchKeys: ['id', 'name', 'dept', 'dorm', 'room', 'meter'],
      columns: [
        { key: 'id', label: 'ID Karyawan', mono: true, bold: true },
        { key: 'name', label: 'Nama', bold: true },
        { key: '_place', label: 'Penempatan', render: function (v, r) {
          var rm = placedRoomOf(r);
          if (!rm) return '<span class="text-slate-300 dark:text-slate-600">—</span>';
          return '<span class="font-bold text-pine-700 dark:text-white">' + esc(rm.room) + '</span>' +
            '<span class="block text-[11px] font-medium text-slate-400">' + esc(buildingName(rm.building)) + ' · Lantai ' + esc(rm.floor) + '</span>';
        } },
        { key: '_token', label: 'Token Bulan Ini', render: function (v, r) {
          var t = currentTokenFor(r.id);
          if (!t) return '<span class="text-slate-300 dark:text-slate-600">—</span>';
          return '<span class="num block text-[13px] font-bold text-pine-700 dark:text-white">' + idr(t.amount) + '</span><span class="mt-1 block">' + pill(t.status) + '</span>';
        } },
        { key: 'account', label: 'Status', pill: true }, { key: 'occupancy', label: 'Hunian', pill: true },
      ], actions: ['view', 'edit', 'delete'] },
    meters: { data: 'meters', idKey: 'id', searchKeys: ['id', 'sn', 'room', 'employee', 'dcu', 'dorm', 'building'],
      columns: [
        { key: 'id', label: 'Meter ID', mono: true, bold: true },
        { key: 'sn', label: 'Nomor Seri', mono: true },
        { key: 'dcu', label: 'DCU', mono: true },
        { key: 'building', label: 'Gedung', render: function (v) { return '<span class="text-slate-600 dark:text-slate-300">' + esc(buildingName(v)) + '</span>'; } },
        { key: 'floor', label: 'Lantai', render: function (v) { return '<span class="whitespace-nowrap text-slate-600 dark:text-slate-300">Lantai ' + esc(v) + '</span>'; } },
        { key: 'room', label: 'Kamar', bold: true },
        { key: 'status', label: 'Status', pill: true }, { key: 'updated', label: 'Terakhir Diperbarui', num: true },
      ], actions: ['view', 'connect', 'disconnect', 'recharge', 'edit', 'delete'] },
    dcus: { data: 'dcus', idKey: 'id', searchKeys: ['id', 'name', 'location', 'ip'],
      columns: [
        { key: 'id', label: 'ID DCU', mono: true, bold: true }, { key: 'name', label: 'Nama Perangkat', bold: true },
        { key: '_bld', label: 'Gedung', render: function (v, r) { return '<span class="text-slate-600 dark:text-slate-300">' + esc(r.building || dcuBuilding(r.id)) + '</span>'; } },
        { key: '_meters', label: 'Meter', render: function (v, r) { return numCell(dcuMeters(r.id)); } },
        { key: 'ip', label: 'Alamat IP', mono: true }, { key: 'lastComm', label: 'Kom. Terakhir', num: true },
        { key: 'status', label: 'Status', pill: true },
      ], actions: ['view', 'edit', 'delete'] },
    tokens: { data: 'tokens', idKey: 'id', searchKeys: ['id', 'no', 'employee', 'room', 'meter'],
      columns: [
        { key: 'id', label: 'ID Token', mono: true },
        { key: 'no', label: 'Nomor Token', mono: true, bold: true },
        { key: 'employee', label: 'Karyawan' }, { key: 'room', label: 'Kamar' }, { key: 'meter', label: 'Meter', mono: true },
        { key: 'amount', label: 'Jumlah', num: true, bold: true, render: function (v) { return '<span class="num font-bold text-pine-700 dark:text-white">' + idr(v) + '</span>'; } },
        { key: 'kwh', label: 'Energi', num: true, render: function (v) { return '<span class="num text-slate-600 dark:text-slate-300">' + kwh(v) + '</span>'; } },
        { key: 'status', label: 'Status', pill: true }, { key: 'created', label: 'Waktu Dibuat', num: true },
      ], actions: ['view', 'resend', 'copy', 'delete'] },
    transactions: { data: 'transactions', idKey: 'id', searchKeys: ['id', 'employee', 'room', 'meter', 'method', 'token'],
      columns: [
        { key: 'id', label: 'ID Transaksi', mono: true, bold: true }, { key: 'date', label: 'Tanggal', num: true },
        { key: 'employee', label: 'Karyawan', bold: true }, { key: 'room', label: 'Kamar' }, { key: 'meter', label: 'Meter', mono: true },
        { key: 'amount', label: 'Jumlah', num: true, bold: true, render: function (v) { return '<span class="num font-bold text-pine-700 dark:text-white">' + idr(v) + '</span>'; } },
        { key: 'method', label: 'Metode' }, { key: 'status', label: 'Status', pill: true },
      ], actions: ['view', 'edit', 'delete'] },
    payments: { data: 'payments', idKey: 'id', searchKeys: ['id', 'employee', 'method'],
      columns: [
        { key: 'id', label: 'ID Pembayaran', mono: true, bold: true }, { key: 'employee', label: 'Karyawan', bold: true },
        { key: 'method', label: 'Metode' },
        { key: 'amount', label: 'Jumlah', num: true, render: function (v) { return '<span class="num text-slate-600 dark:text-slate-300">' + idr(v) + '</span>'; } },
        { key: 'fee', label: 'Biaya Admin', num: true, render: function (v) { return '<span class="num text-slate-600 dark:text-slate-300">' + idr(v) + '</span>'; } },
        { key: 'total', label: 'Total', num: true, bold: true, render: function (v) { return '<span class="num font-bold text-pine-700 dark:text-white">' + idr(v) + '</span>'; } },
        { key: 'status', label: 'Status', pill: true }, { key: 'date', label: 'Tanggal', num: true },
      ], actions: ['view', 'edit', 'delete'] },
    tariffs: { data: 'tariffs', idKey: 'id', searchKeys: ['id', 'price', 'status'],
      columns: [
        { key: 'id', label: 'ID Tarif', mono: true, bold: true }, { key: 'effective', label: 'Tanggal Berlaku', num: true },
        { key: 'price', label: 'Harga Energi', bold: true }, { key: 'fee', label: 'Biaya Admin' },
        { key: 'min', label: 'Min. Isi Ulang' }, { key: 'max', label: 'Maks. Isi Ulang' },
        { key: 'status', label: 'Status', pill: true },
      ], actions: ['view', 'edit', 'delete'] },
    notifications: { data: 'notifications', idKey: 'id', searchKeys: ['title', 'desc', 'type', 'recipient', 'channel'],
      columns: [
        { key: 'title', label: 'Notifikasi', bold: true, sub: 'desc' },
        { key: 'type', label: 'Jenis' }, { key: 'recipient', label: 'Penerima' }, { key: 'channel', label: 'Kanal' },
        { key: 'status', label: 'Status', pill: true }, { key: 'created', label: 'Dibuat', num: true },
      ], actions: ['view', 'delete'] },
    users: { data: 'users', idKey: 'id', searchKeys: ['name', 'id', 'email', 'role', 'dorm'],
      columns: [
        { key: 'id', label: 'ID Pengguna', mono: true, bold: true },
        { key: 'name', label: 'Nama', render: function (v, r) { return avatarHTML(v, r.initials); } },
        { key: 'email', label: 'Email' }, { key: 'role', label: 'Peran', bold: true },
        { key: 'status', label: 'Status', pill: true }, { key: 'login', label: 'Login Terakhir', num: true },
      ], actions: ['view', 'edit', 'delete'] },
    roles: { data: 'roles', idKey: 'id', searchKeys: ['id', 'name', 'desc'],
      columns: [
        { key: 'id', label: 'ID Peran', mono: true, bold: true }, { key: 'name', label: 'Nama Peran', bold: true },
        { key: 'desc', label: 'Deskripsi' },
        { key: 'id', label: 'Pengguna', num: true, bold: true, render: function (v, r) { return numCell(DB('users').filter(function (u) { return u.role === r.name; }).length); } },
        { key: 'id', label: 'Akses', render: function (v, r) { return accessCell(r); } },
        { key: 'status', label: 'Status', pill: true },
      ], actions: ['edit', 'delete', 'access'] },
    tokenreports: { data: 'tokenreports', idKey: 'id', searchKeys: ['trx', 'token', 'employee', 'room', 'meter'],
      columns: [
        { key: 'trx', label: 'ID Transaksi', mono: true, bold: true }, { key: 'token', label: 'Nomor Token', mono: true },
        { key: 'employee', label: 'Karyawan / Tenant', bold: true }, { key: 'room', label: 'Kamar' }, { key: 'meter', label: 'Meter', mono: true },
        { key: 'amount', label: 'Jumlah Token', num: true, bold: true, render: function (v) { return '<span class="num font-bold text-pine-700 dark:text-white">' + idr(v) + '</span>'; } },
        { key: 'kwh', label: 'Energi', num: true, render: function (v) { return '<span class="num text-slate-600 dark:text-slate-300">' + kwh(v) + '</span>'; } },
        { key: 'date', label: 'Tanggal', num: true }, { key: 'status', label: 'Status', pill: true },
      ], actions: ['view'] },
    consumption: { data: 'consumption', idKey: 'id', searchKeys: ['meter', 'room', 'building'],
      columns: [
        { key: 'meter', label: 'Meter', mono: true, bold: true }, { key: 'room', label: 'Kamar', bold: true }, { key: 'building', label: 'Gedung' },
        { key: 'reading', label: 'Pembacaan Terakhir', num: true }, { key: 'usage', label: 'Pemakaian Saat Ini', num: true, bold: true },
        { key: 'credit', label: 'Kredit', num: true }, { key: 'status', label: 'Status', pill: true },
      ], actions: ['view'] },
    trxreports: { data: 'trxreports', idKey: 'id', searchKeys: ['id', 'employee', 'room', 'meter', 'method'],
      columns: [
        { key: 'id', label: 'ID Transaksi', mono: true, bold: true }, { key: 'date', label: 'Tanggal', num: true },
        { key: 'employee', label: 'Karyawan', bold: true }, { key: 'room', label: 'Kamar' }, { key: 'meter', label: 'Meter', mono: true },
        { key: 'amount', label: 'Jumlah', num: true, bold: true, render: function (v) { return '<span class="num font-bold text-pine-700 dark:text-white">' + idr(v) + '</span>'; } },
        { key: 'method', label: 'Metode' }, { key: 'status', label: 'Status', pill: true },
      ], actions: ['view'] },
    payreports: { data: 'payreports', idKey: 'id', searchKeys: ['id', 'employee', 'method'],
      columns: [
        { key: 'id', label: 'ID Pembayaran', mono: true, bold: true }, { key: 'employee', label: 'Karyawan', bold: true },
        { key: 'method', label: 'Metode' },
        { key: 'amount', label: 'Jumlah', num: true, render: function (v) { return '<span class="num text-slate-600 dark:text-slate-300">' + idr(v) + '</span>'; } },
        { key: 'fee', label: 'Biaya Admin', num: true, render: function (v) { return '<span class="num text-slate-600 dark:text-slate-300">' + idr(v) + '</span>'; } },
        { key: 'total', label: 'Total', num: true, bold: true, render: function (v) { return '<span class="num font-bold text-pine-700 dark:text-white">' + idr(v) + '</span>'; } },
        { key: 'status', label: 'Status', pill: true }, { key: 'date', label: 'Tanggal', num: true },
      ], actions: ['view'] },
    meterreports: { data: 'meterreports', idKey: 'id', searchKeys: ['id', 'sn', 'room', 'dcu'],
      columns: [
        { key: 'id', label: 'Meter', mono: true, bold: true }, { key: 'sn', label: 'Nomor Seri', mono: true },
        { key: 'room', label: 'Kamar', bold: true }, { key: 'dcu', label: 'DCU', mono: true },
        { key: 'status', label: 'Status', pill: true }, { key: 'installed', label: 'Terpasang', num: true }, { key: 'updated', label: 'Kom. Terakhir', num: true },
      ], actions: ['view'] },
    incidents: { data: 'incidents', idKey: 'id', searchKeys: ['id', 'room', 'device', 'desc', 'type'],
      columns: [
        { key: 'id', label: 'ID Laporan', mono: true, bold: true }, { key: 'ts', label: 'Tanggal & Waktu', num: true },
        { key: 'type', label: 'Jenis', bold: true }, { key: 'room', label: 'Kamar' }, { key: 'device', label: 'Perangkat', mono: true },
        { key: 'desc', label: 'Deskripsi' },
        { key: 'priority', label: 'Prioritas', render: function (v) {
          var c = v === 'Kritis' ? 'text-rose-600 dark:text-rose-300' : v === 'Tinggi' ? 'text-amber-600 dark:text-amber-300' : v === 'Sedang' ? 'text-sky-600 dark:text-sky-300' : 'text-slate-500 dark:text-slate-400';
          return '<span class="font-bold ' + c + '">' + esc(v) + '</span>';
        } },
        { key: 'status', label: 'Status', pill: true }, { key: 'handledBy', label: 'Ditangani Oleh' }, { key: 'handledAt', label: 'Waktu Penanganan', num: true },
      ], actions: ['view', 'resolve'] },
  };

  var ACTS = {
    view: { icon: 'eye', title: 'Lihat detail' }, edit: { icon: 'pencil', title: 'Ubah' },
    delete: { icon: 'trash-2', title: 'Hapus', danger: true }, connect: { icon: 'plug-zap', title: 'Hubungkan' },
    disconnect: { icon: 'unplug', title: 'Putuskan' }, recharge: { icon: 'battery-charging', title: 'Isi ulang' },
    resend: { icon: 'send', title: 'Kirim ulang token' }, copy: { icon: 'copy', title: 'Salin token' },
    access: { icon: 'key-round', title: 'Ubah Akses' },
    resolve: { icon: 'wrench', title: 'Tangani / Selesaikan' },
  };
  var CHIP = {};
  var globalTerm = '';

  function cellHTML(col, row) {
    if (col.render) return col.render(row[col.key], row);
    if (col.pill) return pill(row[col.key]);
    var cls = col.mono ? 'font-mono text-[12px] ' : '';
    cls += col.bold ? 'font-bold text-pine-700 dark:text-white' : 'text-slate-600 dark:text-slate-300';
    if (col.num) cls += ' num whitespace-nowrap';
    var main = '<span class="' + cls + '">' + esc(row[col.key]) + '</span>';
    if (col.sub && row[col.sub] && row[col.sub] !== '-') main += '<span class="block text-[11px] font-medium text-slate-400">' + esc(row[col.sub]) + '</span>';
    return main;
  }

  function rowMatches(row, cfg, terms, filters) {
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      var hit = cfg.searchKeys.some(function (k) { return String(row[k] == null ? '' : row[k]).toLowerCase().indexOf(t) !== -1; });
      if (!hit) return false;
    }
    for (var j = 0; j < filters.length; j++) {
      var f = filters[j];
      if (f.value && String(row[f.key]).toLowerCase() !== f.value) return false;
    }
    return true;
  }

  var DATE_KEY = { incidents: 'ts', transactions: 'date' };
  var MON2 = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Mei: '05', Jun: '06', Jul: '07', Aug: '08', Agu: '08', Sep: '09', Oct: '10', Okt: '10', Nov: '11', Dec: '12', Des: '12' };
  function toISODate(s) {
    s = String(s == null ? '' : s);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    var m = s.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
    if (!m || !MON2[m[2]]) return '';
    return m[3] + '-' + MON2[m[2]] + '-' + ('0' + m[1]).slice(-2);
  }
  function trxToday() {
    var max = '';
    DB('transactions').forEach(function (r) { var d = toISODate(r.date); if (d > max) max = d; });
    return max;
  }
  function engineCriteria(entity) {
    var terms = [];
    var local = document.querySelector('[data-search-for="' + entity + '"]');
    if (local && local.value.trim()) terms.push(local.value.trim().toLowerCase());
    if (globalTerm) terms.push(globalTerm);
    var filters = $$('[data-filter-for="' + entity + '"]').map(function (s) {
      return { key: s.getAttribute('data-filter-key'), value: s.value.trim().toLowerCase() };
    });
    if (CHIP[entity]) Object.keys(CHIP[entity]).forEach(function (k) {
      if (CHIP[entity][k]) filters.push({ key: k, value: CHIP[entity][k].toLowerCase() });
    });
    var df = document.querySelector('[data-date-from="' + entity + '"]'), dt = document.querySelector('[data-date-to="' + entity + '"]');
    var psel = document.querySelector('[data-period-for="' + entity + '"]');
    return { terms: terms, filters: filters, from: df ? df.value : '', to: dt ? dt.value : '', period: psel ? psel.value : '' };
  }
  function filterEngineRows(entity) {
    var cfg = TABLES[entity], c = engineCriteria(entity);
    var rows = DB(cfg.data).filter(function (r) { return rowMatches(r, cfg, c.terms, c.filters); });
    var dk = DATE_KEY[entity];
    if (dk) {
      var today = entity === 'transactions' ? trxToday() : '';
      rows = rows.filter(function (r) {
        var d = toISODate(r[dk]);
        if (c.period === 'today' && d !== today) return false;
        if (c.period === 'yesterday' && d !== auditAddDays(today, -1)) return false;
        if (c.period === '7d' && d < auditAddDays(today, -6)) return false;
        if (c.period === '30d' && d < auditAddDays(today, -29)) return false;
        if (c.period === 'custom' || !c.period) {
          if (c.from && d < c.from) return false;
          if (c.to && d > c.to) return false;
        }
        return true;
      });
    }
    return rows;
  }
  function renderTable(entity) {
    var cfg = TABLES[entity];
    if (entity === 'meters') renderMeterHier();
    var tbody = document.getElementById('tbl-' + entity);
    if (!cfg || !tbody) return;
    var rows = filterEngineRows(entity);
    var total = rows.length, shown = rows;
    var count = document.querySelector('[data-count-for="' + entity + '"]');
    if (PAGINATED.indexOf(entity) > -1) {
      var st = pagerState(entity);
      var per = st.per === 'all' ? Math.max(total, 1) : st.per;
      var pages = Math.max(1, Math.ceil(total / per));
      if (st.page > pages) st.page = pages;
      if (st.page < 1) st.page = 1;
      shown = rows.slice((st.page - 1) * per, st.page * per);
      if (count) count.textContent = total === 0 ? 'Menampilkan 0 dari 0' : 'Menampilkan ' + ((st.page - 1) * per + 1) + '–' + Math.min(st.page * per, total) + ' dari ' + total;
      paintPager(entity, pages, st.page);
    } else if (count) {
      count.textContent = rows.length + ' dari ' + DB(cfg.data).length + ' data';
    }
    tbody.innerHTML = '';
    shown.forEach(function (row) {
      var tr = document.createElement('tr');
      tr.className = 'transition hover:bg-mint-50/60 dark:hover:bg-white/[0.03]';
      var tds = cfg.columns.map(function (c, idx) {
        var pad = idx === 0 ? 'px-5 ' : 'px-3 ';
        return '<td class="' + pad + 'py-3 text-[13px]">' + cellHTML(c, row) + '</td>';
      }).join('');
      var btns = cfg.actions.filter(function (a) { return a !== 'resolve' || row.status !== 'Resolved'; }).map(function (a) {
        var d = ACTS[a];
        var cls = d.danger
          ? 'text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-400/10'
          : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-white/10 dark:hover:text-emerald-300';
        return '<button type="button" data-act="' + a + '" data-id="' + esc(row[cfg.idKey]) + '" title="' + d.title + '" aria-label="' + d.title + ' ' + esc(row[cfg.idKey]) + '" class="grid h-8 w-8 place-items-center rounded-lg transition ' + cls + '"><i data-lucide="' + d.icon + '" class="h-4 w-4"></i></button>';
      }).join('');
      tds += '<td class="px-5 py-3"><span class="flex items-center justify-end gap-0.5">' + btns + '</span></td>';
      tr.innerHTML = tds;
      tbody.appendChild(tr);
    });
    var empty = document.querySelector('[data-empty-for="' + entity + '"]');
    if (empty) empty.classList.toggle('hidden', total > 0);
    refreshIcons();
  }

  function findRow(entity, id) {
    var cfg = TABLES[entity];
    var list = DB(cfg.data);
    for (var i = 0; i < list.length; i++) if (String(list[i][cfg.idKey]) === String(id)) return { row: list[i], index: i, list: list };
    return null;
  }

  /* ---------- Reusable pagination for engine tables ---------- */
  var PAGINATED = ['dormitories', 'buildings', 'floors', 'rooms', 'employees', 'meters', 'dcus', 'tokens', 'transactions', 'payments', 'tariffs', 'roles', 'tokenreports', 'consumption', 'trxreports', 'payreports', 'meterreports', 'incidents'];
  var PAGER = {};
  function pagerState(entity) {
    if (!PAGER[entity]) PAGER[entity] = { page: 1, per: 10 };
    return PAGER[entity];
  }
  function pagerReset(entity) { pagerState(entity).page = 1; }
  function pagerHost(entity) {
    var pager = document.querySelector('[data-pager-for="' + entity + '"]');
    if (pager) return pager;
    var count = document.querySelector('[data-count-for="' + entity + '"]');
    var host = count && count.closest ? count.closest('div') : null;
    if (!host) return null;
    pager = document.createElement('div');
    pager.setAttribute('data-pager-for', entity);
    pager.className = 'flex flex-wrap items-center gap-2';
    pager.innerHTML =
      '<label class="inline-flex items-center gap-2 font-semibold">Data per halaman ' +
      '<select data-per-for="' + entity + '" class="rounded-lg border border-emerald-900/10 bg-white px-2 py-1.5 text-xs font-bold text-slate-600 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-pine-800 dark:text-slate-300">' +
      '<option>10</option><option>25</option><option>50</option><option>100</option><option value="all">Semua</option></select></label>' +
      '<button type="button" data-page-for="' + entity + '" data-page="prev" aria-label="Halaman sebelumnya" class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/10"><i data-lucide="chevron-left" class="h-4 w-4"></i></button>' +
      '<span data-pages-for="' + entity + '" class="inline-flex items-center gap-1"></span>' +
      '<button type="button" data-page-for="' + entity + '" data-page="next" aria-label="Halaman berikutnya" class="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/10"><i data-lucide="chevron-right" class="h-4 w-4"></i></button>';
    host.appendChild(pager);
    return pager;
  }
  function pageWindow(pages, cur) {
    var list = [], i;
    if (pages <= 7) { for (i = 1; i <= pages; i++) list.push(i); return list; }
    var keep = [1, 2, cur - 1, cur, cur + 1, pages - 1, pages];
    var nums = keep.filter(function (n, idx) { return n >= 1 && n <= pages && keep.indexOf(n) === idx; }).sort(function (a, b) { return a - b; });
    nums.forEach(function (n, idx) {
      if (idx > 0 && n - nums[idx - 1] > 1) list.push('…');
      list.push(n);
    });
    return list;
  }
  function paintPager(entity, pages, page) {
    var pager = pagerHost(entity);
    if (!pager) return;
    var nums = pager.querySelector('[data-pages-for="' + entity + '"]');
    if (nums) {
      nums.innerHTML = '';
      pageWindow(pages, page).forEach(function (n) {
        if (n === '…') {
          var s = document.createElement('span');
          s.className = 'px-1 text-xs font-bold text-slate-400';
          s.textContent = '…';
          nums.appendChild(s);
          return;
        }
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('data-page-for', entity);
        b.setAttribute('data-page', String(n));
        b.className = 'h-8 min-w-[2rem] rounded-lg px-2 text-xs font-bold transition ' + (n === page
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-white/10');
        b.textContent = String(n);
        nums.appendChild(b);
      });
    }
    var prev = pager.querySelector('[data-page="prev"]'), next = pager.querySelector('[data-page="next"]');
    if (prev) prev.disabled = page <= 1;
    if (next) next.disabled = page >= pages;
    refreshIcons();
  }
  document.addEventListener('click', function (ev) {
    var pg = ev.target.closest('[data-page-for]');
    if (!pg) return;
    var entity = pg.getAttribute('data-page-for');
    if (PAGINATED.indexOf(entity) === -1) return;
    var raw = pg.getAttribute('data-page'), st = pagerState(entity);
    if (raw === 'prev') st.page--;
    else if (raw === 'next') st.page++;
    else st.page = parseInt(raw, 10) || 1;
    renderTable(entity);
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    var sel = t.closest('[data-per-for]');
    if (!sel) return;
    var entity = sel.getAttribute('data-per-for');
    if (PAGINATED.indexOf(entity) === -1) return;
    pagerState(entity).per = sel.value === 'all' ? 'all' : (parseInt(sel.value, 10) || 10);
    pagerState(entity).page = 1;
    renderTable(entity);
  });

  /* ---------- Forms per entity ---------- */
  var DORM_OPTS = ['GYS Employee Dormitory'];
  var BLD_OPTS = ['GYS-BLD-A', 'GYS-BLD-B', 'GYS-BLD-C'];
  var DCU_OPTS = ['GYS-DCU-001', 'GYS-DCU-002', 'GYS-DCU-003', 'GYS-DCU-004', 'GYS-DCU-005', 'GYS-DCU-006'];
  var DEPT_OPTS = ['Produksi', 'Pemeliharaan', 'Teknik', 'Kontrol Kualitas', 'Gudang', 'Logistik', 'TI', 'SDM', 'Keuangan', 'K3', 'Pengadaan'];
  var POS_OPTS = ['Operator', 'Teknisi', 'Foreman', 'Staf', 'Supervisor', 'Insinyur', 'Analis', 'Koordinator', 'Inspektur', 'Administrator'];
  var EMP_NAMES = function () { return ['-'].concat(DB('employees').filter(function (e) { return e.account === 'Active'; }).map(function (e) { return e.name; })); };
  var METER_IDS = function () { return ['-'].concat(DB('meters').map(function (m) { return m.id; })); };
  var OCC_ROOMS = function () { return DB('rooms').filter(function (r) { return r.status === 'Occupied'; }).map(function (r) { return r.room; }); };
  var TXN_EMPS = function () { var out = []; DB('rooms').forEach(function (r) { if (r.status === 'Occupied' && r.employee && r.employee !== '-' && out.indexOf(r.employee) === -1) out.push(r.employee); }); return out; };
  var FORMS = {
    dormitories: [
      { name: 'code', label: 'Kode Asrama', placeholder: 'GYS-DORM-001' },
      { name: 'name', label: 'Nama Asrama', placeholder: 'GYS Employee Dormitory' },
      { name: 'location', label: 'Lokasi', type: 'location', full: true },
      { name: 'status', label: 'Status', type: 'select', options: [['Active', 'Aktif'], ['Inactive', 'Tidak Aktif']] },
    ],
    buildings: [
      { name: 'code', label: 'Kode Gedung', placeholder: 'D1' },
      { name: 'name', label: 'Nama Gedung', placeholder: 'Gedung D1' },
      { name: 'dorm', label: 'Asrama', type: 'select', options: DORM_OPTS },
      { name: 'status', label: 'Status', type: 'select', options: [['Active', 'Aktif'], ['Maintenance', 'Pemeliharaan']] },
    ],
    floors: [
      { name: 'dorm', label: 'Asrama', type: 'select', options: DORM_OPTS },
      { name: 'building', label: 'Gedung', type: 'select', options: BLD_OPTS },
      { name: 'code', label: 'Kode Lantai', placeholder: 'GYS-BLD-A-F02' },
      { name: 'number', label: 'Nomor Lantai', type: 'select', options: ['1', '2', '3'] },
      { name: 'status', label: 'Status', type: 'select', options: [['Active', 'Aktif'], ['Maintenance', 'Pemeliharaan']] },
    ],
    rooms: [
      { name: 'dorm', label: 'Asrama', type: 'select', options: DORM_OPTS },
      { name: 'building', label: 'Gedung', type: 'select', options: BLD_OPTS },
      { name: 'floor', label: 'Lantai', type: 'select', options: ['1', '2', '3'] },
      { name: 'room', label: 'Nomor Kamar', placeholder: 'A-131' },
      { name: 'employee', label: 'Karyawan', type: 'select', options: EMP_NAMES() },
      { name: 'meter', label: 'Meter', type: 'select', options: METER_IDS() },
      { name: 'capacity', label: 'Kapasitas (orang)', type: 'select', options: ['1', '2', '4'] },
      { name: 'status', label: 'Status', type: 'select', options: [['Available', 'Tersedia'], ['Occupied', 'Terisi'], ['Maintenance', 'Pemeliharaan']] },
    ],
    employees: [
      { name: 'name', label: 'Nama Lengkap', placeholder: 'Karyawan baru' },
      { name: 'dorm', label: 'Asrama', type: 'select', options: ['-'].concat(DORM_OPTS) },
      { name: 'building', label: 'Gedung', type: 'select', options: BLD_OPTS },
      { name: 'floor', label: 'Lantai', type: 'select', options: ['1', '2', '3'] },
      { name: 'room', label: 'Kamar', type: 'select', options: ['-'].concat(OCC_ROOMS()) },
      { name: 'account', label: 'Status', type: 'select', options: [['Active', 'Aktif'], ['Inactive', 'Tidak Aktif']] },
    ],
    meters: [
      { name: 'mid', label: 'ID Meter', placeholder: 'GYS-MTR-0045' }, { name: 'sn', label: 'Nomor Seri', placeholder: 'SN-GYS-...' },
      { name: 'dorm', label: 'Asrama', type: 'select', options: DORM_OPTS },
      { name: 'building', label: 'Gedung', type: 'select', options: BLD_OPTS },
      { name: 'dcu', label: 'DCU', type: 'select', options: DCU_OPTS },
      { name: 'room', label: 'Kamar', type: 'select', options: OCC_ROOMS() },
      { name: 'type', label: 'Tipe Meter', type: 'select', options: ['Satu Fasa', 'Tiga Fasa'] },
    ],
    metersEdit: [
      { name: 'sn', label: 'Nomor Seri' }, { name: 'dorm', label: 'Asrama', type: 'select', options: DORM_OPTS },
      { name: 'room', label: 'Kamar' }, { name: 'employee', label: 'Karyawan', type: 'select', options: EMP_NAMES() },
      { name: 'dcu', label: 'DCU', type: 'select', options: DCU_OPTS },
      { name: 'status', label: 'Status', type: 'select', options: [['Online', 'Online'], ['Offline', 'Offline'], ['Warning', 'Peringatan'], ['Maintenance', 'Pemeliharaan']] },
    ],
    dcus: [
      { name: 'name', label: 'Nama Perangkat', placeholder: 'DCU Gedung ...' },
      { name: 'building', label: 'Gedung', type: 'select', options: BLD_OPTS },
      { name: 'location', label: 'Lokasi', placeholder: 'Gedung ...' },
      { name: 'ip', label: 'Alamat IP', placeholder: '10.20.x.x' },
      { name: 'status', label: 'Status', type: 'select', options: [['Online', 'Online'], ['Offline', 'Offline'], ['Warning', 'Peringatan']] },
    ],
    tokens: [
      { name: 'employee', label: 'Karyawan', type: 'select', options: EMP_NAMES().slice(1) },
      { name: 'room', label: 'Kamar', placeholder: 'A-101' },
      { name: 'meter', label: 'Meter', type: 'select', options: METER_IDS().slice(1) },
      { name: 'amount', label: 'Jumlah (Rp)', type: 'select', options: ['50000', '100000', '150000', '200000', '500000'] },
    ],
    transactions: [
      { name: 'employee', label: 'Karyawan', type: 'select', options: TXN_EMPS() },
      { name: 'room', label: 'Kamar', type: 'select', options: OCC_ROOMS() }, { name: 'meter', label: 'Meter', type: 'select', options: METER_IDS().slice(1) },
      { name: 'amount', label: 'Jumlah (Rp)', type: 'number', value: '50000' },
      { name: 'method', label: 'Metode Pembayaran', type: 'select', options: ['QRIS', 'Virtual Account', 'E-Wallet', 'Payroll Deduction'] },
      { name: 'status', label: 'Status', type: 'select', options: [['Successful', 'Berhasil'], ['Pending', 'Menunggu'], ['Failed', 'Gagal']] },
    ],
    payments: [
      { name: 'employee', label: 'Karyawan', type: 'select', options: EMP_NAMES().slice(1) },
      { name: 'method', label: 'Metode', type: 'select', options: ['QRIS', 'Virtual Account', 'E-Wallet', 'Payroll Deduction'] },
      { name: 'amount', label: 'Jumlah (Rp)', type: 'number', value: '50000' },
      { name: 'status', label: 'Status', type: 'select', options: [['Successful', 'Berhasil'], ['Pending', 'Menunggu'], ['Failed', 'Gagal']] },
    ],
    tariffs: [
      { name: 'price', label: 'Harga Energi (Rp / kWh)', type: 'number', value: '1500' },
      { name: 'fee', label: 'Biaya Admin (Rp)', type: 'number', value: '2500' },
      { name: 'min', label: 'Minimal Isi Ulang (Rp)', type: 'number', value: '50000' },
      { name: 'max', label: 'Maksimal Isi Ulang (Rp)', type: 'number', value: '1000000' },
      { name: 'effective', label: 'Tanggal Berlaku', type: 'date', full: true },
    ],
    notifications: [
      { name: 'title', label: 'Judul', placeholder: 'Judul notifikasi', full: true },
      { name: 'category', label: 'Kategori', type: 'select', options: ['Meter', 'DCU', 'Kredit', 'Pembayaran', 'Token', 'Sistem'] },
      { name: 'recipient', label: 'Penerima', placeholder: 'Teknisi' },
      { name: 'channel', label: 'Kanal', type: 'select', options: ['Dashboard', 'Email', 'WhatsApp'] },
      { name: 'desc', label: 'Deskripsi', type: 'textarea', full: true, placeholder: 'Tulis rincian...' },
    ],
    users: [
      { name: 'name', label: 'Nama Lengkap', placeholder: 'Pengguna baru' }, { name: 'email', label: 'Email', placeholder: 'name@gys.co.id' },
      { name: 'empId', label: 'ID Karyawan', placeholder: 'GYS-EMP-0111' },
      { name: 'role', label: 'Peran', type: 'select', options: ['Super Admin', 'Manager', 'Technician', 'Finance', 'Operator', 'Viewer'] },
      { name: 'status', label: 'Status', type: 'select', options: [['Active', 'Aktif'], ['Inactive', 'Tidak Aktif']] },
      { name: 'dorm', label: 'Akses Asrama', type: 'select', options: ['Semua asrama'].concat(DORM_OPTS) },
      { name: 'area', label: 'Akses Area', placeholder: 'Gedung A' },
    ],
    roles: [
      { name: 'name', label: 'Nama Peran', placeholder: 'Peran baru' },
      { name: 'desc', label: 'Deskripsi', placeholder: 'Apa yang bisa dilakukan peran ini?' },
      { name: 'status', label: 'Status', type: 'select', options: [['Active', 'Aktif'], ['Inactive', 'Tidak Aktif']] },
    ],
  };
  var ID_PREFIX = { dormitories: 'DORM-', buildings: 'BLD-', floors: 'FLR-', rooms: 'R-', employees: 'GYS-EMP-', meters: 'GYS-MTR-', dcus: 'GYS-DCU-', tokens: 'TKN-', transactions: 'TRX-GYS-', payments: 'PAY-GYS-', tariffs: 'TRF-', notifications: 'NTF-', users: 'USR-', roles: 'ROLE-' };
  function genId(entity) {
    var cfg = TABLES[entity], max = 0, width = 3;
    DB(cfg.data).forEach(function (r) {
      var m = String(r[cfg.idKey]).match(/(\d+)\D*$/);
      if (m) { max = Math.max(max, parseInt(m[1], 10)); width = Math.max(width, m[1].length); }
    });
    var n = String(max + 1);
    while (n.length < width) n = '0' + n;
    return (ID_PREFIX[entity] || 'ID-') + n;
  }
  function stampNow() {
    return now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
      String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  }

  function defaultView(entity, row) {
    var cfg = TABLES[entity];
    openModal({
      title: 'Detail ' + LABELS[entity] + ' - ' + row[cfg.idKey],
      body: detailRows(row, cfg.columns.map(function (c) { return { key: c.key, label: c.label, pill: c.pill, render: c.render }; })),
      foot: '<button type="button" data-close-modal class="' + BTN_GHOST + '">Tutup</button>' +
        '<button type="button" data-m-edit class="' + BTN_PRIMARY + '">Ubah data</button>',
      onOpen: function (body, foot) {
        var eb = foot.querySelector('[data-m-edit]');
        if (eb) eb.addEventListener('click', function () { openForm(entity, row); });
      },
    });
  }

  var KIND_ID = { Dormitory: 'Asrama', Building: 'Gedung', Floor: 'Lantai', Room: 'Kamar' };
  function openForm(entity, row, kind) {
    var isEdit = !!row;
    var formKey = (kind && kind !== 'Room' && entity === 'rooms') ? null : (isEdit && FORMS[entity + 'Edit'] ? entity + 'Edit' : entity);
    var title = (isEdit ? 'Ubah ' : 'Tambah ') + (kind ? (KIND_ID[kind] || kind) : LABELS[entity]);
    if (!formKey) {
      openModal({
        title: title,
        body: '<p class="rounded-xl bg-mint-50 px-4 py-3 text-[13px] font-medium text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">Membuat entri ' + esc((KIND_ID[kind] || kind).toLowerCase()) + ' baru dalam struktur. Baris kamar tidak berubah dalam prototipe ini.</p>' +
          formHTML([{ name: 'dorm', label: 'Asrama', type: 'select', options: DORM_OPTS }, { name: 'name', label: 'Nama ' + (KIND_ID[kind] || kind), placeholder: 'Nama...' }], {}),
        foot: '<button type="button" data-close-modal class="' + BTN_GHOST + '">Batal</button><button type="button" data-m-save class="' + BTN_PRIMARY + '">Simpan</button>',
        onOpen: function (b, f) { f.querySelector('[data-m-save]').addEventListener('click', function () { closeModal(); toast((KIND_ID[kind] || kind) + ' berhasil ditambahkan.', 'info'); }); },
      });
      return;
    }
    var vals = {};
    if (isEdit) {
      Object.keys(row).forEach(function (k) { vals[k] = row[k]; });
      if (entity === 'meters') { vals.mid = row.id; }
      if (entity === 'dcus' && !vals.building) vals.building = dcuBuilding(row.id);
      if (entity === 'tariffs') {
        ['price', 'fee', 'min', 'max'].forEach(function (k) { vals[k] = String(row[k]).replace(/\D/g, ''); });
      }
    }
    openModal({
      title: title,
      body: '<form data-m-form onsubmit="return false;">' + formHTML(FORMS[formKey], vals) + '</form>',
      foot: '<button type="button" data-close-modal class="' + BTN_GHOST + '">Batal</button><button type="button" data-m-save class="' + BTN_PRIMARY + '">' + (isEdit ? 'Simpan perubahan' : 'Tambah data') + '</button>',
      wide: true,
      onOpen: function (b, f) {
        initLocationPicker(b, row || {});
        f.querySelector('[data-m-save]').addEventListener('click', function () {
          var v = collectForm(b);
          if (isEdit) { saveEdit(entity, row, v); } else { saveAdd(entity, v); }
        });
        if (entity === 'transactions') {
          var roomSel = b.querySelector('select[name="room"]');
          if (roomSel) roomSel.addEventListener('change', function () {
            var hit = DB('rooms').filter(function (r) { return r.room === roomSel.value; })[0];
            if (!hit) return;
            setSelectVal(b.querySelector('select[name="employee"]'), hit.employee);
            setSelectVal(b.querySelector('select[name="meter"]'), hit.meter);
          });
        }
        if (entity === 'rooms' || entity === 'employees') {
          var dSel = b.querySelector('select[name="dorm"]');
          var bSel = b.querySelector('select[name="building"]'), fSel = b.querySelector('select[name="floor"]'),
              rSel = b.querySelector('select[name="room"]'), mSel = b.querySelector('select[name="meter"]');
          var tenantSet = {};
          DB('rooms').forEach(function (x) { if (x.tenant) tenantSet[x.room] = 1; });
          function fillSelect(sel, opts, keep) {
            if (!sel) return;
            var prev = keep != null ? keep : sel.value;
            sel.innerHTML = opts.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + '</option>'; }).join('');
            setSelectVal(sel, prev);
            if (sel.selectedIndex < 0 && sel.options.length) sel.selectedIndex = 0;
          }
          function rebuildFloorOptions() {
            var nums = (bSel && floorsOf(bSel.value)) || [];
            fillSelect(fSel, nums.length ? nums : ['1', '2', '3']);
          }
          function rebuildRoomOptions(reset) {
            if (!rSel) return;
            var opts = (bSel && fSel && roomsOf(bSel.value, fSel.value, entity === 'employees')) || [];
            if (entity === 'employees') opts = opts.filter(function (rn) { return !tenantSet[rn]; });
            var cur = (!reset && isEdit) ? row.room : null;
            if (cur && cur !== '-' && opts.indexOf(cur) === -1) opts = opts.concat([cur]);
            if (!opts.length) opts = OCC_ROOMS().filter(function (rn) { return entity !== 'employees' || !tenantSet[rn]; });
            fillSelect(rSel, ['-'].concat(opts), cur || undefined);
          }
          function rebuildEmpBuildings(reset) {
            if (entity !== 'employees' || !bSel) return;
            var opts = buildingsOf(dSel ? dSel.value : '').map(function (x) { return x.code; });
            fillSelect(bSel, opts.length ? opts : BLD_OPTS);
            if (reset) bSel.selectedIndex = 0;
          }
          if (isEdit && row.room && row.room !== '-') {
            var placed = DB('rooms').filter(function (x) { return x.room === row.room; })[0];
            if (placed) { setSelectVal(bSel, placed.building); rebuildFloorOptions(); setSelectVal(fSel, placed.floor); }
          } else { rebuildEmpBuildings(false); rebuildFloorOptions(); }
          rebuildRoomOptions(false);
          if (dSel && entity === 'employees') dSel.addEventListener('change', function () {
            rebuildEmpBuildings(true);
            rebuildFloorOptions(); if (fSel) fSel.selectedIndex = 0;
            rebuildRoomOptions(true); if (rSel) rSel.selectedIndex = 0;
          });
          if (bSel) bSel.addEventListener('change', function () { rebuildFloorOptions(); rebuildRoomOptions(true); });
          if (fSel) fSel.addEventListener('change', function () { rebuildRoomOptions(true); });
          if (rSel) rSel.addEventListener('change', function () {
            var hit = DB('rooms').filter(function (x) { return x.room === rSel.value; })[0];
            if (hit) setSelectVal(mSel, hit.meter);
          });
          var roomInput = b.querySelector('input[name="room"]');
          if (roomInput) roomInput.addEventListener('input', function () {
            var hit2 = DB('rooms').filter(function (x) { return x.room === roomInput.value.trim(); })[0];
            if (!hit2) return;
            setSelectVal(b.querySelector('select[name="employee"]'), hit2.employee);
            setSelectVal(mSel, hit2.meter);
          });
        }
        if (entity === 'meters' && !isEdit) {
          var mdSel = b.querySelector('select[name="dorm"]'), mbSel = b.querySelector('select[name="building"]'),
              mrSel = b.querySelector('select[name="room"]'), mcSel = b.querySelector('select[name="dcu"]');
          function meterDormKey() { var d = mdSel && dormRec(mdSel.value); return d ? d.code : ''; }
          function fillMeterSelect(sel, opts) {
            if (!sel || !opts.length) return;
            sel.innerHTML = opts.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + '</option>'; }).join('');
            sel.selectedIndex = 0;
          }
          function rebuildMeterBuildings() {
            var opts = buildingsOf(meterDormKey()).map(function (x) { return x.code; });
            fillMeterSelect(mbSel, opts.length ? opts : BLD_OPTS);
          }
          function rebuildMeterRooms() {
            var opts = mbSel ? roomsInBuilding(mbSel.value) : [];
            fillMeterSelect(mrSel, opts.length ? opts : OCC_ROOMS());
          }
          function rebuildMeterDcus() {
            var opts = mbSel ? dcusOf(mbSel.value) : [];
            fillMeterSelect(mcSel, opts.length ? opts : DCU_OPTS);
          }
          rebuildMeterBuildings(); rebuildMeterRooms(); rebuildMeterDcus();
          if (mdSel) mdSel.addEventListener('change', function () { rebuildMeterBuildings(); rebuildMeterRooms(); rebuildMeterDcus(); });
          if (mbSel) mbSel.addEventListener('change', function () { rebuildMeterRooms(); rebuildMeterDcus(); });
        }
      },
    });
  }

  function saveEdit(entity, row, v) {
    var prevRoom = entity === 'employees' ? row.room : null;
    Object.keys(v).forEach(function (k) {
      if (k === 'mid' || k === 'type') return;
      if ((entity === 'transactions' || entity === 'payments') && k === 'amount') row[k] = Number(v[k]) || 0;
      else row[k] = v[k];
    });
    if (entity === 'employees') { derivePlacement(row); syncRoomPlacement(row, prevRoom); }
    if (entity === 'tariffs') {
      if (v.price) row.price = idr(v.price) + ' / kWh';
      if (v.fee) row.fee = idr(v.fee);
      if (v.min) row.min = idr(v.min);
      if (v.max) row.max = idr(v.max);
      if (v.effective) row.effective = v.effective;
    }
    if (entity === 'payments' && v.amount != null) {
      var feeMap = { 'QRIS': 1000, 'Virtual Account': 4000, 'E-Wallet': 2000, 'Payroll Deduction': 0 };
      row.fee = feeMap[row.method] != null ? feeMap[row.method] : row.fee;
      row.total = (Number(row.amount) || 0) + (Number(row.fee) || 0);
    }
    closeModal(); renderTable(entity); if (entity === 'employees') renderTable('rooms'); applyStats();
    toast(LABELS[entity] + ' berhasil diperbarui.', 'info');
  }

  function saveAdd(entity, v) {
    var cfg = TABLES[entity];
    var row = { id: genId(entity) };
    if (entity === 'dormitories') {
      var dcode = v.code || genId(entity);
      row = { id: dcode, code: dcode, name: v.name || 'Asrama Baru', alias: v.alias || '-', location: v.address || v.location || '-', lat: v.lat || '-', lng: v.lng || '-', address: v.address || '-', status: v.status || 'Active' };
    } else if (entity === 'buildings') {
      var bcode = v.code || 'X1';
      row = { id: 'BLD-' + bcode, code: bcode, name: v.name || ('Gedung ' + bcode), dorm: v.dorm, status: v.status || 'Active' };
    } else if (entity === 'floors') {
      row = { id: 'FLR-' + v.building + '-' + v.number, code: v.code || (v.building + '-F' + v.number), number: v.number, dorm: v.dorm, building: v.building, status: v.status || 'Active' };
    } else if (entity === 'rooms') {
      row = { id: genId(entity), dorm: v.dorm, building: v.building, floor: v.floor, room: v.room || '-', empId: '-', employee: v.employee || '-', meter: v.meter || '-', capacity: v.capacity || '2', status: v.status || 'Available', updated: 'baru saja' };
    } else if (entity === 'meters') {
      var mRoom = DB('rooms').filter(function (x) { return x.room === v.room; })[0] || {};
      row = { id: v.mid || genId(entity), sn: v.sn || '-', dorm: v.dorm, building: v.building || mRoom.building || '-', floor: mRoom.floor || '-', room: v.room || '-', employee: mRoom.employee || '-', dcu: v.dcu, reading: '0.0 kWh', usage: '-', status: 'Online', updated: 'baru saja', installed: now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) };
    } else if (entity === 'tokens') {
      var amt = Number(v.amount) || 50000, g = [];
      for (var i = 0; i < 20; i++) g.push(Math.floor(Math.random() * 10));
      row = { id: genId(entity), no: g.join('').replace(/(\d{4})(?=\d)/g, '$1 ').trim(), employee: v.employee, room: v.room || '-', meter: v.meter, amount: amt, kwh: Math.round(amt / 1500 * 10) / 10, status: 'Pending', created: stampNow() };
    } else if (entity === 'transactions') {
      row = { id: genId(entity), date: stampNow(), employee: v.employee, room: v.room || '-', meter: v.meter, amount: Number(v.amount) || 0, method: v.method, status: v.status || 'Pending' };
    } else if (entity === 'payments') {
      var feeMap = { 'QRIS': 1000, 'Virtual Account': 4000, 'E-Wallet': 2000, 'Payroll Deduction': 0 };
      var amt2 = Number(v.amount) || 0, fee = feeMap[v.method] || 0;
      row = { id: genId(entity), employee: v.employee, method: v.method, trx: '-', amount: amt2, fee: fee, total: amt2 + fee, status: v.status || 'Pending', date: stampNow() };
    } else if (entity === 'tariffs') {
      DB('tariffs').forEach(function (t) { if (t.status === 'Active') t.status = 'Expired'; });
      row = { id: 'TRF-GYS-' + now.getFullYear() + '-' + String(DB('tariffs').length + 1).padStart(2, '0'), effective: v.effective || now.toISOString().slice(0, 10), price: idr(v.price) + ' / kWh', fee: idr(v.fee), min: idr(v.min), max: idr(v.max), status: 'Active' };
    } else if (entity === 'notifications') {
      var toneMap = { Meter: ['alert-triangle', 'bg-amber-50 text-amber-600'], DCU: ['cpu', 'bg-rose-50 text-rose-500'], Credit: ['battery-low', 'bg-amber-50 text-amber-600'], Kredit: ['battery-low', 'bg-amber-50 text-amber-600'], Payment: ['credit-card', 'bg-rose-50 text-rose-500'], Pembayaran: ['credit-card', 'bg-rose-50 text-rose-500'], Token: ['key-round', 'bg-amber-50 text-amber-600'], Sistem: ['bell', 'bg-sky-50 text-sky-600'], System: ['bell', 'bg-sky-50 text-sky-600'] };
      var tm = toneMap[v.category] || toneMap.System;
      row = { id: genId(entity), title: v.title || 'Notifikasi', desc: v.desc || '-', category: v.category, recipient: v.recipient || '-', channel: v.channel, status: 'Unread', severity: 'info', time: 'baru saja', icon: tm[0], tone: tm[1] + ' dark:bg-white/10' };
    } else if (entity === 'users') {
      row = { id: genId(entity), name: v.name || 'Pengguna Baru', email: v.email || '-', initials: '', empId: v.empId || '-', role: v.role, dorm: v.dorm, area: v.area || '-', status: v.status || 'Active', login: 'Tidak pernah' };
    } else if (entity === 'roles') {
      row = { id: genId(entity), name: v.name || 'Peran Baru', desc: v.desc || '-', status: v.status || 'Active' };
    } else if (entity === 'dcus') {
      row = { id: genId(entity), name: v.name || 'DCU Baru', building: v.building || BLD_OPTS[0], location: v.location || '-', ip: v.ip || '-', lastComm: 'baru saja', status: v.status || 'Online' };
    } else if (entity === 'employees') {
      row = { id: genId(entity), name: v.name || 'Karyawan Baru', dorm: v.dorm || '-', building: v.building || '-', floor: v.floor || '-', room: v.room || '-', meter: '-', account: v.account || 'Active', occupancy: 'Available', joined: stampNow().split(',')[0] };
      derivePlacement(row);
      syncRoomPlacement(row, null);
    }
    DB(cfg.data).unshift(row);
    closeModal(); renderTable(entity); if (entity === 'employees') renderTable('rooms'); applyStats(); renderNotifs();
    toast(LABELS[entity] + ' berhasil ditambahkan.', 'info');
  }

  /* ---------- Row action dispatch ---------- */
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-act]');
    if (!btn) return;
    var scope = btn.closest('[data-entity]');
    if (!scope) return;
    var entity = scope.getAttribute('data-entity');
    var found = findRow(entity, btn.getAttribute('data-id'));
    if (!found) return;
    var action = btn.getAttribute('data-act'), row = found.row, id = row[TABLES[entity].idKey];
    if (action === 'view') { (VIEWERS[entity] || defaultView)(entity, row); }
    else if (action === 'edit') { openForm(entity, row); }
    else if (action === 'access') { window.location.href = 'access-menu.html#' + row.id; }
    else if (action === 'resolve') { openResolveModal(row); }
    else if (action === 'delete') {
      confirmDelete(LABELS[entity] + ' ' + id + ' akan dihapus permanen.', function () {
        if (entity === 'employees') syncRoomPlacement({ id: row.id, room: '-' }, row.room);
        found.list.splice(found.index, 1);
        renderTable(entity); if (entity === 'employees') renderTable('rooms'); applyStats();
        toast(LABELS[entity] + ' dihapus.', 'danger');
      });
    }
    else if (action === 'connect') { row.status = 'Online'; row.updated = 'baru saja'; renderTable(entity); applyStats(); toast(id + ' terhubung.', 'info'); }
    else if (action === 'disconnect') { row.status = 'Offline'; row.updated = 'baru saja'; renderTable(entity); applyStats(); toast(id + ' terputus.', 'warn'); }
    else if (action === 'recharge') { toast('Perintah isi ulang dikirim ke ' + id + '.', 'info'); }
    else if (action === 'resend') { toast('Token dikirim ulang ke ' + row.meter + '.', 'info'); }
    else if (action === 'copy') { copyText(row.no, 'Token disalin ke papan klip.'); }
  });
  function copyText(text, msg) {
    function done() { toast(msg, 'info'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
    else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove(); done();
    }
  }
  $$('[data-add-entity]').forEach(function (btn) {
    btn.addEventListener('click', function () { closeAllDrops(); openForm(btn.getAttribute('data-add-entity'), null, btn.getAttribute('data-add-kind')); });
  });

  /* ---------- Table search / filters / chips ---------- */
  function applyQueryPreset(entity) {
    var q = null;
    try { q = new URLSearchParams(window.location.search || ''); } catch (e) { return; }
    if (!q) return;
    var map = { gedung: 'building', lantai: 'floor' };
    var changed = false;
    Object.keys(map).forEach(function (p) {
      var v = q.get(p);
      if (!v) return;
      var sel = document.querySelector('[data-filter-for="' + entity + '"][data-filter-key="' + map[p] + '"]');
      if (!sel) return;
      var before = sel.selectedIndex;
      setSelectVal(sel, v);
      if (sel.selectedIndex !== before) changed = true;
    });
    if (changed) { pagerReset(entity); renderTable(entity); }
  }
  function bindTableControls(entity) {
    if (!document.getElementById('tbl-' + entity)) return;
    applyQueryPreset(entity);
    var s = document.querySelector('[data-search-for="' + entity + '"]');
    if (s) s.addEventListener('input', function () { pagerReset(entity); renderTable(entity); });
    $$('[data-filter-for="' + entity + '"]').forEach(function (f) {
      f.addEventListener('change', function () { pagerReset(entity); renderTable(entity); });
    });
    ['from', 'to'].forEach(function (w) {
      var d = document.querySelector(w === 'from' ? '[data-date-from="' + entity + '"]' : '[data-date-to="' + entity + '"]');
      if (d) d.addEventListener('change', function () { pagerReset(entity); renderTable(entity); });
    });
    var psel = document.querySelector('[data-period-for="' + entity + '"]');
    if (psel) psel.addEventListener('change', function () { pagerReset(entity); renderTable(entity); });
    $$('[data-chip-for="' + entity + '"]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.getAttribute('data-chip-key'), val = chip.getAttribute('data-chip-val');
        CHIP[entity] = CHIP[entity] || {};
        var isAll = !val;
        var on = !isAll && CHIP[entity][key] === val;
        CHIP[entity][key] = (on || isAll) ? '' : val;
        $$('[data-chip-for="' + entity + '"]').forEach(function (c) {
          var cVal = c.getAttribute('data-chip-val');
          var active = isAll ? !cVal : (!on && c === chip);
          if (!isAll && !cVal) active = false;
          c.className = 'rounded-full px-3.5 py-1.5 text-xs font-bold transition ' + (active
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'bg-white text-slate-500 shadow-card hover:text-emerald-800 dark:bg-pine-900 dark:text-slate-400');
        });
        pagerReset(entity);
        renderTable(entity);
      });
    });
  }
  function bindGlobalSearch(id) {
    var input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', function () {
      globalTerm = input.value.trim().toLowerCase();
      Object.keys(TABLES).forEach(function (e) { pagerReset(e); renderTable(e); });
    });
  }
  bindGlobalSearch('global-search');
  bindGlobalSearch('global-search-mobile');

  /* ---------- Stat auto-fill ---------- */
  function applyStats() {
    $$('[data-stat]').forEach(function (el) {
      var spec = el.getAttribute('data-stat'), out = '-';
      try {
        if (spec.indexOf('sum:') === 0) {
          var p = spec.split(':');
          var sum = DB(p[1]).reduce(function (a, r) { return a + (Number(r[p[2]]) || 0); }, 0);
          out = el.getAttribute('data-format') === 'idr' ? idr(sum) : sum.toLocaleString('en-US');
        } else if (spec.indexOf('first:') === 0) {
          var q = spec.split(':');
          var hit = DB(q[1]).filter(function (r) { return String(r[q[2].split('=')[0]]).toLowerCase() === q[2].split('=')[1].toLowerCase(); })[0];
          out = hit ? hit[q[3]] : '-';
        } else if (spec.indexOf(':') !== -1) {
          var e = spec.split(':'), kv = e[1].split('=');
          out = DB(e[0]).filter(function (r) { return String(r[kv[0]]).toLowerCase() === kv[1].toLowerCase(); }).length.toLocaleString('en-US');
        } else {
          out = DB(spec).length.toLocaleString('en-US');
        }
      } catch (err) { out = '-'; }
      el.textContent = out;
    });
  }

  /* ---------- Rich detail viewers ---------- */
  function sectionTitle(t) { return '<p class="mb-2 mt-4 text-xs font-extrabold uppercase tracking-wider text-slate-400 first:mt-0">' + esc(t) + '</p>'; }
  function openTokenAdjust(row) {
    var period = currentTokenPeriod();
    var rec = tokenFor(row.id, period);
    var label = rec ? rec.label : periodLabelOf(now);
    openModal({
      title: 'Sesuaikan Token',
      body: detailRows({ name: row.name, id: row.id, period: label }, [
          { key: 'name', label: 'Karyawan' }, { key: 'id', label: 'ID Karyawan' }, { key: 'period', label: 'Periode' },
        ]) + '<div class="mt-1">' + formHTML([
          { name: 'amount', label: 'Nominal Token (Rp)', type: 'number', value: String(rec ? rec.amount : (DB('monthlyDefault') || 100000)) },
          { name: 'note', label: 'Catatan', placeholder: 'Token tambahan / penyesuaian', value: rec && rec.note !== '-' ? rec.note : '' },
        ], {}) + '</div>',
      foot: '<button type="button" data-close-modal class="' + BTN_GHOST + '">Batal</button><button type="button" data-m-tok-save class="' + BTN_PRIMARY + '">Simpan</button>',
      onOpen: function (b, f) {
        f.querySelector('[data-m-tok-save]').addEventListener('click', function () {
          var v = collectForm(b);
          var amt = parseInt(v.amount, 10) || 0;
          if (rec) {
            rec.amount = amt; rec.note = v.note || '-'; rec.source = 'Penyesuaian'; rec.status = 'Active';
          } else {
            DB('monthlyTokens').unshift({ id: 'MTK-' + period + '-' + row.id.slice(-4), empId: row.id, period: period, label: label, amount: amt, used: null, status: 'Active', source: 'Penyesuaian', note: v.note || '-' });
          }
          closeModal(); VIEWERS.employees('employees', row); renderTable('employees');
          toast('Token ' + label + ' diperbarui.', 'info');
        });
      },
    });
  }
  var VIEWERS = {
    buildings: function (entity, row) {
      openModal({
        title: 'Detail Gedung - ' + row.code,
        body: detailRows(row, TABLES.buildings.columns.map(function (c) { return { key: c.key, label: c.label, pill: c.pill, render: c.render }; })),
        foot: '<button type="button" data-close-modal class="' + BTN_GHOST + '">Tutup</button>' +
          '<a href="floors.html?gedung=' + esc(row.code) + '" class="' + BTN_GHOST + '">Lihat Lantai</a>' +
          '<button type="button" data-m-edit class="' + BTN_PRIMARY + '">Ubah data</button>',
        onOpen: function (body, foot) {
          var eb = foot.querySelector('[data-m-edit]');
          if (eb) eb.addEventListener('click', function () { openForm(entity, row); });
        },
      });
    },
    floors: function (entity, row) {
      openModal({
        title: 'Detail Lantai - ' + row.code,
        body: detailRows(row, TABLES.floors.columns.map(function (c) { return { key: c.key, label: c.label, pill: c.pill, render: c.render }; })),
        foot: '<button type="button" data-close-modal class="' + BTN_GHOST + '">Tutup</button>' +
          '<a href="rooms.html?gedung=' + esc(row.building) + '&lantai=' + esc(row.number) + '" class="' + BTN_GHOST + '">Lihat Kamar</a>' +
          '<button type="button" data-m-edit class="' + BTN_PRIMARY + '">Ubah data</button>',
        onOpen: function (body, foot) {
          var eb = foot.querySelector('[data-m-edit]');
          if (eb) eb.addEventListener('click', function () { openForm(entity, row); });
        },
      });
    },
    rooms: function (entity, row) {
      var occ = roomOccupants(row.room);
      var meter = DB('meters').filter(function (m) { return m.id === row.meter; })[0];
      openModal({
        title: 'Detail Kamar - ' + row.room, wide: true,
        body: sectionTitle('Informasi Kamar') + detailRows(row, [
            { key: 'room', label: 'Kamar' }, { key: 'dorm', label: 'Asrama' }, { key: 'building', label: 'Gedung' },
            { key: 'floor', label: 'Lantai' }, { key: 'capacity', label: 'Kapasitas' }, { key: 'updated', label: 'Terakhir Diperbarui' },
            { key: 'status', label: 'Status', pill: true },
          ]) + sectionTitle('Karyawan') +
          (row.tenant ? detailRows(row, [{ key: 'tenant', label: 'Tenant' }])
            : occ.length ? '<p class="mb-2 text-[13px] font-bold text-pine-700 dark:text-white">Terisi ' + occ.length + ' dari kapasitas ' + esc(row.capacity || '-') + '</p>' +
              '<ul class="space-y-2">' + occ.map(function (e) {
                return '<li class="flex items-center justify-between gap-2 rounded-xl bg-cream/70 px-4 py-2.5 dark:bg-white/5"><span class="text-[13px] font-bold text-slate-600 dark:text-slate-300">' + esc(e.name) + '</span><span class="num font-mono text-xs font-bold text-slate-400">' + esc(e.id) + '</span></li>';
              }).join('') + '</ul>'
            : '<p class="rounded-xl bg-cream px-4 py-3 text-[13px] font-medium text-slate-500 dark:bg-white/5 dark:text-slate-400">Kamar saat ini kosong.</p>') +
          sectionTitle('Meter') +
          (meter ? detailRows(meter, [{ key: 'id', label: 'ID Meter' }, { key: 'sn', label: 'Nomor Seri' }, { key: 'reading', label: 'Pembacaan Terakhir' }, { key: 'credit', label: 'Kredit' }, { key: 'status', label: 'Status', pill: true }])
            : '<p class="rounded-xl bg-cream px-4 py-3 text-[13px] font-medium text-slate-500 dark:bg-white/5">Belum ada meter terpasang.</p>') +
          sectionTitle('Riwayat Karyawan') +
          '<ul class="space-y-2 text-[13px]">' +
          '<li class="flex items-center justify-between rounded-xl bg-cream/70 px-4 py-2.5 dark:bg-white/5"><span class="font-semibold text-slate-600 dark:text-slate-300">' + esc(row.employee === '-' ? 'Kosong' : row.employee) + '</span><span class="num text-xs font-bold text-slate-400">Jan 2026 - sekarang</span></li>' +
          '<li class="flex items-center justify-between rounded-xl bg-cream/70 px-4 py-2.5 dark:bg-white/5"><span class="font-semibold text-slate-600 dark:text-slate-300">Riwayat karyawan sebelumnya</span><span class="num text-xs font-bold text-slate-400">2024 - 2025</span></li></ul>',
      });
    },
    employees: function (entity, row) {
      var rm = placedRoomOf(row);
      var cur = currentTokenFor(row.id);
      var hist = tokenHistory(row.id).filter(function (t) { return !cur || t.period !== cur.period; });
      var linked = DB('users').filter(function (u) { return u.name === row.name; })[0];
      var trx = DB('transactions').filter(function (t) { return t.employee === row.name; });
      var trxRows = trx.length ? trx.slice(0, 4).map(function (t) {
        return '<li class="flex items-center justify-between gap-2 rounded-xl bg-cream/70 px-4 py-2.5 dark:bg-white/5"><span class="num text-xs font-bold text-pine-700 dark:text-white">' + esc(t.id) + '</span><span class="num text-xs font-bold text-slate-500">' + idr(t.amount) + '</span>' + pill(t.status) + '</li>';
      }).join('') : '<li class="rounded-xl bg-cream px-4 py-3 text-[13px] text-slate-500 dark:bg-white/5">Belum ada transaksi tercatat.</li>';
      var placeBody = rm ? detailRows(rm, [
          { key: 'dorm', label: 'Asrama' },
          { key: 'building', label: 'Gedung', render: function (v) { return '<span class="font-bold text-pine-700 dark:text-white">' + esc(buildingName(v)) + ' <span class="font-mono text-[11px] font-medium text-slate-400">' + esc(v) + '</span></span>'; } },
          { key: 'floor', label: 'Lantai', render: function (v) { return '<span class="font-bold text-pine-700 dark:text-white">Lantai ' + esc(v) + '</span>'; } },
          { key: 'room', label: 'Kamar' }, { key: 'meter', label: 'Meter' },
        ]) : '<p class="rounded-xl bg-cream px-4 py-3 text-[13px] text-slate-500 dark:bg-white/5">Belum ada kamar. Karyawan masuk daftar tunggu.</p>';
      var tokenBody;
      if (cur) {
        var usedTxt = cur.used == null ? '<span class="text-slate-300 dark:text-slate-600">—</span>' : idr(cur.used);
        var leftTxt = idr(cur.used == null ? cur.amount : Math.max(cur.amount - cur.used, 0));
        tokenBody = '<p class="mb-2 text-[13px] font-bold text-pine-700 dark:text-white">Token ' + esc(cur.label) + '</p>' +
          '<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">' +
          mdMini('Nominal', '<span class="num">' + idr(cur.amount) + '</span>') +
          mdMini('Terpakai', usedTxt) + mdMini('Sisa', '<span class="num">' + leftTxt + '</span>') +
          mdMini('Status', pill(cur.status)) + '</div>' +
          (cur.source === 'Penyesuaian' ? '<p class="mt-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">Penyesuaian admin' + (cur.note && cur.note !== '-' ? ' — ' + esc(cur.note) : '') + '</p>' : '') +
          '<button type="button" data-m-adjust class="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-moss-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-110 active:scale-[.98]"><i data-lucide="sliders-horizontal" class="h-3.5 w-3.5"></i>Sesuaikan Token</button>';
      } else {
        tokenBody = '<p class="rounded-xl bg-cream px-4 py-3 text-[13px] text-slate-500 dark:bg-white/5">Belum ada token bulan berjalan untuk karyawan ini.</p>';
      }
      tokenBody += '<p class="mt-2.5 rounded-xl bg-mint-50 px-4 py-2.5 text-xs font-medium text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">Token Bulanan Default <strong class="num">' + idr(DB('monthlyDefault') || 100000) + '</strong> — dibuat otomatis setiap tanggal 1 untuk karyawan aktif.</p>';
      var histBody = hist.length ? '<ul class="space-y-2">' + hist.slice(0, 6).map(function (t) {
        return '<li class="flex items-center justify-between gap-2 rounded-xl bg-cream/70 px-4 py-2.5 dark:bg-white/5"><span class="text-[13px] font-bold text-slate-600 dark:text-slate-300">' + esc(t.label) + (t.source === 'Penyesuaian' ? ' <span class="text-[11px] font-semibold text-amber-600">· penyesuaian</span>' : '') + '</span><span class="flex items-center gap-2"><span class="num text-xs font-bold text-pine-700 dark:text-white">' + idr(t.amount) + '</span>' + pill(t.status) + '</span></li>';
      }).join('') + '</ul>' : '<p class="rounded-xl bg-cream px-4 py-3 text-[13px] text-slate-500 dark:bg-white/5">Belum ada riwayat token.</p>';
      var userBody = linked
        ? detailRows(linked, [{ key: 'email', label: 'Email' }, { key: 'role', label: 'Peran' }, { key: 'login', label: 'Login Terakhir' }]) +
          '<a href="users.html" class="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-700 transition hover:underline dark:text-emerald-400">Buka halaman Pengguna<i data-lucide="arrow-right" class="h-3.5 w-3.5"></i></a>'
        : '<p class="rounded-xl bg-cream px-4 py-3 text-[13px] text-slate-500 dark:bg-white/5">Profil pengguna belum terhubung. Kelola identitas dan akun di <a href="users.html" class="font-bold text-emerald-700 hover:underline dark:text-emerald-400">halaman Pengguna</a>.</p>';
      openModal({
        title: 'Detail Karyawan - ' + row.id, wide: true,
        body: '<div class="flex items-center gap-3">' + avatarHTML(row.name, '') +
          '<span><strong class="block text-[15px] font-extrabold text-pine-700 dark:text-white">' + esc(row.name) + '</strong>' +
          '<span class="num font-mono text-xs font-bold text-slate-400">' + esc(row.id) + '</span></span>' +
          '<span class="ml-auto flex gap-1.5">' + pill(row.account) + pill(row.occupancy) + '</span></div>' +
          sectionTitle('Penempatan') + placeBody +
          sectionTitle('Token Bulanan') + tokenBody +
          sectionTitle('Riwayat Token') + histBody +
          sectionTitle('Transaksi Terakhir') + '<ul class="space-y-2">' + trxRows + '</ul>' +
          sectionTitle('Profil Pengguna') + userBody,
        foot: '<button type="button" data-close-modal class="' + BTN_GHOST + '">Tutup</button><button type="button" data-m-toggle class="' + BTN_PRIMARY + '">Nonaktifkan</button>',
        onOpen: function (b, f) {
          var ab = b.querySelector('[data-m-adjust]');
          if (ab) ab.addEventListener('click', function () { openTokenAdjust(row); });
          var tg = f.querySelector('[data-m-toggle]');
          function paint() { tg.textContent = row.account === 'Active' ? 'Nonaktifkan' : 'Aktifkan'; }
          paint();
          tg.addEventListener('click', function () {
            row.account = row.account === 'Active' ? 'Inactive' : 'Active';
            renderTable('employees'); applyStats(); paint();
            toast(row.account === 'Active' ? 'Karyawan diaktifkan.' : 'Karyawan dinonaktifkan.', 'info');
          });
        },
      });
    },
    meters: function (entity, row) {
      window.location.href = 'meter-detail.html?id=' + encodeURIComponent(row.id);
    },
    dcus: function (entity, row) {
      var meters = DB('meters').filter(function (m) { return m.dcu === row.id; });
      openModal({
        title: 'Detail DCU - ' + row.id, wide: true,
        body: sectionTitle('Status Koneksi') + detailRows(row, [
            { key: 'name', label: 'Perangkat' }, { key: 'location', label: 'Lokasi' }, { key: 'ip', label: 'Alamat IP' },
            { key: 'esp', label: 'ESP / Gateway' }, { key: 'capacity', label: 'Kapasitas (meter)' },
            { key: 'status', label: 'Status', pill: true }, { key: 'lastComm', label: 'Komunikasi Terakhir' },
          ]) + sectionTitle('Meter terhubung (' + meters.length + ')') +
          '<ul class="space-y-2">' + meters.map(function (m) {
            return '<li class="flex items-center justify-between gap-2 rounded-xl bg-cream/70 px-4 py-2.5 dark:bg-white/5"><span class="font-mono text-xs font-bold text-pine-700 dark:text-white">' + esc(m.id) + '</span>' + pill(m.status) + '</li>';
          }).join('') + '</ul>' + sectionTitle('Log Komunikasi') +
          '<ul class="space-y-2 text-[13px]"><li class="flex items-center justify-between rounded-xl bg-cream/70 px-4 py-2.5 dark:bg-white/5"><span class="font-medium text-slate-600 dark:text-slate-300">Pembacaan meter terkumpul (' + meters.length + ' meter)</span><span class="num text-xs font-bold text-slate-400">' + esc(row.lastComm) + '</span></li>' +
          '<li class="flex items-center justify-between rounded-xl bg-cream/70 px-4 py-2.5 dark:bg-white/5"><span class="font-medium text-slate-600 dark:text-slate-300">Heartbeat OK - latensi 84 ms</span><span class="num text-xs font-bold text-slate-400">5 mnt lalu</span></li></ul>' +
          sectionTitle('Kejadian Offline') +
          (row.status === 'Offline' ? '<p class="rounded-xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">Offline sejak 48 menit lalu - teknisi dikirim.</p>'
            : '<p class="rounded-xl bg-cream px-4 py-3 text-[13px] text-slate-500 dark:bg-white/5">Tidak ada kejadian offline dalam 30 hari terakhir.</p>'),
      });
    },
    tokens: function (entity, row) {
      openModal({
        title: 'Detail Token - ' + row.id,
        body: '<div class="rounded-2xl bg-gradient-to-br from-pine-700 via-moss-600 to-emerald-600 p-5 text-center text-white">' +
          '<p class="text-[11px] font-bold uppercase tracking-widest text-mint-100/80">Nomor token</p>' +
          '<p class="num mt-1 font-mono text-lg font-extrabold tracking-wider">' + esc(row.no) + '</p>' +
          '<button type="button" data-m-copy class="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-bold backdrop-blur transition hover:bg-white/25"><i data-lucide="copy" class="h-3.5 w-3.5"></i> Salin token</button></div>' +
          '<div class="mt-2">' + detailRows(row, [
            { key: 'amount', label: 'Jumlah', render: function (v) { return '<span class="num font-bold text-pine-700 dark:text-white">' + idr(v) + '</span>'; } },
            { key: 'kwh', label: 'Energi', render: function (v) { return '<span class="num font-bold text-pine-700 dark:text-white">' + kwh(v) + '</span>'; } },
            { key: 'employee', label: 'Karyawan' }, { key: 'room', label: 'Kamar' }, { key: 'meter', label: 'Meter' },
            { key: 'created', label: 'Waktu Dibuat' }, { key: 'status', label: 'Status', pill: true },
          ]) + '</div>',
        foot: '<button type="button" data-close-modal class="' + BTN_GHOST + '">Tutup</button><button type="button" data-m-resend class="' + BTN_PRIMARY + '">Kirim ulang</button>',
        onOpen: function (b, f) {
          b.querySelector('[data-m-copy]').addEventListener('click', function () { copyText(row.no, 'Token disalin ke papan klip.'); });
          f.querySelector('[data-m-resend]').addEventListener('click', function () { closeModal(); toast('Token dikirim ulang ke ' + row.meter + '.', 'info'); });
        },
      });
    },
    payments: function (entity, row) {
      openModal({
        title: 'Detail Pembayaran - ' + row.id,
        body: detailRows(row, [{ key: 'employee', label: 'Karyawan' }, { key: 'method', label: 'Metode' }, { key: 'trx', label: 'Transaksi' }, { key: 'date', label: 'Tanggal' }, { key: 'status', label: 'Status', pill: true }]) +
          '<div class="mt-3 space-y-2 rounded-2xl bg-cream/70 p-4 text-[13px] dark:bg-white/5">' +
          '<p class="flex justify-between"><span class="text-slate-500">Jumlah</span><strong class="num text-pine-700 dark:text-white">' + idr(row.amount) + '</strong></p>' +
          '<p class="flex justify-between"><span class="text-slate-500">Biaya admin</span><strong class="num text-pine-700 dark:text-white">' + idr(row.fee) + '</strong></p>' +
          '<p class="flex justify-between border-t border-emerald-900/10 pt-2 dark:border-white/10"><span class="font-bold text-pine-700 dark:text-white">Total</span><strong class="num text-emerald-700 dark:text-emerald-300">' + idr(row.total) + '</strong></p></div>',
      });
    },
    notifications: function (entity, row) {
      openModal({
        title: row.title,
        body: '<div class="flex items-start gap-3"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl ' + esc(row.tone || 'bg-emerald-50 text-emerald-600') + '"><i data-lucide="' + esc(row.icon || 'bell') + '" class="h-5 w-5"></i></span>' +
          '<p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300">' + esc(row.desc) + '</p></div>' +
          '<div class="mt-2">' + detailRows(row, [{ key: 'type', label: 'Jenis' }, { key: 'recipient', label: 'Penerima' }, { key: 'channel', label: 'Kanal' }, { key: 'created', label: 'Dibuat' }, { key: 'status', label: 'Status', pill: true }]) + '</div>',
        foot: '<button type="button" data-close-modal class="' + BTN_GHOST + '">Tutup</button><button type="button" data-m-read class="' + BTN_PRIMARY + '">Tandai dibaca</button>',
        onOpen: function (b, f) {
          f.querySelector('[data-m-read]').addEventListener('click', function () {
            row.status = 'Read'; closeModal(); renderTable('notifications'); renderNotifs(); applyStats();
            toast('Notifikasi ditandai dibaca.', 'info');
          });
        },
      });
    },
    users: function (entity, row) {
      var perms = { 'Super Admin': 'Akses penuh - semua modul dan pengaturan', Manager: 'Kelola asrama, setujui pembayaran, lihat laporan', Technician: 'Kelola meter, DCU, token, dan notifikasi', Finance: 'Kelola pembayaran, rekonsiliasi, dan laporan penggajian', Operator: 'Operasional harian kamar, karyawan, dan meter', Viewer: 'Akses baca dasbor dan laporan' };
      openModal({
        title: 'Detail Pengguna - ' + row.name,
        body: '<div class="flex items-center gap-3">' + avatarHTML(row.name, row.initials) + '<span class="ml-auto">' + pill(row.status) + '</span></div>' +
          '<div class="mt-2">' + detailRows(row, [{ key: 'empId', label: 'ID Karyawan' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Peran' }, { key: 'dorm', label: 'Akses Asrama' }, { key: 'area', label: 'Akses Area' }, { key: 'login', label: 'Login Terakhir' }]) + '</div>' +
          '<p class="mt-3 rounded-xl bg-mint-50 px-4 py-3 text-[13px] font-medium text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">' + esc(perms[row.role] || 'Profil akses kustom') + '</p>',
      });
    },
  };

  /* ---------- Notifications: dropdown + panel ---------- */
  var SEV_STYLE = {
    critical: { tone: 'bg-rose-50 text-rose-500 dark:bg-rose-400/10 dark:text-rose-300', icon: 'siren' },
    warning: { tone: 'bg-amber-50 text-amber-500 dark:bg-amber-400/10 dark:text-amber-300', icon: 'alert-triangle' },
    info: { tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300', icon: 'info' },
  };
  function sevStyle(n) { return SEV_STYLE[n.severity] || SEV_STYLE.info; }
  function notifItem(n, panelRow) {
    var li = document.createElement('li');
    li.className = 'flex gap-3 rounded-2xl px-3 py-2.5 transition ' + (panelRow
      ? 'border border-emerald-900/5 dark:border-white/5 ' + (n.status === 'Unread' ? 'bg-mint-50/70 dark:bg-emerald-400/5' : '')
      : (n.status === 'Unread' ? 'bg-mint-50/70 dark:bg-emerald-400/5' : 'hover:bg-cream/70 dark:hover:bg-white/5'));
    li.innerHTML = '<span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl ' + sevStyle(n).tone + '"><i data-lucide="' + sevStyle(n).icon + '" class="h-4 w-4"></i></span>' +
      '<span class="min-w-0 flex-1"><span class="flex items-start justify-between gap-2"><strong class="text-[13px] font-bold text-pine-700 dark:text-white">' + esc(n.title) + '</strong>' +
      (n.status === 'Unread' ? '<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500"></span>' : '') + '</span>' +
      '<span class="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">' + esc(n.desc) + '</span>' +
      '<span class="mt-1 block text-[11px] font-semibold text-slate-400">' + esc(n.created) + '</span></span>';
    return li;
  }
  function renderNotifs() {
    var drop = $('#notif-list');
    if (drop) { drop.innerHTML = ''; DB('notifications').slice(0, 4).forEach(function (n) { drop.appendChild(notifItem(n, false)); }); }
    var panel = $('#notif-panel-list');
    if (panel) { panel.innerHTML = ''; DB('notifications').forEach(function (n) { panel.appendChild(notifItem(n, true)); }); }
    var dot = $('#notif-dot');
    if (dot) dot.style.display = DB('notifications').some(function (n) { return n.status === 'Unread'; }) ? '' : 'none';
    refreshIcons();
  }
  $$('[data-mark-read]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      DB('notifications').forEach(function (n) { n.status = 'Read'; });
      renderNotifs(); renderTable('notifications'); applyStats();
      toast('Semua notifikasi ditandai dibaca.', 'info');
    });
  });
  var notifPanel = $('#notif-panel'), notifOverlay = $('#notif-overlay');
  function openNotifPanel() {
    if (!notifPanel) return;
    closeAllDrops(); closeMobile();
    notifPanel.classList.remove('translate-x-full');
    if (notifOverlay) notifOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeNotifPanel() {
    if (!notifPanel || notifPanel.classList.contains('translate-x-full')) return;
    notifPanel.classList.add('translate-x-full');
    if (notifOverlay) notifOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }
  $$('[data-open-notif]').forEach(function (b) { b.addEventListener('click', openNotifPanel); });
  $$('[data-close-notif]').forEach(function (b) { b.addEventListener('click', closeNotifPanel); });
  if (notifOverlay) notifOverlay.addEventListener('click', closeNotifPanel);

  /* ---------- Dashboard lists ---------- */
  function renderAlerts() {
    var list = $('#alert-list');
    if (!list) return;
    list.innerHTML = '';
    DB('notifications').filter(function (n) { return n.severity !== 'info'; }).slice(0, 5).forEach(function (n) {
      var li = document.createElement('li');
      li.className = 'flex gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-mint-50/60 dark:hover:bg-white/[0.03]';
      li.innerHTML = '<span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl ' + sevStyle(n).tone + '"><i data-lucide="' + sevStyle(n).icon + '" class="h-4 w-4"></i></span>' +
        '<span class="min-w-0"><span class="block text-[13px] font-semibold leading-snug text-slate-700 dark:text-slate-200">' + esc(n.title) + '</span>' +
        '<span class="mt-0.5 block text-[11px] font-medium text-slate-400">' + esc(n.type) + ' - ' + esc(n.created) + '</span></span>';
      list.appendChild(li);
    });
    refreshIcons();
  }
  function renderRecentTrx() {
    var tbody = $('#recent-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    DB('transactions').slice(0, 6).forEach(function (t) {
      var tr = document.createElement('tr');
      tr.className = 'transition hover:bg-mint-50/60 dark:hover:bg-white/[0.03]';
      tr.innerHTML = '<td class="px-5 py-3 font-mono text-[12px] font-bold text-pine-700 dark:text-white">' + esc(t.id) + '</td>' +
        '<td class="px-3 py-3 text-[13px] font-semibold text-slate-600 dark:text-slate-300">' + esc(t.employee) + '</td>' +
        '<td class="num px-3 py-3 text-[13px] font-bold text-pine-700 dark:text-white">' + idr(t.amount) + '</td>' +
        '<td class="hidden px-3 py-3 text-[13px] text-slate-500 sm:table-cell">' + esc(t.method) + '</td>' +
        '<td class="px-3 py-3">' + pill(t.status) + '</td>';
      tbody.appendChild(tr);
    });
  }
  function renderExports() {
    var tbody = $('#export-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    DB('exports').forEach(function (e) {
      var tr = document.createElement('tr');
      tr.className = 'transition hover:bg-mint-50/60 dark:hover:bg-white/[0.03]';
      tr.innerHTML = '<td class="px-5 py-3"><span class="flex items-center gap-2.5"><span class="grid h-8 w-8 place-items-center rounded-lg bg-cream text-emerald-700 dark:bg-white/5 dark:text-emerald-300"><i data-lucide="file-text" class="h-4 w-4"></i></span><strong class="font-mono text-[12px] font-bold text-pine-700 dark:text-white">' + esc(e.name) + '</strong></span></td>' +
        '<td class="px-3 py-3 text-[13px] text-slate-600 dark:text-slate-300">' + esc(e.type) + '</td>' +
        '<td class="num hidden px-3 py-3 text-[13px] text-slate-500 sm:table-cell">' + esc(e.size) + '</td>' +
        '<td class="num px-3 py-3 text-[13px] text-slate-500">' + esc(e.date) + '</td>' +
        '<td class="px-5 py-3 text-right"><button type="button" data-dl class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-white/10"><i data-lucide="download" class="h-3.5 w-3.5"></i>Unduh</button></td>';
      tbody.appendChild(tr);
    });
    $$('[data-dl]', tbody).forEach(function (b) { b.addEventListener('click', function () { toast('Laporan berhasil diekspor.', 'info'); }); });
    refreshIcons();
  }
  function renderTariffHistory() {
    var ol = $('#tariff-history');
    if (!ol) return;
    ol.innerHTML = '';
    DB('tariffs').forEach(function (t, i, arr) {
      var active = t.status === 'Active';
      var li = document.createElement('li');
      li.className = 'relative flex gap-3.5' + (i < arr.length - 1 ? ' pb-5' : '');
      li.innerHTML = '<span class="flex flex-col items-center"><span class="h-3 w-3 shrink-0 rounded-full ' + (active ? 'bg-emerald-500 ring-4 ring-emerald-50 dark:ring-emerald-400/10' : 'bg-slate-300 dark:bg-white/20') + '"></span>' +
        (i < arr.length - 1 ? '<span class="w-px flex-1 bg-emerald-900/10 dark:bg-white/10"></span>' : '') + '</span>' +
        '<span class="-mt-1 flex-1"><span class="flex flex-wrap items-center gap-2"><strong class="num text-sm font-extrabold text-pine-700 dark:text-white">' + esc(t.price) + '</strong>' + pill(t.status) + '</span>' +
        '<span class="mt-0.5 block font-mono text-[11px] text-slate-400">' + esc(t.id) + ' - berlaku ' + esc(t.effective) + '</span></span>';
      ol.appendChild(li);
    });
  }
  function renderMeterHistory() {
    var tbody = $('#history-tbody');
    if (!tbody) return;
    var onlyId = '';
    if (document.getElementById('meter-detail-root')) {
      try { onlyId = new URLSearchParams(window.location.search || '').get('id') || ''; } catch (e) { onlyId = ''; }
    }
    var hist = onlyId ? DB('meterHistory').filter(function (h) { return h.meter === onlyId; }) : DB('meterHistory');
    tbody.innerHTML = '';
    if (!hist.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-4 text-center text-[13px] text-slate-400">Belum ada penggantian untuk meter ini.</td></tr>';
      return;
    }
    hist.forEach(function (h) {
      var tr = document.createElement('tr');
      tr.className = 'transition hover:bg-mint-50/60 dark:hover:bg-white/[0.03]';
      tr.innerHTML = '<td class="px-5 py-3 font-mono text-[12px] font-bold text-pine-700 dark:text-white">' + esc(h.meter) + '</td>' +
        '<td class="num px-3 py-3 text-[13px] text-slate-500">' + esc(h.date) + '</td>' +
        '<td class="px-3 py-3 font-mono text-[12px] text-slate-600 dark:text-slate-300">' + esc(h.oldSn) + ' -&gt; ' + esc(h.newSn) + '</td>' +
        '<td class="px-3 py-3 text-[13px] text-slate-600 dark:text-slate-300">' + esc(h.reason) + '</td>' +
        '<td class="px-5 py-3 text-[13px] font-semibold text-slate-600 dark:text-slate-300">' + esc(h.tech) + '</td>';
      tbody.appendChild(tr);
    });
  }

  /* ---------- Tabs (pill + side styles) ---------- */
  var TAB_STYLE = {
    pill: {
      base: 'rounded-lg px-3 py-1.5 text-xs font-bold transition ',
      on: 'bg-white text-emerald-800 shadow-sm dark:bg-emerald-400/20 dark:text-emerald-200',
      off: 'text-slate-500 hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-200',
    },
    side: {
      base: 'flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13px] transition ',
      on: 'bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300',
      off: 'font-medium text-slate-600 hover:bg-cream dark:text-slate-300 dark:hover:bg-white/5',
    },
  };
  function initTabs(scope) {
    $$('[data-tabgroup]', scope || document).forEach(function (group) {
      if (group.getAttribute('data-tabinit') === '1') return;
      group.setAttribute('data-tabinit', '1');
      var st = TAB_STYLE[group.getAttribute('data-tabstyle') || 'pill'];
      var btns = $$('[data-tab]', group);
      function activate(btn) {
        btns.forEach(function (b) {
          var on = b === btn;
          b.className = st.base + (on ? st.on : st.off);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        $$('[data-tabpanel]', group).forEach(function (p) {
          p.classList.toggle('hidden', p.getAttribute('data-tabpanel') !== btn.getAttribute('data-tab'));
        });
      }
      btns.forEach(function (b) { b.addEventListener('click', function () { activate(b); }); });
      if (btns[0]) activate(btns[0]);
    });
  }

  /* ---------- Consumption chart (dashboard) ---------- */
  var CHART_RANGES = {
    today: { label: 'Hari Ini', labels: ['00', '03', '06', '09', '12', '15', '18', '21', '23'].map(function (h) { return h + ':00'; }),
      now: [1.1, 0.8, 1.6, 2.9, 2.3, 1.9, 2.8, 3.9, 1.5], prev: [1.2, 0.9, 1.8, 3.1, 2.5, 2.0, 3.0, 4.1, 1.6] },
    week: { label: 'Minggu Ini', labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      now: [38.2, 41.5, 39.8, 44.1, 47.6, 52.3, 48.9], prev: [40.1, 42.8, 41.2, 45.9, 49.8, 55.1, 51.4] },
    month: { label: 'Bulan Ini', labels: ['M1', 'M2', 'M3', 'M4'],
      now: [282, 305, 298, 341], prev: [296, 318, 310, 355] },
  };
  var activeRange = 'today', consumptionChart = null;
  function buildConsumption() {
    var cc = $('#consumption-chart');
    if (!cc || !window.Chart) return;
    if (consumptionChart) { try { consumptionChart.destroy(); } catch (e) {} }
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    var ctx = cc.getContext('2d');
    var grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, isDark() ? 'rgba(52,211,153,0.45)' : 'rgba(16,185,129,0.35)');
    grad.addColorStop(1, 'rgba(16,185,129,0)');
    var r = CHART_RANGES[activeRange];
    var grid = isDark() ? 'rgba(255,255,255,0.06)' : 'rgba(27,67,50,0.08)';
    var tick = isDark() ? '#8FA69B' : '#7C8A84';
    consumptionChart = new Chart(ctx, {
      type: 'line',
      data: { labels: r.labels, datasets: [
        { label: 'Konsumsi', data: r.now, borderColor: '#10B981', backgroundColor: grad, fill: true, tension: 0.42, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#10B981', pointHoverBorderColor: '#fff' },
        { label: 'Sebelumnya', data: r.prev, borderColor: isDark() ? '#3E5C4E' : '#BFC9B4', borderDash: [6, 5], fill: false, tension: 0.42, borderWidth: 1.8, pointRadius: 0, pointHoverRadius: 4 },
      ]},
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: isDark() ? '#122A20' : '#0B1F17', padding: 12, cornerRadius: 12, callbacks: { label: function (c) { return ' ' + c.dataset.label + ': ' + c.parsed.y + ' kWh'; } } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: tick, font: { size: 11, weight: '600' }, maxRotation: 0 } },
          y: { grid: { color: grid }, border: { display: false }, ticks: { color: tick, font: { size: 11, weight: '600' } } },
        },
      },
    });
  }
  $$('.chart-tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeRange = btn.getAttribute('data-range');
      $$('.chart-tab').forEach(function (b) {
        var on = b === btn;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.className = 'chart-tab rounded-lg px-3.5 py-1.5 text-xs font-bold transition ' + (on
          ? 'bg-white text-emerald-800 shadow-sm dark:bg-emerald-400/20 dark:text-emerald-200'
          : 'text-slate-500 hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-200');
      });
      var label = $('#chart-range-label');
      if (label) label.textContent = CHART_RANGES[activeRange].label;
      buildConsumption();
    });
  });
  var chartDate = $('#chart-date');
  if (chartDate) chartDate.addEventListener('change', function () {
    var label = $('#chart-range-label');
    var pretty = new Date(chartDate.value + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    if (label) label.textContent = pretty;
    toast('Menampilkan data ' + pretty + ' (demo).', 'info');
  });

  /* ---------- Settings toggles ---------- */
  $$('[data-toggle]').forEach(function (t) {
    t.addEventListener('click', function () {
      var on = t.getAttribute('aria-checked') === 'true';
      var knob = t.querySelector('.knob');
      t.setAttribute('aria-checked', on ? 'false' : 'true');
      t.classList.toggle('bg-emerald-500', !on);
      t.classList.toggle('bg-slate-300', on);
      if (knob) { knob.classList.toggle('translate-x-5', !on); knob.classList.toggle('translate-x-0', on); }
      toast(t.getAttribute('data-toggle') + (on ? ' dinonaktifkan.' : ' diaktifkan.'), 'info');
    });
  });

  /* ---------- Login (standalone page) ---------- */
  var loginForm = $('#login-form');
  if (loginForm) loginForm.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var btn = $('#login-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="inline-flex items-center gap-2"><i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i> Masuk...</span>'; refreshIcons(); }
    toast('Memverifikasi kredensial...', 'info');
    setTimeout(function () {
      toast('Login berhasil. Mengalihkan ke dasbor...', 'info');
      setTimeout(function () { window.location.href = 'index.html'; }, 700);
    }, 900);
  });
  $$('[data-pw-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var input = document.getElementById(b.getAttribute('data-pw-toggle'));
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      b.innerHTML = '<i data-lucide="' + (show ? 'eye-off' : 'eye') + '" class="h-4 w-4"></i>';
      refreshIcons();
    });
  });

  /* ================= PART 3: audit log (search + filters + sort + pagination) ================= */
  var AUDIT_MODULES = ['Autentikasi', 'Dashboard', 'Asrama', 'Gedung', 'Lantai', 'Kamar', 'Karyawan', 'Meter', 'DCU & IoT', 'Token', 'Transaksi', 'Pembayaran', 'Tarif', 'Notifikasi', 'Laporan', 'Pengguna', 'Peran & Akses', 'Konfigurasi Sistem'];
  var AUDIT_ACTIONS = ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'CONFIG_UPDATE'];
  var AUDIT_STATE = { page: 1, per: 10, sortKey: 'ts', sortDir: -1 };
  function auditToday() {
    var max = '';
    DB('auditLogs').forEach(function (r) { var d = String(r.ts).slice(0, 10); if (d > max) max = d; });
    return max;
  }
  function auditAddDays(iso, n) { var p = String(iso).split('-'); var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]) + n * 86400000); return d.toISOString().slice(0, 10); }
  function auditVal(id) { var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; }
  function auditSortVal(r, k) {
    if (k === 'user') return (r.user + ' ' + r.uid).toLowerCase();
    if (k === 'action') return r.action;
    if (k === 'module') return r.module;
    if (k === 'status') return r.status;
    return r.ts;
  }
  function getAuditFiltered() {
    var term = auditVal('audit-search').toLowerCase();
    var dateF = auditVal('flt-date') || 'all';
    var from = auditVal('flt-from'), to = auditVal('flt-to');
    var fu = auditVal('flt-user'), fr = auditVal('flt-role'), fa = auditVal('flt-action'),
        fm = auditVal('flt-module'), fs = auditVal('flt-status');
    var today = auditToday();
    var rows = DB('auditLogs').filter(function (r) {
      var day = String(r.ts).slice(0, 10);
      if (dateF === 'today' && day !== today) return false;
      if (dateF === 'yesterday' && day !== auditAddDays(today, -1)) return false;
      if (dateF === '7d' && day < auditAddDays(today, -6)) return false;
      if (dateF === '30d' && day < auditAddDays(today, -29)) return false;
      if (dateF === 'custom') { if (from && day < from) return false; if (to && day > to) return false; }
      if (fu && r.uid !== fu) return false;
      if (fr && r.role !== fr) return false;
      if (fa && r.action !== fa) return false;
      if (fm && r.module !== fm) return false;
      if (fs && r.status !== fs) return false;
      if (term) {
        var hay = (r.uid + ' ' + r.user + ' ' + r.action + ' ' + r.module + ' ' + r.desc + ' ' + r.ip + ' ' + r.targetId).toLowerCase();
        if (hay.indexOf(term) === -1) return false;
      }
      return true;
    });
    var k = AUDIT_STATE.sortKey, dir = AUDIT_STATE.sortDir;
    rows.sort(function (a, b) {
      var x = auditSortVal(a, k), y = auditSortVal(b, k);
      if (x < y) return -1 * dir;
      if (x > y) return 1 * dir;
      return 0;
    });
    return rows;
  }
  function auditSetText(id, v) { var el = document.getElementById(id); if (el) el.textContent = Number(v).toLocaleString('en-US'); }
  function renderAuditSummary() {
    var logs = DB('auditLogs'), today = auditToday();
    auditSetText('audit-total', logs.length);
    auditSetText('audit-today', logs.filter(function (r) { return String(r.ts).slice(0, 10) === today; }).length);
    auditSetText('audit-login', logs.filter(function (r) { return r.action === 'LOGIN'; }).length);
    auditSetText('audit-changes', logs.filter(function (r) { return r.action === 'CREATE' || r.action === 'UPDATE' || r.action === 'DELETE'; }).length);
    auditSetText('audit-failed', logs.filter(function (r) { return r.status === 'Failed'; }).length);
  }
  function paintAuditSort() {
    $$('[data-audit-sort]').forEach(function (th) {
      var on = th.getAttribute('data-audit-sort') === AUDIT_STATE.sortKey;
      var arrow = th.querySelector('[data-audit-arrow]');
      if (arrow) arrow.textContent = on ? (AUDIT_STATE.sortDir === 1 ? '↑' : '↓') : '';
    });
  }
  function renderAuditTable() {
    var tbody = document.getElementById('audit-tbody');
    if (!tbody) return;
    var rows = getAuditFiltered();
    var total = rows.length, per = AUDIT_STATE.per;
    var pages = Math.max(1, Math.ceil(total / per));
    if (AUDIT_STATE.page > pages) AUDIT_STATE.page = pages;
    if (AUDIT_STATE.page < 1) AUDIT_STATE.page = 1;
    var p = AUDIT_STATE.page;
    tbody.innerHTML = '';
    rows.slice((p - 1) * per, p * per).forEach(function (r) {
      var tr = document.createElement('tr');
      tr.className = 'transition hover:bg-mint-50/60 dark:hover:bg-white/[0.03]';
      tr.innerHTML =
        '<td class="num whitespace-nowrap px-5 py-3 font-mono text-[12px] text-slate-500">' + esc(r.ts) + '</td>' +
        '<td class="whitespace-nowrap px-3 py-3 font-mono text-[12px] font-bold text-pine-700 dark:text-white">' + esc(r.uid) + '</td>' +
        '<td class="whitespace-nowrap px-3 py-3 text-[13px] font-semibold text-slate-700 dark:text-slate-200">' + esc(r.user) + '</td>' +
        '<td class="whitespace-nowrap px-3 py-3 text-[13px] text-slate-600 dark:text-slate-300">' + esc(r.role) + '</td>' +
        '<td class="whitespace-nowrap px-3 py-3"><span class="num inline-block rounded-lg bg-cream px-2 py-1 font-mono text-[11px] font-bold text-pine-700 dark:bg-white/10 dark:text-emerald-300">' + esc(r.action) + '</span></td>' +
        '<td class="whitespace-nowrap px-3 py-3 text-[13px] text-slate-600 dark:text-slate-300">' + esc(r.module) + '</td>' +
        '<td class="max-w-[300px] truncate px-3 py-3 text-[13px] text-slate-500" title="' + esc(r.desc) + '">' + esc(r.desc) + '</td>' +
        '<td class="num whitespace-nowrap px-3 py-3 font-mono text-[12px] text-slate-500">' + esc(r.ip) + '</td>' +
        '<td class="whitespace-nowrap px-3 py-3">' + pill(r.status) + '</td>' +
        '<td class="px-5 py-3 text-right"><button type="button" data-audit-view="' + esc(r.id) + '" title="View detail" aria-label="View detail ' + esc(r.id) + '" class="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-white/10 dark:hover:text-emerald-300"><i data-lucide="eye" class="h-4 w-4"></i></button></td>';
      tbody.appendChild(tr);
    });
    var empty = document.getElementById('audit-empty');
    if (empty) empty.classList.toggle('hidden', total > 0);
    var info = document.getElementById('pager-info');
    if (info) info.textContent = total === 0 ? 'Menampilkan 0 dari 0' : 'Menampilkan ' + ((p - 1) * per + 1) + '–' + Math.min(p * per, total) + ' dari ' + total;
    var wrap = document.getElementById('pager-pages');
    if (wrap) {
      wrap.innerHTML = '';
      for (var i = 1; i <= pages; i++) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('data-audit-page', String(i));
        b.className = 'h-8 min-w-[2rem] rounded-lg px-2 text-xs font-bold transition ' + (i === p
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-white/10');
        b.textContent = String(i);
        wrap.appendChild(b);
      }
    }
    var prev = document.getElementById('pager-prev'), next = document.getElementById('pager-next');
    if (prev) prev.disabled = p <= 1;
    if (next) next.disabled = p >= pages;
    paintAuditSort();
    refreshIcons();
  }
  function openAuditDetail(id) {
    var r = DB('auditLogs').filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    var change = (r.field !== '-' || r.prev !== '-' || r.next !== '-')
      ? sectionTitle('Detail Perubahan') + detailRows(r, [
        { key: 'field', label: 'Kolom' }, { key: 'prev', label: 'Nilai Sebelumnya' }, { key: 'next', label: 'Nilai Baru' },
      ]) : '';
    openModal({
      title: 'Detail Log Aktivitas - ' + r.id,
      body: sectionTitle('Aktivitas') + detailRows(r, [
          { key: 'ts', label: 'Waktu' }, { key: 'uid', label: 'ID Pengguna' }, { key: 'user', label: 'Pengguna' },
          { key: 'role', label: 'Peran' }, { key: 'action', label: 'Aksi' }, { key: 'module', label: 'Modul' },
          { key: 'desc', label: 'Deskripsi' }, { key: 'ip', label: 'Alamat IP' },
          { key: 'status', label: 'Status', pill: true },
        ]) + sectionTitle('Target') + detailRows(r, [
          { key: 'target', label: 'Entitas Target' }, { key: 'targetId', label: 'ID Target' },
        ]) + change,
      foot: '<button type="button" data-close-modal class="' + BTN_GHOST + '">Tutup</button>',
    });
  }
  function auditCSV(rows) {
    function q(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
    var lines = [['Waktu', 'ID Pengguna', 'Nama Pengguna', 'Peran', 'Aksi', 'Modul', 'Deskripsi', 'Alamat IP', 'Status', 'Entitas Target', 'ID Target'].map(q).join(',')];
    rows.forEach(function (r) {
      lines.push([r.ts, r.uid, r.user, r.role, r.action, r.module, r.desc, r.ip, r.status, r.target, r.targetId].map(q).join(','));
    });
    return lines.join('\r\n');
  }
  function downloadAuditCSV(rows) {
    var d = new Date();
    var stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    var blob = new Blob([auditCSV(rows)], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'audit-log-' + stamp + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} a.remove(); }, 400);
  }
  function auditFillSelect(id, opts) {
    var sel = document.getElementById(id);
    if (!sel || sel.options.length > 1) return;
    opts.forEach(function (o) {
      var op = document.createElement('option');
      op.value = o.v;
      op.textContent = o.t;
      sel.appendChild(op);
    });
  }
  function auditToggleCustom() {
    var show = auditVal('flt-date') === 'custom';
    var w = document.getElementById('custom-range');
    if (w) w.style.display = show ? '' : 'none';
  }
  document.addEventListener('click', function (ev) {
    var v = ev.target.closest('[data-audit-view]');
    if (v) { openAuditDetail(v.getAttribute('data-audit-view')); return; }
    var pg = ev.target.closest('[data-audit-page]');
    if (pg) {
      var raw = pg.getAttribute('data-audit-page');
      if (raw === 'prev') AUDIT_STATE.page--;
      else if (raw === 'next') AUDIT_STATE.page++;
      else AUDIT_STATE.page = parseInt(raw, 10) || 1;
      renderAuditTable();
      return;
    }
    var s = ev.target.closest('[data-audit-sort]');
    if (s) {
      var k = s.getAttribute('data-audit-sort');
      if (AUDIT_STATE.sortKey === k) AUDIT_STATE.sortDir *= -1;
      else { AUDIT_STATE.sortKey = k; AUDIT_STATE.sortDir = 1; }
      AUDIT_STATE.page = 1;
      renderAuditTable();
    }
  });
  function initAuditPage() {
    if (!document.getElementById('audit-tbody')) return;
    var roles = [];
    DB('users').forEach(function (u) { if (roles.indexOf(u.role) === -1) roles.push(u.role); });
    auditFillSelect('flt-user', DB('users').map(function (u) { return { v: u.id, t: u.name + ' (' + u.id + ')' }; }));
    auditFillSelect('flt-role', roles.map(function (r) { return { v: r, t: r }; }));
    auditFillSelect('flt-action', AUDIT_ACTIONS.map(function (a) { return { v: a, t: a }; }));
    auditFillSelect('flt-module', AUDIT_MODULES.map(function (m) { return { v: m, t: m }; }));
    renderAuditSummary();
    renderAuditTable();
    var s = document.getElementById('audit-search');
    if (s) s.addEventListener('input', function () { AUDIT_STATE.page = 1; renderAuditTable(); });
    ['flt-date', 'flt-user', 'flt-role', 'flt-action', 'flt-module', 'flt-status', 'flt-from', 'flt-to'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', function () {
        if (id === 'flt-date') auditToggleCustom();
        AUDIT_STATE.page = 1;
        renderAuditTable();
      });
    });
    var per = document.getElementById('per-page');
    if (per) per.addEventListener('change', function () { AUDIT_STATE.per = parseInt(per.value, 10) || 10; AUDIT_STATE.page = 1; renderAuditTable(); });
    $$('[data-audit-export]').forEach(function (b) {
      b.addEventListener('click', function () {
        var rows = getAuditFiltered();
        var kind = b.getAttribute('data-audit-export');
        if (kind === 'csv') { downloadAuditCSV(rows); toast('Diekspor ' + rows.length + ' rekaman audit ke CSV.', 'info'); }
        else if (kind === 'excel') toast('Diekspor ' + rows.length + ' rekaman audit ke Excel.', 'info');
        else toast('Diekspor ' + rows.length + ' rekaman audit ke PDF.', 'info');
      });
    });
    auditToggleCustom();
  }

  /* ================= PART 4: access menu (role-based menu permissions) ================= */
  var MENU_GROUPS = [
    { label: 'Ringkasan', items: [['dashboard', 'Dashboard']] },
    { label: 'Manajemen', items: [['buildings', 'Gedung'], ['floors', 'Lantai'], ['rooms', 'Kamar'], ['employees', 'Karyawan'], ['meters', 'Meter'], ['dcu', 'DCU & IoT']] },
    { label: 'Energi & Token', items: [['tokens', 'Token'], ['transactions', 'Transaksi'], ['payments', 'Pembayaran'], ['tariffs', 'Tarif']] },
    { label: 'Pemantauan', items: [['notifications', 'Notifikasi'], ['reports', 'Laporan']] },
    { label: 'Sistem', items: [['users', 'Pengguna'], ['roles', 'Peran & Akses'], ['auditlog', 'Audit Log'], ['settings', 'Konfigurasi Sistem']] },
  ];
  function menuLabel(key) {
    for (var i = 0; i < MENU_GROUPS.length; i++) {
      var items = MENU_GROUPS[i].items;
      for (var j = 0; j < items.length; j++) if (items[j][0] === key) return items[j][1];
    }
    return '';
  }
  function accessCell(r) {
    var keys = (window.DBM.access && window.DBM.access[r.id]) || [];
    var labels = keys.map(menuLabel).filter(function (l) { return !!l; });
    var prev = labels.slice(0, 3).map(esc).join(', ');
    if (labels.length > 3) prev += ' <span class="font-bold text-emerald-600">+' + (labels.length - 3) + '</span>';
    return '<span class="font-bold text-pine-700 dark:text-white">' + labels.length + ' Menu</span>' +
      (labels.length ? '<span class="block text-[11px] font-medium text-slate-400">' + prev + '</span>' : '');
  }
  function accessRoleId() { var s = document.getElementById('access-role'); return s ? s.value : ''; }
  function accessAllowed(rid) { return (window.DBM && window.DBM.access && window.DBM.access[rid]) || []; }
  function renderAccessGroups() {
    var wrap = document.getElementById('access-groups');
    if (!wrap) return;
    var allowed = accessAllowed(accessRoleId());
    wrap.innerHTML = '';
    MENU_GROUPS.forEach(function (g) {
      var card = document.createElement('article');
      card.className = 'rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-card dark:border-white/10 dark:bg-pine-900 sm:p-5';
      var h = '<h3 class="text-sm font-extrabold tracking-tight text-pine-700 dark:text-white">' + esc(g.label) + '</h3><div class="mt-3 space-y-2">';
      g.items.forEach(function (it) {
        h += '<label class="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:bg-mint-50/60 dark:text-slate-300 dark:hover:bg-white/[0.03]">' +
          '<input type="checkbox" data-menu-key="' + it[0] + '"' + (allowed.indexOf(it[0]) > -1 ? ' checked' : '') + ' class="h-4 w-4 shrink-0 rounded accent-emerald-600">' + esc(it[1]) + '</label>';
      });
      card.innerHTML = h + '</div>';
      wrap.appendChild(card);
    });
    paintAccessCounts();
    refreshIcons();
  }
  function paintAccessCounts() {
    var boxes = $$('#access-groups input[type="checkbox"]');
    var total = boxes.length, on = boxes.filter(function (b) { return b.checked; }).length;
    var t = document.getElementById('access-total'), a = document.getElementById('access-allowed'), d = document.getElementById('access-denied');
    if (t) t.textContent = total;
    if (a) a.textContent = on;
    if (d) d.textContent = total - on;
  }
  function initAccessPage() {
    if (!document.getElementById('access-groups')) return;
    var sel = document.getElementById('access-role');
    if (sel && sel.options.length <= 1) {
      DB('roles').forEach(function (r) {
        var op = document.createElement('option');
        op.value = r.id;
        op.textContent = r.name + ' (' + r.id + ')';
        sel.appendChild(op);
      });
    }
    if (sel) {
      var hash = (window.location.hash || '').replace('#', '');
      if (hash && DB('roles').some(function (r) { return r.id === hash; })) sel.value = hash;
      if (!sel.value && DB('roles')[0]) sel.value = DB('roles')[0].id;
      sel.addEventListener('change', renderAccessGroups);
    }
    var all = document.getElementById('access-all'), none = document.getElementById('access-none'), save = document.getElementById('access-save');
    if (all) all.addEventListener('click', function () { $$('#access-groups input[type="checkbox"]').forEach(function (b) { b.checked = true; }); paintAccessCounts(); });
    if (none) none.addEventListener('click', function () { $$('#access-groups input[type="checkbox"]').forEach(function (b) { b.checked = false; }); paintAccessCounts(); });
    if (save) save.addEventListener('click', function () {
      var rid = accessRoleId();
      var keys = $$('#access-groups input[type="checkbox"]').filter(function (b) { return b.checked; }).map(function (b) { return b.getAttribute('data-menu-key'); });
      if (window.DBM) { window.DBM.access = window.DBM.access || {}; window.DBM.access[rid] = keys; }
      try { localStorage.setItem('verdant-access', JSON.stringify(window.DBM.access)); } catch (e) {}
      var r = DB('roles').filter(function (x) { return x.id === rid; })[0];
      toast('Akses diperbarui untuk ' + (r ? r.name : rid) + ' (' + keys.length + ' menu).', 'info');
      setTimeout(function () { window.location.href = 'roles.html'; }, 1200);
    });
    var wrap = document.getElementById('access-groups');
    if (wrap) wrap.addEventListener('change', paintAccessCounts);
    renderAccessGroups();
  }

  /* ================= PART 5: reports center (viewers + resolve + export) ================= */
  var MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtNow() {
    var d = new Date();
    function p2(n) { return (n < 10 ? '0' : '') + n; }
    return d.getDate() + ' ' + MON3[d.getMonth()] + ' ' + d.getFullYear() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  }
  function reportView(entity, row) {
    var cfg = TABLES[entity];
    openModal({
      title: LABELS[entity] + ' - ' + row[cfg.idKey],
      body: detailRows(row, cfg.columns.map(function (c) { return { key: c.key, label: c.label, pill: c.pill, render: c.render }; })),
      foot: '<button type="button" data-close-modal class="' + BTN_GHOST + '">Tutup</button>',
    });
  }
  VIEWERS.tokenreports = reportView;
  VIEWERS.consumption = reportView;
  VIEWERS.trxreports = reportView;
  VIEWERS.payreports = reportView;
  VIEWERS.meterreports = reportView;
  VIEWERS.incidents = function (entity, row) {
    openModal({
      title: 'Detail Insiden - ' + row.id,
      body: sectionTitle('Laporan') + detailRows(row, [
          { key: 'id', label: 'ID Laporan' }, { key: 'ts', label: 'Tanggal & Waktu' }, { key: 'type', label: 'Jenis' },
          { key: 'room', label: 'Kamar' }, { key: 'device', label: 'Perangkat' }, { key: 'desc', label: 'Deskripsi' },
          { key: 'priority', label: 'Prioritas' }, { key: 'status', label: 'Status', pill: true },
        ]) + sectionTitle('Penanganan') + detailRows(row, [
          { key: 'handledBy', label: 'Ditangani Oleh' }, { key: 'handledAt', label: 'Waktu Penanganan' }, { key: 'resolution', label: 'Resolusi / Catatan' },
        ]),
      foot: '<button type="button" data-close-modal class="' + BTN_GHOST + '">Tutup</button>' +
        (row.status !== 'Resolved' ? '<button type="button" data-m-resolve class="' + BTN_PRIMARY + '">Tangani / Selesaikan</button>' : ''),
      onOpen: function (body, foot) {
        var b = foot.querySelector('[data-m-resolve]');
        if (b) b.addEventListener('click', function () { closeModal(); openResolveModal(row); });
      },
    });
  };
  function openResolveModal(row) {
    openModal({
      title: 'Tangani insiden - ' + row.id,
      body: sectionTitle('Insiden') + detailRows(row, [
          { key: 'id', label: 'ID Laporan' }, { key: 'type', label: 'Jenis' }, { key: 'device', label: 'Perangkat' }, { key: 'status', label: 'Status Saat Ini', pill: true },
        ]) + sectionTitle('Resolusi') +
        '<label class="mb-3 block"><span class="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">Resolusi / Catatan</span>' +
        '<textarea data-r-field="resolution" rows="3" placeholder="Jelaskan perbaikan..." class="w-full rounded-xl border border-emerald-900/10 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-pine-800 dark:text-white">' + esc(row.resolution === '-' ? '' : row.resolution) + '</textarea></label>' +
        '<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">' +
        '<label class="block"><span class="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">Ditangani Oleh</span>' +
        '<input data-r-field="handledBy" value="' + esc(row.handledBy === '-' ? '' : row.handledBy) + '" placeholder="Nama teknisi" class="w-full rounded-xl border border-emerald-900/10 bg-white px-3 py-2.5 text-[13px] font-semibold text-pine-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-pine-800 dark:text-white"></label>' +
        '<label class="block"><span class="mb-1.5 block text-xs font-bold text-slate-500 dark:text-slate-400">Status</span>' +
        '<select data-r-field="status" class="w-full rounded-xl border border-emerald-900/10 bg-white px-3 py-2.5 text-[13px] font-semibold text-pine-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-pine-800 dark:text-white"><option value="Handling"' + (row.status === 'Handling' ? ' selected' : '') + '>Sedang Ditangani</option><option value="Resolved"' + (row.status !== 'Handling' ? ' selected' : '') + '>Selesai</option></select></label></div>',
      foot: '<button type="button" data-close-modal class="' + BTN_GHOST + '">Batal</button>' +
        '<button type="button" data-r-save class="' + BTN_PRIMARY + '">Simpan</button>',
      onOpen: function (body, foot) {
        var save = foot.querySelector('[data-r-save]');
        if (save) save.addEventListener('click', function () {
          var g = function (k) { var el = body.querySelector('[data-r-field="' + k + '"]'); return el ? (el.value || '').trim() : ''; };
          var who = g('handledBy');
          if (!who) { toast('Nama penangan wajib diisi.', 'warn'); return; }
          row.resolution = g('resolution') || '-';
          row.handledBy = who;
          row.handledAt = fmtNow();
          row.status = g('status') || 'Resolved';
          renderTable('incidents');
          renderIncidentSummary();
          closeModal();
          toast(row.id + ' ditandai sebagai ' + (STATUS_LABEL[row.status.toLowerCase()] || row.status) + '.', 'info');
        });
      },
    });
  }
  function renderIncidentSummary() {
    var logs = DB('incidents');
    function set(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
    set('inc-total', logs.length);
    set('inc-open', logs.filter(function (r) { return r.status === 'Open'; }).length);
    set('inc-handling', logs.filter(function (r) { return r.status === 'Handling'; }).length);
    set('inc-resolved', logs.filter(function (r) { return r.status === 'Resolved'; }).length);
    set('inc-critical', logs.filter(function (r) { return r.priority === 'Kritis' && r.status !== 'Resolved'; }).length);
  }
  function downloadReportCSV(entity, rows) {
    var cfg = TABLES[entity];
    function q(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
    var lines = [cfg.columns.map(function (c) { return q(c.label); }).join(',')];
    rows.forEach(function (r) { lines.push(cfg.columns.map(function (c) { return q(r[c.key]); }).join(',')); });
    var d = new Date();
    var stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    var blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = entity + '-report-' + stamp + '.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} a.remove(); }, 400);
  }
  function fillTrxSelect(id, values) {
    var sel = document.getElementById(id);
    if (!sel || sel.options.length > 1) return;
    values.forEach(function (v) {
      var op = document.createElement('option');
      op.value = v;
      op.textContent = v;
      sel.appendChild(op);
    });
  }
  function trxToggleCustom() {
    var psel = document.querySelector('[data-period-for="transactions"]');
    var w = document.getElementById('trx-custom-range');
    if (w) w.style.display = psel && psel.value === 'custom' ? '' : 'none';
  }
  function initTransactionsPage() {
    if (!document.getElementById('tbl-transactions')) return;
    function uniq(key) { var out = []; DB('transactions').forEach(function (r) { if (out.indexOf(r[key]) === -1) out.push(r[key]); }); return out.sort(); }
    fillTrxSelect('flt-trx-employee', uniq('employee'));
    fillTrxSelect('flt-trx-room', uniq('room'));
    fillTrxSelect('flt-trx-meter', uniq('meter'));
    var psel = document.querySelector('[data-period-for="transactions"]');
    if (psel) psel.addEventListener('change', trxToggleCustom);
    trxToggleCustom();
  }
  function initReportExport() {
    $$('[data-report-export]').forEach(function (b) {
      b.addEventListener('click', function () {
        var entity = b.getAttribute('data-entity');
        var rows = filterEngineRows(entity);
        var kind = b.getAttribute('data-report-export');
        if (kind === 'csv') { downloadReportCSV(entity, rows); toast('Diekspor ' + rows.length + ' data ke CSV.', 'info'); }
        else if (kind === 'excel') toast('Diekspor ' + rows.length + ' data ke Excel.', 'info');
        else toast('Diekspor ' + rows.length + ' data ke PDF.', 'info');
      });
    });
  }

  /* ---------- Meter detail page ---------- */
  function buildingName(code) {
    var b = DB('buildings').filter(function (x) { return x.code === code; })[0];
    return b ? b.name : code;
  }
  var MD_DASH = '<span class="text-slate-300 dark:text-slate-600">—</span>';
  function mdSplit(s) {
    var p = String(s == null ? '' : s).split(' ');
    return { n: p[0] || '', u: p.slice(1).join(' ') };
  }
  function mdText(v) {
    return (v == null || v === '' || v === '-') ? MD_DASH : esc(v);
  }
  function mdQuality(status) {
    var k = String(status).toLowerCase();
    if (k === 'online') return pill('Online', 'Baik');
    if (k === 'warning') return pill('Warning', 'Perlu Perhatian');
    return pill('Offline', 'Tidak Tersedia');
  }
  function mdRows(pairs) {
    return '<dl class="divide-y divide-emerald-900/5 text-[13px] dark:divide-white/5">' + pairs.map(function (p) {
      return '<div class="flex items-center justify-between gap-3 py-2.5"><dt class="font-medium text-slate-500 dark:text-slate-400">' + esc(p[0]) + '</dt><dd class="num text-right font-bold text-pine-700 dark:text-white">' + p[1] + '</dd></div>';
    }).join('') + '</dl>';
  }
  function mdSectionHead(title, sub) {
    return '<p class="text-[15px] font-extrabold tracking-tight text-pine-700 dark:text-white">' + esc(title) + '</p>' +
      (sub ? '<p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">' + esc(sub) + '</p>' : '');
  }
  function mdReadCard(icon, label, val, unit) {
    return '<div class="rounded-xl bg-cream/70 px-3 py-3 dark:bg-white/5">' +
      '<p class="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400"><i data-lucide="' + icon + '" class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"></i>' + esc(label) + '</p>' +
      '<p class="num mt-1.5 text-lg font-extrabold tracking-tight text-pine-700 dark:text-white">' +
      (val ? esc(val) + (unit ? ' <span class="text-[11px] font-bold text-slate-400">' + esc(unit) + '</span>' : '') : MD_DASH) + '</p></div>';
  }
  var hierDorm = '', hierBuilding = '', hierDcu = '';
  function dcuBuilding(dcuId) {
    var ms = DB('meters').filter(function (x) { return x.dcu === dcuId; });
    if (!ms.length) {
      var d = DB('dcus').filter(function (x) { return x.id === dcuId; })[0] || {};
      var mt = /Gedung ([ABC])/.exec(d.location || '');
      return mt ? 'GYS-BLD-' + mt[1] : '';
    }
    var cnt = {};
    ms.forEach(function (x) { cnt[x.building] = (cnt[x.building] || 0) + 1; });
    var best = '', bn = -1;
    Object.keys(cnt).forEach(function (k) { if (cnt[k] > bn) { bn = cnt[k]; best = k; } });
    return best;
  }
  function mdLed(status) {
    var k = String(status).toLowerCase();
    var c = { online: 'bg-emerald-400', warning: 'bg-amber-400', offline: 'bg-slate-400', maintenance: 'bg-sky-400' }[k] || 'bg-slate-400';
    return '<span class="h-2 w-2 shrink-0 rounded-full ' + c + '"></span>';
  }
  function initMeterHier() {
    var root = document.getElementById('meter-hier-root');
    if (!root) return;
    try {
      var q = new URLSearchParams(window.location.search || '');
      hierDorm = q.get('asrama') || ''; hierBuilding = q.get('gedung') || ''; hierDcu = q.get('dcu') || '';
    } catch (e) { hierDorm = ''; hierBuilding = ''; hierDcu = ''; }
    if (!dormRec(hierDorm)) hierDorm = '';
    var hierB = DB('buildings').filter(function (b) { return b.code === hierBuilding; })[0];
    if (hierB && !hierDorm) {
      var bd = dormRec(hierB.dorm);
      hierDorm = bd ? bd.code : '';
    }
    if (!hierB || (hierDorm && buildingsOf(hierDorm).indexOf(hierB) === -1)) { hierBuilding = ''; hierDcu = ''; }
    if (hierDcu && (dcuBuilding(hierDcu) !== hierBuilding || !DB('dcus').filter(function (d) { return d.id === hierDcu; })[0])) hierDcu = '';
    renderMeterHier();
    if (!root.getAttribute('data-hierbound')) {
      root.setAttribute('data-hierbound', '1');
      root.addEventListener('change', function (ev) {
        if (ev.target && ev.target.id === 'hier-asrama') {
          hierDorm = ev.target.value; hierBuilding = ''; hierDcu = '';
          renderMeterHier(); refreshIcons();
        }
        if (ev.target && ev.target.id === 'hier-gedung') {
          hierBuilding = ev.target.value; hierDcu = '';
          renderMeterHier(); refreshIcons();
        }
        if (ev.target && ev.target.id === 'hier-dcu') {
          hierDcu = ev.target.value;
          renderMeterHier(); refreshIcons();
        }
      });
    }
  }
  function meterCard(m) {
    var rd = mdSplit(m.reading);
    var stKey = String(m.status).toLowerCase();
    var ledc = { online: 'bg-emerald-400 animate-pulse', warning: 'bg-amber-400', offline: 'bg-slate-400', maintenance: 'bg-sky-400' }[stKey] || 'bg-slate-400';
    var room = DB('rooms').filter(function (x) { return x.room === m.room; })[0] || {};
    var occLabel = room.tenant ? 'Tenant' : 'Karyawan';
    function kv(k, v) {
      return '<div class="flex items-center justify-between gap-2"><dt class="shrink-0 text-mint-100/70">' + k + '</dt><dd class="truncate font-bold text-white">' + v + '</dd></div>';
    }
    function op(act, icon, title, danger) {
      return '<button type="button" data-act="' + act + '" data-id="' + esc(m.id) + '" title="' + title + '" aria-label="' + title + '" class="grid h-7 w-7 place-items-center rounded-lg transition ' + (danger ? 'text-rose-300/80 hover:bg-white/10 hover:text-rose-200' : 'text-mint-100/70 hover:bg-white/10 hover:text-white') + '"><i data-lucide="' + icon + '" class="h-3.5 w-3.5"></i></button>';
    }
    return '<article class="flex flex-col rounded-2xl bg-gradient-to-b from-pine-700 via-moss-600 to-pine-900 p-4 text-white shadow-card">' +
      '<div class="flex items-center justify-between gap-2">' +
      '<p class="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.16em] text-mint-100/80"><i data-lucide="zap" class="h-3.5 w-3.5"></i>ENERGY METER</p>' +
      '<span class="flex items-center gap-1.5 text-[11px] font-bold"><span class="h-2 w-2 rounded-full ' + ledc + '"></span>' + esc(STATUS_LABEL[stKey] || m.status) + '</span></div>' +
      '<div class="mt-3 rounded-xl bg-pine-950/70 px-3 py-3 text-center ring-1 ring-white/10">' +
      (rd.n ? '<p class="num font-mono text-2xl font-extrabold tracking-tight text-emerald-300">' + esc(rd.n) + ' <span class="text-xs font-bold text-emerald-200/70">' + esc(rd.u) + '</span></p>'
        : '<p class="py-1 text-2xl font-extrabold text-emerald-200/40">—</p>') +
      '<p class="mt-1 text-[11px] text-mint-100/70">Kredit <span class="num font-bold text-white">' + (m.credit ? esc(m.credit) : '—') + '</span></p></div>' +
      '<dl class="mt-3 space-y-1 text-[12px]">' +
      kv('ID', '<span class="font-mono">' + esc(m.id) + '</span>') +
      kv('Serial', '<span class="font-mono">' + esc(m.sn) + '</span>') +
      kv('DCU', '<span class="font-mono">' + esc(m.dcu) + '</span>') +
      kv('Asrama', esc(m.dorm && m.dorm !== '-' ? m.dorm : '—')) +
      kv('Gedung', esc(buildingName(m.building))) +
      kv('Lantai · Kamar', 'L' + esc(m.floor) + ' · ' + esc(m.room)) +
      kv(occLabel, (m.employee && m.employee !== '-') ? esc(m.employee) : '—') +
      '</dl>' +
      '<div class="mt-3 flex items-center gap-0.5 border-t border-white/10 pt-2.5">' +
      op('connect', 'plug-zap', 'Hubungkan') + op('disconnect', 'unplug', 'Putuskan') + op('recharge', 'battery-charging', 'Isi ulang') + op('edit', 'pencil', 'Ubah') + op('delete', 'trash-2', 'Hapus', true) +
      '<a href="meter-detail.html?id=' + encodeURIComponent(m.id) + '" class="ml-auto inline-flex items-center gap-1 rounded-lg bg-emerald-500/90 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-400">Detail</a>' +
      '</div></article>';
  }
  function renderMeterHier() {
    var root = document.getElementById('meter-hier-root');
    if (!root) return;
    var SEL = 'w-full rounded-xl border border-emerald-900/10 bg-white px-3 py-2.5 text-sm font-bold text-pine-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-pine-800 dark:text-white';
    var LAB = 'mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500';
    function wrap(id, label, inner) {
      return '<label class="block min-w-[200px] flex-1 sm:max-w-[240px]"><span class="' + LAB + '">' + esc(label) + '</span>' +
        '<select id="' + id + '" class="' + SEL + '">' + inner + '</select></label>';
    }
    var dOpts = '<option value="">Pilih Asrama</option>' + DB('dorms').map(function (d) {
      return '<option value="' + esc(d.code) + '"' + (d.code === hierDorm ? ' selected' : '') + '>' + esc(d.name) + '</option>';
    }).join('');
    var html = '<section class="rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-card dark:border-white/10 dark:bg-pine-900 sm:p-5">' +
      '<div class="flex flex-wrap gap-3">' + wrap('hier-asrama', 'Asrama', dOpts);
    if (hierDorm) {
      var bOpts = '<option value="">Pilih Gedung</option>' + buildingsOf(hierDorm).map(function (b) {
        return '<option value="' + esc(b.code) + '"' + (b.code === hierBuilding ? ' selected' : '') + '>' + esc(b.name) + '</option>';
      }).join('');
      html += wrap('hier-gedung', 'Gedung', bOpts);
    }
    if (hierDorm && hierBuilding) {
      var cOpts = '<option value="">Pilih DCU</option>' + DB('dcus').filter(function (d) { return (d.building || dcuBuilding(d.id)) === hierBuilding; }).map(function (d) {
        var lbl = STATUS_LABEL[String(d.status).toLowerCase()] || d.status;
        return '<option value="' + esc(d.id) + '"' + (d.id === hierDcu ? ' selected' : '') + '>' + esc(d.id) + ' · ' + esc(lbl) + '</option>';
      }).join('');
      html += wrap('hier-dcu', 'DCU', cOpts);
    }
    html += '</div></section>';
    function hint(t) { return '<p class="mt-3 text-[13px] font-medium text-slate-500 dark:text-slate-400">' + esc(t) + '</p>'; }
    if (!hierDorm) { root.innerHTML = html + hint('Pilih asrama untuk melihat gedung.'); return; }
    if (!hierBuilding) { root.innerHTML = html + hint('Pilih gedung untuk melihat DCU.'); return; }
    if (!hierDcu) { root.innerHTML = html + hint('Pilih DCU untuk melihat meter.'); return; }
    var ms = DB('meters').filter(function (x) { return x.dcu === hierDcu; });
    html += '<section class="mt-3.5"><div><h3 class="text-[15px] font-extrabold tracking-tight text-pine-700 dark:text-white">Meter pada ' + esc(hierDcu) + '</h3>' +
      '<p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">' + ms.length + ' meter terhubung</p></div>' +
      (ms.length ? '<div data-entity="meters" class="mt-3 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">' + ms.map(meterCard).join('') + '</div>'
        : hint('Belum ada meter yang terhubung dengan DCU ini.')) + '</section>';
    root.innerHTML = html;
  }
  function mdHero(label, val, unit) {
    return '<div class="rounded-xl bg-gradient-to-br from-pine-700 via-moss-600 to-emerald-700 px-5 py-4 text-white shadow-card">' +
      '<p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-mint-100/80">' + esc(label) + '</p>' +
      (val ? '<p class="num mt-1 font-mono text-3xl font-extrabold tracking-tight">' + esc(val) + (unit ? ' <span class="text-sm font-bold text-mint-100/80">' + esc(unit) + '</span>' : '') + '</p>'
        : '<p class="mt-1 text-3xl font-extrabold text-mint-100/40">—</p>') + '</div>';
  }
  function initMeterDetail() {
    var root = document.getElementById('meter-detail-root');
    if (!root) return;
    var id = '';
    try { id = new URLSearchParams(window.location.search || '').get('id') || ''; } catch (e) { id = ''; }
    var m = DB('meters').filter(function (x) { return x.id === id; })[0];
    renderMeterDetail(m || null);
    if (m) document.title = 'GYS Dormitory Energy - ' + m.id;
  }
  (function meterDetailCrumb() {
    if (!document.getElementById('meter-detail-root')) return;
    var id = '';
    try { id = new URLSearchParams(window.location.search || '').get('id') || ''; } catch (e) { id = ''; }
    if (id) paintCrumb((PAGE_CRUMB[document.body.getAttribute('data-page')] || []).concat([id]));
  })();
  function mdMini(label, inner) {
    return '<div class="rounded-xl bg-cream/70 px-3 py-2.5 dark:bg-white/5">' +
      '<p class="text-[11px] font-bold text-slate-500 dark:text-slate-400">' + esc(label) + '</p>' +
      '<p class="num mt-1 text-[15px] font-extrabold tracking-tight text-pine-700 dark:text-white">' + inner + '</p></div>';
  }
  function renderMeterDetail(m) {
    var root = document.getElementById('meter-detail-root');
    if (!root) return;
    if (!m) {
      root.innerHTML =
        '<a href="meters.html" class="inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-700 transition hover:underline dark:text-emerald-400"><i data-lucide="arrow-left" class="h-4 w-4"></i>Kembali ke Meter</a>' +
        '<section class="mt-3 rounded-2xl border border-emerald-900/10 bg-white p-10 text-center shadow-card dark:border-white/10 dark:bg-pine-900">' +
        '<span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream text-slate-400 dark:bg-white/5"><i data-lucide="gauge" class="h-6 w-6"></i></span>' +
        '<h2 class="mt-3 text-lg font-extrabold tracking-tight text-pine-700 dark:text-white">Meter tidak ditemukan</h2>' +
        '<p class="mx-auto mt-1 max-w-sm text-[13px] text-slate-500 dark:text-slate-400">ID meter tidak cocok dengan data mana pun. Kembali ke daftar meter untuk memilih perangkat.</p>' +
        '<a href="meters.html" class="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-moss-600 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:brightness-110">Kembali ke Meter</a></section>';
      return;
    }
    var dcu = DB('dcus').filter(function (x) { return x.id === m.dcu; })[0] || {};
    var room = DB('rooms').filter(function (x) { return x.room === m.room; })[0] || {};
    var occLabel = room.tenant ? 'Tenant' : 'Karyawan';
    var rd = mdSplit(m.reading), us = mdSplit(m.usage);
    function phasePanel(ph) {
      return '<div class="rounded-xl bg-cream/70 px-4 py-3 dark:bg-white/5">' +
        '<p class="text-sm font-extrabold text-pine-700 dark:text-white">' + ph + '</p>' +
        mdRows([['Tegangan', MD_DASH], ['Arus', MD_DASH], ['Daya Aktif', MD_DASH], ['Faktor Daya', MD_DASH]]) + '</div>';
    }
    root.innerHTML =
      '<a href="meters.html" class="inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-700 transition hover:underline dark:text-emerald-400"><i data-lucide="arrow-left" class="h-4 w-4"></i>Kembali ke Meter</a>' +
      '<div class="mt-2 flex flex-wrap items-end justify-between gap-3"><div>' +
      '<h2 class="text-xl font-extrabold tracking-tight text-pine-700 dark:text-white sm:text-2xl">Meter ' + esc(m.id) + '</h2>' +
      '<p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Smart Energy Meter</p></div>' +
      '<div class="flex flex-col items-start gap-1.5 sm:items-end">' + pill(m.status) +
      '<p class="text-xs text-slate-500 dark:text-slate-400">Pembaruan terakhir: <span class="font-bold text-slate-600 dark:text-slate-300">' + esc(m.updated || '-') + '</span></p></div></div>' +
      '<section class="mt-4 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-card dark:border-white/10 dark:bg-pine-900">' +
      mdSectionHead('Informasi Perangkat', 'Identitas, koneksi, dan lokasi pemasangan') +
      '<div class="mt-2">' + mdRows([
        ['ID Meter', '<span class="font-mono">' + esc(m.id) + '</span>'],
        ['Nomor Seri', '<span class="font-mono">' + esc(m.sn) + '</span>'],
        ['DCU', '<span class="font-mono">' + esc(m.dcu) + '</span>' + (dcu.name ? '<span class="block text-[11px] font-medium text-slate-400">' + esc(dcu.name) + (dcu.ip ? ' · ' + esc(dcu.ip) : '') + '</span>' : '')],
        ['Asrama', esc(m.dorm)],
        ['Gedung', esc(buildingName(m.building))],
        ['Lantai', 'Lantai ' + esc(m.floor)],
        ['Kamar', esc(m.room)],
        [occLabel, mdText(m.employee)],
        ['Kredit', m.credit ? esc(m.credit) : MD_DASH],
        ['Tanggal Pemasangan', mdText(m.installed)],
      ]) + '</div></section>' +
      '<section class="mt-3.5 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-card dark:border-white/10 dark:bg-pine-900">' +
      mdSectionHead('Electrical Overview', 'Instrumen pembacaan utama') +
      '<div class="mt-3 grid gap-3 sm:grid-cols-2">' + mdHero('Energi', rd.n, rd.u) + mdHero('Daya Aktif', us.n, us.u) + '</div>' +
      '<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">' +
      mdMini('Tegangan', MD_DASH) + mdMini('Arus', MD_DASH) + mdMini('Faktor Daya', MD_DASH) + mdMini('Frekuensi', MD_DASH) +
      '</div></section>' +
      '<section class="mt-3.5 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-card dark:border-white/10 dark:bg-pine-900">' +
      mdSectionHead('Pemantauan Tiga Fasa', 'L1 · L2 · L3') +
      '<div class="mt-3 grid gap-3 sm:grid-cols-3">' + phasePanel('L1') + phasePanel('L2') + phasePanel('L3') + '</div></section>' +
      '<section class="mt-3.5 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-card dark:border-white/10 dark:bg-pine-900">' +
      mdSectionHead('Daya', 'Beban dan kebutuhan daya') +
      '<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">' +
      mdMini('Daya Aktif', us.n ? esc(us.n) + ' <span class="text-[11px] font-bold text-slate-400">' + esc(us.u) + '</span>' : MD_DASH) +
      mdMini('Daya Reaktif', MD_DASH) + mdMini('Daya Semu', MD_DASH) +
      mdMini('Kebutuhan Maksimum', MD_DASH) + mdMini('Maksimum Impor', MD_DASH) + mdMini('Maksimum Ekspor', MD_DASH) +
      '</div></section>' +
      '<section class="mt-3.5 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-card dark:border-white/10 dark:bg-pine-900">' +
      mdSectionHead('Energi', 'Akumulasi energi') +
      '<div class="mt-3">' + mdHero('Energi Impor Total', rd.n, rd.u) + '</div>' +
      '<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">' +
      mdMini('Energi Impor T1', MD_DASH) + mdMini('Energi Impor T2', MD_DASH) + mdMini('Energi Ekspor Total', MD_DASH) +
      mdMini('Energi Ekspor T1', MD_DASH) + mdMini('Energi Ekspor T2', MD_DASH) + mdMini('Energi Reaktif Impor', MD_DASH) +
      mdMini('Energi Reaktif Ekspor', MD_DASH) + mdMini('Energi Semu Impor', MD_DASH) + mdMini('Energi Semu Ekspor', MD_DASH) +
      '</div></section>' +
      '<section class="mt-3.5 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-card dark:border-white/10 dark:bg-pine-900">' +
      mdSectionHead('Kualitas Daya', 'Faktor daya, frekuensi, dan harmonisa') +
      '<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">' +
      mdMini('Faktor Daya', MD_DASH) + mdMini('Faktor Daya L1', MD_DASH) + mdMini('Faktor Daya L2', MD_DASH) +
      mdMini('Faktor Daya L3', MD_DASH) + mdMini('Frekuensi', MD_DASH) +
      '</div><div class="mt-1">' + mdRows([
        ['THD Tegangan L1 / L2 / L3', MD_DASH],
        ['THD Arus L1 / L2 / L3', MD_DASH],
      ]) + '</div></section>' +
      '<section class="mt-3.5 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-card dark:border-white/10 dark:bg-pine-900">' +
      mdSectionHead('Kebutuhan Maksimum', 'Beban puncak tercatat') +
      '<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">' +
      mdMini('Maksimum', MD_DASH) + mdMini('Maksimum Impor', MD_DASH) + mdMini('Impor Pada', MD_DASH) + mdMini('Maksimum Ekspor', MD_DASH) +
      mdMini('Ekspor Pada', MD_DASH) + mdMini('Maksimum Semu', MD_DASH) + mdMini('Semu Pada', MD_DASH) +
      '</div></section>' +
      '<section class="mt-3.5 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-card dark:border-white/10 dark:bg-pine-900">' +
      mdSectionHead('Informasi Perangkat & Pembacaan', 'Data teknis') +
      '<div class="mt-2">' + mdRows([
        ['Tanggal Meter', MD_DASH],
        ['Waktu Meter', MD_DASH],
        ['Tercatat', MD_DASH],
        ['Tercatat Perangkat', MD_DASH],
        ['Tercatat IoT', MD_DASH],
        ['Kualitas Pembacaan', mdQuality(m.status)],
        ['Kesalahan Fatal', MD_DASH],
        ['Periode Billing', MD_DASH],
      ]) + '</div></section>';
  }

  /* ---------- Init ---------- */
  initMeterHier();
  initMeterDetail();
  Object.keys(TABLES).forEach(function (e) { bindTableControls(e); renderTable(e); });
  applyStats();
  renderNotifs();
  renderAlerts();
  renderRecentTrx();
  renderExports();
  renderTariffHistory();
  renderMeterHistory();
  initAuditPage();
  initAccessPage();
  renderIncidentSummary();
  initReportExport();
  initTransactionsPage();
  initSettingsCrumb();
  buildConsumption();
  initTabs(document);
  refreshIcons();
})();
