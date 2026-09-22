// Leaderboard Service for Mushak Dash (Firebase Firestore Modular v9+)
// Supports Unique Player ID Registration, Device Ownership, Campus Details, & High Scores

import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebaseConfig';

export const LEADERBOARD_COLLECTION = 'leaderboard';

export const PROFILE_STORAGE_KEYS = {
  PLAYER_ID: 'mushak_player_id',
  PLAYER_CAMPUS: 'mushak_player_campus',
  PLAYER_TOKEN: 'mushak_player_token',
  IS_REGISTERED: 'mushak_player_registered',
  LOCAL_BEST: 'mushak_local_best_submitted'
};

/**
 * Ensures a unique client token exists for this browser/device.
 * Used to let returning players keep their claimed unique Player ID.
 */
export function getOrCreatePlayerToken() {
  let token = localStorage.getItem(PROFILE_STORAGE_KEYS.PLAYER_TOKEN);
  if (!token) {
    token = 'tok_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem(PROFILE_STORAGE_KEYS.PLAYER_TOKEN, token);
  }
  return token;
}

/**
 * Retrieves the stored player profile from localStorage.
 */
export function getPlayerProfile() {
  const playerId = (localStorage.getItem(PROFILE_STORAGE_KEYS.PLAYER_ID) || '').trim();
  const campus = (localStorage.getItem(PROFILE_STORAGE_KEYS.PLAYER_CAMPUS) || '').trim();
  const token = getOrCreatePlayerToken();
  const isRegistered = localStorage.getItem(PROFILE_STORAGE_KEYS.IS_REGISTERED) === 'true' && Boolean(playerId);

  return {
    playerId,
    name: playerId,
    campus: campus || 'Main Campus',
    token,
    isRegistered,
    isComplete: isRegistered
  };
}

/**
 * Persists the player ID and campus to localStorage.
 */
export function savePlayerProfile(playerId, campus = '') {
  const cleanId = (playerId || '').trim().slice(0, 30);
  const cleanCampus = (campus || '').trim().slice(0, 50);

  if (cleanId) {
    localStorage.setItem(PROFILE_STORAGE_KEYS.PLAYER_ID, cleanId);
    localStorage.setItem(PROFILE_STORAGE_KEYS.IS_REGISTERED, 'true');
  }
  if (cleanCampus) {
    localStorage.setItem(PROFILE_STORAGE_KEYS.PLAYER_CAMPUS, cleanCampus);
  }
  getOrCreatePlayerToken();

  return {
    playerId: cleanId,
    name: cleanId,
    campus: cleanCampus || 'Main Campus',
    isRegistered: Boolean(cleanId)
  };
}

/**
 * Generates a unique, deterministic document ID for a given player ID.
 * Guarantees only ONE record per player in Firestore.
 */
export function getDocId(playerId) {
  return encodeURIComponent(playerId.trim().toLowerCase());
}

/**
 * Validates Player ID syntax:
 * - 3 to 20 characters
 * - Letters, numbers, underscores, and hyphens only
 */
export function validatePlayerId(playerId) {
  const cleanId = (playerId || '').trim();
  if (!cleanId) {
    return { valid: false, message: 'Please enter a Player ID.' };
  }
  if (cleanId.length < 3) {
    return { valid: false, message: 'Player ID must be at least 3 characters long.' };
  }
  if (cleanId.length > 20) {
    return { valid: false, message: 'Player ID cannot exceed 20 characters.' };
  }
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  if (!idRegex.test(cleanId)) {
    return { valid: false, message: 'Use only letters, numbers, underscores (_), and hyphens (-).' };
  }
  return { valid: true, cleanId };
}

/**
 * Checks if a Player ID is available or belongs to this player, and registers it.
 * 
 * @param {string} playerId 
 * @param {string} campus 
 * @returns {Promise<{ success: boolean, message: string, isReturning?: boolean, isTaken?: boolean }>}
 */
