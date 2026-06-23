import { Button } from "antd";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { getRequestPayload } from "../../../Utils/requestPayload";
import EstimateModal from "./EstimateModal";

const TicketEstimatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = (location.state ?? {}) as Record<string, any>;

  const ticketId = Number(
    state.ticketId ?? searchParams.get("ticketId") ?? searchParams.get("id") ?? 0,
  );
  const customerId = Number(
    state.customerId ?? searchParams.get("customerId") ?? 0,
  );
  const estimateId = Number(
    state.estimateId ?? searchParams.get("estimateId") ?? searchParams.get("nEstimateId") ?? 0,
  );
  const customerName = String(
    state.customerName ?? searchParams.get("customerName") ?? "",
  );

  if (!ticketId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Estimate</div>
          <div className="mt-2 text-sm text-slate-600">
            Missing ticket reference for this estimate.
          </div>
          <Button className="mt-4" type="primary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      <EstimateModal
        open
        onClose={() => {
          const returnTo = state.returnTo || `/tickets/view/${ticketId}`;
          navigate(returnTo, { replace: true });
        }}
        ticketId={ticketId}
        customerId={customerId}
        estimateId={estimateId}
        customerName={customerName}
        sessionPayload={getRequestPayload()}
      />
    </div>
  );
};

export default TicketEstimatePage;
