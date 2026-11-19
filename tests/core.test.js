// Run with: node --test tests/*.test.js
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
    group_item: 'loc', timecourse_item: 'dur',
    ddx: [{ group: 'RUQ', options: ['ruq'] }, { group: 'LLQ', options: ['llq'] }]
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
    group_item: 'loc',
    ddx: [{ group: 'RUQ', options: ['ruq'], diseases: ['a', 'c'] }, { group: 'LLQ', options: ['llq'], diseases: ['b', 'c'] }]
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
  assert.equal(Core.orderGroups(c, s)[0].group.options.some((l) => l === 'ruq' || l === 'epigastric'), true);

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

// ---------- complaint defaults ----------

test('defaultState / isPristine', () => {
  const items = fixture().items;
  const c = { defaults: { tender: ['none'], sev: ['s3'], unknown: ['x'] } };
  const d = Core.defaultState(c, items);
  assert.deepEqual(d, { tender: { none: true }, sev: { s3: true } });
  assert.equal(Core.isPristine(d, c, items), true);
  Core.toggle(d, items.tender, 'ruq');          // exclusive "none" is replaced
  assert.deepEqual(d.tender, { ruq: true });
  assert.equal(Core.isPristine(d, c, items), false);
  assert.equal(Core.isPristine({}, c, items), false);
  assert.equal(Core.isPristine({}, {}, items), true);
});

test('built data: abdominal pain PE defaults (soft, non-tender)', () => {
  const data = loadBuiltData();
  const c = data.complaints.find((x) => x.id === 'abdominal_pain');
  const s = Core.defaultState(c, data.items);
  assert.deepEqual(s, { guarding: { soft: true }, tenderness: { none: true } });
  assert.equal(Core.composeText(c.pe_text, s, data.items), 'Abdomen: soft, non-tender.');
  assert.deepEqual(loadQuickData().complaints[0].defaults, c.defaults);
});

test('complaint view: option subsets, ask override, feature visibility', () => {
  const { items } = fixture();
  const complaint = {
    history: [{ section: 'A', items: ['loc', 'sx'] }],
    pe: [{ section: 'B', items: ['tender'] }],
    item_options: { sx: ['fever', 'jaundice'] },
    item_ask: { loc: ['Any tummy pain?'] },
    item_label: { sx: 'Systemic' }
  };
  assert.equal(Core.itemLabel(complaint, items.sx), 'Systemic');
  assert.equal(Core.itemLabel(complaint, items.loc), items.loc.label);
  assert.deepEqual(Core.itemOptions(complaint, items.sx).map((o) => o.id), ['fever', 'jaundice']);
  assert.equal(Core.itemOptions(complaint, items.loc).length, 3);
  assert.deepEqual(Core.itemAsk(complaint, items.loc), ['Any tummy pain?']);
  assert.deepEqual(Core.itemAsk(complaint, items.sev), []);
  const disease = {
    symptoms: [
      { item: 'loc', options: ['ruq'] },
      { item: 'sx', options: ['nausea'], state: 'present' },   // option not offered → hidden
      { item: 'sx', options: ['nausea', 'fever'], state: 'present' },
      { item: 'sev', options: ['s7'] }                         // item not shown → hidden
    ],
    pe: [{ item: 'tender', options: ['ruq'] }]
  };
  assert.equal(Core.diseaseFeatures(disease).length, 5);
  assert.equal(Core.diseaseFeatures(disease, complaint).length, 3);
  const s = {};
  Core.toggle(s, items.sev, 's7');
  Core.toggle(s, items.loc, 'ruq');
  assert.equal(Core.matchCount(disease, s, items), 2);
  assert.equal(Core.matchCount(disease, s, items, complaint), 1);
  // A complaint without columns (bare test fixtures) shows everything.
  assert.equal(Core.diseaseFeatures(disease, { ddx: [] }).length, 5);
});

test('orderGroups: presence group item promotes only present options', () => {
  const complaint = { group_item: 'sx', ddx: [{ group: 'A', options: ['fever'] }, { group: 'B', options: ['nausea'] }] };
  assert.deepEqual(Core.orderGroups(complaint, { sx: { nausea: 'absent' } }).map((e) => e.group.group), ['A', 'B']);
  assert.deepEqual(Core.orderGroups(complaint, { sx: { nausea: 'present' } }).map((e) => e.group.group), ['B', 'A']);
});

