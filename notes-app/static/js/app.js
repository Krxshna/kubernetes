/* ═══════════════════════════════════════════════════════════════
   NOTES APP — Client-Side Logic
   ═══════════════════════════════════════════════════════════════ */

const API = '/api/notes/';

// ── DOM References ─────────────────────────────────────────────
const listView      = document.getElementById('notes-list-view');
const editorView    = document.getElementById('note-editor-view');
const notesList     = document.getElementById('notes-list');
const notesCount    = document.getElementById('notes-count');
const emptyState    = document.getElementById('empty-state');
const addNoteBtn    = document.getElementById('add-note-btn');
const backBtn       = document.getElementById('back-btn');
const saveBtn       = document.getElementById('save-btn');
const deleteBtn     = document.getElementById('delete-btn');
const noteTextarea  = document.getElementById('note-textarea');
const noteMeta      = document.getElementById('note-meta');

let currentNoteId = null;

// ── Initialize ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  fetchNotes();

  addNoteBtn.addEventListener('click', openNewNote);
  backBtn.addEventListener('click', handleBack);
  saveBtn.addEventListener('click', handleSave);
  deleteBtn.addEventListener('click', handleDelete);
});

// ── API Helpers ────────────────────────────────────────────────
async function fetchNotes() {
  try {
    const res = await fetch(API);
    const notes = await res.json();
    renderNotes(notes);
  } catch (err) {
    console.error('Failed to fetch notes:', err);
  }
}

async function fetchNote(id) {
  const res = await fetch(`${API}${id}`);
  return res.json();
}

async function createNote(body) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body })
  });
  return res.json();
}

async function updateNote(id, body) {
  const res = await fetch(`${API}${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body })
  });
  return res.json();
}

async function deleteNote(id) {
  await fetch(`${API}${id}`, { method: 'DELETE' });
}

// ── Render Notes List ──────────────────────────────────────────
function renderNotes(notes) {
  notesList.innerHTML = '';

  if (notes.length === 0) {
    emptyState.style.display = 'flex';
    notesList.style.display = 'none';
    notesCount.textContent = '0';
    return;
  }

  emptyState.style.display = 'none';
  notesList.style.display = 'block';
  notesCount.textContent = notes.length;

  notes.forEach((note) => {
    const title = getTitle(note);
    const preview = getPreview(note);
    const date = formatDate(note.updated);

    const card = document.createElement('div');
    card.className = 'notes-list-item';
    card.innerHTML = `
      <h3>${escapeHtml(title)}</h3>
      <p class="note-preview">${escapeHtml(preview)}</p>
      <span class="note-date">${date}</span>
    `;
    card.addEventListener('click', () => openNote(note.id));
    notesList.appendChild(card);
  });
}

// ── View Switching ─────────────────────────────────────────────
function showListView() {
  editorView.classList.add('hidden');
  listView.classList.remove('hidden');
  // Re-trigger animation
  listView.style.animation = 'none';
  listView.offsetHeight; // reflow
  listView.style.animation = '';
  fetchNotes();
}

function showEditorView() {
  listView.classList.add('hidden');
  editorView.classList.remove('hidden');
  editorView.style.animation = 'none';
  editorView.offsetHeight;
  editorView.style.animation = '';
  noteTextarea.focus();
}

// ── Note Actions ───────────────────────────────────────────────
function openNewNote() {
  currentNoteId = null;
  noteTextarea.value = '';
  noteMeta.textContent = '';
  deleteBtn.style.display = 'none';
  showEditorView();
}

async function openNote(id) {
  try {
    const note = await fetchNote(id);
    currentNoteId = note.id;
    noteTextarea.value = note.body || '';
    noteMeta.textContent = `Created ${formatDate(note.created)}  •  Updated ${formatDate(note.updated)}`;
    deleteBtn.style.display = 'flex';
    showEditorView();
  } catch (err) {
    console.error('Failed to open note:', err);
    showToast('Failed to open note');
  }
}

async function handleBack() {
  // Auto-save on back
  const body = noteTextarea.value.trim();

  if (currentNoteId) {
    await updateNote(currentNoteId, body);
  } else if (body) {
    await createNote(body);
  }

  showListView();
}

async function handleSave() {
  const body = noteTextarea.value.trim();

  try {
    if (currentNoteId) {
      await updateNote(currentNoteId, body);
      showToast('Note updated');
    } else if (body) {
      const note = await createNote(body);
      currentNoteId = note.id;
      deleteBtn.style.display = 'flex';
      showToast('Note created');
    }
  } catch (err) {
    console.error('Save failed:', err);
    showToast('Failed to save');
  }

  showListView();
}

async function handleDelete() {
  if (!currentNoteId) return;

  try {
    await deleteNote(currentNoteId);
    showToast('Note deleted');
    currentNoteId = null;
    showListView();
  } catch (err) {
    console.error('Delete failed:', err);
    showToast('Failed to delete');
  }
}

// ── Utilities ──────────────────────────────────────────────────
function getTitle(note) {
  const body = (note.body || '').trim();
  if (!body) return 'Untitled Note';
  const firstLine = body.split('\n')[0];
  return firstLine.length > 60 ? firstLine.substring(0, 60) + '…' : firstLine;
}

function getPreview(note) {
  const body = (note.body || '').trim();
  if (!body) return 'No content';
  const lines = body.split('\n');
  const rest = lines.slice(1).join(' ').trim();
  return rest || lines[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;

  // Less than 1 minute
  if (diff < 60000) return 'Just now';
  // Less than 1 hour
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  // Less than 24 hours
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  // Less than 7 days
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── Toast ──────────────────────────────────────────────────────
function showToast(message) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2000);
}
