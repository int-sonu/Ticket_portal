import React, { useState, useEffect } from 'react';
import { Table, Select, InputNumber, Button, message, Popover, Input } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import axiosInstance from '../../../Axios/axios';
import deleteRed from '../../../assets/icons/delete-red.svg';
import narrationIcon from '../../../assets/icons/NarrationIcon.svg';

interface EstimateModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: number;
  customerName: string;
  sessionPayload: any;
}

const EstimateModal: React.FC<EstimateModalProps> = ({
  open,
  onClose,
  ticketId,
  customerName,
  sessionPayload,
}) => {
  const [estimateNo, setEstimateNo] = useState<string>('01');
  const [partList, setPartList] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([
    { key: Date.now(), partId: null, qty: 0, rate: 0, value: 0, discount: 0, tax: 0, total: 0, narration: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [openNarrationKey, setOpenNarrationKey] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      fetchEstimateData();
      setItems([{ key: Date.now(), partId: null, qty: 0, rate: 0, value: 0, discount: 0, tax: 0, total: 0, narration: '' }]);
    }
  }, [open]);

  const fetchEstimateData = async () => {
    try {
      setLoading(true);
      const payload = {
        nCompanyId: sessionPayload?.nCompanyId,
        cSchemaName: sessionPayload?.cSchemaName,
        cDbName: sessionPayload?.cDbName,
        nTicketId: ticketId,
      };

      const noRes = await axiosInstance.post('/Estimate/LastEstimateNumber', payload);
      if (noRes.data?.data) {
        const estData = noRes.data.data;
        setEstimateNo(estData.lastEstimateNumber || estData.nEstimateNo || estData.cEstimateNo || (typeof estData === 'string' ? estData : '01'));
      }

      const partRes = await axiosInstance.post('/Estimate/PartListEstimate', payload);
      if (partRes.data?.data) {
        setPartList(partRes.data.data);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load estimate data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    setItems([
      ...items,
      { key: Date.now(), partId: null, qty: 0, rate: 0, value: 0, discount: 0, tax: 0, total: 0, narration: '' }
    ]);
  };

  const handleRemoveRow = (key: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.key !== key));
    }
  };

  const handleItemChange = (key: number, field: string, value: any) => {
    const newItems = items.map(item => {
      if (item.key === key) {
        const updated = { ...item, [field]: value };

        const part = partList.find(p => p.nPartId === updated.partId);
        const isServiceCharge = part?.bservicecharge;

        if (field === 'partId') {
          if (part) {
            updated.rate = part.nRate || 0;
            updated.qty = isServiceCharge ? 0 : 1;
            if (isServiceCharge) {
              updated.total = part.nRate || 0;
            }
          }
        }

        if (!isServiceCharge) {
          updated.value = (updated.qty || 0) * (updated.rate || 0);
          updated.total = updated.value - (updated.discount || 0) + (updated.tax || 0);
        } else if (field === 'total') {
          updated.total = value;
        }

        return updated;
      }
      return item;
    });
    setItems(newItems);
  };

  const totalValue = items.reduce((sum, item) => sum + (item.value || 0), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + (item.tax || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const roundOff = Math.round(totalAmount) - totalAmount;
  const grandTotal = Math.round(totalAmount);

  const columns = [
    {
      title: 'Srl',
      dataIndex: 'srl',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Description',
      dataIndex: 'partId',
      width: 300,
      render: (val: any, record: any) => (
        <Select
          className="w-full"
          value={val}
          onChange={(v) => handleItemChange(record.key, 'partId', v)}
          showSearch
          optionFilterProp="children"
        >
          {partList.map(p => (
            <Select.Option key={p.nPartId} value={p.nPartId}>
              {p.cPartName}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      width: 100,
      render: (val: any, record: any) => {
        const part = partList.find(p => p.nPartId === record.partId);
        if (part?.bservicecharge) return <div className="text-center font-bold text-slate-800">LS</div>;
        return (
          <InputNumber
            className="w-full"
            min={0}
            value={val}
            onChange={(v) => handleItemChange(record.key, 'qty', v || 0)}
          />
        );
      },
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      width: 100,
      render: (val: any, record: any) => {
        const part = partList.find(p => p.nPartId === record.partId);
        if (part?.bservicecharge) return <div className="text-center">--</div>;
        return (
          <InputNumber
            className="w-full"
            min={0}
            prefix="₹"
            value={val}
            onChange={(v) => handleItemChange(record.key, 'rate', v || 0)}
          />
        );
      },
    },
    {
      title: 'Value',
      dataIndex: 'value',
      width: 100,
      render: (val: any, record: any) => {
        const part = partList.find(p => p.nPartId === record.partId);
        if (part?.bservicecharge) return <div className="text-center">--</div>;
        return `₹${Number(val || 0).toFixed(2)}`;
      },
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      width: 100,
      render: (val: any, record: any) => {
        const part = partList.find(p => p.nPartId === record.partId);
        if (part?.bservicecharge) return <div className="text-center">--</div>;
        return (
          <InputNumber
            className="w-full"
            min={0}
            prefix="₹"
            value={val}
            onChange={(v) => handleItemChange(record.key, 'discount', v || 0)}
          />
        );
      },
    },
    {
      title: 'Tax',
      dataIndex: 'tax',
      width: 100,
      render: (val: any, record: any) => {
        const part = partList.find(p => p.nPartId === record.partId);
        if (part?.bservicecharge) return <div className="text-center">--</div>;
        return `₹${Number(val || 0).toFixed(2)}`;
      },
    },
    {
      title: 'Total',
      dataIndex: 'total',
      width: 100,
      render: (val: any, record: any) => {
        const part = partList.find(p => p.nPartId === record.partId);
        if (part?.bservicecharge) {
          return (
            <InputNumber
              className="w-full"
              min={0}
              value={val}
              onChange={(v) => handleItemChange(record.key, 'total', v || 0)}
            />
          );
        }
        return `₹${Number(val || 0).toFixed(2)}`;
      },
    },
    {
      title: 'Delete',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <div className="flex items-center gap-2">
          <Popover
            content={
              <div className="flex w-64 flex-col gap-2">
                <Input.TextArea
                  rows={3}
                  placeholder="Enter narration..."
                  value={record.narration}
                  onChange={(e) => handleItemChange(record.key, 'narration', e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="primary"
                    style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' }}
                    size="small"
                    onClick={() => setOpenNarrationKey(null)}
                  >
                    Save
                  </Button>
                </div>
              </div>
            }
            trigger="click"
            placement="bottomRight"
            open={openNarrationKey === record.key}
            onOpenChange={(visible) => setOpenNarrationKey(visible ? record.key : null)}
          >
            <Button
              type="text"
              className="flex items-center justify-center p-1 hover:bg-slate-100"
              icon={<img src={narrationIcon} alt="narration" className="h-4 w-4" />}
            />
          </Popover>
          <Button
            type="text"
            className="flex items-center justify-center p-1 hover:bg-red-50"
            icon={<img src={deleteRed} alt="delete" className="h-4 w-4" />}
            onClick={() => handleRemoveRow(record.key)}
          />
          {index === items.length - 1 && (
            <Button
              type="primary"
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-md"
              style={{ backgroundColor: 'black' }}
              icon={<PlusOutlined />}
              onClick={handleAddRow}
            />
          )}
        </div>
      ),
    },
  ];

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      {/* Header row: Title + Date + Close */}
      <div className="flex items-center justify-between px-6 py-3">
        <h2 className="m-0 text-[18px] font-bold text-[#0f172a]">Estimate</h2>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-[#64748b]">{new Date().toLocaleString()}</span>
          <Button type="text" size="small" icon={<CloseOutlined className="text-base text-slate-500" />} onClick={onClose} />
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-slate-200" />

      {/* Estimate No + Customer Name row */}
      <div className="flex items-center gap-10 px-6 py-3 text-[13px] text-[#3b82f6]">
        <div>
          <span className="text-[#64748b]">Estimate No : </span>
          <span className="font-medium text-[#3b82f6]">{estimateNo}</span>
        </div>
        <div>
          <span className="text-[#64748b]">Customer Name : </span>
          <span className="text-[#64748b]">{customerName}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="mb-2 font-bold text-slate-800">Add Items</div>
        <Table
          dataSource={items}
          columns={columns}
          pagination={false}
          loading={loading}
          size="small"
          rowClassName={() => "bg-white"}
          components={{
            header: {
              cell: (props: any) => {
                const { className, ...restProps } = props;
                return <th {...restProps} className={className || ''} style={{ backgroundColor: '#6aa8d9', color: 'white', fontWeight: 500 }} />
              }
            }
          }}
        />
      </div>

      <div className="mt-auto border-t border-slate-200 bg-slate-50 p-6 flex justify-between items-end">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Total</span>
            <span>₹{totalValue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Discount</span>
            <span>₹{totalDiscount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Tax Amount</span>
            <span>₹{totalTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Round Off</span>
            <span>₹{roundOff.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-slate-200">
            <span className="text-slate-800">Grand Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
        <Button type="primary" style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' }} className="min-w-[100px]" size="large">
          Save
        </Button>
      </div>
    </div>
  );
};

export default EstimateModal;
