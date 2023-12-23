"use client";

import dynamic from "next/dynamic";
import React, { useState, useRef } from "react";

import styles from "../styles/Reader.module.css";
import { useEffect } from "react";
import { pdfjs, Document, Page } from "react-pdf";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url
).toString();

async function openFolder(buttonEvent, files, setFiles, setDirectory) {
    try {
        var directory = await window.showDirectoryPicker({
            startIn: "documents",
        });

        buttonEvent.target.style.display = "none";
        console.log(directory.values());
        var tempArray = [];
        for await (const entry of directory.values()) {
            if (entry.kind == "file" && entry.name.endsWith(".pdf")) {
                tempArray.push(entry.name);
            }
        }
        setDirectory(directory);
        setFiles([...files, ...tempArray]);
    } catch (e) {
        console.log(e);
    }
}

function DisplayFiles({ files, setSelectedFile, directory, setPage }) {
    if (files.length) {
        return (
            <>
                {files.map((file, index) => {
                    return (
                        <div
                            key={index}
                            onClick={(e) => {
                                directory
                                    .getFileHandle(file)
                                    .then((pdfFile) => {
                                        pdfFile.getFile().then((pdfStream) => {
                                            setSelectedFile(
                                                window.URL.createObjectURL(
                                                    pdfStream
                                                )
                                            );
                                        });
                                    });
                            }}
                        >
                            {file.slice(0, -4)}
                        </div>
                    );
                })}
            </>
        );
    }
}

export default function Reader() {
    const [files, setFiles] = useState([]);
    const [directory, setDirectory] = useState(null);
    const [selectedFile, setSelectedFile] = useState(
        "./Nocturne Op. 72 Chopin.pdf"
    );
    const [modelLoaded, setModelLoaded] = useState(false);
    const canvasRef = useRef(null);
    const requestRef = React.useRef();
    const previousTimeRef = React.useRef();

    const [numPages, setNumPages] = useState(null);
    const [page, setPage] = useState(1);
    const numPagesRef = React.useRef(null);
    const pageRef = React.useRef(1);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        numPagesRef.current = numPages;
    }

    function alterPage(state) {
        if (state == "next") {
            pageRef.current = page + 1;
            setPage((page) => page + 1);
            console.log(pageRef.current);
            document
                .getElementsByClassName(styles.pdfPage)
                [pageRef.current - 1].scrollIntoView();
        } else if (state == "previous") {
            pageRef.current = page - 1;
            setPage((page) => page - 1);
            document
                .getElementsByClassName(styles.pdfPage)
                [pageRef.current - 1]?.scrollIntoView();
        } else if (state == "reset") {
            pageRef.current = 1;
            setPage(1);
            document
                .getElementsByClassName(styles.pdfPage)
                [pageRef.current - 1]?.scrollIntoView({ behavior: "smooth" });
        }
    }

    let Mouth = null;
    async function initMouth() {
        Mouth = (await import("../components/mouth")).default;

        await Mouth.loadModel();

        const videoElement = document.querySelector("video");
        await Mouth.setUpCamera(videoElement);

        requestRef.current = requestAnimationFrame(predictMouth);
        setModelLoaded(true);
        return () => cancelAnimationFrame(requestRef.current);
    }

    const predictMouth = async (time) => {
        if (previousTimeRef.current != undefined) {
            const deltaTime = time - previousTimeRef.current;

            // Pass on a function to the setter of the state
            // to make sure we always have the latest state
            const mouthPrediction = await Mouth.getMouthPrediction();
            if (mouthPrediction?.longSignal) {
                // console.log(
                //     `Trigger: ${pageRef.current} < ${numPagesRef.current}`
                // );
                if (pageRef.current < numPagesRef.current) {
                    alterPage("next");
                }
            }
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(predictMouth);
    };

    useEffect(() => {
        if (document.readyState === "complete") {
            initMouth();
        } else {
            window.addEventListener("load", initMouth);
            return () => window.removeEventListener("load", initMouth);
        }
    }, []);

    return (
        <>
            <div className="page">
                <div className={styles.header}>
                    <h1>MC - Reader</h1>
                </div>
                <div className={styles.sideNav}>
                    <h2
                        style={{
                            textAlign: "center",
                            borderBottom: "1px white solid",
                        }}
                    >
                        Files
                    </h2>
                    {!files.length && (
                        <button
                            id="addToFolder"
                            onClick={(e) => {
                                openFolder(e, files, setFiles, setDirectory);
                            }}
                            className="button"
                        >
                            Open Folder
                        </button>
                    )}

                    <div className={styles.folderList}>
                        <DisplayFiles
                            files={files}
                            setSelectedFile={setSelectedFile}
                            directory={directory}
                            setPage={setPage}
                        />
                        <spacer />
                    </div>
                    {modelLoaded && (
                        <>
                            <p className={styles.isVisible}>
                                Camera On <i>visibility</i>
                            </p>
                        </>
                    )}
                </div>
                <div className={styles.mainCont} id="mainCont">
                    <Document
                        file={selectedFile}
                        onLoadSuccess={onDocumentLoadSuccess}
                        className={styles.pdfCont}
                    >
                        {Array.from(new Array(numPages), (el, index) => (
                            <Page
                                key={`page_${index + 1}`}
                                pageNumber={index + 1}
                                className={styles.pdfPage}
                            />
                        ))}
                        {/* {pageCont.map((page) => page)} */}

                        {/* <Page pageNumber={page} className={styles.pdfPage}/> */}
                        {/* <Page pageNumber={page + 1} className={styles.pdfPage}/> */}
                    </Document>
                    <nav className={styles.pagerCont}>
                        <button
                            className="previous button"
                            disabled={page === 1}
                            onClick={() => alterPage("previous")}
                        >
                            Previous
                        </button>
                        <div>
                            {page} / {numPages}
                        </div>
                        <button
                            className="next button"
                            disabled={page >= numPages}
                            onClick={() => alterPage("next")}
                        >
                            Next
                        </button>
                        <button
                            className="reset button"
                            onClick={() => alterPage("reset")}
                            style={{ flex: 0 }}
                        >
                            <i style={{ fontSize: "inherit" }}>restart_alt</i>
                        </button>
                    </nav>
                    <i
                        className={styles.fullscreen}
                        onClick={(e) => {
                            if (document.fullscreenElement) {
                                document.exitFullscreen();
                            } else {
                                document
                                    .getElementById("mainCont")
                                    .requestFullscreen();
                            }
                        }}
                    >
                        fullscreen
                    </i>
                    <video
                        className={styles.videoBox}
                        style={{ transform: "scaleX(-1)" }}
                        onClick={(e) => {
                            e.target.style.display = "none";
                        }}
                    ></video>
                </div>
            </div>
        </>
    );
}
