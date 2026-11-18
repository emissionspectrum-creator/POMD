/*
 * POMD quick history page (dist/POMD-history.html): history questions + HPI only.
 * Clinical content comes from window.POMD_DATA; selection / text logic lives in core.js (window.POMDCore).
 * Nothing is persisted: the question layout and the selections live only in memory.
 * The default layout comes from the complaint's `quick.show`; a reload restores it.
 */
(function () {
  'use strict';

  var Core = window.POMDCore;
  var DATA = Core.prepare(window.POMD_DATA);
  var items = DATA.items;

  var complaint = DATA.complaints[0];
  var order = [];   // visible question ids, in display order
  var state = {};
  var clearArmTimer = null;

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------- layout ----------

  function itemBlockHtml(itemId, idx) {
    var item = items[itemId];
    var kind = item.type === 'multi' ? 'multi' : (item.type === 'presence' ? '+ / −' : '');
    var h = '<div class="item" data-item-block="' + esc(item.id) + '">';
    h += '<div class="item-head"><span class="item-label">' + esc(item.label) + '</span>';
    if (kind) h += '<span class="item-kind">' + kind + '</span>';
    h += '<button type="button" class="item-clear" data-clear="' + esc(item.id) + '" title="Clear this item">clear</button>';
    h += '<span class="item-edit">' +
      '<button type="button" class="btn small" data-move="-1" data-id="' + esc(item.id) + '" title="Move up"' +
      (idx === 0 ? ' disabled' : '') + '>↑</button>' +
      '<button type="button" class="btn small" data-move="1" data-id="' + esc(item.id) + '" title="Move down"' +
      (idx === order.length - 1 ? ' disabled' : '') + '>↓</button>' +
      '<button type="button" class="btn small" data-hide="' + esc(item.id) + '" title="Hide this question">Hide</button>' +
      '</span></div>';
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

  // Hidden questions, grouped by the complaint's history sections (original order).
  function addSelectHtml() {
    var h = '<option value="">+ Add question…</option>';
    var any = false;
    complaint.history.forEach(function (sec) {
      var hidden = sec.items.filter(function (id) { return order.indexOf(id) < 0; });
      if (!hidden.length) return;
      any = true;
      h += '<optgroup label="' + esc(sec.section) + '">';
      hidden.forEach(function (id) {
        h += '<option value="' + esc(id) + '">' + esc(items[id].label) + '</option>';
      });
      h += '</optgroup>';
    });
    return { html: h, any: any };
  }

  function buildLayout() {
    $('history').innerHTML = order.map(itemBlockHtml).join('');
    var add = addSelectHtml();
    var sel = $('add-question');
    sel.innerHTML = add.html;
    sel.disabled = !add.any;
    sel.value = '';
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

  function currentHpi() {
    return Core.composeText(complaint.hpi, state, items);
  }

  function renderOutput() {
    var empty = Core.isEmpty(state);
    $('out-hpi').textContent = empty ? '' : currentHpi();
    $('out-hpi').classList.toggle('placeholder', empty);
  }

  function refresh() {
    updateChips();
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

  function onCopy() {
    var status = $('copy-status');
    if (Core.isEmpty(state)) {
      status.textContent = 'Nothing to copy';
      return;
    }
    copyText(currentHpi()).then(function (ok) {
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
  // The question layout is kept.
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
    $('col-history').scrollTop = 0;
    refresh();
  }

  function relayout() {
    buildLayout();
    refresh();
  }

  function moveQuestion(id, delta) {
    var i = order.indexOf(id);
    var j = i + delta;
    if (i < 0 || j < 0 || j >= order.length) return;
    order[i] = order[j];
    order[j] = id;
    relayout();
    var btn = document.querySelector('[data-item-block="' + id + '"] [data-move="' + delta + '"]');
    if (btn && !btn.disabled) btn.focus();
  }

  // Hiding also clears the answer, so nothing invisible ends up in the HPI.
  function hideQuestion(id) {
    var i = order.indexOf(id);
    if (i < 0) return;
    order.splice(i, 1);
    delete state[id];
    relayout();
  }

  function addQuestion(id) {
    if (!id || !items[id] || order.indexOf(id) >= 0) return;
    order.push(id);
    relayout();
    var block = document.querySelector('[data-item-block="' + id + '"]');
    if (block && block.scrollIntoView) block.scrollIntoView({ block: 'nearest' });
  }

  function resetLayout() {
    order = complaint.quick.show.slice();
    Object.keys(state).forEach(function (id) {
      if (order.indexOf(id) < 0) delete state[id];
    });
    relayout();
  }

  function setComplaint(id) {
    complaint = DATA.complaints.filter(function (c) { return c.id === id; })[0] || DATA.complaints[0];
    state = {};
    order = complaint.quick.show.slice();
    relayout();
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
    } else if (t.hasAttribute('data-move')) {
      moveQuestion(t.getAttribute('data-id'), Number(t.getAttribute('data-move')));
    } else if (t.hasAttribute('data-hide')) {
      hideQuestion(t.getAttribute('data-hide'));
    } else if (t.id === 'btn-reset-layout') {
      resetLayout();
    } else if (t.hasAttribute('data-copy')) {
      onCopy();
    } else if (t.id === 'btn-new') {
      onNewPatient();
    }
  }

  function init() {
    buildComplaintSelect();
    order = complaint.quick.show.slice();
    buildLayout();
    document.addEventListener('click', onClick);
    var ask = $('toggle-ask');
    ask.checked = false;
    ask.addEventListener('change', function () {
      document.body.classList.toggle('show-ask', this.checked);
    });
    var edit = $('toggle-edit');
    edit.checked = false;
    edit.addEventListener('change', function () {
      document.body.classList.toggle('editing', this.checked);
    });
    $('add-question').addEventListener('change', function () { addQuestion(this.value); });
    $('complaint-select').addEventListener('change', function () { setComplaint(this.value); });
    refresh();
  }

  init();
})();
