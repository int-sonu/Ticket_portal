import { Button, Checkbox, Input, message } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useState } from "react";

import RightSideDrawer from "../../ui/Drawer/RightSideDrawer";
import paymentModeHero from "../../assets/payMode/paymentModeImage.png";
import cashPayModeImage from "../../assets/payMode/cash.png";
import chequePayModeImage from "../../assets/payMode/cheque.png";
import complementaryPayModeImage from "../../assets/payMode/complementary.png";
import companyPayModeImage from "../../assets/payMode/company.png";
import masterPayModeImage from "../../assets/payMode/master.png";
import netPayModeImage from "../../assets/payMode/net.png";
import qrPayModeImage from "../../assets/payMode/paymentQr.png";
import splitPayModeImage from "../../assets/payMode/splitMode.png";
import upiPayModeImage from "../../assets/payMode/upi.png";

type PayModeOption = {
  key: string;
  label: string;
  image: string;
};

export const PAY_MODE_OPTIONS: PayModeOption[] = [
  { key: "QR", label: "QR Code", image: qrPayModeImage },
  { key: "Cash", label: "Cash", image: cashPayModeImage },
  { key: "UPI", label: "UPI", image: upiPayModeImage },
  { key: "Card", label: "Card", image: masterPayModeImage },
  { key: "Net Banking", label: "Net Banking", image: netPayModeImage },
  { key: "Cheque", label: "Cheque", image: chequePayModeImage },
  {
    key: "Complimentary",
    label: "Complimentary",
    image: complementaryPayModeImage,
  },
  { key: "Company", label: "Company Credit", image: companyPayModeImage },
  { key: "Split", label: "Split", image: splitPayModeImage },
];

type PayModeDrawerProps = {
  open: boolean;
  amount: number;
  payMode: string;
  onClose: () => void;
  onCancel: () => void;
  onSave: () => void;
  onSelectPayMode: (payMode: string) => void;
};

type ModeFields = Record<string, Record<string, string>>;

