import * as React from "react";
import { Notebook } from "../notebook/types";

const context = React.createContext<Notebook | undefined>(undefined);
export const NotebookProvider = context.Provider;

export function useNotebook(): Notebook {
	const notebook = React.useContext(context);
	if (notebook === undefined) {
		throw new Error("useNotebook must be used within a NotebookProvider");
	}
	return notebook;
}
