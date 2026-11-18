// Run with: node --test tests/
// Unit tests for src/core.js plus an end-to-end check against the built dist/POMD.html data.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Core = require('../src/core.js');

function fixture() {
  return Core.prepare({
    items: {
      loc: {
        id: 'loc', type: 'multi', template: '{} pain',
        options: [
          { id: 'ruq', label: 'RUQ', frag: 'RUQ' },
          { id: 'epi', label: 'Epigastric', frag: 'epigastric' },
          { id: 'llq', label: 'LLQ', frag: 'LLQ' }
        ]
      },
      tender: {
        id: 'tender', type: 'multi', template: 'tenderness over the {}',
        options: [
          { id: 'none', label: 'Non-tender', frag: 'non-tender', exclusive: true },
          { id: 'ruq', label: 'RUQ', frag: 'RUQ' },
          { id: 'epi', label: 'Epigastric', frag: 'epigastrium' }
        ]
      },
      sev: {
        id: 'sev', type: 'single', template: 'severity {}/10',
        options: [{ id: 's3', label: '3', frag: '3' }, { id: 's7', label: '7', frag: '7' }]
      },
      dur: {
        id: 'dur', type: 'single',
        options: [
          { id: 'h', label: '<6 h', frag: 'for less than 6 hours', tc: ['acute'] },
          { id: 'm', label: '>3 mo', frag: 'for more than 3 months', tc: ['chronic'] }
        ]
      },
      sx: {
        id: 'sx', type: 'presence',
        options: [
          { id: 'nausea', label: 'Nausea', frag: 'nausea' },
          { id: 'fever', label: 'Fever', frag: 'fever' },
          { id: 'jaundice', label: 'Jaundice', frag: 'jaundice' }
        ]
      },
      vit: {
        id: 'vit', type: 'presence', join: ',',
        options: [
          { id: 'fever', label: 'Fever', frag: 'febrile', frag_neg: 'afebrile' },
          { id: 'tachy', label: 'Tachycardia', frag: 'tachycardic' }
        ]
      }
    }
  });
}

test('single select replaces and toggles off', () => {
  const { items } = fixture();
  const s = {};
  Core.toggle(s, items.sev, 's3');
  Core.toggle(s, items.sev, 's7');
  assert.deepEqual(s, { sev: { s7: true } });
  Core.toggle(s, items.sev, 's7');
  assert.deepEqual(s, {});
});

test('multi select with exclusive option', () => {
  const { items } = fixture();
  const s = {};
  Core.toggle(s, items.tender, 'ruq');
  Core.toggle(s, items.tender, 'epi');
  assert.deepEqual(Object.keys(s.tender), ['ruq', 'epi']);
  Core.toggle(s, items.tender, 'none');
  assert.deepEqual(s.tender, { none: true });
  Core.toggle(s, items.tender, 'ruq');
  assert.deepEqual(s.tender, { ruq: true });
});

test('presence cycles present → absent → cleared', () => {
  const { items } = fixture();
  const s = {};
  Core.toggle(s, items.sx, 'fever');
  assert.equal(s.sx.fever, 'present');
  Core.toggle(s, items.sx, 'fever');
  assert.equal(s.sx.fever, 'absent');
  Core.toggle(s, items.sx, 'fever');
  assert.deepEqual(s, {});
});

test('feature status: match / different / none', () => {
  const { items } = fixture();
  const s = {};
  const f = { item: 'loc', options: ['ruq', 'epi'] };
  assert.equal(Core.featureStatus(f, s, items), 'none');
  Core.toggle(s, items.loc, 'llq');
  assert.equal(Core.featureStatus(f, s, items), 'different');
  Core.toggle(s, items.loc, 'epi');
  assert.equal(Core.featureStatus(f, s, items), 'match');
});

test('presence feature status uses per-option state', () => {
  const { items } = fixture();
  const s = {};
  const fever = { item: 'sx', options: ['fever'], state: 'present' };
  const noFever = { item: 'sx', options: ['fever'], state: 'absent' };
  Core.toggle(s, items.sx, 'nausea'); // a different symptom does not affect fever
  assert.equal(Core.featureStatus(fever, s, items), 'none');
  Core.toggle(s, items.sx, 'fever');
  assert.equal(Core.featureStatus(fever, s, items), 'match');
  assert.equal(Core.featureStatus(noFever, s, items), 'different');
  Core.toggle(s, items.sx, 'fever');
  assert.equal(Core.featureStatus(fever, s, items), 'different');
  assert.equal(Core.featureStatus(noFever, s, items), 'match');
});

