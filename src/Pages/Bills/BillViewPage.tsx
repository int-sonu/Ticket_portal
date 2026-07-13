import { useMemo } from "react";
import { Empty, Spin } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { billingApis } from "../../Axios/BillingApis";
import BillReadonlyViewExact from "./BillReadonlyViewExact";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList } from "../Master/Common/SimpleMasterUtils";

type BillViewState = Record<string, any>;

const BillViewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const billState = (location.state ?? {}) as BillViewState;

  const requestPayload = useMemo(
    () => ({
      ...getRequestPayload(),
      ...(billState.sessionPayload ?? {}),
    }),
    [billState.sessionPayload],
  );

  const billId =
    Number(billState.billId ?? billState.nBillId ?? billState.billData?.nBillId ?? billState.billData?.BillId ?? 0) ||
    0;

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

  const { data: billViewResponse, isLoading: isBillViewLoading } = useQuery({
    queryKey: ["bill-view-page", billRequestPayload],
    queryFn: () => billingApis.billView(billRequestPayload),
    enabled: canLoadBill,
  });

  const partListData = useMemo(() => {
    const responseData = billViewResponse?.data ?? billViewResponse ?? {};
    return extractList(
      responseData?.data?.itemDtls ??
        responseData?.data?.ItemDtls ??
        responseData?.itemDtls ??
        responseData?.ItemDtls ??
        responseData?.data?.billSummary?.itemDtls ??
        responseData?.data?.billSummary?.ItemDtls ??
        [],
    );
  }, [billViewResponse]);

  if (!billId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <Empty description="Bill not found" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="text-[18px] font-medium text-slate-900">Bill View</div>
        <button
          type="button"
          aria-label="Close bill view"
          onClick={closeBillView}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <CloseOutlined />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden p-3">
        <Spin spinning={isBillViewLoading}>
          <div className="h-full min-h-0 overflow-hidden rounded-xl bg-white">
            <BillReadonlyViewExact
              viewData={billState}
              fallbackState={billState}
              billViewData={billViewResponse}
              partListData={partListData}
              loading={isBillViewLoading}
            />
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default BillViewPage;
