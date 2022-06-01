import { SQLExecutor, SQLResult } from "./types";

export class DummyExecutor implements SQLExecutor {
	constructor() {}

	async execute(sql: string): Promise<SQLResult[]> {
		return [{
			statement: sql,
			rowCount: 2,
			columns: [{
				name: "A",
				type: "string",
			}, {
				name: "B",
				type: "string",
			}],
			rows: [
				["a", "b"],
				["c", null],
			],
		}];
	}
}
