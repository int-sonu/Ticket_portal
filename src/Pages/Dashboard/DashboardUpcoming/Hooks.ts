import { useEffect } from "react";
import { useAppDispatch } from "../../../store/hooks";
import { DashboardUpcomingList } from "../../../store/Dashboard/DashboardUpcomingListSlice";
import { UserCredsType } from "../Utils";
import dayjs from "dayjs";

export const useFetchDashboardUpcomingTicketList = (
  userCreds: UserCredsType | undefined,
  dFromDate: string,
  dToDate: string,
  nMode: number,
  cAgentId: string
) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!userCreds) return;
    if (!cAgentId || cAgentId === "") return;
    if (!dFromDate || !dToDate) return;

    const listPayload = {
      cAgentId: cAgentId,
      nMode: 0,
      dFromDate: dayjs().format("YYYY/MM/DD"),
      dToDate: dayjs().format("YYYY/MM/DD"),
      nCompanyId: userCreds.nCompanyId,
      cSchemaName: userCreds.cSchemaName,
      cDbName: userCreds.dbName,
    };

    async function fetchData() {
      try {
        await dispatch(DashboardUpcomingList(listPayload));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }

    fetchData();
  }, [dispatch, userCreds, dFromDate, dToDate, nMode, cAgentId]);
};
