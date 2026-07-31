import { useMemo, useState } from "react";
import { Empty, Modal, Spin, message } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { billingApis } from "../../Axios/BillingApis";
import BillReadonlyViewExact from "./BillReadonlyViewExact";
import { getRequestPayload } from "../../Utils/requestPayload";
import editIcon from "../../assets/Bills/EditIcon.png";
import deleteRed from "../../assets/icons/delete-red.svg";

type BillViewState = Record<string, any>;

type BillViewPageProps = {
  editMode?: boolean;
};

const BillViewPage = ({ editMode = false }: BillViewPageProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const billState = (location.state ?? {}) as BillViewState;

  const requestPayload = useMemo(
    () => ({
      ...getRequestPayload(),
      ...(billState.sessionPayload ?? {}),
    }),
    [billState.sessionPayload],
  );

  const billId =
    Number(
      billState.billId ??
        billState.nBillId ??
        billState.billData?.nBillId ??
        billState.billData?.BillId ??
        billState.billData?.billId ??
        0,
    ) || 0;

  const billRequestPayload = useMemo(
    () => ({
      ...requestPayload,
      nBillId: billId,
      BillId: billId,
      billId,
    }),
    [billId, requestPayload],
  );

  const canLoadBill = !!billId;

  const closeBillView = () => {
    if (billState.returnTo) {
      navigate(billState.returnTo, {
        replace: true,
        state: billState.returnState,
      });
      return;
    }

    navigate("/billsandreceipts/bills", { replace: true });
  };

  const editBill = () => {
    navigate("/billsandreceipts/bills/edit", {
      state: {
        ...billState,
        billId,
        nBillId: billId,
        sessionPayload: requestPayload,
        isEditMode: true,
        sourcePage: "bills",
      },
    });
  };

  const deleteBill = () => {
    if (!billId || isDeleting) return;

    Modal.confirm({
      title: "Delete Bill",
      content: `Are you sure you want to delete bill ${billState.billNo ?? billId}?`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        setIsDeleting(true);
        try {
          const response = await billingApis.billDelete({
            ...requestPayload,
            nBillId: billId,
            nCreatedby: Number(
              requestPayload.nUserId ??
                requestPayload.nAgentId ??
                requestPayload.nCreatedBy ??
                requestPayload.id ??
                0,
            ),
          });
          message.success(response?.message || "Bill deleted successfully.");
          closeBillView();
        } catch (error: any) {
          message.error(
            error?.response?.data?.message ||
              error?.message ||
              "Unable to delete bill.",
          );
          throw error;
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  const { data: billViewResponse, isLoading: isBillViewLoading } = useQuery({
    queryKey: ["bill-view-page", billRequestPayload],
    queryFn: () => billingApis.billView(billRequestPayload),
    enabled: canLoadBill,
  });

  const { data: partListResponse, isLoading: isPartListLoading } = useQuery({
    queryKey: ["bill-view-part-list", billRequestPayload],
    queryFn: () => billingApis.partListForBilling(billRequestPayload),
    enabled: canLoadBill,
  });

  if (!billId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <Empty description="Bill not found" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {!editMode ? (
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="text-[18px] font-medium text-slate-900">Bill View</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Edit bill"
              title="Edit bill"
              onClick={editBill}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white hover:bg-slate-50"
            >
              <img src={editIcon} alt="" aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Delete bill"
              title="Delete bill"
              disabled={isDeleting}
              onClick={deleteBill}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-500 bg-red-500 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <img
                src={deleteRed}
                alt=""
                aria-hidden="true"
                className="h-4 w-4 brightness-0 invert"
              />
            </button>
            <button
              type="button"
              aria-label="Close bill view"
              onClick={closeBillView}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <CloseOutlined />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex-1 min-h-0 overflow-hidden p-3">
        <Spin spinning={isBillViewLoading || isPartListLoading}>
          <div className="h-full min-h-0 overflow-hidden rounded-xl bg-white">
            <BillReadonlyViewExact
              viewData={{ ...billState, partListResponse }}
              fallbackState={billState}
              billViewData={billViewResponse}
              loading={isBillViewLoading}
              editMode={editMode}
              hideEditDeleteActions={!editMode}
            />
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default BillViewPage;
