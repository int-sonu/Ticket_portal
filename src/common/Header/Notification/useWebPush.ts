// Web push (FCM browser) lifecycle hook. Runs once per session for the current
// user. Safely no-ops when:
//   - Browser doesn't support FCM (Safari iOS, embedded webviews, no SW)
//   - VAPID key is unset in config.json (deployment without web push)
//   - User declines the browser permission prompt
//
// On success it (1) registers the browser FCM token with the backend, (2) shows
// foreground messages as Antd notifications, and (3) listens for service-worker
// click events (background tap) to deep-link via the same route map as the
// dropdown.

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, onMessage } from "firebase/messaging";
import { notification as antdNotification } from "antd";
import { getWebMessaging } from "../../../Firebase/Firebase";
import { getFcmVapidKey } from "../../../Axios/config";
import { useAppDispatch } from "../../../store/hooks";
import { RegisterFcmToken } from "../../../store/Notifications/RegisterFcmTokenSlice";
import { NotificationList } from "../../../store/Notifications/NotificationListSlice";
import { navigateByType } from "./notificationRoutes";
import type { UserCredsType } from "../../../Types/userType";

export function useWebPush(userCreds: UserCredsType | undefined) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userCreds) return;
    let unsubscribeOnMessage: (() => void) | null = null;

    const swMessageListener = (event: MessageEvent) => {
      const data = event?.data;
      if (data?.source !== "fcm-sw") return;
      const formId = Number(data.nFormId) || 0;
      navigateByType(navigate, data.cType, formId);
    };

    (async () => {
      try {
        const vapidKey = getFcmVapidKey();
        if (!vapidKey) {
          console.warn("[WebPush] skipped: FCM_VAPID_KEY missing in config.json");
          return;
        }

        const messaging = await getWebMessaging();
        if (!messaging) {
          console.warn("[WebPush] skipped: browser does not support FCM");
          return;
        }

        if (!("Notification" in window)) {
          console.warn("[WebPush] skipped: Notification API unavailable");
          return;
        }
        const permission = window.Notification.permission;
        console.log("[WebPush] current permission:", permission);

        // No auto requestPermission() here — Chrome silently no-ops it outside
        // a user gesture, masking the issue. The Dashboard's "Allow" toast
        // (promptWebPushPermission) is what triggers the native dialog from
        // a real click. We only proceed when permission is already granted.
        if (permission !== "granted") {
          console.warn(
            "[WebPush] permission is",
            permission,
            "— waiting for user to grant via the dashboard toast"
          );
          return;
        }

        const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("[WebPush] service worker registered, scope:", swReg.scope);

        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: swReg,
        });
        console.log("[WebPush] FCM token:", token ? token.slice(0, 20) + "…" : "(empty)");

        if (token) {
          await dispatch(RegisterFcmToken({
            nAgentId: userCreds.id,
            nCompanyId: userCreds.nCompanyId,
            cFcmToken: token,
            cPlatform: "web",
            cSchemaName: userCreds.cSchemaName,
            cDbName: userCreds.dbName,
          }));
          console.log("[WebPush] token registered with backend for agent", userCreds.id);
        }

        // Foreground messages: show an Antd toast and refresh the bell list so
        // the new row appears without waiting for the next dropdown open.
        unsubscribeOnMessage = onMessage(messaging, (payload) => {
          console.log("[WebPush] onMessage fired:", payload);
          const title = payload?.notification?.title || payload?.data?.cTitle || "Notification";
          const body = payload?.notification?.body || payload?.data?.cBody || "";
          const cType = payload?.data?.cType;
          const nFormId = Number(payload?.data?.nFormId) || 0;

          antdNotification.open({
            message: title,
            description: body,
            placement: "topRight",
            duration: 6,
            onClick: () => navigateByType(navigate, cType, nFormId),
          });

          dispatch(NotificationList({
            nAgentId: userCreds.id,
            nCompanyId: userCreds.nCompanyId,
            cSchemaName: userCreds.cSchemaName,
            cDbName: userCreds.dbName,
          }));
        });
        console.log("[WebPush] onMessage listener attached, ready to receive foreground pushes");

        navigator.serviceWorker.addEventListener("message", swMessageListener);
      } catch (err) {
        console.warn("[WebPush] setup failed:", err);
      }
    })();

    return () => {
      if (unsubscribeOnMessage) unsubscribeOnMessage();
      navigator.serviceWorker?.removeEventListener?.("message", swMessageListener);
    };
  }, [userCreds, dispatch, navigate]);
}
