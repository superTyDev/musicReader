import React, { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument } from "pdf-lib";
import CanvasDraw from "react-canvas-draw";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

function FreeDrawPdfViewer() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [canvasData, setCanvasData] = useState(null);
  const canvasRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(600);
  const [pageHeight, setPageHeight] = useState(800);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleSavePdf = async () => {
    const existingPdfBytes = await fetch(file).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const page = pages[pageNumber - 1];

    if (canvasRef.current) {
      const image = await pdfDoc.embedPng(
        canvasRef.current.canvas.drawing.toDataURL()
      );
      const { width, height } = page.getSize();

      page.drawImage(image, {
        x: 0,
        y: 0,
        width,
        height,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url);
  };

  const handlePageRenderSuccess = (page) => {
    setPageWidth(page.originalWidth);
    setPageHeight(page.originalHeight);
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(URL.createObjectURL(e.target.files[0]))}
      />
      {file && (
        <div>
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error("Error loading PDF", error)}
          >
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              onRenderSuccess={handlePageRenderSuccess}
            />
          </Document>
          <CanvasDraw
            ref={canvasRef}
            brushColor={"#000"}
            brushRadius={2}
            lazyRadius={1}
            canvasWidth={pageWidth}
            canvasHeight={pageHeight}
            hideGrid={true}
            saveData={canvasData}
            onChange={() => setCanvasData(canvasRef.current.getSaveData())}
          />
          <button onClick={handleSavePdf}>Save PDF</button>
        </div>
      )}
    </div>
  );
}

export default FreeDrawPdfViewer;
