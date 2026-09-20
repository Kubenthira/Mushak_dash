// Leaderboard Service for Mushak Dash (Firebase Firestore Modular v9+)
// Simple, clean Player ID & Score tracking with best-score-only guarantee.

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
  LOCAL_BEST: 'mushak_local_best_submitted'
};

/**
 * Retrieves the stored player profile from localStorage.
 */
export function getPlayerProfile() {
  const playerId = localStorage.getItem(PROFILE_STORAGE_KEYS.PLAYER_ID) || '';
  return {
    playerId,
    name: playerId, // alias for convenience
    isComplete: Boolean(playerId.trim())
  };
}

/**
 * Persists the player ID to localStorage.
 */
export function savePlayerProfile(playerId) {
  const cleanId = (playerId || '').trim().slice(0, 30);
  if (cleanId) {
    localStorage.setItem(PROFILE_STORAGE_KEYS.PLAYER_ID, cleanId);
  }
  return { playerId: cleanId, name: cleanId };
}

/**
 * Generates a unique, deterministic document ID for a given player ID.
 * Guarantees only ONE record per player in Firestore.
 */
export function getDocId(playerId) {
  return encodeURIComponent(playerId.trim().toLowerCase());
}

/**
 * Submits a score for the player ID.
 * Only updates Firestore if the new score exceeds the player's existing best score.
 * 
 * @param {string} playerId - Player display name / ID
 * @param {number} score - Final run score
 * @param {object} meta - Optional session metadata
 * @returns {Promise<{ success: boolean, isNewBest: boolean, finalScore: number, message: string }>}
 */
export async function submitScore(playerId, score, meta = {}) {
  const cleanId = (playerId || '').trim();
  const numericScore = Math.floor(Number(score) || 0);

  // 1. Client-side sanity validations
  if (!cleanId || cleanId.length < 1 || cleanId.length > 30) {
    return { success: false, isNewBest: false, finalScore: numericScore, message: 'Invalid player ID' };
  }

  // Anti-cheat limit check: Plausible maximum score
  if (numericScore <= 0 || numericScore > 100000) {
    return { success: false, isNewBest: false, finalScore: numericScore, message: 'Score out of acceptable bounds' };
  }

  // Save profile locally
  savePlayerProfile(cleanId);

  // 2. Check if Firebase is active
  if (!isFirebaseConfigured() || !db) {
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
      message: 'Score saved locally (Firebase credentials pending)'
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
        // New Personal Best: Update score & timestamp
        await setDoc(docRef, {
          playerId: cleanId,
          score: numericScore,
          timestamp: serverTimestamp()
        }, { merge: true });

        return {
          success: true,
          isNewBest: true,
          finalScore: numericScore,
          message: '🌟 New Personal Best recorded on Leaderboard!'
        };
      } else {
        // Existing score is higher or equal: do not overwrite
        return {
          success: true,
          isNewBest: false,
          finalScore: existingScore,
          message: `Best score remains ${existingScore}`
        };
      }
    } else {
      // 4. First time submission for this player
      await setDoc(docRef, {
        playerId: cleanId,
        score: numericScore,
        timestamp: serverTimestamp()
      });

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
 * No composite index needed!
 * 
 * @param {number} limitCount - Maximum number of scores (default 20)
 * @returns {Promise<{ success: boolean, scores: Array, isOffline: boolean, message: string }>}
 */
export async function getTopScores(limitCount = 20) {
  if (!isFirebaseConfigured() || !db) {
    // Fallback offline preview
    const profile = getPlayerProfile();
    const localBest = parseInt(localStorage.getItem(PROFILE_STORAGE_KEYS.LOCAL_BEST) || '0', 10);
    const offlineScores = [];

    if (profile.playerId && localBest > 0) {
      offlineScores.push({
        rank: 1,
        id: 'local_user',
        playerId: profile.playerId,
        score: localBest,
        isCurrentPlayer: true,
        timestamp: Date.now()
      });
    }

    return {
      success: true,
      scores: offlineScores,
      isOffline: true,
      message: 'Local offline rankings (Add Firestore rules/keys for global live rankings)'
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
      const pId = data.playerId || data.playerName || 'Anonymous';
      const isCurrentPlayer = (
        Boolean(profile.playerId) &&
        pId.toLowerCase() === profile.playerId.toLowerCase()
      );

      scores.push({
        rank: rank++,
        id: docSnap.id,
        playerId: pId,
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
    console.warn('[LeaderboardService] Fetch scores error (falling back to local):', error);
    const profile = getPlayerProfile();
    const localBest = parseInt(localStorage.getItem(PROFILE_STORAGE_KEYS.LOCAL_BEST) || '0', 10);
    const offlineScores = [];

    if (profile.playerId && localBest > 0) {
      offlineScores.push({
        rank: 1,
        id: 'local_user',
        playerId: profile.playerId,
        score: localBest,
        isCurrentPlayer: true,
        timestamp: Date.now()
      });
    }

    return {
      success: true,
      scores: offlineScores,
      isOffline: true,
      message: 'Local offline rankings (Add Firestore rules/keys for global live rankings)'
    };
  }
}
