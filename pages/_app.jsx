import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import "../styles/globals.css";

export default function App({ Component, pageProps }) {
    return (
        <>
            <Head>
                <title>Music Reader Connect</title>
                <meta name="description" content="Music Reader Connect" />
                <link rel="icon" href="/favicon.png" />
            </Head>

            {/* Router specifies which component to insert here as the main content */}
            <Component {...pageProps} />
        </>
    );
}
