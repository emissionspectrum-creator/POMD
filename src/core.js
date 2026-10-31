/*
 * POMD core logic — pure functions, no DOM access.
 * Loaded by the browser app (dist/POMD.html) and by the Node tests (tests/core.test.js).
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

  function diseaseFeatures(disease) {
    return (disease.symptoms || []).concat(disease.pe || []);
  }

  function matchCount(disease, state, items) {
    return diseaseFeatures(disease).filter(function (f) {
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

  // Groups whose locations intersect the selected pain locations move to the top;
  // otherwise the order defined in the complaint is kept.
  function orderGroups(complaint, state) {
    var sel = state[complaint.location_item] || {};
    var promoted = [];
    var rest = [];
    complaint.ddx.forEach(function (g) {
      var hit = (g.locations || []).some(function (l) { return !!sel[l]; });
      (hit ? promoted : rest).push({ group: g, promoted: hit });
    });
    return promoted.concat(rest);
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
  //   { t: 'text', v } | { t: 'ph', refs: [{id, mode}], def } | { t: 'opt', tokens: [...] }
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
  function renderTokens(tokens, state, items) {
    var text = '';
    var ok = true;
    var filled = false;
    tokens.forEach(function (tk) {
      if (tk.t === 'text') {
        text += tk.v;
      } else if (tk.t === 'ph') {
        var v = renderPlaceholder(tk, state, items);
        if (v) { text += v; filled = true; }
        else if (tk.def !== null) text += tk.def;
        else ok = false;
      } else {
        var sub = renderTokens(tk.tokens, state, items);
        if (sub.ok && sub.filled) { text += sub.text; filled = true; }
      }
    });
    return { text: text, ok: ok, filled: filled };
  }

  var templateCache = {};
  function renderTemplate(tpl, state, items) {
    var tokens = templateCache[tpl] || (templateCache[tpl] = parseTemplate(tpl));
    return renderTokens(tokens, state, items);
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  // spec: { joiner, sentences: [{ lead?, parts: [tpl...], sep?, end?, always? }] }
  function composeText(spec, state, items) {
    var out = [];
    (spec.sentences || []).forEach(function (s) {
      var parts = [];
      var filled = false;
      s.parts.forEach(function (p) {
        var r = renderTemplate(p, state, items);
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

  var api = {
    prepare: prepare,
    toggle: toggle,
    isEmpty: isEmpty,
    selectedOptions: selectedOptions,
    featureStatus: featureStatus,
    describeSelection: describeSelection,
    diseaseFeatures: diseaseFeatures,
    matchCount: matchCount,
    selectedTimecourses: selectedTimecourses,
    timecourseStatus: timecourseStatus,
    orderGroups: orderGroups,
    joinList: joinList,
    renderTemplate: renderTemplate,
    composeText: composeText
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.POMDCore = api;
})(this);
