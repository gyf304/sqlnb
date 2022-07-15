import { Button, Card } from "@mui/material";
import { Box } from "@mui/system";
import React from "react";
import { CellDisplay } from "../Cell";
import { NotebookProvider } from "../../hooks/notebook";
import { useSQLExecutor } from "../../hooks/sqlExecutor";
import { useToast } from "../../hooks/toast";
import { Notebook } from "@sqlbook/notebook";

interface Props {
	notebook: Notebook;
	readonly?: boolean;
}

export function CellBar({ notebook }: Props) {
	
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Button
				onClick={() => {
					notebook.addCell({ type: "sql", sql: "", readonly: false });
				}}
			>
				Add Markdown Cell
			</Button>
			<Button
				onClick={() => {
					notebook.addCell({ type: "sql", sql: "", readonly: false });
				}}
			>
				Add SQL Cell
			</Button>
		</Box>
	);
}
