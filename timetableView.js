/* ============================================================
   TIMETABLE VIEW COMPONENT
   Weekly grid, mobile day swiper, subject/slot management,
   assignment modal. Drag-and-drop via SortableJS.
   ============================================================ */

window.App = window.App || {};

App.TimetableView = (() => {
  let _sortables = [];

  // ============================================================
  // MAIN TIMETABLE RENDER
  // ============================================================
  function renderTimetable() {
    const container = document.getElementById('view-timetable');
    const profile   = App.State.getProfile();
    const custom    = App.State.get().customization;
    const days      = App.UI.getSortedDays();
    const isMobile  = window.innerWidth < 768;

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Timetable</h1>
          <p class="view-subtitle">${escHtml(profile.name)}</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="manage-subjects-btn">
            ${App.UI.icon('book')} Subjects
          </button>
          <button class="btn btn-secondary btn-sm" id="manage-slots-btn">
            ${App.UI.icon('today')} Time Slots
          </button>
          <button class="btn btn-primary btn-sm" id="add-class-btn">
            ${App.UI.icon('plus')} Assign Class
          </button>
        </div>
      </div>
      ${_renderProfileBar()}
      <div class="timetable-wrapper" id="timetable-wrapper">
        ${isMobile ? _renderDaySwiper(days, profile) : _renderGrid(days, profile)}
      </div>
    `;

    _bindTimetableEvents();
    if (!isMobile) _setupDragDrop();
  }

  function _renderProfileBar() {
    const state = App.State.get();
    const profiles = Object.values(state.profiles);
    return `
      <div class="profile-selector-bar">
        ${profiles.map(p => `
          <button class="profile-tab ${p.id === state.currentProfile ? 'active' : ''}"
                  data-profile="${p.id}">${escHtml(p.name)}</button>
        `).join('')}
        <button class="btn btn-ghost btn-sm" id="add-profile-btn">
          ${App.UI.icon('plus')} New Profile
        </button>
      </div>
    `;
  }

  function _renderGrid(days, profile) {
    const slots   = profile.timeSlots;
    const colCount = days.length + 1; // +1 for time column
    const today   = App.UI.getDayName(new Date());

    return `
      <div class="timetable-grid">
        <div class="timetable-grid-inner"
             style="grid-template-columns: 100px repeat(${days.length}, 1fr)">
          <!-- Header row -->
          <div class="timetable-day-header"></div>
          ${days.map(day => `
            <div class="timetable-day-header ${day === today ? 'today' : ''}">
              <div>${App.UI.cap(day)}</div>
              ${day === today ? '<div style="font-size:10px;font-weight:400;opacity:0.7;margin-top:1px">Today</div>' : ''}
            </div>
          `).join('')}

          <!-- Data rows -->
          ${slots.map((slot, si) => `
            <!-- Time cell -->
            <div class="timetable-time-cell">
              <div class="timetable-time-label">${App.UI.formatTime(slot.start)}</div>
              <div class="timetable-time-sublabel">${escHtml(slot.label)}</div>
            </div>
            <!-- Day cells -->
            ${days.map(day => {
              const sched   = profile.schedule[day] || [];
              const subjId  = sched[si] || null;
              const subj    = subjId ? App.State.getSubject(subjId) : null;
              return `
                <div class="timetable-cell ${day === today ? 'today-col' : ''}"
                     data-day="${day}" data-slot="${si}">
                  ${subj ? _renderSubjectCard(subj, day, si) : `
                    <button class="cell-add-btn"
                            data-day="${day}" data-slot="${si}"
                            aria-label="Add class to ${day} ${slot.label}">
                      ${App.UI.icon('plus')}
                    </button>
                  `}
                </div>
              `;
            }).join('')}
          `).join('')}
        </div>
      </div>
    `;
  }

  function _renderSubjectCard(subj, day, slotIndex) {
    const textColor = App.UI.textOn(subj.color);
    return `
      <div class="subject-card"
           style="background:${subj.color};color:${textColor}"
           data-subject="${subj.id}" data-day="${day}" data-slot="${slotIndex}">
        <div class="subject-card-name">${escHtml(subj.name)}</div>
        <div class="subject-card-meta">
          ${subj.teacher ? `<span>${escHtml(subj.teacher)}</span>` : ''}
          ${subj.room    ? `<span>${escHtml(subj.room)}</span>`    : ''}
        </div>
        <div class="subject-card-actions">
          <button class="subject-card-action" data-action="edit"
                  data-day="${day}" data-slot="${slotIndex}" title="Change">
            ${App.UI.icon('edit')}
          </button>
          <button class="subject-card-action" data-action="remove"
                  data-day="${day}" data-slot="${slotIndex}" title="Remove">
            ${App.UI.icon('x')}
          </button>
        </div>
      </div>
    `;
  }

  function _renderDaySwiper(days, profile) {
    const today   = App.UI.getDayName(new Date());
    const dayIdx  = days.indexOf(today);
    const startDay = dayIdx >= 0 ? dayIdx : 0;

    return `
      <div class="day-swiper-header">
        <button class="btn btn-secondary btn-icon btn-sm" id="day-prev">
          ${App.UI.icon('chevronLeft')}
        </button>
        <span class="day-swiper-title" id="day-swiper-label"></span>
        <button class="btn btn-secondary btn-icon btn-sm" id="day-next">
          ${App.UI.icon('chevronRight')}
        </button>
      </div>
      <div id="day-swiper-content"></div>
    `;
  }

  function _renderDayContent(day, profile) {
    const slots = profile.timeSlots;
    const sched = profile.schedule[day] || [];

    if (slots.length === 0) {
      return `<div class="empty-state"><p class="empty-state-desc">No time slots configured.</p></div>`;
    }

    return slots.map((slot, si) => {
      const subjId = sched[si] || null;
      const subj   = subjId ? App.State.getSubject(subjId) : null;
      const active = App.UI.isSlotActive(slot);
      return `
        <div class="day-slot-mobile ${active ? 'active' : ''}">
          <div class="day-slot-mobile-header">${App.UI.formatTime(slot.start)} – ${App.UI.formatTime(slot.end)} · ${escHtml(slot.label)}</div>
          <div class="day-slot-mobile-body">
            ${subj ? `
              <div class="day-slot-subject-bar" style="background:${subj.color}"></div>
              <div class="day-slot-info">
                <div class="day-slot-name">${escHtml(subj.name)}</div>
                <div class="day-slot-meta">${[subj.teacher, subj.room].filter(Boolean).join(' · ')}</div>
              </div>
              <button class="btn btn-ghost btn-icon btn-sm" data-action="edit" data-day="${day}" data-slot="${si}" title="Change">
                ${App.UI.icon('edit')}
              </button>
            ` : `
              <div class="day-slot-info" style="color:var(--text-muted)">Free period</div>
              <button class="btn btn-ghost btn-icon btn-sm" data-action="edit" data-day="${day}" data-slot="${si}" title="Assign">
                ${App.UI.icon('plus')}
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  function _bindTimetableEvents() {
    const profile = App.State.getProfile();
    const days    = App.UI.getSortedDays();

    // Profile tab switching
    document.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        App.State.setCurrentProfile(tab.dataset.profile);
        renderTimetable();
      });
    });

    // Add profile
    const addProfileBtn = document.getElementById('add-profile-btn');
    if (addProfileBtn) addProfileBtn.addEventListener('click', openAddProfileModal);

    // Manage subjects / slots buttons
    const manSubjBtn = document.getElementById('manage-subjects-btn');
    const manSlotBtn = document.getElementById('manage-slots-btn');
    const addClassBtn = document.getElementById('add-class-btn');

    if (manSubjBtn) manSubjBtn.addEventListener('click', openSubjectsModal);
    if (manSlotBtn) manSlotBtn.addEventListener('click', openTimeSlotsModal);
    if (addClassBtn) addClassBtn.addEventListener('click', openAssignModal);

    const wrapper = document.getElementById('timetable-wrapper');
    if (!wrapper) return;

    // Mobile swiper
    if (window.innerWidth < 768) {
      _initSwiper(days);
    }

    // Cell add buttons
    wrapper.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.cell-add-btn');
      if (addBtn) {
        openAssignModal({ day: addBtn.dataset.day, slot: parseInt(addBtn.dataset.slot) });
        return;
      }

      // Subject card actions
      const action = e.target.closest('[data-action]');
      if (action) {
        e.stopPropagation();
        const { day, slot } = action.dataset;
        const slotIdx = parseInt(slot);
        if (action.dataset.action === 'remove') {
          App.State.setScheduleCell(day, slotIdx, null);
          renderTimetable();
          App.UI.toast('Class removed', 'info');
        } else if (action.dataset.action === 'edit') {
          openAssignModal({ day, slot: slotIdx });
        }
      }
    });
  }

  /* ---- Mobile day swiper ---- */
  let _swiperDayIndex = 0;

  function _initSwiper(days) {
    const profile = App.State.getProfile();
    const today = App.UI.getDayName(new Date());
    _swiperDayIndex = Math.max(0, days.indexOf(today));

    _updateSwiper(days, profile);

    document.getElementById('day-prev')?.addEventListener('click', () => {
      if (_swiperDayIndex > 0) { _swiperDayIndex--; _updateSwiper(days, profile); }
    });
    document.getElementById('day-next')?.addEventListener('click', () => {
      if (_swiperDayIndex < days.length - 1) { _swiperDayIndex++; _updateSwiper(days, profile); }
    });
  }

  function _updateSwiper(days, profile) {
    const day = days[_swiperDayIndex];
    const labelEl   = document.getElementById('day-swiper-label');
    const contentEl = document.getElementById('day-swiper-content');
    if (labelEl)   labelEl.textContent = App.UI.cap(day);
    if (contentEl) {
      contentEl.innerHTML = _renderDayContent(day, profile);
      contentEl.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]');
        if (action && (action.dataset.action === 'edit')) {
          openAssignModal({ day: action.dataset.day, slot: parseInt(action.dataset.slot) });
        }
      });
    }
  }

  /* ---- Drag and Drop ---- */
  function _setupDragDrop() {
    // Destroy previous sortables
    _sortables.forEach(s => s.destroy());
    _sortables = [];

    // We make each day's column cells sortable (within the column only).
    // Since it's CSS Grid, we need per-cell containers per day.
    // The cells already have data-day and data-slot attributes.
    // For simplicity, enable drag within each column using Sortable on rows.
    // Each day's cells aren't in a single container in the grid,
    // so we'll use a different approach: custom drag events.
    // SortableJS works best on a flex/block container.
    // We'll wrap day columns separately by creating virtual containers.

    const profile = App.State.getProfile();
    const days    = App.UI.getSortedDays();

    if (typeof Sortable === 'undefined') return;

    days.forEach(day => {
      const cells = document.querySelectorAll(`.timetable-cell[data-day="${day}"]`);
      if (cells.length === 0) return;

      // Wrap subject cards in a shared list per day is complex with CSS Grid.
      // Instead, enable drag on subject cards and listen globally for drop.
      // We'll use Sortable on the time slots list in the management modal.
    });
  }

  // ============================================================
  // ASSIGN CLASS MODAL
  // ============================================================
  function openAssignModal(opts) {
    opts = opts || {};
    const profile = App.State.getProfile();
    const days    = App.UI.getSortedDays();
    const slots   = profile.timeSlots;

    App.UI.openModal({
      title: 'Assign Class',
      body: `
        <div class="form-group">
          <label class="form-label" for="assign-day">Day</label>
          <select class="select" id="assign-day">
            ${days.map(d => `<option value="${d}" ${d === opts.day ? 'selected':''}>${App.UI.cap(d)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="assign-slot">Time Slot</label>
          <select class="select" id="assign-slot">
            ${slots.map((slot, i) => `
              <option value="${i}" ${i === opts.slot ? 'selected':''}>
                ${App.UI.formatTime(slot.start)} – ${App.UI.formatTime(slot.end)} (${escHtml(slot.label)})
              </option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="assign-subject">Subject</label>
          <select class="select" id="assign-subject">
            <option value="">— Free Period —</option>
            ${profile.subjects.map(s => `<option value="${s.id}">${escHtml(s.name)}</option>`).join('')}
          </select>
        </div>
      `,
      buttons: [
        { label: 'Cancel', cls: 'btn-secondary' },
        {
          label: 'Assign', cls: 'btn-primary', close: false,
          action: () => {
            const day   = document.getElementById('assign-day').value;
            const slot  = parseInt(document.getElementById('assign-slot').value);
            const subjId = document.getElementById('assign-subject').value || null;
            App.State.setScheduleCell(day, slot, subjId);
            App.UI.closeModal();
            renderTimetable();
            App.UI.toast(subjId ? 'Class assigned' : 'Slot cleared', 'success');
          }
        }
      ],
    });

    // Pre-set subject if cell already has one
    if (opts.day && opts.slot !== undefined) {
      const sched = App.State.getProfile().schedule[opts.day] || [];
      const existingSubjId = sched[opts.slot];
      setTimeout(() => {
        const sel = document.getElementById('assign-subject');
        if (sel && existingSubjId) sel.value = existingSubjId;
      }, 10);
    }
  }

  // ============================================================
  // SUBJECTS MANAGEMENT
  // ============================================================
  function openSubjectsModal() {
    App.UI.openModal({
      title: 'Manage Subjects',
      size: 'lg',
      body: _buildSubjectsForm(),
      buttons: [
        { label: 'Close', cls: 'btn-secondary' },
        {
          label: 'Add Subject', cls: 'btn-primary', close: false,
          action: openAddSubjectModal,
        }
      ],
    });
  }

  function _buildSubjectsForm() {
    const profile = App.State.getProfile();
    if (profile.subjects.length === 0) {
      return `<p style="color:var(--text-muted);font-size:var(--text-sm);text-align:center;padding:var(--sp-8) 0">No subjects yet.</p>`;
    }
    return `
      <div class="subjects-list">
        ${profile.subjects.map(subj => `
          <div class="subject-item" data-id="${subj.id}">
            <span class="subject-color-dot" style="background:${subj.color}"></span>
            <span class="subject-item-name">${escHtml(subj.name)}</span>
            <span class="subject-item-meta">${[subj.teacher, subj.room].filter(Boolean).join(' · ')}</span>
            <div class="subject-item-actions">
              <button class="btn btn-ghost btn-icon btn-sm subj-edit" data-id="${subj.id}" title="Edit">
                ${App.UI.icon('edit')}
              </button>
              <button class="btn btn-danger-ghost btn-icon btn-sm subj-delete" data-id="${subj.id}" title="Delete">
                ${App.UI.icon('trash')}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function openAddSubjectModal(subjectId) {
    const profile = App.State.getProfile();
    const existing = subjectId ? profile.subjects.find(s => s.id === subjectId) : null;
    const isEdit = !!existing;

    App.UI.openModal({
      title: isEdit ? 'Edit Subject' : 'New Subject',
      body: `
        <div class="form-group">
          <label class="form-label" for="subj-name">Name *</label>
          <input class="input" id="subj-name" type="text" value="${escHtml(existing?.name||'')}" placeholder="e.g. Mathematics" required>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="subj-teacher">Teacher</label>
            <input class="input" id="subj-teacher" type="text" value="${escHtml(existing?.teacher||'')}" placeholder="Mr. Smith">
          </div>
          <div class="form-group">
            <label class="form-label" for="subj-room">Room</label>
            <input class="input" id="subj-room" type="text" value="${escHtml(existing?.room||'')}" placeholder="A101">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Subject Color</label>
          <div class="color-input-row">
            <div class="color-swatch">
              <input type="color" id="subj-color" value="${existing?.color||'#2563eb'}">
            </div>
            <input class="input" id="subj-color-text" type="text" value="${existing?.color||'#2563eb'}" maxlength="7" style="font-family:var(--font-mono)">
          </div>
        </div>
      `,
      onOpen: () => {
        App.UI.bindColorPicker('subj-color', 'subj-color-text');
      },
      buttons: [
        { label: 'Cancel', cls: 'btn-secondary' },
        {
          label: isEdit ? 'Save' : 'Add Subject', cls: 'btn-primary', close: false,
          action: () => {
            const name = document.getElementById('subj-name').value.trim();
            if (!name) { App.UI.toast('Subject name is required', 'error'); return; }
            const colorInput = document.getElementById('subj-color');
            App.State.upsertSubject({
              id:      existing?.id || App.State.uid('s'),
              name,
              teacher: document.getElementById('subj-teacher').value.trim(),
              room:    document.getElementById('subj-room').value.trim(),
              color:   colorInput.value,
            });
            App.UI.closeModal();
            setTimeout(() => openSubjectsModal(), 50);
            renderTimetable();
            App.UI.toast(isEdit ? 'Subject updated' : 'Subject added', 'success');
          }
        }
      ],
    });
  }

  // ============================================================
  // TIME SLOTS MANAGEMENT
  // ============================================================
  function openTimeSlotsModal() {
    App.UI.openModal({
      title: 'Manage Time Slots',
      size: 'lg',
      body: _buildSlotsForm(),
      buttons: [
        { label: 'Close', cls: 'btn-secondary' },
        {
          label: 'Add Time Slot', cls: 'btn-primary', close: false,
          action: () => openAddSlotModal(),
        }
      ],
      onOpen: () => _initSlotsDragDrop(),
    });

    // Event delegation for slot actions
    setTimeout(() => {
      document.getElementById('modal-body')?.addEventListener('click', (e) => {
        const editBtn   = e.target.closest('.slot-edit');
        const deleteBtn = e.target.closest('.slot-delete');
        if (editBtn)   openAddSlotModal(parseInt(editBtn.dataset.idx));
        if (deleteBtn) {
          const idx = parseInt(deleteBtn.dataset.idx);
          App.UI.confirm('Delete this time slot? Classes assigned to it will be lost.', 'Delete Slot').then(ok => {
            if (ok) {
              App.State.deleteTimeSlot(idx);
              const body = document.getElementById('modal-body');
              if (body) body.innerHTML = _buildSlotsForm();
              setTimeout(() => _initSlotsDragDrop(), 50);
              renderTimetable();
              App.UI.toast('Time slot removed', 'info');
            }
          });
        }

        const subjEditBtn  = e.target.closest('.subj-edit');
        const subjDelBtn   = e.target.closest('.subj-delete');
        if (subjEditBtn) openAddSubjectModal(subjEditBtn.dataset.id);
        if (subjDelBtn) {
          const id = subjDelBtn.dataset.id;
          App.UI.confirm('Delete this subject? It will be removed from all time slots.', 'Delete Subject').then(ok => {
            if (ok) {
              App.State.deleteSubject(id);
              const body = document.getElementById('modal-body');
              if (body) body.innerHTML = _buildSubjectsForm();
              renderTimetable();
              App.UI.toast('Subject deleted', 'info');
            }
          });
        }
      });
    }, 100);
  }

  function _buildSlotsForm() {
    const profile = App.State.getProfile();
    if (profile.timeSlots.length === 0) {
      return `<p style="color:var(--text-muted);font-size:var(--text-sm);text-align:center;padding:var(--sp-8) 0">No time slots yet.</p>`;
    }
    return `
      <div class="subjects-list" id="slots-sortable">
        ${profile.timeSlots.map((slot, i) => `
          <div class="slot-item" data-id="${slot.id}">
            <span class="drag-handle">${App.UI.icon('drag')}</span>
            <span class="slot-time">${App.UI.formatTime(slot.start)} – ${App.UI.formatTime(slot.end)}</span>
            <span class="slot-label">${escHtml(slot.label)}</span>
            <div class="slot-actions">
              <button class="btn btn-ghost btn-icon btn-sm slot-edit" data-idx="${i}" title="Edit">
                ${App.UI.icon('edit')}
              </button>
              <button class="btn btn-danger-ghost btn-icon btn-sm slot-delete" data-idx="${i}" title="Delete">
                ${App.UI.icon('trash')}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function _initSlotsDragDrop() {
    const list = document.getElementById('slots-sortable');
    if (!list || typeof Sortable === 'undefined') return;
    new Sortable(list, {
      handle: '.drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      onEnd: (evt) => {
        const profile = App.State.getProfile();
        const ids = [...list.querySelectorAll('.slot-item')].map(el => el.dataset.id);
        App.State.setTimeSlotOrder(ids);
        renderTimetable();
      }
    });
  }

  function openAddSlotModal(index) {
    const profile  = App.State.getProfile();
    const existing = index !== undefined ? profile.timeSlots[index] : null;
    const isEdit   = index !== undefined;

    App.UI.openModal({
      title: isEdit ? 'Edit Time Slot' : 'New Time Slot',
      size: 'sm',
      body: `
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="slot-start">Start Time *</label>
            <input class="input" id="slot-start" type="time" value="${existing?.start||'08:00'}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="slot-end">End Time *</label>
            <input class="input" id="slot-end" type="time" value="${existing?.end||'09:00'}" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="slot-label">Label</label>
          <input class="input" id="slot-label" type="text" value="${escHtml(existing?.label||'')}" placeholder="e.g. Period 1">
        </div>
      `,
      buttons: [
        { label: 'Cancel', cls: 'btn-secondary' },
        {
          label: isEdit ? 'Save' : 'Add Slot', cls: 'btn-primary', close: false,
          action: () => {
            const start = document.getElementById('slot-start').value;
            const end   = document.getElementById('slot-end').value;
            if (!start || !end) { App.UI.toast('Start and end times are required', 'error'); return; }
            if (start >= end) { App.UI.toast('End time must be after start time', 'error'); return; }
            App.State.upsertTimeSlot({
              id:    existing?.id || App.State.uid('ts'),
              start,
              end,
              label: document.getElementById('slot-label').value.trim(),
            }, isEdit ? index : -1);
            App.UI.closeModal();
            setTimeout(() => openTimeSlotsModal(), 50);
            renderTimetable();
            App.UI.toast(isEdit ? 'Time slot updated' : 'Time slot added', 'success');
          }
        }
      ],
    });
  }

  // ============================================================
  // PROFILE MANAGEMENT
  // ============================================================
  function openAddProfileModal() {
    App.UI.openModal({
      title: 'New Timetable Profile',
      size: 'sm',
      body: `
        <div class="form-group">
          <label class="form-label" for="profile-name">Profile Name *</label>
          <input class="input" id="profile-name" type="text" placeholder="e.g. Week B, Semester 2" maxlength="40">
        </div>
        <div class="form-group">
          <label class="form-label" for="profile-copy">Copy from existing profile</label>
          <select class="select" id="profile-copy">
            <option value="">— Start blank —</option>
            ${Object.values(App.State.get().profiles).map(p => `
              <option value="${p.id}">${escHtml(p.name)}</option>
            `).join('')}
          </select>
        </div>
      `,
      buttons: [
        { label: 'Cancel', cls: 'btn-secondary' },
        {
          label: 'Create Profile', cls: 'btn-primary', close: false,
          action: () => {
            const name = document.getElementById('profile-name').value.trim();
            if (!name) { App.UI.toast('Profile name is required', 'error'); return; }
            const copyFrom = document.getElementById('profile-copy').value;
            const source   = copyFrom ? App.State.get().profiles[copyFrom] : null;
            const newId    = App.State.uid('profile');

            const newProfile = source
              ? JSON.parse(JSON.stringify({ ...source, id: newId, name }))
              : {
                  id: newId, name,
                  subjects: [],
                  timeSlots: [],
                  schedule: { monday:[], tuesday:[], wednesday:[], thursday:[], friday:[], saturday:[], sunday:[] }
                };

            App.State.upsertProfile(newProfile);
            App.State.setCurrentProfile(newId);
            App.UI.closeModal();
            renderTimetable();
            App.UI.toast(`Profile "${name}" created`, 'success');
          }
        }
      ],
    });
  }

  // ============================================================
  // TODAY VIEW
  // ============================================================
  function renderTodayView() {
    const container = document.getElementById('view-today');
    const profile   = App.State.getProfile();
    const today     = App.UI.getDayName(new Date());
    const slots     = profile.timeSlots;
    const sched     = profile.schedule[today] || [];
    const dayLabel  = App.UI.cap(today);
    const dateStr   = new Date().toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Today</h1>
          <p class="view-subtitle">${dateStr}</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 300px;gap:var(--sp-5)">
        <div>
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">${dayLabel}'s Schedule</div>
                <div class="card-subtitle">${profile.name}</div>
              </div>
            </div>
            <div class="card-body">
              ${slots.length === 0
                ? `<div class="empty-state">${App.UI.icon('today')}<p class="empty-state-desc">No time slots configured yet. Add some in the Timetable view.</p></div>`
                : `<div class="today-timeline">${slots.map((slot, i) => {
                    const subjId = sched[i] || null;
                    const subj   = subjId ? App.State.getSubject(subjId) : null;
                    const active = App.UI.isSlotActive(slot);
                    return `
                      <div class="timeline-item">
                        <div class="timeline-time-col">
                          <div class="timeline-time">${App.UI.formatTime(slot.start)}</div>
                        </div>
                        <div class="timeline-connector">
                          <div class="timeline-dot" style="${subj ? `background:${subj.color};border-color:${subj.color}` : 'background:var(--border)'}"></div>
                          <div class="timeline-line"></div>
                        </div>
                        <div class="timeline-content">
                          ${subj ? `
                            <div class="timeline-card ${active ? 'active-class' : ''}" style="background:${subj.color}">
                              <div class="timeline-card-name">${escHtml(subj.name)}</div>
                              <div class="timeline-card-meta">
                                ${subj.teacher ? `<span>${escHtml(subj.teacher)}</span>` : ''}
                                ${subj.room    ? `<span>${escHtml(subj.room)}</span>`    : ''}
                                <span>${App.UI.formatTime(slot.start)} – ${App.UI.formatTime(slot.end)}</span>
                              </div>
                            </div>
                          ` : `
                            <div class="timeline-card empty">
                              <div class="timeline-card-name">${escHtml(slot.label || 'Free Period')}</div>
                              <div class="timeline-card-meta"><span>${App.UI.formatTime(slot.start)} – ${App.UI.formatTime(slot.end)}</span></div>
                            </div>
                          `}
                        </div>
                      </div>
                    `;
                  }).join('')}</div>`}
            </div>
          </div>
        </div>
        <div>
          ${_renderNextClass(slots, sched)}
          ${_renderTodayStats(slots, sched)}
        </div>
      </div>
    `;
  }

  function _renderNextClass(slots, sched) {
    const now = App.UI.currentTimeStr();
    let nextSlot = null, nextSubj = null;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (slot.start > now) {
        const subjId = sched[i] || null;
        const subj   = subjId ? App.State.getSubject(subjId) : null;
        if (subj) { nextSlot = slot; nextSubj = subj; break; }
      }
    }

    if (!nextSlot) {
      return `
        <div class="card mb-4">
          <div class="card-body text-center" style="padding:var(--sp-5)">
            <div style="color:var(--text-muted);font-size:var(--text-sm)">No more classes today</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="next-class-card mb-4">
        <div class="next-class-label">Next Class</div>
        <div class="next-class-name">${escHtml(nextSubj.name)}</div>
        <div class="next-class-time">${App.UI.formatTime(nextSlot.start)} · ${[nextSubj.teacher, nextSubj.room].filter(Boolean).join(' · ')}</div>
      </div>
    `;
  }

  function _renderTodayStats(slots, sched) {
    const total   = slots.length;
    const classes = sched.filter(Boolean).length;
    const free    = total - classes;
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">Today's Summary</div></div>
        <div class="card-body" style="padding:var(--sp-4)">
          ${[
            ['Total Periods', total],
            ['Classes', classes],
            ['Free Periods', free],
          ].map(([label, val]) => `
            <div class="today-class-item">
              <div class="today-class-info"><div class="today-class-name">${label}</div></div>
              <div class="today-class-time" style="font-size:var(--text-lg);font-weight:700;color:var(--text)">${val}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { renderTimetable, renderTodayView, openAssignModal, openSubjectsModal, openTimeSlotsModal };
})();
