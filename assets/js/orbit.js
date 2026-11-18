/* Sahan Group — homepage hero story
   The stage stays pinned while three text panels hand over with scroll
   progress; the last panel steps through the five sectors. */
(function () {
  'use strict';

  var story = document.querySelector('[data-orbit]');
  if (!story) return;

  var panels = Array.prototype.slice.call(story.querySelectorAll('[data-panel]'));
  var sectorItems = Array.prototype.slice.call(story.querySelectorAll('[data-sector]'));

  /* scroll progress at which each panel takes over */
  var PANEL_AT = [0, 0.24, 0.58];
  var SECTOR_END = 0.94;

  var activePanel = -1;
  var activeSector = -1;
  var queued = false;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function progress() {
    var r = story.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
  }

  function update() {
    queued = false;
    var p = progress();

    var idx = 0;
    for (var i = 0; i < PANEL_AT.length; i++) if (p >= PANEL_AT[i]) idx = i;
    if (idx !== activePanel) {
      activePanel = idx;
      panels.forEach(function (el, n) {
        el.classList.toggle('is-active', n === idx);
        el.classList.toggle('is-past', n < idx);
        el.setAttribute('aria-hidden', n === idx ? 'false' : 'true');
      });
      story.setAttribute('data-stage', String(idx));
    }

    var sector = -1;
    if (idx === PANEL_AT.length - 1 && sectorItems.length) {
      var local = clamp((p - PANEL_AT[idx]) / (SECTOR_END - PANEL_AT[idx]), 0, 0.999);
      sector = Math.floor(local * sectorItems.length);
    }
    if (sector !== activeSector) {
      activeSector = sector;
      sectorItems.forEach(function (el, n) { el.classList.toggle('is-current', n === sector); });
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  update();
})();
