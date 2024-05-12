"use client";

import Link from "next/link";
import React, { useState, useRef } from "react";

import styles from "../styles/Reader.module.css";
import { useEffect } from "react";
import { pdfjs, Document, Page } from "react-pdf";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

async function openFolder(files, setFiles, setDirectory) {
    try {
        var directory = await window.showDirectoryPicker();

        console.log(directory.values());
        var tempArray = [];
        for await (const entry of directory.values()) {
            if (entry.kind == "file" && entry.name.endsWith(".pdf")) {
                const file = await entry
                    .getFile()
                    .then((file) => file.arrayBuffer());
                tempArray.push({
                    name: entry.name,
                    file: file,
                });
            }
        }
        setDirectory(directory);
        setFiles([...files, ...tempArray]);
    } catch (e) {
        console.log(e);
    }
}

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

async function uploadFile(clientName, fileName, directory) {
    directory.getFileHandle(fileName).then((pdfFile) => {
        pdfFile.getFile().then(async (pdfStream) => {
            const pdfBuffer = await pdfStream.arrayBuffer();
            // const pdfBytes = new Uint8Array(pdfBuffer);

            const formData = new FormData();
            formData.append("clientName", clientName);
            formData.append("fileName", fileName);
            formData.append("fileData", pdfBuffer);

            const response = await fetch("/api/uploadFile", {
                method: "POST",
                body: formData,
                type: "multipart/form-data",
            });

            const result = await response.json();
            console.log("File uploaded with ID:", result.id);
        });
    });
}

function DisplayFiles({ files, setSelectedFile, directory, setPage }) {
    console.log(files);
    if (files.length) {
        return (
            <>
                {files.map((file, index) => {
                    return (
                        <div
                            key={index}
                            onClick={(e) => {
                                setSelectedFile(file.file);
                            }}
                        >
                            {file.name.slice(0, -4)}
                        </div>
                    );
                })}
                <div
                    key="test"
                    onClick={(e) => {
                        setSelectedFile(
                            "https://rdwzxcyl6ptcoxme.public.blob.vercel-storage.com/tysonm/Million%20Dreams-u7FTBNu0GIY5ffWbYjNLMCBrFdpYow.pdf"
                        );
                    }}
                >
                    {"Million Dreams"}
                </div>
            </>
        );
    }
}

