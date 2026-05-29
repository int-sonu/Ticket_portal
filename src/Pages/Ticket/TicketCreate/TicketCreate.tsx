import TicketForm from "./TicketForm";

const TicketCreate = () => {
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
        initialValues
      }
      isEdit={false}
    />
  );
};

export default TicketCreate;