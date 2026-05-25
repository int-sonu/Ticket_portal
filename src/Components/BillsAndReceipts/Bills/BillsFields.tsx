import { InputField } from "../../ui/Index";

interface Props {
  viewOnly?: boolean;
  formValues: formType;
  handleFormChange: (key: string, value: string) => void;
}

interface formType {
  billNo: string;
  Date: string;
  customerName: string;
  amount: number;
  payMode: string;
}

const BillsFields: React.FC<Props> = ({
  viewOnly = false,
  formValues,
  handleFormChange,
}) => {
  return (
    <div className="px-5 py-2">
      <InputField
        label="Bill No"
        name="billNo"
        value={formValues.billNo}
        onChange={(e) => {
          handleFormChange("billNo", e.target.value);
        }}
        viewOnly={viewOnly}
      />
      <div className="w-1/2 mt-2">
        <InputField
          label="Date"
          name="Date"
          value={formValues.Date}
          onChange={(e) => {
            handleFormChange("Date", e.target.value);
          }}
          viewOnly={viewOnly}
        />
      </div>
    </div>
  );
};

export default BillsFields;
