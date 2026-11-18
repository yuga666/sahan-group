/* ==========================================================================
   Sahan Group — properties admin
   Reads data/properties.json from the GitHub repository and publishes edits
   (plus any new photos) as ONE commit on the live branch through the GitHub
   Git Data API. Netlify redeploys the site from it in about a minute.
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
    maxImageBytes: 2 * 1024 * 1024,
    timeoutMs: 45000
  };
  var API = 'https://api.github.com';
  var REPO = '/repos/' + CONFIG.owner + '/' + CONFIG.repo;
  var TOKEN_KEY = 'sahan-admin-token';

  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var P = window.SahanProperties;

  var state = {
    token: '',
    sha: null,           // blob sha of data/properties.json as loaded, to detect other people's edits
    data: null,          // { _readme, properties: [...] }
    editingId: null,     // id of the listing open in the editor, or null for a new one
    draft: null,         // copy being edited (null when the editor is closed)
    draftDirty: false,   // the open editor has changes not yet applied with Done
    draftImage: null,    // photo chosen in the open editor
    reading: false,      // a chosen photo is still being read
    editorSeq: 0,        // bumps each time an editor opens, so late file reads are ignored
    connectSeq: 0,       // bumps per sign-in attempt, so only the latest one wins
    pendingImages: {},   // listing id -> { dataUrl, ext } waiting to be published
    uploaded: {},        // repo path -> dataUrl, so new photos show before the site redeploys
    dirty: false,        // list has changes not yet published
    busy: false          // a publish is in flight
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

  function b64decodeText(b64) {
    var bin = atob(String(b64).replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function slug(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'property';
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function str(v) { return typeof v === 'string' ? v.trim() : (typeof v === 'number' ? String(v) : ''); }

  function gh(path, opts, token) {
    opts = opts || {};
    var headers = {
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + (token || state.token),
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (opts.body) headers['Content-Type'] = 'application/json';
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, CONFIG.timeoutMs);
    return fetch(API + path, {
      method: opts.method || 'GET', headers: headers, cache: 'no-store',
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) {
        return r.text().then(function (t) {
          var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
          if (!r.ok) { var err = new Error((j && j.message) || ('HTTP ' + r.status)); err.status = r.status; throw err; }
          return j;
        });
      }, function (e) {
        var err = new Error(e && e.name === 'AbortError' ? 'GitHub did not answer in time. Check your connection and try again.' : 'Could not reach GitHub. Check your connection and try again.');
        err.network = true;
        throw err;
      })
      .finally(function () { if (timer) clearTimeout(timer); });
  }
  function contentsPath(p) {
    return REPO + '/contents/' + p.split('/').map(encodeURIComponent).join('/');
  }

  /* Hand-edited files may have odd shapes; make every listing safe to edit. */
  function normalize(data) {
    var specKeys = P.SPECS.map(function (s) { return s[0]; });
    var seen = {};
    data.properties = data.properties.filter(function (p) { return p && typeof p === 'object'; }).map(function (p) {
      var n = {
        id: slug(str(p.id) || str(p.name)),
        published: p.published === true,
        name: str(p.name), type: str(p.type), location: str(p.location), summary: str(p.summary),
        status: (Array.isArray(p.status) ? p.status : typeof p.status === 'string' ? p.status.split(',') : []).map(str).filter(Boolean).slice(0, 3),
        image: str(p.image), imageAlt: str(p.imageAlt),
        specs: {},
        priceLabel: str(p.priceLabel), price: str(p.price), link: str(p.link)
      };
      var specs = p.specs && typeof p.specs === 'object' ? p.specs : {};
      specKeys.forEach(function (k) { n.specs[k] = str(specs[k]); });
      var id = n.id, i = 2;
      while (seen[id]) id = n.id + '-' + i++;
      n.id = id; seen[id] = true;
      return n;
    });
    return data;
  }

  /* ---------- sign in ---------- */
  function showStep(name) {
    doc.querySelectorAll('[data-step]').forEach(function (s) { s.hidden = s.getAttribute('data-step') !== name; });
  }

  function connect(token) {
    var seq = ++state.connectSeq;
    var btn = $('[data-signin] button[type=submit]');
    btn.disabled = true;
    signinError('');
    status('Loading properties…');
    return gh(contentsPath(CONFIG.dataPath) + '?ref=' + encodeURIComponent(CONFIG.branch), null, token)
      .then(function (file) {
        if (seq !== state.connectSeq) return;           // a newer sign-in started; ignore this one
        var data = JSON.parse(b64decodeText(file.content));
        if (!data || !Array.isArray(data.properties)) throw new Error('data/properties.json has no "properties" list');
        state.token = token;
        state.sha = file.sha;
        state.data = normalize(data);
        state.dirty = false;
        store(TOKEN_KEY, token);
        showStep('edit');
        renderList();
        status('Loaded ' + data.properties.length + ' propert' + (data.properties.length === 1 ? 'y' : 'ies') + ' from ' + CONFIG.branch + '.');
      })
      .catch(function (e) {
        if (seq !== state.connectSeq) return;
        showStep('signin');
        status('');
        if (e.status === 401) store(TOKEN_KEY, null);  // only forget a token GitHub actually rejected
        signinError(e.status === 401 ? 'That token was not accepted. Check it and try again.'
          : e.status === 404 ? 'The token can\'t see the website repository. Give it access to ' + CONFIG.owner + '/' + CONFIG.repo + '.'
          : 'Could not load properties: ' + e.message);
        if (!$('#a-token').value && load(TOKEN_KEY)) $('#a-token').value = load(TOKEN_KEY);
      })
      .finally(function () { if (seq === state.connectSeq) btn.disabled = false; });
  }

  function signinError(msg) {
    var form = $('[data-signin]');
    var p = $('.admin__hint', form);
    if (!p) { p = doc.createElement('p'); p.className = 'admin__hint is-error'; p.setAttribute('role', 'alert'); form.appendChild(p); }
    p.textContent = msg;
  }

  /* ---------- list ---------- */
  function syncControls() {
    var locked = state.busy || !!state.draft;
    $('[data-add]').disabled = locked;
    $('[data-publish]').disabled = locked || !state.dirty;
    $('[data-signout]').disabled = state.busy;
    doc.querySelectorAll('[data-list] [data-action]').forEach(function (b) {
      b.disabled = locked || b.hasAttribute('data-edge');
    });
    var done = $('[data-form] button[type=submit]');
    if (done) done.disabled = state.reading || state.busy;
  }

  function markDirty() {
    state.dirty = true;
    syncControls();
    status('You have unpublished changes.');
  }

  function indexOfId(id) {
    for (var i = 0; i < state.data.properties.length; i++) if (state.data.properties[i].id === id) return i;
    return -1;
  }

  function miniBtn(label, action, id, edge) {
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'admin__mini';
    b.textContent = label;
    b.setAttribute('data-action', action);
    b.setAttribute('data-id', id);
    if (edge) b.setAttribute('data-edge', '');
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
      li.setAttribute('data-row', p.id);
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
      meta.className = 'admin__rowmeta' + (p.published ? '' : ' is-hidden');
      meta.textContent = (p.published ? 'Live' : 'Hidden') + (p.location ? ' · ' + p.location : '');
      info.appendChild(nm); info.appendChild(meta);
      li.appendChild(info);

      var btns = doc.createElement('div');
      btns.className = 'admin__rowbtns';
      btns.appendChild(miniBtn('Up', 'up', p.id, i === 0));
      btns.appendChild(miniBtn('Down', 'down', p.id, i === items.length - 1));
      btns.appendChild(miniBtn(p.published ? 'Hide' : 'Show', 'toggle', p.id));
      btns.appendChild(miniBtn('Edit', 'edit', p.id));
      btns.appendChild(miniBtn('Delete', 'delete', p.id));
      li.appendChild(btns);
      list.appendChild(li);
    });
    syncControls();
  }

  $('[data-list]').addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]');
    if (!b || b.disabled || state.busy || state.draft) return;
    var items = state.data.properties;
    var i = indexOfId(b.getAttribute('data-id'));
    if (i < 0) return;
    var action = b.getAttribute('data-action');
    if (action === 'up' && i > 0) { items.splice(i - 1, 0, items.splice(i, 1)[0]); markDirty(); renderList(); }
    else if (action === 'down' && i < items.length - 1) { items.splice(i + 1, 0, items.splice(i, 1)[0]); markDirty(); renderList(); }
    else if (action === 'toggle') { items[i].published = !items[i].published; markDirty(); renderList(); }
    else if (action === 'edit') { openEditor(items[i].id); }
    else if (action === 'delete') {
      if (!b.classList.contains('is-armed')) {          // two-step delete instead of a browser dialog
        b.classList.add('is-armed'); b.textContent = 'Confirm delete';
        setTimeout(function () { if (b.isConnected) { b.classList.remove('is-armed'); b.textContent = 'Delete'; } }, 4000);
        return;
      }
      var gone = items.splice(i, 1)[0];
      delete state.pendingImages[gone.id];
      markDirty(); renderList();
      status('Removed "' + (gone.name || 'property') + '". Press Publish changes to make it final.');
    }
  });

  /* ---------- editor ---------- */
  var form = $('[data-form]');

  function blank() {
    var specs = {};
    P.SPECS.forEach(function (s) { specs[s[0]] = ''; });
    return {
      id: '', published: true, name: '', type: '', location: '', summary: '', status: [],
      image: '', imageAlt: '', specs: specs,
      priceLabel: 'Starting from LKR', price: '', link: ''
    };
  }

  function openEditor(id) {
    if (state.draft || state.busy) return;
    var i = id ? indexOfId(id) : -1;
    state.editorSeq++;
    state.editingId = i >= 0 ? id : null;
    state.draft = clone(i >= 0 ? state.data.properties[i] : blank());
    state.draftDirty = false;
    state.draftImage = null;
    state.reading = false;
    $('[data-form-title]').textContent = i >= 0 ? 'Edit property' : 'New property';
    fillForm(state.draft);
    $('[data-editor]').hidden = false;
    syncControls();
    updatePreview();
    status('Press Done to keep your edits, then Publish changes.');
    form.elements.name.focus();
    $('[data-editor]').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeEditor() {
    state.editorSeq++;
    state.editingId = null;
    state.draft = null;
    state.draftDirty = false;
    state.draftImage = null;
    state.reading = false;
    form.reset();
    $('[data-editor]').hidden = true;
    syncControls();
  }

  function fillForm(p) {
    var f = form.elements;
    f.name.value = p.name;
    f.type.value = p.type;
    f.location.value = p.location;
    f.status.value = p.status.join(', ');
    f.summary.value = p.summary;
    P.SPECS.forEach(function (s) { f['spec.' + s[0]].value = p.specs[s[0]] || ''; });
    f.priceLabel.value = p.priceLabel;
    f.price.value = p.price;
    f.link.value = p.link;
    f.imageAlt.value = p.imageAlt;
    f.published.checked = p.published;
    f.imageFile.value = '';
    var hint = $('[data-image-hint]');
    hint.classList.remove('is-error');
    hint.textContent = 'WebP, JPG or PNG, under 2 MB. Landscape or portrait both work.';
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
    var c = clone(d);
    var pend = state.draftImage || (state.editingId && state.pendingImages[state.editingId]);
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

  form.addEventListener('input', function (e) {
    if (e.target.name === 'imageFile') return;
    state.draftDirty = true;
    updatePreview();
  });

  form.elements.imageFile.addEventListener('change', function () {
    var input = this;
    var file = input.files && input.files[0];
    var hint = $('[data-image-hint]');
    hint.classList.remove('is-error');
    if (!file) return;
    var m = /^image\/(webp|jpeg|png)$/.exec(file.type);
    if (!m) { hint.textContent = 'Use a WebP, JPG or PNG file.'; hint.classList.add('is-error'); input.value = ''; return; }
    if (file.size > CONFIG.maxImageBytes) { hint.textContent = 'That photo is ' + (file.size / 1048576).toFixed(1) + ' MB. Please use one under 2 MB.'; hint.classList.add('is-error'); input.value = ''; return; }
    var seq = state.editorSeq;
    state.reading = true;
    state.draftDirty = true;
    hint.textContent = 'Reading ' + file.name + '…';
    syncControls();
    var reader = new FileReader();
    reader.onload = function () {
      if (seq !== state.editorSeq) return;              // that editor was closed; drop the late result
      state.draftImage = { dataUrl: reader.result, ext: m[1] === 'jpeg' ? 'jpg' : m[1] };
      hint.textContent = file.name + ' will upload when you publish.';
      updatePreview();
    };
    reader.onerror = function () {
      if (seq !== state.editorSeq) return;
      hint.textContent = 'Could not read that file. Try another.'; hint.classList.add('is-error');
    };
    reader.onloadend = function () {
      if (seq !== state.editorSeq) return;
      state.reading = false;
      syncControls();
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.reading || state.busy || !state.draft) return;
    var d = readForm();
    if (!d.name) { form.elements.name.focus(); status('Give the property a name.', true); return; }
    var items = state.data.properties;
    var i = state.editingId ? indexOfId(state.editingId) : -1;
    if (i < 0) {
      var base = slug(d.name), id = base, n = 2;
      while (indexOfId(id) >= 0) id = base + '-' + n++;
      d.id = id;
    }
    if (!d.imageAlt) d.imageAlt = d.name;
    if (state.draftImage) state.pendingImages[d.id] = state.draftImage;
    if (i >= 0) items[i] = d; else items.push(d);
    closeEditor();
    markDirty();
    renderList();
  });

  $('[data-cancel]').addEventListener('click', function () {
    closeEditor();
    status(state.dirty ? 'You have unpublished changes.' : '');
  });

  $('[data-add]').addEventListener('click', function () { openEditor(null); });

  /* ---------- publish: photos + data in one commit ---------- */
  $('[data-publish]').addEventListener('click', function () {
    if (state.busy || state.draft || !state.dirty) return;
    state.busy = true;
    syncControls();
    status('Publishing…');

    var snapshot = clone(state.data);
    var photos = [];                                    // { id, path, img }
    var stamp = Date.now();
    Object.keys(state.pendingImages).forEach(function (id) {
      var p = snapshot.properties.filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      var img = state.pendingImages[id];
      var path = CONFIG.imageDir + '/' + id + '-' + stamp + '.' + img.ext;
      p.image = path;
      photos.push({ id: id, path: path, img: img });
    });
    var json = JSON.stringify(snapshot, null, 2) + '\n';
    var headSha, dataBlobSha;

    gh(REPO + '/git/ref/heads/' + encodeURIComponent(CONFIG.branch))
      .then(function (ref) {
        headSha = ref.object.sha;
        return Promise.all([
          gh(REPO + '/git/commits/' + headSha),
          gh(contentsPath(CONFIG.dataPath) + '?ref=' + headSha)
        ]);
      })
      .then(function (r) {
        if (r[1].sha !== state.sha) { var c = new Error('changed'); c.conflict = true; throw c; }
        var blobs = photos.map(function (ph) {
          return gh(REPO + '/git/blobs', { method: 'POST', body: { content: ph.img.dataUrl.split(',')[1], encoding: 'base64' } })
            .then(function (b) { return { path: ph.path, sha: b.sha }; });
        });
        blobs.push(gh(REPO + '/git/blobs', { method: 'POST', body: { content: json, encoding: 'utf-8' } })
          .then(function (b) { dataBlobSha = b.sha; return { path: CONFIG.dataPath, sha: b.sha }; }));
        return Promise.all([r[0].tree.sha, Promise.all(blobs)]);
      })
      .then(function (r) {
        return gh(REPO + '/git/trees', { method: 'POST', body: {
          base_tree: r[0],
          tree: r[1].map(function (b) { return { path: b.path, mode: '100644', type: 'blob', sha: b.sha }; })
        } });
      })
      .then(function (tree) {
        return gh(REPO + '/git/commits', { method: 'POST', body: {
          message: 'Update properties' + (photos.length ? ' and add ' + photos.length + ' photo' + (photos.length > 1 ? 's' : '') : '') + ' (via properties admin)',
          tree: tree.sha, parents: [headSha]
        } });
      })
      .then(function (commit) {
        return gh(REPO + '/git/refs/heads/' + encodeURIComponent(CONFIG.branch), { method: 'PATCH', body: { sha: commit.sha, force: false } })
          .then(function () { return commit; });
      })
      .then(function (commit) {
        photos.forEach(function (ph) {
          var i = indexOfId(ph.id);
          if (i >= 0) state.data.properties[i].image = ph.path;
          state.uploaded[ph.path] = ph.img.dataUrl;
          delete state.pendingImages[ph.id];
        });
        state.sha = dataBlobSha;
        state.dirty = false;
        state.busy = false;
        renderList();
        status('Published. The website updates in about a minute.', false,
          commit.html_url ? { href: commit.html_url, text: 'View the change' } : null);
      })
      .catch(function (e) {
        state.busy = false;
        syncControls();
        status(e.conflict || e.status === 409 || e.status === 422
          ? 'The properties changed on GitHub since you loaded them. Note your edits, reload this page and try again.'
          : e.status === 403 || e.status === 404 ? 'This token can read but not publish. Give it "Contents: Read and write" access.'
          : e.status === 401 ? 'Your token has expired or was revoked. Sign out and sign in with a new one.'
          : 'Publishing failed: ' + e.message + ' Nothing was changed on the site.', true);
      });
  });

  window.addEventListener('beforeunload', function (e) {
    if (state.dirty || state.draftDirty || state.busy) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------- start ---------- */
  $('[data-signin]').addEventListener('submit', function (e) {
    e.preventDefault();
    var t = this.elements.token.value.trim();
    if (!t) { signinError('Paste your token first.'); return; }
    connect(t);
  });

  $('[data-signout]').addEventListener('click', function () {
    if (state.busy) return;
    store(TOKEN_KEY, null);
    state.token = ''; state.dirty = false; state.draftDirty = false;
    location.reload();
  });

  var saved = load(TOKEN_KEY);
  if (saved) connect(saved); else showStep('signin');
})();
