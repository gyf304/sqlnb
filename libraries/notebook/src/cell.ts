import { SQLResult } from "./sql";

interface BaseCell {
	type: string;
	readonly: boolean;
}

export interface SQLCell extends BaseCell {
	type: "sql";
	sql: string;
	results?: SQLResult[];
}

export interface MarkdownCell extends BaseCell {
	type: "markdown";
	markdown: string;
}

export interface PlotCell extends BaseCell {
	type: "plot";
}

export type Cell = SQLCell | MarkdownCell;
