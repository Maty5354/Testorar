/* ============================================================
   UI MODULE
   Modal system, toast notifications, SVG icons, and
   general DOM utility helpers. All render-neutral.
   ============================================================ */

window.App = window.App || {};

App.UI = (() => {

  /* ============================================================
     SVG ICON LIBRARY
     Returns inline SVG strings. Stroke-based icons.
     ============================================================ */
  const ICONS = {
    dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    timetable: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/></svg>`,
    today: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
    customization: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
    chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
    link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    drag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="19" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="19" r="1" fill="currentColor" stroke="none"/></svg>`,
    externalLink: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  };

  function icon(name, cls) {
    const svg = ICONS[name] || ICONS.info;
    if (!cls) return svg;
    // Insert class onto the svg tag
    return svg.replace('<svg ', `<svg class="${cls}" `);
  }

  /* ============================================================
     MODAL SYSTEM
     ============================================================ */
  let _onConfirm = null;
  let _onCancel  = null;

  function openModal(options) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl  = document.getElementById('modal-body');
    const footEl  = document.getElementById('modal-footer');
    const modal   = overlay.querySelector('.modal');

    titleEl.textContent = options.title || '';
    bodyEl.innerHTML  = options.body  || '';
    footEl.innerHTML  = '';

    // Size modifier
    modal.className = 'modal' + (options.size ? ' modal-' + options.size : '');

    // Footer buttons
    if (options.buttons) {
      options.buttons.forEach(btn => {
        const el = document.createElement('button');
        el.className = 'btn ' + (btn.cls || 'btn-secondary');
        el.textContent = btn.label;
        el.addEventListener('click', () => {
          if (btn.action) btn.action();
          if (btn.close !== false) closeModal();
        });
        footEl.appendChild(el);
      });
    }

    if (options.onOpen) options.onOpen();

    overlay.classList.add('open');
    // Focus first input
    setTimeout(() => {
      const first = bodyEl.querySelector('input, select, textarea');
      if (first) first.focus();
    }, 50);
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    _onConfirm = null;
    _onCancel  = null;
  }

  function confirm(message, title) {
    return new Promise(resolve => {
      openModal({
        title: title || 'Confirm',
        size: 'sm',
        body: `<p style="color:var(--text-secondary);font-size:var(--text-sm);line-height:1.6">${message}</p>`,
        buttons: [
          { label: 'Cancel',  cls: 'btn-secondary', action: () => resolve(false), close: true },
          { label: 'Confirm', cls: 'btn-danger',     action: () => resolve(true),  close: true },
        ],
      });
    });
  }

  /* ============================================================
     TOAST SYSTEM
     ============================================================ */
  const TOAST_COLORS = { success: 'var(--success)', error: 'var(--danger)', warning: 'var(--warning)', info: 'var(--primary)' };
  const TOAST_ICONS  = { success: 'check', error: 'x', warning: 'info', info: 'info' };

  function toast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;

    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast';
    el.style.setProperty('--toast-color', TOAST_COLORS[type] || TOAST_COLORS.info);
    el.innerHTML = `
      <span class="toast-icon">${icon(TOAST_ICONS[type] || 'info')}</span>
      <span class="toast-msg">${message}</span>
    `;

    container.appendChild(el);

    const remove = () => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 200);
    };

    setTimeout(remove, duration);
    el.addEventListener('click', remove);
  }

  /* ============================================================
     HELPERS
     ============================================================ */

  /** Format time string "HH:MM" according to current time format pref. */
  function formatTime(timeStr) {
    const custom = App.State.get().customization;
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (custom.timeFormat === '12h') {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
    }
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  /** Get current time as "HH:MM" string. */
  function currentTimeStr() {
    const now = new Date();
    return String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  }

  /** Get day name from Date object. Returns lowercase e.g. 'monday'. */
  function getDayName(date) {
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    return days[date.getDay()];
  }

  /** Capitalize first letter. */
  function cap(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  }

  /** Get sorted day keys based on startDay setting. */
  function getSortedDays(includeWeekends) {
    const allDays = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const custom = App.State.get().customization;
    const startDay = custom.startDay || 'monday';
    const showWeekends = includeWeekends !== undefined ? includeWeekends : custom.showWeekends;

    let days = showWeekends ? allDays : allDays.filter(d => !['saturday','sunday'].includes(d));

    const startIdx = days.indexOf(startDay);
    if (startIdx > 0) {
      days = [...days.slice(startIdx), ...days.slice(0, startIdx)];
    }
    return days;
  }

  /** Check if a time slot is currently active. */
  function isSlotActive(slot) {
    const now = currentTimeStr();
    return slot.start <= now && now <= slot.end;
  }

  /** Get text contrast for a background color. */
  function textOn(bgHex) {
    if (!bgHex || bgHex.length < 6) return '#fff';
    return App.Customization.contrastColor(bgHex.replace('#','').length === 3
      ? bgHex.replace(/./g, c => c+c) : bgHex);
  }

  /* ---- DOM utility ---- */
  function el(tag, attrs, ...children) {
    const element = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'class') element.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(element.style, v);
        else if (k.startsWith('on')) element.addEventListener(k.slice(2).toLowerCase(), v);
        else element.setAttribute(k, v);
      });
    }
    children.forEach(c => {
      if (c == null) return;
      element.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return element;
  }

  /* ---- Color picker sync (text ↔ swatch) ---- */
  function bindColorPicker(colorInputId, textInputId) {
    const colorEl = document.getElementById(colorInputId);
    const textEl  = document.getElementById(textInputId);
    if (!colorEl || !textEl) return;

    colorEl.addEventListener('input', () => { textEl.value = colorEl.value; });
    textEl.addEventListener('input', () => {
      const v = textEl.value.trim();
      if (/^#[0-9a-f]{6}$/i.test(v)) colorEl.value = v;
    });
  }

  /* ---- Export state as JSON file ---- */
  function exportState() {
    const json = App.Storage.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'timetable-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---- Import state from JSON file ---- */
  function importState(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const ok = App.Storage.importJSON(ev.target.result);
        if (ok) {
          toast('Data imported successfully. Reloading...', 'success', 1500);
          setTimeout(() => location.reload(), 1600);
        } else {
          toast('Import failed: invalid file format.', 'error');
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  /* ---- Init modal close listeners ---- */
  function initModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  return {
    icon, openModal, closeModal, confirm, toast,
    formatTime, currentTimeStr, getDayName, cap,
    getSortedDays, isSlotActive, textOn,
    el, bindColorPicker, exportState, importState,
    initModal, ICONS,
  };
})();
