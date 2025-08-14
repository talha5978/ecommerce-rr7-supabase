import { useSearchParams, useNavigate } from "react-router";

type setSearchParamsParams = URLSearchParams | ((prev: URLSearchParams) => URLSearchParams);

type ReturnType = (callback: () => void) => {
	setSearchParams: (params: setSearchParamsParams, preventScrollReset?: boolean) => void;
	navigate: (to: string, options?: { replace?: boolean }) => void;
};

export const useSuppressTopLoadingBar = (): ReturnType => {
	const [_, setSearchParams] = useSearchParams();
	const navigate = useNavigate();

	const suppressNavigation = (callback: () => void) => {
		callback();
		return {
			setSearchParams: (params: setSearchParamsParams, preventScrollReset?: boolean) => {
				setSearchParams(params, {
					state: { suppressLoadingBar: true },
					preventScrollReset: preventScrollReset != null ? preventScrollReset : true,
					replace: true,
				});
			},
			navigate: (to: string, options?: { replace?: boolean }) => {
				navigate(to, {
					state: { suppressLoadingBar: true },
					replace: options?.replace,
				});
			},
		};
	};

	return suppressNavigation;
};
