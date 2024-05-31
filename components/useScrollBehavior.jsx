import { useEffect, useMemo, useState } from "react";

export function useScrollBehavior() {
    const [behaviorValue, setBehaviorValue] = useState();
    const [scrollAmount, setScrollAmount] = useState();

    useEffect(() => {
        setBehaviorValue(localStorage.getItem("scrollBehavior") || "page");
    });

    useEffect(() => {
        window.localStorage.setItem("scrollBehavior", behaviorValue);
    }, [behaviorValue]);

    useEffect(() => {
        setScrollAmount(localStorage.getItem("scrollBehavior") || "page");
    });

    useEffect(() => {
        window.localStorage.setItem("scrollBehavior", scrollAmount);
    }, [scrollAmount]);

    return {
        behaviorValue,
        setBehaviorValue,
        scrollAmount,
        setScrollAmount,
    };
}
