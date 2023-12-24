"use client";

import Link from "next/link";
import React, { useState, useRef } from "react";

import styles from "../styles/Reader.module.css";
import { useEffect } from "react";
import { pdfjs, Document, Page } from "react-pdf";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

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

export default function ReaderRolling() {
    const [files, setFiles] = useState([]);
    const [directory, setDirectory] = useState(null);
    const [selectedFile, setSelectedFile] = useState(
        "./Nocturne Op. 72 Chopin.pdf"
    );
    const [modelLoaded, setModelLoaded] = useState(false);
    const canvasRef = useRef(null);
    const requestRef = React.useRef();
    const previousTimeRef = React.useRef();

    let numPagesRef = React.useRef(4);
    let pageRef = React.useRef(1);
    const [numPages, setNumPages] = useState(numPagesRef.current);
    const [page, setPage] = useState(pageRef.current);

    function onDocumentLoadSuccess({ numPages }) {
        pageRef.current = 1;
        setPage(pageRef.current);
        setNumPages(numPages);
        numPagesRef.current = numPages;
    }

    function alterPage(state) {
        let valid = true;
        if (state == "next") {
            pageRef.current += 1;
        } else if (state == "previous") {
            pageRef.current += -1;
        } else if (state == "reset") {
            pageRef.current = 1;
        } else if (parseInt(state) != NaN) {
            pageRef.current = parseInt(state);
        } else {
            valid = false;
        }

        if (valid) {
            // Clamp Value to 1 and numPages
            pageRef.current = Math.min(
                Math.max(pageRef.current, 1),
                numPagesRef.current
            );

            // Set Page
            setPage(pageRef.current);
            document
                .getElementsByClassName(styles.pdfPage)
                [pageRef.current - 1]?.scrollIntoView();
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
                if (
                    pageRef.current < numPagesRef.current &&
                    mouthPrediction.direction == "right"
                ) {
                    alterPage("next");
                } else if (
                    pageRef.current > 1 &&
                    mouthPrediction.direction == "left"
                ) {
                    alterPage("previous");
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
                            <input
                                value={page}
                                onChange={(e) => {
                                    alterPage(e.target.value);
                                }}
                                type="number"
                            />
                            {" / "}
                            {numPages}
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
