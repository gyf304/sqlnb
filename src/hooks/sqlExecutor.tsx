import * as React from "react";
import { SQLExecutor } from "@sqlbook/notebook";

const context = React.createContext<SQLExecutor | undefined>(undefined);
export const SQLExecutorProvider = context.Provider;

export function useSQLExecutor(): SQLExecutor {
	const executor = React.useContext(context);
	if (!executor) {
		throw new Error("useSQLExecutor must be used within a SQLExecutorProvider");
	}
	return executor;
}
