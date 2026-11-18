/*
 * POMD quick history page (dist/POMD-history.html): history questions only.
 * Clinical content comes from window.POMD_DATA; selection logic lives in core.js (window.POMDCore).
 * The current patient's selections are shared live with the full page (dist/POMD.html) through
 * localStorage (Core.STATE_KEY); "Submit" opens or switches to the full page.
 * The question layout (order / hidden) is saved per complaint in localStorage (Core.LAYOUT_KEY);
 * the default comes from the complaint's `quick.show`.
 */
(function () {
  'use strict';

  var Core = window.POMDCore;
  var DATA = Core.prepare(window.POMD_DATA);
  var items = DATA.items;

  var MAIN_FILE = 'POMD.html';
  var MAIN_WINDOW = 'pomd-main';

  var complaint = DATA.complaints[0];
  var order = [];   // visible question ids, in display order
  var state = {};
  var clearArmTimer = null;
  var dragId = null;

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function findComplaint(id) {
    return DATA.complaints.filter(function (c) { return c.id === id; })[0];
  }

  // ---------- storage ----------

  // Storage may be unavailable (e.g. blocked, or Firefox isolating file:// pages); the page still works alone.
  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function storageSet(key, value) {
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    } catch (e) { /* ignore */ }
  }

  function saveState() {
    // Nothing stored while only the defaults are selected (a missing entry means "new patient").
    storageSet(Core.STATE_KEY, pristine() ? null : Core.serializeState(complaint.id, state));
  }

  function pristine() {
    return Core.isPristine(state, complaint, items);
  }

  function savedLayouts() {
    try {
      var all = JSON.parse(storageGet(Core.LAYOUT_KEY) || '{}');
      return all && typeof all === 'object' ? all : {};
    } catch (e) { return {}; }
  }

  function loadOrder() {
    var saved = Core.sanitizeOrder(savedLayouts()[complaint.id], complaint);
    return saved || complaint.quick.show.slice();
  }

  function saveOrder() {
    var all = savedLayouts();
    all[complaint.id] = order;
    storageSet(Core.LAYOUT_KEY, JSON.stringify(all));
  }

  function resetLayout() {
    var all = savedLayouts();
    delete all[complaint.id];
    storageSet(Core.LAYOUT_KEY, Object.keys(all).length ? JSON.stringify(all) : null);
    order = complaint.quick.show.slice();
    relayout();
  }

  // Loads the stored patient (switching complaint if needed); nothing stored or unknown complaint
  // -> the current complaint's defaults (e.g. PE findings the full page starts with).
  function loadState(json) {
    var s = Core.parseStoredState(json, items);
    var c = s && findComplaint(s.complaint);
    if (c && c !== complaint) {
      complaint = c;
      $('complaint-select').value = c.id;
      order = loadOrder();
      buildLayout();
    }
    state = c ? s.state : Core.defaultState(complaint, items);
  }

  // ---------- layout ----------

  // Collapsible sub-items of a question (closed by default; see refresh for auto-open).
  // They move with their question and cannot be reordered or hidden on their own.
  function detailsHtml(itemId) {
    var det = Core.itemDetails(complaint, itemId);
    if (!det) return '';
    var h = '<details class="details" data-details="' + esc(itemId) + '"><summary><span class="details-label">' +
      esc(det.label) + '</span><span class="details-summary"></span></summary>';
    if (det.note) h += '<p class="details-note">' + esc(det.note) + '</p>';
    det.items.forEach(function (id) { h += itemBlockHtml(id, -1); });
    return h + '</details>';
  }

  // idx < 0: a sub-item inside a details block (no layout controls).
  function itemBlockHtml(itemId, idx) {
    var sub = idx < 0;
    var item = items[itemId];
    var kind = item.type === 'multi' ? 'multi' : (item.type === 'presence' ? '+ / −' : '');
    var h = '<div class="item" data-item-block="' + esc(item.id) + '">';
    h += '<div class="item-head">';
    if (!sub) h += '<span class="drag-handle" draggable="true" data-drag="' + esc(item.id) + '" title="Drag to move">⠿</span>';
    h += '<span class="item-label">' + esc(Core.itemLabel(complaint, item)) + '</span>';
    if (kind) h += '<span class="item-kind">' + kind + '</span>';
    h += '<button type="button" class="item-clear" data-clear="' + esc(item.id) + '" title="Clear this item">clear</button>';
    if (!sub) h += '<span class="item-edit">' +
      '<button type="button" class="btn small" data-move="-1" data-id="' + esc(item.id) + '" title="Move up"' +
      (idx === 0 ? ' disabled' : '') + '>↑</button>' +
      '<button type="button" class="btn small" data-move="1" data-id="' + esc(item.id) + '" title="Move down"' +
      (idx === order.length - 1 ? ' disabled' : '') + '>↓</button>' +
      '<button type="button" class="btn small" data-hide="' + esc(item.id) + '" title="Hide this question">Hide</button>' +
      '</span>';
    h += '</div>';
    var ask = Core.itemAsk(complaint, item);
    if (ask.length) {
      h += '<ul class="ask">';
      ask.forEach(function (q) { h += '<li>' + esc(q) + '</li>'; });
      h += '</ul>';
    }
    h += '<div class="chips ' + item.type + '">';
    Core.itemOptions(complaint, item).forEach(function (o) {
      h += '<button type="button" class="chip' + (o.red_flag ? ' rf' : '') + '" data-item="' + esc(item.id) +
        '" data-opt="' + esc(o.id) + '"' + (o.red_flag ? ' title="Red flag"' : '') + '>' + esc(o.label) + '</button>';
    });
    h += '</div>' + (sub ? '' : detailsHtml(itemId)) + '</div>';
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
        h += '<option value="' + esc(id) + '">' + esc(Core.itemLabel(complaint, items[id])) + '</option>';
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

  function refresh() {
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
    var dets = document.querySelectorAll('[data-details]');
    for (var k = 0; k < dets.length; k++) {
      var det = Core.itemDetails(complaint, dets[k].getAttribute('data-details'));
      var sum = det ? Core.detailsSummary(det, state, items) : '';
      dets[k].querySelector('.details-summary').textContent = sum;
      // Open when something inside gets selected (on load, or synced from the other page).
      if (sum && !dets[k].getAttribute('data-had')) dets[k].open = true;
      dets[k].setAttribute('data-had', sum ? '1' : '');
    }
  }

  function relayout() {
    buildLayout();
    refresh();
  }

  // ---------- actions ----------

  // Opens the full page, or switches to it if this page opened it before (it reads the shared state).
  function onSubmit() {
    saveState();
    var w = null;
    try { w = window.open('', MAIN_WINDOW); } catch (e) { w = null; }
    var blank = true;
    try { blank = !w || w.location.href === 'about:blank'; } catch (e) { blank = true; }
    if (!w) {
      window.location.href = MAIN_FILE;
    } else if (blank) {
      w.location.href = new URL(MAIN_FILE, window.location.href).href;
    }
    if (w) w.focus();
  }

  function disarmClear() {
    var btn = $('btn-new');
    btn.classList.remove('armed');
    btn.textContent = 'New patient';
    clearTimeout(clearArmTimer);
    clearArmTimer = null;
  }

  // First click arms the button (only if something is selected); second click within 3 s clears
  // the patient on both pages. The question layout is kept.
  function onNewPatient() {
    var btn = $('btn-new');
    if (!pristine() && !clearArmTimer) {
      btn.classList.add('armed');
      btn.textContent = 'Click again to clear';
      clearArmTimer = setTimeout(disarmClear, 3000);
      return;
    }
    disarmClear();
    state = Core.defaultState(complaint, items);
    saveState();
    $('col-history').scrollTop = 0;
    refresh();
  }

  function setOrder(next) {
    order = next;
    saveOrder();
    relayout();
  }

  function moveQuestion(id, delta) {
    var i = order.indexOf(id);
    var j = i + delta;
    if (i < 0 || j < 0 || j >= order.length) return;
    var next = order.slice();
    next[i] = next[j];
    next[j] = id;
    setOrder(next);
    var btn = document.querySelector('[data-item-block="' + id + '"] [data-move="' + delta + '"]');
    if (btn && !btn.disabled) btn.focus();
  }

  // Hiding is layout only: the answer stays (the full page still shows it).
  function hideQuestion(id) {
    if (order.indexOf(id) < 0) return;
    setOrder(order.filter(function (x) { return x !== id; }));
  }

  function addQuestion(id) {
    if (!id || !items[id] || order.indexOf(id) >= 0) return;
    setOrder(order.concat([id]));
    var block = document.querySelector('[data-item-block="' + id + '"]');
    if (block && block.scrollIntoView) block.scrollIntoView({ block: 'nearest' });
  }

  function setComplaint(id) {
    complaint = findComplaint(id) || DATA.complaints[0];
    state = Core.defaultState(complaint, items);
    saveState();
    order = loadOrder();
    relayout();
  }

  function onClick(ev) {
    var t = ev.target.closest('button');
    if (!t) return;
    if (t.hasAttribute('data-opt')) {
      Core.toggle(state, items[t.getAttribute('data-item')], t.getAttribute('data-opt'));
      saveState();
      refresh();
    } else if (t.hasAttribute('data-clear')) {
      delete state[t.getAttribute('data-clear')];
      saveState();
      refresh();
    } else if (t.hasAttribute('data-move')) {
      moveQuestion(t.getAttribute('data-id'), Number(t.getAttribute('data-move')));
    } else if (t.hasAttribute('data-hide')) {
      hideQuestion(t.getAttribute('data-hide'));
    } else if (t.id === 'btn-reset-layout') {
      resetLayout();
    } else if (t.id === 'btn-submit') {
      onSubmit();
    } else if (t.id === 'btn-new') {
      onNewPatient();
    }
  }

  // ---------- drag to reorder (Edit layout) ----------

  function clearDropMarks() {
    var marked = document.querySelectorAll('.drop-before, .drop-after, .dragging');
    for (var i = 0; i < marked.length; i++) marked[i].classList.remove('drop-before', 'drop-after', 'dragging');
  }

  // The block under the pointer and whether to drop before or after it.
  function dropTarget(ev) {
    var block = ev.target.closest && ev.target.closest('[data-item-block]');
    if (!block) return null;
    var r = block.getBoundingClientRect();
    return { block: block, id: block.getAttribute('data-item-block'), after: ev.clientY > r.top + r.height / 2 };
  }

  function initDrag() {
    var list = $('history');
    list.addEventListener('dragstart', function (ev) {
      var h = ev.target.closest && ev.target.closest('[data-drag]');
      if (!h || !document.body.classList.contains('editing')) { ev.preventDefault(); return; }
      dragId = h.getAttribute('data-drag');
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', dragId);
      var block = h.closest('[data-item-block]');
      if (ev.dataTransfer.setDragImage) ev.dataTransfer.setDragImage(block, 12, 12);
      block.classList.add('dragging');
    });
    list.addEventListener('dragover', function (ev) {
      if (!dragId) return;
      var t = dropTarget(ev);
      if (!t) return;
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';
      var marked = document.querySelectorAll('.drop-before, .drop-after');
      for (var i = 0; i < marked.length; i++) marked[i].classList.remove('drop-before', 'drop-after');
      if (t.id !== dragId) t.block.classList.add(t.after ? 'drop-after' : 'drop-before');
    });
    list.addEventListener('drop', function (ev) {
      if (!dragId) return;
      ev.preventDefault();
      var t = dropTarget(ev);
      var id = dragId;
      dragId = null;
      clearDropMarks();
      if (!t || t.id === id) return;
      var next = order.filter(function (x) { return x !== id; });
      var k = next.indexOf(t.id);
      next.splice(t.after ? k + 1 : k, 0, id);
      setOrder(next);
    });
    list.addEventListener('dragend', function () {
      dragId = null;
      clearDropMarks();
    });
  }

  function init() {
    // The full page's "Quick history" button targets this window by name.
    window.name = 'pomd-quick';
    buildComplaintSelect();
    order = loadOrder();
    buildLayout();
    loadState(storageGet(Core.STATE_KEY));
    window.addEventListener('storage', function (ev) {
      if (ev.key === Core.STATE_KEY || ev.key === null) {
        loadState(ev.key === null ? null : ev.newValue);
        disarmClear();
        refresh();
      } else if (ev.key === Core.LAYOUT_KEY) {
        order = loadOrder();
        relayout();
      }
    });
    document.addEventListener('click', onClick);
    initDrag();
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
