import { useEffect, useMemo } from "react";
import { useMediaQuery } from "react-responsive";
import createPersistedState from "use-persisted-state";
const useBehaviorState = createPersistedState("scrollBehavior");
const useAmountState = createPersistedState("amountState");

export function useScrollBehavior() {
    const systemPrefersDark = useMediaQuery(
        {
            query: "(prefers-color-scheme: dark)",
        },
        undefined
    );

    const [behaviorValue, setBehaviorValue] = useBehaviorState("page");
    const [scrollAmount, setScrollAmount] = useAmountState(0);

    return {
        behaviorValue,
        setBehaviorValue,
        scrollAmount,
        setScrollAmount,
    };
}
