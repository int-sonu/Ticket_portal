import { useLocation } from "react-router-dom";

import TicketForm from "./TicketForm";

const TicketCreate = () => {
  const location = useLocation();

  const locationState =
    (location.state as
      | {
          draftValues?: Record<string, any>;
          followupSourceTicket?: any;
          selectedRow?: Record<string, any>;
        }
      | null) ?? {};

  const initialValues = {
    CustomerId: null,
    ContactNo: "",
    Priority: "Medium",
    IssueSummary: "",
    Status: "Open",
    Group: undefined,
    AssignToAgent: undefined,
  };

  const mergedInitialValues = {
    ...initialValues,
    ...(locationState.selectedRow ?? {}),
    ...(locationState.draftValues ?? {}),
  };

  if (locationState.followupSourceTicket) {
    delete mergedInitialValues.IssueSummary;
    delete mergedInitialValues.TicketSummary;
    delete mergedInitialValues.cTicketSummary;
  }

  return (
    <TicketForm
      initialValues={mergedInitialValues}
      followupSourceTicket={locationState.followupSourceTicket}
      isEdit={false}
    />
  );
};

export default TicketCreate;
