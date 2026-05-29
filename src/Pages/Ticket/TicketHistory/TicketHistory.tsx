import { Card, Timeline } from "antd";

import {
  useTicketHistory,
} from "../../../Hooks/Ticket/useTicketQueries";

interface Props {
  ticketId: number;
}

const TicketHistory = ({
  ticketId,
}: Props) => {
  const { data, isLoading } =
    useTicketHistory(
      {
        TicketId: ticketId,
      },
      !!ticketId
    );

  return (
    <Card
      title="Ticket History"
      loading={isLoading}
    >
      <Timeline
        items={
          data?.Data?.map(
            (item: any) => ({
              children: (
                <>
                  <strong>
                    {item.Action}
                  </strong>

                  <div>
                    {
                      item.Remarks
                    }
                  </div>

                  <small>
                    {
                      item.CreatedDate
                    }
                  </small>
                </>
              ),
            })
          ) || []
        }
      />
    </Card>
  );
};

export default TicketHistory;