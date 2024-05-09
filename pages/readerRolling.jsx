"use client";

import Link from "next/link";
import { sql } from "@vercel/postgres";
import React, { useState, useRef } from "react";

import styles from "../styles/Reader.module.css";
import { useEffect } from "react";
import { pdfjs, Document, Page } from "react-pdf";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

async function openFolder(buttonEvent, files, setFiles, setDirectory) {
    try {
        var directory = await window.showDirectoryPicker();

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

async function getCloudFiles(buttonEvent, files, setFiles) {
    buttonEvent.target.style.display = "none";
    var client_name = "-";
    var clean_name = client_name.replace(/[^a-zA-Z0-9]/g, "");

    while (client_name != clean_name) {
        client_name = prompt("Enter Client Name (a-z) Only) ");
        if (client_name == null) {
            return;
        }
        clean_name = client_name.replace(/[^a-zA-Z0-9]/g, "");
    }

    const response = await fetch(
        `/api/getCloudFiles?client_name=${clean_name}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    const result = await response.json();
    console.log(result);
    setFiles([...files, ...result]);
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

function UploadCloudFiles({ files, directory, open, setOpen }) {
    const [errorMessage, setErrorMessage] = useState("");

    const [username, setUsername] = useState("");
    const debouncedUsername = useDebounce(username, 500);
    const [blobs, setBlobs] = useState([]);

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
                    <div className={styles.modalBody}>
                        <ul style={{ margin: 20 }}>
                            {blobs.map((blob) => (
                                <li key={blob.uploadedAt}>
                                    <Link href={blob.url}>{blob.pathname}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className={styles.formItem}>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            onClick={async (e) => {
                                e.preventDefault();

                                if (clientName.length == 0) {
                                    setErrorMessage("Client Name is Empty");
                                    return;
                                }

                                var numUploaded = 0;
                                var checkboxes =
                                    document.getElementsByName("cloudFiles");

                                for (var i = 0; i < checkboxes.length; i++) {
                                    if (checkboxes[i].checked) {
                                        console.log(
                                            `Uploading ${i}: ${directory}${checkboxes[i].value}.pdf as ${clientName}`
                                        );
                                        uploadFile(
                                            clientName,
                                            checkboxes[i].value + ".pdf",
                                            directory
                                        );
                                        numUploaded += 1;
                                    }
                                }
                                if (numUploaded == 0) {
                                    setErrorMessage("No Files Selected");
                                } else {
                                    setOpen(false);
                                }
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
                    <div className={styles.formItem}>
                        <label htmlFor="clientName">Client Name:</label>
                        <input
                            type="text"
                            name="clientName"
                            value={clientName}
                            onChange={(e) => {
                                var clean_name = e.target.value.replace(
                                    /[^a-zA-Z0-9]/g,
                                    ""
                                );
                                if (clean_name != e.target.value) {
                                    setErrorMessage(
                                        "Client Name must be alphanumeric"
                                    );
                                } else {
                                    setErrorMessage("");
                                }
                                setClientName(clean_name);
                            }}
                        />
                    </div>
                    <p className={styles.errorMessage}>{errorMessage}</p>
                    <div className={styles.modalBody}>
                        {files.map((file, index) => {
                            return (
                                <div className={styles.formItem} key={index}>
                                    <input
                                        type="checkbox"
                                        id={file.slice(0, -4)}
                                        name="cloudFiles"
                                        value={file.slice(0, -4)}
                                    />
                                    <label htmlFor={file.slice(0, -4)}>
                                        {file.slice(0, -4)}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                    <div className={styles.formItem}>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            onClick={async (e) => {
                                e.preventDefault();

                                if (clientName.length == 0) {
                                    setErrorMessage("Client Name is Empty");
                                    return;
                                }

                                var numUploaded = 0;
                                var checkboxes =
                                    document.getElementsByName("cloudFiles");

                                for (var i = 0; i < checkboxes.length; i++) {
                                    if (checkboxes[i].checked) {
                                        console.log(
                                            `Uploading ${i}: ${directory}${checkboxes[i].value}.pdf as ${clientName}`
                                        );
                                        uploadFile(
                                            clientName,
                                            checkboxes[i].value + ".pdf",
                                            directory
                                        );
                                        numUploaded += 1;
                                    }
                                }
                                if (numUploaded == 0) {
                                    setErrorMessage("No Files Selected");
                                } else {
                                    setOpen(false);
                                }
                            }}
                        >
                            Upload <i>upload</i>
                        </button>
                    </div>
                </div>
            </>
        );
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
                    {!files.length && (
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
                    )}
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
                    directory={directory}
                    open={cloudForm}
                    setOpen={setCloudForm}
                />
            </div>
        </>
    );
}
