import React, { useEffect, useRef, useState } from 'react';
import { Table, Select, InputNumber, Button, message, Popover, Input, Modal } from 'antd';
import { PlusOutlined, CloseOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../Axios/axios';
import { billingApis } from '../../../Axios/BillingApis';
import { getConfig } from '../../../Axios/config';
import { getRequestPayload } from '../../../Utils/requestPayload';
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
  estimateId?: number;
  customerName: string;
  sessionPayload?: any;
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
  estimateId,
  customerName,
  sessionPayload = getRequestPayload(),
}) => {
  const navigate = useNavigate();
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
  const [pdfPageCount, setPdfPageCount] = useState<number>(0);
  const [loadedCustomerName, setLoadedCustomerName] = useState<string>('');
  const [manualGrandTotal, setManualGrandTotal] = useState<number | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const resolvedEstimateId = Number(estimateId || historyId || 0);
  const displayCustomerName = customerName || loadedCustomerName;

  const getPartTaxRows = (part: any) => {
    const rawTaxes =
      part?.taxes ??
      part?.taxSettings ??
      part?.partTaxes ??
      part?.tax ??
      part?.partTax ??
      part?.partTaxSetting ??
      [];

    const taxArray = Array.isArray(rawTaxes)
      ? rawTaxes
      : rawTaxes
        ? [rawTaxes]
        : [];

    return taxArray
      .map((tax: any) => ({
        taxId: Number(
          tax?.nTaxId ??
            tax?.taxId ??
            tax?.id ??
            tax?.nPartTaxId ??
            tax?.nTaxMasterId ??
            0,
        ),
        taxName: String(
          tax?.cTaxName ??
            tax?.taxName ??
            tax?.name ??
            tax?.cName ??
            '',
        ),
        taxRate: Number(
          tax?.nTaxRate ??
            tax?.taxRate ??
            tax?.nRate ??
            tax?.rate ??
            0,
        ),
        applyAfterDisc: Boolean(
          tax?.bApplyAfterDisc ??
            tax?.applyAfterDisc ??
            tax?.bAfterDiscount ??
            tax?.afterDiscount ??
            false,
        ),
      }))
      .filter(
        (tax) =>
          tax.taxId > 0 ||
          String(tax.taxName).trim() ||
          tax.taxRate > 0,
      );
  };

  const getPartTaxMeta = (part: any) => {
    const taxRows = getPartTaxRows(part);
    const taxRate = taxRows.reduce(
      (sum, tax) => sum + Number(tax.taxRate || 0),
      0,
    );

    return {
      taxRows,
      taxId: taxRows[0]?.taxId ?? 0,
      taxRate: Number(taxRate || 0),
    };
  };

  const calculateLocalTaxAmount = (taxRows: any[], baseAmount: number, taxableAmount: number) =>
    Number(
      taxRows
        .reduce((sum, tax) => {
          const taxBase = tax.applyAfterDisc ? taxableAmount : baseAmount;
          return sum + ((Number(taxBase || 0) * Number(tax.taxRate || 0)) / 100);
        }, 0)
        .toFixed(2),
    );

  const isServiceChargePart = (part: any) =>
    Boolean(
      part?.bservicecharge ??
        part?.bServiceCharge ??
        part?.serviceCharge ??
        false,
    );

  const resolveTaxAmount = (response: any) => {
    const responseData = response?.data ?? response;
    const possibleValues = [
      responseData?.data?.nTaxAmount,
      responseData?.data?.taxAmount,
      responseData?.data?.nTaxValue,
      responseData?.data?.taxValue,
      responseData?.data?.amount,
      responseData?.data?.nAmount,
      responseData?.nTaxAmount,
      responseData?.taxAmount,
      responseData?.nTaxValue,
      responseData?.taxValue,
      responseData?.amount,
      responseData?.nAmount,
      responseData?.tax,
      responseData?.data?.tax,
      responseData?.data?.result?.nTaxAmount,
      responseData?.data?.result?.taxAmount,
      responseData?.data?.result?.taxValue,
      responseData?.result?.nTaxAmount,
      responseData?.result?.taxAmount,
      responseData?.result?.taxValue,
      Array.isArray(responseData?.data) ? responseData.data[0]?.nTaxAmount : undefined,
      Array.isArray(responseData?.data) ? responseData.data[0]?.taxAmount : undefined,
      Array.isArray(responseData?.data) ? responseData.data[0]?.taxValue : undefined,
      Array.isArray(responseData?.data) ? responseData.data[0]?.amount : undefined,
    ];

    const parsedTax = Number(
      possibleValues.find((value) => {
        const num = Number(value);
        return Number.isFinite(num) && num > 0;
      }) ?? 0,
    );

    return Number.isFinite(parsedTax) ? parsedTax : 0;
  };

  const updateItemTax = (
    key: number,
    taxAmount: number,
    options?: { preserveTotal?: boolean },
  ) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.key !== key) {
          return item;
        }

        const nextTax = Number(taxAmount || 0);
        const nextValue = Number(item.value || 0);
        const nextDiscount = Number(item.discount || 0);

        return {
          ...item,
          tax: nextTax,
          total: options?.preserveTotal
            ? Number(item.total || 0)
            : nextValue - nextDiscount + nextTax,
        };
      }),
    );
  };

  const fetchAndApplyTax = async (item: any, taxableAmount: number) => {
    const part = partList.find((p) => p.nPartId === item.partId);
    const isServiceCharge = isServiceChargePart(part);
    const taxMeta = getPartTaxMeta(part);

    if (!item.partId || isServiceCharge) {
      updateItemTax(item.key, 0);
      return;
    }

    const localTaxAmount = calculateLocalTaxAmount(
      taxMeta.taxRows,
      Number(item.value || 0),
      Number(taxableAmount || 0),
    );

    try {
      const payload = {
        ...sessionPayload,
        nCompanyId: Number(sessionPayload?.nCompanyId ?? 0),
        cSchemaName: sessionPayload?.cSchemaName,
        cDbName: sessionPayload?.cDbName,
        nTicketId: Number(ticketId || 0),
        nCustomerId: Number(customerId || 0),
        nPartId: Number(item.partId || 0),
        nTaxId: taxMeta.taxId,
        nTaxRate: taxMeta.taxRate,
        nQty: Number(item.qty || 0),
        nRate: Number(item.rate || 0),
        nDiscAmt: Number(item.discount || 0),
        nAmount: Number(taxableAmount || 0),
        nTaxableAmount: Number(taxableAmount || 0),
        nGrossAmount: Number(taxableAmount || 0),
      };

      const response = await billingApis.getTaxValue(payload);
      const apiTaxAmount = resolveTaxAmount(response);
      const taxAmount = apiTaxAmount > 0 ? apiTaxAmount : localTaxAmount;
      updateItemTax(item.key, taxAmount);
    } catch (error) {
      console.error(error);
      updateItemTax(item.key, localTaxAmount);
    }
  };

  const getFirstNumber = (source: any, keys: string[], fallback = 0) => {
    for (const key of keys) {
      const value = Number(source?.[key]);
      if (Number.isFinite(value) && value > 0) {
        return value;
      }
    }
    return fallback;
  };

  const getEstimateRows = (responseData: any) => {
    const candidates = [
      responseData?.partDetails,
      responseData?.estimateHdrData?.[0]?.itemDtls,
      responseData?.estimateDtlData,
      responseData?.estimateDtlData?.[0]?.data,
      responseData?.estimateDetails,
      responseData?.EstimateDetails,
      responseData?.estimateDtlsData,
      responseData?.EstimateDtlsData,
      responseData?.itemDtls,
      responseData?.itemDetails,
      responseData?.details,
      responseData?.data,
      responseData?.TicketTimeline,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate) && candidate.length > 0) {
        return candidate;
      }
    }

    return [];
  };

  const mapEstimateRows = (rows: any[]) =>
    rows.map((row: any) => {
      const qty = Number(row?.nQty ?? row?.qty ?? row?.quantity ?? 0);
      const rate = Number(row?.nRate ?? row?.rate ?? row?.nUnitRate ?? row?.nPrice ?? row?.price ?? 0);
      const value = Number(
        row?.nValue ??
          row?.value ??
          row?.nAmount ??
          row?.amount ??
          (qty * rate) ??
          0,
      );
      const discount = Number(row?.nDiscAmt ?? row?.discount ?? row?.discAmt ?? 0);
      const tax = Number(row?.nTaxAmount ?? row?.tax ?? row?.taxAmount ?? 0);
      const total = Number(row?.nTotalAmount ?? row?.total ?? row?.amount ?? (value - discount + tax) ?? 0);

      return {
        key: Number(row?.key ?? row?.Id ?? row?.id ?? Date.now() + Math.floor(Math.random() * 1000)),
        partId: Number(row?.nPartId ?? row?.partId ?? row?.PartId ?? 0) || null,
        qty,
        rate,
        value,
        discount,
        tax,
        total,
        narration: String(row?.cNarration ?? row?.narration ?? row?.nDescription ?? row?.description ?? '').trim(),
      };
    });

  const loadExistingEstimateData = async () => {
    try {
      setLoading(true);
      const payload = {
        nCompanyId: sessionPayload?.nCompanyId,
        nEstimateId: resolvedEstimateId,
        cSchemaName: sessionPayload?.cSchemaName,
        cDbName: sessionPayload?.cDbName,
      };

      const response = await axiosInstance.post('/Api/V1/Estimate/EstimateDetails', payload);
      const responseData = response?.data?.data ?? response?.data ?? {};
      const header =
        responseData?.estimateHdrData?.[0] ??
        responseData?.EstimateHdrData?.[0] ??
        responseData?.estimateHeader ??
        responseData?.header ??
        responseData?.TicketSummary ??
        responseData?.summary ??
        responseData ??
        {};

      const rows = getEstimateRows(responseData);
      const mappedRows = mapEstimateRows(rows);
      const nextCustomerName =
        String(
          header?.cCustomerName ??
            header?.CustomerName ??
            responseData?.cCustomerName ??
            responseData?.CustomerName ??
            customerName ??
            '',
        ).trim();

      if (mappedRows.length > 0) {
        setItems(mappedRows);
      } else {
        setItems([{ key: Date.now(), partId: null, qty: 0, rate: 0, value: 0, discount: 0, tax: 0, total: 0, narration: '' }]);
      }

      if (nextCustomerName) {
        setLoadedCustomerName(nextCustomerName);
      }

      const existingGrandTotal = getFirstNumber(
        header,
        ['nTotalAmount', 'TotalAmount', 'totalAmount', 'grandTotal', 'nGrandTotal'],
        getFirstNumber(responseData, ['nTotalAmount', 'TotalAmount', 'totalAmount', 'grandTotal', 'nGrandTotal']),
      );
      setManualGrandTotal(existingGrandTotal > 0 ? existingGrandTotal : null);

      setEstimateNo(
        String(
          header?.nEstimateNo ??
            header?.cEstimateNo ??
            header?.EstimateNo ??
            header?.estimateNo ??
            responseData?.nEstimateNo ??
            responseData?.cEstimateNo ??
            responseData?.EstimateNo ??
            responseData?.estimateNo ??
            header?.nNumber ??
            estimateNo,
        ),
      );
      setSavedEstimateId(
        getFirstNumber(
          header,
          ['nEstimateId', 'EstimateId', 'estimateId', 'id', 'Id'],
          getFirstNumber(responseData, ['nEstimateId', 'EstimateId', 'estimateId', 'id', 'Id']),
        ),
      );
    } catch (err) {
      console.error(err);
      message.error('Failed to load estimate details');
      setItems([{ key: Date.now(), partId: null, qty: 0, rate: 0, value: 0, discount: 0, tax: 0, total: 0, narration: '' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    setShowPreviewPrompt(false);
    setSavedEstimateId(0);
    setManualGrandTotal(null);

    const loadScreen = async () => {
      await fetchEstimateData();

      if (resolvedEstimateId && Number(resolvedEstimateId) > 0) {
        await loadExistingEstimateData();
        return;
      }

      setItems([{ key: Date.now(), partId: null, qty: 0, rate: 0, value: 0, discount: 0, tax: 0, total: 0, narration: '' }]);
    };

    loadScreen();
  }, [open, resolvedEstimateId]);

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
    const validationError = validateEstimateItems(items);
    if (validationError) {
      message.warning(validationError);
      return;
    }

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
        const isServiceCharge = isServiceChargePart(part);
        const taxMeta = getPartTaxMeta(part);

        if (field === 'partId') {
          if (part) {
            updated.rate = 0;
            updated.qty = isServiceCharge ? 0 : 1;
            updated.tax = 0;
            if (isServiceCharge) {
              updated.total = 0;
            }
          }
        }

        if (!isServiceCharge) {
          updated.value = (updated.qty || 0) * (updated.rate || 0);
          const taxableValue = Math.max(updated.value - (updated.discount || 0), 0);
          updated.tax = calculateLocalTaxAmount(
            taxMeta.taxRows,
            Number(updated.value || 0),
            taxableValue,
          );
          updated.total = taxableValue + (updated.tax || 0);
        } else if (field === 'total') {
          updated.total = value;
          updated.tax = 0;
        }

        return updated;
      }
      return item;
    });
    setItems(newItems);

    const updatedItem = newItems.find((item) => item.key === key);
    if (updatedItem) {
      const part = partList.find((p) => p.nPartId === updatedItem.partId);
      const isServiceCharge = isServiceChargePart(part);

      if (!isServiceCharge && updatedItem.partId && ['partId', 'qty', 'rate', 'discount'].includes(field)) {
        const taxableAmount = Math.max(
          Number(updatedItem.value || 0) - Number(updatedItem.discount || 0),
          0,
        );

        void fetchAndApplyTax(updatedItem, taxableAmount);
      }

      if (isServiceCharge) {
        updateItemTax(key, 0, { preserveTotal: true });
      }
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + (item.tax || 0), 0);
  const calculatedGrandTotal = Math.round(totalValue);
  const grandTotal = manualGrandTotal ?? calculatedGrandTotal;
  const roundOff = grandTotal - totalValue;
  const notes = items.filter((item) => (item.cNarration || '').trim());

  const validateEstimateItems = (estimateItems: any[]) => {
    for (let index = 0; index < estimateItems.length; index += 1) {
      const item = estimateItems[index];
      const rowNumber = index + 1;

      if (!Number(item.partId || 0)) {
        return `Please select a part `;
      }

      const part = partList.find((partItem) => partItem.nPartId === item.partId);
      if (isServiceChargePart(part)) {
        const amount = Number(item.total);
        if (!Number.isFinite(amount) || amount <= 0) {
          return `Please enter an amount`;
        }
        continue;
      }

      const quantity = Number(item.qty);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return `Please enter a quantity greater than 0 `;
      }

      const amount = Number(item.rate);
      if (!Number.isFinite(amount) || amount <= 0) {
        return `Please enter an amount  `;
      }

      const discount = Number(item.discount);
      const value = Number(item.value);
      if (!Number.isFinite(discount) || discount < 0 || discount > value) {
        return `Discount cannot be greater than the item value in row ${rowNumber}`;
      }
    }

    return '';
  };

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
    setPdfPageCount(0);
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

    try {
      const module = await import(/* @vite-ignore */ 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.mjs');
      const pdfjsLib = (module as any).default ?? module;
      window.pdfjsLib = pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.worker.mjs';
      return pdfjsLib;
    } catch (moduleError) {
      await new Promise<void>((resolve, reject) => {
        const script = document.querySelector<HTMLScriptElement>(
          'script[data-pdfjs-lib="true"]',
        ) ?? document.createElement('script');

        if (!script.src) {
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.min.js';
          script.async = true;
          script.dataset.pdfjsLib = 'true';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load PDF renderer'));
          document.body.appendChild(script);
        } else if (window.pdfjsLib) {
          resolve();
        } else {
          script.addEventListener('load', () => resolve(), { once: true });
          script.addEventListener('error', () => reject(new Error('Failed to load PDF renderer')), {
            once: true,
          });
        }
      });

      if (!window.pdfjsLib) {
        throw new Error('PDF renderer not available');
      }

      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.worker.min.js';

      return window.pdfjsLib;
    }
  };

  const renderPdfPreview = async (url: string) => {
    if (!url || !previewContainerRef.current) return;

    setIsPdfRendering(true);
    setPdfRenderError('');

    try {
      const pdfjsLib = await loadPdfJs();
      const loadingTask = pdfjsLib.getDocument({ url });
      const pdf = await loadingTask.promise;
      setPdfPageCount(pdf.numPages);

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
        canvas.style.margin = '0 auto';
        canvas.style.background = '#fff';

        const pageWrapper = document.createElement('div');
        pageWrapper.style.margin = '0 auto 18px';
        pageWrapper.style.maxWidth = '100%';
        pageWrapper.style.background = '#fff';
        pageWrapper.style.border = '1px solid #e2e8f0';
        pageWrapper.style.borderRadius = '12px';
        pageWrapper.style.padding = '12px';
        pageWrapper.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.08)';

        const pageLabel = document.createElement('div');
        pageLabel.textContent = `Page ${pageNumber}`;
        pageLabel.style.fontSize = '12px';
        pageLabel.style.fontWeight = '600';
        pageLabel.style.color = '#475569';
        pageLabel.style.marginBottom = '10px';

        await page.render({ canvasContext: context, viewport }).promise;
        pageWrapper.appendChild(pageLabel);
        pageWrapper.appendChild(canvas);
        previewContainerRef.current.appendChild(pageWrapper);
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

  const getPdfUrlFromResponse = (response: any) => {
    const responseData = response?.data;
    const responseUrl =
      responseData?.data?.pdfPath ??
      responseData?.data?.cPdfPath ??
      responseData?.data?.filePath ??
      responseData?.data?.path ??
      responseData?.data?.cFileUrl ??
      responseData?.cFileUrl ??
      responseData?.data?.fileUrl ??
      responseData?.fileUrl ??
      responseData?.data?.pdfUri ??
      responseData?.pdfUri ??
      responseData?.data?.pdfUrl ??
      responseData?.data?.cPdfUrl ??
      responseData?.data?.url ??
      responseData?.data?.fileUrl ??
      responseData?.data?.path ??
      responseData?.pdfPath ??
      responseData?.cPdfPath ??
      responseData?.filePath ??
      responseData?.path ??
      responseData?.pdfUrl ??
      responseData?.cPdfUrl ??
      responseData?.url ??
      responseData?.fileUrl ??
      responseData?.path;

    return typeof responseUrl === 'string' && responseUrl.trim()
      ? responseUrl.trim()
      : '';
  };

  const openEstimatePdfPage = (pdfUrl: string) => {
    if (!pdfUrl) {
      message.error('Unable to open estimate PDF');
      return;
    }

    navigate(`/estimate-invoice?pdfUrl=${encodeURIComponent(pdfUrl)}`);
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
      nEstimateId: resolvedEstimateId,
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
    const validationError = validateEstimateItems(items);
    if (validationError) {
      message.warning(validationError);
      return;
    }

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

      const pdfUrl = getPdfUrlFromResponse(response);
      openEstimatePdfPage(pdfUrl);
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
              prefix="₹"
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
          <span className="text-[#64748b]">{displayCustomerName}</span>
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

           <div className="flex justify-between">
            <span className="text-slate-600">Grand Total</span>
            <span>₹{grandTotal.toFixed(2) }</span>
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
          <div className="flex flex-col">
            <div className="text-sm font-medium text-white">PDF Viewer</div>
            {/* <div className="text-[11px] text-slate-300">
              {pdfPageCount ? `${pdfPageCount} page${pdfPageCount > 1 ? 's' : ''}` : 'Rendering document'}
            </div> */}
         
          {/* <div className="flex items-center gap-2"> */}
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
          {/* </div> */}
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
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-4 rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 text-xs text-slate-300">
              Custom PDF.js viewer with share and close controls in the header.
            </div>
            <div ref={previewContainerRef} className="space-y-4" />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EstimateModal;
