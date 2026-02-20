/* ============================================================
   SIDEBAR COMPONENT
   Rail-style collapsible sidebar with icon + label nav items.
   Desktop: fixed rail. Mobile: slide-out drawer.
   ============================================================ */

window.App = window.App || {};

App.Sidebar = (() => {

  const NAV_ITEMS = [
    { id: 'dashboard',      label: 'Dashboard',     icon: 'dashboard',     section: 'main' },
    { id: 'timetable',      label: 'Timetable',     icon: 'timetable',     section: 'main' },
    { id: 'today',          label: 'Today',          icon: 'today',         section: 'main' },
    { id: 'manualList',     label: 'Links',          icon: 'list',          section: 'main' },
    { id: 'customization',  label: 'Appearance',     icon: 'customization', section: 'config' },
    { id: 'settings',       label: 'Settings',       icon: 'settings',      section: 'config' },
  ];

  let _isCollapsed = false;
  let _activeId    = 'dashboard';

  function render() {
    const state   = App.State.get();
    const header  = state.header;
    const sidebar = document.getElementById('sidebar');

    sidebar.innerHTML = `
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="sidebar-logo">
          ${App.UI.icon('book')}
        </div>
        <div class="sidebar-brand-text">
          <span class="sidebar-brand-title">${escHtml(header.title || 'Timetable')}</span>
          ${header.subtitle ? `<span class="sidebar-brand-sub">${escHtml(header.subtitle)}</span>` : ''}
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav" role="navigation" aria-label="Main navigation">
        ${_renderNavSection('main', 'Main')}
        ${_renderNavSection('config', 'Configuration')}
      </nav>

      <!-- Footer: collapse toggle -->
      <div class="sidebar-footer">
        <button class="sidebar-collapse-btn" id="sidebar-collapse-btn"
                aria-label="Toggle sidebar" title="Collapse sidebar">
          <span class="collapse-icon">${App.UI.icon('chevronLeft')}</span>
          <span class="nav-label">Collapse</span>
        </button>
      </div>
    `;

    _applyCollapsed();
    _bindEvents();
  }

  function _renderNavSection(section, label) {
    const items = NAV_ITEMS.filter(i => i.section === section);
    return `
      <div class="nav-section-label">${label}</div>
      ${items.map(item => `
        <div class="nav-item ${item.id === _activeId ? 'active' : ''}"
             data-view="${item.id}"
             role="menuitem"
             tabindex="0"
             aria-current="${item.id === _activeId ? 'page' : 'false'}"
             title="${item.label}">
          <span class="nav-icon">${App.UI.icon(item.icon)}</span>
          <span class="nav-label">${item.label}</span>
        </div>
      `).join('')}
    `;
  }

  function _bindEvents() {
    const sidebar = document.getElementById('sidebar');

    // Nav item clicks
    sidebar.querySelectorAll('.nav-item').forEach(item => {
      const handler = () => {
        const viewId = item.dataset.view;
        App.navigate(viewId);
        // Close mobile drawer
        if (window.innerWidth < 1024) toggleMobile(false);
      };
      item.addEventListener('click', handler);
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
      });
    });

    // Collapse toggle (desktop)
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', toggleCollapse);
    }

    // Overlay click closes mobile drawer
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => toggleMobile(false));
    }
  }

  function setActive(viewId) {
    _activeId = viewId;
    document.querySelectorAll('.nav-item').forEach(item => {
      const isActive = item.dataset.view === viewId;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  function toggleCollapse() {
    _isCollapsed = !_isCollapsed;
    _applyCollapsed();
    // Persist preference
    try { localStorage.setItem('sidebar_collapsed', _isCollapsed ? '1' : '0'); } catch(e) {}
  }

  function _applyCollapsed() {
    const sidebar = document.getElementById('sidebar');
    const main    = document.getElementById('main');
    sidebar.classList.toggle('collapsed', _isCollapsed);
    if (main) {
      main.style.marginLeft = _isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)';
    }
  }

  function toggleMobile(open) {
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebar-overlay');
    const isOpen   = open !== undefined ? open : !sidebar.classList.contains('mobile-open');

    sidebar.classList.toggle('mobile-open', isOpen);
    if (overlay) {
      overlay.classList.toggle('visible', isOpen);
      overlay.style.pointerEvents = isOpen ? 'auto' : 'none';
    }
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function init() {
    // Restore collapse state
    try {
      const stored = localStorage.getItem('sidebar_collapsed');
      if (stored === '1') _isCollapsed = true;
    } catch(e) {}
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render, setActive, toggleCollapse, toggleMobile, init };
})();