test('built data: diarrhea complaint — subsets, groups, shared diseases, HPI', () => {
  const data = loadBuiltData();
  const it = data.items;
  const c = data.complaints.find((x) => x.id === 'diarrhea');
  const ab = data.complaints.find((x) => x.id === 'abdominal_pain');
  assert.ok(c && ab);
  // risk shows only the diarrhea-relevant options
  assert.ok(Core.itemOptions(c, it.risk).length < it.risk.options.length);
  assert.ok(Core.itemOptions(c, it.risk).some((o) => o.id === 'travel'));
  // shared disease: diarrhea features hidden in abdominal pain and vice versa
  const uc = data.diseases.ulcerative_colitis;
  assert.ok(Core.diseaseFeatures(uc, c).some((f) => f.item === 'stool_character'));
  assert.ok(!Core.diseaseFeatures(uc, ab).some((f) => f.item === 'stool_character'));
  assert.ok(!Core.diseaseFeatures(uc, c).some((f) => f.item === 'duration'));
  const s = Core.defaultState(c, it);
  Core.toggle(s, it.stool_character, 'bloody');
  Core.toggle(s, it.diarrhea_duration, 'lt3d');
  Core.toggle(s, it.diarrhea_drugs, 'antibiotics');
  assert.ok(Core.orderGroups(c, s)[0].promoted);
  assert.ok(Core.orderGroups(c, s)[0].group.options.includes('bloody'));
  assert.deepEqual(Core.selectedTimecourses(c, s, it), ['acute']);
  assert.ok(Core.matchCount(data.diseases.c_difficile_infection, s, it, c) >= 1);
  const hpi = Core.composeText(c.hpi, s, it, { date_roc: '115/01/05' });
  assert.match(hpi, /^\(115\/01\/05\) bloody diarrhea for less than 3 days\./);
  assert.match(hpi, /Medications include antibiotics in the past 3 months\./);
  assert.equal(Core.composeText(c.pe_text, s, it), 'Abdomen: soft, non-tender.');
});

test('built data: black stool complaint — appearance ordering, mimics, shared diseases, HPI', () => {
  const data = loadBuiltData();
  const it = data.items;
  const c = data.complaints.find((x) => x.id === 'black_stool');
  const ab = data.complaints.find((x) => x.id === 'abdominal_pain');
  assert.ok(c && ab);
  // melena is the complaint itself: not offered as an associated symptom; retching only here
  assert.ok(!Core.itemOptions(c, it.assoc_gi).some((o) => o.id === 'melena'));
  assert.ok(Core.itemOptions(c, it.assoc_gi).some((o) => o.id === 'retching'));
  assert.ok(!Core.itemOptions(ab, it.assoc_gi).some((o) => o.id === 'retching'));
  // shared disease: black stool features hidden in abdominal pain
  const pud = data.diseases.peptic_ulcer_disease;
  assert.ok(Core.diseaseFeatures(pud, c).some((f) => f.item === 'stool_appearance'));
  assert.ok(!Core.diseaseFeatures(pud, ab).some((f) => f.item === 'stool_appearance'));
  // formed black stool with iron → mimics group first
  const m = Core.defaultState(c, it);
  Core.toggle(m, it.stool_appearance, 'formed');
  Core.toggle(m, it.melena_mimic, 'iron');
  assert.equal(Core.orderGroups(c, m)[0].group.group, 'Not true melena');
  assert.equal(Core.rankByMatches(c, data.diseases, m, it)[0].id, 'pseudo_melena');
  // tarry stool → upper GI first; maroon → small bowel first
  const s = Core.defaultState(c, it);
  Core.toggle(s, it.stool_appearance, 'tarry');
  Core.toggle(s, it.melena_duration, 'd1_3');
  Core.toggle(s, it.bleed_drugs, 'nsaid');
  assert.equal(Core.orderGroups(c, s)[0].group.group, 'Peptic & mucosal');
  assert.deepEqual(Core.selectedTimecourses(c, s, it), ['acute']);
  assert.ok(Core.matchCount(pud, s, it, c) >= 2);
  const hpi = Core.composeText(c.hpi, s, it, { date_roc: '115/01/05' });
  assert.match(hpi, /^\(115\/01\/05\) tarry, sticky, foul-smelling black stools for 1–3 days\./);
  assert.match(hpi, /Medications include NSAIDs or COX-2 inhibitors\./);
  const r = Core.defaultState(c, it);
  Core.toggle(r, it.stool_appearance, 'maroon');
  assert.equal(Core.orderGroups(c, r)[0].group.group, 'Small bowel & right colon');
});

