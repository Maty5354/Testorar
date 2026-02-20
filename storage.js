/* ============================================================
   STORAGE MODULE
   Thin wrapper around localStorage.
   All reads/writes go through here so we can swap
   the persistence layer later (IndexedDB, API, etc.)
   ============================================================ */

window.App = window.App || {};

App.Storage = (() => {
  const KEY = 'timetable_app_v1';

  /**
   * Load the full persisted state object.
   * Returns null if nothing stored or parse error.
   */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[Storage] Failed to load:', e);
      return null;
    }
  }

  /**
   * Persist the full state object.
   * Returns true on success, false on failure (quota exceeded, etc.)
   */
  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('[Storage] Failed to save:', e);
      return false;
    }
  }

  /** Remove all stored data (used for factory reset). */
  function clear() {
    try {
      localStorage.removeItem(KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Export the stored data as a JSON string (for backup). */
  function exportJSON() {
    return localStorage.getItem(KEY) || '{}';
  }

  /** Import a JSON string (from backup). Returns true on success. */
  function importJSON(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      return save(parsed);
    } catch (e) {
      console.error('[Storage] Import failed:', e);
      return false;
    }
  }

  return { load, save, clear, exportJSON, importJSON };
})();
