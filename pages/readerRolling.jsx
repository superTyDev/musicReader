"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import { upload } from "@vercel/blob/client";

import styles from "../styles/Reader.module.css";
import Collapsible from "../components/collapsible";

import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

async function openFolder(files, setFiles, setDirectory) {
    try {
        var directory = await window.showDirectoryPicker();

        var tempArray = [];
        for await (const entry of directory.values()) {
            if (entry.kind == "file" && entry.name.endsWith(".pdf")) {
                const file = await entry
                    .getFile()
                    .then((file) => file.arrayBuffer());
                tempArray.push({
                    name: entry.name,
                    file: file,
                    parent: directory.name,
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

function DisplayFiles({ files, setSelectedFile, directory, setPage }) {
    // split files into subarray by parent directory
    if (!files.length) {
        return;
    }

    const tempFiles = files.reduce((acc, file) => {
        if (acc[file.parent]) {
            acc[file.parent].push(file);
        } else {
            acc[file.parent] = [file];
        }
        return acc;
    }, {});

    // console.log(tempFiles);

    return Object.keys(tempFiles).map((key, index) => (
        <Collapsible title={key} key={index}>
            {tempFiles[key].map((file, index) => (
                <div
                    key={index}
                    className={styles.file}
                    onClick={(e) => {
                        setSelectedFile(file);
                        setPage(1);
                    }}
                >
                    {file.name.slice(0, -4)}
                </div>
            ))}
        </Collapsible>
    ));
}

function FilePopup({
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
        if (debouncedUsername !== "" && open == 1) {
            const usernameClean = debouncedUsername
                .replace(/[^a-zA-Z]/g, "")
                .toLowerCase();
            fetch(`/api/listFiles?username=${usernameClean}`)
                .then((response) => response.json())
                .then((data) => {
                    // console.log(data);
                    setBlobs(data);
                });
        }
    }, [debouncedUsername, open]);

    useEffect(() => {
        setErrorMessage("");
    }, [open]);

    // three tabs for switching modes
    const tabs = (
        <>
            <div className={styles.tabCont}>
                <button
                    className={styles.tab}
                    onClick={(e) => setOpen(1)}
                    style={{ background: open == 1 ? "var(--primary)" : "" }}
                >
                    Open Cloud Files
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

    // Get Cloud Files
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
                    <div className={styles.modalBody}>
                        {tabs}
                        <div className={styles.formItem}>
                            <label htmlFor="username">Username</label>
                            <input
                                name="username"
                                value={username}
                                onChange={(event) =>
                                    setUsername(
                                        event.target.value.replace(
                                            /[^a-z]/g,
                                            ""
                                        )
                                    )
                                }
                                type="text"
                                required
                                style={{ width: "100%", padding: 5 }}
                            />
                        </div>
                        <div className={styles.formItem}>{errorMessage}</div>
                        <div className={styles.longList}>
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
                                                            parent: blob.pathname.split(
                                                                "/"
                                                            )[0],
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
                                        <Link href={blob.url}>
                                            {blob.pathname}
                                        </Link>
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
                </div>
            </>
        );
    }

    // Upload Cloud Files
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
                    <div className={styles.modalBody}>
                        {tabs}
                        <div className={styles.formItem}>
                            <label htmlFor="username">Username</label>
                            <input
                                name="username"
                                value={username}
                                onChange={(event) =>
                                    setUsername(
                                        event.target.value.replace(
                                            /[^a-z]/g,
                                            ""
                                        )
                                    )
                                }
                                type="text"
                                required
                                style={{ width: "100%", padding: 5 }}
                            />
                        </div>
                        <div className={styles.formItem}>{errorMessage}</div>
                        {files.length == 0 && "No files to upload."}
                        {files.length != 0 && (
                            <div
                                id="uploadFileChecks"
                                className={styles.longList}
                            >
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className={styles.formItem}
                                    >
                                        <label className={styles.checkbox}>
                                            <input
                                                type="checkbox"
                                                value={index}
                                            />
                                            <span></span>
                                            <div>{file.name}</div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
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

                                    // upload each file
                                    // iterate through each checkbox and get value
                                    for (const checkbox of document.querySelectorAll(
                                        "#uploadFileChecks input[type=checkbox]:checked"
                                    )) {
                                        const index = parseInt(checkbox.value);
                                        const file = files[index];
                                        const tempName = file.name.replace(
                                            /[^a-z0-9.]/gi,
                                            "_"
                                        );
                                        // console.log(tempName);
                                        const newBlob = await upload(
                                            username + "/" + tempName,
                                            file.file,
                                            {
                                                access: "public",
                                                handleUploadUrl:
                                                    "/api/uploadFile",
                                            }
                                        );
                                    }

                                    setErrorMessage(
                                        `Uploaded ${
                                            Object.values(keepFiles).length
                                        } files`
                                    );
                                    // setOpen(0);
                                }}
                            >
                                Upload to Cloud <i>upload</i>
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Get Local Files
    if (open == 3) {
        openFolder(files, setFiles, setDirectory);
        setOpen(0);
    }
    return <></>;
}

function SettingsPopup({ open, setOpen, settings, setSettings }) {
    return (
        open && (
            <>
                <div
                    className={styles.modalBackground}
                    onClick={(e) => setOpen(false)}
                ></div>
                <div className={styles.modal}>
                    <h2 className={styles.modalHeader}>
                        Settings <i>settings</i>
                    </h2>
                    <div className={styles.modalBody}>
                        <div className={styles.formItem}>
                            <label htmlFor="scrollBehavior">
                                Scroll Behavior
                            </label>
                            <input
                                name="scrollAmount"
                                type="text"
                                value={settings.scrollAmount}
                                onChange={(e) => {
                                    setSettings((prev) => {
                                        return {
                                            ...prev,
                                            scrollAmount:
                                                e.target.value.replace(
                                                    /[^0-9]+/g,
                                                    ""
                                                ),
                                        };
                                    });
                                }}
                                required
                            />
                            {settings.behaviorValue == "absolute" && "px. "}
                            {settings.behaviorValue != "absolute" && "% of "}
                            <select
                                id="scrollBehavior"
                                name="scrollBehavior"
                                value={settings.behaviorValue}
                                onChange={(e) => {
                                    setSettings((prev) => {
                                        return {
                                            ...prev,
                                            behaviorValue: e.target.value,
                                        };
                                    });
                                }}
                            >
                                <option value="page">Page</option>
                                <option value="window">Window</option>
                                <option value="absolute">Absolute</option>
                            </select>
                        </div>

                        <div className={styles.formItem}>
                            <label htmlFor="theme">Theme</label>
                            <select
                                id="theme"
                                name="theme"
                                value={settings.theme}
                                onChange={(e) => {
                                    setSettings((prev) => {
                                        return {
                                            ...prev,
                                            theme: e.target.value,
                                        };
                                    });
                                }}
                            >
                                <option value="system">System</option>
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                            </select>
                            <label className={styles.checkbox}>
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        setSettings((prev) => {
                                            return {
                                                ...prev,
                                                lightMusic: e.target.checked,
                                            };
                                        });
                                    }}
                                />
                                <span></span>
                                Always Light Music
                            </label>
                        </div>
                    </div>
                </div>
            </>
        )
    );
}

export default function ReaderRolling({ settings, setSettings }) {
    const [files, setFiles] = useState([]);
    const [directory, setDirectory] = useState(null);
    const [selectedFile, setSelectedFile] = useState({
        file: "./Nocturne Op. 72 Chopin.pdf",
        name: "Nocturne Op. 72 Chopin",
    });
    const [modelLoaded, setModelLoaded] = useState(false);
    const videoRef = useRef();
    const [cloudForm, setCloudForm] = useState(0);
    const [isSettings, setIsSettings] = useState(false);

    let numPagesRef = useRef(0);
    let pageRef = useRef(0);
    const [numPages, setNumPages] = useState(numPagesRef.current);
    const [page, setPage] = useState(pageRef.current);
    const [intPage, setIntPage] = useState(0);

    const onDocumentLoadSuccess = ({ numPages }) => {
        pageRef.current = 0;
        setPage(1);
        setIntPage(1);
        setNumPages(numPages);
        numPagesRef.current = numPages;
    };

    const alterPage = (state) => {
        let valid = true;
        const scrollAmount = parseInt(settings.scrollAmount);
        const pageHeight = document.querySelector(
            `.${styles.pdfPage}`
        ).clientHeight;
        const pdfCont = document.querySelector(`.${styles.pdfCont}`);
        const windowHeight = pdfCont.clientHeight;

        // console.log(state, settings.behaviorValue, scrollAmount);

        if (!isNaN(state)) {
            pageRef.current = parseInt(state);
        } else if (state == "next") {
            pageRef.current =
                Math.floor(pageRef.current / pageHeight) * pageHeight +
                pageHeight;
        } else if (state == "previous") {
            pageRef.current =
                Math.floor(pageRef.current / pageHeight) * pageHeight -
                pageHeight;
        } else if (state == "mouthNext") {
            if (settings.behaviorValue == "page") {
                pageRef.current += (scrollAmount * pageHeight) / 100;
            } else if (settings.behaviorValue == "window") {
                pageRef.current += (scrollAmount * windowHeight) / 100;
            } else if (settings.behaviorValue == "absolute") {
                pageRef.current = pageRef.current + scrollAmount;
            }
        } else if (state == "mouthPrevious") {
            if (settings.behaviorValue == "page") {
                pageRef.current -= (scrollAmount * pageHeight) / 100;
            } else if (settings.behaviorValue == "window") {
                pageRef.current -= (scrollAmount * windowHeight) / 100;
            } else if (settings.behaviorValue == "absolute") {
                pageRef.current = pageRef.current + scrollAmount;
            }
        } else if (state == "reset") {
            pageRef.current = 0;
        } else if (parseInt(state) != NaN) {
            pageRef.current = (parseInt(state) - 1) * pageHeight;
        } else {
            valid = false;
        }

        if (valid) {
            // Clamp Value to 1 and numPages
            pageRef.current = Math.min(
                Math.max(pageRef.current, 0),
                (numPagesRef.current - 1) * pageHeight
            );

            // Set Page
            setPage(pageRef.current);
            setIntPage(parseInt(pageRef.current / pageHeight) + 1);
            pdfCont.scroll(0, pageRef.current);
        }
    };

    let Twitch = null;
    let twitchCount = { left: 0, right: 0 };
    let threshold = 3;
    let length = 2;
    let resetDelay = -3;

    const initTwitch = async (videoElement) => {
        Twitch = (await import("../components/twitch")).default;
        Twitch.setVideoRef(videoElement);

        await Twitch.loadModels();
        const videoStarted = await Twitch.startVideo();
        setModelLoaded(videoStarted);

        const intervalId = setInterval(predictTwitch, 100);

        return () => clearInterval(intervalId);
    };

    const predictTwitch = async () => {
        const angle = await Twitch.getPrediction();

        if (angle > threshold) {
            twitchCount.right++;
            twitchCount.left = 0;

            if (twitchCount.right >= length) {
                alterPage("mouthNext");
                twitchCount.right = resetDelay;
            }
        } else if (angle < -threshold) {
            twitchCount.left++;
            twitchCount.right = 0;

            if (twitchCount.left >= length) {
                alterPage("mouthPrevious");
                twitchCount.left = resetDelay;
            }
        } else {
            twitchCount = { left: 0, right: 0 };
        }
        // console.log(twitchCount);
    };

    useEffect(() => {
        if (videoRef.current) {
            initTwitch(videoRef.current);
        }
    }, [videoRef.current]);

    return (
        <>
            <div className={styles.page}>
                <nav className={styles.header}>
                    <i
                        className="calmButton"
                        onClick={(e) => {
                            document
                                .querySelector(`.${styles.sideNav}`)
                                .classList.toggle(styles.open);
                        }}
                    >
                        menu
                    </i>
                    <button
                        className="button icon"
                        disabled={intPage <= 1}
                        onClick={() => alterPage("previous")}
                    >
                        arrow_back
                    </button>
                    <div>
                        <input
                            value={intPage}
                            onChange={(e) => {
                                alterPage(e.target.value);
                            }}
                            type="number"
                        />
                        {" / "}
                        {numPages}
                    </div>
                    <button
                        className="button icon"
                        disabled={intPage >= numPages}
                        onClick={() => alterPage("next")}
                    >
                        arrow_forward
                    </button>
                    <button
                        className="button icon"
                        onClick={() => alterPage("reset")}
                        style={{ flex: 0 }}
                    >
                        restart_alt
                    </button>
                </nav>
                <div className={styles.mainCont}>
                    <div className={styles.sideNav}>
                        <h2
                            style={{
                                textAlign: "center",
                                padding: "5px",
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
                        {files.length != 0 && (
                            <>
                                <button
                                    id="addToFolder"
                                    onClick={(e) => {
                                        setCloudForm(2);
                                    }}
                                    className="button"
                                >
                                    Cloud Upload
                                </button>
                            </>
                        )}
                        <div className="spacer"></div>

                        <div className={styles.folderList}>
                            <DisplayFiles
                                files={files}
                                setSelectedFile={setSelectedFile}
                                directory={directory}
                                setPage={setPage}
                            />
                            <spacer />
                        </div>
                    </div>
                    <Document
                        file={selectedFile.file}
                        onLoadSuccess={onDocumentLoadSuccess}
                        className={`${styles.pdfCont} ${
                            settings.fitDirection == "height"
                                ? styles.fitHeight
                                : styles.fitWidth
                        }`}
                        onScroll={(e) => {
                            alterPage(e.target.scrollTop);
                        }}
                    >
                        {Array.from(new Array(numPages), (el, index) => (
                            <Page
                                key={`page_${index + 1}`}
                                pageNumber={index + 1}
                                className={styles.pdfPage}
                            />
                        ))}
                        <i
                            className={`${styles.fullscreen} calmButton`}
                            onClick={(e) => {
                                if (document.fullscreenElement) {
                                    document.exitFullscreen();
                                } else {
                                    document
                                        .querySelector(`.${styles.pdfCont}`)
                                        .requestFullscreen();
                                }
                            }}
                        >
                            fullscreen_exit
                        </i>
                    </Document>
                </div>
                <div className={styles.infoBar}>
                    <Link href="/">
                        <Image
                            src="/logoShort.png"
                            alt="Music Reader Logo"
                            width={36}
                            height={36}
                        ></Image>
                    </Link>
                    <div className={styles.verticalSpacer}></div>
                    <div>File: {selectedFile.name}</div>
                    <spacer></spacer>
                    {settings.fitDirection == "height" && (
                        <i
                            className="calmButton"
                            onClick={() => {
                                setSettings((prev) => {
                                    return {
                                        ...prev,
                                        fitDirection: "width",
                                    };
                                });
                            }}
                        >
                            width
                        </i>
                    )}
                    {settings.fitDirection == "width" && (
                        <i
                            className="calmButton"
                            onClick={() => {
                                setSettings((prev) => {
                                    return {
                                        ...prev,
                                        fitDirection: "height",
                                    };
                                });
                            }}
                        >
                            height
                        </i>
                    )}
                    {modelLoaded && <i className="calmButton">videocam</i>}
                    <i
                        className="calmButton"
                        onClick={(e) => {
                            setIsSettings(true);
                        }}
                    >
                        settings
                    </i>
                    <i
                        className="calmButton"
                        onClick={(e) => {
                            if (document.fullscreenElement) {
                                document.exitFullscreen();
                            } else {
                                document
                                    .querySelector(`.${styles.pdfCont}`)
                                    .requestFullscreen();
                            }
                        }}
                    >
                        fullscreen
                    </i>
                    <video
                        className={styles.videoBox}
                        style={{ transform: "scaleX(-1)" }}
                        // onClick={(e) => {
                        //     e.target.style.display = "none";
                        // }}
                        ref={videoRef}
                    ></video>
                </div>
                <FilePopup
                    files={files}
                    setFiles={setFiles}
                    directory={directory}
                    open={cloudForm}
                    setOpen={setCloudForm}
                    setDirectory={setDirectory}
                />
                <SettingsPopup
                    open={isSettings}
                    setOpen={setIsSettings}
                    settings={settings}
                    setSettings={setSettings}
                ></SettingsPopup>
            </div>
        </>
    );
}
