export interface SQLColumn {
	name: string;
	type: "string" | "number" | "boolean" | "date" | "time" | "datetime" | "unknown";
}

export interface SQLResult {
	statement: string;
	columns: SQLColumn[];
	rowCount: number;
	rows: (string | number | boolean | null)[][];
}

export interface SQLExecutor {
	execute(sql: string, ...args: any[]): Promise<SQLResult[]>;
	save?: () => Promise<ArrayBuffer>;
	load?: (buffer: ArrayBuffer) => Promise<void>;
}
