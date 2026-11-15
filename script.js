/* «Красный Круг» — гончарная мастерская. Конструктор посещения, галерея, навигация. */
(function () {
  'use strict';

  var WHATSAPP_PHONE = '79039875438';
  var ADDRESS = 'Красноярск, ул. Взлётная, 30 — гончарная мастерская «Красный Круг»';
  var MIN_PEOPLE = 1;
  var MAX_PEOPLE = 12;
  var COMMENT_LIMIT = 300;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Тост ---------- */
  var toastEl = $('#toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2600);
  }

  /* ---------- Шапка: тень и прогресс чтения при скролле ---------- */
  var header = $('.site-header');
  var progressBar = $('#scroll-progress-bar');

  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
    progressBar.style.width = pct + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Мобильное меню ---------- */
  var navToggle = $('.nav-toggle');
  var siteNav = $('#site-nav');

  function closeMenu() {
    siteNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Открыть меню');
  }
  navToggle.addEventListener('click', function () {
    var open = siteNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });
  $$('a', siteNav).forEach(function (link) { link.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && siteNav.classList.contains('is-open')) {
      closeMenu();
      navToggle.focus();
    }
  });
  document.addEventListener('click', function (e) {
    if (siteNav.classList.contains('is-open') && !siteNav.contains(e.target) && !navToggle.contains(e.target)) {
      closeMenu();
    }
  });

  /* ---------- Активный раздел в навигации ---------- */
  var navLinks = $$('a[href^="#"]', siteNav);
  var sections = navLinks
    .map(function (a) { return $(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------- Появление блоков при скролле ---------- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Гончарный круг героя: ускоряется от курсора/касания ---------- */
  var wheelStage = $('#wheel-stage');
  if (wheelStage) {
    var setWheelFast = function (fast) {
      wheelStage.classList.toggle('is-fast', fast);
      wheelStage.style.setProperty('--disc-speed', fast ? '3s' : '14s');
    };
    wheelStage.addEventListener('pointerenter', function () { setWheelFast(true); });
    wheelStage.addEventListener('pointerleave', function () { setWheelFast(false); });
    wheelStage.addEventListener('click', function () {
      setWheelFast(!wheelStage.classList.contains('is-fast'));
    });
  }

  /* ---------- Конструктор посещения ---------- */
  var form = $('#visit-form');
  var peopleInput = $('#people-input');
  var peopleValue = $('#people-value');
  var peopleHint = $('#people-hint');
  var minusBtn = $('#people-minus');
  var plusBtn = $('#people-plus');
  var kidsWrap = $('#kids-age-wrap');
  var kidsInput = $('#kids-age');
  var kidsError = $('#kids-age-error');
  var dateInput = $('#wish-date');
  var dateError = $('#date-error');
  var flexCheck = $('#date-flex');
  var commentInput = $('#comment');
  var commentCount = $('#comment-count');
  var summaryCard = $('#summary-card');

  var AGE_LABELS = {
    adults: 'Взрослые',
    kids: 'Дети',
    family: 'Вместе, семьёй'
  };
  var FORMAT_LABELS = {
    hand: 'Лепка руками',
    wheel: 'Гончарный круг',
    both: 'Оба формата — выбор за мастером'
  };
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  dateInput.min = todayISO();

  function plural(n, one, few, many) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function parseKidsAges(raw) {
    // Пустое поле допустимо; иначе список целых чисел 3–17 через запятую, пробелы или «и».
    // \b не работает с кириллицей в JS — границы слова задаём явно.
    var cleaned = raw.trim().replace(/(^|[\s,;])и(?=$|[\s,;])/gi, '$1,');
    if (cleaned === '') return { valid: true, ages: [] };
    var tokens = cleaned.split(/[,\s;]+/).filter(Boolean);
    var ages = [];
    for (var i = 0; i < tokens.length; i++) {
      if (!/^\d{1,2}$/.test(tokens[i])) return { valid: false, ages: [] };
      var n = parseInt(tokens[i], 10);
      if (n < 3 || n > 17) return { valid: false, ages: [] };
      ages.push(n);
    }
    return { valid: true, ages: ages };
  }

  function getState() {
    var age = (form.querySelector('input[name="age"]:checked') || {}).value || 'adults';
    var format = (form.querySelector('input[name="format"]:checked') || {}).value || 'hand';
    var people = parseInt(peopleInput.value, 10) || MIN_PEOPLE;
    return {
      age: age,
      format: format,
      people: people,
      kidsRaw: kidsInput.value.trim(),
      flexible: flexCheck.checked,
      date: dateInput.value,
      comment: commentInput.value.trim()
    };
  }

  function formatDateHuman(iso) {
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var d = parseInt(parts[2], 10);
    if (!y || !m || !d) return iso;
    return d + ' ' + MONTHS[m - 1] + ' ' + y;
  }

  function dateSummaryText(state) {
    if (state.flexible) return 'Гибкая — уточним в переписке';
    if (state.date) return formatDateHuman(state.date) + ' (пожелание)';
    return 'Не выбрана — уточним в переписке';
  }

  function buildMessage(state) {
    var lines = [];
    lines.push('Здравствуйте! Хочу собрать посещение гончарной мастерской «Красный Круг» (Взлётная, 30).');
    lines.push('');

    var groupLine = 'Группа: ' + AGE_LABELS[state.age].toLowerCase();
    var parsed = parseKidsAges(state.kidsRaw);
    if ((state.age === 'kids' || state.age === 'family') && parsed.valid && parsed.ages.length) {
      groupLine += ', возраст детей: ' + parsed.ages.join(', ');
    }
    lines.push(groupLine + '.');
    lines.push('Участников: ' + state.people + '.');
    lines.push('Формат: ' + FORMAT_LABELS[state.format].toLowerCase() + '.');

    if (state.flexible) {
      lines.push('Дата: гибкая, подстроюсь под мастерскую.');
    } else if (state.date) {
      lines.push('Желаемая дата: ' + formatDateHuman(state.date) + ' (понимаю, что это пожелание — подтвердите, пожалуйста, свободное время).');
    } else {
      lines.push('Дата: пока не выбрана, подскажите ближайшие варианты.');
    }

    if (state.comment) {
      lines.push('');
      lines.push('Комментарий: ' + state.comment);
    }
    lines.push('');
    lines.push('Подскажите, пожалуйста, стоимость и удобное время. Спасибо!');
    return lines.join('\n');
  }

  function peopleHintText(n) {
    if (n === 1) return 'один на один с глиной и мастером';
    if (n === 2) return 'пара за одним столом';
    if (n <= 4) return 'небольшая компания';
    if (n <= 8) return 'дружная компания или семейный праздник';
    return 'большая группа — детали обсудим в переписке';
  }

  function setPeople(n) {
    n = Math.max(MIN_PEOPLE, Math.min(MAX_PEOPLE, n));
    peopleInput.value = String(n);
    peopleValue.textContent = String(n);
    peopleHint.textContent = peopleHintText(n);
    minusBtn.disabled = n <= MIN_PEOPLE;
    plusBtn.disabled = n >= MAX_PEOPLE;
  }

  minusBtn.addEventListener('click', function () {
    setPeople(parseInt(peopleInput.value, 10) - 1);
    render();
    pulseSummary();
  });
  plusBtn.addEventListener('click', function () {
    setPeople(parseInt(peopleInput.value, 10) + 1);
    render();
    pulseSummary();
  });

  function validateKids(showErrors) {
    var state = getState();
    var needed = state.age === 'kids' || state.age === 'family';
    var valid = !needed || parseKidsAges(kidsInput.value).valid;
    if (showErrors) {
      kidsInput.classList.toggle('is-invalid', !valid);
      kidsError.hidden = valid;
    } else if (valid) {
      kidsInput.classList.remove('is-invalid');
      kidsError.hidden = true;
    }
    return valid;
  }

  function validateDate(showErrors) {
    var valid = true;
    if (!flexCheck.checked && dateInput.value) {
      valid = dateInput.value >= todayISO();
    }
    if (showErrors) {
      dateInput.classList.toggle('is-invalid', !valid);
      dateError.hidden = valid;
    } else if (valid) {
      dateInput.classList.remove('is-invalid');
      dateError.hidden = true;
    }
    return valid;
  }

  var sumAge = $('#sum-age');
  var sumPeople = $('#sum-people');
  var sumFormat = $('#sum-format');
  var sumDate = $('#sum-date');
  var sumCommentRow = $('#sum-comment-row');
  var sumComment = $('#sum-comment');
  var preview = $('#message-preview');

  function updateCommentCount() {
    var len = commentInput.value.length;
    commentCount.textContent = len + ' / ' + COMMENT_LIMIT;
    commentCount.classList.toggle('is-limit', len >= COMMENT_LIMIT);
  }

  function render() {
    var state = getState();

    var needsKids = state.age === 'kids' || state.age === 'family';
    kidsWrap.hidden = !needsKids;
    dateInput.disabled = state.flexible;

    var ageText = AGE_LABELS[state.age];
    var parsed = parseKidsAges(state.kidsRaw);
    if (needsKids && parsed.valid && parsed.ages.length) {
      ageText += ' · возраст: ' + parsed.ages.join(', ');
    }
    sumAge.textContent = ageText;
    sumPeople.textContent = state.people + ' ' + plural(state.people, 'человек', 'человека', 'человек');
    sumFormat.textContent = FORMAT_LABELS[state.format];
    sumDate.textContent = dateSummaryText(state);
    sumCommentRow.hidden = !state.comment;
    sumComment.textContent = state.comment;
    preview.textContent = buildMessage(state);
    updateCommentCount();
  }

  var pulseTimer = null;
  function pulseSummary() {
    summaryCard.classList.remove('is-pulse');
    void summaryCard.offsetWidth;
    summaryCard.classList.add('is-pulse');
    clearTimeout(pulseTimer);
    pulseTimer = setTimeout(function () { summaryCard.classList.remove('is-pulse'); }, 550);
  }

  form.addEventListener('change', function (e) {
    if (e.target.name === 'age') { validateKids(true); }
    if (e.target === flexCheck) { validateDate(true); }
    render();
    pulseSummary();
  });
  form.addEventListener('input', function (e) {
    if (e.target === kidsInput) { validateKids(true); }
    if (e.target === dateInput) { validateDate(true); }
    render();
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  $('#wa-submit').addEventListener('click', function () {
    var okKids = validateKids(true);
    var okDate = validateDate(true);
    if (!okKids) { kidsInput.focus(); toast('Проверьте возраст детей'); return; }
    if (!okDate) { dateInput.focus(); toast('Проверьте желаемую дату'); return; }

    var message = buildMessage(getState());
    var url = 'https://wa.me/' + WHATSAPP_PHONE + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank', 'noopener');
    toast('Заявка открылась в WhatsApp — отправьте её сами');
  });

  /* ---------- Копирование с запасными путями ---------- */
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function showManualCopy(text) {
    var existing = $('#manual-copy');
    if (existing) { existing.remove(); }
    var box = document.createElement('dialog');
    box.id = 'manual-copy';
    box.className = 'manual-copy';
    box.setAttribute('aria-label', 'Скопируйте текст вручную');

    var title = document.createElement('p');
    title.className = 'manual-copy-title';
    title.textContent = 'Браузер не дал доступ к буферу обмена. Выделите и скопируйте текст:';
    var area = document.createElement('textarea');
    area.className = 'manual-copy-area';
    area.readOnly = true;
    area.value = text;
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-primary btn-sm';
    closeBtn.textContent = 'Готово';

    box.appendChild(title);
    box.appendChild(area);
    box.appendChild(closeBtn);
    document.body.appendChild(box);

    function done() {
      if (typeof box.close === 'function' && box.open) { box.close(); }
      box.remove();
    }
    closeBtn.addEventListener('click', done);
    box.addEventListener('click', function (e) { if (e.target === box) done(); });
    box.addEventListener('cancel', function () { box.remove(); });

    if (typeof box.showModal === 'function') { box.showModal(); }
    else { box.setAttribute('open', ''); }
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
  }

  function copyText(text, okMsg) {
    function fallback() {
      if (legacyCopy(text)) {
        toast(okMsg);
      } else {
        showManualCopy(text);
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast(okMsg); },
        fallback
      );
    } else {
      fallback();
    }
  }

  $('#copy-request').addEventListener('click', function () {
    copyText(buildMessage(getState()), 'Текст заявки скопирован');
  });
  $('#copy-address').addEventListener('click', function () {
    copyText(ADDRESS, 'Адрес скопирован');
  });

  setPeople(2);
  render();

  /* ---------- Галерея: лайтбокс ---------- */
  var lightbox = $('#lightbox');
  var lightboxUse = $('#lightbox-use');
  var lightboxCaption = $('#lightbox-caption');
  var galleryButtons = $$('.wall-open');
  var currentIndex = 0;
  var lastFocused = null;

  function showSlide(index) {
    currentIndex = (index + galleryButtons.length) % galleryButtons.length;
    var btn = galleryButtons[currentIndex];
    lightboxUse.setAttribute('href', '#' + btn.dataset.art);
    lightboxCaption.textContent = btn.dataset.caption;
  }

  function openLightbox(index) {
    lastFocused = document.activeElement;
    showSlide(index);
    if (typeof lightbox.showModal === 'function') {
      lightbox.showModal();
    } else {
      lightbox.setAttribute('open', '');
    }
    $('#lightbox-close').focus();
  }

  function closeLightbox() {
    if (typeof lightbox.close === 'function' && lightbox.open) {
      lightbox.close();
    } else {
      lightbox.removeAttribute('open');
    }
    if (lastFocused) { lastFocused.focus(); }
  }

  galleryButtons.forEach(function (btn, i) {
    btn.addEventListener('click', function () { openLightbox(i); });
  });
  $('#lightbox-close').addEventListener('click', closeLightbox);
  $('#lightbox-prev').addEventListener('click', function () { showSlide(currentIndex - 1); });
  $('#lightbox-next').addEventListener('click', function () { showSlide(currentIndex + 1); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  lightbox.addEventListener('cancel', function () {
    if (lastFocused) { lastFocused.focus(); }
  });
  document.addEventListener('keydown', function (e) {
    if (!lightbox.open) return;
    if (e.key === 'ArrowLeft') { showSlide(currentIndex - 1); }
    if (e.key === 'ArrowRight') { showSlide(currentIndex + 1); }
  });

  /* ---------- FAQ: открыт только один вопрос ---------- */
  var faqItems = $$('.faq-item');
  faqItems.forEach(function (item) {
    $('summary', item).addEventListener('click', function () {
      // Клик ещё не применился: если вопрос закрыт, он сейчас откроется —
      // закрываем остальные сразу, без ожидания события toggle.
      if (!item.open) {
        faqItems.forEach(function (other) {
          if (other !== item && other.open) { other.open = false; }
        });
      }
    });
  });

  /* ---------- Год в футере ---------- */
  $('#year').textContent = String(new Date().getFullYear());
})();