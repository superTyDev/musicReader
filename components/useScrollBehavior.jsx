import { useEffect, useMemo, useState } from "react";

export function useScrollBehavior() {
    const [behaviorValue, setBehaviorValue] = useState();
    const [scrollAmount, setScrollAmount] = useState();

    useEffect(() => {
        setBehaviorValue(localStorage.getItem("scrollBehavior") || "page");
        console.log("scrollBehavior", localStorage.getItem("scrollBehavior"));
    }, []);

    useEffect(() => {
        window.localStorage.setItem("scrollBehavior", behaviorValue);
    }, [behaviorValue]);

    useEffect(() => {
        setScrollAmount(localStorage.getItem("scrollAmount") || 100);
        console.log("scrollAmount", localStorage.getItem("scrollAmount"));
    }, []);

    useEffect(() => {
        window.localStorage.setItem("scrollAmount", scrollAmount);
    }, [scrollAmount]);

    return {
        behaviorValue,
        setBehaviorValue,
        scrollAmount,
        setScrollAmount,
    };
}
