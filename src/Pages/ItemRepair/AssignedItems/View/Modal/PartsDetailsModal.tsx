import { useEffect, useRef, useState } from "react";
import {
  CustomModal,
  InputField,
  PrimaryButton,
} from "../../../../../Components/ui/Index";
import FileUpload from "../../../../../Components/ui/FileUpload/FileUpload";
import { Image } from "antd";

interface Options {
  value: number | string;
  item: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  size: number;
  value?: any;
  handleOk: (values: any) => void;
  viewOnly?: boolean;
  handleDelete?: (values: any) => void;
  submitting?: boolean;
}

const PartsDetailsModal = ({
  open,
  onClose,
  title,
  size,
  value,
  handleOk,
  handleDelete,
  viewOnly = false,
  submitting = false,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [view, setOnly] = useState(viewOnly);
  const [formValues, setFormValues] = useState<any>({
    nPartId: 0,
    cPartName: "",
    cPartDescription: "",
    cComment: "",
    files: [],
    nPartRate: 0,
    qty: 0,
  });

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    console.log(value, "part details value");
    const item = {
      nPartId: value?.nPartId,
      cPartName: value?.cPartName,
      cPartDescription: value?.cPartDescription,
      files: value?.files || [],
      nPartRate: value?.nPartRate,
      qty: value?.qty || 0,
      cComment: value?.cComment || "",
    };
    if (value) {
      setFormValues(item);
    }
  }, [value]);

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      Closable
      title={title}
      children={
        <div className="w-full">
          <div className="bg-[#edf8ff] px-4">
            <p className="text-[13px] font-medium">
              {value?.cPartName ? value?.cPartName : ""}
            </p>
            {value?.cPartDescription && (
              <p className="font-[13px] text-[#5B5B5B]">
                <span className="text-[#5B5B5B] font-medium">
                  Part Description :
                </span>{" "}
                {value?.cPartDescription ? value?.cPartDescription : ""}
              </p>
            )}
            <p className="font-medium text-[14px] text-[#098CEB] text-end">
              ₹{value?.nPartRate ? (value?.nPartRate || 0)?.toFixed(2) : "0.00"}
            </p>
          </div>

          <div className="px-4 mt-2">
            <InputField
              inputType="textarea"
              label="Comment"
              value={formValues.cComment}
              onTextAreaChange={(e: any) => {
                setFormValues({
                  ...formValues,
                  cComment: e.target.value,
                });
              }}
              name="cComment"
              viewOnly={view}
              inputRef={inputRef}
            />
          </div>
          <div className="px-4">
            <FileUpload
              onChange={(files: any) => {
                setFormValues({
                  ...formValues,
                  files: files,
                });
              }}
              multiple={false}
              value={formValues.files}
              viewOnly={view}
            />
          </div>

          {view && formValues.files?.length > 0 && (
            <div className="px-4">
              <div className="flex flex-wrap gap-3">
                {formValues.files.map((file: any, index: number) => (
                  <Image
                    key={index}
                    width={80}
                    height={80}
                    src={file?.url}
                    alt={file?.name}
                    style={{ objectFit: "cover", borderRadius: 6 }}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="px-4 text-[#5B5B5B] font-medium flex items-center justify-end gap-2 mb-2">
            <span>Quantity:</span>
            <button
              disabled={view}
              onClick={() =>
                setFormValues({ ...formValues, qty: formValues.qty + 1 })
              }
              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#1CBF8E] text-white cursor-pointer"
            >
              +
            </button>
            <span className="px-2">{formValues.qty}</span>
            <button
              disabled={view}
              onClick={() =>
                setFormValues({
                  ...formValues,
                  qty: Math.max(0, formValues.qty - 1),
                })
              }
              className="w-6 h-6 flex items-center justify-center rounded-full bg-[#1CBF8E] text-white cursor-pointer"
            >
              −
            </button>
          </div>

          <div className="px-4 py-2  flex justify-end">
            <PrimaryButton
              text={submitting ? "Please wait..." : "Ok"}
              onClick={() => handleOk(formValues)}
              disabled={submitting}
              viewOnly={view}
              editClick={() => setOnly(!viewOnly)}
              deleteClick={() => handleDelete?.(formValues)}
            />
          </div>
        </div>
      }
      size={size}
    />
  );
};

export default PartsDetailsModal;
