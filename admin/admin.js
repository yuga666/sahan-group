/* ==========================================================================
   Sahan Group — properties admin
   Reads and writes data/properties.json in the GitHub repository through the
   GitHub REST API. Each "Publish changes" is one commit on the live branch;
   Netlify redeploys the site from it in about a minute.
   No server, no third-party scripts: the page runs under the site's own CSP.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- settings: change these if the repository moves ---- */
  var CONFIG = {
    owner: 'yuga666',
    repo: 'sahan-group',
    branch: 'main',
    dataPath: 'data/properties.json',
    imageDir: 'assets/img/properties',
    maxImageBytes: 2 * 1024 * 1024
  };
  var API = 'https://api.github.com';
  var TOKEN_KEY = 'sahan-admin-token';

  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var P = window.SahanProperties;

  var state = {
    token: '',
    sha: null,          // blob sha of data/properties.json, for safe updates
    data: null,         // { _readme, properties: [...] }
    editing: -1,        // index being edited, or -1
    draft: null,        // copy being edited
    pendingImages: {},  // property id -> { dataUrl, ext }
    uploaded: {},       // repo path -> dataUrl, so new photos show before the site redeploys
    dirty: false
  };

  /* ---------- helpers ---------- */
  function store(k, v) { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }

  function status(msg, isError, link) {
    var el = $('[data-status]');
    el.textContent = msg || '';
    el.classList.toggle('is-error', !!isError);
    if (link) {
      el.appendChild(doc.createTextNode(' '));
      var a = doc.createElement('a');
      a.href = link.href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = link.text;
      el.appendChild(a);
    }
  }

  function b64encodeText(s) {
    var bytes = new TextEncoder().encode(s), bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64decodeText(b64) {
    var bin = atob(String(b64).replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function slug(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'property';
  }

  function gh(path, opts) {
    opts = opts || {};
    var headers = {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + state.token,
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (opts.body) headers['Content-Type'] = 'application/json';
    return fetch(API + path, { method: opts.method || 'GET', headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined, cache: 'no-store' })
      .then(function (r) {
        return r.text().then(function (t) {
          var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
          if (!r.ok) { var err = new Error((j && j.message) || ('HTTP ' + r.status)); err.status = r.status; throw err; }
          return j;
        });
      });
  }
  function contentsPath(p) {
    return '/repos/' + CONFIG.owner + '/' + CONFIG.repo + '/contents/' + p.split('/').map(encodeURIComponent).join('/');
  }

  /* ---------- sign in ---------- */
  function showStep(name) {
    doc.querySelectorAll('[data-step]').forEach(function (s) { s.hidden = s.getAttribute('data-step') !== name; });
  }

  function connect(token) {
    state.token = token;
    status('Loading properties…');
    return gh(contentsPath(CONFIG.dataPath) + '?ref=' + encodeURIComponent(CONFIG.branch))
      .then(function (file) {
        var data = JSON.parse(b64decodeText(file.content));
        if (!data || !Array.isArray(data.properties)) throw new Error('data/properties.json has no "properties" list');
        state.sha = file.sha;
        state.data = data;
        state.dirty = false;
        store(TOKEN_KEY, token);
        showStep('edit');
        renderList();
        status('Loaded ' + data.properties.length + ' propert' + (data.properties.length === 1 ? 'y' : 'ies') + ' from ' + CONFIG.branch + '.');
      })
      .catch(function (e) {
        store(TOKEN_KEY, null);
        showStep('signin');
        var msg = e.status === 401 ? 'That token was not accepted. Check it and try again.'
          : e.status === 404 ? 'The token can\'t see the website repository. Give it access to ' + CONFIG.owner + '/' + CONFIG.repo + '.'
          : 'Could not load properties: ' + e.message;
        signinError(msg);
      });
  }

  function signinError(msg) {
    var form = $('[data-signin]');
    var p = $('.admin__hint', form);
    if (!p) { p = doc.createElement('p'); p.className = 'admin__hint is-error'; p.setAttribute('role', 'alert'); form.appendChild(p); }
    p.textContent = msg;
  }

  /* ---------- list ---------- */
  function markDirty() {
    state.dirty = true;
    $('[data-publish]').disabled = false;
    status('You have unpublished changes.');
  }

  function miniBtn(label, action, i, disabled) {
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'admin__mini';
    b.textContent = label;
    b.setAttribute('data-action', action);
    b.setAttribute('data-index', String(i));
    b.disabled = !!disabled;
    return b;
  }

  function renderList() {
    var list = $('[data-list]');
    while (list.firstChild) list.removeChild(list.firstChild);
    var items = state.data.properties;
    if (!items.length) {
      var li0 = doc.createElement('li'); li0.className = 'admin__row'; li0.textContent = 'No properties yet. Press "Add property".';
      list.appendChild(li0);
    }
    items.forEach(function (p, i) {
      var li = doc.createElement('li');
      li.className = 'admin__row';
      li.setAttribute('data-row', p.id || '');
      var thumb = doc.createElement('img');
      thumb.className = 'admin__thumb';
      thumb.alt = '';
      var pend = state.pendingImages[p.id];
      var path = P.safeImage(p.image);
      var src = pend ? pend.dataUrl : state.uploaded[path] || (path ? '../' + path : '');
      if (src) thumb.src = src;
      li.appendChild(thumb);

      var info = doc.createElement('div');
      var nm = doc.createElement('span'); nm.className = 'admin__rowname'; nm.textContent = p.name || 'Untitled';
      var meta = doc.createElement('span');
      meta.className = 'admin__rowmeta' + (p.published === false ? ' is-hidden' : '');
      meta.textContent = (p.published === false ? 'Hidden' : 'Live') + (p.location ? ' · ' + p.location : '');
      info.appendChild(nm); info.appendChild(meta);
      li.appendChild(info);

      var btns = doc.createElement('div');
      btns.className = 'admin__rowbtns';
      btns.appendChild(miniBtn('Up', 'up', i, i === 0));
      btns.appendChild(miniBtn('Down', 'down', i, i === items.length - 1));
      btns.appendChild(miniBtn(p.published === false ? 'Show' : 'Hide', 'toggle', i));
      btns.appendChild(miniBtn('Edit', 'edit', i));
      btns.appendChild(miniBtn('Delete', 'delete', i));
      li.appendChild(btns);
      list.appendChild(li);
    });
  }

  $('[data-list]') && $('[data-list]').addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]');
    if (!b) return;
    var i = Number(b.getAttribute('data-index'));
    var items = state.data.properties;
    var action = b.getAttribute('data-action');
    if (action === 'up' && i > 0) { items.splice(i - 1, 0, items.splice(i, 1)[0]); markDirty(); renderList(); }
    else if (action === 'down' && i < items.length - 1) { items.splice(i + 1, 0, items.splice(i, 1)[0]); markDirty(); renderList(); }
    else if (action === 'toggle') { items[i].published = items[i].published === false; markDirty(); renderList(); }
    else if (action === 'edit') { openEditor(i); }
    else if (action === 'delete') {
      if (!b.classList.contains('is-armed')) {          // two-step delete instead of a browser dialog
        b.classList.add('is-armed'); b.textContent = 'Confirm delete';
        setTimeout(function () { if (b.isConnected) { b.classList.remove('is-armed'); b.textContent = 'Delete'; } }, 4000);
        return;
      }
      var gone = items.splice(i, 1)[0];
      delete state.pendingImages[gone.id];
      if (state.editing === i) closeEditor();
      markDirty(); renderList();
      status('Removed "' + (gone.name || 'property') + '". Press Publish changes to make it final.');
    }
  });

  /* ---------- editor ---------- */
  var form = $('[data-form]');

  function blank() {
    return {
      id: '', published: true, name: '', type: '', location: '', summary: '', status: [],
      image: '', imageAlt: '',
      specs: { bedrooms: '', size: '', bathrooms: '', parking: '', floors: '', completion: '' },
      priceLabel: 'Starting from LKR', price: '', link: ''
    };
  }

  function openEditor(i) {
    state.editing = i;
    state.draftImage = null;
    var src = i >= 0 ? state.data.properties[i] : blank();
    state.draft = JSON.parse(JSON.stringify(src));
    state.draft.specs = Object.assign(blank().specs, state.draft.specs || {});
    $('[data-form-title]').textContent = i >= 0 ? 'Edit property' : 'New property';
    fillForm(state.draft);
    $('[data-editor]').hidden = false;
    updatePreview();
    form.elements.name.focus();
    $('[data-editor]').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeEditor() {
    state.editing = -1;
    state.draft = null;
    state.draftImage = null;
    form.reset();
    $('[data-editor]').hidden = true;
  }

  function fillForm(p) {
    var f = form.elements;
    f.name.value = p.name || '';
    f.type.value = p.type || '';
    f.location.value = p.location || '';
    f.status.value = (p.status || []).join(', ');
    f.summary.value = p.summary || '';
    P.SPECS.forEach(function (s) { f['spec.' + s[0]].value = p.specs[s[0]] || ''; });
    f.priceLabel.value = p.priceLabel || '';
    f.price.value = p.price || '';
    f.link.value = p.link || '';
    f.imageAlt.value = p.imageAlt || '';
    f.published.checked = p.published !== false;
    f.imageFile.value = '';
    $('[data-image-hint]').classList.remove('is-error');
  }

  function readForm() {
    var f = form.elements, d = state.draft;
    d.name = f.name.value.trim();
    d.type = f.type.value.trim();
    d.location = f.location.value.trim();
    d.status = f.status.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 3);
    d.summary = f.summary.value.trim();
    P.SPECS.forEach(function (s) { d.specs[s[0]] = f['spec.' + s[0]].value.trim(); });
    d.priceLabel = f.priceLabel.value.trim();
    d.price = f.price.value.trim();
    d.link = f.link.value.trim();
    d.imageAlt = f.imageAlt.value.trim();
    d.published = f.published.checked;
    return d;
  }

  function previewCopy(d) {
    var c = JSON.parse(JSON.stringify(d));
    var pend = state.draftImage || state.pendingImages[d.id];
    if (pend) c.image = pend.dataUrl;
    else if (state.uploaded[c.image]) c.image = state.uploaded[c.image];
    return c;
  }

  function updatePreview() {
    if (!state.draft) return;
    var d = readForm();
    var hint = $('[data-link-hint]');
    if (d.link && !P.safeLink(d.link)) { hint.textContent = 'This link format isn\'t allowed and will be hidden.'; hint.classList.add('is-error'); }
    else { hint.textContent = ''; hint.classList.remove('is-error'); }
    var c = previewCopy(d);
    c.published = true;
    P.renderInto($('[data-preview]'), { properties: [c] }, { base: '../', preview: true });
  }

  form.addEventListener('input', function (e) { if (e.target.name !== 'imageFile') updatePreview(); });

  form.elements.imageFile.addEventListener('change', function () {
    var file = this.files && this.files[0];
    var hint = $('[data-image-hint]');
    hint.classList.remove('is-error');
    if (!file) return;
    var m = /^image\/(webp|jpeg|png)$/.exec(file.type);
    if (!m) { hint.textContent = 'Use a WebP, JPG or PNG file.'; hint.classList.add('is-error'); this.value = ''; return; }
    if (file.size > CONFIG.maxImageBytes) { hint.textContent = 'That photo is ' + (file.size / 1048576).toFixed(1) + ' MB. Please use one under 2 MB.'; hint.classList.add('is-error'); this.value = ''; return; }
    var reader = new FileReader();
    reader.onload = function () {
      state.draftImage = { dataUrl: reader.result, ext: m[1] === 'jpeg' ? 'jpg' : m[1] };
      hint.textContent = file.name + ' will upload when you publish.';
      updatePreview();
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = readForm();
    if (!d.name) { form.elements.name.focus(); status('Give the property a name.', true); return; }
    var items = state.data.properties;
    if (!d.id) {
      var base = slug(d.name), id = base, n = 2;
      while (items.some(function (p) { return p.id === id; })) id = base + '-' + n++;
      d.id = id;
    }
    if (state.draftImage) state.pendingImages[d.id] = state.draftImage;
    if (!d.imageAlt) d.imageAlt = d.name;
    if (state.editing >= 0) items[state.editing] = d; else items.push(d);
    closeEditor();
    markDirty();
    renderList();
  });

  $('[data-cancel]').addEventListener('click', function () {
    closeEditor();
  });

  $('[data-add]').addEventListener('click', function () { openEditor(-1); });

  /* ---------- publish ---------- */
  function uploadImages() {
    var ids = Object.keys(state.pendingImages).filter(function (id) {
      return state.data.properties.some(function (p) { return p.id === id; });
    });
    return ids.reduce(function (chain, id) {
      return chain.then(function () {
        var img = state.pendingImages[id];
        var path = CONFIG.imageDir + '/' + id + '-' + Date.now() + '.' + img.ext;
        return gh(contentsPath(path), {
          method: 'PUT',
          body: { message: 'Add photo for ' + id + ' (via properties admin)', content: img.dataUrl.split(',')[1], branch: CONFIG.branch }
        }).then(function () {
          state.data.properties.forEach(function (p) { if (p.id === id) p.image = path; });
          state.uploaded[path] = img.dataUrl;
          delete state.pendingImages[id];
        });
      });
    }, Promise.resolve());
  }

  $('[data-publish]').addEventListener('click', function () {
    if (state.draft) { status('Finish or cancel the property you are editing first.', true); return; }
    var btn = this;
    btn.disabled = true;
    status('Publishing…');
    uploadImages()
      .then(function () {
        var body = JSON.stringify(state.data, null, 2) + '\n';
        return gh(contentsPath(CONFIG.dataPath), {
          method: 'PUT',
          body: { message: 'Update properties (via properties admin)', content: b64encodeText(body), sha: state.sha, branch: CONFIG.branch }
        });
      })
      .then(function (res) {
        state.sha = res.content.sha;
        state.dirty = false;
        renderList();
        status('Published. The website updates in about a minute.', false,
          res.commit && res.commit.html_url ? { href: res.commit.html_url, text: 'View the change' } : null);
      })
      .catch(function (e) {
        btn.disabled = false;
        status(e.status === 409 || e.status === 422
          ? 'Someone else changed the properties since you loaded them. Copy your edits, reload this page and try again.'
          : e.status === 403 ? 'This token can read but not write. Give it "Contents: Read and write" access.'
          : 'Publishing failed: ' + e.message, true);
      });
  });

  window.addEventListener('beforeunload', function (e) {
    if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------- start ---------- */
  $('[data-signin]').addEventListener('submit', function (e) {
    e.preventDefault();
    var t = this.elements.token.value.trim();
    if (!t) { signinError('Paste your token first.'); return; }
    connect(t);
  });

  $('[data-signout]').addEventListener('click', function () {
    store(TOKEN_KEY, null);
    state.token = ''; state.dirty = false;
    location.reload();
  });

  var saved = load(TOKEN_KEY);
  if (saved) connect(saved); else showStep('signin');
})();