const PayModeDrawer = ({
  open,
  amount,
  payMode,
  onClose,
  onCancel,
  onSave,
  onSelectPayMode,
}: PayModeDrawerProps) => {
  const [modeFields, setModeFields] = useState<ModeFields>({});
  const [splitStep, setSplitStep] = useState<"choose" | "details">("choose");
  const [splitSelections, setSplitSelections] = useState<
    Record<string, boolean>
  >({});

  const updatePayModeField = (mode: string, field: string, value: string) => {
    setModeFields((previous) => ({
      ...previous,
      [mode]: {
        ...(previous[mode] ?? {}),
        [field]: value,
      },
    }));
  };

  const renderModeFields = (mode: string) => {
    const fields = modeFields[mode] ?? {};

    switch (mode) {
      case "QR":
        return (
          <div className="mx-auto h-40 w-40 overflow-hidden rounded-none border border-dashed border-slate-200 bg-slate-50">
  <img
    src={qrPayModeImage}
    alt="QR Code"
    className="h-full w-full rounded-none object-cover"
  />
</div>

          // <div className="space-y-4">
          //   <div className="rounded-xl border border-slate-200 bg-white p-4">
          //     <div className="mb-3 text-sm font-medium text-slate-700">QR Code</div>
          //     <div className="mx-auto flex h-40 w-full max-w-[240px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
          //       Scan QR to pay
          //     </div>
          //   </div>
          //   <div>
          //     {/* <div className="mb-1 text-sm text-slate-600">Customer Mobile No/Email Id</div> */}
          //     {/* <Input
          //       value={fields.customerContact ?? ""}
          //       onChange={(event) => updatePayModeField(mode, "customerContact", event.target.value)}
          //       placeholder="Enter Mobile No/Email Id"
          //     /> */}
          //   </div>
          // </div>
        );
      case "Cash":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-sm text-slate-600">Tender Cash</div>
              <Input
                value={fields.tenderCash ?? ""}
                onChange={(event) =>
                  updatePayModeField(mode, "tenderCash", event.target.value)
                }
                placeholder="Enter Tender Cash"
              />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-600">Balance</div>
              <Input value={fields.balance ?? "0.00"} readOnly />
            </div>
          </div>
        );
      case "UPI":
        return (
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-1 text-sm text-slate-600">
                Enter Customer UPI Id
              </div>
              <Input
                value={fields.upiId ?? ""}
                onChange={(event) =>
                  updatePayModeField(mode, "upiId", event.target.value)
                }
                placeholder="Enter UPI ID"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="primary"
                className="!bg-emerald-500 !border-emerald-500"
              >
                Verify
              </Button>
            </div>
          </div>
        );
      case "Card":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-sm text-slate-600">Card Number</div>
              <Input
                value={fields.cardNumber ?? ""}
                onChange={(event) =>
                  updatePayModeField(mode, "cardNumber", event.target.value)
                }
                placeholder="Card Number"
              />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-600">Valid</div>
              <Input
                value={fields.valid ?? ""}
                onChange={(event) =>
                  updatePayModeField(mode, "valid", event.target.value)
                }
                placeholder="MM/YY"
              />
            </div>
          </div>
        );
      case "Net Banking":
      case "Cheque":
        return (
          <div className="grid gap-4">
            <div>
              <div className="mb-1 text-sm text-slate-600">Bank Name</div>
              <Input
                value={fields.bankName ?? ""}
                onChange={(event) =>
                  updatePayModeField(mode, "bankName", event.target.value)
                }
                placeholder="Enter Bank Name"
              />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-600">Number</div>
              <Input
                value={fields.number ?? ""}
                onChange={(event) =>
                  updatePayModeField(mode, "number", event.target.value)
                }
                placeholder="Enter Number"
              />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-600">Date</div>
              <Input
                value={fields.date ?? ""}
                onChange={(event) =>
                  updatePayModeField(mode, "date", event.target.value)
                }
                placeholder="Select Date"
              />
            </div>
          </div>
        );
      case "Complimentary":
      case "Company":
        return (
          <div className="grid gap-4">
            <div>
              <div className="mb-1 text-sm text-slate-600">Customer Name</div>
              <Input
                value={fields.customerName ?? ""}
                onChange={(event) =>
                  updatePayModeField(mode, "customerName", event.target.value)
                }
                placeholder="Enter Customer Name"
              />
            </div>
          </div>
        );
      case "Split":
        return splitStep === "choose" ? (
          <div className="space-y-4">
            <div className="text-[15px] font-medium text-slate-700">
              Choose Multiple Payment Method Below
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {PAY_MODE_OPTIONS.filter((option) => option.key !== "Split").map(
                (item) => {
                  const checked = Boolean(splitSelections[item.key]);

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() =>
                        setSplitSelections((previous) => ({
                          ...previous,
                          [item.key]: !previous[item.key],
                        }))
                      }
                      className={`flex items-center gap-3 rounded-sm border px-3 py-3 text-left transition ${
                        checked
                          ? "border-emerald-500 bg-emerald-50/40"
                          : "border-slate-300 bg-white hover:border-slate-400"
                      }`}
                    >
                      <Checkbox checked={checked} onChange={() => undefined} />
                      <img
                        src={item.image}
                        alt={item.label}
                        className="h-5 w-5 object-contain"
                      />
                      <span className="text-[13px] text-slate-700">
                        {item.label}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
            <div className="flex items-center justify-end">
              <Button
                type="primary"
                className="!bg-emerald-500 !border-emerald-500"
                onClick={() => {
                  const hasSelection =
                    Object.values(splitSelections).some(Boolean);

                  if (!hasSelection) {
                    message.warning(
                      "Please select at least one payment method",
                    );
                    return;
                  }

                  setSplitStep("details");
                }}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-slate-700"
              onClick={() => setSplitStep("choose")}
            >
              <span className="text-lg leading-none">←</span>
              <span className="text-[14px] font-medium">Split Pay Mode</span>
            </button>

            <div>
              <div className="mb-1 text-sm text-slate-600">Amount</div>
              <Input
                value={fields.amount ?? ""}
                onChange={(event) =>
                  updatePayModeField(mode, "amount", event.target.value)
                }
                placeholder="Enter amount"
              />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-600">Bank Name</div>
              <Input
                value={fields.bankName ?? ""}
                onChange={(event) =>
                  updatePayModeField(mode, "bankName", event.target.value)
                }
                placeholder="Enter Bank Name"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <RightSideDrawer
      open={open}
      onClose={onClose}
      title=""
      width={480}
      maskClosable={false}
      keyboard={false}
      bodyStyle={{ padding: 0, overflow: "hidden" }}
      hideHeader
      footer={
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-3">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={onSave}>
            Save
          </Button>
        </div>
      }
    >
      <div className="flex min-h-0 w-full min-w-0 flex-col bg-white">
        <div className="relative bg-gradient-to-r from-[#e5f5fd] to-[#f4f7fe] px-5 py-6">
          <button
            type="button"
            aria-label="Close pay mode picker"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-slate-800"
          >
            <CloseOutlined className="text-base" />
          </button>

          <div className="flex items-center gap-4">
            <div className="h-28 w-28 shrink-0 overflow-hidden">
              <img
                src={paymentModeHero}
                alt="Payment"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="text-[13px] font-medium text-slate-600">
                Payable Amount
              </div>
              <div className="mt-1.5 text-[40px] font-bold leading-none text-[#eab308]">
                ₹{amount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 px-5">
          <div className="text-[15px] font-semibold text-slate-900">
            Select Your Payment Method
          </div>
          <div className="mt-1.5 text-[12px] leading-relaxed text-slate-400">
            "Choose your preferred payment option from the available methods to
            complete your transaction securely and conveniently."
          </div>
        </div>

        <div className="overflow-hidden px-5 pb-5 pt-4">
          <div className="paymode-scrollbar flex gap-4 overflow-y-hidden scroll-smooth pb-3 pr-1 snap-x snap-mandatory select-none">
            {PAY_MODE_OPTIONS.map((option) => {
              const active = payMode === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onSelectPayMode(option.key)}
                  className="flex shrink-0 snap-start flex-col items-center gap-2 cursor-pointer outline-none focus:outline-none"
                >
                  <div
                    className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border transition-all duration-200 ${
                      active
                        ? "border-sky-500 bg-sky-50/50 shadow-sm shadow-sky-100"
                        : "border-slate-100 bg-[#f4f7f9] hover:border-slate-300 hover:bg-[#eaf0f4]"
                    }`}
                  >
                    <img
                      src={option.image}
                      alt={option.label}
                      className="h-9 w-9 object-contain"
                    />
                  </div>
                  <div
                    className={`w-[80px] text-center text-[10px] font-medium transition-colors duration-200 truncate ${
                      active ? "text-sky-600 font-bold" : "text-slate-700"
                    }`}
                  >
                    {option.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 py-4">
          {renderModeFields(payMode)}
        </div>
      </div>
    </RightSideDrawer>
  );
};

export default PayModeDrawer;
