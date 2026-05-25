import { Card, Drawer } from "antd";
import React, { useRef, useState } from "react";
import "./paymentPopup.css";
import { AiOutlineClose } from "react-icons/ai";
import { Col, Row } from "antd";
import paymentmodeImg from "../../../../../assets/payMode/paymentModeImage.png";
import PayDetails from "./PayDetails";
import { PAYMENT_MODES, paymentModes } from "../Utils";
interface PaymentMode {
  id: number;
  label: string;
  icon: string;
  requiresDetails: boolean;
}

interface PaymentData {
  nPaymode: number;
  nPayAmount: number;
  cpaymodeName?: string;
  chequeDetails?: {
    cChequeNumber: string;
    cBankName: string;
    cChequeDate: string;
  };
  customerCreditDtls?: {
    nCustomerId: number;
    cCustomerName: string;
    cAuthorizedPerson: string;
    nAuthPersonId: number;
  };
  transactionDetails?: {
    cTransactionReference: string;
    cUpiId?: string;
    cCardNumber?: string;
    notes?: string;
    ntransactionstatus?: number;
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  handleSave: (data: PaymentData) => void;
  values:any;
  isReceipt?: boolean;
}

const PaymentPopup: React.FC<Props> = ({
  open,
  onClose,
  handleSave,
  values,
  isReceipt = false,
}) => {
  const [selectedMode, setSelectedMode] = useState<PaymentMode | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handlePaymentSubmit = (details: any) => {
    const paymentData: PaymentData = {
      nPaymode: selectedMode?.id || 0,
      nPayAmount: values.nTotal,
      cpaymodeName: selectedMode?.label || "",
    };

    if (selectedMode?.id === PAYMENT_MODES.CHEQUE) {
      paymentData.chequeDetails = details;
    } else if (
      [PAYMENT_MODES.UPI, PAYMENT_MODES.CARD].includes(selectedMode?.id || 0)
    ) {
      paymentData.transactionDetails = details;
    } else if (
      [PAYMENT_MODES.COMPLEMENTARY, PAYMENT_MODES.COMPANY_CREDIT].includes(
        selectedMode?.id || 0
      )
    ) {
      paymentData.customerCreditDtls = details;
    }

    handleSave(paymentData);
    onClose();
  };

  const handleModeSelect = (mode: PaymentMode) => {
    setSelectedMode(mode);
  };

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    (container as any).isDragging = true;
    (container as any).startX = e.pageX - container.offsetLeft;
    (container as any).scrollLeftStart = container.scrollLeft || 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container || !(container as any).isDragging) return;

    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = x - (container as any).startX;
    container.scrollLeft = (container as any).scrollLeftStart - walk;
  };

  const handleMouseUp = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    (container as any).isDragging = false;
  };

  const handleClose = () => {
    setSelectedMode(null);
    onClose();
  };

  return (
    <div>
      <Drawer
        className="payment-drawer position-relative"
        open={open}
        onClose={onClose}
        closable={false}
        width={635}
      >
        <div className="drawer-close">
          <AiOutlineClose
            fontSize={22}
            style={{ cursor: "pointer" }}
            onClick={() => {
              onClose();
              handleClose();
            }}
          />
        </div>
        <Card className="payment-drawer-card ">
          <Row>
            <Col sm={12}>
              <img src={paymentmodeImg} alt="paymentmodeImg" />
            </Col>
            <Col sm={12} className="items-center mt-5">
              <p className="payment-drawer-card-title mb-2">Pay Amount</p>
              <h2 className="payment-drawer-card-amount">
                {values?.nTotal ? `₹${(Number(values.nTotal) || 0).toFixed(2)}` : "₹0.00"}
              </h2>
            </Col>
          </Row>
        </Card>
        <Row className="mt-3">
          <Col sm={24}>
            <p className="select-payment-mode mb-2">
              Select Your Payment Method
            </p>
            <p className="payment-description mb-2">
              "Choose your preferred payment option from the available methods
              to complete your transaction securely and conveniently."
            </p>
          </Col>
        </Row>
        <div
          ref={scrollContainerRef}
          className="payment-scroll-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseUp}
          onMouseUp={handleMouseUp}
        >
          <div className="flex gap-3">
            {paymentModes
              .filter((mode) => {
                if (isReceipt) {
                  return ![
                    PAYMENT_MODES.COMPLEMENTARY,
                    PAYMENT_MODES.COMPANY_CREDIT,
                    PAYMENT_MODES.CHEQUE,
                    PAYMENT_MODES.SPLIT,
                  ].includes(mode.id);
                }

                return true;
              })
              .map((item, index) => (
                <div
                  key={index}
                  className="text-center d-flex flex-column align-items-center"
                >
                  <div
                    className="payment-mode-list mb-1"
                    onClick={() => {
                      handleModeSelect(item);
                    }}
                  >
                    <img src={item?.icon} alt="" />
                  </div>
                  <div>
                    <p className="payment-mode-name">{item?.label}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <Row>
          <Col sm={24}>
            <PayDetails
              mode={selectedMode}
              modeId={selectedMode?.id}
              isOpen={isOpen}
              nPayAmount={values?.nTotal}
              toggle={toggle}
              handleSave={handlePaymentSubmit}
            />
          </Col>
        </Row>
      </Drawer>
    </div>
  );
};

export default PaymentPopup;
