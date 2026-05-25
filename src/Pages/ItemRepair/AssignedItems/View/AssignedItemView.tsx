import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import closeIcon from "../../../../assets/icons/close-black.svg";
import { PrimaryButton } from "../../../../Components/ui/Index";
import { Dropdown, Spin } from "antd";
import dayjs from "dayjs";
import "./Tabs/AssignedItemRepairView.css";
import CommonModalFileUpload from "../../../../Components/ItemRepair/AssignItemForRepair/Modal/CommonModalFileUpload";
import { itemDetails } from "../Utils";
import RepairTicketCard from "../../AssignItemForRepair/Add/RepairitemLeft/RepairTicketCard";
import ItemForRepairTabView from "../../AssignItemForRepair/View/Tabs/ItemForRepairTabView";
import RejectModal from "../../AssignItemForRepair/View/Modal/RejectModal";
import PartReplaceItemListModal from "./Modal/PartReplaceModal";
import PartsDetailsModal from "./Modal/PartsDetailsModal";
import { useFetchItemRepairView } from "../../AssignItemForRepair/Hooks";
import useSetUserCreds from "../../../../Hooks/useSetUserCreds";
import useSuperUser from "../../../../Hooks/useSuperUser";
import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { RootState } from "../../../../store";
import { ItemRepairAction } from "../../../../store/ItemRepair/ItemRepairActionSlice";
import { useFetchVendorList } from "../../../../Components/ItemRepair/AssignItemForRepair/Add/Hooks";
import { useFetchAgentList } from "../../../../Components/ReportComponents/Modal/ModalContent/Hooks";
import { toast } from "react-toastify";
import useFetchPartList from "../../../Master/Parts/Hooks";
import { ItemRepaitPartsReplaceSave } from "../../../../store/ItemRepair/ItemRepaitPartsReplaceSaveSlice";
import { useFetchFeatures } from "../../../Settings/Features/Hooks";
import useSetFeatureSettings from "../../../../Hooks/useSetFeaturesSettings";

