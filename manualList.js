/* ============================================================
   MANUAL LIST COMPONENT
   User-managed bookmark-style link cards.
   Supports add, edit, delete, and drag-drop reorder.
   ============================================================ */

window.App = window.App || {};

App.ManualList = (() => {

  function render() {
    const container = document.getElementById('view-manual-list');
    const links     = App.State.get().links;

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Links</h1>
          <p class="view-subtitle">Quick access to important resources</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary btn-sm" id="add-link-btn">
            ${App.UI.icon('plus')} Add Link
          </button>
        </div>
      </div>
      ${links.length === 0
        ? `<div class="empty-state card" style="margin-top:var(--sp-4)">
            ${App.UI.icon('link')}
            <div class="empty-state-title">No links yet</div>
            <div class="empty-state-desc">Add links to quickly access your frequently used resources.</div>
            <button class="btn btn-primary mt-4" id="add-link-empty-btn">${App.UI.icon('plus')} Add First Link</button>
          </div>`
        : `<div class="links-grid" id="links-sortable">
            ${links.map(link => _renderLinkCard(link)).join('')}
          </div>`
      }
    `;

    _bindEvents();
    _initDragDrop();
  }

  function _renderLinkCard(link) {
    // Build a display URL (truncate protocol)
    let displayUrl = link.url;
    try { displayUrl = new URL(link.url).host + new URL(link.url).pathname; } catch(e) {}

    const initial = (link.title || '?').charAt(0).toUpperCase();

    return `
      <div class="link-card" data-id="${link.id}">
        <div class="link-favicon">${escHtml(initial)}</div>
        <div class="link-info">
          <a class="link-title" href="${escHtml(link.url)}" target="_blank" rel="noopener noreferrer"
             title="${escHtml(link.title)}">
            ${escHtml(link.title)}
            <span style="display:inline-flex;vertical-align:middle;margin-left:4px;opacity:0.4">${App.UI.icon('externalLink')}</span>
          </a>
          <div class="link-url">${escHtml(displayUrl)}</div>
          ${link.description ? `<div class="link-desc">${escHtml(link.description)}</div>` : ''}
        </div>
        <div class="link-actions">
          <button class="btn btn-ghost btn-icon btn-sm link-edit" data-id="${link.id}" title="Edit link">
            ${App.UI.icon('edit')}
          </button>
          <button class="btn btn-danger-ghost btn-icon btn-sm link-delete" data-id="${link.id}" title="Delete link">
            ${App.UI.icon('trash')}
          </button>
        </div>
      </div>
    `;
  }

  function _bindEvents() {
    const container = document.getElementById('view-manual-list');

    container.addEventListener('click', (e) => {
      // Add link buttons
      if (e.target.closest('#add-link-btn') || e.target.closest('#add-link-empty-btn')) {
        openAddLinkModal();
        return;
      }
      // Edit
      const editBtn = e.target.closest('.link-edit');
      if (editBtn) { openAddLinkModal(editBtn.dataset.id); return; }
      // Delete
      const delBtn = e.target.closest('.link-delete');
      if (delBtn) {
        const id = delBtn.dataset.id;
        App.UI.confirm('Remove this link from your list?', 'Remove Link').then(ok => {
          if (!ok) return;
          App.State.deleteLink(id);
          render();
          App.UI.toast('Link removed', 'info');
        });
      }
    });
  }

  function _initDragDrop() {
    const list = document.getElementById('links-sortable');
    if (!list || typeof Sortable === 'undefined') return;

    new Sortable(list, {
      animation: 180,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      handle: '.link-card',
      onEnd: () => {
        const ids = [...list.querySelectorAll('.link-card')].map(el => el.dataset.id);
        App.State.setLinkOrder(ids);
        App.UI.toast('Order saved', 'success');
      }
    });
  }

  function openAddLinkModal(linkId) {
    const existing = linkId ? App.State.get().links.find(l => l.id === linkId) : null;
    const isEdit   = !!existing;

    App.UI.openModal({
      title: isEdit ? 'Edit Link' : 'Add Link',
      body: `
        <div class="form-group">
          <label class="form-label" for="link-title">Title *</label>
          <input class="input" id="link-title" type="text" value="${escHtml(existing?.title||'')}" placeholder="e.g. School Portal" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="link-url">URL *</label>
          <input class="input" id="link-url" type="url" value="${escHtml(existing?.url||'')}" placeholder="https://example.com" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="link-desc">Description <span style="font-weight:400;color:var(--text-muted)">(optional)</span></label>
          <input class="input" id="link-desc" type="text" value="${escHtml(existing?.description||'')}" placeholder="Short description...">
        </div>
      `,
      buttons: [
        { label: 'Cancel', cls: 'btn-secondary' },
        {
          label: isEdit ? 'Save' : 'Add Link', cls: 'btn-primary', close: false,
          action: () => {
            const title = document.getElementById('link-title').value.trim();
            const url   = document.getElementById('link-url').value.trim();
            if (!title) { App.UI.toast('Title is required', 'error'); return; }
            if (!url)   { App.UI.toast('URL is required', 'error'); return; }
            App.State.upsertLink({
              id:          existing?.id || App.State.uid('l'),
              title,
              url,
              description: document.getElementById('link-desc').value.trim(),
            });
            App.UI.closeModal();
            render();
            App.UI.toast(isEdit ? 'Link updated' : 'Link added', 'success');
          }
        }
      ],
    });
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render, openAddLinkModal };
})();
