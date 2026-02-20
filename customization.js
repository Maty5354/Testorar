/* ============================================================
   CUSTOMIZATION MODULE
   Reads customization state and writes CSS custom properties
   to :root. Any UI change goes through apply().
   ============================================================ */

window.App = window.App || {};

App.Customization = (() => {

  /** Luminance-based contrast check: returns '#fff' or '#000'. */
  function contrastColor(hex) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.55 ? '#0f172a' : '#ffffff';
  }

  /** Darken a hex color by a factor (0-1). */
  function darken(hex, factor) {
    const r = Math.max(0, Math.round(parseInt(hex.slice(1,3), 16) * (1 - factor)));
    const g = Math.max(0, Math.round(parseInt(hex.slice(3,5), 16) * (1 - factor)));
    const b = Math.max(0, Math.round(parseInt(hex.slice(5,7), 16) * (1 - factor)));
    return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
  }

  /** Lighten a hex color toward white by a factor. */
  function lighten(hex, factor) {
    const r = Math.min(255, Math.round(parseInt(hex.slice(1,3), 16) + (255 - parseInt(hex.slice(1,3), 16)) * factor));
    const g = Math.min(255, Math.round(parseInt(hex.slice(3,5), 16) + (255 - parseInt(hex.slice(3,5), 16)) * factor));
    const b = Math.min(255, Math.round(parseInt(hex.slice(5,7), 16) + (255 - parseInt(hex.slice(5,7), 16)) * factor));
    return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
  }

  /** Apply all customization settings to CSS variables. */
  function apply(custom) {
    const root = document.documentElement;
    const c = custom;

    // --- Primary color + derivatives ---
    const primary = c.primaryColor || '#2563eb';
    root.style.setProperty('--primary',       primary);
    root.style.setProperty('--primary-hover', darken(primary, 0.1));
    root.style.setProperty('--primary-light', lighten(primary, 0.92));

    // --- Surface colors ---
    root.style.setProperty('--bg',      c.bgColor      || '#f1f5f9');
    root.style.setProperty('--surface', c.surfaceColor || '#ffffff');

    // --- Text ---
    const textColor = c.textColor || '#0f172a';
    root.style.setProperty('--text', textColor);

    // --- Sidebar ---
    const sidebarBg = c.sidebarBg || '#0f172a';
    root.style.setProperty('--sidebar-bg', sidebarBg);
    // Auto sidebar text contrast
    const isDarkSidebar = (parseInt(sidebarBg.slice(1,3),16)*0.299 + parseInt(sidebarBg.slice(3,5),16)*0.587 + parseInt(sidebarBg.slice(5,7),16)*0.114) < 128;
    root.style.setProperty('--sidebar-text', isDarkSidebar ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)');
    root.style.setProperty('--sidebar-active', isDarkSidebar ? '#ffffff' : '#000000');

    // --- Typography ---
    root.style.setProperty('--font-family', c.fontFamily || "'DM Sans', system-ui, sans-serif");
    root.style.setProperty('--font-scale',  c.fontScale  || '1');
    const ls = parseFloat(c.letterSpacing || '0');
    root.style.setProperty('--letter-spacing', ls === 0 ? '0em' : ls + 'em');

    // --- Radius ---
    const radius = parseInt(c.borderRadius || '8');
    root.style.setProperty('--radius',    radius + 'px');
    root.style.setProperty('--radius-sm', Math.max(2, radius - 4) + 'px');
    root.style.setProperty('--radius-lg', (radius + 4) + 'px');
    root.style.setProperty('--radius-xl', (radius + 8) + 'px');

    // --- Shadow intensity ---
    const shadowMap = { none: '0', low: '0.5', medium: '1', high: '1.8' };
    root.style.setProperty('--shadow-mult', shadowMap[c.shadowIntensity] || '1');

    // --- Header height ---
    const headerH = App.State.get().header.height || '64';
    root.style.setProperty('--header-height', headerH + 'px');

    // --- Compact mode ---
    document.body.classList.toggle('compact-mode', !!c.compactMode);
  }

  /** Read all inputs from the customization form and return a plain object. */
  function readFormValues() {
    const get = id => {
      const el = document.getElementById(id);
      return el ? el.value : null;
    };
    const checked = id => {
      const el = document.getElementById(id);
      return el ? el.checked : false;
    };

    return {
      primaryColor:   get('cust-primary-color'),
      bgColor:        get('cust-bg-color'),
      surfaceColor:   get('cust-surface-color'),
      textColor:      get('cust-text-color'),
      sidebarBg:      get('cust-sidebar-color'),
      fontFamily:     get('cust-font-family'),
      fontScale:      get('cust-font-scale'),
      letterSpacing:  get('cust-letter-spacing'),
      borderRadius:   get('cust-border-radius'),
      shadowIntensity:get('cust-shadow'),
      compactMode:    checked('cust-compact'),
      timeFormat:     get('cust-time-format'),
      startDay:       get('cust-start-day'),
      showWeekends:   checked('cust-weekends'),
    };
  }

  /** Populate the customization form from state. */
  function populateForm(custom) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    const setCheck = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.checked = val;
    };

    set('cust-primary-color', custom.primaryColor || '#2563eb');
    set('cust-bg-color',      custom.bgColor      || '#f1f5f9');
    set('cust-surface-color', custom.surfaceColor  || '#ffffff');
    set('cust-text-color',    custom.textColor     || '#0f172a');
    set('cust-sidebar-color', custom.sidebarBg     || '#0f172a');
    set('cust-font-family',   custom.fontFamily    || "'DM Sans', system-ui, sans-serif");
    set('cust-font-scale',    custom.fontScale     || '1');
    set('cust-letter-spacing',custom.letterSpacing || '0');
    set('cust-border-radius', custom.borderRadius  || '8');
    set('cust-shadow',        custom.shadowIntensity || 'medium');
    setCheck('cust-compact',  !!custom.compactMode);
    set('cust-time-format',   custom.timeFormat    || '24h');
    set('cust-start-day',     custom.startDay      || 'monday');
    setCheck('cust-weekends', !!custom.showWeekends);
  }

  return { apply, readFormValues, populateForm, contrastColor, darken, lighten };
})();
