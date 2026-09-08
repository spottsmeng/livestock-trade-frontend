import { buyerApi } from "@/lib/buyer-api";

/** Web Push (§10) needs the VAPID public key as a raw Uint8Array, but the
 * server hands it out (and scripts/generate_vapid_keys.py prints it) as a
 * base64url string — this is the standard conversion. */
function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

/**
 * Registers this device for Web Push, once the service worker is ready.
 * A no-op (not an error) whenever any prerequisite is missing — no VAPID
 * key configured, permission denied, or the browser lacks Push API
 * support — since WS + polling remain functional delivery channels
 * regardless (§10's whole point is redundancy).
 */
export async function ensurePushSubscription(accessToken: string | null): Promise<void> {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey || !accessToken) return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

    await buyerApi.subscribePush(
      { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, ua: navigator.userAgent },
      accessToken
    );
  } catch {
    // Best-effort — push is the alerting channel, not the only one.
  }
}
