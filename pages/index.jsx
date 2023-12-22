import Link from "next/link";
import React, { useState } from "react";

import styles from "../styles/Index.module.css";

export default function EntryForm() {
	// const [action, setAction] = useState("/controller");

	return (
		<>
			<div className={styles.page}>
				<div className={styles.center}>
					<div className="header">
						<h1>Music Reader Connect</h1>
					</div>
					<Link href="/reader">See viewer (control with mouth twitch)</Link>
					<br />
					<Link href="/blink">See viewer (control with eye blink)</Link>
					<br />
					<Link href="https://github.com/superTyDev/musicReader">
						Checkout GitHub
					</Link>
				</div>
			</div>
		</>
	);
}