function UploadCloudFiles({
    files,
    setFiles,
    directory,
    open,
    setOpen,
    setDirectory,
}) {
    const [errorMessage, setErrorMessage] = useState("");

    const [username, setUsername] = useState("");
    const debouncedUsername = useDebounce(username, 500);
    const [blobs, setBlobs] = useState([]);
    const [keepFiles, setKeepFiles] = useState({});

    useEffect(() => {
        if (debouncedUsername !== "") {
            const usernameClean = debouncedUsername.replace(/[^a-z]/g, "");
            fetch(`/api/listFiles?username=${usernameClean}`)
                .then((response) => response.json())
                .then((data) => {
                    console.log(data);
                    setBlobs(data);
                });
        }
    }, [debouncedUsername]);

    // three tabs for switching modes
    const tabs = (
        <>
            <div className={styles.tabCont}>
                <button
                    className={styles.tab}
                    onClick={(e) => setOpen(1)}
                    style={{ background: open == 1 ? "var(--primary)" : "" }}
                >
                    Open Cloud Folder
                </button>
                <button
                    className={styles.tab}
                    onClick={(e) => setOpen(2)}
                    style={{ background: open == 2 ? "var(--primary)" : "" }}
                >
                    Upload Cloud Files
                </button>
                <button
                    className={styles.tab}
                    onClick={(e) => setOpen(3)}
                    style={{ background: open == 3 ? "var(--primary)" : "" }}
                >
                    Open Local Folder
                </button>
            </div>
        </>
    );

    if (open == 1) {
        return (
            <>
                <div
                    className={styles.modalBackground}
                    onClick={(e) => setOpen(false)}
                ></div>
                <div className={styles.modal}>
                    <h2 className={styles.modalHeader}>
                        Opens Files from Cloud <i>cloud</i>
                    </h2>
                    {tabs}
                    <div className={styles.formItem}>
                        <label htmlFor="username">Username</label>
                        <input
                            name="username"
                            value={username}
                            onChange={(event) =>
                                setUsername(
                                    event.target.value.replace(/[^a-z]/g, "")
                                )
                            }
                            type="text"
                            required
                            style={{ width: "100%", padding: 5 }}
                        />
                    </div>
                    <div className={styles.formItem}>{errorMessage}</div>
                    <div className={styles.modalBody}>
                        {blobs.map((blob, index) => (
                            <div key={index} className={styles.formItem}>
                                <label className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        value={index}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setKeepFiles({
                                                    ...keepFiles,
                                                    [index]: {
                                                        name: blob.pathname
                                                            .split("/")
                                                            .pop(),
                                                        file: blob.url,
                                                    },
                                                });
                                            } else {
                                                const {
                                                    [index]: omit,
                                                    ...rest
                                                } = keepFiles;
                                                setKeepFiles(rest);
                                            }
                                        }}
                                    />
                                    <span></span>
                                    <Link href={blob.url}>{blob.pathname}</Link>
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className={styles.formItem}>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            onClick={async (e) => {
                                e.preventDefault();

                                if (username.length == 0) {
                                    setErrorMessage("Client Name is Empty");
                                    return;
                                }

                                setFiles([
                                    ...files,
                                    ...Object.values(keepFiles),
                                ]);
                                setOpen(0);
                            }}
                        >
                            Add to Viewer <i>file_save</i>
                        </button>
                    </div>
                </div>
            </>
        );
    }
    if (open == 2) {
        return (
            <>
                <div
                    className={styles.modalBackground}
                    onClick={(e) => setOpen(false)}
                ></div>
                <div className={styles.modal}>
                    <h2 className={styles.modalHeader}>
                        Upload Files to Cloud <i>cloud</i>
                    </h2>
                    {tabs}
                    <div className={styles.formItem}>
                        <label htmlFor="username">Username</label>
                        <input
                            name="username"
                            value={username}
                            onChange={(event) =>
                                setUsername(
                                    event.target.value.replace(/[^a-z]/g, "")
                                )
                            }
                            type="text"
                            required
                            style={{ width: "100%", padding: 5 }}
                        />
                    </div>
                    <div className={styles.formItem}>{errorMessage}</div>
                    <div className={styles.modalBody}>
                        {blobs.map((blob, index) => (
                            <div key={index} className={styles.formItem}>
                                <label className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        value={index}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setKeepFiles({
                                                    ...keepFiles,
                                                    [index]: {
                                                        name: blob.pathname
                                                            .split("/")
                                                            .pop(),
                                                        file: blob.url,
                                                    },
                                                });
                                            } else {
                                                const {
                                                    [index]: omit,
                                                    ...rest
                                                } = keepFiles;
                                                setKeepFiles(rest);
                                            }
                                        }}
                                    />
                                    <span></span>
                                    <Link href={blob.url}>{blob.pathname}</Link>
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className={styles.formItem}>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            onClick={async (e) => {
                                e.preventDefault();

                                if (username.length == 0) {
                                    setErrorMessage("Client Name is Empty");
                                    return;
                                }

                                setFiles([
                                    ...files,
                                    ...Object.values(keepFiles),
                                ]);
                                setOpen(0);
                            }}
                        >
                            Upload to Cloud <i>upload</i>
                        </button>
                    </div>
                </div>
            </>
        );
    }
    if (open == 3) {
        openFolder(files, setFiles, setDirectory);
    }
    return <></>;
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
    const [cloudForm, setCloudForm] = useState(0);

    let numPagesRef = React.useRef(4);
    let pageRef = React.useRef(1);
    const [numPages, setNumPages] = useState(numPagesRef.current);
    const [page, setPage] = useState(pageRef.current);

    const [username, setUsername] = useState("");

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
                    <button
                        className="button"
                        onClick={(e) => {
                            setCloudForm(1);
                        }}
                    >
                        Open
                    </button>
                    {/* {!files.length && (
                        <>
                            <button
                                id="addToFolder"
                                onClick={(e) => {
                                    openFolder(
                                        e,
                                        files,
                                        setFiles,
                                        setDirectory
                                    );
                                }}
                                className="button"
                            >
                                Open Folder
                            </button>
                            {cloudForm == 0 && (
                                <button
                                    id="addToFolder"
                                    onClick={(e) => {
                                        setCloudForm(1);
                                    }}
                                    className="button"
                                >
                                    Open Cloud Files
                                </button>
                            )}
                        </>
                    )} */}
                    {files.length != 0 && (
                        <>
                            <button
                                id="addToFolder"
                                onClick={(e) => {
                                    setCloudForm(true);
                                }}
                                className="button"
                            >
                                Upload to Cloud
                            </button>
                        </>
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
                <UploadCloudFiles
                    files={files}
                    setFiles={setFiles}
                    directory={directory}
                    open={cloudForm}
                    setOpen={setCloudForm}
                    setDirectory={setDirectory}
                />
            </div>
        </>
    );
}
