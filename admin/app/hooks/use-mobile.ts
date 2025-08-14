import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 900;

type BreakPointHookProps = {
	customBreakpoint?: number;
};

export function useIsMobile({ customBreakpoint }: BreakPointHookProps = {}) {
	const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);
	const breakPoint = customBreakpoint || MOBILE_BREAKPOINT;

	useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${breakPoint - 1}px)`);
		const onChange = () => {
			setIsMobile(window.innerWidth < breakPoint);
		};
		mql.addEventListener("change", onChange);
		setIsMobile(window.innerWidth < breakPoint);
		return () => mql.removeEventListener("change", onChange);
	}, []);

	return !!isMobile;
}
