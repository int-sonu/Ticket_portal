// Browser-notification permission prompt. Called from the Dashboard mount.
//
// IMPORTANT: Modern Chrome silently returns "default" from
// Notification.requestPermission() when it's called outside a user-gesture
// context (e.g. from a useEffect after page load). The native dialog is only
// shown if the call originates from a click/keypress handler. So we don't
// auto-prompt — instead we show an Antd toast with an "Allow" button. The
// button's onClick is a real user gesture and reliably triggers the dialog.

import React from "react";
import { notification as antdNotification, Button } from "antd";
import { getFcmVapidKey } from "../../../Axios/config";
import { getWebMessaging } from "../../../Firebase/Firebase";

let hasShownThisSession = false;

const ENABLE_KEY = "webpush-enable-prompt";
const DENIED_KEY = "webpush-permission-denied";
const SUCCESS_KEY = "webpush-enabled";

async function requestAndReact(): Promise<void> {
  try {
    const result = await window.Notification.requestPermission();
    antdNotification.destroy(ENABLE_KEY);
    if (result === "granted") {
      antdNotification.success({
        key: SUCCESS_KEY,
        message: "Notifications enabled",
        description:
          "You'll now receive real-time alerts. Refreshing to activate…",
        placement: "topRight",
        duration: 2,
      });
      // useWebPush only runs its FCM registration once per userCreds change.
      // A short reload guarantees it picks up the new "granted" state and
      // wires getToken + onMessage on the next mount. UX cost: ~1s flicker.
      window.setTimeout(() => window.location.reload(), 1500);
    } else if (result === "denied") {
      antdNotification.warning({
        key: DENIED_KEY,
        message: "Notifications blocked",
        description:
          "Click the lock icon in the address bar → Site settings → Notifications → Allow, then reload the page.",
        placement: "topRight",
        duration: 8,
      });
    }
  } catch (err) {
    console.warn("[WebPush] requestPermission failed:", err);
  }
}

export async function promptWebPushPermission(): Promise<void> {
  if (hasShownThisSession) return;
  hasShownThisSession = true;

  try {
    if (!getFcmVapidKey()) return;
    if (!("Notification" in window)) return;
    const messaging = await getWebMessaging();
    if (!messaging) return; // covers HTTP-on-LAN insecure-origin case too

    const current = window.Notification.permission;

    if (current === "granted") return; // useWebPush already wires the rest
    if (current === "denied") {
      antdNotification.warning({
        key: DENIED_KEY,
        message: "Browser notifications are off",
        description:
          "You won't get real-time alerts on this browser. To enable, click the lock icon in the address bar → Site settings → Notifications → Allow, then reload the page.",
        placement: "topRight",
        duration: 8,
      });
      return;
    }

    // current === "default" — show a click-to-allow toast. Sticky (duration:0)
    // so the user actually sees and interacts with it.
    antdNotification.open({
      key: ENABLE_KEY,
      message: "Enable browser notifications",
      description:
        "Get real-time alerts for new tickets and updates without keeping this tab focused.",
      placement: "topRight",
      duration: 0,
      btn: (
        <Button type="primary" size="small" onClick={requestAndReact}>
          Allow
        </Button>
      ),
    });
  } catch (err) {
    console.warn("[WebPush] permission prompt skipped:", err);
  }
}
