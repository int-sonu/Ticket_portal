import { CloseOutlined } from "@ant-design/icons";
import { Drawer } from "antd";
import type { CSSProperties, ReactNode } from "react";

type RightSideDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  width?: number;
  footer?: ReactNode;
  destroyOnClose?: boolean;
  className?: string;
  bodyStyle?: CSSProperties;
  hideHeader?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
};

const RightSideDrawer = ({
  open,
  onClose,
  title,
  children,
  width = 500,
  footer = null,
  destroyOnClose = true,
  className = "",
  bodyStyle,
  hideHeader = false,
  maskClosable = true,
  keyboard = true,
}: RightSideDrawerProps) => (
  <Drawer
    open={open}
    forceRender
    onClose={onClose}
    closable={false}
    maskClosable={maskClosable}
    keyboard={keyboard}
    title={
      hideHeader ? null : (
        <div className="flex items-center justify-between">
          <span>{title}</span>
          <button
            type="button"
            aria-label="Close drawer"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <CloseOutlined />
          </button>
        </div>
      )
    }
    placement="right"
    zIndex={1500}
    width={width}
    destroyOnClose={destroyOnClose}
    className={`simple-master-drawer ${className}`.trim()}
    footer={footer}
    styles={{
      header: hideHeader ? { display: "none" } : undefined,
      body: bodyStyle,
    }}
  >
    {children}
  </Drawer>
);

export default RightSideDrawer;
