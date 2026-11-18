/* Sahan Group site checks — properties portfolio + admin.
   Run:  cd tests && npm install && npm test     (or: node tests/run.cjs)
   Serves the site locally with the same Content-Security-Policy as netlify.toml,
   drives Chromium with Playwright, and mocks the GitHub API for the admin. */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const CSP = /Content-Security-Policy = "([^"]+)"/.exec(read('netlify.toml'))[1];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('nf'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Content-Security-Policy': CSP });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}

const results = [];
async function test(name, fn) {
  try { await fn(); results.push(['PASS', name]); console.log('  ✓ ' + name); }
  catch (e) { results.push(['FAIL', name]); console.log('  ✗ ' + name + '\n      ' + String(e.message).split('\n').join('\n      ')); }
}

function watchErrors(page) {
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(e.message));
  return errs;
}

(async () => {
  const srv = await serve();
  const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
  const browser = await chromium.launch();
  const data = JSON.parse(read('data/properties.json'));
  const avora = data.properties.find((p) => p.id === 'avora-residences');

  console.log('\nProperties data');

  await test('data/properties.json is valid and every entry has the required fields', async () => {
    assert.ok(Array.isArray(data.properties) && data.properties.length >= 1);
    const ids = new Set();
    for (const p of data.properties) {
      for (const k of ['id', 'name', 'image', 'imageAlt']) assert.ok(typeof p[k] === 'string' && p[k].trim(), `${p.id || '?'}: missing ${k}`);
      assert.ok(!ids.has(p.id), 'duplicate id ' + p.id); ids.add(p.id);
      assert.ok(Array.isArray(p.status), p.id + ': status must be a list');
      assert.ok(p.status.length <= 3, p.id + ': at most 3 status tags');
      assert.ok(fs.existsSync(path.join(ROOT, p.image)), p.id + ': image file not found: ' + p.image);
    }
  });

  await test('AVORA facts in the data match the existing AVORA section on the page', async () => {
    assert.ok(avora, 'AVORA entry missing');
    const html = read('properties.html');
    assert.equal(avora.name, 'AVORA Residences');
    assert.equal(avora.location, 'Gampaha');
    assert.equal(avora.price, '24M');
    assert.ok(html.includes('<dt>Starting price</dt><dd>24M<small>LKR</small></dd>'), 'factgrid price changed');
    assert.ok(html.includes('<dt>Residences</dt><dd>24<small>'), 'factgrid residences changed');
    assert.ok(html.includes('<dt>Floors</dt><dd>10<small>'), 'factgrid floors changed');
    assert.ok(html.includes(avora.summary), 'AVORA card text must reuse the existing banner copy');
    assert.deepEqual(avora.status, ['Upcoming', 'Launching now']);
    assert.ok(html.includes('id="residences"'), 'Explore target #residences is missing');
  });

  console.log('\nExisting content is untouched');

  await test('properties.html is byte-identical to the original apart from the added portfolio block', async () => {
    const now = read('properties.html')
      .replace(/    <!-- portfolio:start[\s\S]*?<!-- portfolio:end -->\n\n/, '')
      .replace(/  <script src="assets\/js\/properties\.js" defer><\/script><!-- portfolio:script -->\n/, '');
    assert.equal(now, read('tests/baseline-properties.html'));
  });

  console.log('\nProperties page (desktop)');

  await test('Portfolio lists AVORA like the reference card: image, tags, type, name, location, text, specs, price, Explore', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errs = watchErrors(page);
    await page.goto(BASE + 'properties.html#portfolio');
    const card = page.locator('#portfolio .pcard[data-property="avora-residences"]');
    await card.waitFor();
    assert.equal(await card.locator('.pcard__name').textContent(), 'AVORA Residences');
    assert.equal(await card.locator('.pcard__type').textContent(), 'Residential development · Sahan Homes');
    assert.equal((await card.locator('.pcard__loc').textContent()).trim(), 'Gampaha');
    assert.deepEqual(await card.locator('.pcard__tag').allTextContents(), ['Upcoming', 'Launching now']);
    assert.equal(await card.locator('.pcard__desc').textContent(), avora.summary);
    assert.equal(await card.locator('[data-spec="bedrooms"]').textContent(), '2, 3 & 4 bedroom apartments');
    assert.equal(await card.locator('[data-spec="parking"]').textContent(), 'Secure parking');
    assert.equal(await card.locator('[data-spec="floors"]').textContent(), '10 floors · 24 apartments');
    assert.equal(await card.locator('[data-spec="size"]').count(), 0, 'empty specs must be hidden');
    assert.equal(await card.locator('.pcard__price-label').textContent(), 'Starting from LKR');
    assert.equal(await card.locator('.pcard__price-value').textContent(), '24M');
    const cta = card.locator('a.pcard__cta');
    assert.equal(await cta.getAttribute('href'), '#residences');
    assert.match(await cta.textContent(), /Explore/);
    await card.scrollIntoViewIfNeeded();
    await card.locator('img').evaluate((i) => i.complete && i.naturalWidth ? 0 : new Promise((r) => { i.onload = r; i.onerror = r; }));
    const w = await card.locator('img').evaluate((i) => i.naturalWidth);
    assert.ok(w > 0, 'card image did not load');
    assert.deepEqual(errs, [], 'console errors / CSP violations');
    await page.close();
  });

  await test('Explore scrolls to the existing AVORA residences section', async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(BASE + 'properties.html#portfolio');
    await page.locator('.pcard__cta').first().click();
    await page.waitForFunction(() => location.hash === '#residences');
    await page.close();
  });

  await test('Every original section is still on the page, in the same order', async () => {
    const page = await browser.newPage();
    await page.goto(BASE + 'properties.html');
    const ids = await page.$$eval('main > section[id]', (s) => s.map((x) => x.id));
    assert.deepEqual(ids, ['residences', 'amenities', 'gallery', 'register', 'sahan-homes', 'portfolio']);
    await page.close();
  });

  console.log('\nProperties page (phone)');

  await test('At 390px the cards stack and nothing scrolls sideways', async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await page.goto(BASE + 'properties.html#portfolio');
    await page.locator('.pcard').first().waitFor();
    const r = await page.evaluate(() => {
      const c = document.querySelector('.pcard').getBoundingClientRect();
      return { overflow: document.documentElement.scrollWidth - innerWidth, left: c.left, right: innerWidth - c.right };
    });
    assert.ok(r.overflow <= 0, 'horizontal overflow ' + r.overflow + 'px');
    assert.ok(r.left >= 12 && r.right >= 12, 'card touches the screen edge');
    await page.close();
  });

  console.log('\nSafety + future properties');

  await test('New published properties appear in order; hidden ones do not; text is never parsed as HTML', async () => {
    const page = await browser.newPage();
    const errs = watchErrors(page);
    const fake = { properties: [
      avora,
      { id: 'next', published: true, name: 'Next <img src=x onerror="window.__xss=1">', image: 'assets/img/avora-dusk-900.webp', imageAlt: 'x', status: ['New'], price: '30M', priceLabel: 'From LKR', link: 'javascript:alert(1)', specs: {} },
      { id: 'draft', published: false, name: 'Draft project', image: 'assets/img/avora-dusk-900.webp', imageAlt: 'x', status: [], specs: {} },
      { id: 'evil-img', published: true, name: 'Bad image', image: 'https://evil.example/x.png', imageAlt: 'x', status: [], specs: {} }
    ] };
    await page.route('**/data/properties.json', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(fake) }));
    await page.goto(BASE + 'properties.html');
    await page.locator('.pcard').nth(2).waitFor();
    assert.deepEqual(await page.$$eval('.pcard', (c) => c.map((x) => x.dataset.property)), ['avora-residences', 'next', 'evil-img']);
    assert.equal(await page.evaluate(() => window.__xss), undefined);
    assert.equal(await page.locator('[data-property="next"] .pcard__name').textContent(), 'Next <img src=x onerror="window.__xss=1">');
    assert.equal(await page.locator('[data-property="next"] a').count(), 0, 'javascript: link must be dropped');
    assert.equal(await page.locator('[data-property="evil-img"] img').count(), 0, 'off-site image must be dropped');
    assert.deepEqual(errs, []);
    await page.close();
  });

  await test('If the data file fails to load, the AVORA link fallback stays', async () => {
    const page = await browser.newPage();
    await page.route('**/data/properties.json', (r) => r.fulfill({ status: 500, body: '' }));
    await page.goto(BASE + 'properties.html');
    await page.waitForSelector('[data-portfolio].is-ready');
    assert.equal(await page.locator('[data-portfolio] a[href="#residences"]').count(), 1);
    await page.close();
  });

  console.log('\nAdmin (/admin/) with a mocked GitHub API');

  await test('Admin signs in, adds a property with a photo, and publishes one commit with the new list', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = watchErrors(page);
    const puts = [];
    const file = { sha: 'sha-1', content: Buffer.from(read('data/properties.json')).toString('base64') };
    await page.route('https://api.github.com/**', async (r) => {
      const req = r.request();
      assert.equal(req.headers()['authorization'], 'Bearer test-token');
      if (req.method() === 'GET') return r.fulfill({ contentType: 'application/json', body: JSON.stringify(file), headers: { 'access-control-allow-origin': '*' } });
      if (req.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, PUT' } });
      puts.push({ url: req.url(), body: JSON.parse(req.postData()) });
      return r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ content: { sha: 'sha-' + (puts.length + 1) }, commit: { html_url: 'https://github.com/x/y/commit/1' } }) });
    });
    await page.goto(BASE + 'admin/');
    await page.fill('#a-token', 'test-token');
    await page.click('[data-signin] button[type=submit]');
    await page.locator('.admin__row[data-row="avora-residences"]').waitFor();

    await page.click('[data-add]');
    await page.fill('#f-name', 'Test Heights');
    await page.fill('#f-location', 'Yakkala');
    await page.fill('#f-status', 'Newly launched, On going project');
    await page.fill('#f-bedrooms', '2 & 3 bedroom apartments');
    await page.fill('#f-price', '30M');
    await page.fill('#f-link', '#register');
    await page.setInputFiles('#f-image', path.join(ROOT, 'assets/img/avora-dusk-900.webp'));
    await page.waitForFunction(() => document.querySelector('[data-preview] img') && document.querySelector('[data-preview] img').src.startsWith('data:'));
    assert.equal(await page.locator('[data-preview] .pcard__name').textContent(), 'Test Heights');
    await page.click('[data-form] button[type=submit]');
    await page.locator('.admin__row[data-row="test-heights"]').waitFor();

    await page.click('[data-publish]');
    await page.waitForFunction(() => /Published/.test(document.querySelector('[data-status]').textContent));
    assert.equal(puts.length, 2, 'expected photo upload + data commit');
    assert.match(puts[0].url, /contents\/assets\/img\/properties\/test-heights-\d+\.webp$/);
    assert.equal(puts[1].body.sha, 'sha-1', 'data update must send the sha it loaded');
    assert.equal(puts[1].body.branch, 'main');
    const saved = JSON.parse(Buffer.from(puts[1].body.content, 'base64').toString('utf8'));
    assert.deepEqual(saved.properties.map((p) => p.id), ['avora-residences', 'test-heights']);
    assert.deepEqual(saved.properties[0], avora, 'AVORA entry must be unchanged');
    const t = saved.properties[1];
    assert.match(t.image, /^assets\/img\/properties\/test-heights-\d+\.webp$/);
    assert.deepEqual(t.status, ['Newly launched', 'On going project']);
    assert.equal(t.specs.bedrooms, '2 & 3 bedroom apartments');
    assert.equal(t.published, true);
    assert.deepEqual(errs, [], 'console errors / CSP violations');
    await page.close();
  });

  await test('Admin page loads under the live CSP with no inline-script or connect errors', async () => {
    const page = await browser.newPage();
    const errs = watchErrors(page);
    await page.goto(BASE + 'admin/');
    await page.locator('#a-token').waitFor();
    assert.deepEqual(errs, []);
    await page.close();
  });

  await browser.close();
  srv.close();
  const failed = results.filter((r) => r[0] === 'FAIL').length;
  console.log(`\n${results.length - failed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
})();
