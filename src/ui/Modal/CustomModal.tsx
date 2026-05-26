import React from 'react';
import { Modal } from 'antd';
import './modal.css';

export interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  width?: number | string;
  footer?: React.ReactNode;
  destroyOnClose?: boolean;
}

const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 600,
  footer = null,
  destroyOnClose = true,
}) => {
  return (
    <Modal
      open={isOpen}
      title={<div className="text-lg font-semibold text-slate-800">{title}</div>}
      onCancel={onClose}
      width={width}
      footer={footer}
      destroyOnClose={destroyOnClose}
      className="custom-modal"
      centered
    >
      <div className="py-4">
        {children}
      </div>
    </Modal>
  );
};

export default CustomModal;
