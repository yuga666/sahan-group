/* Sahan Group — site interactions */
(function () {
  'use strict';

  var doc = document;
  var body = doc.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Year
  ------------------------------------------------------------------ */
  doc.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ------------------------------------------------------------------
     Hero entrance
  ------------------------------------------------------------------ */
  window.requestAnimationFrame(function () {
    body.classList.add('is-loaded');
  });

  /* ------------------------------------------------------------------
     Header state + scroll progress
  ------------------------------------------------------------------ */
  var header = doc.querySelector('[data-header]');
  var progress = doc.querySelector('.scroll-progress');
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    lastY = y;

    if (header) {
      header.classList.toggle('is-scrolled', y > 48);
    }

    if (progress) {
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(y / max, 1) : 0;
      progress.style.transform = 'scaleX(' + ratio + ')';
    }

    if (!reduceMotion) {
      var media = doc.querySelector('.hero__media img');
      if (media && window.innerWidth > 980 && y < window.innerHeight) {
        media.style.translate = '0 ' + (y * 0.12).toFixed(2) + 'px';
      }
    }

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------
     Mobile navigation
  ------------------------------------------------------------------ */
  var toggle = doc.querySelector('[data-nav-toggle]');
  var panel = doc.querySelector('[data-nav-panel]');
  var closeTimer = null;

  function panelLinks() {
    return panel ? panel.querySelectorAll('a, button') : [];
  }

  function openNav() {
    if (!panel) return;
    body.classList.add('nav-open', 'is-locked');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
    }
    window.clearTimeout(closeTimer);
    window.setTimeout(function () {
      panel.focus({ preventScroll: true });
      if (!panel.hasAttribute('tabindex')) {
        var links = panelLinks();
        if (links.length) links[0].focus({ preventScroll: true });
      }
    }, 420);
  }

  function closeNav() {
    if (!panel) return;
    body.classList.remove('nav-open', 'is-locked');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      if (body.classList.contains('nav-open')) {
        closeNav();
      } else {
        openNav();
      }
    });
  }

  if (panel) {
    panel.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        closeTimer = window.setTimeout(closeNav, 120);
      }
    });
  }

  doc.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && body.classList.contains('nav-open')) {
      closeNav();
      if (toggle) toggle.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024 && body.classList.contains('nav-open')) {
      closeNav();
    }
  });

  /* ------------------------------------------------------------------
     Reveal on scroll
  ------------------------------------------------------------------ */
  var revealEls = doc.querySelectorAll('.reveal, .reveal-media');

  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ------------------------------------------------------------------
     Scrollspy for the verticals sub-navigation
  ------------------------------------------------------------------ */
  var spyLinks = doc.querySelectorAll('[data-spy] a');
  var spyTargets = [];

  spyLinks.forEach(function (link) {
    var id = link.getAttribute('href');
    if (id && id.charAt(0) === '#') {
      var section = doc.querySelector(id);
      if (section) spyTargets.push({ link: link, section: section });
    }
  });

  if (spyTargets.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        spyTargets.forEach(function (pair) {
          var active = pair.section === entry.target;
          pair.link.classList.toggle('is-active', active);
          if (active) {
            pair.link.setAttribute('aria-current', 'true');
          } else {
            pair.link.removeAttribute('aria-current');
          }
        });
      });
    }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });

    spyTargets.forEach(function (pair) { spy.observe(pair.section); });
  }

  /* ------------------------------------------------------------------
     Lightbox
  ------------------------------------------------------------------ */
  var triggers = Array.prototype.slice.call(doc.querySelectorAll('[data-lightbox]'));
  var lightbox = doc.querySelector('[data-lightbox-root]');

  if (triggers.length && lightbox) {
    var imgEl = lightbox.querySelector('[data-lightbox-img]');
    var capEl = lightbox.querySelector('[data-lightbox-caption]');
    var countEl = lightbox.querySelector('[data-lightbox-count]');
    var closeBtn = lightbox.querySelector('[data-lightbox-close]');
    var prevBtn = lightbox.querySelector('[data-lightbox-prev]');
    var nextBtn = lightbox.querySelector('[data-lightbox-next]');
    var index = 0;
    var lastFocus = null;

    var items = triggers.map(function (el) {
      return {
        src: el.getAttribute('data-lightbox') || (el.querySelector('img') ? el.querySelector('img').src : ''),
        caption: el.getAttribute('data-caption') || '',
        alt: el.querySelector('img') ? el.querySelector('img').alt : ''
      };
    });

    function render() {
      var item = items[index];
      if (!item) return;
      imgEl.src = item.src;
      imgEl.alt = item.alt;
      capEl.textContent = item.caption;
      countEl.textContent = (index + 1) + ' / ' + items.length;
    }

    function open(i) {
      index = i;
      lastFocus = doc.activeElement;
      render();
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      body.classList.add('is-locked');
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    }

    function close() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      body.classList.remove('is-locked');
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }

    function step(dir) {
      index = (index + dir + items.length) % items.length;
      render();
    }

    triggers.forEach(function (el, i) {
      el.addEventListener('click', function (event) {
        event.preventDefault();
        open(i);
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });

    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox || event.target.classList.contains('lightbox__stage')) close();
    });

    doc.addEventListener('keydown', function (event) {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
      if (event.key === 'Tab') {
        var focusables = lightbox.querySelectorAll('button');
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && doc.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && doc.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ------------------------------------------------------------------
     Careers form — composes an email, no backend required
  ------------------------------------------------------------------ */
  var form = doc.querySelector('[data-apply-form]');

  if (form) {
    var status = form.querySelector('[data-form-status]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var name = (data.get('name') || '').toString().trim();
      var email = (data.get('email') || '').toString().trim();
      var interest = (data.get('interest') || '').toString().trim();
      var message = (data.get('message') || '').toString().trim();

      if (!name || !email) {
        if (status) {
          status.textContent = 'Please add your name and email so we can reply.';
          status.classList.add('is-error');
        }
        return;
      }

      var subject = 'Careers — ' + (interest || 'General application') + ' — ' + name;
      var bodyText = 'Name: ' + name + '\nEmail: ' + email + '\nArea of interest: ' + (interest || 'General') + '\n\n' + message;
      var href = 'mailto:careers@sahangroup.lk?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(bodyText);

      if (status) {
        status.classList.remove('is-error');
        status.textContent = 'Opening your email app with your application ready to send…';
      }

      window.location.href = href;
    });
  }
})();
