import React from "react";

import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	useTheme
} from "@mui/material";

import ReactCodeMirror from "@uiw/react-codemirror";
import { sql, SQLite } from "@codemirror/lang-sql";

import { DataGrid } from "@mui/x-data-grid";
import { SQLResult, SQLColumn, SQLCell } from "@sqlbook/notebook";
import { useNotebook } from "../../hooks/notebook";
import { useCodemirrorTheme } from "../../hooks/cmTheme";

type ExtractProps<TComponentOrTProps> =
	TComponentOrTProps extends React.ComponentType<infer TProps>
	? TProps
	: TComponentOrTProps;

export function SideBarButton(props: ExtractProps<typeof Button>) {
	return (<Button sx={{ ...props.sx, padding: 0, minWidth: 0, width: "100%", height: "1.6em" }} {...props} >
		{props.children}
	</Button>);
}

interface Props {
	editing?: boolean;
	value: SQLCell;
	onChange: (cell: SQLCell) => void;
}

interface CellRowModalProps {
	open: boolean;
	onClose: () => void;
	columns: SQLColumn[];
	row: string[];
}

export function CellRowModal(props: CellRowModalProps) {
	return (<Dialog
		open={props.open}
		onClose={props.onClose}
		maxWidth="xl"
	>
		<DialogContent>
			<TableContainer component={Box}>
				<Table size="small" aria-label="simple table">
					<TableHead>
						<TableRow>
							<TableCell component="th">Column</TableCell>
							<TableCell component="th">Value</TableCell>
							<TableCell component="th">Type</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{props.row.map((v, i) => (
							<TableRow
								key={v}
								sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
							>
								<TableCell component="th" scope="row">
									{props.columns[i].name}
								</TableCell>
								<TableCell>
									{v}
								</TableCell>
								<TableCell>
									{props.columns[i].type}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</DialogContent>
		<DialogActions>
			<Button onClick={props.onClose} autoFocus>
				Close
			</Button>
		</DialogActions>
	</Dialog>);
}

interface CellDataGridProps extends Omit<ExtractProps<typeof DataGrid>, "columns" | "rows"> {
	columns: SQLColumn[];
	rows: any[][];
}

export function CellDataGrid(props: CellDataGridProps) {
	const [pageSize, setPageSize] = React.useState(props.pageSize);
	const [modalOpen, setModalOpen] = React.useState(false);
	const [modalRow, setModalRow] = React.useState<string[]>([]);
	const rows = props.rows.map((row, id) => ({
		id,
		...Object.fromEntries(row.map((v, i) => [i.toString(), v ?? ""]))
	}));
	const lengths = props.columns.map((c) => c.name.length);
	for (const row of props.rows) {
		for (let i = 0; i < row.length; i++) {
			lengths[i] = Math.max(lengths[i], row[i]?.toString().length ?? 0);
		}
	}
	const columns = props.columns.map((col, i) => ({
		field: i.toString(),
		headerName: col.name,
		description: col.type,
		width: Math.min(200, 20 + 10 * lengths[i]),
	}));
	return (<>
		<DataGrid
			rowHeight={38}
			rowsPerPageOptions={[10, 20, 50, 100]}
			{...props}
			columns={columns}
			rows={rows}
			pageSize={pageSize}
			onPageSizeChange={setPageSize}
			onRowDoubleClick={(row) => {
				setModalRow(props.rows[row.id as number]);
				setModalOpen(true);
			}}
		/>
		<CellRowModal
			open={modalOpen}
			onClose={() => setModalOpen(false)}
			columns={props.columns}
			row={modalRow}
		/>
	</>);
}

export function SQLCellContent(props: Props) {
	const theme = useTheme();
	const dark = theme.palette.mode === "dark";
	const background = dark ? theme.palette.grey[900] : theme.palette.grey[200];
	const background2 = dark ? theme.palette.grey[800] : theme.palette.grey[300];

	const notebook = useNotebook();
	const executor = notebook.sqlExecutor;
	const codemirrorTheme = useCodemirrorTheme();
	const [error, setError] = React.useState<string | undefined>();
	const data = props.value.results;
	const setData = (data?: SQLResult[]) => {
		props.onChange({ ...props.value, results: data });
	};

	const sqlText = props.value.sql;
	const setSqlText = (sql: string) => {
		props.onChange({
			...props.value,
			sql,
		});
	};

	const execute = async () => {
		try {
			const results = await executor.execute(sqlText);
			setData(results);
			setError(undefined);
		} catch (e) {
			if (e instanceof Error) {
				setData(undefined);
				setError(e.message);
			}
		}
	};

	const clear = async () => {
		props.onChange({ ...props.value, results: undefined });
		setData(undefined);
		setError(undefined);
	};

	React.useEffect(() => {
		console.log("changed");
	}, [sqlText, data]);

	return (
		<Box sx={{ display: "flex", minWidth: 0, position: "relative", flexDirection: "column", flexGrow: 1 }}>
			<Box sx={{ width: "100%" }}>
				<ReactCodeMirror
					value={sqlText}
					onChange={(value) => setSqlText(value)}
					theme={codemirrorTheme}
					extensions={[sql({ dialect: SQLite })]}
					readOnly={props.value.readonly}
				/>
			</Box>
			{
				props.value.readonly ? undefined
				: <Box
					sx={{
						display: "flex",
						flexDirection: "row",
						justifyContent: "right",
					}}
				>
					{
						(data === undefined && error === undefined) ? undefined
							: <Button color="error" onClick={clear}>Clear</Button>
					}
					<Button onClick={execute}>Execute</Button>
				</Box>
			}
			{
				error === undefined ? undefined : (
					<Box sx={{ display: "flex", flexDirection: "column" }}>
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
							data?.map((result, index) => (
								<Box
									key={index}
									sx={{
										width: "100%",
										flexGrow: 1,
										overflow: "hidden",
									}}>
									<CellDataGrid
										autoHeight
										density="compact"
										rowHeight={38}
										rowsPerPageOptions={[10, 20, 50, 100]}
										pageSize={20}
										sx={{
											backgroundColor: background,
											border: "none",
											borderRadius: "0",
										}}
										onRowDoubleClick={(row) => {
											console.log(row);
										}}
										columns={result.columns}
										rows={result.rows}
									/>
								</Box>
							))
						}
					</Box>
				)
			}
		</Box>
	);
}
