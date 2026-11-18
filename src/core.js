/*
 * POMD core logic — pure functions, no DOM access.
 * Loaded by both browser pages (dist/POMD.html, dist/POMD-history.html) and by the Node tests.
 *
 * Selection state shape:
 *   { [itemId]: { [optionId]: true | 'present' | 'absent' } }
 *   - single / multi items store `true` for each selected option
 *   - presence items store 'present' or 'absent' per option
 */
(function (root) {
  'use strict';

  // ---------- data preparation ----------

  // Adds lookup maps to the data produced by build.py. Safe to call twice.
  function prepare(data) {
    Object.keys(data.items).forEach(function (id) {
      var item = data.items[id];
      if (item.optById) return;
      item.optById = {};
      item.options.forEach(function (o) { item.optById[o.id] = o; });
    });
    return data;
  }

  // ---------- complaint view ----------

  // { itemId: true } for the items shown in a complaint's history and PE columns,
  // or null when the complaint lists no columns (then every item counts as shown).
  function shownItems(complaint) {
    if (!complaint || (!complaint.history && !complaint.pe)) return null;
    var out = {};
    (complaint.history || []).concat(complaint.pe || []).forEach(function (sec) {
      sec.items.forEach(function (id) { out[id] = true; });
    });
    return out;
  }

  // Options of an item as shown in a complaint: the complaint may restrict an item to a
  // subset (`item_options`), so one shared vocabulary item can serve several complaints.
  function itemOptions(complaint, item) {
    var sub = complaint && complaint.item_options && complaint.item_options[item.id];
    if (!sub) return item.options;
    return item.options.filter(function (o) { return sub.indexOf(o.id) >= 0; });
  }

  // English phrasing for an item; a complaint may replace it (`item_ask`) when the shared
  // wording does not fit (e.g. "Have you had pain like this before?" for diarrhea).
  function itemAsk(complaint, item) {
    var own = complaint && complaint.item_ask && complaint.item_ask[item.id];
    return own || item.ask || [];
  }

  // Item label; a complaint may replace it (`item_label`), e.g. "Systemic" instead of
  // "Systemic / hepatobiliary" when only the systemic options are shown.
  function itemLabel(complaint, item) {
    return (complaint && complaint.item_label && complaint.item_label[item.id]) || item.label;
  }

  // A disease feature takes part in a complaint only if its item is shown there and at least
  // one of its options is offered (DESIGN 4.6: diseases shared by several complaints).
  function featureShown(feature, complaint) {
    var shown = shownItems(complaint);
    if (!shown) return true;
    if (!shown[feature.item]) return false;
    var sub = complaint.item_options && complaint.item_options[feature.item];
    return !sub || feature.options.some(function (o) { return sub.indexOf(o) >= 0; });
  }

  // ---------- selection ----------

  function toggle(state, item, optId) {
    var sel = state[item.id] || (state[item.id] = {});
    var k;
    if (item.type === 'presence') {
      var v = sel[optId];
      if (!v) sel[optId] = 'present';
      else if (v === 'present') sel[optId] = 'absent';
      else delete sel[optId];
    } else if (item.type === 'single') {
      var had = !!sel[optId];
      for (k in sel) delete sel[k];
      if (!had) sel[optId] = true;
    } else {
      if (sel[optId]) {
        delete sel[optId];
      } else {
        var exclusive = !!item.optById[optId].exclusive;
        for (k in sel) {
          if (exclusive || item.optById[k].exclusive) delete sel[k];
        }
        sel[optId] = true;
      }
    }
    if (Object.keys(sel).length === 0) delete state[item.id];
    return state;
  }

  function isEmpty(state) {
    return Object.keys(state).length === 0;
  }

  // Starting selections for a new patient, from the complaint's `defaults` ({ item: [option ids] }).
  function defaultState(complaint, items) {
    var s = {};
    var d = (complaint && complaint.defaults) || {};
    Object.keys(d).forEach(function (iid) {
      var item = items[iid];
      if (!item) return;
      d[iid].forEach(function (oid) {
        if (item.optById[oid] && !(s[iid] && s[iid][oid])) toggle(s, item, oid);
      });
    });
    return s;
  }

  function sameState(a, b) {
    var ka = Object.keys(a);
    if (ka.length !== Object.keys(b).length) return false;
    return ka.every(function (iid) {
      var sa = a[iid];
      var sb = b[iid];
      if (!sb) return false;
      var oa = Object.keys(sa);
      return oa.length === Object.keys(sb).length && oa.every(function (oid) { return sa[oid] === sb[oid]; });
    });
  }

  // True when nothing has been selected beyond the complaint's defaults.
  function isPristine(state, complaint, items) {
    return sameState(state, defaultState(complaint, items));
  }

  // Selected options of an item, in the item's option order.
  function selectedOptions(item, state) {
    var sel = state[item.id];
    if (!sel) return [];
    return item.options.filter(function (o) { return !!sel[o.id]; });
  }

  // ---------- disease feature comparison ----------

  // feature: { item, options: [...], state?: 'present' | 'absent' }
  // returns 'match' | 'different' | 'none'
  function featureStatus(feature, state, items) {
    var sel = state[feature.item];
    var item = items[feature.item];
    if (!sel || !item) return 'none';
    var i;
    if (item.type === 'presence') {
      // "item = a | b"    → any of a, b present = match
      // "item = no a | b" → none of a, b present (at least one marked absent) = match
      var present = false;
      var absent = false;
      for (i = 0; i < feature.options.length; i++) {
        var v = sel[feature.options[i]];
        if (v === 'present') present = true;
        else if (v === 'absent') absent = true;
      }
      if (feature.state === 'absent') return present ? 'different' : (absent ? 'match' : 'none');
      return present ? 'match' : (absent ? 'different' : 'none');
    }
    for (i = 0; i < feature.options.length; i++) {
      if (sel[feature.options[i]]) return 'match';
    }
    return 'different';
  }

  // Human-readable description of what is currently selected for a feature's item
  // (used to explain an orange "Different" status).
  function describeSelection(feature, state, items) {
    var item = items[feature.item];
    var sel = state[feature.item];
    if (!item || !sel) return '';
    if (item.type === 'presence') {
      return feature.options
        .filter(function (o) { return sel[o]; })
        .map(function (o) { return (sel[o] === 'present' ? '+ ' : '− ') + item.optById[o].label; })
        .join(', ');
    }
    return selectedOptions(item, state).map(function (o) { return o.label; }).join(', ');
  }

  // All comparable features; with a complaint, only those that take part in it.
  function diseaseFeatures(disease, complaint) {
    var all = (disease.symptoms || []).concat(disease.pe || []);
    return complaint ? all.filter(function (f) { return featureShown(f, complaint); }) : all;
  }

  function matchCount(disease, state, items, complaint) {
    return diseaseFeatures(disease, complaint).filter(function (f) {
      return featureStatus(f, state, items) === 'match';
    }).length;
  }

  // Time-course tags (acute / subacute / chronic) implied by the current selection.
  function selectedTimecourses(complaint, state, items) {
    var item = items[complaint.timecourse_item];
    var out = [];
    if (!item) return out;
    selectedOptions(item, state).forEach(function (o) {
      (o.tc || []).forEach(function (t) { if (out.indexOf(t) < 0) out.push(t); });
    });
    return out;
  }

  // 'match' | 'different' | 'none'
  function timecourseStatus(disease, selectedTc) {
    if (!selectedTc.length) return 'none';
    for (var i = 0; i < selectedTc.length; i++) {
      if ((disease.timecourse || []).indexOf(selectedTc[i]) >= 0) return 'match';
    }
    return 'different';
  }

  // Groups whose `options` intersect the selection of the complaint's `group_item`
  // (e.g. pain location, stool character) move to the top; otherwise the complaint's order is kept.
  // A presence group item counts only options marked present.
  function orderGroups(complaint, state) {
    var sel = state[complaint.group_item] || {};
    var promoted = [];
    var rest = [];
    complaint.ddx.forEach(function (g) {
      var hit = (g.options || []).some(function (l) { return sel[l] === true || sel[l] === 'present'; });
      (hit ? promoted : rest).push({ group: g, promoted: hit });
    });
    return promoted.concat(rest);
  }

  // Flat, de-duplicated disease list sorted by match count (high → low).
  // Ties keep the group order from orderGroups(), so promoted groups come first.
  // Returns [{ id, n, groups: [group label...] }].
  function rankByMatches(complaint, diseases, state, items) {
    var byId = {};
    var list = [];
    orderGroups(complaint, state).forEach(function (entry) {
      entry.group.diseases.forEach(function (id) {
        if (!byId[id]) {
          byId[id] = { id: id, n: matchCount(diseases[id], state, items, complaint), groups: [], order: list.length };
          list.push(byId[id]);
        }
        byId[id].groups.push(entry.group.group);
      });
    });
    list.sort(function (a, b) { return (b.n - a.n) || (a.order - b.order); });
    return list.map(function (x) { return { id: x.id, n: x.n, groups: x.groups }; });
  }

  // ---------- text generation ----------

  function joinList(arr, conj) {
    if (arr.length === 0) return '';
    if (arr.length === 1) return arr[0];
    if (conj === ',') return arr.join(', ');
    if (arr.length === 2) return arr[0] + ' ' + conj + ' ' + arr[1];
    return arr.slice(0, -1).join(', ') + ', ' + conj + ' ' + arr[arr.length - 1];
  }

  function applyTemplate(tpl, text) {
    return tpl ? tpl.replace('{}', text) : text;
  }

  // Renders one item reference into a list of text pieces.
  // mode: '' (default), '+' (present only), '-' (absent only), '*' (present and absent)
  function renderRef(item, mode, state) {
    var sel = state[item.id];
    if (!sel) return [];
    if (item.type === 'presence') {
      var pos = [];
      var neg = [];
      item.options.forEach(function (o) {
        if (sel[o.id] === 'present') pos.push(o.frag);
        else if (sel[o.id] === 'absent') neg.push(mode === '-' ? o.frag : (o.frag_neg || 'no ' + o.frag));
      });
      if (mode === '+') return pos;
      if (mode === '-') return neg;
      // '*' (and default): positive findings first, then negatives — avoids "no A, B" ambiguity
      var all = pos.concat(neg);
      return all.length ? [joinList(all, item.join || 'and')] : [];
    }
    var opts = selectedOptions(item, state);
    if (!opts.length) return [];
    var normal = opts.filter(function (o) { return !o.exclusive; }).map(function (o) { return o.frag; });
    var excl = opts.filter(function (o) { return o.exclusive; }).map(function (o) { return o.frag; });
    var pieces = [];
    if (normal.length) pieces.push(applyTemplate(item.template, joinList(normal, item.join || 'and')));
    return pieces.concat(excl);
  }

  // Parses a template string into tokens:
  //   { t: 'text', v } | { t: 'ph', refs: [{id, mode}], def } | { t: 'var', name } | { t: 'opt', tokens: [...] }
  function parseTemplate(tpl) {
    var tokens = [];
    var stack = [tokens];
    var cur = tokens;
    var buf = '';
    function flush() { if (buf) { cur.push({ t: 'text', v: buf }); buf = ''; } }
    for (var i = 0; i < tpl.length; i++) {
      var c = tpl[i];
      if (c === '[') {
        flush();
        var seg = { t: 'opt', tokens: [] };
        cur.push(seg);
        stack.push(seg.tokens);
        cur = seg.tokens;
      } else if (c === ']') {
        flush();
        stack.pop();
        cur = stack[stack.length - 1];
      } else if (c === '{') {
        flush();
        var end = tpl.indexOf('}', i);
        cur.push(parsePlaceholder(tpl.slice(i + 1, end)));
        i = end;
      } else {
        buf += c;
      }
    }
    flush();
    return tokens;
  }

  function parsePlaceholder(body) {
    // {@name}: a value supplied by the page (e.g. today's date), not an item.
    if (body.charAt(0) === '@') return { t: 'var', name: body.slice(1).trim() };
    var bar = body.indexOf('|');
    var def = bar >= 0 ? body.slice(bar + 1) : null;
    var refs = (bar >= 0 ? body.slice(0, bar) : body).split(',').map(function (r) {
      r = r.trim();
      var last = r.charAt(r.length - 1);
      if (last === '+' || last === '-' || last === '*') return { id: r.slice(0, -1), mode: last };
      return { id: r, mode: '' };
    });
    return { t: 'ph', refs: refs, def: def };
  }

  function renderPlaceholder(ph, state, items) {
    var pieces = [];
    var conj = null;
    ph.refs.forEach(function (r) {
      var item = items[r.id];
      if (!item) return;
      pieces = pieces.concat(renderRef(item, r.mode, state));
      if (conj === null) {
        conj = r.mode === '-' ? 'or' : (r.mode === '+' ? 'and' : (item.join || 'and'));
      }
    });
    return joinList(pieces, conj || 'and');
  }

  // Returns { text, ok, filled }:
  //   ok     — false when a required placeholder (outside [...] and without default) is empty
  //   filled — true when at least one placeholder produced real (non-default) content
  // vars: values for {@name}; they act like fixed text and never count as "filled".
  function renderTokens(tokens, state, items, vars) {
    var text = '';
    var ok = true;
    var filled = false;
    tokens.forEach(function (tk) {
      if (tk.t === 'text') {
        text += tk.v;
      } else if (tk.t === 'var') {
        text += (vars && vars[tk.name]) || '';
      } else if (tk.t === 'ph') {
        var v = renderPlaceholder(tk, state, items);
        if (v) { text += v; filled = true; }
        else if (tk.def !== null) text += tk.def;
        else ok = false;
      } else {
        var sub = renderTokens(tk.tokens, state, items, vars);
        if (sub.ok && sub.filled) { text += sub.text; filled = true; }
      }
    });
    return { text: text, ok: ok, filled: filled };
  }

  var templateCache = {};
  function renderTemplate(tpl, state, items, vars) {
    var tokens = templateCache[tpl] || (templateCache[tpl] = parseTemplate(tpl));
    return renderTokens(tokens, state, items, vars);
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  // Taiwan (ROC / Minguo) date: year - 1911, zero-padded month and day, e.g. 115/01/05.
  function rocDate(d) {
    return (d.getFullYear() - 1911) + '/' + pad2(d.getMonth() + 1) + '/' + pad2(d.getDate());
  }

  // Values available to templates as {@name}.
  function textVars(now) {
    return { date_roc: rocDate(now) };
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  // spec: { joiner, sentences: [{ lead?, parts: [tpl...], sep?, end?, always? }] }
  // vars: optional values for {@name} placeholders (see textVars)
  function composeText(spec, state, items, vars) {
    var out = [];
    (spec.sentences || []).forEach(function (s) {
      var parts = [];
      var filled = false;
      s.parts.forEach(function (p) {
        var r = renderTemplate(p, state, items, vars);
        if (!r.ok) return;
        if (r.filled) filled = true;
        if (r.text.trim()) parts.push(r.text.trim());
      });
      if (!parts.length || (!filled && !s.always)) return;
      var sep = s.sep === undefined ? ', ' : s.sep;
      var end = s.end === undefined ? '.' : s.end;
      out.push(capitalize((s.lead || '') + parts.join(sep) + end));
    });
    return out.join(spec.joiner === undefined ? ' ' : spec.joiner);
  }

  // ---------- shared state (localStorage, both pages) ----------

  // localStorage keys. The patient state is shared by dist/POMD.html and dist/POMD-history.html
  // (same file:// origin in Edge / Chrome) and kept until "New patient".
  var STATE_KEY = 'pomd.patient.v1';
  var LAYOUT_KEY = 'pomd.quickLayout.v1';

  // Keeps only known items / options with values valid for the item type.
  function sanitizeState(raw, items) {
    var out = {};
    if (!raw || typeof raw !== 'object') return out;
    Object.keys(raw).forEach(function (iid) {
      var item = items[iid];
      var sel = raw[iid];
      if (!item || !sel || typeof sel !== 'object') return;
      var clean = {};
      Object.keys(sel).forEach(function (oid) {
        if (!item.optById[oid]) return;
        var v = sel[oid];
        if (item.type === 'presence' ? (v === 'present' || v === 'absent') : v === true) clean[oid] = v;
      });
      if (item.type === 'single' && Object.keys(clean).length > 1) return;
      if (Object.keys(clean).length) out[iid] = clean;
    });
    return out;
  }

  // Parses the stored patient JSON -> { complaint, state } or null.
  function parseStoredState(json, items) {
    if (!json) return null;
    var raw;
    try { raw = JSON.parse(json); } catch (e) { return null; }
    if (!raw || typeof raw !== 'object' || typeof raw.complaint !== 'string') return null;
    return { complaint: raw.complaint, state: sanitizeState(raw.state, items) };
  }

  function serializeState(complaintId, state) {
    return JSON.stringify({ complaint: complaintId, state: state });
  }

  // Saved question order for one complaint, restricted to that complaint's history items.
  function sanitizeOrder(order, complaint) {
    if (!Array.isArray(order)) return null;
    var allowed = [];
    complaint.history.forEach(function (sec) { allowed = allowed.concat(sec.items); });
    var out = [];
    order.forEach(function (id) {
      if (allowed.indexOf(id) >= 0 && out.indexOf(id) < 0) out.push(id);
    });
    return out;
  }

  var api = {
    STATE_KEY: STATE_KEY,
    LAYOUT_KEY: LAYOUT_KEY,
    sanitizeState: sanitizeState,
    parseStoredState: parseStoredState,
    serializeState: serializeState,
    sanitizeOrder: sanitizeOrder,
    prepare: prepare,
    shownItems: shownItems,
    itemOptions: itemOptions,
    itemAsk: itemAsk,
    itemLabel: itemLabel,
    featureShown: featureShown,
    toggle: toggle,
    isEmpty: isEmpty,
    defaultState: defaultState,
    sameState: sameState,
    isPristine: isPristine,
    selectedOptions: selectedOptions,
    featureStatus: featureStatus,
    describeSelection: describeSelection,
    diseaseFeatures: diseaseFeatures,
    matchCount: matchCount,
    selectedTimecourses: selectedTimecourses,
    timecourseStatus: timecourseStatus,
    orderGroups: orderGroups,
    rankByMatches: rankByMatches,
    joinList: joinList,
    renderTemplate: renderTemplate,
    rocDate: rocDate,
    textVars: textVars,
    composeText: composeText
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.POMDCore = api;
})(this);
