import { useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "react-responsive";

export function useColorScheme() {
    const systemPrefersDark = useMediaQuery(
        {
            query: "(prefers-color-scheme: dark)",
        },
        undefined
    );

    const [theme, setTheme] = useState();

    useEffect(() => {
        setTheme(window.localStorage.getItem("theme") || "system");
    }, []);

    useEffect(() => {
        window.localStorage.setItem("theme", theme);

        if ((theme == "system" && systemPrefersDark) || theme == "dark") {
            document.documentElement.classList.add("theme-dark");
        } else {
            document.documentElement.classList.remove("theme-dark");
        }
    }, [theme, systemPrefersDark]);

    return {
        theme,
        setTheme,
    };
}
