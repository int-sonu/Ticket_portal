import { InputField } from "../../ui/Index";

interface Props {
  viewOnly?: boolean;
  formValues: formType;
  handleFormChange: (key: string, value: string) => void;
  inputRefs?: any;
}

interface formType {
  cVendorName: string;
  cShName: string;
}

const VendorMasterFields: React.FC<Props> = ({
  viewOnly = false,
  formValues,
  handleFormChange,
  inputRefs,
}) => {
  return (
    <div className="px-5 py-2">
      <InputField
        label="Name"
        name="cVendorName"
        value={formValues.cVendorName}
        onChange={(e) => {
          handleFormChange("cVendorName", e.target.value);
        }}
        viewOnly={viewOnly}
        inputRef={inputRefs?.cVendorName}
      />
      <div className="mt-2">
        <InputField
          label="Short Name"
          name="cShName"
          value={formValues.cShName}
          onChange={(e) => {
            handleFormChange("cShName", e.target.value);
          }}
          viewOnly={viewOnly}
          inputRef={inputRefs?.cShName}
        />{" "}
      </div>
    </div>
  );
};

export default VendorMasterFields;
