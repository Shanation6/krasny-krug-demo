/* ═══════════════════════════════════════════
   КРАСНЫЙ КРУГ — script.js
   Canvas · конструктор · галерея · анимации
   ═══════════════════════════════════════════ */

(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══════ CANVAS POTTERY WHEEL ═══════ */
  var canvas = $('#wheel-canvas');
  var ctx = canvas ? canvas.getContext('2d') : null;
  if (canvas && ctx && !reducedMotion) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw, ch, cx, cy, baseR;
    var angle = 0;
    var rafId = null;

    function resizeCanvas() {
      var rect = canvas.parentElement.getBoundingClientRect();
      cw = rect.width;
      ch = rect.height;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = cw * 0.72;
      cy = ch * 0.52;
      baseR = Math.min(cw, ch) * 0.32;
    }

    function drawWheel(t) {
      ctx.clearRect(0, 0, cw, ch);
      angle += 0.003;

      for (var i = 0; i < 5; i++) {
        var r = baseR * (1 - i * 0.15);
        var alpha = 0.04 + i * 0.015;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(184, 58, 42, ' + alpha + ')';
        ctx.lineWidth = 1 + i * 0.3;
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      for (var j = 0; j < 3; j++) {
        var rr = baseR * (0.5 + j * 0.2);
        ctx.beginPath();
        ctx.arc(0, 0, rr, 0, Math.PI * 2);
        ctx.setLineDash([4 + j * 2, 8 + j * 3]);
        ctx.lineDashOffset = t * 0.02 * (j % 2 === 0 ? 1 : -1);
        ctx.strokeStyle = 'rgba(184, 58, 42, ' + (0.06 + j * 0.02) + ')';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();

      var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.4);
      grad.addColorStop(0, 'rgba(184, 58, 42, 0.06)');
      grad.addColorStop(1, 'rgba(184, 58, 42, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(184, 58, 42, 0.15)';
      ctx.fill();

      for (var p = 0; p < 8; p++) {
        var pa = angle * (0.5 + p * 0.1) + p * 0.8;
        var pr = baseR * (0.6 + Math.sin(t * 0.001 + p) * 0.15);
        var px = cx + Math.cos(pa) * pr;
        var py = cy + Math.sin(pa) * pr;
        ctx.beginPath();
        ctx.arc(px, py, 1.5 + Math.sin(t * 0.002 + p) * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(201, 123, 90, ' + (0.08 + Math.sin(t * 0.001 + p) * 0.04) + ')';
        ctx.fill();
      }

      rafId = requestAnimationFrame(drawWheel);
    }

    resizeCanvas();
    rafId = requestAnimationFrame(drawWheel);

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 150);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          if (!rafId) rafId = requestAnimationFrame(drawWheel);
        } else {
          if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        }
      }, { threshold: 0 }).observe(canvas);
    }
  }

  /* ═══════ NAVIGATION ═══════ */
  var nav = $('#nav');
  var burger = $('#burger');
  var navLinks = $('#nav-links');
  var overlay = null;

  function createOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
    overlay.addEventListener('click', closeMenu);
  }

  function openMenu() {
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
    navLinks.classList.add('is-open');
    if (!overlay) createOverlay();
    overlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    navLinks.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', function () {
    var isOpen = this.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  $$('.nav__link, .nav__cta', navLinks).forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      burger.focus();
    }
  });

  /* ═══════ SCROLL PROGRESS + NAV STATE ═══════ */
  var scrollProgress = $('#scroll-progress');
  var sections = $$('section[id]');
  var navAnchors = $$('.nav__link');

  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('nav--scrolled', y > 40);

    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docH > 0 ? (y / docH) * 100 : 0;
    scrollProgress.style.width = pct + '%';

    var scrollPos = y + 120;
    var currentId = '';
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos) currentId = sec.id;
    });
    navAnchors.forEach(function (a) {
      var href = a.getAttribute('href');
      a.classList.toggle('nav__link--active', href === '#' + currentId);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ═══════ REVEAL ON SCROLL ═══════ */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var delay = parseInt(entry.target.getAttribute('data-delay') || '0', 10);
            setTimeout(function () {
              entry.target.classList.add('is-visible');
            }, delay * 120);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ═══════ STEPPER ═══════ */
  var peopleInput = $('#people-count');
  var minusBtn = $('#people-minus');
  var plusBtn = $('#people-plus');

  function clampPeople(val) {
    var n = parseInt(val, 10);
    if (isNaN(n)) n = 1;
    return Math.max(1, Math.min(20, n));
  }

  minusBtn.addEventListener('click', function () {
    peopleInput.value = clampPeople(parseInt(peopleInput.value, 10) - 1);
    peopleInput.dispatchEvent(new Event('input', { bubbles: true }));
  });
  plusBtn.addEventListener('click', function () {
    peopleInput.value = clampPeople(parseInt(peopleInput.value, 10) + 1);
    peopleInput.dispatchEvent(new Event('input', { bubbles: true }));
  });
  peopleInput.addEventListener('change', function () {
    this.value = clampPeople(this.value);
    updateSummary();
  });

  /* ═══════ DATE MIN ═══════ */
  var dateInput = $('#visit-date');
  var today = new Date();
  var yyyy = today.getFullYear();
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var dd = String(today.getDate()).padStart(2, '0');
  dateInput.setAttribute('min', yyyy + '-' + mm + '-' + dd);

  /* ═══════ CHARACTER COUNTER ═══════ */
  var commentArea = $('#visit-comment');
  var charCurrent = $('#char-current');
  commentArea.addEventListener('input', function () {
    charCurrent.textContent = this.value.length;
    updateSummary();
  });

  /* ═══════ LIVE SUMMARY ═══════ */
  var sumAge = $('#sum-age');
  var sumPeople = $('#sum-people');
  var sumFormat = $('#sum-format');
  var sumDate = $('#sum-date');
  var sumComment = $('#sum-comment');
  var sumCommentRow = $('#sum-comment-row');
  var summaryStatus = $('#summary-status');

  function getRadioValue(name) {
    var checked = $('input[name="' + name + '"]:checked');
    return checked ? checked.value : '';
  }

  function formatDateRu(iso) {
    if (!iso) return '—';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    var months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    var d = parseInt(parts[2], 10);
    var m = parseInt(parts[1], 10) - 1;
    return d + ' ' + months[m] + ' ' + parts[0];
  }

  function pluralPeople(n) {
    n = parseInt(n, 10);
    if (isNaN(n)) return '—';
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return n + ' человек';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return n + ' человека';
    return n + ' человек';
  }

  function updateSummary() {
    var age = getRadioValue('age');
    var format = getRadioValue('format');
    var people = peopleInput.value;
    var date = dateInput.value;
    var comment = commentArea.value.trim();

    sumAge.textContent = age || '—';
    sumPeople.textContent = pluralPeople(people);
    sumFormat.textContent = format || '—';
    sumDate.textContent = formatDateRu(date);

    if (comment) {
      sumComment.textContent = comment;
      sumCommentRow.hidden = false;
    } else {
      sumCommentRow.hidden = true;
    }

    updateFormProgress(age, format, date);
    updateSummaryStatus(age, format, date);
  }

  /* ═══════ FORM PROGRESS ═══════ */
  var formProgress = $('#form-progress');
  var progressSteps = $$('.builder__step');

  function updateFormProgress(age, format, date) {
    var filled = 0;
    var total = 4;
    if (age) filled++;
    if (parseInt(peopleInput.value, 10) >= 1) filled++;
    if (format) filled++;
    if (date) filled++;

    formProgress.style.width = (filled / total * 100) + '%';

    progressSteps.forEach(function (step) {
      var key = step.getAttribute('data-step');
      var done = false;
      if (key === 'age' && age) done = true;
      if (key === 'people' && parseInt(peopleInput.value, 10) >= 1) done = true;
      if (key === 'format' && format) done = true;
      if (key === 'date' && date) done = true;
      step.classList.toggle('is-done', done);
    });
  }

  function updateSummaryStatus(age, format, date) {
    var ready = age && format && date;
    summaryStatus.classList.toggle('is-ready', !!ready);
    if (ready) {
      summaryStatus.innerHTML = '<span class="builder__summary-status-dot"></span>Готово к отправке';
    } else {
      summaryStatus.innerHTML = '<span class="builder__summary-status-dot"></span>Заполните обязательные поля';
    }
  }

  var form = $('#builder-form');
  form.addEventListener('input', updateSummary);
  form.addEventListener('change', updateSummary);
  updateSummary();

  /* ═══════ FORMAT PRE-SELECT ═══════ */
  $$('.format-panel__cta').forEach(function (cta) {
    cta.addEventListener('click', function () {
      var formatValue = this.getAttribute('data-format');
      if (formatValue) {
        var radio = $('input[name="format"][value="' + formatValue + '"]');
        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
  });

  /* ═══════ VALIDATION ═══════ */
  function clearErrors() {
    $$('.builder__error').forEach(function (el) { el.textContent = ''; });
    $$('.is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });
  }

  function setError(id, msg) {
    var el = $('#' + id);
    if (el) el.textContent = msg;
  }

  function validate() {
    clearErrors();
    var valid = true;

    var age = getRadioValue('age');
    if (!age) {
      setError('err-age', 'Выберите возрастную группу');
      valid = false;
    }

    var people = parseInt(peopleInput.value, 10);
    if (isNaN(people) || people < 1 || people > 20) {
      setError('err-people', 'Укажите от 1 до 20 человек');
      peopleInput.classList.add('is-invalid');
      valid = false;
    }

    var format = getRadioValue('format');
    if (!format) {
      setError('err-format', 'Выберите формат занятия');
      valid = false;
    }

    var date = dateInput.value;
    if (!date) {
      setError('err-date', 'Укажите желаемую дату');
      dateInput.classList.add('is-invalid');
      valid = false;
    } else {
      var selected = new Date(date + 'T00:00:00');
      var now = new Date();
      now.setHours(0, 0, 0, 0);
      if (selected < now) {
        setError('err-date', 'Дата не может быть в прошлом');
        dateInput.classList.add('is-invalid');
        valid = false;
      }
    }

    return valid;
  }

  /* ═══════ WHATSAPP ═══════ */
  function buildWhatsAppUrl() {
    var age = getRadioValue('age');
    var people = pluralPeople(peopleInput.value);
    var format = getRadioValue('format');
    var date = formatDateRu(dateInput.value);
    var comment = commentArea.value.trim();

    var lines = [
      'Здравствуйте! Хочу записаться в мастерскую «Красный Круг».',
      '',
      '👥 Кто: ' + age,
      '🔢 Количество: ' + people,
      '🏺 Формат: ' + format,
      '📅 Желаемая дата: ' + date
    ];

    if (comment) {
      lines.push('💬 Комментарий: ' + comment);
    }

    lines.push('');
    lines.push('Подтвердите, пожалуйста, доступность. Спасибо!');

    var text = lines.join('\n');
    return 'https://wa.me/79039875438?text=' + encodeURIComponent(text);
  }

  var submitBtn = $('#submit-btn');
  var submitLabel = $('#submit-label');
  var waHandoff = $('#wa-handoff');
  var waFallback = $('#wa-fallback');
  var sentTimer = null;

  function resetSubmitState() {
    if (sentTimer) { clearTimeout(sentTimer); sentTimer = null; }
    submitBtn.classList.remove('is-sent');
    submitLabel.textContent = 'Отправить в WhatsApp';
    waHandoff.hidden = true;
  }

  form.addEventListener('input', resetSubmitState);
  form.addEventListener('change', resetSubmitState);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validate()) {
      resetSubmitState();
      var firstErr = $('.builder__error:not(:empty)');
      if (firstErr) {
        var field = firstErr.closest('.builder__field');
        if (field) {
          field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    var url = buildWhatsAppUrl();
    waFallback.href = url;
    waHandoff.hidden = false;
    submitBtn.classList.add('is-sent');
    submitLabel.textContent = 'Заявка готова — открыть ещё раз';
    window.open(url, '_blank', 'noopener,noreferrer');

    if (sentTimer) clearTimeout(sentTimer);
    sentTimer = setTimeout(function () {
      submitBtn.classList.remove('is-sent');
      submitLabel.textContent = 'Отправить в WhatsApp';
      sentTimer = null;
    }, 6000);
  });

  /* ═══════ GALLERY CONTROLS ═══════ */
  var galleryTrack = $('#gallery-track');
  var galPrev = $('#gal-prev');
  var galNext = $('#gal-next');
  var galDots = $('#gal-dots');

  if (galleryTrack && galPrev && galNext && galDots) {
    var cards = $$('.gallery__card', galleryTrack);
    var cardCount = cards.length;

    for (var d = 0; d < cardCount; d++) {
      var dot = document.createElement('span');
      dot.className = 'gallery__dot' + (d === 0 ? ' is-active' : '');
      galDots.appendChild(dot);
    }
    var dots = $$('.gallery__dot', galDots);

    function getCardWidth() {
      if (!cards[0]) return 300;
      return cards[0].offsetWidth + 24;
    }

    function getCurrentIndex() {
      var scrollLeft = galleryTrack.scrollLeft;
      var cardW = getCardWidth();
      return Math.round(scrollLeft / cardW);
    }

    function updateDots() {
      var idx = getCurrentIndex();
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === idx);
      });
    }

    galPrev.addEventListener('click', function () {
      galleryTrack.scrollBy({ left: -getCardWidth(), behavior: 'smooth' });
    });
    galNext.addEventListener('click', function () {
      galleryTrack.scrollBy({ left: getCardWidth(), behavior: 'smooth' });
    });

    galleryTrack.addEventListener('scroll', updateDots, { passive: true });
    updateDots();
  }

  /* ═══════ SMOOTH ANCHORS ═══════ */
  $$('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = $(targetId);
      if (!target) return;
      e.preventDefault();
      var navHeight = nav.offsetHeight;
      var top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
      window.scrollTo({ top: top, behavior: 'smooth' });
      history.pushState(null, '', targetId);
    });
  });

})();