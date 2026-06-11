import { Card, Empty, Spin, Timeline } from "antd";
import { useParams } from "react-router-dom";

import { useTicketHistory } from "../../../Hooks/Ticket/useTicketQueries";

interface Props {
  ticketId?: number;
}

const TicketHistory = ({ ticketId }: Props) => {
  const params = useParams();
  const resolvedTicketId = Number(ticketId ?? params.id ?? 0);

  const { data, isLoading } = useTicketHistory(
    {
      TicketId: resolvedTicketId,
    },
    !!resolvedTicketId
  );

  const items = data?.Data?.map((item: any) => ({
    children: (
      <div className="space-y-1">
        <div className="text-sm font-semibold text-slate-900">{item.Action || "-"}</div>
        {item.Remarks ? <div className="text-sm text-slate-600">{item.Remarks}</div> : null}
        <div className="text-xs text-slate-500">{item.CreatedDate || ""}</div>
      </div>
    ),
  }));

  return (
    <Spin spinning={isLoading}>
      <Card bordered className="border-slate-200" styles={{ body: { padding: 0 } }}>
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="text-lg font-semibold text-slate-900">Ticket History</div>
          <div className="mt-1 text-sm text-slate-500">
            Complete timeline of status changes, comments, and agent actions.
          </div>
        </div>

        <div className="px-4 py-5 sm:px-5">
          {items?.length ? (
            <Timeline
              items={items}
              className="[&_.ant-timeline-item-tail]:border-slate-300 [&_.ant-timeline-item-head]:border-sky-500 [&_.ant-timeline-item-head]:bg-sky-500"
            />
          ) : (
            <Empty description="No history found" />
          )}
        </div>
      </Card>
    </Spin>
  );
};

export default TicketHistory;
