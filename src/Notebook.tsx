import { Button, Card } from '@mui/material';
import { Box } from '@mui/system';
import React from 'react';
import './App.css';
import { CellDisplay } from './Cell';
import { NotebookProvider } from './hooks/notebook';
import { useSQLExecutor } from './hooks/sqlExecutor';
import { useToast } from './hooks/toast';
import { Notebook } from './notebook/types';

interface Props {
	notebook: Notebook;
}

function downloadBuffer(data: ArrayBuffer, fileName: string, mimeType: string) {
	const a = document.createElement('a')
	a.href = URL.createObjectURL(new Blob(
		[data],
		{ type: mimeType }
	))
	a.download = fileName
	a.click()
}

function bufferFromURL(url: string) {
	return fetch(url)
		.then(response => response.arrayBuffer())
}

function getUserBuffer(): Promise<ArrayBuffer> {
	const input = document.createElement("input");
	input.type = "file";

	const promise: Promise<ArrayBuffer> = new Promise((resolve, reject) => {
		input.addEventListener("change", (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file === undefined) {
				reject("No file selected");
				return;
			} else {
				const reader = new FileReader();
				reader.addEventListener("load", (e) => {
					console.log((e.target as any)?.result);
					resolve((e.target as any)?.result as ArrayBuffer);
				});
				reader.addEventListener("error", (e) => {
					reject(e);
				})
				reader.readAsArrayBuffer(file);
			}
		});
	});

	input.click();
	return promise;
}

export function NotebookDisplay({ notebook }: Props) {
	const toast = useToast();
	const sqlExecutor = useSQLExecutor();
	const [cellIds, setCellIds] = React.useState<string[]>([]);

	React.useEffect(() => {
		(async () => {
			const cellIds = await notebook.getCellIds();
			setCellIds(cellIds);
		})();
		const listener = async (id?: string) => {
			console.log("listener", id);
			if (id === undefined) {
				const cellIds = await notebook.getCellIds();
				setCellIds(cellIds);
			}
		};
		notebook.addListener(listener);
		return () => notebook.removeListener(listener);
	}, []);

	return (
		<NotebookProvider value={notebook}>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					p: 2,
					gap: 2,
				}}
			>
				<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					{
						sqlExecutor.load === undefined ? undefined :
							<>
								<Button
									onClick={async () => {
										try {
											const data = await getUserBuffer();
											await sqlExecutor.load!(data);
											notebook.reload();
										} catch (e) {
											if (e instanceof Error) {
												toast({ message: e.message });
												console.error(e);
											}
										}
									}}
								>
									Load
								</Button>
								<Button
									onClick={async () => {
										try {
											const data = await bufferFromURL("https://raw.githubusercontent.com/jpwhite3/northwind-SQLite3/master/Northwind_small.sqlite");
											console.log("DATA", data);
											await sqlExecutor.load!(data);
											notebook.reload();
											notebook.addCell({
												type: "sql",
												sql: "SELECT * FROM Customer",
											});
											notebook.addCell({
												type: "sql",
												sql: "SELECT * FROM Product",
											});
										} catch (e) {
											if (e instanceof Error) {
												toast({ message: e.message });
												console.error(e);
											}
										}
									}}
								>
									Northwind Demo
								</Button>
							</>
					}
					{
						sqlExecutor.save === undefined ? undefined :
							<Button
								onClick={async () => {
									const data = await sqlExecutor.save?.();
									if (data === undefined) {
										return;
									}
									downloadBuffer(data, "notebook.sqlite", "application/vnd.sqlite3");
								}}
							>
								Save
							</Button>
					}
				</Box>
				{
					cellIds.map((cellId, i) => (
						<div key={cellId} style={{ width: "100%" }}>
							<Card elevation={16}>
								<CellDisplay id={cellId} seq={i + 1} />
							</Card>
						</div>
					))
				}
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
							notebook.addCell({ type: "sql", sql: "" });
						}}
					>
						Add SQL Cell
					</Button>
				</Box>
			</Box>
		</NotebookProvider>
	);
}
