const THEME_STORAGE_KEY = 'court-calling-theme';
const JOURNAL_STORAGE_KEY = 'court-calling-journal-entries';

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;

  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;

  const icon = toggle.querySelector('.theme-toggle__icon');
  const text = toggle.querySelector('.theme-toggle__text');

  toggle.setAttribute('aria-pressed', String(theme === 'light'));
  if (icon) {
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
  }
  if (text) {
    text.textContent = theme === 'light' ? 'Dark' : 'Light';
  }
}

function initTheme() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const theme = savedTheme || (prefersLight ? 'light' : 'dark');
  applyTheme(theme);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getMoodClass(mood) {
  const normalized = (mood || 'Reflective').toLowerCase();
  if (normalized.includes('grateful')) return 'journal-entry--grateful';
  if (normalized.includes('focused')) return 'journal-entry--focused';
  if (normalized.includes('hopeful')) return 'journal-entry--hopeful';
  if (normalized.includes('determined')) return 'journal-entry--determined';
  return 'journal-entry--reflective';
}

function initJournal() {
  const form = document.getElementById('journal-form');
  const list = document.getElementById('journal-entries');
  const emptyState = document.getElementById('journal-empty');
  const clearButton = document.getElementById('clear-journal');

  if (!form || !list) return;

  const today = new Date().toISOString().slice(0, 10);
  const dateInput = document.getElementById('journal-date');
  if (dateInput) {
    dateInput.value = today;
  }

  function loadEntries() {
    try {
      const saved = window.localStorage.getItem(JOURNAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  }

  function saveEntries(entries) {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
  }

  function formatDate(value) {
    if (!value) return 'Today';
    return new Date(value).toLocaleDateString('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function renderEntries() {
    const entries = loadEntries()
      .map((entry) => ({ ...entry, favorite: Boolean(entry.favorite) }))
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || new Date(b.date || 0) - new Date(a.date || 0));

    if (entries.length === 0) {
      list.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;

    list.innerHTML = entries
      .map((entry) => {
        const tags = entry.tags
          ? entry.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : [];
        const moodClass = getMoodClass(entry.mood);

        return `
          <article class="journal-entry ${moodClass} ${entry.favorite ? 'journal-entry--favorite' : ''}">
            <div class="journal-entry__top">
              <div>
                <h3>${escapeHtml(entry.title || 'Untitled Entry')}</h3>
                <p class="journal-entry__meta">${escapeHtml(formatDate(entry.date))} • ${escapeHtml(entry.mood || 'Reflective')}</p>
              </div>
              <div class="journal-entry__actions">
                <button class="favorite-button ${entry.favorite ? 'active' : ''}" type="button" data-favorite="${entry.id}" aria-label="Toggle favorite">${entry.favorite ? '★' : '☆'}</button>
                <button class="ghost-button" type="button" data-delete="${entry.id}">Delete</button>
              </div>
            </div>
            <p class="journal-entry__focus">Focus: ${escapeHtml(entry.focus || 'Growth')}</p>
            <p class="journal-entry__text">${escapeHtml(entry.text).replace(/\n/g, '<br>')}</p>
            ${tags.length ? `<div class="journal-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
          </article>
        `;
      })
      .join('');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const entry = {
      id: Date.now().toString(),
      title: document.getElementById('journal-title').value.trim(),
      date: document.getElementById('journal-date').value,
      mood: document.getElementById('journal-mood').value,
      focus: document.getElementById('journal-focus').value.trim(),
      tags: document.getElementById('journal-tags').value.trim(),
      text: document.getElementById('journal-text').value.trim(),
      favorite: false
    };

    if (!entry.title || !entry.text) {
      window.alert('Please add a title and a reflection before saving.');
      return;
    }

    const entries = loadEntries();
    entries.unshift(entry);
    saveEntries(entries);
    renderEntries();
    form.reset();
    if (dateInput) dateInput.value = today;
  });

  list.addEventListener('click', (event) => {
    const deleteButton = event.target.closest('[data-delete]');
    if (deleteButton) {
      const entries = loadEntries().filter((entry) => entry.id !== deleteButton.getAttribute('data-delete'));
      saveEntries(entries);
      renderEntries();
      return;
    }

    const favoriteButton = event.target.closest('[data-favorite]');
    if (!favoriteButton) return;

    const entries = loadEntries().map((entry) =>
      entry.id === favoriteButton.getAttribute('data-favorite')
        ? { ...entry, favorite: !entry.favorite }
        : entry
    );
    saveEntries(entries);
    renderEntries();
  });

  clearButton?.addEventListener('click', () => {
    saveEntries([]);
    renderEntries();
  });

  renderEntries();
}

window.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const currentTheme = document.body.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  }

  initTheme();
  initJournal();
});