export async function checkAndRegisterPlayer(playerId, campus = '') {
  const validation = validatePlayerId(playerId);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const cleanId = validation.cleanId;
  const cleanCampus = (campus || '').trim().slice(0, 50) || 'Main Campus';
  const token = getOrCreatePlayerToken();

  // Save profile locally immediately
  savePlayerProfile(cleanId, cleanCampus);

  // If Firebase is not configured or offline, accept locally
  if (!isFirebaseConfigured() || !db) {
    return {
      success: true,
      message: `ID '${cleanId}' set locally (Connect Firebase for live leaderboard)`,
      isOffline: true
    };
  }

  try {
    const docId = getDocId(cleanId);
    const docRef = doc(db, LEADERBOARD_COLLECTION, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const existingToken = data.ownerToken;

      // Returning player on the same device!
      if (!existingToken || existingToken === token) {
        // Update campus and associate token if it was unlinked
        await setDoc(docRef, {
          playerId: cleanId,
          campus: cleanCampus,
          ownerToken: token,
          timestamp: serverTimestamp()
        }, { merge: true });

        return {
          success: true,
          isReturning: true,
          message: `Welcome back, ${cleanId}! Your record is verified.`
        };
      } else {
        // Owned by a different device / player
        return {
          success: false,
          isTaken: true,
          message: `Player ID '${cleanId}' is already taken. Please choose a unique ID!`
        };
      }
    } else {
      // Available unique ID: claim it immediately!
      await setDoc(docRef, {
        playerId: cleanId,
        campus: cleanCampus,
        score: 0,
        ownerToken: token,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp()
      });

      return {
        success: true,
        message: `🎉 Player ID '${cleanId}' registered successfully!`
      };
    }
  } catch (error) {
    console.warn('[LeaderboardService] Player registration notice (stored locally):', error);
    return {
      success: true,
      message: `Player ID '${cleanId}' registered!`,
      isOffline: true
    };
  }
}

/**
 * Submits a score for the player ID and campus.
 * Only updates Firestore if the new score exceeds or equals the player's existing best score.
 * 
 * @param {string} playerId - Player display name / ID
 * @param {number} score - Final run score
 * @param {object} meta - Optional session metadata (campus, modaks, etc.)
 * @returns {Promise<{ success: boolean, isNewBest: boolean, finalScore: number, message: string }>}
 */
export async function submitScore(playerId, score, meta = {}) {
  const profile = getPlayerProfile();
  const cleanId = (playerId || profile.playerId || '').trim();
  const cleanCampus = (meta.campus || profile.campus || 'Main Campus').trim().slice(0, 50);
  const numericScore = Math.max(0, Math.floor(Number(score) || 0));
  const token = getOrCreatePlayerToken();

  // 1. Client-side sanity validations
  const validation = validatePlayerId(cleanId);
  if (!validation.valid) {
    return { success: false, isNewBest: false, finalScore: numericScore, message: validation.message };
  }

  // Plausible maximum score check
  if (numericScore > 100000) {
    return { success: false, isNewBest: false, finalScore: numericScore, message: 'Score out of acceptable bounds' };
  }

  // Update local storage
  savePlayerProfile(cleanId, cleanCampus);

  // 2. Check if Firebase is active
  if (!isFirebaseConfigured() || !db) {
    const prevBest = parseInt(localStorage.getItem(PROFILE_STORAGE_KEYS.LOCAL_BEST) || '0', 10);
    const isNewBest = numericScore > prevBest;
    if (isNewBest || prevBest === 0) {
      localStorage.setItem(PROFILE_STORAGE_KEYS.LOCAL_BEST, numericScore.toString());
    }

    return {
      success: true,
      isOffline: true,
      isNewBest,
      finalScore: Math.max(numericScore, prevBest),
      message: 'Score saved locally'
    };
  }

  try {
    const docId = getDocId(cleanId);
    const docRef = doc(db, LEADERBOARD_COLLECTION, docId);

    // 3. Check for existing entry
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const existingData = docSnap.data();
      const existingScore = Number(existingData.score) || 0;

      if (numericScore > existingScore) {
        // New Personal Best: Update score, campus & timestamp
        await setDoc(docRef, {
          playerId: cleanId,
          campus: cleanCampus,
          score: numericScore,
          ownerToken: token,
          timestamp: serverTimestamp()
        }, { merge: true });

        const prevBest = parseInt(localStorage.getItem(PROFILE_STORAGE_KEYS.LOCAL_BEST) || '0', 10);
        if (numericScore > prevBest) {
          localStorage.setItem(PROFILE_STORAGE_KEYS.LOCAL_BEST, numericScore.toString());
        }

        return {
          success: true,
          isNewBest: true,
          finalScore: numericScore,
          message: '🌟 New Personal Best recorded on Leaderboard!'
        };
      } else {
        // Always ensure campus and token are up to date
        await setDoc(docRef, {
          campus: cleanCampus,
          ownerToken: token
        }, { merge: true });

        return {
          success: true,
          isNewBest: false,
          finalScore: existingScore,
          message: `Score submitted! Best remains ${existingScore}`
        };
      }
    } else {
      // 4. First time submission for this player
      await setDoc(docRef, {
        playerId: cleanId,
        campus: cleanCampus,
        score: numericScore,
        ownerToken: token,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp()
      });

      localStorage.setItem(PROFILE_STORAGE_KEYS.LOCAL_BEST, numericScore.toString());

      return {
        success: true,
        isNewBest: true,
        finalScore: numericScore,
        message: '🎉 High score registered on Leaderboard!'
      };
    }
  } catch (error) {
    console.warn('[LeaderboardService] Score submission error (saving locally):', error);
    const prevBest = parseInt(localStorage.getItem(PROFILE_STORAGE_KEYS.LOCAL_BEST) || '0', 10);
    const isNewBest = numericScore > prevBest;
    if (isNewBest) {
      localStorage.setItem(PROFILE_STORAGE_KEYS.LOCAL_BEST, numericScore.toString());
    }
    return {
      success: true,
      isOffline: true,
      isNewBest,
      finalScore: Math.max(numericScore, prevBest),
      message: 'Score saved locally'
    };
  }
}

