import { CloseOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import type { ReactNode } from "react";

type RightSideModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
  destroyOnClose?: boolean;
  className?: string;
};

const RightSideModal = ({
  open,
  onClose,
  title,
  children,
  width = 600,
  footer = null,
  destroyOnClose = true,
  className = "",
}: RightSideModalProps) => (
  <Modal
    open={open}
    title={title}
    onCancel={onClose}
    closeIcon={<CloseOutlined />}
    width={width}
    footer={footer}
    destroyOnClose={destroyOnClose}
    className={`ticket-side-modal ${className}`.trim()}
    rootClassName="ticket-right-modal-wrap"
    wrapClassName="ticket-right-modal-wrap"
  >
    {children}
  </Modal>
);

export default RightSideModal;
