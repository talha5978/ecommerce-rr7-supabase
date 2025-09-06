import { createContext, useState } from "react";

export type ViewMode = "table" | "grid";

type CouponsPageCtxType = {
	view_mode: ViewMode;
	setViewMode: (mode: ViewMode) => void;
	isCouponTypeDialogOpen: boolean;
	setCouponTypeDialogState: (state: boolean) => void;
};

const initialCtxState: CouponsPageCtxType = {
	view_mode: "table",
	setViewMode: (_) => {},
	isCouponTypeDialogOpen: false,
	setCouponTypeDialogState: (_) => {},
};

export const CouponsPageCtx = createContext<CouponsPageCtxType>(initialCtxState);

export default function CouponsPageContex({ children }: { children: React.ReactNode }) {
	const [viewMode, setViewMode] = useState<ViewMode>();
	const [couponTypeDialogOpen, setCouponTypeDialogOpen] = useState<boolean>(false);

	const values: CouponsPageCtxType = {
		view_mode: viewMode || initialCtxState.view_mode,
		setViewMode: (mode: ViewMode) => setViewMode(mode),
		isCouponTypeDialogOpen: couponTypeDialogOpen,
		setCouponTypeDialogState: (state: boolean) => setCouponTypeDialogOpen(state),
	};

	return <CouponsPageCtx.Provider value={values}>{children}</CouponsPageCtx.Provider>;
}
