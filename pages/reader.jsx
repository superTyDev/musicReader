import Link from "next/link";
import React from "react";

import styles from "../styles/Reader.module.css";

export default function Reader() {
	return (
		<>
			<div className="navSpacer"></div>
			<div className="page">
				<h1>MC - Reader</h1>
				<button id="addToFolder" class="">
					Open Folder
				</button>
			</div>
		</>
	);
}
