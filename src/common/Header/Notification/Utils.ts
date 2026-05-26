import notificationusericon1 from "../../../assets/icons/notificationusericon1.svg";
import notificationusericon2 from "../../../assets/icons/notificationusericon2.svg";

export interface Notification {
    id: number;
    title: string;
    icon: string;
    cTime: string;
    cNotificationType ?: string;
    nDate: string;
    bRead?: boolean;
    cType?: string;
    nFormId?: number;
}




export const notificationList : Notification[] = [
  {
    id: 1,
    title:
      "R 785623 was Approved by Linda Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    icon: notificationusericon1,
    cTime: "10 : 45 AM",
    cNotificationType: "",
    nDate: "Today",
  },
  {
    id: 2,
    title:
      "Jacob commented on R 7856 Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    icon: notificationusericon2,
    cTime: "10 : 45 AM",
    cNotificationType: "",
    nDate: "Today",
  },
  {
    id: 3,
    title:
      "Jacob commented on R 178256 Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    icon: notificationusericon2,
    cTime: "10 : 45 AM",
    cNotificationType: "",
    nDate: "Today",
  },
  {
    id: 3,
    title:
      "R 7856 was Approved by Linda Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    icon: notificationusericon1,
    cTime: "10 : 45 AM",
    nDate: "Yesterday",
     cNotificationType: "Unread",
  },
  {
    id: 4,
    title:
      "Jacob commented on R 7856 Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    icon: notificationusericon2,
    cTime: "10 : 45 AM",
    cNotificationType: "Unread",
    nDate: "Yesterday",
  },
];
