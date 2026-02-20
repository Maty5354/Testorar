/* ============================================================
   APP.JS — Entry Point & Router
   Initializes all modules, handles view routing,
   renders Dashboard, Customization, and Settings views.
   ============================================================ */

window.App = window.App || {};

/* ============================================================
   ROUTER — navigate between views
   ============================================================ */
App.navigate = function(viewId) {
  // Hide all panels
  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));

  // Show target panel
  const panel = document.getElementById('view-' + viewId);
  if (panel) panel.classList.add('active');

  // Update sidebar active state
  App.Sidebar.setActive(viewId);

  // Render view content on demand
  switch (viewId) {
    case 'dashboard':     App.renderDashboard();            break;
    case 'timetable':     App.TimetableView.renderTimetable(); break;
    case 'today':         App.TimetableView.renderTodayView(); break;
    case 'manualList':    App.ManualList.render();          break;
    case 'customization': App.renderCustomization();        break;
    case 'settings':      App.renderSettings();             break;
  }

  // Scroll to top
  document.getElementById('view-container').scrollTop = 0;
};

/* ============================================================
   DASHBOARD VIEW
   ============================================================ */
App.renderDashboard = function() {
  const container = document.getElementById('view-dashboard');
  const profile   = App.State.getProfile();
  const state     = App.State.get();
  const today     = App.UI.getDayName(new Date());
  const days      = App.UI.getSortedDays(false);
  const todaySched = profile.schedule[today] || [];
  const todayClasses = todaySched.filter(Boolean).length;
  const totalSubjects = profile.subjects.length;
  const totalSlots    = profile.timeSlots.length;
  const totalLinks    = state.links.length;

  const dateStr = new Date().toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Dashboard</h1>
        <p class="view-subtitle">${dateStr}</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-secondary btn-sm" id="dash-header-btn">
          ${App.UI.icon('edit')} Edit Header
        </button>
      </div>
    </div>

    <!-- Stats row -->
    <div class="stats-grid">
      <div class="stat-card" style="--stat-accent:#2563eb;--stat-accent-light:#eff6ff">
        <div class="stat-icon">${App.UI.icon('timetable')}</div>
        <div class="stat-value">${todayClasses}</div>
        <div class="stat-label">Classes Today</div>
      </div>
      <div class="stat-card" style="--stat-accent:#7c3aed;--stat-accent-light:#f5f3ff">
        <div class="stat-icon">${App.UI.icon('book')}</div>
        <div class="stat-value">${totalSubjects}</div>
        <div class="stat-label">Subjects</div>
      </div>
      <div class="stat-card" style="--stat-accent:#059669;--stat-accent-light:#ecfdf5">
        <div class="stat-icon">${App.UI.icon('today')}</div>
        <div class="stat-value">${totalSlots}</div>
        <div class="stat-label">Periods/Day</div>
      </div>
      <div class="stat-card" style="--stat-accent:#d97706;--stat-accent-light:#fffbeb">
        <div class="stat-icon">${App.UI.icon('link')}</div>
        <div class="stat-value">${totalLinks}</div>
        <div class="stat-label">Saved Links</div>
      </div>
    </div>

    <!-- Dashboard grid -->
    <div class="dashboard-grid">
      <!-- Today's classes -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Today — ${escHtml(App.UI.cap(today))}</div>
            <div class="card-subtitle">${profile.name}</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('today')">View All</button>
        </div>
        <div class="card-body">
          ${_renderDashboardTodayList(profile, today)}
        </div>
      </div>

      <!-- Side: next class + subjects -->
      <div>
        ${_renderDashboardNextClass(profile, today)}
        <div class="card mt-4">
          <div class="card-header">
            <div class="card-title">Subjects</div>
            <button class="btn btn-secondary btn-sm" onclick="App.TimetableView.openSubjectsModal()">Manage</button>
          </div>
          <div class="card-body" style="padding:var(--sp-3) var(--sp-4)">
            ${profile.subjects.length === 0
              ? `<p style="color:var(--text-muted);font-size:var(--text-sm);text-align:center;padding:var(--sp-4) 0">No subjects configured</p>`
              : profile.subjects.map(s => `
                <div style="display:flex;align-items:center;gap:var(--sp-2);padding:var(--sp-2) 0;border-bottom:1px solid var(--border-light)">
                  <span style="width:10px;height:10px;border-radius:50%;background:${s.color};flex-shrink:0"></span>
                  <span style="font-size:var(--text-sm);font-weight:600;color:var(--text)">${escHtml(s.name)}</span>
                  <span style="font-size:var(--text-xs);color:var(--text-muted);margin-left:auto">${escHtml(s.room||'')}</span>
                </div>
              `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('dash-header-btn')?.addEventListener('click', () => {
    App.Header.openCustomizeModal();
  });
};

function _renderDashboardTodayList(profile, today) {
  const slots = profile.timeSlots;
  const sched = profile.schedule[today] || [];
  if (slots.length === 0) {
    return `<div class="empty-state" style="padding:var(--sp-8) 0">
      ${App.UI.icon('today')}
      <p class="empty-state-desc">No time slots configured yet.</p>
    </div>`;
  }
  return slots.map((slot, i) => {
    const subjId = sched[i] || null;
    const subj   = subjId ? App.State.getSubject(subjId) : null;
    const active = App.UI.isSlotActive(slot);
    return `
      <div class="today-class-item ${active ? 'style="background:var(--primary-light);margin:-2px;padding:10px;border-radius:var(--radius)"' : ''}">
        <span class="today-class-dot" style="background:${subj ? subj.color : 'var(--border)'}"></span>
        <div class="today-class-info">
          <div class="today-class-name">${subj ? escHtml(subj.name) : '<span style="color:var(--text-muted)">Free Period</span>'}</div>
          ${subj ? `<div class="today-class-meta">${[subj.teacher, subj.room].filter(Boolean).join(' · ')}</div>` : ''}
        </div>
        <div class="today-class-time">${App.UI.formatTime(slot.start)}</div>
      </div>
    `;
  }).join('');
}

function _renderDashboardNextClass(profile, today) {
  const slots = profile.timeSlots;
  const sched = profile.schedule[today] || [];
  const now   = App.UI.currentTimeStr();

  let nextSlot = null, nextSubj = null;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].start > now) {
      const subjId = sched[i];
      if (subjId) { nextSlot = slots[i]; nextSubj = App.State.getSubject(subjId); break; }
    }
  }

  if (!nextSlot) {
    return `<div class="card" style="padding:var(--sp-4)">
      <div style="font-size:var(--text-sm);color:var(--text-muted);text-align:center">No more classes today</div>
    </div>`;
  }

  return `
    <div class="next-class-card">
      <div class="next-class-label">Up Next</div>
      <div class="next-class-name">${escHtml(nextSubj.name)}</div>
      <div class="next-class-time">
        ${App.UI.formatTime(nextSlot.start)} – ${App.UI.formatTime(nextSlot.end)}
        ${nextSubj.room ? ` · ${escHtml(nextSubj.room)}` : ''}
      </div>
    </div>
  `;
}

