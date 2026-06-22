import React, { useEffect, useRef, useState } from 'react';
import { Table, Select, InputNumber, Button, message, Popover, Input, Modal } from 'antd';
import { PlusOutlined, CloseOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosInstance from '../../../Axios/axios';
import { getConfig } from '../../../Axios/config';
import deleteRed from '../../../assets/icons/delete-red.svg';
import narrationIcon from '../../../assets/icons/NarrationIcon.svg';
import shareIcon from '../../../assets/icons/shareIcon.svg';
import closeBlack from '../../../assets/icons/close-black.svg';

interface EstimateModalProps {
  open: boolean;
  onClose: () => void;
  ticketId: number;
  customerId?: number;
  historyId?: number;
  customerName: string;
  sessionPayload: any;
}

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

const EstimateModal: React.FC<EstimateModalProps> = ({
  open,
  onClose,
  ticketId,
  customerId,
  historyId,
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
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPreviewPrompt, setShowPreviewPrompt] = useState(false);
  const [savedEstimateId, setSavedEstimateId] = useState<number>(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');
  const [isPdfRendering, setIsPdfRendering] = useState(false);
  const [pdfRenderError, setPdfRenderError] = useState<string>('');
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      fetchEstimateData();
      setItems([{ key: Date.now(), partId: null, qty: 0, rate: 0, value: 0, discount: 0, tax: 0, total: 0, narration: '' }]);
      setShowPreviewPrompt(false);
      setSavedEstimateId(0);
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

  const totalValue = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + (item.tax || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const roundOff = Math.round(totalAmount) - totalAmount;
  const grandTotal = Math.round(totalAmount);
  const notes = items.filter((item) => (item.cNarration || '').trim());

  const handleOpenNarration = (key: number) => {
    setOpenNarrationKey(key);
  };

  const handleClearNarration = (key: number) => {
    handleItemChange(key, 'cNarration', '');
    if (openNarrationKey === key) {
      setOpenNarrationKey(null);
    }
  };

  const getErrorMessage = (error: any) => {
    const responseData = error?.response?.data;

    return (
      responseData?.message ||
      responseData?.title ||
      error?.message ||
      'Unable to process estimate'
    );
  };

  const resolvePdfUrl = (url: string) => {
    if (!url) {
      return '';
    }

    const apiBaseUrl = getConfig().API_BASE_URL.replace(/\/$/, '');
    const apiOrigin = (() => {
      try {
        const parsed = new URL(apiBaseUrl);
        return parsed.origin;
      } catch {
        return apiBaseUrl.replace(/\/Api\/V1\/?$/i, '').replace(/\/$/, '');
      }
    })();

    return /^https?:\/\//i.test(url)
      ? url
      : `${apiOrigin}/${String(url).replace(/^\//, '')}`;
  };

  const closePdfPreview = () => {
    if (pdfPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
    setPdfPreviewUrl('');
    setPdfRenderError('');
    setIsPdfRendering(false);
    setIsPreviewOpen(false);
  };

  const openPdfPreviewFromUrl = async (url: string) => {
    const resolvedUrl = resolvePdfUrl(url);

    if (!resolvedUrl) {
      message.error('PDF URL is missing');
      return;
    }

    setIsPreviewOpen(true);
    setIsPdfRendering(true);
    setPdfRenderError('');

    try {
      const pdfResponse = await axiosInstance.get(resolvedUrl, {
        responseType: 'blob',
      });

      const blob = pdfResponse.data as Blob;
      const objectUrl = URL.createObjectURL(blob);
      setPdfPreviewUrl(objectUrl);
    } catch (error: any) {
      console.error(error);
      setPdfRenderError(error?.message || 'Unable to load estimate PDF');
    }
  };

  const loadPdfJs = async () => {
    if (window.pdfjsLib) return window.pdfjsLib;

    await new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-pdfjs-lib="true"]',
      );

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load PDF renderer')), {
          once: true,
        });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.min.js';
      script.async = true;
      script.dataset.pdfjsLib = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PDF renderer'));
      document.body.appendChild(script);
    });

    if (!window.pdfjsLib) {
      throw new Error('PDF renderer not available');
    }

    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.worker.min.js';

    return window.pdfjsLib;
  };

  const renderPdfPreview = async (url: string) => {
    if (!url || !previewContainerRef.current) return;

    setIsPdfRendering(true);
    setPdfRenderError('');

    try {
      const pdfjsLib = await loadPdfJs();
      const loadingTask = pdfjsLib.getDocument({ url });
      const pdf = await loadingTask.promise;

      if (!previewContainerRef.current) return;
      previewContainerRef.current.innerHTML = '';

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.35 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto 16px';
        canvas.style.background = '#fff';

        await page.render({ canvasContext: context, viewport }).promise;
        previewContainerRef.current.appendChild(canvas);
      }
    } catch (error: any) {
      console.error(error);
      setPdfRenderError(error?.message || 'Unable to render estimate PDF');
    } finally {
      setIsPdfRendering(false);
    }
  };

  useEffect(() => {
    if (!isPreviewOpen || !pdfPreviewUrl) {
      return;
    }

    renderPdfPreview(pdfPreviewUrl);

    return () => {
      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = '';
      }
    };
  }, [isPreviewOpen, pdfPreviewUrl]);

  const tryOpenPdfFromResponse = async (response: any) => {
    const responseData = response?.data;
    const responseUrl =
      responseData?.data?.cFileUrl ??
      responseData?.cFileUrl ??
      responseData?.data?.fileUrl ??
      responseData?.fileUrl ??
      responseData?.data?.pdfUrl ??
      responseData?.data?.cPdfUrl ??
      responseData?.data?.url ??
      responseData?.data?.fileUrl ??
      responseData?.data?.path ??
      responseData?.pdfUrl ??
      responseData?.cPdfUrl ??
      responseData?.url ??
      responseData?.fileUrl ??
      responseData?.path;

    if (typeof responseUrl === 'string' && responseUrl.trim()) {
      await openPdfPreviewFromUrl(responseUrl.trim());
      return;
    }

    const blob = response?.data;
    const contentType = String(response?.headers?.['content-type'] || '');

    if (blob instanceof Blob) {
      if (contentType.includes('json') || contentType.includes('text/plain')) {
        try {
          const text = await blob.text();
          const parsed = JSON.parse(text);
          const parsedUrl =
            parsed?.data?.pdfUrl ??
            parsed?.data?.cPdfUrl ??
            parsed?.data?.url ??
            parsed?.data?.fileUrl ??
            parsed?.data?.path ??
            parsed?.pdfUrl ??
            parsed?.cPdfUrl ??
            parsed?.url ??
            parsed?.fileUrl ??
            parsed?.path;

          if (typeof parsedUrl === 'string' && parsedUrl.trim()) {
            await openPdfPreviewFromUrl(parsedUrl.trim());
            return;
          }
        } catch (parseError) {
          console.error(parseError);
        }
      }

      const objectUrl = URL.createObjectURL(blob);
      setIsPreviewOpen(true);
      setPdfPreviewUrl(objectUrl);
      return;
    }

    if (contentType.includes('pdf')) {
      const objectUrl = URL.createObjectURL(new Blob([response?.data], { type: 'application/pdf' }));
      setIsPreviewOpen(true);
      setPdfPreviewUrl(objectUrl);
      return;
    }

    message.error('Unable to open estimate PDF');
  };

  const buildEstimatePayload = () => {
    const itemDtls = items.map(({ key, ...item }) => {
      const partId = Number(item.partId || 0);
      const rate = Number(item.rate || 0);
      const qty = Number(item.qty || 1);
      const discount = Number(item.discount || 0);
      const tax = Number(item.tax || 0);
      const total = Number(item.total || 0);
      const narration = String(item.narration || '').trim();

      return {
        nPartId: partId,
        nQty: qty,
        nRate: rate,
        nDiscAmt: discount,
        nTaxAmount: tax,
        cNarration: narration,
        nCompanyId: sessionPayload?.nCompanyId,
        partId,
        qty,
        rate,
        discount,
        tax,
        total,
        narration,
      };
    });

    const grossAmount = items.reduce((sum, item) => sum + Number(item.value || item.total || 0), 0);
    const discountAmount = Number(totalDiscount || 0);
    const taxAmount = Number(totalTax || 0);
    const roundoffAmount = Number(roundOff || 0);
    const totalAmount = Number(grandTotal || 0);
    const createdBy = Number(sessionPayload?.nCreatedBy ?? sessionPayload?.id ?? sessionPayload?.nAgentId ?? 0);

    return {
      ...sessionPayload,
      nTicketId: ticketId,
      TicketId: ticketId,
      nHistoryId: Number(historyId || 0),
      nEstimateNo: estimateNo,
      cEstimateNo: estimateNo,
      EstimateNo: estimateNo,
      CustomerName: customerName,
      cCustomerName: customerName,
      nCustomerId: Number(customerId || 0),
      CustomerId: Number(customerId || 0),
      customerId: Number(customerId || 0),
      nCreatedBy: createdBy,
      nGrossAmount: grossAmount.toFixed(2),
      nTaxAmount: taxAmount.toFixed(2),
      nDiscountAmt: discountAmount.toFixed(2),
      nRoundoffAmount: roundoffAmount.toFixed(2),
      nTotalAmount: totalAmount.toFixed(2),
      itemDtls,
    };
  };

  const handleSaveEstimate = async () => {
    try {
      setIsSaving(true);

      const payload = buildEstimatePayload();
      const response = await axiosInstance.post('/Api/V1/Estimate/EstimateSave', payload);
      const responseData = response?.data?.data ?? response?.data ?? {};
      const nextSavedEstimateId = Number(
        responseData?.estimateHdrData?.[0]?.nEstimateId ??
        responseData?.estimateHdrData?.[0]?.EstimateId ??
        responseData?.estimateHdrData?.[0]?.estimateId ??
        responseData?.estimateHdrData?.[0]?.id ??
        responseData?.estimateHdrData?.[0]?.Id ??
        responseData?.nEstimateId ??
        responseData?.EstimateId ??
        responseData?.estimateId ??
        responseData?.id ??
        responseData?.Id ??
        0
      );

      setSavedEstimateId(nextSavedEstimateId);
      setShowPreviewPrompt(true);
      message.success('Estimate saved successfully');
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);

      const nextSavedEstimateId = Number(savedEstimateId || 0);

      if (!nextSavedEstimateId) {
        message.error('Saved estimate id was not returned by the save API');
        return;
      }

      const payload = {
        nCompanyId: Number(sessionPayload?.nCompanyId || 0),
        nEstimateId: nextSavedEstimateId,
        cSchemaName: sessionPayload?.cSchemaName,
        cDbName: sessionPayload?.cDbName,
      };

      const response = await axiosInstance.post(
        '/Api/V1/Estimate/ExportEsitmatePdf',
        payload,
      );

      await tryOpenPdfFromResponse(response);
      setShowPreviewPrompt(false);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setIsExportingPdf(false);
    }
  };

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
                  value={record.cNarration}
                  onChange={(e) => handleItemChange(record.key, 'cNarration', e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="primary"
                    style={{ backgroundColor: 'black', borderColor: 'black', color: 'white' }}
                    size="medium"
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
              onClick={() => handleOpenNarration(record.key)}
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

      <div className="flex-1 min-h-0 overflow-auto px-6 pb-6">
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

        {notes.length > 0 && (
          <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50/80 ">
            {/* <div className="border-b border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
              Notes {notes.length ? `(${notes.length})` : ''}
            </div> */}
            <div className="divide-y divide-slate-200">
              {notes.map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4 bg-[#eaf4ff] px-4 py-1">
                  <div className="min-w-0 flex-1 text-sm text-slate-700">
                    {item.cNarration}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      className="text-slate-600 hover:bg-white"
                      onClick={() => handleOpenNarration(item.key)}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      className="text-rose-600 hover:bg-white"
                      onClick={() => handleClearNarration(item.key)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between border-t border-slate-200 bg-slate-50 p-6">
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
        <Button
          type="primary"
          style={{ backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' }}
          className="min-w-[100px]"
          size="large"
          loading={isSaving}
          onClick={handleSaveEstimate}
        >
          Save
        </Button>
      </div>

      <Modal
        open={showPreviewPrompt}
        onCancel={() => setShowPreviewPrompt(false)}
        footer={null}
        centered
        width={420}
        destroyOnClose
        title={null}
        closeIcon={<CloseOutlined className="text-xl text-black" />}
        styles={{
          body: {
            padding: '18px 20px 20px',
          },
          content: {
            borderRadius: 12,
          },
        }}
      >
        <div className="space-y-5">
          <div className="text-[18px] font-medium text-slate-900">Estimate</div>
          <div className="h-px w-full bg-slate-200" />
          <div className="text-sm text-slate-700">
            Would you like to view the estimate preview ?
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <Button onClick={() => setShowPreviewPrompt(false)}>
              No
            </Button>
            <Button
              type="primary"
              loading={isExportingPdf}
              onClick={handleExportPdf}
              className="!bg-emerald-500 !border-emerald-500 hover:!bg-emerald-600 hover:!border-emerald-600"
            >
              Yes
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isPreviewOpen}
        onCancel={closePdfPreview}
        footer={null}
        centered
        width="90vw"
        destroyOnClose
        closable={false}
        maskClosable={false}
        styles={{
          body: {
            padding: 0,
            background: '#0f172a',
          },
          content: {
            borderRadius: 14,
            overflow: 'hidden',
          },
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-700 bg-[#111827] px-4 py-3">
          <div className="text-sm font-medium text-white">Estimate Preview</div>
          <div className="flex items-center gap-2">
            <Button
              type="text"
              className="flex items-center justify-center rounded-md p-2 hover:bg-white/10"
              icon={<img src={shareIcon} alt="share" className="h-4 w-4" />}
              onClick={async () => {
                try {
                  if (navigator.share && pdfPreviewUrl) {
                    await navigator.share({ title: 'Estimate Preview', url: pdfPreviewUrl });
                  } else if (pdfPreviewUrl) {
                    await navigator.clipboard.writeText(pdfPreviewUrl);
                    message.success('PDF link copied');
                  }
                } catch (error) {
                  console.error(error);
                }
              }}
            />
            <Button
              type="text"
              className="flex items-center justify-center rounded-md p-2 hover:bg-white/10"
              icon={<img src={closeBlack} alt="close" className="h-4 w-4 invert" />}
              onClick={closePdfPreview}
            />
          </div>
        </div>

        <div className="max-h-[85vh] overflow-auto bg-[#1f2937] p-4">
          {isPdfRendering || (!pdfPreviewUrl && isPreviewOpen) ? (
            <div className="flex min-h-[320px] items-center justify-center text-sm text-white">
              Loading preview...
            </div>
          ) : null}
          {pdfRenderError ? (
            <div className="flex min-h-[320px] items-center justify-center text-sm text-red-300">
              {pdfRenderError}
            </div>
          ) : null}
          <div ref={previewContainerRef} className="mx-auto max-w-5xl" />
        </div>
      </Modal>
    </div>
  );
};

export default EstimateModal;
