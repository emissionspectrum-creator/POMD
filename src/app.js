/*
 * POMD browser UI. All clinical content comes from window.POMD_DATA (built from data/);
 * all matching / text logic lives in core.js (window.POMDCore).
 * Nothing is persisted: state lives only in memory and is cleared by "New patient" or a reload.
 */
(function () {
  'use strict';

  var Core = window.POMDCore;
  var DATA = Core.prepare(window.POMD_DATA);
  var items = DATA.items;
  var diseases = DATA.diseases;

  var complaint = DATA.complaints[0];
  var state = {};
  var openDiseaseId = null;
  var clearArmTimer = null;

  var TC_SHORT = { acute: 'A', subacute: 'S', chronic: 'C' };
  var STATUS_ICON = { match: '✓', different: '≠', none: '○' };
  var STATUS_LABEL = { match: 'Match', different: 'Different', none: 'Not asked' };

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------- static layout (rebuilt when the complaint changes) ----------

  function itemBlockHtml(itemId) {
    var item = items[itemId];
    var kind = item.type === 'multi' ? 'multi' : (item.type === 'presence' ? '+ / −' : '');
    var h = '<div class="item" data-item-block="' + esc(item.id) + '">';
    h += '<div class="item-head"><span class="item-label">' + esc(item.label) + '</span>';
    if (kind) h += '<span class="item-kind">' + kind + '</span>';
    h += '<button type="button" class="item-clear" data-clear="' + esc(item.id) + '" title="Clear this item">clear</button></div>';
    if (item.ask && item.ask.length) {
      h += '<ul class="ask">';
      item.ask.forEach(function (q) { h += '<li>' + esc(q) + '</li>'; });
      h += '</ul>';
    }
    h += '<div class="chips ' + item.type + '">';
    item.options.forEach(function (o) {
      h += '<button type="button" class="chip' + (o.red_flag ? ' rf' : '') + '" data-item="' + esc(item.id) +
        '" data-opt="' + esc(o.id) + '"' + (o.red_flag ? ' title="Red flag"' : '') + '>' + esc(o.label) + '</button>';
    });
    h += '</div></div>';
    return h;
  }

  function sectionsHtml(sections) {
    var h = '';
    sections.forEach(function (sec) {
      h += '<div class="section"><h3>' + esc(sec.section) + '</h3>';
      sec.items.forEach(function (id) { h += itemBlockHtml(id); });
      h += '</div>';
    });
    return h;
  }

  function suggestHtml(list) {
    return list.map(function (x) {
      return '<li><span class="s-name">' + esc(x.name) + '</span>' +
        (x.note ? '<span class="s-note">' + esc(x.note) + '</span>' : '') + '</li>';
    }).join('');
  }

  function buildLayout() {
    $('history').innerHTML = sectionsHtml(complaint.history);
    $('pe').innerHTML = sectionsHtml(complaint.pe);
    $('labs').innerHTML = suggestHtml(complaint.labs);
    $('imaging').innerHTML = suggestHtml(complaint.imaging);
  }

  function buildComplaintSelect() {
    var sel = $('complaint-select');
    sel.innerHTML = DATA.complaints.map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
    }).join('');
    sel.value = complaint.id;
  }

  // ---------- dynamic rendering ----------

  function updateChips() {
    var chips = document.querySelectorAll('.chip');
    for (var i = 0; i < chips.length; i++) {
      var c = chips[i];
      var v = (state[c.getAttribute('data-item')] || {})[c.getAttribute('data-opt')];
      c.classList.toggle('on', v === true);
      c.classList.toggle('present', v === 'present');
      c.classList.toggle('absent', v === 'absent');
      c.setAttribute('aria-pressed', v ? 'true' : 'false');
    }
    var blocks = document.querySelectorAll('[data-item-block]');
    for (var j = 0; j < blocks.length; j++) {
      blocks[j].classList.toggle('answered', !!state[blocks[j].getAttribute('data-item-block')]);
    }
  }

  function renderDdx() {
    var tcSel = Core.selectedTimecourses(complaint, state, items);
    var h = '';
    Core.orderGroups(complaint, state).forEach(function (entry) {
      var g = entry.group;
      h += '<div class="group' + (entry.promoted ? ' promoted' : '') + '"><h3>' + esc(g.group) + '</h3><ul>';
      g.diseases.forEach(function (id) {
        var d = diseases[id];
        var n = Core.matchCount(d, state, items);
        var cls = 'dx' + (d.must_not_miss ? ' mnm' : '') + (n ? ' hit' : '') + (openDiseaseId === id ? ' open' : '');
        h += '<li><button type="button" class="' + cls + '" data-disease="' + esc(id) + '">';
        h += '<span class="dx-name">' + (d.must_not_miss ? '★ ' : '') + esc(d.name) + '</span>';
        h += '<span class="dx-meta">';
        d.timecourse.forEach(function (t) {
          h += '<span class="tc' + (tcSel.indexOf(t) >= 0 ? ' on' : '') + '" title="' + t + '">' + TC_SHORT[t] + '</span>';
        });
        if (n) h += '<b class="count" title="typical features selected">' + n + '</b>';
        h += '</span></button></li>';
      });
      h += '</ul></div>';
    });
    $('ddx').innerHTML = h;
  }

  function featureListHtml(features) {
    if (!features.length) return '<p class="muted">—</p>';
    var h = '<ul class="feats">';
    features.forEach(function (f) {
      var st = Core.featureStatus(f, state, items);
      h += '<li class="feat ' + st + '" title="' + STATUS_LABEL[st] + '"><span class="ic">' + STATUS_ICON[st] + '</span><span>' + esc(f.text);
      if (st === 'different') {
        h += '<span class="selected-now">selected: ' + esc(Core.describeSelection(f, state, items)) + '</span>';
      }
      h += '</span></li>';
    });
    return h + '</ul>';
  }

  function textListHtml(list) {
    if (!list.length) return '<p class="muted">—</p>';
    return '<ul class="plain">' + list.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
  }

  function renderCard() {
    var card = $('card');
    var d = openDiseaseId && diseases[openDiseaseId];
    if (!d) { card.hidden = true; card.innerHTML = ''; return; }
    var tcSel = Core.selectedTimecourses(complaint, state, items);
    var tcSt = Core.timecourseStatus(d, tcSel);
    var h = '<div class="card-head' + (d.must_not_miss ? ' mnm' : '') + '">';
    h += '<h2>' + (d.must_not_miss ? '★ ' : '') + esc(d.name) + '</h2>';
    h += '<button type="button" class="card-close" data-close-card title="Close (Esc)">×</button></div>';
    h += '<div class="card-badges">';
    if (d.must_not_miss) h += '<span class="badge mnm">Must-not-miss</span>';
    h += '<span class="badge status-' + esc(d.status) + '">' + esc(d.status) + '</span>';
    h += '<span class="badge tcb ' + tcSt + '" title="Typical time course vs. selected duration: ' + STATUS_LABEL[tcSt] + '">' +
      STATUS_ICON[tcSt] + ' ' + esc(d.timecourse.join(' / ')) + '</span></div>';
    h += '<p class="one-liner">' + esc(d.one_liner) + '</p>';
    h += '<p class="legend-feats"><span class="feat match"><span class="ic">' + STATUS_ICON.match + '</span>Match</span>' +
      '<span class="feat none"><span class="ic">' + STATUS_ICON.none + '</span>Not asked</span>' +
      '<span class="feat different"><span class="ic">' + STATUS_ICON.different + '</span>Different</span></p>';
    h += '<h3>Typical symptoms</h3>' + featureListHtml(d.symptoms);
    h += '<h3>Typical PE findings</h3>' + featureListHtml(d.pe);
    h += '<h3>Typical labs</h3>' + textListHtml(d.labs);
    h += '<h3>Recommended imaging / endoscopy</h3>' + textListHtml(d.imaging);
    h += '<h3>Pitfalls</h3>' + textListHtml(d.pitfalls);
    card.innerHTML = h;
    card.hidden = false;
  }

  function currentText() {
    return {
      hpi: Core.composeText(complaint.hpi, state, items),
      pe: Core.composeText(complaint.pe_text, state, items)
    };
  }

  function renderOutput() {
    var t = currentText();
    var empty = Core.isEmpty(state);
    $('out-hpi').textContent = empty ? '' : t.hpi;
    $('out-pe').textContent = t.pe;
    $('out-hpi').classList.toggle('placeholder', empty);
    $('out-pe').classList.toggle('placeholder', !t.pe);
  }

  function refresh() {
    updateChips();
    renderDdx();
    renderCard();
    renderOutput();
  }

  // ---------- actions ----------

  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return Promise.resolve(ok);
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, fallback);
    }
    return fallback();
  }

  function onCopy(which) {
    var t = currentText();
    var text = which === 'hpi' ? t.hpi : which === 'pe' ? t.pe : [t.hpi, t.pe].filter(Boolean).join('\n\n');
    var status = $('copy-status');
    if (Core.isEmpty(state) || !text) {
      status.textContent = 'Nothing to copy';
      return;
    }
    copyText(text).then(function (ok) {
      status.textContent = ok ? 'Copied ✓' : 'Copy failed — select the text and press Ctrl+C';
      status.className = ok ? 'ok' : 'fail';
      setTimeout(function () { status.textContent = ''; status.className = ''; }, 2500);
    });
  }

  function disarmClear() {
    var btn = $('btn-new');
    btn.classList.remove('armed');
    btn.textContent = 'New patient';
    clearTimeout(clearArmTimer);
    clearArmTimer = null;
  }

  // First click arms the button (only if something is selected); second click within 3 s clears.
  function onNewPatient() {
    var btn = $('btn-new');
    if (!Core.isEmpty(state) && !clearArmTimer) {
      btn.classList.add('armed');
      btn.textContent = 'Click again to clear';
      clearArmTimer = setTimeout(disarmClear, 3000);
      return;
    }
    disarmClear();
    state = {};
    openDiseaseId = null;
    ['col-history', 'col-pe', 'col-ddx'].forEach(function (id) { $(id).scrollTop = 0; });
    refresh();
  }

  function setComplaint(id) {
    complaint = DATA.complaints.filter(function (c) { return c.id === id; })[0] || DATA.complaints[0];
    state = {};
    openDiseaseId = null;
    buildLayout();
    refresh();
  }

  function onClick(ev) {
    var t = ev.target.closest('button');
    if (!t) return;
    if (t.hasAttribute('data-opt')) {
      Core.toggle(state, items[t.getAttribute('data-item')], t.getAttribute('data-opt'));
      refresh();
    } else if (t.hasAttribute('data-clear')) {
      delete state[t.getAttribute('data-clear')];
      refresh();
    } else if (t.hasAttribute('data-disease')) {
      var id = t.getAttribute('data-disease');
      openDiseaseId = openDiseaseId === id ? null : id;
      renderDdx();
      renderCard();
      if (openDiseaseId) $('card').scrollTop = 0;
    } else if (t.hasAttribute('data-close-card')) {
      openDiseaseId = null;
      renderDdx();
      renderCard();
    } else if (t.hasAttribute('data-copy')) {
      onCopy(t.getAttribute('data-copy'));
    } else if (t.id === 'btn-new') {
      onNewPatient();
    }
  }

  // The disease card is positioned below the (possibly wrapped) top bar.
  function syncTopHeight() {
    document.documentElement.style.setProperty('--top-h', $('topbar').offsetHeight + 'px');
  }

  function init() {
    syncTopHeight();
    window.addEventListener('resize', syncTopHeight);
    buildComplaintSelect();
    buildLayout();
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && openDiseaseId) {
        openDiseaseId = null;
        renderDdx();
        renderCard();
      }
    });
    var ask = $('toggle-ask');
    ask.checked = false;
    ask.addEventListener('change', function () {
      document.body.classList.toggle('show-ask', this.checked);
    });
    $('complaint-select').addEventListener('change', function () { setComplaint(this.value); });
    refresh();
  }

  init();
})();
