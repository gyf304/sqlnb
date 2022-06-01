import { SQLResult } from "../sql/types";

interface BaseCell {
	type: string;
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

export interface Notebook {
	getCellIds(): Promise<string[]>;
	getCell(id: string): Promise<Cell>;
	deleteCell(id: string): Promise<void>;
	updateCell(id: string, cell: Cell): Promise<void>;
	addCell(cell: Cell): Promise<string>;
	moveCell(id: string, index: number): Promise<void>;
	addListener(callback: (id?: string) => void): void;
	removeListener(callback: () => void): void;
	reload(): Promise<void>;
}
