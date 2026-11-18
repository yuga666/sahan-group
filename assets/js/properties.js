/* ==========================================================================
   Sahan Group — property portfolio
   Renders data/properties.json into the Portfolio grid on properties.html.
   The admin page (/admin/) uses the same renderer for its live preview.
   Everything is built with DOM methods and textContent, never innerHTML,
   so text typed in the admin can't inject markup.
   ========================================================================== */
(function () {
  'use strict';

  var SVG = 'http://www.w3.org/2000/svg';

  /* 24px line icons, drawn to match the site's 1.2px stroke set */
  var ICONS = {
    bedrooms: ['M3 18.5V8M3 14h18v4.5M21 14v-2.6c0-1.3-1-2.4-2.4-2.4H11v5', 'M6.6 11.8a1.6 1.6 0 1 0 0-.01'],
    size: ['M4 4h16v16H4z', 'M9 15 15 9M15 9h-3.6M15 9v3.6'],
    bathrooms: ['M4 12h16v2.5a4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 14.5V12ZM7 19l-1 1.5M17 19l1 1.5', 'M6.5 12V6.2A2.2 2.2 0 0 1 10.6 5'],
    parking: ['M5 4h14v16H5z', 'M10 16V8h2.6a2.4 2.4 0 0 1 0 4.8H10'],
    floors: ['M5 20.5V5l7-2 7 2v15.5M3 20.5h18', 'M9 8.5h1.5M13.5 8.5H15M9 12h1.5M13.5 12H15M9 15.5h1.5M13.5 15.5H15'],
    completion: ['M4 6h16v14H4zM4 10h16M8.5 3.5v4M15.5 3.5v4', 'm9 15 2 2 4-4'],
    pin: ['M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z', 'M12 12.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z']
  };

  /* Spec order and accessible labels. The card shows only the specs that have a value. */
  var SPECS = [
    ['bedrooms', 'Bedrooms'],
    ['size', 'Size'],
    ['bathrooms', 'Bathrooms'],
    ['parking', 'Parking'],
    ['floors', 'Floors'],
    ['completion', 'Timeline']
  ];

  function icon(name) {
    var svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'pcard__icon');
    (ICONS[name] || []).forEach(function (d) {
      var p = document.createElementNS(SVG, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    return svg;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null && text !== '') n.textContent = String(text);
    return n;
  }

  function str(v) { return typeof v === 'string' ? v.trim() : ''; }

  /* Only site images and safe links are allowed through. */
  function safeImage(src, allowData) {
    src = str(src);
    if (allowData && /^data:image\/(png|jpe?g|webp|avif);base64,/i.test(src)) return src;   // admin preview only
    return /^assets\/img\/[A-Za-z0-9._\/-]+\.(webp|jpe?g|png|avif)$/i.test(src) && src.indexOf('..') === -1 ? src : '';
  }

  function safeLink(href) {
    href = str(href);
    if (/^#[A-Za-z][\w-]*$/.test(href)) return href;
    if (/^[a-z0-9-]+\.html(#[\w-]+)?$/i.test(href)) return href;
    if (/^https:\/\/[^\s"'<>]+$/i.test(href)) return href;
    if (/^mailto:[^\s"'<>]+$/i.test(href)) return href;
    return '';
  }

  function renderCard(p, opts) {
    p = p || {};
    var base = (opts && opts.base) || '';
    var card = el('article', 'pcard');
    if (p.id) card.setAttribute('data-property', str(p.id));

    /* media + status tags */
    var media = el('div', 'pcard__media');
    var src = safeImage(p.image, opts && opts.preview);
    if (src) {
      var img = el('img');
      img.src = /^data:/.test(src) ? src : base + src;
      img.alt = str(p.imageAlt) || str(p.name);
      img.loading = 'lazy';
      img.decoding = 'async';
      media.appendChild(img);
    } else {
      media.classList.add('pcard__media--empty');
      media.appendChild(el('span', 'pcard__placeholder', 'Image coming soon'));
    }
    var status = Array.isArray(p.status) ? p.status.map(str).filter(Boolean).slice(0, 3) : [];
    if (status.length) {
      var tags = el('ul', 'pcard__tags');
      tags.setAttribute('aria-label', 'Status');
      status.forEach(function (s) { tags.appendChild(el('li', 'pcard__tag', s)); });
      media.appendChild(tags);
    }
    card.appendChild(media);

    /* body */
    var body = el('div', 'pcard__body');
    if (str(p.type)) body.appendChild(el('p', 'pcard__type', p.type));
    body.appendChild(el('h3', 'pcard__name', str(p.name) || 'Untitled property'));
    if (str(p.location)) {
      var loc = el('p', 'pcard__loc');
      loc.appendChild(icon('pin'));
      loc.appendChild(el('span', '', p.location));
      body.appendChild(loc);
    }
    if (str(p.summary)) body.appendChild(el('p', 'pcard__desc', p.summary));

    var specs = p.specs || {};
    var list = el('ul', 'pcard__specs');
    SPECS.forEach(function (s) {
      var v = str(specs[s[0]]);
      if (!v) return;
      var li = el('li', 'pcard__spec');
      li.setAttribute('data-spec', s[0]);
      li.appendChild(icon(s[0]));
      var t = el('span', '', v);
      li.setAttribute('title', s[1]);
      li.appendChild(t);
      list.appendChild(li);
    });
    if (list.children.length) body.appendChild(list);

    /* footer: price + explore */
    var foot = el('div', 'pcard__foot');
    var priceWrap = el('div', 'pcard__price');
    if (str(p.price)) {
      priceWrap.appendChild(el('span', 'pcard__price-label', str(p.priceLabel) || 'Starting from'));
      priceWrap.appendChild(el('strong', 'pcard__price-value', p.price));
    }
    foot.appendChild(priceWrap);
    var href = safeLink(p.link);
    if (href) {
      var a = el('a', 'btn btn--sm btn--ghost pcard__cta');
      a.href = href;
      if (/^https:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
      a.appendChild(document.createTextNode('Explore'));
      var sr = el('span', 'visually-hidden', ' ' + (str(p.name) || 'property'));
      a.appendChild(sr);
      var arrow = document.createElementNS(SVG, 'svg');
      arrow.setAttribute('class', 'ico');
      arrow.setAttribute('aria-hidden', 'true');
      var use = document.createElementNS(SVG, 'use');
      use.setAttribute('href', '#i-arrow');
      arrow.appendChild(use);
      a.appendChild(arrow);
      foot.appendChild(a);
    }
    body.appendChild(foot);
    card.appendChild(body);
    return card;
  }

  function renderInto(root, data, opts) {
    var items = (data && Array.isArray(data.properties) ? data.properties : [])
      .filter(function (p) { return p && p.published === true && str(p.name); });
    while (root.firstChild) root.removeChild(root.firstChild);
    if (!items.length) {
      root.appendChild(el('p', 'portfolio__empty', 'New Sahan Homes developments will be listed here as they launch.'));
      return 0;
    }
    items.forEach(function (p, i) {
      var c = renderCard(p, opts);
      c.style.setProperty('--i', i);
      root.appendChild(c);
    });
    return items.length;
  }

  window.SahanProperties = { renderCard: renderCard, renderInto: renderInto, safeImage: safeImage, safeLink: safeLink, SPECS: SPECS };

  /* On the public page, load the data file and fill the grid */
  var root = document.querySelector('[data-portfolio]');
  if (!root || !window.fetch) return;
  var src = root.getAttribute('data-portfolio') || 'data/properties.json';
  fetch(src, { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      var n = renderInto(root, data);
      root.setAttribute('data-portfolio-count', String(n));
      root.classList.add('is-ready');
    })
    .catch(function () {
      // Keep the static AVORA link that ships in the HTML, and say the full list didn't load.
      root.classList.add('is-ready', 'is-error');
      root.appendChild(el('p', 'portfolio__empty portfolio__error', 'The full list of properties could not be loaded. Please refresh the page to try again.'));
    });
})();