test('details blocks: sub-items count as shown and are summarized', () => {
  const { items } = fixture();
  const complaint = {
    history: [{ section: 'A', items: ['loc'] }],
    item_details: { loc: { label: 'More', items: ['sev', 'sx'] } }
  };
  assert.equal(Core.itemDetails(complaint, 'loc').label, 'More');
  assert.equal(Core.itemDetails(complaint, 'sev'), null);
  assert.ok(Core.shownItems(complaint).sev && Core.shownItems(complaint).sx);
  assert.ok(Core.featureShown({ item: 'sev', options: ['s7'] }, complaint));
  const s = {};
  const det = Core.itemDetails(complaint, 'loc');
  assert.equal(Core.detailsSummary(det, s, items), '');
  Core.toggle(s, items.sev, 's7');
  Core.toggle(s, items.sx, 'fever');
  Core.toggle(s, items.sx, 'nausea');
  Core.toggle(s, items.sx, 'nausea');
  assert.equal(Core.detailsSummary(det, s, items), '7 · no Nausea · Fever');
});

test('orderGroups without group_item keeps the complaint order', () => {
  const complaint = { ddx: [{ group: 'A' }, { group: 'B' }] };
  assert.deepEqual(Core.orderGroups(complaint, { x: { y: true } }).map((e) => e.group.group), ['A', 'B']);
});

test('built data: abnormal liver tests — alcohol details, groups, HPI', () => {
  const data = loadBuiltData();
  const it = data.items;
  const c = data.complaints.find((x) => x.id === 'abnormal_lft');
  assert.ok(c);
  assert.ok(!c.group_item);
  const det = Core.itemDetails(c, 'alcohol_use');
  assert.ok(det && det.items.includes('alcohol_amount') && det.note);
  // details items are not separate quick-page questions
  assert.ok(!c.quick.show.includes('alcohol_amount'));
  // pain, drugs and viral blocks are collapsible too
  assert.deepEqual(Core.itemDetails(c, 'pain_location').items, ['pain_pattern', 'meal_relation', 'radiation']);
  assert.deepEqual(Core.itemDetails(c, 'drug_timing').items, ['liver_drugs', 'herbs']);
  assert.deepEqual(Core.itemDetails(c, 'viral_history').items, ['viral_exposure', 'viral_sx']);
  assert.ok(c.history.some((sec) => sec.section === 'Viral hepatitis'));
  const s = Core.defaultState(c, it);
  Core.toggle(s, it.lft_duration, 'm1_6');
  Core.toggle(s, it.alcohol_use, 'heavy');
  Core.toggle(s, it.alcohol_type, 'kaoliang');
  Core.toggle(s, it.alcohol_amount, 'g60_100');
  Core.toggle(s, it.alcohol_years, 'y10_20');
  Core.toggle(s, it.alcohol_last, 'still');
  Core.toggle(s, it.assoc_sys, 'jaundice');
  assert.equal(Core.detailsSummary(det, s, it), 'Kaoliang / spirits · 60–100 g/day · 10–20 yr · Still drinking');
  assert.ok(Core.matchCount(data.diseases.alcoholic_hepatitis, s, it, c) >= 5);
  assert.deepEqual(Core.selectedTimecourses(c, s, it), ['subacute']);
  assert.equal(Core.orderGroups(c, s)[0].group.group, 'Alcohol');
  const hpi = Core.composeText(c.hpi, s, it, { date_roc: '115/01/05' });
  assert.equal(hpi, '(115/01/05) abnormal liver tests for 1–6 months. Associated with jaundice. ' +
    'Drinks heavily, mainly kaoliang, about 60–100 g of alcohol a day, for 10–20 years, still drinking.');
  const v = Core.defaultState(c, it);
  Core.toggle(v, it.viral_sx, 'sore_throat');
  Core.toggle(v, it.viral_sx, 'lymph_nodes');
  Core.toggle(v, it.assoc_sys, 'fever');
  Core.toggle(v, it.age_group, 'under_40');
  assert.equal(Core.rankByMatches(c, data.diseases, v, it)[0].id, 'ebv_infection');
  const d = Core.defaultState(c, it);
  Core.toggle(d, it.drug_timing, 'none');
  assert.match(Core.composeText(c.hpi, d, it, { date_roc: '115/01/05' }), /Takes no regular medications or herbal products\./);
});
