import Head from "next/head";
import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";

import "../styles/globals.css";

export default function App({ Component, pageProps }) {
    const systemPrefersDark = useMediaQuery(
        {
            query: "(prefers-color-scheme: dark)",
        },
        undefined
    );

    const [settings, setSettings] = useState({});

    useEffect(() => {
        setSettings({
            theme: window.localStorage.getItem("theme") || "system",
            behaviorValue:
                window.localStorage.getItem("scrollBehavior") || "page",
            scrollAmount: window.localStorage.getItem("scrollAmount") || 100,
            lightMusic: window.localStorage.getItem("lightMusic") || false,
            fitDirection:
                window.localStorage.getItem("fitDirection") || "height",
        });
    }, []);

    useEffect(() => {
        window.localStorage.setItem("theme", settings.theme);
        window.localStorage.setItem("scrollBehavior", settings.behaviorValue);
        window.localStorage.setItem("scrollAmount", settings.scrollAmount);
        window.localStorage.setItem("lightMusic", settings.lightMusic);
        window.localStorage.setItem("fitDirection", settings.fitDirection);

        if (
            (settings.theme == "system" && systemPrefersDark) ||
            settings.theme == "dark"
        ) {
            document.documentElement.classList.add("theme-dark");
        } else {
            document.documentElement.classList.remove("theme-dark");
        }

        if (settings.lightMusic) {
            document.documentElement.classList.add("light-music");
        } else {
            document.documentElement.classList.remove("light-music");
        }
    }, [settings, systemPrefersDark]);

    return (
        <>
            <Head>
                <title>Music Reader Connect</title>
                <meta name="description" content="Music Reader Connect" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                <link rel="icon" href="/favicon.png" />
            </Head>

            {/* Router specifies which component to insert here as the main content */}
            <Component
                {...pageProps}
                settings={settings}
                setSettings={setSettings}
            />
        </>
    );
}
