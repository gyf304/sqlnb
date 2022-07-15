import React from "react";

import { CellDisplay } from "./components/Cell";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box, Button, Card, Paper } from "@mui/material";
import { SQLExecutorProvider } from "./hooks/sqlExecutor";
import { SQLiteWorkerExecutor } from "./executors/sqliteWorkerExecutor";
import { SQLiteNotebook } from "@sqlbook/notebook";
import { ToastProvider } from "./hooks/toast";
import { NotebookDisplay } from "./components/Notebook";

const darkTheme = createTheme({
	palette: {
		mode: "dark",
	},
});

const lightTheme = createTheme({
	palette: {
		mode: "light",
	},
});

const executor = new SQLiteWorkerExecutor();
const notebook = new SQLiteNotebook(executor);

notebook.addCell({ type: "markdown", markdown: "## Hello, world!", readonly: false });
notebook.addCell({ type: "sql", sql: "SELECT SQLITE_VERSION()", readonly: false });

function App() {
	const [theme, setTheme] = React.useState(darkTheme);
	const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
	darkThemeMq.onchange = () => {
		if (darkThemeMq.matches) {
			setTheme(darkTheme);
		}
		else {
			setTheme(lightTheme);
		}
	};

	return (
		<ThemeProvider theme={theme}>
			<Box sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				height: "100%",
				width: "100%",
				backgroundColor: theme.palette.background.paper,
				overflow: "scroll",
			}}>
				<ToastProvider>
					<SQLExecutorProvider value={executor}>
						<NotebookDisplay notebook={notebook} />
					</SQLExecutorProvider>
				</ToastProvider>
			</Box>
		</ThemeProvider>
	);
}

export default App;
