import { Modal } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationList, type Notification } from "./Utils";
import NotificationList from "./NotificationList";
import { RootState } from "../../../store";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { useFetchNotificationList } from "./Hook";
import useSetUserCreds from "../../../Hooks/useSetUserCreds";
import notificationusericon2 from "../../../assets/icons/notificationusericon2.svg";
import { NotificationClear } from "../../../store/Notifications/NotificationClearSlice";
import { NotificationClearAll } from "../../../store/Notifications/NotificationClearAllSlice";
import { toast } from "react-toastify";
import { clearNotificationListSlice, NotificationList as fetchNotificationList } from "../../../store/Notifications/NotificationListSlice";
import { navigateByType } from "./notificationRoutes";
interface ChangePasswordProps {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
}

const Notifications: React.FC<ChangePasswordProps> = ({
  isModalOpen,
  setIsModalOpen,
}) => {
  const [tabData, setTabData] = useState<Notification[]>([]);
  const userCreds = useSetUserCreds();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { NotificationListData } = useAppSelector(
    (state: RootState) => state.NotificationListSlice
  );

  useFetchNotificationList(userCreds, false, false, false);

useEffect(() => {
  const filteredData: Notification[] = NotificationListData?.map((item :any) => ({
    id: item?.nNotifId ?? 0,
    title: item?.cNotification ?? "",
    nDate: item?.cDate?.split("T")[0] ?? "",
    cTime: item?.cDate?.split("T")[1]?.slice(0, 5) ?? "",
    icon: notificationusericon2,
    bRead: item?.bRead,
    cType: item?.cType,
    nFormId: item?.nFormId,
  })) ?? [];

  setTabData(filteredData);
}, [NotificationListData]);

const refetchNotifications = () => {
  if (!userCreds) return;
  dispatch(fetchNotificationList({
    nAgentId: userCreds.id,
    nCompanyId: userCreds.nCompanyId,
    cSchemaName: userCreds.cSchemaName,
    cDbName: userCreds.dbName,
  }));
};

const handleClearNotification = (id : any)=>{
  const payload = {
    cNotifIds : String(id),
    nAgentId: userCreds?.id,
    nCompanyId: userCreds?.nCompanyId,
    cDbName: userCreds?.dbName,
    cSchemaName: userCreds?.cSchemaName,
  }

  dispatch(NotificationClear(payload)).unwrap().then(() => {
    refetchNotifications();
    toast.success("Notification cleared successfully");
  }).catch(() => {
    toast.error("Failed to clear notification");
  }).finally(() => {
    clearNotificationListSlice();
  })
}

const handleClearAll = () => {
  if (!userCreds) return;
  if (!tabData.length) return;
  dispatch(NotificationClearAll({
    nAgentId: userCreds.id,
    nCompanyId: userCreds.nCompanyId,
    cSchemaName: userCreds.cSchemaName,
    cDbName: userCreds.dbName,
  })).unwrap().then(() => {
    refetchNotifications();
    toast.success("All notifications cleared");
  }).catch(() => {
    toast.error("Failed to clear notifications");
  });
};

const handleNotificationClick = (item: Notification) => {
  const navigated = navigateByType(navigate, item.cType, item.nFormId);
  if (navigated) setIsModalOpen(false);
};


  return (
    <Modal
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      afterOpenChange={() => {}}
      footer={null}
      closeIcon={true}
      mask={false}
      className="custom-notifications-modal p-0"
      title={null}
    >
      {/* Custom Header */}
      {/* pr-9 reserves space for the Antd close X at top-right so the
          Clear All link doesn't sit underneath it. */}
      <div className="bg-[#B8E7F9] px-2 pr-9 border-[#93E1FF] py-3 rounded-t-md text-[16px] font-[500] text-[#1A1A1A]">
        <div className="flex items-center justify-between gap-3">
          <div className="font-[500] text-[20px] text-[#000000]">
            Notifications
          </div>
          {tabData.length > 0 && (
            <span
              className="text-[12px] text-[#FF3333] font-[500] cursor-pointer whitespace-nowrap hover:underline"
              onClick={handleClearAll}
            >
              Clear All
            </span>
          )}
        </div>
        <div className="font-[400] text-[13px] text-[#363636] bg-[#B8E7F9] py-1 rounded">
          You have {NotificationListData?.length} unread notifications
        </div>
      </div>

      {/* Modal Body */}
      <div className="w-full px-2  bg-white rounded-b-md">
        <div className="mt-3">
          <NotificationList
            tabData={tabData}
            clearNotification={(id) => { handleClearNotification(id); }}
            onNotificationClick={handleNotificationClick}
          />
        </div>
      </div>
    </Modal>
  );
};

export default Notifications;
