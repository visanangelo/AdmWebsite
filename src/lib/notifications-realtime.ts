import { getSupabaseClient } from "@/features/shared/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Type of the payload delivered by Supabase Realtime.
 */
export interface NotificationsPayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: unknown;
  old: unknown;
}

export type NotificationsCallback = (payload: NotificationsPayload) => void;

let channelSingleton: RealtimeChannel | null = null;
const listeners = new Set<NotificationsCallback>();

/**
 * Creates the singleton channel (if it doesn't exist) and returns it.
 */
function ensureChannel(): RealtimeChannel {
  if (channelSingleton) return channelSingleton;

  channelSingleton = getSupabaseClient()
    .channel("notifications_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications" },
      (payload) => {
        // Fan‑out to local listeners
        listeners.forEach((cb) => cb(payload as NotificationsPayload));
      }
    )
    .subscribe();

  return channelSingleton;
}

/**
 * Register a callback. Returns an unsubscribe fn.
 */
export function addNotificationsListener(cb: NotificationsCallback) {
  listeners.add(cb);
  ensureChannel();
  return () => listeners.delete(cb);
}

/**
 * Cleanly close the channel – e.g. when user signs out.
 */
export async function closeNotificationsChannel() {
  if (!channelSingleton) return;
  await getSupabaseClient().removeChannel(channelSingleton);
  channelSingleton = null;
  listeners.clear();
} 