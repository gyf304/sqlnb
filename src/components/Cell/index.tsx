import React from "react";

import { Box, Button, Card, Checkbox, FormControlLabel, Typography, useTheme } from "@mui/material";

import { Delete, Edit, Lock } from "@mui/icons-material";

import { Cell } from "@sqlbook/notebook";
import { useNotebook } from "../../hooks/notebook";
import { useToast } from "../../hooks/toast";
import { SQLCellContent } from "./SQLCellContent";
import { MarkdownCellContent } from "./MarkdownCellContent";

type ExtractProps<TComponentOrTProps> =
	TComponentOrTProps extends React.ComponentType<infer TProps>
	? TProps
	: TComponentOrTProps;

export function SideBarButton(props: ExtractProps<typeof Button>) {
	return (<Button variant="outlined" sx={{ ...props.sx, padding: 0, paddingLeft: 0.5, paddingRight: 0.5, minWidth: 0, height: "1.6em" }} {...props} >
		{props.children}
	</Button>);
}

interface Props {
	id: string;
	readonly?: boolean;
	index: number;
	onDelete: () => void;
}

export function CellDisplay(props: Props) {
	const notebook = useNotebook();
	const toast = useToast();
	const theme = useTheme();

	const [deleteTimeout, setDeleteTimeout] = React.useState<number | undefined>();
	const [persistTimeout, setPersistTimeout] = React.useState<number | undefined>();

	const [cell, setCell] = React.useState<Cell | undefined>();

	React.useEffect(() => {
		(async () => {
			const cell = await notebook.getCell(props.id);
			setCell(cell);
		})();
	}, [props.id]);

	const onChange = (cell: Cell) => {
		setCell(cell);
		if (persistTimeout) {
			clearTimeout(persistTimeout);
		}
		setPersistTimeout(window.setTimeout(async () => {
			console.log("persisting cell");
			await notebook.updateCell(props.id, cell);
		}, 500));
	};

	return (
		<Card variant="outlined" sx={{ overflow: "inherit" }}>
			<Box>
				<Box
					sx={{
						position: "sticky",
						top: 0,
						display: "flex",
						height: "2em",
						flexShrink: 0,
						flexDirection: "row",
						justifyContent: "space-between",
						textAlign: "center",
						fontSize: "1em",
						p: 1,
						zIndex: 100,
						backgroundColor: theme.palette.background.paper,
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							gap: "0.2em"
						}}
					>
						{props.index + 1}
					</Box>
					<Box
						sx={{
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							gap: "0.2em",
							marginLeft: "1em"
						}}
					>
						{
							cell === undefined || props.readonly ? undefined :
								<SideBarButton
									onClick={() => {
										setCell({ ...cell, readonly: !cell.readonly });
									}}
								>
									<Checkbox
										size="small"
										checked={!cell.readonly}
										sx={{
											padding: 0,
										}}
									/>
									<Typography sx={{
										fontSize: "0.8em",
									}}>
										Edit
									</Typography>
								</SideBarButton>
						}
						{
							(props.readonly || cell === undefined) ? undefined :
								<SideBarButton color="error"
									onMouseDown={() => {
										setDeleteTimeout(window.setTimeout(() => {
											props.onDelete();
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
									<Delete sx={{ fontSize: "1.2em" }} />
									<Typography sx={{
										fontSize: "0.8em",
									}}>
										Delete
									</Typography>
								</SideBarButton>
						}
					</Box>
				</Box>
				{
					cell === undefined ? undefined
						: cell.type === "sql" ? <SQLCellContent value={cell} onChange={onChange} />
						: cell.type === "markdown" ? <MarkdownCellContent value={cell} onChange={onChange} />
						: undefined
				}
			</Box>
		</Card>
	);
}
