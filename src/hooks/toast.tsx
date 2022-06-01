import React from "react";

import { Snackbar, SnackbarProps } from "@mui/material";

const ToastContext = React.createContext<{
	setSnackbar: ((props: Omit<SnackbarProps, "open">) => void),
	setOpen: (open: boolean) => void
} | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [snackbar, setSnackbar] = React.useState<SnackbarProps>({});
	const [open, setOpen] = React.useState(false);

	return (
		<ToastContext.Provider
			value={React.useMemo(() => ({ setSnackbar, setOpen }), [])}
		>
			<Snackbar
				{...snackbar}
				open={open}
				onClose={(event, reason) => {
					setOpen(false);
					snackbar.onClose?.(event, reason);
				}}
			/>
			{children}
		</ToastContext.Provider>
	);
}

export const useToast = () => {
	const ctx = React.useContext(ToastContext);
	if (ctx === undefined) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	const { setSnackbar, setOpen } = ctx;
	return (props: Omit<SnackbarProps, "open">) => {
		setSnackbar({
			anchorOrigin: { vertical: "bottom", horizontal: "center" },
			autoHideDuration: 3000,
			sx: {
				bottom: 32,
				marginX: 2,
			},
			...props,
		});
		setOpen(true);
	};
};
