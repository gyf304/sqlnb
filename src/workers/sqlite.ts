import { SQLite, SQLiteDB, SQLiteDatatypes } from "@yifangu/sqlite";

import type { SQLResult, SQLColumn } from "../sql/types";

interface BaseRequest {
	id: number;
}

interface WasmRequest extends BaseRequest {
	kind: "wasm";
	wasm: ArrayBuffer;
}

interface ExecRequest extends BaseRequest {
	kind: "exec";
	sql: string;
	args?: any[];
}

interface SerializeRequest extends BaseRequest {
	kind: "serialize";
}

interface LoadRequest extends BaseRequest {
	kind: "load";
	data: ArrayBuffer;
}

interface BaseResponse {
	id: number;
}

interface ErrorResponse extends BaseResponse {
	kind: "error";
	error: string;
}

interface WasmResponse extends BaseResponse {
	kind: "wasm";
}

interface ExecResponse extends BaseResponse {
	kind: "exec";
	results: SQLResult[];
}

interface SerializeResponse extends BaseResponse {
	kind: "serialize";
	data: ArrayBuffer;
}

interface LoadResponse extends BaseResponse {
	kind: "load";
}

export type Request = WasmRequest | ExecRequest | SerializeRequest | LoadRequest;
export type Response = ErrorResponse | WasmResponse | ExecResponse | SerializeResponse | LoadResponse;

function reply(response: Response): void {
	postMessage(response);
}

let db: SQLiteDB | undefined;
let sqlite: SQLite | undefined;

console.log("worker started");

async function handle(req: Request): Promise<Response> {
	const { id, kind } = req;
	switch (kind) {
		case "wasm": {
			const { wasm } = req;
			const wasmModule = await WebAssembly.compile(wasm);
			sqlite = await SQLite.instantiate(wasmModule);
			db = sqlite.open(":memory:");
			return { id, kind };
		}
		case "exec": {
			const { sql } = req;
			if (db === undefined) {
				throw new Error("db was not initialized");
			}
			const results: SQLResult[] = [];
			db.prepare(sql, (stmt) => {
				stmt.bind(...(req.args || []));
				const columns: SQLColumn[] = [];
				const columnCount = stmt.columnCount();
				let rowCount = 0;
				let rows: (string | number | boolean | null)[][] = [];
				for (let i = 0; i < columnCount; i++) {
					columns.push({name: "unknown", type: "string"});
				}
				while (stmt.step()) {
					const row: (string | number | boolean | null)[] = [];
					for (let i = 0; i < columnCount; i++) {
						const name = stmt.columnName(i);
						const type = stmt.columnType(i);
						switch (type) {
							case SQLiteDatatypes.SQLITE_INTEGER:
							case SQLiteDatatypes.SQLITE_FLOAT:
								columns[i].type = "number";
								break;
							case SQLiteDatatypes.SQLITE_TEXT:
								columns[i].type = "string";
								break;
							case SQLiteDatatypes.SQLITE_BLOB:
								columns[i].type = "unknown";
								break;
							case SQLiteDatatypes.SQLITE_NULL:
								break;
						}
						columns[i].name = name;
						let value = stmt.columnValue(i);
						if (typeof value === "bigint") {
							value = Number(value).valueOf();
						}
						if (value instanceof ArrayBuffer) {
							value = null;
						}
						row.push(value);
					}
					rows.push(row);
					rowCount++;
				}
				results.push({
					statement: "",
					columns,
					rowCount,
					rows,
				});
			});
			return { id, kind, results };
		}
		case "serialize": {
			if (db === undefined) {
				throw new Error("db was not initialized");
			}
			const data = db.serialize();
			if (data === null) {
				throw new Error("serialization failed");
			}
			return { id, kind, data };
		}
		case "load": {
			if (sqlite === undefined) {
				throw new Error("sqlite was not initialized");
			}
			db?.close();
			db = sqlite.open(":memory:");
			const { data } = req;
			db.load(data);
			return { id, kind };
		}
	}
	throw new Error("not implemented");
}

async function main() {
	onmessage = async (e: MessageEvent) => {
		const req = e.data as Request;
		const { id } = req;
		try {
			reply(await handle(req));
		} catch (e) {
			if (e instanceof Error) {
				reply({ id, kind: "error", error: e.message });
			} else {
				reply({ id, kind: "error", error: "unknown error" });
			}
		}
	}
}

main();
