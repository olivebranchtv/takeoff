import React from 'react';
import type { PDFDoc } from '@/lib/pdf';
interface PDFViewportProps {
  pdf: PDFDoc | null;
  activePage?: number;
  scale?: number;
  onPageClick?: (e: any) => void;
  children?: React.ReactNode;
}
export default function PDFViewport({ pdf, activePage = 0, scale = 1, onPageClick, children }: PDFViewportProps) {
  if (!pdf) {
    return <div className="flex items-center justify-center h-full text-gray-500">No PDF loaded</div>;
  }
  return (
    <div className="relative w-full h-full overflow-auto bg-gray-100">
      <div className="p-8">
        <div className="bg-white shadow-lg mx-auto relative" style={{ width: 'fit-content' }} onClick={onPageClick}>
          {children}
        </div>
      </div>
    </div>
  );
}
