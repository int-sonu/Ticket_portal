import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { RootState } from "../../../store";
import { UserCredsType } from "../../../Types/userType";
import { NotificationList,clearNotificationListSlice } from "../../../store/Notifications/NotificationListSlice";

// How often the bell auto-refreshes when web push isn't available. Used as a
// fallback for users who declined the browser permission or are on a browser
// that doesn't support FCM. When push IS active, the timer is skipped entirely
// because `useWebPush.onMessage` refreshes the list in real time on each event.
// 60s balances freshness against API load.
const POLL_INTERVAL_MS = 60000;

export const useFetchNotificationList = (
  userCreds: UserCredsType | undefined,
  addSuccess?: boolean,
  updateSuccess?: boolean,
  deleteSuccess?: boolean
) => {
  const dispach = useAppDispatch();
  // True once the browser FCM token has been registered with the backend —
  // proxy for "this tab is receiving real-time notifications via FCM".
  const webPushActive = useAppSelector(
    (state: RootState) => state.RegisterFcmTokenSlice?.RegisterFcmSuccess === true
  );

  useEffect(() => {
    if (!userCreds) return;

    const listPayload: any = {
      nAgentId: userCreds.id,
      cDbName: userCreds.cDbName ?? userCreds.dbName,
      cSchemaName: userCreds.cSchemaName,
      nCompanyId: userCreds.nCompanyId,
    };
    async function fetchData() {
      try {
        await dispach(NotificationList(listPayload));
      } catch (error) {
        console.error("Failed to fetch data:", error);
        clearNotificationListSlice();
      }
    }
    fetchData();

    // Always re-fetch when the tab regains focus (cheap insurance against a
    // missed FCM message while the tab was backgrounded).
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchData();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Only run the polling timer when web push isn't active. Once the FCM
    // token is registered, onMessage handles real-time refresh and the timer
    // would just be redundant load on the API.
    let intervalId: number | null = null;
    if (!webPushActive) {
      const tick = () => {
        if (document.visibilityState === "visible") fetchData();
      };
      intervalId = window.setInterval(tick, POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalId !== null) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [dispach, userCreds, addSuccess, updateSuccess, deleteSuccess, webPushActive]);
};


// export const useFetchLeaveApplicationView = (
//   userCreds: UserCredsType | undefined
// ) => {
//   const dispach = useAppDispatch();

//   useEffect(() => {
//     if (!userCreds) return;

//     const listPayload: LeaveApplicationListPayload = {
//       nAgentId: userCreds.id,
//       cDbName: userCreds.dbName,
//       cSchemaName: userCreds.cSchemaName,
//       nCompanyId: userCreds.nCompanyId,
//     };
//     async function fetchData() {
//       try {
//         await dispach(LeaveApplicationList(listPayload));
//       } catch (error) {
//         console.error("Failed to fetch data:", error);
//       }
//     }
//     fetchData();
//   }, [dispach, userCreds]);
// };
