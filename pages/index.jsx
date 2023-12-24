import Link from "next/link";
import React, { useState } from "react";

import styles from "../styles/Index.module.css";

export default function EntryForm() {
    return (
        <>
            <div className={styles.page}>
                <div className={styles.center}>
                    <div className="header">
                        <h1>Music Reader Connect</h1>
                    </div>
                    <div className={styles.linkCont}>
                        <Link href="/readerRolling" class="button">
                            Rolling Viewer (head)
                        </Link>
                        <Link href="/reader" class="button">
                            Classic Viewer (head)
                        </Link>
                        <Link href="/blink" class="button">
                            Classic Viewer (blink)
                        </Link>
                    </div>
                    <Link href="https://github.com/superTyDev/musicReader">
                        Checkout GitHub
                    </Link>
                </div>
            </div>
        </>
    );
}