/* ============================================================
   CUSTOMIZATION VIEW
   ============================================================ */
App.renderCustomization = function() {
  const container = document.getElementById('view-customization');
  const custom    = App.State.get().customization;

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Appearance</h1>
        <p class="view-subtitle">Customize colors, typography, and layout</p>
      </div>
      <div class="view-actions">
        <button class="btn btn-secondary btn-sm" id="cust-reset-btn">Reset Defaults</button>
        <button class="btn btn-primary btn-sm" id="cust-save-btn">Apply Changes</button>
      </div>
    </div>

    <div class="custom-grid">

      <!-- Colors -->
      <div class="custom-section">
        <div class="custom-section-header">
          <div class="custom-section-title">Colors</div>
        </div>
        <div class="custom-section-body">
          <div class="color-grid">
            ${_colorField('cust-primary-color', 'Primary / Accent', custom.primaryColor || '#2563eb')}
            ${_colorField('cust-bg-color',      'Background',       custom.bgColor      || '#f1f5f9')}
            ${_colorField('cust-surface-color', 'Surface / Card',   custom.surfaceColor || '#ffffff')}
            ${_colorField('cust-text-color',    'Text',             custom.textColor    || '#0f172a')}
            ${_colorField('cust-sidebar-color', 'Sidebar',          custom.sidebarBg    || '#0f172a')}
          </div>
        </div>
      </div>

      <!-- Typography -->
      <div class="custom-section">
        <div class="custom-section-header">
          <div class="custom-section-title">Typography</div>
        </div>
        <div class="custom-section-body">
          <div class="form-group">
            <label class="form-label" for="cust-font-family">Font Family</label>
            <select class="select" id="cust-font-family">
              ${[
                ["'DM Sans', system-ui, sans-serif",           'DM Sans (default)'],
                ["'Inter', system-ui, sans-serif",             'Inter'],
                ["'Roboto', system-ui, sans-serif",            'Roboto'],
                ["system-ui, -apple-system, sans-serif",       'System Default'],
                ["Georgia, 'Times New Roman', serif",          'Georgia (serif)'],
                ["'JetBrains Mono', monospace",                'JetBrains Mono'],
              ].map(([val, label]) => `<option value="${val}" ${(custom.fontFamily||'').startsWith(val.split(',')[0]) ? 'selected' : ''}>${label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Font Scale</label>
            <div class="range-row">
              <input type="range" class="range-input" id="cust-font-scale"
                     min="0.85" max="1.25" step="0.05" value="${custom.fontScale || 1}">
              <span class="range-value" id="cust-font-scale-val">${parseFloat(custom.fontScale || 1).toFixed(2)}x</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Letter Spacing</label>
            <div class="range-row">
              <input type="range" class="range-input" id="cust-letter-spacing"
                     min="-0.03" max="0.1" step="0.01" value="${custom.letterSpacing || 0}">
              <span class="range-value" id="cust-letter-val">${parseFloat(custom.letterSpacing || 0).toFixed(2)}em</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Layout -->
      <div class="custom-section">
        <div class="custom-section-header">
          <div class="custom-section-title">Layout</div>
        </div>
        <div class="custom-section-body">
          <div class="form-group">
            <label class="form-label">Border Radius</label>
            <div class="range-row">
              <input type="range" class="range-input" id="cust-border-radius"
                     min="0" max="20" step="1" value="${custom.borderRadius || 8}">
              <span class="range-value" id="cust-radius-val">${custom.borderRadius || 8}px</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="cust-shadow">Shadow Intensity</label>
            <select class="select" id="cust-shadow">
              <option value="none"   ${custom.shadowIntensity === 'none'   ? 'selected':''}>None</option>
              <option value="low"    ${custom.shadowIntensity === 'low'    ? 'selected':''}>Low</option>
              <option value="medium" ${custom.shadowIntensity === 'medium' ? 'selected':''}>Medium</option>
              <option value="high"   ${custom.shadowIntensity === 'high'   ? 'selected':''}>High</option>
            </select>
          </div>
          <div class="toggle-row">
            <div class="toggle-info">
              <div class="toggle-label">Compact Mode</div>
              <div class="toggle-desc">Reduce padding and spacing</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="cust-compact" ${custom.compactMode ? 'checked':''}>
              <span class="toggle-track"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Behavior -->
      <div class="custom-section">
        <div class="custom-section-header">
          <div class="custom-section-title">Behavior</div>
        </div>
        <div class="custom-section-body">
          <div class="form-group">
            <label class="form-label" for="cust-time-format">Time Format</label>
            <select class="select" id="cust-time-format">
              <option value="24h" ${custom.timeFormat === '24h' ? 'selected':''}>24-hour (14:00)</option>
              <option value="12h" ${custom.timeFormat === '12h' ? 'selected':''}>12-hour (2:00 PM)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="cust-start-day">First Day of Week</label>
            <select class="select" id="cust-start-day">
              ${['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => `
                <option value="${d}" ${custom.startDay === d ? 'selected':''}>${App.UI.cap(d)}</option>
              `).join('')}
            </select>
          </div>
          <div class="toggle-row">
            <div class="toggle-info">
              <div class="toggle-label">Show Weekends</div>
              <div class="toggle-desc">Include Sat & Sun in the timetable</div>
            </div>
            <label class="toggle">
              <input type="checkbox" id="cust-weekends" ${custom.showWeekends ? 'checked':''}>
              <span class="toggle-track"></span>
            </label>
          </div>
        </div>
      </div>

    </div>
  `;

  _bindCustomizationEvents();
};

function _colorField(id, label, value) {
  return `
    <div class="color-field">
      <label>${label}</label>
      <div class="color-preview-input">
        <div class="color-preview-swatch">
          <input type="color" id="${id}" value="${value}">
        </div>
        <input type="text" class="input" id="${id}-text" value="${value}" maxlength="7">
      </div>
    </div>
  `;
}

function _bindCustomizationEvents() {
  // Color pickers sync
  ['cust-primary-color','cust-bg-color','cust-surface-color','cust-text-color','cust-sidebar-color'].forEach(id => {
    App.UI.bindColorPicker(id, id + '-text');
    // Live preview on color change
    document.getElementById(id)?.addEventListener('input', _livePreview);
    document.getElementById(id + '-text')?.addEventListener('input', _livePreview);
  });

  // Range slider live labels
  const ranges = [
    ['cust-font-scale',    'cust-font-scale-val', v => parseFloat(v).toFixed(2) + 'x'],
    ['cust-letter-spacing','cust-letter-val',      v => parseFloat(v).toFixed(2) + 'em'],
    ['cust-border-radius', 'cust-radius-val',      v => v + 'px'],
  ];

  ranges.forEach(([inputId, labelId, fmt]) => {
    const input = document.getElementById(inputId);
    const label = document.getElementById(labelId);
    if (input && label) {
      input.addEventListener('input', () => {
        label.textContent = fmt(input.value);
        _livePreview();
      });
    }
  });

  // Other controls
  ['cust-shadow','cust-time-format','cust-start-day','cust-font-family','cust-compact','cust-weekends']
    .forEach(id => document.getElementById(id)?.addEventListener('change', _livePreview));

  // Save button
  document.getElementById('cust-save-btn')?.addEventListener('click', () => {
    const values = App.Customization.readFormValues();
    App.State.updateCustomization(values);
    App.Customization.apply(values);
    App.UI.toast('Appearance saved', 'success');
  });

  // Reset button
  document.getElementById('cust-reset-btn')?.addEventListener('click', () => {
    App.UI.confirm('Reset all appearance settings to their defaults?', 'Reset Appearance').then(ok => {
      if (!ok) return;
      const defaults = {
        primaryColor: '#2563eb', bgColor: '#f1f5f9', surfaceColor: '#ffffff',
        textColor: '#0f172a', sidebarBg: '#0f172a',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontScale: '1', letterSpacing: '0', borderRadius: '8',
        shadowIntensity: 'medium', compactMode: false,
        timeFormat: '24h', startDay: 'monday', showWeekends: false,
      };
      App.State.updateCustomization(defaults);
      App.Customization.apply(defaults);
      App.renderCustomization();
      App.UI.toast('Appearance reset to defaults', 'success');
    });
  });
}

function _livePreview() {
  // Apply changes immediately for live preview (don't save yet)
  const values = App.Customization.readFormValues();
  App.Customization.apply(values);
}

/* ============================================================
   SETTINGS VIEW
   ============================================================ */
App.renderSettings = function() {
  const container = document.getElementById('view-settings');
  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Settings</h1>
        <p class="view-subtitle">Manage profiles, data, and header</p>
      </div>
    </div>
    <div class="settings-grid">
      <div class="settings-sidebar">
        ${[
          ['profiles', 'Profiles'],
          ['header',   'Header'],
          ['data',     'Data'],
          ['about',    'About'],
        ].map(([id, label]) => `
          <div class="settings-nav-item ${id === 'profiles' ? 'active' : ''}" data-settings="${id}">${label}</div>
        `).join('')}
      </div>
      <div class="settings-content">
        <div class="settings-panel active" id="sp-profiles">
          ${_renderProfilesPanel()}
        </div>
        <div class="settings-panel" id="sp-header">
          ${_renderHeaderPanel()}
        </div>
        <div class="settings-panel" id="sp-data">
          ${_renderDataPanel()}
        </div>
        <div class="settings-panel" id="sp-about">
          ${_renderAboutPanel()}
        </div>
      </div>
    </div>
  `;

  _bindSettingsEvents();
};

function _renderProfilesPanel() {
  const state    = App.State.get();
  const profiles = Object.values(state.profiles);
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Timetable Profiles</div>
        <button class="btn btn-primary btn-sm" id="settings-add-profile-btn">${App.UI.icon('plus')} New Profile</button>
      </div>
      <div class="card-body">
        <div class="profile-list">
          ${profiles.map(p => `
            <div class="profile-item ${p.id === state.currentProfile ? 'active' : ''}" data-profile="${p.id}">
              <span class="profile-item-dot"></span>
              <span class="profile-item-name">${escHtml(p.name)}</span>
              ${p.id === state.currentProfile ? '<span class="badge badge-primary">Active</span>' : ''}
              <div style="display:flex;gap:var(--sp-1);margin-left:auto">
                <button class="btn btn-ghost btn-icon btn-sm profile-rename" data-id="${p.id}" title="Rename">
                  ${App.UI.icon('edit')}
                </button>
                ${profiles.length > 1 ? `
                  <button class="btn btn-danger-ghost btn-icon btn-sm profile-delete" data-id="${p.id}" title="Delete">
                    ${App.UI.icon('trash')}
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function _renderHeaderPanel() {
  return `
    <div class="card">
      <div class="card-header"><div class="card-title">Header Settings</div></div>
      <div class="card-body">
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--sp-4)">
          Customize the app header appearance including title, subtitle, and clock display.
        </p>
        <button class="btn btn-primary" id="open-header-customizer">
          ${App.UI.icon('edit')} Customize Header
        </button>
      </div>
    </div>
  `;
}

function _renderDataPanel() {
  return `
    <div class="card">
      <div class="card-header"><div class="card-title">Data Management</div></div>
      <div class="card-body">
        <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--sp-5)">
          Export your timetable data as a JSON backup, or import a previous backup.
        </p>
        <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-5)">
          <button class="btn btn-secondary" id="export-btn">
            ${App.UI.icon('download')} Export Backup
          </button>
          <button class="btn btn-secondary" id="import-btn">
            ${App.UI.icon('upload')} Import Backup
          </button>
        </div>
        <div class="divider"></div>
        <div style="margin-top:var(--sp-4)">
          <div style="font-size:var(--text-sm);font-weight:700;color:var(--danger);margin-bottom:var(--sp-2)">Danger Zone</div>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--sp-3)">
            Factory reset will delete ALL data including profiles, subjects, and links.
          </p>
          <button class="btn btn-danger btn-sm" id="reset-all-btn">
            ${App.UI.icon('trash')} Factory Reset
          </button>
        </div>
      </div>
    </div>
  `;
}

function _renderAboutPanel() {
  return `
    <div class="card">
      <div class="card-header"><div class="card-title">About</div></div>
      <div class="card-body">
        <div style="font-size:var(--text-2xl);font-weight:800;color:var(--text);letter-spacing:-0.02em;margin-bottom:var(--sp-1)">Timetable</div>
        <div style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:var(--sp-5)">A modern, modular schedule manager</div>
        <div style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.8">
          <div><strong>Storage:</strong> Browser localStorage — no server required</div>
          <div><strong>Libraries:</strong> Day.js · SortableJS</div>
          <div><strong>Architecture:</strong> Vanilla JS modules</div>
        </div>
      </div>
    </div>
  `;
}

function _bindSettingsEvents() {
  // Settings sub-nav
  document.querySelectorAll('.settings-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
      item.classList.add('active');
      const panel = document.getElementById('sp-' + item.dataset.settings);
      if (panel) panel.classList.add('active');
    });
  });

  // Add profile
  document.getElementById('settings-add-profile-btn')?.addEventListener('click', () => {
    App.TimetableView.openAssignModal && App.navigate('timetable');
    // Actually open profile modal
    setTimeout(() => {
      const evt = new CustomEvent('openAddProfile');
      document.dispatchEvent(evt);
    }, 100);
  });

  // Profile actions (delegation)
  document.querySelector('.settings-content')?.addEventListener('click', (e) => {
    const renameBtn = e.target.closest('.profile-rename');
    const deleteBtn = e.target.closest('.profile-delete');
    const profileItem = e.target.closest('.profile-item');

    if (renameBtn) {
      const id = renameBtn.dataset.id;
      const profile = App.State.get().profiles[id];
      App.UI.openModal({
        title: 'Rename Profile',
        size: 'sm',
        body: `<div class="form-group">
          <label class="form-label" for="rename-input">Profile Name</label>
          <input class="input" id="rename-input" type="text" value="${escHtml(profile.name)}" maxlength="40">
        </div>`,
        buttons: [
          { label: 'Cancel', cls: 'btn-secondary' },
          { label: 'Rename', cls: 'btn-primary', close: false, action: () => {
            const name = document.getElementById('rename-input').value.trim();
            if (!name) return;
            profile.name = name;
            App.State.upsertProfile(profile);
            App.UI.closeModal();
            App.renderSettings();
            App.UI.toast('Profile renamed', 'success');
          }}
        ]
      });
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const profile = App.State.get().profiles[id];
      App.UI.confirm(`Delete profile "${profile.name}"? All its data will be lost.`, 'Delete Profile').then(ok => {
        if (!ok) return;
        const ok2 = App.State.deleteProfile(id);
        if (ok2) {
          App.renderSettings();
          App.UI.toast('Profile deleted', 'info');
        }
      });
    }

    if (profileItem && !renameBtn && !deleteBtn) {
      const id = profileItem.dataset.profile;
      if (id) {
        App.State.setCurrentProfile(id);
        App.renderSettings();
      }
    }
  });

  // Open header customizer
  document.getElementById('open-header-customizer')?.addEventListener('click', () => {
    App.Header.openCustomizeModal();
  });

  // Export / Import / Reset
  document.getElementById('export-btn')?.addEventListener('click', () => {
    App.UI.exportState();
    App.UI.toast('Backup exported', 'success');
  });
  document.getElementById('import-btn')?.addEventListener('click', () => {
    App.UI.importState();
  });
  document.getElementById('reset-all-btn')?.addEventListener('click', () => {
    App.UI.confirm(
      'This will permanently delete ALL timetables, subjects, links and settings. This cannot be undone.',
      'Factory Reset'
    ).then(ok => {
      if (!ok) return;
      App.State.resetToDefaults();
      location.reload();
    });
  });
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Init state
  App.State.init();
  App.Sidebar.init();

  // 2. Apply saved customization
  App.Customization.apply(App.State.get().customization);

  // 3. Render shell components
  App.Sidebar.render();
  App.Header.render();
  App.UI.initModal();

  // 4. Navigate to default view
  App.navigate('dashboard');

  // 5. Handle window resize (swap mobile/desktop timetable)
  let _resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
      const active = document.querySelector('.view-panel.active');
      if (active && active.id === 'view-timetable') {
        App.TimetableView.renderTimetable();
      }
    }, 200);
  });

  // 6. Handle "openAddProfile" custom event (from settings)
  document.addEventListener('openAddProfile', () => {
    // Trigger the TimetableView add profile modal if we're on timetable
    // For now navigate to timetable first
  });

  console.log('[App] Timetable app initialized');
});

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
