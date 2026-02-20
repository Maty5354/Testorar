/* ============================================================
   HEADER COMPONENT
   Renders the sticky top header: app title, clock,
   quick-action buttons. Supports editable title/subtitle.
   ============================================================ */

window.App = window.App || {};

App.Header = (() => {
  let _clockInterval = null;

  /** Build and inject the header HTML into #app-header. */
  function render() {
    const state    = App.State.get();
    const header   = state.header;
    const headerEl = document.getElementById('app-header');

    headerEl.style.textAlign   = header.textAlign || 'left';
    headerEl.style.background  = header.bgColor || 'var(--header-bg)';
    headerEl.style.height      = (header.height || 64) + 'px';
    document.documentElement.style.setProperty('--header-height', (header.height || 64) + 'px');

    headerEl.innerHTML = `
      <button class="header-mobile-menu btn-icon" id="sidebar-toggle-btn"
              aria-label="Toggle sidebar" title="Toggle sidebar">
        ${App.UI.icon('menu')}
      </button>

      <div class="header-titles" style="text-align:${header.textAlign||'left'}">
        <div class="header-title" id="header-title">${escHtml(header.title || 'Timetable')}</div>
        ${header.subtitle
          ? `<div class="header-subtitle" id="header-subtitle">${escHtml(header.subtitle)}</div>`
          : ''}
      </div>

      <div class="header-actions">
        ${header.showClock ? `<div id="header-clock" aria-live="polite"></div>` : ''}
        <button class="btn btn-primary btn-sm" id="header-add-btn">
          ${App.UI.icon('plus')}
          <span>Add Class</span>
        </button>
        <button class="btn btn-secondary btn-icon btn-sm" id="header-settings-btn"
                aria-label="Settings" title="Settings">
          ${App.UI.icon('settings')}
        </button>
      </div>
    `;

    _bindEvents();
    if (header.showClock) {
      _startClock();
    } else {
      _stopClock();
    }
  }

  function _bindEvents() {
    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        App.Sidebar.toggleMobile();
      });
    }

    // Quick add class button
    const addBtn = document.getElementById('header-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        App.TimetableView.openAssignModal();
      });
    }

    // Settings shortcut
    const settingsBtn = document.getElementById('header-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        App.navigate('settings');
      });
    }
  }

  function _startClock() {
    _stopClock();
    _updateClock();
    _clockInterval = setInterval(_updateClock, 1000);
  }

  function _stopClock() {
    if (_clockInterval) {
      clearInterval(_clockInterval);
      _clockInterval = null;
    }
  }

  function _updateClock() {
    const el = document.getElementById('header-clock');
    if (!el) { _stopClock(); return; }
    const now  = new Date();
    const fmt  = App.State.get().customization.timeFormat;
    const h    = now.getHours();
    const m    = String(now.getMinutes()).padStart(2,'0');
    const s    = String(now.getSeconds()).padStart(2,'0');

    if (fmt === '12h') {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12  = h % 12 || 12;
      el.textContent = `${h12}:${m}:${s} ${ampm}`;
    } else {
      el.textContent = `${String(h).padStart(2,'0')}:${m}:${s}`;
    }
  }

  /** Open header customization modal. */
  function openCustomizeModal() {
    const h = App.State.get().header;

    App.UI.openModal({
      title: 'Customize Header',
      body: `
        <div class="form-group">
          <label class="form-label" for="hdr-title">App Title</label>
          <input class="input" id="hdr-title" type="text" value="${escHtml(h.title||'Timetable')}" maxlength="60">
        </div>
        <div class="form-group">
          <label class="form-label" for="hdr-subtitle">Subtitle <span style="font-weight:400;color:var(--text-muted)">(optional)</span></label>
          <input class="input" id="hdr-subtitle" type="text" value="${escHtml(h.subtitle||'')}" maxlength="80">
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="hdr-align">Text Alignment</label>
            <select class="select" id="hdr-align">
              <option value="left"   ${h.textAlign==='left'   ?'selected':''}>Left</option>
              <option value="center" ${h.textAlign==='center' ?'selected':''}>Center</option>
              <option value="right"  ${h.textAlign==='right'  ?'selected':''}>Right</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="hdr-height">Height (px)</label>
            <input class="input" id="hdr-height" type="number" min="48" max="120" value="${h.height||64}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="hdr-bg">Background Color <span style="font-weight:400;color:var(--text-muted)">(leave empty for default)</span></label>
          <input class="input" id="hdr-bg" type="text" value="${escHtml(h.bgColor||'')}" placeholder="#ffffff or empty">
        </div>
        <div class="toggle-row">
          <div class="toggle-info">
            <div class="toggle-label">Show Clock</div>
            <div class="toggle-desc">Display live time in the header</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="hdr-clock" ${h.showClock?'checked':''}>
            <span class="toggle-track"></span>
          </label>
        </div>
      `,
      buttons: [
        { label: 'Cancel', cls: 'btn-secondary' },
        {
          label: 'Save', cls: 'btn-primary', close: false,
          action: () => {
            App.State.updateHeader({
              title:     document.getElementById('hdr-title').value.trim() || 'Timetable',
              subtitle:  document.getElementById('hdr-subtitle').value.trim(),
              textAlign: document.getElementById('hdr-align').value,
              height:    document.getElementById('hdr-height').value,
              bgColor:   document.getElementById('hdr-bg').value.trim(),
              showClock: document.getElementById('hdr-clock').checked,
            });
            render();
            App.UI.closeModal();
            App.UI.toast('Header updated', 'success');
          },
        },
      ],
    });
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render, openCustomizeModal };
})();
