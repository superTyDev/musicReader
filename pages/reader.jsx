import Link from "next/link";
import dynamic from "next/dynamic";
import React, { useState, useRef } from "react";
// import blink from "./../components/blink";
import { usePdf } from "@mikecousins/react-pdf";
import Webcam from "react-webcam";

// const blink = dynamic(async () => await import("./../components/blink"), {
// 	ssr: false,
// });

import styles from "../styles/Reader.module.css";
import { useEffect } from "react";

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

function DisplayFiles({ files, setSelectedFile, directory }) {
	if (files.length) {
		return (
			<>
				{files.map((file, index) => {
					return (
						<div
							key={index}
							onClick={(e) => {
								directory.getFileHandle(file).then((pdfFile) => {
									pdfFile.getFile().then((pdfStream) => {
										console.log(pdfStream);
										console.log(typeof pdfStream);
										setSelectedFile(window.URL.createObjectURL(pdfStream));
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

async function initBlink() {
	const Blink = (await import("../components/blink.ts")).default;

	await Blink.loadModel();

	const videoElement = document.querySelector("video");
	await Blink.setUpCamera(videoElement);

	const blinkPrediction = await Blink.getBlinkPrediction();
	console.log("Blink: ", blinkPrediction);
}

export default function Reader() {
	const [files, setFiles] = useState([]);
	const [directory, setDirectory] = useState(null);
	const [selectedFile, setSelectedFile] = useState(
		"Nocturne Op. 72 Chopin.pdf"
	);
	const [page, setPage] = useState(1);
	const canvasRef = useRef(null);

	const { pdfDocument, pdfPage } = usePdf({
		file: selectedFile,
		page,
		canvasRef,
	});

	const videoRef = useRef(null);

	useEffect(() => {
		if (document.readyState === "complete") {
			initBlink();
		} else {
			window.addEventListener("load", initBlink);
			return () => window.removeEventListener("load", initBlink);
		}
	}, []);

	return (
		<>
			<div className="page">
				<div className={styles.header}>
					<h1>MC - Reader</h1>
				</div>
				<div className={styles.sideNav}>
					<h2 style={{ textAlign: "center", borderBottom: "1px white solid" }}>
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
						/>
						<spacer />
					</div>
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
								disabled={page === pdfDocument.numPages}
								onClick={() => setPage(page + 1)}
							>
								Next
							</button>
						</nav>
					)}
					<i
						className={styles.fullscreen}
						onClick={(e) => {
							if (document.fullscreenElement) {
								document.exitFullscreen();
							} else {
								document.getElementById("mainCont").requestFullscreen();
							}
						}}
					>
						fullscreen
					</i>
					<video className={styles.videoBox} ref={videoRef}></video>
				</div>
			</div>
		</>
	);
}
