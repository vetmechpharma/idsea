import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFFlipbook({ url, title = 'Document', downloadable = true }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  }, []);

  const goToPrev = () => setPageNumber(p => Math.max(1, p - 1));
  const goToNext = () => setPageNumber(p => Math.min(numPages || 1, p + 1));
  const zoomIn = () => setScale(s => Math.min(2.5, s + 0.2));
  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.2));

  const resolvedUrl = url?.startsWith('/api') ? `${process.env.REACT_APP_BACKEND_URL?.replace('/api', '')}${url}` : url;

  if (!url) return null;

  const Viewer = (
    <div style={{ background: isFullscreen ? '#1a1a2e' : '#f1f5f9', borderRadius: isFullscreen ? 0 : '16px', overflow: 'hidden', border: isFullscreen ? 'none' : '1px solid #e2e8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#0c3c60', color: 'white' }}>
        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '14px' }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={zoomOut} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }} title="Zoom Out"><ZoomOut size={16} /></button>
          <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '40px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }} title="Zoom In"><ZoomIn size={16} /></button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }} title="Fullscreen"><Maximize2 size={16} /></button>
          {downloadable && (
            <a href={resolvedUrl} download target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', textDecoration: 'none' }} title="Download"><Download size={16} /></a>
          )}
        </div>
      </div>

      {/* PDF Canvas */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: isFullscreen ? 'calc(100vh - 110px)' : '500px', overflow: 'auto', padding: '20px', background: '#e2e8f0' }}>
        <Document file={resolvedUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div style={{ color: '#6b7280', fontFamily: 'Inter', fontSize: '14px' }}>Loading document...</div>} error={<div style={{ color: '#dc2626', fontFamily: 'Inter', fontSize: '14px' }}>Failed to load document</div>}>
          <Page pageNumber={pageNumber} scale={scale} renderTextLayer={true} renderAnnotationLayer={true} />
        </Document>
      </div>

      {/* Page Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '14px 20px', background: '#0c3c60', color: 'white' }}>
        <button onClick={goToPrev} disabled={pageNumber <= 1} style={{ background: pageNumber <= 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: pageNumber <= 1 ? 'default' : 'pointer', opacity: pageNumber <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '13px' }} data-testid="pdf-prev"><ChevronLeft size={16} /> Prev</button>
        <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Poppins' }}>
          Page {pageNumber} of {numPages || '...'}
        </span>
        <button onClick={goToNext} disabled={pageNumber >= (numPages || 1)} style={{ background: pageNumber >= (numPages || 1) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '8px', cursor: pageNumber >= (numPages || 1) ? 'default' : 'pointer', opacity: pageNumber >= (numPages || 1) ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '13px' }} data-testid="pdf-next">Next <ChevronRight size={16} /></button>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#1a1a2e' }} data-testid="pdf-fullscreen">
        {Viewer}
      </div>
    );
  }

  return <div data-testid="pdf-flipbook">{Viewer}</div>;
}
