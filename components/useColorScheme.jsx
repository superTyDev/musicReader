import { useEffect, useMemo } from "react";
import { useMediaQuery } from "react-responsive";
import createPersistedState from "use-persisted-state";
const useColorSchemeState = createPersistedState("colorScheme");

export function useColorScheme() {
    const systemPrefersDark = useMediaQuery(
        {
            query: "(prefers-color-scheme: dark)",
        },
        undefined
    );

    const [theme, setTheme] = useColorSchemeState();
    const value = useMemo(
        () => (theme === undefined ? "system" : theme),
        [theme, systemPrefersDark]
    );

    useEffect(() => {
        if ((value == "system" && systemPrefersDark) || value == "dark") {
            document.documentElement.classList.add("theme-dark");
        } else {
            document.documentElement.classList.remove("theme-dark");
        }
    }, [value]);

    return {
        theme: value,
        setTheme: setTheme,
    };
}
