// components/ResumePreview.tsx - HTML preview iframe + print-to-PDF (ATS-friendly text PDF)
"use client";

interface Props {
  html: string;
  width?: number;
}

/**
 * Open the resume HTML in a hidden iframe and trigger the browser print dialog.
 * Printing preserves selectable text, keeping the resulting PDF ATS-parseable
 * (unlike rasterized html2canvas approaches).
 */
export function printResume(html: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  const win = iframe.contentWindow;
  if (!win) return;

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 500);
  };

  win.onafterprint = cleanup;
  // Give the iframe a moment to lay out before printing.
  setTimeout(() => {
    win.focus();
    win.print();
    cleanup();
  }, 250);
}

export default function ResumePreview({ html, width = 620 }: Props) {
  const height = Math.round(width * 1.414);
  const encoded = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

  return (
    <div className="preview-wrap">
      <iframe
        className="preview-frame"
        src={encoded}
        width={width}
        height={height}
        style={{ maxWidth: "100%" }}
        title="Resume preview"
      />
    </div>
  );
}