test('presence feature with several options: any-present vs none-present', () => {
  const { items } = fixture();
  const s = {};
  const anyOf = { item: 'sx', options: ['fever', 'jaundice'], state: 'present' };
  const noneOf = { item: 'sx', options: ['fever', 'jaundice'], state: 'absent' };
  Core.toggle(s, items.sx, 'fever'); Core.toggle(s, items.sx, 'fever'); // fever absent
  assert.equal(Core.featureStatus(anyOf, s, items), 'different');
  assert.equal(Core.featureStatus(noneOf, s, items), 'match');
  Core.toggle(s, items.sx, 'jaundice'); // jaundice present
  assert.equal(Core.featureStatus(anyOf, s, items), 'match');
  assert.equal(Core.featureStatus(noneOf, s, items), 'different');
});

test('match count, time course, group order', () => {
  const { items } = fixture();
  const disease = {
    timecourse: ['acute'],
    symptoms: [{ item: 'loc', options: ['ruq'] }, { item: 'sx', options: ['fever'], state: 'present' }],
    pe: [{ item: 'tender', options: ['ruq'] }]
  };
  const complaint = {
    location_item: 'loc', timecourse_item: 'dur',
    ddx: [{ group: 'RUQ', locations: ['ruq'] }, { group: 'LLQ', locations: ['llq'] }]
  };
  const s = {};
  assert.equal(Core.matchCount(disease, s, items), 0);
  Core.toggle(s, items.loc, 'ruq');
  Core.toggle(s, items.tender, 'ruq');
  assert.equal(Core.matchCount(disease, s, items), 2);
  assert.equal(Core.timecourseStatus(disease, Core.selectedTimecourses(complaint, s, items)), 'none');
  Core.toggle(s, items.dur, 'm');
  assert.equal(Core.timecourseStatus(disease, Core.selectedTimecourses(complaint, s, items)), 'different');
  Core.toggle(s, items.dur, 'h');
  assert.equal(Core.timecourseStatus(disease, Core.selectedTimecourses(complaint, s, items)), 'match');
  assert.deepEqual(Core.orderGroups(complaint, {}).map((e) => e.group.group), ['RUQ', 'LLQ']);
  assert.deepEqual(Core.orderGroups(complaint, { loc: { llq: true } }).map((e) => e.group.group), ['LLQ', 'RUQ']);
});

test('rankByMatches: de-duplicated, sorted by count, ties keep location order', () => {
  const { items } = fixture();
  const diseases = {
    a: { symptoms: [{ item: 'loc', options: ['ruq'] }], pe: [] },
    b: { symptoms: [{ item: 'loc', options: ['llq'] }, { item: 'sev', options: ['s7'] }], pe: [] },
    c: { symptoms: [{ item: 'sev', options: ['s7'] }], pe: [] }
  };
  const complaint = {
    location_item: 'loc',
    ddx: [{ group: 'RUQ', locations: ['ruq'], diseases: ['a', 'c'] }, { group: 'LLQ', locations: ['llq'], diseases: ['b', 'c'] }]
  };
  const s = {};
  assert.deepEqual(Core.rankByMatches(complaint, diseases, s, items).map((x) => x.id), ['a', 'c', 'b']);
  Core.toggle(s, items.sev, 's7');
  Core.toggle(s, items.loc, 'llq');
  const r = Core.rankByMatches(complaint, diseases, s, items);
  assert.deepEqual(r.map((x) => [x.id, x.n]), [['b', 2], ['c', 1], ['a', 0]]);
  assert.deepEqual(r.find((x) => x.id === 'c').groups, ['LLQ', 'RUQ']);
});

test('joinList', () => {
  assert.equal(Core.joinList(['a'], 'and'), 'a');
  assert.equal(Core.joinList(['a', 'b'], 'or'), 'a or b');
  assert.equal(Core.joinList(['a', 'b', 'c'], 'and'), 'a, b, and c');
  assert.equal(Core.joinList(['a', 'b', 'c'], ','), 'a, b, c');
});

