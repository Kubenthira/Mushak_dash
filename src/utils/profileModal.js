// UI Helper for Player ID Registration Modal
import { getPlayerProfile, savePlayerProfile } from '../services/leaderboardService';

export function setupProfileModal(onSaveCallback) {
  const modal = document.getElementById('profile-modal');
  const form = document.getElementById('profile-form');
  const nameInput = document.getElementById('input-player-name');
  const closeBtn = document.getElementById('btn-close-modal');
  const cancelBtn = document.getElementById('btn-cancel-modal');

  if (!modal || !form || !nameInput) return;

  // Close and Cancel buttons
  if (closeBtn) {
    closeBtn.onclick = () => hideProfileModal();
  }
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      const current = getPlayerProfile();
      if (!current.playerId) {
        savePlayerProfile('MushakRunner');
      }
      hideProfileModal();
      if (typeof onSaveCallback === 'function') {
        onSaveCallback(getPlayerProfile());
      }
    };
  }

  // Handle form submission
  form.onsubmit = (e) => {
    e.preventDefault();
    const playerId = nameInput.value.trim() || 'MushakRunner';

    savePlayerProfile(playerId);
    hideProfileModal();
    if (typeof onSaveCallback === 'function') {
      onSaveCallback({ playerId, name: playerId });
    }
  };
}

export function showProfileModal(onSaveCallback) {
  const modal = document.getElementById('profile-modal');
  const nameInput = document.getElementById('input-player-name');

  if (!modal) return;

  const current = getPlayerProfile();
  if (nameInput) nameInput.value = current.playerId || '';

  setupProfileModal(onSaveCallback);
  modal.classList.add('active');

  setTimeout(() => {
    if (nameInput && !nameInput.value) {
      nameInput.focus();
    }
  }, 100);
}

export function hideProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}
