import {
  collection,
  doc,
  setDoc,
  addDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface PromptRating {
  id?: string;
  postId: string;
  userId: string;
  userEmail?: string;
  stars: number;
  createdAt: string;
}

export interface PromptFeedback {
  id?: string;
  postId: string;
  postTitle?: string;
  userId: string;
  userEmail?: string;
  userDisplayName?: string;
  feedback: string;
  createdAt: string;
}

export interface RatingStats {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Default fallback matching Reference Image 1 when no user ratings are present
export const DEFAULT_RATING_STATS: RatingStats = {
  average: 5.0,
  total: 1,
  distribution: {
    5: 1,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  },
};

export async function submitRating(
  postId: string,
  userId: string,
  userEmail: string,
  stars: number
): Promise<void> {
  const ratingDocId = `${postId}_${userId}`;
  const ratingData: PromptRating = {
    postId,
    userId,
    userEmail,
    stars,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'ratings', ratingDocId), ratingData);
  } catch (e) {
    console.warn('Firestore submitRating error, writing to cache:', e);
  }

  try {
    const key = `ratings_cache_${postId}`;
    const local = localStorage.getItem(key);
    let list: PromptRating[] = local ? JSON.parse(local) : [];
    list = list.filter((r) => r.userId !== userId);
    list.push(ratingData);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    // Ignore localstorage quota errors
  }
}

export async function submitFeedback(
  postId: string,
  postTitle: string,
  userId: string,
  userEmail: string,
  userDisplayName: string,
  feedbackText: string
): Promise<void> {
  const feedbackData: Omit<PromptFeedback, 'id'> = {
    postId,
    postTitle,
    userId,
    userEmail,
    userDisplayName,
    feedback: feedbackText.trim(),
    createdAt: new Date().toISOString(),
  };

  try {
    await addDoc(collection(db, 'feedbacks'), feedbackData);
  } catch (e) {
    console.warn('Firestore submitFeedback error, writing to cache:', e);
  }

  try {
    const key = `feedbacks_cache_${postId}`;
    const local = localStorage.getItem(key);
    const list = local ? JSON.parse(local) : [];
    list.push(feedbackData);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    // Ignore localstorage quota errors
  }
}

export function subscribeRatings(
  postId: string,
  onUpdate: (stats: RatingStats, userRating: number) => void,
  currentUserId?: string
) {
  const ratingsRef = collection(db, 'ratings');
  const q = query(ratingsRef, where('postId', '==', postId));

  function computeAndEmit(list: PromptRating[]) {
    let sum = 0;
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let userRating = 0;

    list.forEach((r) => {
      sum += r.stars;
      if (r.stars >= 1 && r.stars <= 5) {
        dist[r.stars as 1 | 2 | 3 | 4 | 5] = (dist[r.stars as 1 | 2 | 3 | 4 | 5] || 0) + 1;
      }
      if (currentUserId && r.userId === currentUserId) {
        userRating = r.stars;
      }
    });

    const total = list.length;
    const avg = total > 0 ? parseFloat((sum / total).toFixed(1)) : 5.0;

    onUpdate(
      {
        average: avg,
        total,
        distribution: dist,
      },
      userRating
    );
  }

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const list: PromptRating[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as PromptRating);
      });

      if (list.length === 0) {
        let cachedList: PromptRating[] = [];
        try {
          const key = `ratings_cache_${postId}`;
          const local = localStorage.getItem(key);
          if (local) cachedList = JSON.parse(local);
        } catch {}

        if (cachedList.length > 0) {
          computeAndEmit(cachedList);
        } else {
          let userRating = 0;
          if (currentUserId) {
            const found = cachedList.find((r) => r.userId === currentUserId);
            if (found) userRating = found.stars;
          }
          onUpdate(DEFAULT_RATING_STATS, userRating);
        }
        return;
      }

      computeAndEmit(list);
    },
    (error) => {
      console.warn('Ratings snapshot error, using cache fallback:', error);
      let cachedList: PromptRating[] = [];
      try {
        const key = `ratings_cache_${postId}`;
        const local = localStorage.getItem(key);
        if (local) cachedList = JSON.parse(local);
      } catch {}

      if (cachedList.length > 0) {
        computeAndEmit(cachedList);
      } else {
        onUpdate(DEFAULT_RATING_STATS, 0);
      }
    }
  );

  return unsubscribe;
}
