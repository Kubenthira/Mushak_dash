// UI Helper for Player ID & Campus Registration Modal
// Enforces unique Player ID check against Firestore and campus detail storage.

import {
  getPlayerProfile,
  checkAndRegisterPlayer,
  validatePlayerId
} from '../services/leaderboardService';
import { sounds } from './audio';

const ID_PREFIXES = ['Mushak', 'GaneshRider', 'ModakRunner', 'PrasadDash', 'Vakratunda', 'Vinayaka', 'BappaRider', 'SpeedyMouse'];

function generateRandomId() {
  const prefix = ID_PREFIXES[Math.floor(Math.random() * ID_PREFIXES.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}_${num}`;
}

export function setupProfileModal(onSaveCallback, isMandatory = false) {
  const modal = document.getElementById('profile-modal');
  const form = document.getElementById('profile-form');
  const idInput = document.getElementById('input-player-name');
  const campusInput = document.getElementById('input-player-campus');
  const closeBtn = document.getElementById('btn-close-modal');
  const randomBtn = document.getElementById('btn-random-id');
  const feedbackEl = document.getElementById('profile-feedback');
  const submitBtn = document.getElementById('btn-save-profile');
  const submitText = document.getElementById('btn-save-text');
  const titleText = document.getElementById('modal-title-text');

  if (!modal || !form || !idInput) return;

  const current = getPlayerProfile();
  if (idInput && !idInput.value) {
    idInput.value = current.playerId || '';
  }
  if (campusInput && !campusInput.value) {
    campusInput.value = current.campus !== 'Main Campus' ? current.campus : '';
  }

  // Update title based on whether player is editing or first-time registering
  if (titleText) {
    titleText.textContent = current.isRegistered ? 'EDIT RUNNER PROFILE' : 'REGISTER UNIQUE RUNNER';
  }

  // Close button handling
  if (closeBtn) {
    // If mandatory (e.g. before starting game for first-time runners) and no ID registered, hide or alert
    if (isMandatory && !current.isRegistered) {
      closeBtn.style.display = 'none';
    } else {
      closeBtn.style.display = 'flex';
      closeBtn.onclick = () => {
        sounds.playClick();
        hideProfileModal();
      };
    }
  }

  // Stop propagation on inputs so Phaser never sees or prevents default on A, S, D, W, or Space
  const stopKeyPropagation = (e) => {
    e.stopPropagation();
  };
  ['keydown', 'keyup', 'keypress'].forEach((evt) => {
    idInput.addEventListener(evt, stopKeyPropagation);
    if (campusInput) {
      campusInput.addEventListener(evt, stopKeyPropagation);
    }
  });

  const onInputFocus = () => {
    if (window.__MUSHAK_GAME_INSTANCE__?.input?.keyboard) {
      window.__MUSHAK_GAME_INSTANCE__.input.keyboard.enabled = false;
    }
  };
  idInput.addEventListener('focus', onInputFocus);
  if (campusInput) campusInput.addEventListener('focus', onInputFocus);

  // Suggest ID Button
  if (randomBtn) {
    randomBtn.onclick = (e) => {
      e.preventDefault();
      sounds.playClick();
      idInput.value = generateRandomId();
      idInput.focus();
      clearFeedback();
    };
  }

  function showFeedback(message, type = 'error') {
    if (!feedbackEl) return;
    feedbackEl.textContent = message;
    feedbackEl.className = `profile-feedback show ${type}`;
  }

  function clearFeedback() {
    if (!feedbackEl) return;
    feedbackEl.textContent = '';
    feedbackEl.className = 'profile-feedback hidden';
  }

  idInput.oninput = () => clearFeedback();

  // Handle Form Submission
  form.onsubmit = async (e) => {
    e.preventDefault();
    const rawId = idInput.value.trim();
    const rawCampus = campusInput ? campusInput.value.trim() : '';

    const validation = validatePlayerId(rawId);
    if (!validation.valid) {
      showFeedback(`⚠️ ${validation.message}`, 'error');
      sounds.playHit();
      idInput.focus();
      return;
    }

    // Set loading state
    submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'VERIFYING ID...';
    showFeedback('⏳ Checking ID uniqueness in Temple Leaderboard...', 'info');

    try {
      const res = await checkAndRegisterPlayer(rawId, rawCampus);

      if (!res.success) {
        // Player ID is taken or invalid
        sounds.playHit();
        showFeedback(`❌ ${res.message}`, 'error');
        submitBtn.disabled = false;
        if (submitText) submitText.textContent = 'TRY ANOTHER ID';
        idInput.focus();
        return;
      }

      // Success! ID is either new & registered or returning player
      sounds.playBlessing();
      showFeedback(`✅ ${res.message}`, 'success');

      setTimeout(() => {
        hideProfileModal();
        submitBtn.disabled = false;
        if (submitText) submitText.textContent = 'CONFIRM & ENTER FESTIVAL';
        if (typeof onSaveCallback === 'function') {
          onSaveCallback(getPlayerProfile());
        }
      }, 650);

    } catch (err) {
      console.error('[ProfileModal] Error:', err);
      sounds.playBlessing();
      hideProfileModal();
      submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'CONFIRM & ENTER FESTIVAL';
      if (typeof onSaveCallback === 'function') {
        onSaveCallback(getPlayerProfile());
      }
    }
  };
}

export function showProfileModal(onSaveCallback, isMandatory = false) {
  const modal = document.getElementById('profile-modal');
  const idInput = document.getElementById('input-player-name');
  const campusInput = document.getElementById('input-player-campus');
  const feedbackEl = document.getElementById('profile-feedback');

  if (!modal) return;

  const current = getPlayerProfile();
  if (idInput) idInput.value = current.playerId || '';
  if (campusInput) campusInput.value = current.campus !== 'Main Campus' ? current.campus : '';
  if (feedbackEl) {
    feedbackEl.textContent = '';
    feedbackEl.className = 'profile-feedback hidden';
  }

  setupProfileModal(onSaveCallback, isMandatory);
  modal.classList.add('active');

  // Disable Phaser keyboard so game inputs (A, S, D, W, Space) don't intercept typing
  if (window.__MUSHAK_GAME_INSTANCE__?.input?.keyboard) {
    window.__MUSHAK_GAME_INSTANCE__.input.keyboard.enabled = false;
  }

  setTimeout(() => {
    if (idInput && !idInput.value) {
      idInput.focus();
    }
  }, 120);
}

export function hideProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  // Re-enable Phaser keyboard input when modal closes
  if (window.__MUSHAK_GAME_INSTANCE__?.input?.keyboard) {
    window.__MUSHAK_GAME_INSTANCE__.input.keyboard.enabled = true;
  }
}
