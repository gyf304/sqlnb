import { Box, Button, useTheme } from "@mui/material";
import ReactCodeMirror from "@uiw/react-codemirror";
import { syntaxHighlighting } from '@codemirror/language';
import { markdown } from "@codemirror/lang-markdown";
import React from "react";
import { useCodemirrorTheme } from "../../hooks/cmTheme";
import { useNotebook } from "../../hooks/notebook";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import { MarkdownCell } from "@sqlbook/notebook";
import ReactMarkdown from "react-markdown";

interface Props {
	value: MarkdownCell;
	onChange: (cell: MarkdownCell) => void;
}

export function MarkdownCellContent(props: Props) {
	const theme = useTheme();
	const dark = theme.palette.mode === "dark";
	const background = dark ? theme.palette.grey[900] : theme.palette.grey[200];
	const background2 = dark ? theme.palette.grey[800] : theme.palette.grey[300];

	const notebook = useNotebook();
	const codemirrorTheme = useCodemirrorTheme();

	return (
		<Box sx={{ display: "flex", minWidth: 0, position: "relative", flexDirection: "column", flexGrow: 1, minHeight: "100%" }}>
			{
				props.value.readonly ? undefined
					: <Box sx={{ width: "100%" }}>
						<ReactCodeMirror
							value={props.value.markdown}
							onChange={(value) => props.onChange({ ...props.value, markdown: value })}
							theme={codemirrorTheme}
							extensions={[markdown({})]}
							readOnly={props.value.readonly}
						/>
					</Box>
			}
			<Box sx={{ width: "100%", p: 1 }}>
				<ReactMarkdown>{props.value.markdown}</ReactMarkdown>
			</Box>
		</Box>
	);
}