/**
 * Fetches top scores from Firestore ordered by score descending.
 * 
 * @param {number} limitCount - Maximum number of scores (default 20)
 * @returns {Promise<{ success: boolean, scores: Array, isOffline: boolean, message: string }>}
 */
export async function getTopScores(limitCount = 20) {
  if (!isFirebaseConfigured() || !db) {
    const profile = getPlayerProfile();
    const localBest = parseInt(localStorage.getItem(PROFILE_STORAGE_KEYS.LOCAL_BEST) || '0', 10);
    const offlineScores = [];

    if (profile.playerId) {
      offlineScores.push({
        rank: 1,
        id: 'local_user',
        playerId: profile.playerId,
        campus: profile.campus || 'Main Campus',
        score: localBest,
        isCurrentPlayer: true,
        timestamp: Date.now()
      });
    }

    return {
      success: true,
      scores: offlineScores,
      isOffline: true,
      message: 'Local rankings (Vercel credentials required for live global rankings)'
    };
  }

  try {
    const colRef = collection(db, LEADERBOARD_COLLECTION);
    const q = query(
      colRef,
      orderBy('score', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const scores = [];
    const profile = getPlayerProfile();
    let rank = 1;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const pId = data.playerId || data.playerName || 'Runner';
      const campus = data.campus || data.campusName || 'Main Campus';
      const isCurrentPlayer = (
        Boolean(profile.playerId) &&
        pId.toLowerCase() === profile.playerId.toLowerCase()
      );

      scores.push({
        rank: rank++,
        id: docSnap.id,
        playerId: pId,
        campus: campus,
        score: Number(data.score) || 0,
        timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : (data.timestamp || Date.now()),
        isCurrentPlayer
      });
    });

    return {
      success: true,
      scores,
      isOffline: false,
      message: scores.length === 0 ? 'No scores recorded yet. Be the first to set a record!' : 'Live scores loaded'
    };
  } catch (error) {
    console.warn('[LeaderboardService] Fetch scores error:', error);
    const profile = getPlayerProfile();
    const localBest = parseInt(localStorage.getItem(PROFILE_STORAGE_KEYS.LOCAL_BEST) || '0', 10);
    const offlineScores = [];

    if (profile.playerId) {
      offlineScores.push({
        rank: 1,
        id: 'local_user',
        playerId: profile.playerId,
        campus: profile.campus || 'Main Campus',
        score: localBest,
        isCurrentPlayer: true,
        timestamp: Date.now()
      });
    }

    return {
      success: true,
      scores: offlineScores,
      isOffline: true,
      message: 'Offline rankings (Verify Firebase Firestore rules & credentials)'
    };
  }
}
