import * as React from "react";
import { EditorView } from "@uiw/react-codemirror";
import { useTheme } from "@mui/material";

export function useCodemirrorTheme() {
	const theme = useTheme();
	const dark = theme.palette.mode === "dark";
	const background = dark ? theme.palette.grey[900] : theme.palette.grey[200];
	const background2 = dark ? theme.palette.grey[800] : theme.palette.grey[300];
	
	return EditorView.theme({
		"&": {
			color: theme.palette.text.primary,
			backgroundColor: background,
		},
		".cm-content": {
			caretColor: theme.palette.primary.main,
		},
		".cm-completionIcon": {
			display: "none",
		},
		".cm-cursor, .cm-dropCursor": { borderLeftColor: theme.palette.primary.main },
		"&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": { backgroundColor: theme.palette.primary.main },
		".cm-panels": { backgroundColor: background, color: theme.palette.text.primary },
		".cm-panels.cm-panels-top": { borderBottom: "2px solid black" },
		".cm-panels.cm-panels-bottom": { borderTop: "2px solid black" },
		".cm-searchMatch": {
			backgroundColor: "#72a1ff59",
			outline: "1px solid #457dff"
		},
		".cm-searchMatch.cm-searchMatch-selected": {
			backgroundColor: "#6199ff2f"
		},
		".cm-activeLine": { backgroundColor: background },
		".cm-selectionMatch": { backgroundColor: "#aafe661a" },
		"&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
			backgroundColor: "#bad0f847",
			outline: "1px solid #515a6b"
		},
		".cm-gutters": {
			backgroundColor: background,
			color: theme.palette.text.primary,
			border: "none"
		},
		".cm-activeLineGutter": {
			backgroundColor: background,
		},
		".cm-foldPlaceholder": {
			backgroundColor: "transparent",
			border: "none",
			color: "#ddd"
		},
		".cm-tooltip": {
			border: "none",
			backgroundColor: background2,
			boxShadow: theme.shadows[4],
			borderRadius: `${theme.shape.borderRadius}px`,
		},
		".cm-completionLabel": {
			margin: "4px",
		},
		".cm-tooltip .cm-tooltip-arrow:before": {
			borderTopColor: "transparent",
			borderBottomColor: "transparent"
		},
		".cm-tooltip .cm-tooltip-arrow:after": {
			borderTopColor: "transparent",
			borderBottomColor: "transparent",
		},
		".cm-tooltip-autocomplete": {
			"& > ul > li[aria-selected]": {
				backgroundColor: theme.palette.background.paper,
				color: theme.palette.text.primary,
			}
		}
	}, { dark });
}
