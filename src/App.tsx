import React from "react";
import "./App.css";

import { CellDisplay } from "./Cell";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box, Button, Card } from "@mui/material";
import { SQLExecutorProvider } from "./hooks/sqlExecutor";
import { SQLiteWorkerExecutor } from "./sql/sqliteWorkerExecutor";
import { SQLNotebook } from "./notebook/sqlNotebook";
import { ToastProvider } from "./hooks/toast";
import { NotebookDisplay } from "./Notebook";

const darkTheme = createTheme({
	palette: {
		mode: "dark",
	},
});

const executor = new SQLiteWorkerExecutor();
const notebook = new SQLNotebook(executor);

notebook.addCell({ type: "sql", sql: "SELECT SQLITE_VERSION()" });

function App() {
	return (
		<ThemeProvider theme={darkTheme}>
			<div className="App">
				<ToastProvider>
					<SQLExecutorProvider value={executor}>
						<NotebookDisplay notebook={notebook} />
					</SQLExecutorProvider>
				</ToastProvider>
			</div>
		</ThemeProvider>
	);
}

export default App;