const AssignedItemView = () => {
  const location = useLocation();
  const selectedRow = location.state.record;
  const isFrom = location.state.isFrom;
  const currentTab = location.state.record.tab;
  const currentStatus = selectedRow.nRepairStatus;
  const subRepairStatus = selectedRow.nSubRepairStatus;
  const isAdminViewOnly = location.state.isAdminViewOnly;
  const [item, setItem] = React.useState<any>(itemDetails);
  const [openIssueModal, setOpenIssueModal] = useState(false);
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [openCustomerWaitingModal, setOpenCustomerWaitingModal] =
    useState(false);
  const [verifyModal, setVerifyModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [startClick, setStartClick] = useState(false);
  const [transFerModal, setTransFerModal] = useState(false);
  const [notRepairableModal, setNotRepairableModal] = useState(false);
  const [waitingSpareModal, setWaitingSpareModal] = useState(false);
  const [repairCompletedModal, setRepairCompletedModal] = useState(false);
  const [onHoldModal, setOnHoldModal] = useState(false);
  const [partsNeedExternalRepairModal, setPartsNeedExternalRepairModal] =
    useState(false);
  const [partsReplaceModal, setPartsReplaceModal] = useState(false);
  const [selectedPartData, setSelectedPartData] = useState<any>({});
  const [partsDetailsModal, setPartsDetailsModal] = useState<any>(false);
  const [customerApprovalModal, setCustomerApprovalModal] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userCreds = useSetUserCreds();
  const { canWrite: suCanWrite, isViewOnly: isSuViewOnly } = useSuperUser();
  useFetchFeatures(userCreds);
  const FeaturesData = useSetFeatureSettings();

  const bItemReturnToAgent = FeaturesData
    ? FeaturesData[0].bItemReturnToAgent
    : false;

  const bExternalRepairVerify = FeaturesData
    ? FeaturesData[0].bExternalRepairVerify
    : false;

  const { ItemRepairActionSuccess } = useAppSelector(
    (state: RootState) => state.ItemRepairActionSlice,
  );

  const { ItemRepairActionUpdateSuccess } = useAppSelector(
    (state: RootState) => state.ItemRepairActionUpdateSlice,
  );

  const { ItemRepairActionDeleteSuccess } = useAppSelector(
    (state: RootState) => state.ItemRepairActionDeleteSlice,
  );

  const { ItemRepairPartsReplaceUpdateSuccess } = useAppSelector(
    (state: RootState) => state.ItemRepairPartsReplaceUpdateSlice,
  );

  const { ItemRepairPartsReplaceDeleteSuccess } = useAppSelector(
    (state: RootState) => state.ItemRepairPartsReplaceDeleteSlice,
  );

  const { ItemRepaitPartsReplaceSaveSuccess } = useAppSelector(
    (state: RootState) => state.ItemRepairPartsReplaceSaveSlice,
  );

  useFetchItemRepairView(
    userCreds,
    selectedRow?.nCallPartId,
    ItemRepairActionSuccess,
    ItemRepairActionUpdateSuccess,
    ItemRepairActionDeleteSuccess,
    ItemRepairPartsReplaceUpdateSuccess,
    ItemRepairPartsReplaceDeleteSuccess,
    ItemRepaitPartsReplaceSaveSuccess,
  );

  const { RepairItemDetailsViewData, RepairItemDetailsViewFetching } =
    useAppSelector((state: RootState) => state.RepairItemDetailsViewSlice);

  useFetchVendorList(userCreds);
  useFetchAgentList(userCreds);
  useFetchPartList(false, false, false, userCreds);

  const { PartListData } = useAppSelector(
    (state: RootState) => state.PartListSlice,
  );

  const { VendorListData } = useAppSelector(
    (state: RootState) => state.VendorDropDownSlice,
  );

  const { AgentDropDownListData } = useAppSelector(
    (state: RootState) => state.AgentDropDownListSlice,
  );

  const vendorOptions = VendorListData?.map((vendor: any) => ({
    value: vendor.nVendorId,
    item: vendor.cVendorName,
  }));

  const agentOptions = AgentDropDownListData?.filter(
    (agent: any) =>
      agent.nAgentId !== userCreds?.id && !agent.bNonSuportingUser,
  ).map((agent: any) => ({
    value: agent.nAgentId,
    item: agent.cAgentName,
  }));

  const partsOptions = PartListData?.map((part: any) => ({
    value: part.nPartId,
    item: part.cPartName,
  }));

  useEffect(() => {
    if (RepairItemDetailsViewData) {
      setItem(RepairItemDetailsViewData);
    }
  }, [RepairItemDetailsViewData]);

  const activeRepairStatus = item?.nRepairStatus ?? selectedRow?.nRepairStatus;
  const activeSubRepairStatus =
    item?.nSubRepairStatus ?? selectedRow?.nSubRepairStatus;
  const activeAssignedTo = selectedRow?.nAssignedTo;
  const lastUpdatedby = selectedRow?.nLastUpdatedById

  const appendFiles = (formData: FormData, files: any[] = []) => {
    if (files?.length) {
      files.forEach((f: any) => {
        formData.append("files", f.originFileObj ?? f);
      });
    }
  };

  const buildActionComment = (values: any) => {
    const commentParts: string[] = [];

    if (values?.cComment?.trim()) {
      commentParts.push(values.cComment.trim());
    }

    if (values?.date && dayjs(values.date).isValid()) {
      commentParts.push(
        `Restart on: ${dayjs(values.date).format("DD/MM/YYYY")}`,
      );
    }

    if (values?.isSkip) {
      commentParts.push("[Skipped]");
    }

    return commentParts.join("\n");
  };

  const submitItemRepairAction = async ({
    status,
    values = {},
    successMessage,
    onSuccess,
    appendExtraFields,
  }: {
    status: number;
    values?: any;
    successMessage: string;
    onSuccess?: () => void;
    appendExtraFields?: (formData: FormData, values: any) => void;
  }) => {
    if (!suCanWrite()) return;
    if (actionSubmitting) return;

    const formData = new FormData();
    formData.append("nCompanyId", String(userCreds?.nCompanyId ?? 0));
    formData.append("cSchemaName", userCreds?.cSchemaName ?? "");
    formData.append("nCallPartId", String(selectedRow?.nCallPartId ?? 0));
    formData.append("cComment", buildActionComment(values));
    formData.append("nCreatedBy", String(userCreds?.id ?? 0));
    formData.append("cDbName", userCreds?.dbName ?? "");
    formData.append("nRepairStatus", String(status));

    appendExtraFields?.(formData, values);
    appendFiles(formData, values?.files ?? []);

    setActionSubmitting(true);
    try {
      await dispatch(ItemRepairAction(formData)).unwrap();
      onSuccess?.();
      toast.success(successMessage);
    } catch (error: any) {
      console.error("Failed to update item repair status:", error);
      toast.error(error?.message || "Failed to update item status");
    } finally {
      setActionSubmitting(false);
    }
  };

  const finishedStatus = [
    {
      key: "6",
      label: "Verify",
      onClick: () => {
        if (!suCanWrite()) return;
        setVerifyModal(true);
      },
    },
    {
      key: "15",
      label: "Reject",
      onClick: () => {
        if (!suCanWrite()) return;
        setRejectModal(true);
      },
    },
  ];

  const Status = [
    {
      key: "8",
      label: "Waiting For Customer Approval",
      onClick: () => {
        if (!suCanWrite()) return;
        setOpenCustomerWaitingModal(true);
      },
    },
    {
      key: "16",
      label: "Non Repairable",
      onClick: () => {
        if (!suCanWrite()) return;
        setNotRepairableModal(true);
      },
    },
    {
      key: "9",
      label: "On Hold",
      onClick: () => {
        if (!suCanWrite()) return;
        setOnHoldModal(true);
      },
    },
    {
      key: "10",
      label: "Parts Need External Repair",
      onClick: () => {
        if (!suCanWrite()) return;
        setPartsNeedExternalRepairModal(true);
      },
    },
    {
      key: "11",
      label: "Waiting for Spare",
      onClick: () => {
        if (!suCanWrite()) return;
        setWaitingSpareModal(true);
      },
    },
    {
      key: "12",
      label: "Repair Completed",
      onClick: () => {
        if (!suCanWrite()) return;
        setRepairCompletedModal(true);
      },
    },
  ];

  const handleIssueOK = (values: any) => {
    if (values?.id === 0) return toast.error("Please select a vendor");
    submitItemRepairAction({
      status: 4,
      values,
      successMessage: "Item issued to vendor successfully!",
      appendExtraFields: (formData, currentValues) => {
        formData.append("nVendorId", String(currentValues?.id ?? 0));
      },
      onSuccess: () => {
        setOpenIssueModal(false);
        navigate("/itemrepair/assigneditems");
      },
    });
  };

  const handleAssignOK = (values: any) => {
    if (values?.id === 0) return toast.error("Please select an agent");
    submitItemRepairAction({
      status: 1,
      values,
      successMessage: "Item assigned successfully!",
      appendExtraFields: (formData, currentValues) => {
        formData.append("nAgentId", String(currentValues?.id ?? 0));
      },
      onSuccess: () => {
        setOpenAssignModal(false);
        navigate("/itemrepair/assigneditems");
      },
    });
  };

  const dropdownItems = Status;

  const handleStart = () => {
    if (!suCanWrite()) return;
    submitItemRepairAction({
      status: 3,
      values: {
        cComment: selectedRow?.cComment ?? "",
        files: selectedRow?.files ?? [],
      },
      successMessage: "Item status updated to 'Started' successfully!",
      appendExtraFields: (formData) => {
        formData.append("nAgentId", String(userCreds?.id ?? 0));
      },
      onSuccess: () => {
        setStartClick(true);
      },
    });
  };

  const handletransFerOK = (values: any) => {
    if (!suCanWrite()) return;
    const formData = new FormData();
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (values?.id === 0) return toast.error("Please select a agent");

    const uploadedFiles = Array.isArray(values.files) ? values.files : [];

    const oversizedFile = uploadedFiles.find((f: any) => {
      const actualFile = f?.originFileObj ?? f;
      return actualFile?.size > MAX_FILE_SIZE;
    });

    if (oversizedFile) {
      return toast.error("File size should not exceed 10 MB");
    }

    formData.append("nCompanyId", String(userCreds?.nCompanyId ?? 0));
    formData.append("cSchemaName", userCreds?.cSchemaName ?? "");
    formData.append("nCallPartId", String(selectedRow?.nCallPartId ?? 0));
    formData.append("cComment", values.cComment ?? "");
    formData.append("nCreatedBy", String(userCreds?.id ?? 0));
    formData.append("cDbName", userCreds?.dbName ?? "");
    formData.append("nAgentId", String(values?.id ?? 0));
    formData.append("nRepairStatus", "13");

    if (values.files?.length) {
      values.files.forEach((f: any) => {
        formData.append("files", f.originFileObj ?? f);
      });
    }
    setActionSubmitting(true);
    dispatch(ItemRepairAction(formData))
      .unwrap()
      .then(() => {
        setTransFerModal(false);
        navigate("/itemrepair/assigneditems");
        toast.success("Item transferred successfully!");
      })
      .catch((error: any) => {
        console.error("Failed to transfer item for repair:", error);
        toast.error(error?.message || "Failed to transfer item");
      })
      .finally(() => {
        setActionSubmitting(false);
      });
  };

  const handleWaitingforCustomerApprovalOK = (values: any) => {
    submitItemRepairAction({
      status: 8,
      values,
      successMessage: values?.isSkip
        ? "Customer approval step skipped successfully!"
        : "Item status updated to 'Waiting For Customer Approval' successfully!",
      onSuccess: () => {
        setOpenCustomerWaitingModal(false);
        navigate("/itemrepair/assigneditems");
      },
    });
  };

  const handleOnHoldOK = (values: any) => {
    submitItemRepairAction({
      status: 9,
      values,
      successMessage: "Item status updated to 'On Hold' successfully!",
      onSuccess: () => {
        setOnHoldModal(false);
        navigate("/itemrepair/assigneditems");
      },
    });
  };

  const handlePartsNeedExternalRepairOK = (values: any) => {
    if (!suCanWrite()) return;
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const formData = new FormData();
    if (values?.id === 0) return toast.error("Please select an Part");
    const uploadedFiles = Array.isArray(values.files) ? values.files : [];

    const oversizedFile = uploadedFiles.find((f: any) => {
      const actualFile = f?.originFileObj ?? f;
      return actualFile?.size > MAX_FILE_SIZE;
    });

    if (oversizedFile) {
      return toast.error("File size should not exceed 10 MB");
    }

    formData.append("nCompanyId", String(userCreds?.nCompanyId ?? 0));
    formData.append("cSchemaName", userCreds?.cSchemaName ?? "");
    formData.append("nCallPartId", String(selectedRow?.nCallPartId ?? 0));
    formData.append("nPartId", String(values?.id ?? 0));
    formData.append("cComment", values.cComment ?? "");
    formData.append("nCreatedBy", String(userCreds?.id ?? 0));
    formData.append("cDbName", userCreds?.dbName ?? "");
    formData.append("nAgentId", String(userCreds?.id ?? 0));
    formData.append("nRepairStatus", "10");

    if (values.files?.length) {
      values.files.forEach((f: any) => {
        formData.append("files", f.originFileObj ?? f);
      });
    }
    setActionSubmitting(true);
    dispatch(ItemRepairAction(formData))
      .unwrap()
      .then(() => {
        setPartsNeedExternalRepairModal(false);
        navigate("/itemrepair/assigneditems");
        toast.success("Item status updated successfully!");
      })
      .catch((error: any) => {
        console.error("Failed to transfer item for repair:", error);
        toast.error(error?.message || "Failed to update item status");
      })
      .finally(() => {
        setActionSubmitting(false);
      });
  };

  const handleWaitingSpareOK = (values: any) => {
    submitItemRepairAction({
      status: 11,
      values,
      successMessage:
        "Item status updated to 'Waiting For Spare' successfully!",
      appendExtraFields: (formData) => {
        formData.append("nAgentId", String(userCreds?.id ?? 0));
      },
      onSuccess: () => {
        setWaitingSpareModal(false);
        navigate("/itemrepair/assigneditems");
      },
    });
  };

  const handleRepairCompletedOK = (values: any) => {
    submitItemRepairAction({
      status: 12,
      values,
      successMessage: "Item status updated to 'Repair Completed' successfully!",
      appendExtraFields: (formData) => {
        formData.append("nAgentId", String(userCreds?.id ?? 0));
      },
      onSuccess: () => {
        setRepairCompletedModal(false);
        navigate("/itemrepair/assigneditems");
      },
    });
  };

  const handleNotRepairableOK = (values: any) => {
    submitItemRepairAction({
      status: 16,
      values,
      successMessage: "Item status updated to 'Non Repairable' successfully!",
      appendExtraFields: (formData) => {
        formData.append("nAgentId", String(userCreds?.id ?? 0));
      },
      onSuccess: () => {
        setNotRepairableModal(false);
        navigate("/itemrepair/assigneditems");
      },
    });
  };

  const handleCustomerApprovedOK = (values: any) => {
    submitItemRepairAction({
      status: 14,
      values,
      successMessage: values?.isSkip
        ? "Customer approval continued with skip successfully!"
        : "Item status updated to 'Customer Approved' successfully!",
      onSuccess: () => {
        setCustomerApprovalModal(false);
        if (isFrom === "AssignItemForRepairByCreator") {
          navigate("/itemrepair/assignitemforrepair");
        } else {
          navigate("/itemrepair/assigneditems");
        }
      },
    });
  };

  const handleVerifyOK = (values: any) => {
    submitItemRepairAction({
      status: 6,
      values,
      successMessage: "Item status updated to 'Verified' successfully!",
      appendExtraFields: (formData) => {
        formData.append("nAgentId", String(userCreds?.id ?? 0));
      },
      onSuccess: () => {
        setVerifyModal(false);
        navigate("/itemrepair/assigneditems");
      },
    });
  };

  const handlePartSelect = (item: any) => {
    setSelectedPartData(item);
    setPartsReplaceModal(false);
    setPartsDetailsModal(true);
  };

  const handlePartSelectDone = (values: any) => {
    if (!suCanWrite()) return;
    if (values.nPartRate === 0) return toast.error("Please enter a valid rate");
    if (values.qty === 0) return toast.error("Please enter a valid quantity");
    const formData = new FormData();
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const uploadedFiles = Array.isArray(values.files) ? values.files : [];

    const oversizedFile = uploadedFiles.find((f: any) => {
      const actualFile = f?.originFileObj ?? f;
      return actualFile?.size > MAX_FILE_SIZE;
    });

    if (oversizedFile) {
      return toast.error("File size should not exceed 10 MB");
    }
    formData.append("nCallPartId", String(selectedRow?.nCallPartId ?? 0));
    formData.append("nPartId", String(selectedPartData?.nPartId ?? 0));
    formData.append("nQty", String(values?.qty ?? 0));
    formData.append("nRate", String(values?.nPartRate ?? 0));
    formData.append("nCompanyId", String(userCreds?.nCompanyId ?? 0));
    formData.append("cSchemaName", userCreds?.cSchemaName ?? "");
    formData.append("nCallPartId", String(selectedRow?.nCallPartId ?? 0));
    formData.append("cComment", values.cComment ?? "");
    formData.append("nCreatedBy", String(userCreds?.id ?? 0));
    formData.append("cDbName", userCreds?.dbName ?? "");
    formData.append("nAgentId", String(userCreds?.id ?? 0));

    if (values.files?.length) {
      values.files.forEach((f: any) => {
        formData.append("files", f.originFileObj ?? f);
      });
    }
    setActionSubmitting(true);
    dispatch(ItemRepaitPartsReplaceSave(formData))
      .unwrap()
      .then(() => {
        setPartsDetailsModal(false);
        toast.success("Part replacement added successfully");
      })
      .catch((error: any) => {
        console.error("Failed to transfer item for repair:", error);
        toast.error(error?.message || "Failed to update item status");
      })
      .finally(() => {
        setActionSubmitting(false);
      });
  };

  if (RepairItemDetailsViewFetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin />
      </div>
    );
  }

  const isPartReturnToAgentExternalRepairFlow =
    activeRepairStatus === 10 && activeSubRepairStatus === 17;
  const shouldShowStartButton =
    isPartReturnToAgentExternalRepairFlow ||
    (activeRepairStatus !== 10 && ![8].includes(activeRepairStatus));

  // const canStart =
  //   shouldShowStartButton &&
  //   // normal allowed statuses
  //   (![4, 5, 8, 6,14].includes(activeSubRepairStatus) ||
  //     // special case for status 5
  //     (activeSubRepairStatus === 5 &&
  //       !bItemReturnToAgent &&
  //       !bExternalRepairVerify)); 

  const canStart =
  shouldShowStartButton &&
  (
    // normal allowed statuses
    ![4, 5, 6, 8, 14].includes(activeSubRepairStatus) ||

    // special case for status 5
    (activeSubRepairStatus === 5 &&
      !bItemReturnToAgent &&
      !bExternalRepairVerify) ||

    // special case for status 6
    (activeSubRepairStatus === 6 &&
      !bItemReturnToAgent)
  );

  return (
    <div className="bg-[#FBFBFB] h-screen overflow-y-scroll">
      <div className="w-full flex items-center gap-2 justify-between p-4">
        <h2 className="text-lg font-medium">Item Details</h2>
        <button
          className="text-end cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <img src={closeIcon} alt="close" />
        </button>
      </div>
      <div className="flex w-full justify-between h-[calc(100vh-100px)]">
        <RepairTicketCard
          item={item}
          selectedRow={selectedRow}
          isAdminViewOnly={isAdminViewOnly}
        />
        <div className="mt-2 w-full ">
          <ItemForRepairTabView
            selectedRow={selectedRow}
            item={item}
            isFrom={isFrom}
            currentTab={currentTab}
            isAdminViewOnly={isAdminViewOnly}
          />
        </div>
      </div>
      <div className="fixed bottom-0 right-0 p-4 flex gap-3">
        {!startClick && activeRepairStatus != 3 && !isAdminViewOnly && (
          <div className="flex flex-col justify-center items-end gap-1">
            <div className="mr-2 bg-white">
              <PrimaryButton
                text="Estimate"
                onClick={() => {
                  if (!suCanWrite()) return;
                  navigate("/tickets/estimate", {
                    state: {
                      record: item,
                      selectedRow: {
                        ...selectedRow,
                        nCustomerId: item?.nCustomerId,
                      },
                      isFrom: "ItemRepairEstimate",
                    },
                  });
                }}
                EstimateButton
              />
            </div>
            {canStart && (
              <div className="p-2 bg-[#576B70] flex justify-between items-center gap-10 rounded-md">
                <p className="text-[#F5F5F5] text-[13px]">
                  <span className="font-medium">
                    Hi {userCreds?.cName.split(" ")[0]}
                  </span>
                  , Please click the Start button to proceed with this task.
                </p>
                <p>
                  <PrimaryButton text="Start" onClick={handleStart} />
                </p>
              </div>
            )}
          </div>
        )}

        {currentTab === "Assigned" &&
          (startClick || activeRepairStatus === 3) &&
          !isAdminViewOnly && (
            <>
              <PrimaryButton
                text="Part Replace"
                className="bg-white text-[#1CBF8E]!"
                onClick={() => {
                  if (!suCanWrite()) return;
                  setPartsReplaceModal(true);
                }}
              />
              <PrimaryButton
                text="Estimate"
                EstimateButton
                onClick={() => {
                  if (!suCanWrite()) return;
                  navigate("/tickets/estimate", {
                    state: {
                      record: item,
                      selectedRow: {
                        ...selectedRow,
                        nCustomerId: item?.nCustomerId,
                      },
                      isFrom: "ItemRepairEstimate",
                    },
                  });
                }}
              />
              <PrimaryButton
                text="Transfer"
                TransferButton
                onClick={() => {
                  if (!suCanWrite()) return;
                  setTransFerModal(true);
                }}
              />

              <Dropdown
                menu={{ items: dropdownItems }}
                trigger={["click"]}
                overlayClassName="custom-dropdown"
                disabled={isSuViewOnly}
              >
                <div onClick={() => { if (isSuViewOnly) suCanWrite(); }}>
                  <PrimaryButton text="Update Status" />
                </div>
              </Dropdown>
            </>
          )}

        {activeRepairStatus === 8 &&
          lastUpdatedby == userCreds?.id &&
          !isAdminViewOnly &&
          ![4, 5, 8].includes(activeSubRepairStatus) && (
            <PrimaryButton
              text="Continue"
              onClick={() => {
                if (!suCanWrite()) return;
                setCustomerApprovalModal(true);
              }}
            />
          )}

        {currentTab === "Finished" &&
          activeRepairStatus != 6 &&
          !isAdminViewOnly && (
            <>
              <Dropdown
                menu={{ items: finishedStatus }}
                trigger={["click"]}
                overlayClassName="custom-dropdown"
                disabled={isSuViewOnly}
              >
                <div onClick={() => { if (isSuViewOnly) suCanWrite(); }}>
                  <PrimaryButton text="Update Status" />
                </div>
              </Dropdown>
            </>
          )}
      </div>

      {/* Issue Modal */}
      {openIssueModal && (
        <CommonModalFileUpload
          open={openIssueModal}
          onClose={() => setOpenIssueModal(false)}
          title="Issue to Vendor"
          size={600}
          options={vendorOptions}
          dropDownLabel="Vendor"
          commentLabel="Comment"
          handleOk={handleIssueOK}
          submitting={actionSubmitting}
        />
      )}
      {/* Assign Modal */}
      {openAssignModal && (
        <CommonModalFileUpload
          open={openAssignModal}
          onClose={() => setOpenAssignModal(false)}
          title="Assign"
          size={600}
          options={agentOptions}
          dropDownLabel="Assign to"
          commentLabel="Comment"
          handleOk={handleAssignOK}
          submitting={actionSubmitting}
        />
      )}
      {/* Customer Waiting Modal */}
      {openCustomerWaitingModal && (
        <CommonModalFileUpload
          open={openCustomerWaitingModal}
          onClose={() => setOpenCustomerWaitingModal(false)}
          title="Waiting For Customer Approval"
          size={600}
          commentLabel="Comment"
          handleOk={handleWaitingforCustomerApprovalOK}
          hasSkip
          submitting={actionSubmitting}
        />
      )}
      {/* Verify Modal */}
      {verifyModal && (
        <CommonModalFileUpload
          open={verifyModal}
          onClose={() => setVerifyModal(false)}
          title="verify"
          size={600}
          commentLabel="Comment"
          handleOk={handleVerifyOK}
          submitting={actionSubmitting}
        />
      )}
      {/* Reject Modal */}
      {rejectModal && (
        <RejectModal
          open={rejectModal}
          onClose={() => setRejectModal(false)}
          title="Reject"
          size={450}
          issueToVendorClick={() => {
            setRejectModal(false);
            setOpenIssueModal(true);
          }}
          AssignToAgentClick={() => {
            setRejectModal(false);
            setOpenAssignModal(true);
          }}
        />
      )}
      {/* Transfer Modal */}
      {transFerModal && (
        <CommonModalFileUpload
          open={transFerModal}
          onClose={() => setTransFerModal(false)}
          title="Transfer"
          options={agentOptions}
          size={600}
          commentLabel="Comment"
          handleOk={handletransFerOK}
          submitting={actionSubmitting}
        />
      )}
      {/* On Hold Modal */}
      {onHoldModal && (
        <CommonModalFileUpload
          open={onHoldModal}
          onClose={() => setOnHoldModal(false)}
          title="On Hold"
          size={600}
          commentLabel="Comment"
          handleOk={handleOnHoldOK}
          completionDate
          submitting={actionSubmitting}
        />
      )}
      {/* Part Need External Repair Modal */}
      {partsNeedExternalRepairModal && (
        <CommonModalFileUpload
          open={partsNeedExternalRepairModal}
          onClose={() => setPartsNeedExternalRepairModal(false)}
          title="Parts Need External Repair"
          size={600}
          dropDownLabel="Part Name"
          options={partsOptions}
          commentLabel="Comment"
          handleOk={handlePartsNeedExternalRepairOK}
          submitting={actionSubmitting}
        />
      )}

      {/* Waiting Spare Modal */}
      {waitingSpareModal && (
        <CommonModalFileUpload
          open={waitingSpareModal}
          onClose={() => setWaitingSpareModal(false)}
          title="Waiting For Spare"
          size={600}
          commentLabel="Comment"
          handleOk={handleWaitingSpareOK}
          submitting={actionSubmitting}
        />
      )}

      {/*Repair Complete Modal */}
      {repairCompletedModal && (
        <CommonModalFileUpload
          open={repairCompletedModal}
          onClose={() => setRepairCompletedModal(false)}
          title="Repair Complete"
          size={600}
          commentLabel="Comment"
          handleOk={handleRepairCompletedOK}
          submitting={actionSubmitting}
        />
      )}

      {/* Not Repairable Modal */}
      {notRepairableModal && (
        <CommonModalFileUpload
          open={notRepairableModal}
          onClose={() => setNotRepairableModal(false)}
          title="Non Repairable"
          size={600}
          commentLabel="Comment"
          handleOk={handleNotRepairableOK}
          submitting={actionSubmitting}
        />
      )}

      {partsReplaceModal && (
        <PartReplaceItemListModal
          open={partsReplaceModal}
          onClose={() => setPartsReplaceModal(false)}
          title="Parts Replace"
          size={500}
          handlePartClick={handlePartSelect}
        />
      )}

      {partsDetailsModal && (
        <PartsDetailsModal
          open={partsDetailsModal}
          onClose={() => setPartsDetailsModal(false)}
          title="Part Replace"
          size={600}
          value={selectedPartData}
          handleOk={handlePartSelectDone}
          submitting={actionSubmitting}
        />
      )}

      {customerApprovalModal && (
        <CommonModalFileUpload
          open={customerApprovalModal}
          onClose={() => setCustomerApprovalModal(false)}
          title="Customer Approved"
          size={600}
          commentLabel="Comment"
          handleOk={handleCustomerApprovedOK}
          hasSkip
          noFileUpload
          submitting={actionSubmitting}
        />
      )}
    </div>
  );
};

export default AssignedItemView;
