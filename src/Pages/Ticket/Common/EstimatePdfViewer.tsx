import { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../../Axios/axios';
import { getConfig } from '../../../Axios/config';
import shareIcon from '../../../assets/icons/shareIcon.svg';
import EstimateShareModal from './EstimateShareModal';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

const resolvePdfUrl = (url: string) => {
  if (!url) return '';

  const trimmed = String(url).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const apiBaseUrl = getConfig().API_BASE_URL.replace(/\/$/, '');
  const apiOrigin = (() => {
    try {
      const parsed = new URL(apiBaseUrl);
      return parsed.origin;
    } catch {
      return apiBaseUrl.replace(/\/Api\/V1\/?$/i, '').replace(/\/$/, '');
    }
  })();

  return `${apiOrigin}/${trimmed.replace(/^\//, '')}`;
};

const EstimatePdfViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [, setPageCount] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const pdfUrl = resolvePdfUrl(searchParams.get('pdfUrl') ?? searchParams.get('pdf') ?? '');

  const closeViewer = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/tickets/view');
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

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!pdfUrl || !previewContainerRef.current) {
        setIsLoading(false);
        setError('PDF URL is missing');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await axiosInstance.get(pdfUrl, {
          responseType: 'blob',
        });

        const blob = response.data as Blob;
        const objectUrl = URL.createObjectURL(blob);

        const pdfjsLib = await loadPdfJs();
        const loadingTask = pdfjsLib.getDocument({ url: objectUrl });
        const pdf = await loadingTask.promise;

        if (cancelled || !previewContainerRef.current) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setPageCount(pdf.numPages);
        previewContainerRef.current.innerHTML = '';

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.15 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (!context) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.display = 'block';
          canvas.style.background = '#fff';

          const pageWrapper = document.createElement('div');
          pageWrapper.style.background = '#fff';
          pageWrapper.style.border = '1px solid #e2e8f0';
          pageWrapper.style.borderRadius = '12px';
          pageWrapper.style.padding = '12px';
          pageWrapper.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.12)';

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

        URL.revokeObjectURL(objectUrl);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Unable to render PDF');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void render();

    return () => {
      cancelled = true;
      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = '';
      }
    };
  }, [pdfUrl]);

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <div className="flex flex-1 justify-center overflow-hidden bg-[#060606] px-4 pt-4">
        <div className="relative flex h-full w-full max-w-[560px] flex-col overflow-hidden bg-white shadow-[0_18px_60px_rgba(15,23,42,0.25)]">
          <div className="absolute right-2 top-2 z-30 flex items-center justify-end gap-1 rounded-full bg-transparent px-1 py-1">
            <Button
              type="text"
              className="flex h-8 w-8 items-center justify-center p-0 text-slate-700 hover:bg-slate-100"
              icon={<img src={shareIcon} alt="share" className="h-4 w-4" />}
              aria-label="Share estimate PDF"
              onClick={() => setShareModalOpen(true)}
            />
            <Button
              type="text"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
              icon={<CloseOutlined className="text-base" />}
              aria-label="Close estimate PDF"
              onClick={closeViewer}
            />
          </div>

          <div className="pdf-scrollbar min-h-0 flex-1 overflow-y-auto pr-0 pt-10">
            {isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center text-sm text-white">
                Loading preview...
              </div>
            ) : null}

            {error ? (
              <div className="flex min-h-[320px] items-center justify-center text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <div ref={previewContainerRef} className="space-y-4 pb-4" />
          </div>
        </div>
      </div>
      <style>{`
        .pdf-scrollbar::-webkit-scrollbar {
          width: 1px;
          height:1px;
        }

        .pdf-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 979px;
        }

        .pdf-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.45);
          border-radius: 979px;
        }

        .pdf-scrollbar::-webkit-scrollbar-thumb:hover {
          background:blue;
        }
      `}</style>
      <EstimateShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        pdfUrl={pdfUrl}
        iconLabel="Mail"
      />
    </div>
  );
};

export default EstimatePdfViewer;
