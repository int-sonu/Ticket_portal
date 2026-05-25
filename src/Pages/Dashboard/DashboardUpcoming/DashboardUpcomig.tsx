import { useEffect, useMemo, useState } from "react";
import {
  HeaderBanner,
  ListHeader,
  ProfileSwitcher,
} from "../../../Components/Dashboard/Index";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AntTable,
  InputSearch,
  PrimaryButton,
} from "../../../Components/ui/Index";
import {
  PeriodFormat,
  searchFilterData,
} from "../../../Components/utils/Utils";
import OnSiteIcon from "../../../assets/icons/ticketOpenedIcon.svg";
import transferIcon from "../../../assets/icons/ticketReOpenedIcon.svg";
import sharedIcon from "../../../assets/icons/sendIcon.svg";
import mergeIcon from "../../../assets/icons/mergeIcon.svg";
import { useAppSelector } from "../../../store/hooks";
import { RootState } from "../../../store";
import { useFetchDashboardUpcomingTicketList } from "./Hooks";
import useSetUserCreds from "../../../Hooks/useSetUserCreds";
import { useFetchUserListAll } from "../../../Components/Dashboard/AdminCard/Hooks";
import { Popover } from "antd";
import { usePermissions } from "../../../common/sidebar/usePermissions";
import { toast } from "react-toastify";
import OnGoingListRepairIcon from "../../../assets/icons/ongoingListRepairIcon.svg";
import ViewStatusIcon from "../../../assets/icons/viewStatusIcon.svg";
import RepairItemsModal from "../../Tickets/TicketModals/ItemRepair/List/Modal/RepairItemsModal";
import RepairTimelineModal from "../../Tickets/TicketModals/ItemRepair/List/Modal/RepairTimelineModal";
import { useFetchItemRepairActivityList } from "../../Tickets/Hooks/Hooks";

