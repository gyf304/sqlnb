import React from "react";

import { Box, Button, Typography, useTheme } from "@mui/material";
import * as emotion from "@emotion/css";

import { Delete } from "@mui/icons-material";
import ReactCodeMirror from "@uiw/react-codemirror";
import { syntaxHighlighting } from '@codemirror/language';
import { sql, SQLite } from "@codemirror/lang-sql";

import { DataGrid } from "@mui/x-data-grid";
import { SQLResult } from "./sql/types";
import { useNotebook } from "./hooks/notebook";
import { useCodemirrorTheme } from "./hooks/cmTheme";
import { useSQLExecutor } from "./hooks/sqlExecutor";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import { useToast } from "./hooks/toast";

type ExtractProps<TComponentOrTProps> =
	TComponentOrTProps extends React.ComponentType<infer TProps>
	? TProps
	: TComponentOrTProps;

export function SideBarButton(props: ExtractProps<typeof Button>) {
	return (<Button sx={{ ...props.sx, padding: 0, minWidth: 0, width: "100%", height: "1.6em" }} {...props} >
		{ props.children }
	</Button>);
}

interface Props {
	id: string;
	seq?: number;
}

export function CellDisplay(props: Props) {
	const theme = useTheme();
	const dark = theme.palette.mode === "dark";
	const background = dark ? theme.palette.grey[900] : theme.palette.grey[200];
	const background2 = dark ? theme.palette.grey[800] : theme.palette.grey[300];

	const executor = useSQLExecutor();
	const notebook = useNotebook();
	const codemirrorTheme = useCodemirrorTheme();
	const toast = useToast();

	const [deleteTimeout, setDeleteTimeout] = React.useState<number | undefined>();
	const [data, setData] = React.useState<SQLResult[] | undefined>();
	const [error, setError] = React.useState<string | undefined>();
	const [sqlText, setSqlText] = React.useState("");

	React.useEffect(() => {
		(async () => {
			const cell = await notebook.getCell(props.id);
			if (cell.type === "sql") {
				setSqlText(cell.sql);
				setData(cell.results);
			}
		})();
	}, [props.id]);

	const execute = async () => {
		try {
			const results = await executor.execute(sqlText);
			setData(results);
			setError(undefined);
			notebook.updateCell(props.id, { type: "sql", sql: sqlText, results });
		} catch (e) {
			if (e instanceof Error) {
				setData(undefined);
				setError(e.message);
			}
		}
	};

	const clear = () => {
		setData(undefined);
		setError(undefined);
		notebook.updateCell(props.id, { type: "sql", sql: sqlText });
	};

	const deleteCell = () => {
		notebook.deleteCell(props.id);
	};

	React.useEffect(() => {
		// pass
	}, [sqlText]);

	const dataGridProps: ExtractProps<typeof DataGrid>[] | undefined = React.useMemo(() => {
		return data?.map((result) => {
			return {
				columns: result.columns.map((col, i) => ({
					field: i.toString(),
					headerName: col.name,
					description: col.type,
					flex: col.type === "string" ? 2 : 1,
				})),
				rows: result.rows.map((row, id) => ({
					id,
					...Object.fromEntries(row.map((v, i) => [i.toString(), v]))
				})),
			};
		});
	}, [data]);

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "row",
				alignItems: "stretch",
			}}
		>
			<Box
				sx={{
					display: "flex",
					width: "2em",
					flexShrink: 0,
					flexDirection: "column",
					justifyContent: "space-between",
					textAlign: "center",
					fontSize: "1em",
					pt: 1,
					pb: 1,
				}}
			>
				<Box sx={{ fontSize: "0.8em" }}>
					#{props.seq ?? "?"}
				</Box>
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "0.2em",
					}}
				>
					<SideBarButton color="error"
						onMouseDown={() => {
							setDeleteTimeout(window.setTimeout(() => {
								deleteCell();
								setDeleteTimeout(undefined);
							}, 1000));
						}}
						onMouseUp={() => {
							if (deleteTimeout !== undefined) {
								window.clearTimeout(deleteTimeout);
								setDeleteTimeout(undefined);
								toast({ message: "Hold delete for more than 1 second to delete a cell." })
							}
						}}
					>
						<Delete sx={{ fontSize: "1.4em" }} />
					</SideBarButton>
				</Box>
			</Box>
			<Box sx={{ display: "flex", minWidth: 0, position: "relative", flexDirection: "column", flexGrow: 1, backgroundColor: background2 }}>
				<Box sx={{ width: "100%" }}>
					<ReactCodeMirror
						value={sqlText}
						onChange={(value) => setSqlText(value)}
						theme={[codemirrorTheme, syntaxHighlighting(oneDarkHighlightStyle)]}
						extensions={[sql({ dialect: SQLite })]}
					/>
				</Box>
				<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						justifyContent: "right",
					}}
				>
					<Button onClick={execute}>Execute</Button>
				</Box>
				{
					error === undefined ? undefined : (
						<Box sx={{ display: "flex", flexDirection: "column", backgroundColor: background }}>
							<Box sx={{ pl: 1, pr: 1 }}>
								<Typography variant="h6">
									Error
								</Typography>
								<Typography component="p" variant="body1">
									<pre>{error}</pre>
								</Typography>
							</Box>
						</Box>
					)
				}
				{
					data === undefined ? undefined : (
						<Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
							{
								dataGridProps?.map((props, index) => (
									<Box
										key={index}
										sx={{
											width: "100%",
											flexGrow: 1,
											overflow: "hidden",
											// ":first-child": {
											// 	borderRadius: "4px 0 0 0",
											// },
											// ":last-child": {
											// 	borderRadius: "0 0 0 4px",
											// }
										}}>
										<DataGrid
											{...props}
											autoHeight
											density="compact"
											rowHeight={38}
											rowsPerPageOptions={[10, 20, 50, 100]}
											pageSize={10}
											sx={{
												backgroundColor: background,
												border: "none",
												borderRadius: "0",
											}}
										/>
									</Box>
								))
							}
						</Box>
					)
				}
				{
					data !== undefined || error !== undefined ?
						<Box
							sx={{
								display: "flex",
								flexDirection: "row",
								justifyContent: "right",
							}}
						>
							<Button color="error" onClick={clear}>Clear</Button>
						</Box> :
						undefined
				}
			</Box>
		</Box>
	);
}
