// /js/activity.js
import { addDoc, collection, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

/**
 * Write a single activity record.
 * @param {object} deps  { db, auth }
 * @param {string} action e.g. "post:create", "post:update", "post:delete", "user:update"
 * @param {string} target a short description or id (e.g. post title or user email)
 * @param {object} extra  optional object with any additional fields
 */
export async function logAction(deps, action, target, extra = {}) {
  const { db, auth } = deps;
  const u = auth?.currentUser;
  try {
    await addDoc(collection(db, "activity"), {
      at: serverTimestamp(),
      action,
      target,
      userUid: u?.uid || null,
      userEmail: u?.email || null,
      userName: u?.displayName || null,
      ...extra
    });
  } catch (e) {
    // Non-fatal; logging should never break normal flows
    console.warn("Activity log failed:", e?.message || e);
  }
}