const DashboardUpcomig = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  const { hasPermission } = usePermissions();

  const startDate = location.state?.startDate ?? "";
  const endDate = location.state?.endDate ?? "";

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const userCreds = useSetUserCreds();
  const [agentRole, setAgentRole] = useState<number>(2);
  const [cAgentId, setcAgentId] = useState<string>("");
  const [summaryFilter, setSummaryFilter] = useState<any>();
  const [selectSummary, setSelectSummary] = useState<string>("");
  const [isRepairStatusOpen, setIsRepairStatusOpen] = useState(false);
  const [selectedRepairRecord, setSelectedRepairRecord] = useState<any>(null);
  const [itemRepairTimeLineModal, setItemRepairTimeLineModal] = useState(false);
  const [itemRepairTimeLineData, setItemRepairTimeLineData] =
    useState<any>(null);

  const handleAgentId = (id: string) => {
    setcAgentId(id);
  };

  const handleAgentRole = (roleNo: number) => {
    setAgentRole(roleNo);
  };

  useEffect(() => {
    setcAgentId(state.AgentId);
  }, [state]);

  useEffect(() => {
    if (!userCreds) return;
    setAgentRole(userCreds.nType);
  }, [userCreds]);

  useFetchDashboardUpcomingTicketList(
    userCreds,
    state.startDate,
    state.endDate,
    state.dMode,
    cAgentId,
  );

  useFetchItemRepairActivityList(
    userCreds,
    itemRepairTimeLineData?.nCallPartId,
  );

  const { DashboardUpcomingListData } = useAppSelector(
    (state: RootState) => state.DashboardUpcomingListSlice,
  );

  const { RepairItemActivityListData } = useAppSelector(
    (state: RootState) => state.RepairItemActivityListSlice,
  );

  useFetchUserListAll(userCreds);

  const dataSet: any[] = [
    {
      label: "Pending",
      value: (DashboardUpcomingListData ?? [])?.filter(
        (item: any) => item.nticketstatus === 1,
      ).length,
    },
    {
      label: "OnHold",
      value: (DashboardUpcomingListData ?? [])?.filter(
        (item: any) => item.nticketstatus === 2,
      ).length,
    },
  ];

  useEffect(() => {
    if (itemRepairTimeLineData?.nCallPartId && RepairItemActivityListData) {
      setItemRepairTimeLineModal(true);
    }
  }, [itemRepairTimeLineData, RepairItemActivityListData]);

  const handleView = (record: any) => {
    if (!hasPermission("ticket-view")) {
      toast.error("You don't have permission to view tickets.");
      return;
    }

    navigate("/tickets/view", {
      state: {
        selectedRow: record,
        title: "Upcoming",
        isFrom: "Upcoming",
        isDashboard: true,
      },
    });
  };

  const handleOpenRepairStatus = (record: any, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const repairs = record?.partsRepair || [];

    if (repairs.length === 1) {
      // only one item -> open timeline directly
      setItemRepairTimeLineData(repairs[0]);
      setItemRepairTimeLineModal(true);
      setIsRepairStatusOpen(false);
      setSelectedRepairRecord(null);
      return;
    }

    if (repairs.length > 1) {
      // more than one item -> open current flow modal
      setSelectedRepairRecord(record);
      setIsRepairStatusOpen(true);
    }
  };

  const getSingleRepairText = (repair: any) => {
    const itemName = repair?.cPartName || repair?.cAssetName || "Item";
    return `${itemName}`;
  };

  const getRepairDisplayText = (record: any) => {
    const repairs = record?.partsRepair || [];

    if (repairs.length === 0) return "";

    if (repairs.length === 1) {
      return getSingleRepairText(repairs[0]);
    }

    return `${repairs.length} Items Taken for Repair`;
  };

  const getRepairStatusText = (repair: any) => {
    if (repair?.nRepairStatus === 1) return "Assigned";
    return repair?.cStatusName;
  };

  const handleRepairTimelineClick = (item: any) => {
    setItemRepairTimeLineData(item);
    setItemRepairTimeLineModal(true);
  };

  const renderSummaryWithRepairLink = (text: string, record: any) => {
    const repairs = record?.partsRepair || [];
    const hasRepair = repairs.length > 0;
    const repairText = getRepairDisplayText(record);

    const isVerified =
      repairs.length > 0 &&
      repairs.every(
        (item: any) =>
          item?.nRepairStatus === 16 ||
          item?.nRepairStatus === 12 ||
          item?.nRepairStatus === 6,
      );

    return (
      <div className={`cursor-pointer ${hasRepair ? " " : ""}`}>
        <div className={`${hasRepair ? " content-center" : ""}`}>{text}</div>

        {hasRepair && (
          <div
            className="flex bottom-0 items-center bg-[#F0F5FE] border border-[#D2E0F9] rounded-md justify-between mt-1 p-1"
            onClick={(e) => handleOpenRepairStatus(record, e)}
          >
            <div className="text-[#1664F8] text-[11px] flex items-center gap-2">
              <img src={OnGoingListRepairIcon} alt="" />
              {repairText}
            </div>

            <button
              type="button"
              className="text-[#20A5DE] text-[11px] bg-transparent z-10 border-none p-0 cursor-pointer flex items-center gap-1"
              onClick={(e) => handleOpenRepairStatus(record, e)}
            >
              {!isVerified && <img src={ViewStatusIcon} alt="" />}
              <span className={`${isVerified ? "text-[#1CBF8E]" : ""}`}>
                {repairs.length === 1 ? getRepairStatusText(repairs[0]) : "View Status"}
              </span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const columns = [
    {
      title: "Srl",
      render: (_: any, __: any, index: number) =>
        index + 1 + (currentPage - 1) * pageSize,
      onCell: (record: any) => ({
        onClick: () => handleView(record),
      }),
      width: 50,
    },
    {
      title: "Scheduled on",
      dataIndex: "cScheduleDate",
      render: (index: number, record: any) => (
        <p
          onClick={() => handleView(record)}
          className="w-full cursor-pointer"
          key={index}
        >
          {record.dCreatedDate}{" "}
          <span className="text-[#838383]">
            ({PeriodFormat(record?.cPeriod)})
          </span>
          {record.cViewSummary && (
            <div className="text-[#1664F8] text-[11px] mt-1">
              {record.cViewSummary}
            </div>
          )}
        </p>
      ),
      onCell: (record: any) => ({
        onClick: () => handleView(record),
      }),
      width: 250,
    },
    {
      title: "Ticket No.",
      dataIndex: "nTicketNo",
      render: (text: string) => <p className="cursor-pointer">{text}</p>,
      onCell: (record: any) => ({
        onClick: () => handleView(record),
      }),
      width: 100,
    },
    {
      title: "Agent Name",
      dataIndex: "assigndetails",
      render: (index: number, record: any) => (
        <p
          onClick={() => handleView(record)}
          className="w-full cursor-pointer"
          key={index}
        >
          {record.assigndetails
            ?.map((agent: any) => agent.agentName)
            .join(", ")}
        </p>
      ),
      onCell: (record: any) => ({
        onClick: () => handleView(record),
      }),
      width: 150,
    },
    {
      title: "Customer Name",
      dataIndex: "cCustomerName",
      render: (text: string) => <p className="cursor-pointer">{text}</p>,
      onCell: (record: any) => ({
        onClick: () => handleView(record),
      }),
      width: 150,
    },
    {
      title: "Ticket Summary",
      dataIndex: "cTicketSummary",
      width: 260,
      render: (index: number, record: any) => (
        <p
          onClick={() => handleView(record)}
          className="w-full cursor-pointer"
          key={index}
        >
          <p>{renderSummaryWithRepairLink(record.cTicketSummary, record)}</p>
        </p>
      ),
      onCell: (record: any) => ({
        onClick: () => handleView(record),
      }),
    },
    {
      title: "Priority",
      dataIndex: "cPriority",
      render: (text: string) => <p className="cursor-pointer">{text}</p>,
      onCell: (record: any) => ({
        onClick: () => handleView(record),
      }),
      width: 100,
    },
    {
      title: "Status",
      dataIndex: "cTicketStatus",
      render: (text: string) => <p className="cursor-pointer">{text}</p>,
      onCell: (record: any) => ({
        onClick: () => handleView(record),
      }),
      width: 60,
    },
    {
      title: "",
      render: (_: any, record: any) => (
        <img
          src={
            record?.bOnSite === true
              ? OnSiteIcon
              : record?.bTransfered === true
                ? transferIcon
                : record?.bShared === true
                  ? sharedIcon
                  : record?.bMerged === true
                    ? mergeIcon
                    : ""
          }
          alt=""
        />
      ),
      width: 50,
    },
  ];

  const isLoginUserSwitchable: boolean =
    agentRole === 0 || agentRole === 1 || agentRole === 2;

  const filteredData = useMemo(() => {
    if (selectSummary) {
      return DashboardUpcomingListData?.filter((item: any) => {
        return item.cTicketStatus === selectSummary;
      });
    }
    return DashboardUpcomingListData;
  }, [DashboardUpcomingListData, selectSummary]);

  return (
    <div className="main-padding bg-[#FBFBFB]">
      <ListHeader title="Upcoming" />
      <div
        className={`flex gap-80 ${
          agentRole === 0 || agentRole === 1 || agentRole === 2
            ? "justify-between items-center"
            : "justify-end"
        }  py-2 w-full mt-2`}
      >
        {isLoginUserSwitchable && (
          <ProfileSwitcher
            role={agentRole}
            cAgentId={cAgentId}
            handleAgentId={handleAgentId}
            handleAgentRole={handleAgentRole}
          />
        )}
        <div className="w-full flex items-center justify-end gap-2">
          <Popover
            arrow={false}
            trigger="click"
            placement="bottomLeft"
            rootClassName="custom-calendar"
            content={
              <div className="flex flex-col gap-2 p-2">
                {dataSet?.map((item, index) => (
                  <p
                    key={index}
                    className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                    onClick={() => {
                      setSelectSummary(item.label);
                      setSummaryFilter(false);
                    }}
                  >
                    {item.label}
                  </p>
                ))}
                {summaryFilter && (
                  <p
                    className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-red-500"
                    onClick={() => {
                      setSelectSummary("");
                      setSummaryFilter(false);
                    }}
                  >
                    Clear Filter
                  </p>
                )}
              </div>
            }
            open={summaryFilter}
            onOpenChange={setSummaryFilter}
          >
            <PrimaryButton
              searchFilter
              text="Filter"
              onSearchFilterClick={() => setSummaryFilter(!summaryFilter)}
            />
          </Popover>
          <InputSearch
            value={searchTerm}
            onChange={setSearchTerm}
            width={
              agentRole === 0 || agentRole === 1 || agentRole === 2
                ? "80%"
                : "35%"
            }
            className={`border border-[#E4E4E4] bg-white `}
          />
        </div>
      </div>
      <HeaderBanner
        title="Upcoming Summary"
        nTotalTktNo={DashboardUpcomingListData?.length ?? 0}
        dataSet={dataSet}
        className="mt-3"
      />
      <div>
        <AntTable
          columns={columns}
          data={searchFilterData(filteredData, searchTerm)}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          keyId="key"
          scrollX="max-content"
          scrollY={365}
          additionalHeight={300}
          isCheckBox={false}
          pagination={true}
          loading={false}
        />
      </div>
      <RepairItemsModal
        open={isRepairStatusOpen}
        data={selectedRepairRecord}
        onClose={() => {
          setIsRepairStatusOpen(false);
          setSelectedRepairRecord(null);
        }}
        onItemClick={(repair) => {
          setIsRepairStatusOpen(false);
          handleRepairTimelineClick(repair);
        }}
      />

      <RepairTimelineModal
        open={itemRepairTimeLineModal}
        data={RepairItemActivityListData}
        itemName={getSingleRepairText(itemRepairTimeLineData)}
        onClose={() => {
          setItemRepairTimeLineModal(false);
          setItemRepairTimeLineData(null);
          setIsRepairStatusOpen(false);
        }}
      />
    </div>
  );
};

export default DashboardUpcomig;
