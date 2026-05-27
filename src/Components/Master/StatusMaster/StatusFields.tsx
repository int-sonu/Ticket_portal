import React from "react";
import { Input, ToggleButton } from "../../../Components/ui/Index";

/**
 * Form fields used in the Status Master modal.
 * Only the "Status Name" and "Active" fields are required – the short‑name column has been removed per requirements.
 */
const StatusFields = ({
  formValues,
  handleFormChange,
  viewOnly,
  inputRefs,
}: {
  formValues: any;
  handleFormChange: (key: string, value: any) => void;
  viewOnly: boolean;
  inputRefs: { cStatusName: React.RefObject<HTMLInputElement> };
}) => {
  return (
    <div className="grid gap-4">
      {/* Status Name */}
      <Input
        label="Status Name"
        name="cStatusName"
        value={formValues.cStatusName}
        onChange={(e) => handleFormChange("cStatusName", e.target.value)}
        disabled={viewOnly}
        ref={inputRefs.cStatusName}
        required
      />

      {/* Active toggle */}
      <ToggleButton
        label="Active"
        checked={formValues.bActive}
        onChange={(checked) => handleFormChange("bActive", checked)}
        disabled={viewOnly}
      />
    </div>
  );
};

export default StatusFields;
