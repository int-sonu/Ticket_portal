import { useEffect } from "react";
import { useAppDispatch } from "../../../../store/hooks";
import {
  clearCustomerProfileViewSlice,
  CustomerProfileView,
} from "../../../../store/More/CustomerDetails/CustomerProfileViewSlice";
import useSetUserCreds from "../../../../Hooks/useSetUserCreds";
import {
  clearCustomerBillListSlice,
  CustomerBillList,
} from "../../../../store/More/CustomerDetails/CustomerBillListSlice";
import {
  clearCustomerTicketListSlice,
  CustomerTicketList,
} from "../../../../store/More/CustomerDetails/CustomerTicketListSlice";
import {
  clearCustomerAssetListSlice,
  CustomerAssetList,
} from "../../../../store/More/CustomerDetails/CustomerAssetListSlice";
import {
  clearCustomerAlterContactsListSlice,
  CustomerAlterContactsList,
} from "../../../../store/More/CustomerDetails/CustomerAlterContactsListSlice";
import { UserCredsType } from "../Utils";
import {
  clearCustomerWiseActiveTicketListSlice,
  CustomerWiseActiveTicketList,
} from "../../../../store/Tickets/TicketList/CustomerWiseTicketListSlice";

export const useFetchAllCustomerList = (
  activeTab: number,
  nCustomerId?: number
) => {
  const dispatch = useAppDispatch();
  const userCreds = useSetUserCreds();

  useEffect(() => {
    if (!nCustomerId || !userCreds?.nCompanyId) return;

    const fetchCustomerProfile = async () => {
      const listPayload = {
        nCustomerId,
        nCompanyId: userCreds.nCompanyId,
        cSchemaName: userCreds.cSchemaName,
        cDbName: userCreds.dbName,
      };

      try {
        await dispatch(CustomerProfileView(listPayload));
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        dispatch(clearCustomerProfileViewSlice());
      }
    };

    const fetchAlterContactsProfile = async () => {
      const listPayload = {
        nCustomerId,
        nCompanyId: userCreds.nCompanyId,
        cSchemaName: userCreds.cSchemaName,
        cDbName: userCreds.dbName,
      };

      try {
        await dispatch(CustomerAlterContactsList(listPayload));
      } catch (error) {
        console.error("Failed to altercontacts profile:", error);
      } finally {
        dispatch(clearCustomerAlterContactsListSlice());
      }
    };

    const fetchTicketList = async () => {
      const listPayload = {
        nCustomerId,
        nAgentId: userCreds.id,
        nCompanyId: userCreds.nCompanyId,
        cSchemaName: userCreds.cSchemaName,
        cDbName: userCreds.dbName,
      };

      try {
        await dispatch(CustomerTicketList(listPayload));
      } catch (error) {
        console.error("Failed to fetch Tickets:", error);
      } finally {
        dispatch(clearCustomerTicketListSlice());
      }
    };

    const fetchBillList = async () => {
      const listPayload = {
        nCustomerId,
        nCompanyId: userCreds.nCompanyId,
        cSchemaName: userCreds.cSchemaName,
        cDbName: userCreds.dbName,
      };

      try {
        await dispatch(CustomerBillList(listPayload));
      } catch (error) {
        console.error("Failed to fetch bills:", error);
      } finally {
        dispatch(clearCustomerBillListSlice());
      }
    };
    const fetchAssetList = async () => {
      const listPayload = {
        nCustomerId,
        nCompanyId: userCreds.nCompanyId,
        cSchemaName: userCreds.cSchemaName,
        cDbName: userCreds.dbName,
      };

      try {
        await dispatch(CustomerAssetList(listPayload));
      } catch (error) {
        console.error("Failed to fetch Assets:", error);
      } finally {
        dispatch(clearCustomerAssetListSlice());
      }
    };
    const run = async () => {
      try {
        switch (activeTab) {
          case 1:
            fetchCustomerProfile();
            fetchAlterContactsProfile();
            break;
          case 2:
            fetchTicketList();
            break;
          case 3:
            fetchBillList();
            break;
          case 4:
            fetchAssetList();
            break;
          default:
            break;
        }
      } catch (err) {
        console.error(err);
      }
    };
    run();
  }, [dispatch, activeTab, nCustomerId, userCreds]);
};

export const useFetchCustomerWiseAllTicketList = (
  userCreds: UserCredsType | undefined,
  customerId?: number
) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!userCreds || !customerId) return;

    const fetchData = async () => {
      const listPayload = {
        nCustomerId: customerId,
        nAgentId: userCreds.id,
        nCompanyId: userCreds.nCompanyId,
        cSchemaName: userCreds.cSchemaName,
        cDbName: userCreds.dbName,
      };

      try {
        await dispatch(CustomerTicketList(listPayload));
      } catch (error) {
        console.error("Failed to fetch Tickets:", error);
      } finally {
        dispatch(clearCustomerTicketListSlice());
      }
    };

    fetchData();
  }, [dispatch, userCreds, customerId]);
};

export const useFetchCustomerWiseActiveTicketList = (
  userCreds: UserCredsType | undefined,
  customerId?: number | null
) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!userCreds || !customerId) return;

    const fetchData = async () => {
      const listPayload = {
        nCustomerId: customerId,
        nAgentId: userCreds.id,
        nCompanyId: userCreds.nCompanyId,
        cSchemaName: userCreds.cSchemaName,
        cDbName: userCreds.dbName,
      };

      try {
        await dispatch(CustomerWiseActiveTicketList(listPayload));
      } catch (error) {
        console.error("Failed to fetch Tickets:", error);
      } finally {
        dispatch(clearCustomerWiseActiveTicketListSlice());
      }
    };

    fetchData();
  }, [dispatch, userCreds, customerId]);
};
