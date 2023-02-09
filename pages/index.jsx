import Link from "next/link";
import React, { useState } from "react";

export default function EntryForm() {
	// const [action, setAction] = useState("/controller");

	return (
		<>
			<div className="joinCont">
				<div className="header">
					<h1>Music Reader Connect</h1>
				</div>
				<Link href="/reader" />
			</div>
		</>
	);
}
