import { useEffect, useRef, useState } from "react";
import { Button, DatePicker, Drawer, Image, Input, Upload, message } from "antd";
import { CalendarOutlined, LeftOutlined, RightOutlined, UploadOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";

import deleteImage from "../../assets/icons/delete-white.svg";
import { billingApis } from "../../Axios/BillingApis";
import { getRequestPayload } from "../../Utils/requestPayload";

type ExpenseAttachment = { id: string; file: File; url: string };

type TravelingExpenseDrawerProps = {
  open: boolean;
  initialDate?: Dayjs;
  agentId?: string | number;
  expense?: Record<string, any> | null;
  onClose: () => void;
  onSaved?: (expense: Record<string, unknown>) => void | Promise<void>;
};

const TravelingExpenseDrawer = ({
  open,
  initialDate,
  agentId,
  expense,
  onClose,
  onSaved,
}: TravelingExpenseDrawerProps) => {
  const [expenseDate, setExpenseDate] = useState(initialDate ?? dayjs());
  const [item, setItem] = useState("");
  const [comment, setComment] = useState("");
  const [amount, setAmount] = useState("0");
  const [attachments, setAttachments] = useState<ExpenseAttachment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const attachmentStripRef = useRef<HTMLDivElement>(null);
  const expenseId = Number(expense?.nExpenseId ?? expense?.ExpenseId ?? expense?.id ?? 0);

  useEffect(() => {
    if (!open) return;
    const dateValue = String(expense?.cDate ?? expense?.dDate ?? "").trim();
    const dayFirst = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const parsedDate = dayFirst
      ? dayjs(`${dayFirst[3]}-${dayFirst[2].padStart(2, "0")}-${dayFirst[1].padStart(2, "0")}`)
      : dayjs(dateValue);
    setExpenseDate(parsedDate.isValid() ? parsedDate : initialDate?.isValid() ? initialDate : dayjs());
    setItem(String(expense?.cItem ?? expense?.cItemName ?? ""));
    setComment(String(expense?.cComment ?? expense?.cComments ?? ""));
    setAmount(String(expense?.nAmount ?? expense?.nOtherExpenseAmount ?? "0"));
  }, [expense, initialDate, open]);

  const clearAttachments = () => {
    setAttachments((current) => {
      current.forEach((attachment) => URL.revokeObjectURL(attachment.url));
      return [];
    });
  };

  const closeDrawer = () => {
    clearAttachments();
    setItem("");
    setComment("");
    setAmount("0");
    onClose();
  };

  const addAttachment = (file: File) => {
    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      message.error("Only JPG or PNG files are allowed.");
      return Upload.LIST_IGNORE;
    }
    setAttachments((current) => [
      ...current,
      {
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        url: URL.createObjectURL(file),
      },
    ]);
    return false;
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => {
      const removed = current.find((attachment) => attachment.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((attachment) => attachment.id !== id);
    });
  };

  const handleSave = async () => {
    if (!item.trim()) {
      message.warning("Enter an expense item.");
      return;
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      message.warning("Enter a valid amount.");
      return;
    }
    const request = getRequestPayload();
    const expenseAgentId = String(agentId || request.nAgentId || request.id || "");
    if (!Number.isFinite(Number(expenseAgentId)) || Number(expenseAgentId) <= 0) {
      message.warning("Unable to identify the selected agent.");
      return;
    }
    const savePayload = {
      cItemName: item.trim(),
      nFollowupId: 0,
      cComments: comment.trim(),
      cDate: expenseDate.format("YYYY/MM/DD"),
      nAmount: Number(amount),
      nCompanyId: Number(request.nCompanyId),
      nCreatedBy: Number(expenseAgentId),
      cSchemaName: String(request.cSchemaName ?? ""),
      cDbName: String(request.cDbName ?? ""),
    };

    try {
      setIsSaving(true);
      if (expenseId > 0) {
        await billingApis.otherExpensesUpdate({ nExpenseId: expenseId, ...savePayload });
      } else {
        await billingApis.otherExpensesSave(savePayload);
      }
      message.success(expenseId > 0 ? "Expense updated successfully." : "Expense saved successfully.");
      await onSaved?.({
        nExpenseId: expenseId,
        cItem: item.trim(),
        cItemName: item.trim(),
        cComment: comment.trim(),
        cComments: comment.trim(),
        nAmount: Number(amount),
        cDate: expenseDate.format("YYYY/MM/DD"),
        nAgentId: Number(expenseAgentId) || expenseAgentId,
      });
      closeDrawer();
    } catch (error: any) {
      const response = error?.response?.data;
      const validationMessage = response?.errors && typeof response.errors === "object"
        ? Object.values(response.errors).flat().find((value) => typeof value === "string")
        : "";
      message.error(
        validationMessage ?? response?.message ?? response?.title ?? "Unable to save expense.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      title={expenseId > 0 ? "Edit Expense" : "Add Expense"}
      placement="right"
      width={520}
      open={open}
      onClose={closeDrawer}
      destroyOnClose
      styles={{
        header: { minHeight: 64, paddingInline: 20 },
        body: { padding: 20, display: "flex", flexDirection: "column" },
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="mb-2 text-sm text-slate-600">Select Date</div>
              <DatePicker
                className="w-full"
                value={expenseDate}
                onChange={(value) => setExpenseDate(value ?? dayjs())}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined className="text-slate-400" />}
              />
            </div>
            <div>
              <div className="mb-2 text-sm text-slate-600">Item</div>
              <Input value={item} onChange={(event) => setItem(event.target.value)} />
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm text-slate-600">Comment</div>
            <Input.TextArea rows={4} value={comment} onChange={(event) => setComment(event.target.value)} />
          </div>

          <div>
            <div className="mb-2 text-sm text-slate-600">Amount</div>
            <Input value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>

          {attachments.length > 0 ? (
            <div className="mt-4 flex items-center gap-2">
              <Button
                type="text"
                aria-label="Previous images"
                className="!px-0 !text-slate-400"
                icon={<LeftOutlined />}
                onClick={() => attachmentStripRef.current?.scrollBy({ left: -180, behavior: "smooth" })}
              />
              <div ref={attachmentStripRef} className="flex min-w-0 flex-1 gap-3 overflow-hidden py-1 scroll-smooth">
                <Image.PreviewGroup>
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="relative h-[76px] w-[76px] flex-none rounded border border-slate-200 bg-black shadow">
                      <Image src={attachment.url} alt={attachment.file.name} width={74} height={74} className="rounded object-cover" />
                      <button
                        type="button"
                        aria-label="Remove image"
                        className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded border border-red-400 bg-white shadow"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeAttachment(attachment.id);
                        }}
                      >
                        <img src={deleteImage} alt="" className="h-4 w-4 rounded bg-red-500 p-[2px]" />
                      </button>
                    </div>
                  ))}
                </Image.PreviewGroup>
              </div>
              <Button
                type="text"
                aria-label="Next images"
                className="!px-0 !text-slate-400"
                icon={<RightOutlined />}
                onClick={() => attachmentStripRef.current?.scrollBy({ left: 180, behavior: "smooth" })}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <Upload accept="image/jpeg,image/png" multiple showUploadList={false} beforeUpload={addAttachment}>
            <Button type="link" icon={<UploadOutlined />} className="!font-medium">
              Upload Files <span className="ml-1 text-[10px]">(JPG or PNG)</span>
            </Button>
          </Upload>
          <Button
            type="primary"
            loading={isSaving}
            className="!border-emerald-500 !bg-emerald-500"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default TravelingExpenseDrawer;
