import { useLocation } from "react-router-dom";

import TicketForm from "./TicketForm";

const TicketCreate = () => {
  const location = useLocation();

  const locationState =
    (location.state as
      | { draftValues?: Record<string, any>; followupSourceTicket?: any }
      | null) ?? {};

  const initialValues = {
    CustomerId: null,
    ContactNo: "",
    Priority: "Medium",
    IssueSummary: "",
    Status: "Open",
  };

  return (
    <TicketForm
      initialValues={
        {
          ...initialValues,
          ...(locationState.draftValues ?? {}),
        }
      }
      followupSourceTicket={locationState.followupSourceTicket}
      isEdit={false}
    />
  );
};

export default TicketCreate;
