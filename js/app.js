/* ============================================================
   Та ли Я — онлайн-запись
   Без зависимостей. Данные о записях хранятся локально
   (localStorage) + отправка в WhatsApp / добавление в календарь.
   ============================================================ */
(function () {
  'use strict';

  /* ---------------------------- ДАННЫЕ ---------------------------- */

  const PHONE = '79132321957';
  const PHONE_PRETTY = '+7 (913) 232-19-57';

  // Куда отправлять заявки. Пусто = только локально + WhatsApp.
  // Укажи URL своего бэкенда (PHP/Node/Google Apps Script), и заявка уйдёт POST-ом в JSON.
  const ENDPOINT = '';

  // Рабочее время (минуты от полуночи)
  const WORK = { open: 10 * 60, close: 21 * 60, step: 30 };

  const SERVICES = [
    // --- массаж ---
    { id: 'back',   cat: 'massage', name: 'Массаж спины и шейно-воротниковой зоны', dur: 40, price: 1000, desc: 'Снимает зажимы после сидячей работы, возвращает подвижность шее и плечам.', tags: ['40 мин', 'хит'] },
    { id: 'vibro',  cat: 'massage', name: 'Вибрационный массаж', dur: 45, price: 900,  desc: 'Глубокая проработка мышц вибрацией: расслабляет и разгоняет лимфу.', tags: ['45 мин'] },
    { id: 'lymph',  cat: 'massage', name: 'Лимфодренажный массаж', dur: 60, price: null, desc: 'Мягкий дренаж: снимает отёчность, лёгкость в ногах и теле.', tags: ['60 мин', 'курс'] },
    { id: 'anticell', cat: 'massage', name: 'Антицеллюлитный массаж', dur: 45, price: null, desc: 'Интенсивная проработка проблемных зон. Эффект — курсом.', tags: ['45 мин', 'курс'] },
    { id: 'corr',   cat: 'massage', name: 'Коррекционный массаж', dur: 50, price: null, desc: 'Работа с осанкой и перекосами: спина, таз, шея.', tags: ['50 мин'] },
    { id: 'lpg',    cat: 'massage', name: 'LPG · ролико-вакуумный массаж', dur: 40, price: null, desc: 'Аппаратная коррекция контуров тела, курс 8–10 процедур.', tags: ['аппарат'] },
    { id: 'presso', cat: 'massage', name: 'Прессотерапия', dur: 30, price: null, desc: 'Компрессионный массаж ног: тяжесть и отёки уходят за полчаса.', tags: ['30 мин'] },
    { id: 'face',   cat: 'massage', name: 'Массаж лица', dur: 30, price: null, desc: 'Тонус, лимфодренаж и расслабление мимических мышц.', tags: ['30 мин'] },
    { id: 'feet',   cat: 'massage', name: 'Массаж стоп', dur: 30, price: null, desc: 'Точки стоп отвечают за всё тело — начинаем с них.', tags: ['30 мин'] },

    // --- ногти ---
    { id: 'manicure',  cat: 'nails', name: 'Комби-маникюр', dur: 75, price: null, desc: 'Аппарат + кусачки: аккуратно, без пропилов и спешки.', tags: ['75 мин'] },
    { id: 'gel',       cat: 'nails', name: 'Маникюр с покрытием гель-лаком', dur: 90, price: null, desc: 'Стойкое покрытие на 3–4 недели, большой выбор оттенков.', tags: ['90 мин', 'хит'] },
    { id: 'teen',      cat: 'nails', name: 'Маникюр с гель-лаком (подростковый)', dur: 75, price: 900, desc: 'Аккуратный уход для подростков — без агрессивных материалов.', tags: ['75 мин'] },
    { id: 'pedicure',  cat: 'nails', name: 'Женский педикюр', dur: 90, price: null, desc: 'Обработка стоп и ногтей, покрытие по желанию.', tags: ['90 мин'] },
    { id: 'design',    cat: 'nails', name: 'Дизайн ногтей', dur: 30, price: null, desc: 'Френч, градиент, минимализм, стразы — обсуждаем на месте.', tags: ['30 мин'] },
    { id: 'male-nail', cat: 'nails', name: 'Мужской маникюр', dur: 60, price: null, desc: 'Гигиенический маникюр без покрытия, по-мужски лаконично.', tags: ['60 мин'] },

    // --- косметология ---
    { id: 'cosmo', cat: 'beauty', name: 'Аппаратная косметология', dur: 60, price: null, desc: 'Уходовые аппаратные процедуры для лица. Подбираем по коже.', tags: ['60 мин'] },
    { id: 'cert',  cat: 'beauty', name: 'Подарочный сертификат', dur: 30, price: null, desc: 'На сумму или конкретную услугу. Красиво оформляем.', tags: ['подарок'] }
  ];

  const CATS = { massage: 'Массаж', nails: 'Ногти', beauty: 'Косметология' };

  const MASTERS = [
    { id: 'any',    name: 'Любой свободный', sub: 'подберём под время', role: 'any' },
    { id: 'm1',     name: 'Массажист',       sub: 'массаж и телесные практики', role: 'massage' },
    { id: 'm2',     name: 'Мастер ногтевого сервиса', sub: 'маникюр, педикюр, дизайн', role: 'nails' },
    { id: 'm3',     name: 'Косметолог-эстетист', sub: 'аппаратные уходы', role: 'beauty' }
  ];

  /* ---------------------------- УТИЛИТЫ ---------------------------- */

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const pad2 = n => String(n).padStart(2, '0');
  const ymd = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  const minutesToTime = m => pad2(Math.floor(m / 60)) + ':' + pad2(m % 60);

  const money = v => v == null ? 'по запросу' : v.toLocaleString('ru-RU') + ' ₽';

  const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  const RU_MONTH = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

  const fmtDate = d => d.getDate() + ' ' + MONTHS[d.getMonth()];
  const fmtDateFull = d => d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();

  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  /* ------------------------ ХРАНИЛИЩЕ ЗАПИСЕЙ ---------------------- */

  const STORE_KEY = 'taliya.bookings.v1';
  let memoryStore = [];

  function loadBookings() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return memoryStore;
    }
  }
  function saveBookings(list) {
    memoryStore = list;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) { /* приватный режим */ }
  }

  let bookings = loadBookings().filter(b => b && b.date);

  /* ---------------------------- СОСТОЯНИЕ -------------------------- */

  const state = {
    step: 1,
    serviceId: null,
    masterId: 'any',
    date: null,          // 'YYYY-MM-DD'
    start: null,         // минуты
    calStart: startOfDay(new Date()),
    form: { name: '', phone: '', comment: '' }
  };

  const byId = id => SERVICES.find(s => s.id === id);
  const curService = () => byId(state.serviceId);

  /* --------------------------- КАЛЕНДАРЬ --------------------------- */

  const CAL_DAYS = 14;

  function calBounds() {
    return {
      first: startOfDay(new Date()),
      last: new Date(startOfDay(new Date()).getTime() + 60 * 864e5)
    };
  }

  function shiftCalendar(dir) {
    const next = new Date(state.calStart);
    next.setDate(next.getDate() + dir * CAL_DAYS);
    const today = startOfDay(new Date());
    if (next < today) return;
    if (next > calBounds().last) return;
    state.calStart = next;
    renderCalendar();
  }

  function isPast(dateStr, startMin) {
    const now = new Date();
    const d = new Date(dateStr + 'T00:00:00');
    if (startOfDay(d) > startOfDay(now)) return false;
    if (startOfDay(d) < startOfDay(now)) return true;
    return startMin <= now.getHours() * 60 + now.getMinutes() + 30;
  }

  function overlaps(aStart, aDur, bStart, bDur) {
    return aStart < bStart + bDur && bStart < aStart + aDur;
  }

  /**
   * У каждого направления свой специалист, поэтому занятость считаем
   * по категории услуги: массаж, ногти, косметология — независимые потоки.
   */
  function catOf(serviceId) {
    const s = byId(serviceId);
    return s ? s.cat : 'massage';
  }

  function slotBusy(dateStr, start, dur, cat) {
    return bookings.some(b =>
      b.date === dateStr &&
      (b.category || catOf(b.serviceId)) === cat &&
      overlaps(start, dur, b.start, b.duration)
    );
  }

  function isSlotFree(dateStr, start, dur, cat) {
    return !slotBusy(dateStr, start, dur, cat);
  }

  function freeSlots(dateStr, dur, cat) {
    const out = [];
    for (let m = WORK.open; m + dur <= WORK.close; m += WORK.step) {
      if (isPast(dateStr, m)) continue;
      if (isSlotFree(dateStr, m, dur, cat)) out.push(m);
    }
    return out;
  }

  function renderCalendar() {
    const grid = $('#calGrid');
    const service = curService();
    if (!grid || !service) return;

    const start = state.calStart;
    const label = $('#calLabel');
    const end = new Date(start.getTime() + (CAL_DAYS - 1) * 864e5);
    label.textContent = fmtDate(start) + ' — ' + fmtDate(end);

    const today = startOfDay(new Date());
    $('#calPrev').disabled = start <= today;
    const maxStart = new Date(calBounds().last.getTime() - (CAL_DAYS - 1) * 864e5);
    $('#calNext').disabled = start >= maxStart;

    let html = WD.map(w => '<span class="calendar__dow">' + w + '</span>').join('');

    const offset = (start.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) html += '<span class="day" style="visibility:hidden"></span>';

    for (let i = 0; i < CAL_DAYS; i++) {
      const d = new Date(start.getTime() + i * 864e5);
      const ds = ymd(d);
      const free = freeSlots(ds, service.dur, service.cat).length;
      const isToday = ds === ymd(today);
      const sel = ds === state.date;
      const cls = ['day'];
      if (isToday) cls.push('is-today');
      if (sel) cls.push('is-selected');
      const disabled = free === 0;
      html += '<button type="button" class="' + cls.join(' ') + '" data-date="' + ds + '"' +
        (disabled ? ' disabled' : '') + ' title="' + (disabled ? 'нет свободного времени' : free + ' свободных слотов') + '">' +
        d.getDate() + '<small>' + (free ? free + ' св.' : '—') + '</small></button>';
    }
    grid.innerHTML = html;

    $$('.day[data-date]', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        state.date = btn.dataset.date;
        state.start = null;
        renderCalendar();
        renderSlots();
        $('#next3').disabled = true;
      });
    });
  }

  function renderSlots() {
    const grid = $('#slotsGrid');
    const label = $('#slotsLabel');
    const service = curService();
    if (!grid || !service) return;

    if (!state.date) {
      label.textContent = 'Выбери дату';
      grid.innerHTML = '<p class="slots__empty">Сначала выбери день в календаре.</p>';
      return;
    }

    const d = new Date(state.date + 'T00:00:00');
    label.textContent = fmtDate(d) + ', ' + WD[(d.getDay() + 6) % 7].toLowerCase();

    const slots = freeSlots(state.date, service.dur, service.cat);
    if (!slots.length) {
      grid.innerHTML = '<p class="slots__empty">На этот день свободных окон нет. Попробуй соседнюю дату.</p>';
      return;
    }

    grid.innerHTML = slots.map(m =>
      '<button type="button" class="slot' + (m === state.start ? ' is-selected' : '') + '" data-start="' + m + '">' +
      minutesToTime(m) + '</button>'
    ).join('');

    $$('.slot[data-start]', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        state.start = Number(btn.dataset.start);
        $$('.slot', grid).forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        $('#next3').disabled = false;
      });
    });
  }

  /* --------------------------- ШАГИ/ПАНЕЛИ ------------------------- */

  function goStep(n) {
    state.step = n;
    $$('.panel').forEach(p => p.classList.toggle('is-active', Number(p.dataset.panel) === n));
    $$('.step').forEach(s => {
      const i = Number(s.dataset.step);
      s.classList.toggle('is-active', i === n);
      s.classList.toggle('is-done', i < n);
    });
    if (n === 3) { renderCalendar(); renderSlots(); }
    if (n === 4) renderSummary();
    const widget = $('#bookingWidget');
    if (widget) {
      const y = widget.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  function renderSummary() {
    const s = curService();
    const box = $('#summary');
    if (!s || !box) return;
    const m = MASTERS.find(x => x.id === state.masterId) || MASTERS[0];
    const d = new Date(state.date + 'T00:00:00');
    box.innerHTML =
      row('Услуга', s.name) +
      row('Длительность', s.dur + ' мин') +
      row('Мастер', m.name) +
      row('Дата и время', fmtDateFull(d) + ', ' + minutesToTime(state.start)) +
      '<div class="summary__row summary__total"><span>Стоимость</span><strong>' + money(s.price) + '</strong></div>';
  }
  const row = (k, v) => '<div class="summary__row"><span>' + k + '</span><strong>' + v + '</strong></div>';

  /* ---------------------------- ВЫБОР УСЛУГ ------------------------ */

  function renderServiceChoose() {
    const box = $('#serviceChoose');
    if (!box) return;
    box.innerHTML = SERVICES.map(s =>
      '<button type="button" class="choose' + (s.id === state.serviceId ? ' is-selected' : '') + '" data-id="' + s.id + '">' +
        '<span><span class="choose__name">' + s.name + '</span>' +
        '<span class="choose__sub">' + CATS[s.cat] + ' · ' + s.dur + ' мин</span></span>' +
        '<span class="choose__price">' + (s.price == null ? '—' : s.price.toLocaleString('ru-RU') + ' ₽') +
        '<small>' + (s.price == null ? 'цена по запросу' : '') + '</small></span>' +
      '</button>'
    ).join('');

    $$('.choose', box).forEach(btn => {
      btn.addEventListener('click', () => {
        state.serviceId = btn.dataset.id;
        $$('.choose', box).forEach(b => b.classList.toggle('is-selected', b === btn));
        $('#next1').disabled = false;
      });
    });
  }

  function renderMasterChoose() {
    const box = $('#masterChoose');
    const s = curService();
    if (!box || !s) return;

    let list = MASTERS.slice();
    if (s.cat === 'massage') list = list.filter(m => m.role === 'any' || m.role === 'massage');
    if (s.cat === 'nails')   list = list.filter(m => m.role === 'any' || m.role === 'nails');
    if (s.cat === 'beauty')  list = list.filter(m => m.role === 'any' || m.role === 'beauty');

    if (!list.some(m => m.id === state.masterId)) state.masterId = list[0].id;

    box.innerHTML = list.map(m =>
      '<button type="button" class="choose' + (m.id === state.masterId ? ' is-selected' : '') + '" data-id="' + m.id + '">' +
        '<span class="choose__name">' + m.name + '</span>' +
        '<span class="choose__sub">' + m.sub + '</span>' +
      '</button>'
    ).join('');

    $$('.choose', box).forEach(btn => {
      btn.addEventListener('click', () => {
        state.masterId = btn.dataset.id;
        $$('.choose', box).forEach(b => b.classList.toggle('is-selected', b === btn));
      });
    });
  }

  /* ---------------------------- СЕТКА УСЛУГ ------------------------ */

  let activeCat = 'massage';

  function renderServices() {
    const grid = $('#serviceGrid');
    if (!grid) return;
    const list = SERVICES.filter(s => s.cat === activeCat);
    grid.innerHTML = list.map(s =>
      '<article class="service reveal">' +
        '<div class="service__top">' +
          '<h3 class="service__name">' + s.name + '</h3>' +
          '<span class="service__price">' + money(s.price) + '<small>' + s.dur + ' мин</small></span>' +
        '</div>' +
        '<p class="service__desc">' + s.desc + '</p>' +
        '<div class="service__meta">' + s.tags.map(t => '<span class="chip">' + t + '</span>').join('') + '</div>' +
        '<button type="button" class="service__btn" data-book="' + s.id + '">Записаться <span aria-hidden="true">→</span></button>' +
      '</article>'
    ).join('');

    $$('.service__btn', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        state.serviceId = btn.dataset.book;
        state.masterId = 'any';
        state.date = null;
        state.start = null;
        renderServiceChoose();
        $('#next1').disabled = false;
        goStep(1);
        document.getElementById('booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    observeReveals();
  }

  /* ---------------------------- ВАЛИДАЦИЯ -------------------------- */

  function normalizePhone(v) {
    let digits = (v || '').replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    return digits.slice(0, 11);
  }

  function formatPhone(v) {
    const d = normalizePhone(v).slice(1); // без 7
    let out = '+7';
    if (d.length) out += ' (' + d.slice(0, 3);
    if (d.length >= 3) out += ') ' + d.slice(3, 6);
    if (d.length >= 6) out += '-' + d.slice(6, 8);
    if (d.length >= 8) out += '-' + d.slice(8, 10);
    return out;
  }

  function setError(id, msg) {
    const input = document.getElementById(id);
    const err = document.querySelector('.field__error[data-for="' + id + '"]');
    if (input) input.classList.toggle('is-error', !!msg);
    if (err) err.textContent = msg || '';
  }

  function validate() {
    let ok = true;
    const name = $('#fName').value.trim();
    const phoneDigits = normalizePhone($('#fPhone').value);

    if (name.length < 2) { setError('fName', 'Напиши, как к тебе обращаться'); ok = false; }
    else setError('fName', '');

    if (phoneDigits.length !== 11) { setError('fPhone', 'Нужен номер из 11 цифр'); ok = false; }
    else setError('fPhone', '');

    if (!$('#fAgree').checked) { setError('fAgree', 'Без согласия мы не можем записать'); ok = false; }
    else setError('fAgree', '');

    return ok;
  }

  /* ---------------------------- ЗАВЕРШЕНИЕ ------------------------- */

  let lastBooking = null;

  function finish() {
    const s = curService();
    const m = MASTERS.find(x => x.id === state.masterId) || MASTERS[0];
    const d = new Date(state.date + 'T00:00:00');

    const booking = {
      id: 'b' + Date.now(),
      serviceId: s.id,
      serviceName: s.name,
      category: s.cat,
      price: s.price,
      duration: s.dur,
      masterId: state.masterId,
      masterName: m.name,
      date: state.date,
      start: state.start,
      name: $('#fName').value.trim(),
      phone: normalizePhone($('#fPhone').value),
      comment: $('#fComment').value.trim(),
      createdAt: new Date().toISOString()
    };

    bookings.push(booking);
    saveBookings(bookings);
    lastBooking = booking;

    // Отправка на сервер, если настроен ENDPOINT
    if (ENDPOINT) {
      try {
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking)
        }).catch(() => { /* заявка уже сохранена локально */ });
      } catch (e) { /* ignore */ }
    }

    const when = fmtDateFull(d) + ' в ' + minutesToTime(booking.start);
    $('#doneText').innerHTML =
      '<strong>' + booking.serviceName + '</strong><br>' +
      when + ' · ' + booking.duration + ' мин<br>' +
      'Мастер: ' + booking.masterName + '<br>' +
      '<span class="muted">' + booking.name + ', ' + formatPhone(booking.phone) + '</span>';

    const text = encodeURIComponent(
      'Здравствуйте! Хочу записаться в «Та ли Я».\n' +
      'Услуга: ' + booking.serviceName + '\n' +
      'Дата: ' + when + '\n' +
      'Длительность: ' + booking.duration + ' мин\n' +
      'Мастер: ' + booking.masterName + '\n' +
      'Имя: ' + booking.name + '\n' +
      'Телефон: ' + formatPhone(booking.phone) +
      (booking.comment ? '\nКомментарий: ' + booking.comment : '')
    );
    $('#waLink').href = 'https://wa.me/' + PHONE + '?text=' + text;

    goStep(5);
  }

  function downloadIcs() {
    if (!lastBooking) return;
    const b = lastBooking;
    const [Y, M, D] = b.date.split('-').map(Number);
    const start = new Date(Y, M - 1, D, Math.floor(b.start / 60), b.start % 60);
    const end = new Date(start.getTime() + b.duration * 60000);
    const fmt = dt => dt.getFullYear() + pad2(dt.getMonth() + 1) + pad2(dt.getDate()) +
      'T' + pad2(dt.getHours()) + pad2(dt.getMinutes()) + '00';

    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Taliya//Booking//RU', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + b.id + '@taliya',
      'DTSTAMP:' + fmt(new Date()),
      'DTSTART:' + fmt(start),
      'DTEND:' + fmt(end),
      'SUMMARY:' + b.serviceName + ' — Та ли Я',
      'LOCATION:Барнаул\\, Красноармейский проспект\\, 75Б\\, офис 58\\, 5 этаж',
      'DESCRIPTION:Мастер: ' + b.masterName + '\\nТелефон салона: ' + PHONE_PRETTY,
      'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Напоминание о записи', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'taliya-' + b.date + '.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function resetBooking() {
    state.serviceId = null;
    state.masterId = 'any';
    state.date = null;
    state.start = null;
    $('#bookForm').reset();
    $('#next1').disabled = true;
    $('#next3').disabled = true;
    renderServiceChoose();
    goStep(1);
  }

  /* ---------------------------- ХЕДЕР/HERO ------------------------- */

  function updateOpenStatus() {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const open = mins >= WORK.open && mins < WORK.close;
    const el = $('#heroStatus');
    if (!el) return;
    el.textContent = open ? 'Открыто до 21:00' : (mins < WORK.open ? 'Откроемся в 10:00' : 'Закрыто · откроемся в 10:00');
    el.classList.toggle('is-closed', !open);

    const s = byId('back');
    const todaySlots = freeSlots(ymd(now), s.dur, s.cat);
    const tag = $('#heroSlots');
    if (tag) {
      if (!open) tag.textContent = 'завтра с 10:00';
      else tag.textContent = todaySlots.length ? todaySlots.length + ' окон' : 'на завтра';
    }
  }

  /* ---------------------------- ИНИЦИАЛИЗАЦИЯ ---------------------- */

  function initHeader() {
    const header = $('#header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const burger = $('#burger');
    const nav = $('#nav');
    if (burger && nav) {
      burger.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(open));
      });
      $$('a', nav).forEach(a => a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }));
    }
  }

  let revealObserver = null;
  function observeReveals() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach(el => el.classList.add('is-visible'));
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); revealObserver.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
    }
    $$('.reveal:not(.is-visible)').forEach(el => revealObserver.observe(el));
  }

  function initTabs() {
    $$('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.tab').forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        activeCat = tab.dataset.cat;
        renderServices();
      });
    });
  }

  function initBooking() {
    renderServiceChoose();
    renderCalendar();
    renderSlots();

    $('#next1').addEventListener('click', () => { renderMasterChoose(); goStep(2); });
    $('#next2').addEventListener('click', () => goStep(3));
    $('#next3').addEventListener('click', () => goStep(4));

    $$('[data-back]').forEach(b => b.addEventListener('click', () => goStep(Number(b.dataset.back))));
    $('#calPrev').addEventListener('click', () => shiftCalendar(-1));
    $('#calNext').addEventListener('click', () => shiftCalendar(1));

    // маска телефона
    const phone = $('#fPhone');
    phone.addEventListener('input', () => { phone.value = formatPhone(phone.value); });
    phone.addEventListener('focus', () => { if (!phone.value) phone.value = '+7 ('; });
    phone.addEventListener('blur', () => { if (normalizePhone(phone.value).length <= 1) phone.value = ''; });
    ['#fName', '#fPhone'].forEach(sel => $(sel).addEventListener('input', () => setError(sel.slice(1), '')));
    $('#fAgree').addEventListener('change', () => setError('fAgree', ''));

    $('#bookForm').addEventListener('submit', e => {
      e.preventDefault();
      if (!state.serviceId || state.start == null || !state.date) {
        alert('Выбери услугу, дату и время.');
        goStep(state.serviceId ? 3 : 1);
        return;
      }
      if (!validate()) return;
      finish();
    });

    $('#icsBtn').addEventListener('click', downloadIcs);
    $('#againBtn').addEventListener('click', resetBooking);
  }

  function init() {
    $('#year').textContent = new Date().getFullYear();
    initHeader();
    initTabs();
    renderServices();
    initBooking();
    updateOpenStatus();
    setInterval(updateOpenStatus, 60000);
    observeReveals();

    // Заголовки секций — плавное появление
    $$('.section__head, .about__text, .review, .notice').forEach(el => el.classList.add('reveal'));
    observeReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