test('templates: defaults, optional segments, presence modes', () => {
  const { items } = fixture();
  const s = {};
  const spec = {
    joiner: ' ',
    sentences: [
      { always: true, parts: ['the patient presented with {loc|abdominal pain}[ {dur}]', '{sev}'] },
      { lead: 'Associated with ', parts: ['{sx+}'] },
      { lead: 'Denied ', parts: ['{sx-}'] }
    ]
  };
  assert.equal(Core.composeText(spec, s, items), 'The patient presented with abdominal pain.');
  Core.toggle(s, items.loc, 'epi');
  Core.toggle(s, items.loc, 'ruq');
  Core.toggle(s, items.sev, 's7');
  Core.toggle(s, items.dur, 'h');
  Core.toggle(s, items.sx, 'nausea');
  ['fever', 'jaundice'].forEach((o) => { Core.toggle(s, items.sx, o); Core.toggle(s, items.sx, o); });
  assert.equal(
    Core.composeText(spec, s, items),
    'The patient presented with RUQ and epigastric pain for less than 6 hours, severity 7/10. ' +
      'Associated with nausea. Denied fever or jaundice.'
  );
});

test('PE text: exclusive raw fragment, frag_neg, lead only when filled', () => {
  const { items } = fixture();
  const s = {};
  const spec = {
    joiner: '\n',
    sentences: [
      { lead: 'Vital signs: ', parts: ['{vit*}'] },
      { lead: 'Abdomen: ', parts: ['{tender}'] }
    ]
  };
  assert.equal(Core.composeText(spec, s, items), '');
  Core.toggle(s, items.tender, 'none');
  Core.toggle(s, items.vit, 'fever');
  Core.toggle(s, items.vit, 'fever');
  Core.toggle(s, items.vit, 'tachy');
  assert.equal(Core.composeText(spec, s, items), 'Vital signs: tachycardic, afebrile.\nAbdomen: non-tender.');
  Core.toggle(s, items.tender, 'ruq');
  assert.match(Core.composeText(spec, s, items), /Abdomen: tenderness over the RUQ\.$/);
});

// ---------- end-to-end against the built file ----------

function loadBuiltData() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'dist', 'POMD.html'), 'utf8');
  const m = html.match(/window\.POMD_DATA = (\{.*\});\n/);
  assert.ok(m, 'POMD_DATA not found in dist/POMD.html — run python3 build.py first');
  return Core.prepare(JSON.parse(m[1]));
}

test('built data: every disease feature resolves and every ddx reference exists', () => {
  const data = loadBuiltData();
  data.complaints.forEach((c) => {
    c.ddx.forEach((g) => g.diseases.forEach((id) => assert.ok(data.diseases[id], id)));
  });
  Object.values(data.diseases).forEach((d) => {
    Core.diseaseFeatures(d).forEach((f) => {
      const item = data.items[f.item];
      assert.ok(item, `${d.id}: ${f.item}`);
      f.options.forEach((o) => assert.ok(item.optById[o], `${d.id}: ${f.item}.${o}`));
    });
  });
});

test('built data: sample biliary case produces the expected HPI and highlights', () => {
  const data = loadBuiltData();
  const c = data.complaints.find((x) => x.id === 'abdominal_pain');
  const it = data.items;
  const s = {};
  Core.toggle(s, it.pain_location, 'epigastric');
  Core.toggle(s, it.pain_location, 'ruq');
  Core.toggle(s, it.duration, 'd1_3');
  Core.toggle(s, it.pain_quality, 'colicky');
  Core.toggle(s, it.severity, 's7');
  Core.toggle(s, it.precipitant, 'fatty_meal');
  Core.toggle(s, it.radiation, 'r_shoulder');
  Core.toggle(s, it.assoc_gi, 'nausea');
  Core.toggle(s, it.assoc_gi, 'vomiting');
  ['fever', 'jaundice'].forEach((o) => { Core.toggle(s, it.assoc_sys, o); Core.toggle(s, it.assoc_sys, o); });
  Core.toggle(s, it.assoc_gi, 'melena');
  Core.toggle(s, it.assoc_gi, 'melena');
  const hpi = Core.composeText(c.hpi, s, it, Core.textVars(new Date(2026, 10, 18)));
  assert.equal(
    hpi,
    '(115/11/18) epigastric and RUQ pain for 1–3 days, described as colicky, severity 7/10, ' +
      'onset after a fatty or heavy meal, radiating to the right shoulder or scapula. ' +
      'Associated with nausea and vomiting. Denied melena, fever, or jaundice.'
  );
  assert.ok(Core.matchCount(data.diseases.biliary_colic, s, it) >= 5);
  assert.equal(Core.orderGroups(c, s)[0].group.locations.some((l) => l === 'ruq' || l === 'epigastric'), true);

  Core.toggle(s, it.tenderness, 'ruq');
  Core.toggle(s, it.abd_signs, 'murphy');
  Core.toggle(s, it.rebound, 'absent');
  Core.toggle(s, it.guarding, 'soft');
  assert.equal(
    Core.composeText(c.pe_text, s, it),
    "Abdomen: soft, tenderness over the RUQ, no rebound tenderness, positive Murphy's sign."
  );
});

