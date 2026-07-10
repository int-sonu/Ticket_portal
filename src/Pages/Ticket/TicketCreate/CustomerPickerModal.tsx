import { useEffect, useMemo, useState } from "react";
import { Input, Modal } from "antd";
import {
  CloseOutlined,
  MailOutlined,
  PhoneOutlined,
  SearchOutlined,
} from "@ant-design/icons";

type CustomerPickerModalProps = {
  open: boolean;
  customers: any[];
  selectedCustomerId?: any;
  title?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onCancel: () => void;
  onSelect: (customerId: any) => void;
};

const getFirstValue = (item: any, keys: string[]) => {
  for (const key of keys) {
    const value = item?.[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim()
    ) {
      return String(value).trim();
    }
  }

  return "";
};

const normalizeText = (value: any) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const CustomerPickerModal = ({
  open,
  customers,
  selectedCustomerId,
  title = "Choose a customer to bill",
  searchPlaceholder = "Search customer",
  emptyMessage = "No customer found",
  onCancel,
  onSelect,
}: CustomerPickerModalProps) => {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setSearch("");
    }
  }, [open]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;

    return customers.filter((customer: any, index: number) => {
      const name =
        getFirstValue(customer, [
          "cCustomerName",
          "CustomerName",
          "name",
        ]) || `Customer ${index + 1}`;
      const id =
        getFirstValue(customer, ["nCustomerId", "id"]) || index + 1;
      const email = getFirstValue(customer, ["cEmail", "email"]);
      const phone = getFirstValue(customer, [
        "cMobileNo",
        "cPhoneNo",
        "mobile",
        "phone",
      ]);

      return [name, id, email, phone]
        .map((value) => normalizeText(value))
        .join(" ")
        .includes(term);
    });
  }, [customers, search]);

  return (
    <Modal
      open={open}
      footer={null}
      width={520}
      closable={false}
      maskClosable={false}
      className="ticket-picker-modal"
      onCancel={onCancel}
    >
      <div className="relative flex flex-col">
        <button
          type="button"
          aria-label="Close customer picker"
          onClick={onCancel}
          className="absolute right-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <CloseOutlined />
        </button>

        <div className="pr-12">
          <h1 className="pt-1 text-[18px] font-medium text-slate-900">
            {title}
          </h1>
        </div>

        <div className="mt-3 h-px bg-slate-200" />

        <div className="mt-3 w-full max-w-[520px]">
          <Input
            allowClear
            prefix={<SearchOutlined className="text-slate-500" />}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-[34px]"
          />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_8px_rgba(15,23,42,0.08)]">
        <div className="max-h-[260px] overflow-y-auto pr-1">
          {filteredCustomers.length > 0 ? (
            <div className="grid gap-3 grid-cols-1">
              {filteredCustomers.map((customer: any, index: number) => {
                const name =
                  getFirstValue(customer, [
                    "cCustomerName",
                    "CustomerName",
                    "name",
                  ]) || "Customer";
                const id =
                  getFirstValue(customer, [
                    "nCustomerId",
                    "id",
                  ]) || index + 1;
                const email =
                  getFirstValue(customer, ["cEmail", "email"]) || "NIL";
                const phone =
                  getFirstValue(customer, [
                    "cMobileNo",
                    "cPhoneNo",
                    "mobile",
                    "phone",
                  ]) || "NIL";
                const isSelected =
                  String(selectedCustomerId ?? "") === String(id);

                return (
                  <button
                    type="button"
                    key={`${id}-${index}`}
                    className={`min-h-[104px] rounded-xl border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-sky-500 bg-sky-50"
                        : "border-sky-200 bg-sky-50/60 hover:border-sky-300 hover:bg-sky-50"
                    }`}
                    onClick={() => {
                      onSelect(id);
                      onCancel();
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 text-[13px] font-semibold uppercase tracking-wide text-slate-900">
                        {name}
                      </div>
                      <div className="shrink-0 text-[12px] text-slate-600">
                        ID : {id}
                      </div>
                    </div>
                       <div className="mt-1 h-px bg-blue-300/25" />

                    <div className="mt-4 flex items-center justify-between gap-4 text-[12px] text-slate-700">
                      <div className="flex min-w-0 items-center gap-2">
                        <MailOutlined className="shrink-0 text-[14px] text-slate-700" />
                        <span className="truncate">{email}</span>
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <PhoneOutlined className="shrink-0 text-[14px] text-slate-700" />
                        <span className="truncate">{phone}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[128px] items-center justify-center rounded-xl border border-slate-200">
              <div className="text-sm text-slate-500">{emptyMessage}</div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CustomerPickerModal;
