import dayjs from "dayjs";
import type { Notification } from "./Utils";
import { Empty } from "antd";

interface Props {
  tabData: Notification[];
  clearNotification :(id : number) => void;
  onNotificationClick?: (item: Notification) => void;
}

const NotificationList: React.FC<Props> = ({ tabData,clearNotification, onNotificationClick }) => {
  const groupedNotifications = tabData?.reduce((groups, item) => {
    const date = item.nDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, Notification[]>);

  const highlightRecordId = (text: string) => {
    const regex = /(N \d+)/g;

    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <strong key={index} className="font-[500] text-[12px]">
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  return (
    <>
      <div className="my-2"></div>
      <div className="h-[260px] overflow-y-auto overflow-x-hidden space-y-5 pr-2">
        {tabData?.length === 0 ? (
          <div className="flex justify-center items-center h-full text-[12px] text-[#000000] font-[300]">
            <Empty description="No Notifications" />
          </div>
        ) : (
          Object.entries(groupedNotifications)?.map(([date, notifications]) => (
            <div key={date}>
              <p className="font-[300] text-[14px] text-[#000000] mb-2">
                {dayjs(date).format("DD/MM/YYYY")}
              </p>
              {notifications?.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-start p-2 gap-3 rounded-md hover:bg-[#F5FBFF] transition-colors">
                    <img
                      src={item.icon}
                      alt="Notification Icon"
                      className="w-[34px] h-[35px]"
                    />
                    <div
                      className={`flex-1 text-[14px] text-[#000000] font-[300] mx-2 ${onNotificationClick ? "cursor-pointer" : ""}`}
                      onClick={() => onNotificationClick?.(item)}
                    >
                      <p>{highlightRecordId(item.title)}</p>
                      <p className="text-[12px] text-[#000000] font-[300] whitespace-nowrap">
                        {item.cTime}
                      </p>
                    </div>
                    <div className="flex-col gap-2 items-center text-center">
                      {item.bRead === false && (
                        <p className="w-[10px] h-[10px] rounded-full bg-[#019BF9] inline-block"></p>
                      )}
                      <p
                        className="text-[12px] text-[#FF3333] font-[500] whitespace-nowrap cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); clearNotification(item.id); }}
                      >
                        Clear
                      </p>
                    </div>
                  </div>
                  {index < notifications.length - 1 && (
                    <div className="mt-4 w-[395px] ml-16">
                      <hr style={{ borderTop: "0.5px solid #dedede" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default NotificationList;
