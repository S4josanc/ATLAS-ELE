// Run with Node 20+ from a checkout containing the baseline Git object:
// node tests/verified-merge.cjs [--runs=3]
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const root = path.resolve(__dirname, '..');
const base = 'c3ffdafe6daa35fe8dc792084a205fb615a8f04a';
const runs = Number(process.argv.find(x => x.startsWith('--runs='))?.slice(7) ?? 1);
assert.ok(Number.isInteger(runs) && runs >= 1, '--runs must be a positive integer');
const read = name => readFileSync(path.join(root, name), 'utf8');
const original = name => execFileSync('git', ['show', base + ':' + name], { cwd: root, encoding: 'utf8' });

function readPublicInputs() {
  const window = {};
  const scripts = original('index.html').matchAll(/<script\b[^>]*?src=["'](data\/[^"'?]+)(?:\?[^"']*)?["']/gi);
  for (const [, file] of scripts) {
    new Function('window', read(file))(window);
  }
  const verified = window.ATLAS_VERIFIED_SPAIN_20261027;
  const pilot = JSON.parse(read('data/pilot-city-points.json')).institutions;
  return { window, pilot, verified };
}

function sliceBetween(source, startToken, endToken) {
  const start = source.indexOf(startToken);
  const end = source.indexOf(endToken, start + startToken.length);
  assert.ok(start >= 0 && end > start, 'Loader boundaries missing: ' + startToken);
  return source.slice(start, end);
}

// Run the actual data loaders in Node. Stub only the pilot HTTP response and UI.
// The browser suite checks the real requests, Leaflet markers and UI separately.
function compileLoader(isBaseline) {
  const source = isBaseline ? original('app.js') : read('app.js');
  let code = sliceBetween(source, isBaseline ? 'async function loadPublicMapData(' : 'function mergeVerifiedSchools(', '\nloadPublicMapData();');
  if (isBaseline) {
    const marker = 'const hits=data.filter(';
    assert.equal(code.split(marker).length, 2);
    // Array.filter visits each entry in this dense array. Count the length once
    // per source row, leaving the predicate and normalization calls unchanged.
    code = code.replace(marker, 'metrics.filterVisits += data.length; ' + marker);
  }
  return new Function('window', 'fetch', 'document', 'render', 'console', 'metrics',
    'let data = [], globeInstance = null;\n' + code + '\nreturn loadPublicMapData().then(() => data);');
}

async function runLoader(loader, inputs) {
  const warnings = [];
  const logger = { info() {}, warn(...args) { warnings.push(args); }, error(...args) { throw new Error(args.join(' ')); } };
  const window = { ...inputs.window, location: { search: '' } };
  const metrics = { filterVisits: 0 };
  let start;
  let elapsed;
  let stats;
  let renders = 0;
  Object.defineProperties(window, {
    ATLAS_VERIFIED_SPAIN_20261027: { get() { start = performance.now(); return inputs.verified; } },
    ATLAS_VERIFIED_SPAIN_STATS: {
      get() { return stats; },
      set(value) { elapsed = performance.now() - start; stats = value; }
    }
  });
  const fetch = async resource => {
    assert.equal(resource.split('?')[0], 'data/pilot-city-points.json');
    return { ok: true, json: async () => ({ institutions: inputs.pilot }) };
  };
  const records = await loader(window, fetch, { querySelectorAll: () => [] }, () => renders++, logger, metrics);
  assert.equal(renders, 1);
  assert.ok(Number.isFinite(elapsed));
  return { records, warnings, stats, elapsed, filterVisits: metrics.filterVisits };
}

function edgeInputs() {
  function school(id, name, address, web, city = 'León', country = 'Spain') {
    return { id, name, type: 'school', city, country, lat: 42, lng: -5, web, address, precision: 'city' };
  }
  function row(id, name, address, web, city, country) {
    const x = school(id, name, address, web, city, country);
    return [id, name, x.type, x.city, x.country, 43, -6, web, true, address, 'address', 'https://registry.example/' + id];
  }
  const pilot = [
    school('keep', 'Colegio Álamos', 'Calle Antigua', 'https://www.old.example'),
    school('peer', 'Los Pinos', 'Calle Uno', 'https://portal.edu.gva.es/pinos'),
    school('remote', 'Elsewhere', 'Calle Dos', 'https://remote.example', 'Madrid'),
  ];
  const verified = [
    row('official', 'CEIP Alamos', 'Calle Nueva', 'https://portal.edu.gva.es/ALAMOS/', 'Leon'),
    row('stale', 'Olmos', 'Calle Antigua', 'https://old.example'), // old keys must be released
    row('same-host', 'Different name', 'Calle Tres', 'https://portal.edu.gva.es/alamos'),
    row('alias', 'Los Pinos', 'Calle Tres', 'https://pinos.example'), // 2 hits in original map order
    row('peer', 'Conflicto', 'Calle Distinta', 'https://otro.example'), // ID only
    row('address', 'Otra Escuela', 'Calle Uno', 'https://otra.example'), // address only
    row('remote', 'Sin Relación', 'Calle Seis', 'https://other.example'), // ID in another city
    row('root1', 'Raíz A', 'Calle Siete', 'https://portal.edu.gva.es/'),
    row('root2', 'Raíz B', 'Calle Ocho', 'https://portal.edu.gva.es/'), // shared root is no match
    row('newalias', 'Escuela Raiz B', 'Calle Nueve', 'not a URL'), // enrichment of a newly added row
    row('root3', 'Raíz C', 'Calle Diez', 'not a URL'), // two malformed URLs never match
    row('case-country', 'Alamos', 'Calle Tres', 'https://portal.edu.gva.es/alamos', 'Leon', 'spain'),
    row('incomplete', '', 'Calle Once', 'https://bad.example'),
  ];
  return { window: {}, pilot, verified };
}

function compare(a, b) {
  assert.deepStrictEqual(b.records, a.records, 'Institution fields or record order changed');
  assert.deepStrictEqual(b.stats, a.stats, 'Verified decisions changed');
  assert.deepStrictEqual(b.warnings, a.warnings, 'Warning order or candidate IDs changed');
}

async function main() {
  const baseline = compileLoader(true);
  const proposed = compileLoader(false);
  const edges = edgeInputs();
  const previous = await runLoader(baseline, edges);
  const next = await runLoader(proposed, edges);
  compare(previous, next);
  assert.deepEqual(next.stats, { added: 5, enriched: 3, skipped: 5, sourceRows: 13 });
  assert.deepEqual(next.records.map(x => x.id), ['keep', 'peer', 'remote', 'stale', 'root1', 'root2', 'root3', 'case-country']);
  const conflict = next.warnings.find(([message]) => message.includes('multiple records'));
  assert.deepEqual(conflict.slice(1), ['alias', ['keep', 'peer']]);
  console.log('Synthetic matching, conflicts, stale keys, order and validation passed.');

  const real = readPublicInputs();
  const results = [];
  for (let i = 0; i < runs; i++) {
    const before = await runLoader(baseline, real);
    const after = await runLoader(proposed, real);
    compare(before, after);
    assert.equal(after.records.length, 9136);
    assert.equal(new Set(after.records.map(x => x.id)).size, after.records.length);
    assert.equal(after.stats.sourceRows, 6414);
    results.push({ beforeMs: +before.elapsed.toFixed(1), afterMs: +after.elapsed.toFixed(1) });
    if (i === 0) {
      console.log(JSON.stringify({ node: process.version, baseline: base, records: after.records.length,
        verified: after.stats, originalFilterVisits: before.filterVisits,
        orderedRecordsSHA256: createHash('sha256').update(JSON.stringify(after.records)).digest('hex') }));
    }
    console.log('Verified merge (milliseconds):', JSON.stringify(results[i]));
  }
  function median(field) {
    const values = results.map(x => x[field]).sort((a, b) => a - b);
    const middle = Math.floor(values.length / 2);
    return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
  }
  console.log('Median (milliseconds):', JSON.stringify({ before: median('beforeMs'), after: median('afterMs') }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
