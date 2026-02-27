"use client";

const GUEST_ID_KEY = "essentia_guest_id";
const GUEST_ID_COOKIE = "essentia_guest_id";

/**
 * Generates a stable anonymous guest ID for wishlist sync.
 */
export function generateGuestId(): string {
  return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Gets or creates guest ID from localStorage (client-side).
 * Persists to cookie for server-side reads. Cookie max-age 1 year.
 */
export function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = generateGuestId();
    localStorage.setItem(GUEST_ID_KEY, id);
    document.cookie = `${GUEST_ID_COOKIE}=${id};path=/;max-age=31536000;SameSite=Lax`;
  } else {
    if (!document.cookie.includes(`${GUEST_ID_COOKIE}=`)) {
      document.cookie = `${GUEST_ID_COOKIE}=${id};path=/;max-age=31536000;SameSite=Lax`;
    }
  }
  return id;
}

/**
 * Reads guest ID from cookie (server-side or client).
 */
export function getGuestIdFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${GUEST_ID_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}
