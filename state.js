/* ============================================================
   STATE MODULE
   Single source of truth for all application data.
   Merges saved state with defaults on init.
   Every mutation should call state.save() to persist.
   ============================================================ */

window.App = window.App || {};

App.State = (() => {

  /* ---- Default state (used on first load) ---- */
  const DEFAULTS = {
    profiles: {
      'profile-default': {
        id: 'profile-default',
        name: 'Week A',
        subjects: [
          { id: 's1', name: 'Mathematics',  color: '#2563eb', teacher: 'Mr. Johnson',  room: 'A101' },
          { id: 's2', name: 'Physics',      color: '#7c3aed', teacher: 'Ms. Chen',     room: 'B204' },
          { id: 's3', name: 'Literature',   color: '#059669', teacher: 'Mrs. Davis',   room: 'C305' },
          { id: 's4', name: 'History',      color: '#d97706', teacher: 'Mr. Wilson',   room: 'A202' },
          { id: 's5', name: 'Chemistry',    color: '#dc2626', teacher: 'Dr. Martinez', room: 'Lab 1' },
          { id: 's6', name: 'Art',          color: '#0891b2', teacher: 'Ms. Lee',      room: 'Studio' },
        ],
        timeSlots: [
          { id: 'ts1', start: '08:00', end: '08:55', label: 'Period 1' },
          { id: 'ts2', start: '09:00', end: '09:55', label: 'Period 2' },
          { id: 'ts3', start: '10:10', end: '11:05', label: 'Period 3' },
          { id: 'ts4', start: '11:10', end: '12:05', label: 'Period 4' },
          { id: 'ts5', start: '13:00', end: '13:55', label: 'Period 5' },
          { id: 'ts6', start: '14:00', end: '14:55', label: 'Period 6' },
        ],
        schedule: {
          monday:    ['s1', 's2', null, 's3', 's4', 's5'],
          tuesday:   ['s2', 's1', 's5', null, 's3', null],
          wednesday: ['s3', null, 's1', 's2', null, 's4'],
          thursday:  ['s4', 's3', 's2', 's5', 's1', null],
          friday:    ['s5', 's4', null, 's1', 's2', 's6'],
          saturday:  [null, null, null, null, null, null],
          sunday:    [null, null, null, null, null, null],
        }
      }
    },
    currentProfile: 'profile-default',
    links: [
      { id: 'l1', title: 'School Portal',    url: 'https://example.com',         description: 'Student information system' },
      { id: 'l2', title: 'Library Database', url: 'https://library.example.com', description: 'Access research papers and books' },
    ],
    customization: {
      primaryColor:   '#2563eb',
      bgColor:        '#f1f5f9',
      surfaceColor:   '#ffffff',
      textColor:      '#0f172a',
      sidebarBg:      '#0f172a',
      fontFamily:     "'DM Sans', system-ui, -apple-system, sans-serif",
      fontScale:      '1',
      letterSpacing:  '0',
      borderRadius:   '8',
      shadowIntensity:'medium',
      compactMode:    false,
      timeFormat:     '24h',
      startDay:       'monday',
      showWeekends:   false,
    },
    header: {
      title:     'Timetable',
      subtitle:  'Academic Schedule',
      showClock: true,
      textAlign: 'left',
      height:    '64',
      bgColor:   '',
    }
  };

  /* ---- Internal mutable state ---- */
  let _state = null;

  /**
   * Deep merge: overrides DEFAULTS with saved values.
   * Only merges top-level keys, not deeply (good enough here).
   */
  function _merge(defaults, saved) {
    const result = JSON.parse(JSON.stringify(defaults));
    if (!saved) return result;
    // Merge top-level keys
    for (const key of Object.keys(saved)) {
      if (key === 'profiles') {
        result.profiles = Object.assign({}, defaults.profiles, saved.profiles);
      } else if (key === 'customization') {
        result.customization = Object.assign({}, defaults.customization, saved.customization);
      } else if (key === 'header') {
        result.header = Object.assign({}, defaults.header, saved.header);
      } else {
        result[key] = saved[key];
      }
    }
    return result;
  }

  /** Load state from storage (or use defaults). */
  function init() {
    const saved = App.Storage.load();
    _state = _merge(DEFAULTS, saved);
    return _state;
  }

  /** Persist current state to storage. */
  function save() {
    App.Storage.save(_state);
  }

  /** Get the full state (read-only reference - mutate via setters). */
  function get() { return _state; }

  /** Get current profile data. */
  function getProfile() {
    return _state.profiles[_state.currentProfile];
  }

  /** Get a subject by ID from current profile. */
  function getSubject(id) {
    const profile = getProfile();
    return profile ? profile.subjects.find(s => s.id === id) : null;
  }

  /** Get time slot by index from current profile. */
  function getTimeSlot(index) {
    const profile = getProfile();
    return profile ? profile.timeSlots[index] : null;
  }

  /** Get schedule for a given day from current profile. */
  function getScheduleDay(day) {
    const profile = getProfile();
    return profile ? (profile.schedule[day] || []) : [];
  }

  /* ---- Mutators ---- */

  function setCurrentProfile(id) {
    if (_state.profiles[id]) {
      _state.currentProfile = id;
      save();
    }
  }

  function upsertProfile(profile) {
    _state.profiles[profile.id] = profile;
    save();
  }

  function deleteProfile(id) {
    if (Object.keys(_state.profiles).length <= 1) return false;
    delete _state.profiles[id];
    if (_state.currentProfile === id) {
      _state.currentProfile = Object.keys(_state.profiles)[0];
    }
    save();
    return true;
  }

  function upsertSubject(subject) {
    const profile = getProfile();
    if (!profile) return;
    const idx = profile.subjects.findIndex(s => s.id === subject.id);
    if (idx >= 0) { profile.subjects[idx] = subject; }
    else          { profile.subjects.push(subject); }
    save();
  }

  function deleteSubject(id) {
    const profile = getProfile();
    if (!profile) return;
    profile.subjects = profile.subjects.filter(s => s.id !== id);
    // Also clear from schedule
    for (const day of Object.keys(profile.schedule)) {
      profile.schedule[day] = profile.schedule[day].map(sid => sid === id ? null : sid);
    }
    save();
  }

  function upsertTimeSlot(slot, index) {
    const profile = getProfile();
    if (!profile) return;
    if (index >= 0 && index < profile.timeSlots.length) {
      profile.timeSlots[index] = slot;
    } else {
      // New slot - extend schedule arrays
      profile.timeSlots.push(slot);
      for (const day of Object.keys(profile.schedule)) {
        profile.schedule[day].push(null);
      }
    }
    save();
  }

  function deleteTimeSlot(index) {
    const profile = getProfile();
    if (!profile) return;
    profile.timeSlots.splice(index, 1);
    for (const day of Object.keys(profile.schedule)) {
      profile.schedule[day].splice(index, 1);
    }
    save();
  }

  function setScheduleCell(day, slotIndex, subjectId) {
    const profile = getProfile();
    if (!profile) return;
    if (!profile.schedule[day]) profile.schedule[day] = [];
    profile.schedule[day][slotIndex] = subjectId;
    save();
  }

  function setTimeSlotOrder(newOrder) {
    const profile = getProfile();
    if (!profile) return;
    // newOrder = array of slot IDs in new order
    const oldSlots = profile.timeSlots;
    const newSlots = newOrder.map(id => oldSlots.find(s => s.id === id)).filter(Boolean);
    const oldIndices = newOrder.map(id => oldSlots.findIndex(s => s.id === id));
    // Reorder schedule arrays accordingly
    for (const day of Object.keys(profile.schedule)) {
      const oldSched = profile.schedule[day];
      profile.schedule[day] = oldIndices.map(i => oldSched[i] ?? null);
    }
    profile.timeSlots = newSlots;
    save();
  }

  function upsertLink(link) {
    const idx = _state.links.findIndex(l => l.id === link.id);
    if (idx >= 0) { _state.links[idx] = link; }
    else          { _state.links.push(link); }
    save();
  }

  function deleteLink(id) {
    _state.links = _state.links.filter(l => l.id !== id);
    save();
  }

  function setLinkOrder(newIds) {
    const map = {};
    _state.links.forEach(l => { map[l.id] = l; });
    _state.links = newIds.map(id => map[id]).filter(Boolean);
    save();
  }

  function updateCustomization(changes) {
    _state.customization = Object.assign(_state.customization, changes);
    save();
  }

  function updateHeader(changes) {
    _state.header = Object.assign(_state.header, changes);
    save();
  }

  function resetToDefaults() {
    _state = JSON.parse(JSON.stringify(DEFAULTS));
    save();
  }

  /** Generate a simple unique ID. */
  function uid(prefix) {
    return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 8);
  }

  return {
    init, save, get, getProfile, getSubject, getTimeSlot,
    getScheduleDay,
    setCurrentProfile, upsertProfile, deleteProfile,
    upsertSubject, deleteSubject,
    upsertTimeSlot, deleteTimeSlot, setScheduleCell, setTimeSlotOrder,
    upsertLink, deleteLink, setLinkOrder,
    updateCustomization, updateHeader, resetToDefaults,
    uid,
  };
})();