// ---------- quick history page ----------

function loadQuickData() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'dist', 'POMD-history.html'), 'utf8');
  const m = html.match(/window\.POMD_DATA = (\{.*\});\n/);
  assert.ok(m, 'POMD_DATA not found in dist/POMD-history.html — run python3 build.py first');
  return Core.prepare(JSON.parse(m[1]));
}

test('quick page data: quick.show lists unique history items and HPI composes', () => {
  const data = loadQuickData();
  assert.equal(data.diseases, undefined);
  data.complaints.forEach((c) => {
    const history = c.history.flatMap((sec) => sec.items);
    assert.ok(c.quick.show.length > 0, c.id);
    assert.equal(new Set(c.quick.show).size, c.quick.show.length, `${c.id}: duplicate in quick.show`);
    c.quick.show.forEach((id) => {
      assert.ok(history.includes(id), `${c.id}: ${id} not in history`);
      assert.ok(data.items[id], `${c.id}: unknown item ${id}`);
    });
  });
  const c = data.complaints.find((x) => x.id === 'abdominal_pain');
  const it = data.items;
  const s = {};
  Core.toggle(s, it.pain_location, 'ruq');
  Core.toggle(s, it.duration, 'd1_3');
  assert.equal(Core.composeText(c.hpi, s, it, { date_roc: '115/01/05' }), '(115/01/05) RUQ pain for 1–3 days.');
});

// ---------- shared state (localStorage) ----------

test('sanitizeState keeps only known items / options with valid values', () => {
  const items = fixture().items;
  const raw = {
    loc: { ruq: true, bogus: true },
    sev: { s3: true, s7: true },           // single with two values -> dropped
    sx: { nausea: 'present', fever: 'absent', jaundice: true },
    dur: { h: 'present' },                  // wrong value type -> dropped
    nope: { x: true }
  };
  assert.deepEqual(Core.sanitizeState(raw, items), {
    loc: { ruq: true },
    sx: { nausea: 'present', fever: 'absent' }
  });
  assert.deepEqual(Core.sanitizeState(null, items), {});
});

test('stored state round-trips; bad JSON -> null', () => {
  const items = fixture().items;
  const s = {};
  Core.toggle(s, items.loc, 'epi');
  Core.toggle(s, items.sx, 'fever');
  const back = Core.parseStoredState(Core.serializeState('abdominal_pain', s), items);
  assert.deepEqual(back, { complaint: 'abdominal_pain', state: s });
  assert.equal(Core.parseStoredState('{not json', items), null);
  assert.equal(Core.parseStoredState('{"state":{}}', items), null);
  assert.equal(Core.parseStoredState(null, items), null);
});

test('sanitizeOrder keeps unique history items of the complaint', () => {
  const c = { history: [{ section: 'A', items: ['loc', 'dur'] }, { section: 'B', items: ['sx'] }] };
  assert.deepEqual(Core.sanitizeOrder(['dur', 'zzz', 'loc', 'dur'], c), ['dur', 'loc']);
  assert.deepEqual(Core.sanitizeOrder([], c), []);
  assert.equal(Core.sanitizeOrder('x', c), null);
});

// ---------- text variables ----------

test('rocDate: Minguo year, zero-padded month and day', () => {
  assert.equal(Core.rocDate(new Date(2026, 10, 18)), '115/11/18');
  assert.equal(Core.rocDate(new Date(2026, 0, 5)), '115/01/05');
  assert.deepEqual(Core.textVars(new Date(2027, 11, 31)), { date_roc: '116/12/31' });
});

test('{@var} renders like fixed text and never counts as filled', () => {
  const items = fixture().items;
  const vars = { date_roc: '115/11/18' };
  const s = {};
  const spec = { sentences: [{ always: true, parts: ['({@date_roc}) {loc|abdominal pain}'] }, { parts: ['seen {@date_roc}'] }] };
  assert.equal(Core.composeText(spec, s, items, vars), '(115/11/18) abdominal pain.');
  Core.toggle(s, items.loc, 'ruq');
  assert.equal(Core.composeText(spec, s, items, vars), '(115/11/18) RUQ pain.');
  assert.equal(Core.composeText(spec, s, items), '() RUQ pain.');
});
