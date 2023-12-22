import Link from "next/link";
import dynamic from "next/dynamic";
import React, { useState, useRef } from "react";
import { usePdf } from "@mikecousins/react-pdf";

import styles from "../styles/Reader.module.css";
import { useEffect } from "react";

let newFile = false;

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
                                            newFile = true;
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
        "Nocturne Op. 72 Chopin.pdf"
    );
    const [page, setPage] = useState(1);
    const [modelLoaded, setModelLoaded] = useState(false);
    const canvasRef = useRef(null);
    const requestRef = React.useRef();
    const previousTimeRef = React.useRef();

    const { pdfDocument, pdfPage } = usePdf({
        file: selectedFile,
        page,
        onDocumentLoadSuccess: newFile
            ? () => {
                  setPage(1);
                  newFile = false;
              }
            : undefined,
        canvasRef,
    });

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
                setPage((page) => page + 1);
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
                    {!pdfDocument && <span>Loading...</span>}
                    <canvas className={styles.pdfCont} ref={canvasRef} />
                    {Boolean(pdfDocument && pdfDocument.numPages) && (
                        <nav className={styles.pagerCont}>
                            <button
                                className="previous button"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </button>
                            <div>{page}</div>
                            <button
                                className="next button"
                                disabled={page >= pdfDocument.numPages}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </button>
							<button
                                className="reset button"
                                onClick={() => setPage(1)}
								style={{flex: 0}}
                            >
								<i style={{fontSize: "inherit"}}>restart_alt</i>
                            </button>
                        </nav>
                    )}
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
