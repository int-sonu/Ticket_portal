import { useCallback } from "react";

type PrintPdfOptions = {
  extraWaitMs?: number;
};

export const usePrintPdf = ({ extraWaitMs = 300 }: PrintPdfOptions = {}) => {
  const printPdf = useCallback(
    async (pdfUrl: string) => {
      if (!pdfUrl) {
        throw new Error("Missing PDF URL");
      }

      // In development, use Vite's same-origin proxy. In production the
      // configured upload URL is used directly.
      let requestUrl = pdfUrl;
      if (import.meta.env.DEV) {
        try {
          const parsedUrl = new URL(pdfUrl, window.location.origin);
          requestUrl = `${parsedUrl.pathname}${parsedUrl.search}`;
        } catch {
          requestUrl = pdfUrl;
        }
      }

      const response = await fetch(requestUrl, {
        method: "GET",
        credentials: "omit",
      });
      if (!response.ok) {
        throw new Error(`Unable to download PDF (${response.status})`);
      }

      const pdfBlob = await response.blob();
      const blobUrl = URL.createObjectURL(
        pdfBlob.type === "application/pdf"
          ? pdfBlob
          : new Blob([pdfBlob], { type: "application/pdf" }),
      );

      return new Promise<void>((resolve, reject) => {
        if (!pdfUrl) {
          reject(new Error("Missing PDF URL"));
          return;
        }

        const iframe = document.createElement("iframe");
        iframe.setAttribute("title", "Expense PDF print frame");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "1px";
        iframe.style.height = "1px";
        iframe.style.border = "0";
        iframe.style.opacity = "0";

        const cleanup = () => {
          window.setTimeout(() => {
            iframe.remove();
            URL.revokeObjectURL(blobUrl);
          }, 60_000);
        };

        iframe.onload = () => {
          window.setTimeout(() => {
            try {
              const frameWindow = iframe.contentWindow;
              if (!frameWindow) throw new Error("Unable to open PDF print frame");
              frameWindow.focus();
              frameWindow.print();
              resolve();
              cleanup();
            } catch (error) {
              iframe.remove();
              reject(error);
            }
          }, extraWaitMs);
        };
        iframe.onerror = () => {
          iframe.remove();
          URL.revokeObjectURL(blobUrl);
          reject(new Error("Unable to load PDF for printing"));
        };

        document.body.appendChild(iframe);
        iframe.src = blobUrl;
      });
    },
    [extraWaitMs],
  );

  return { printPdf };
};
