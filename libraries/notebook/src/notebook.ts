import { SQLExecutor } from "./sql";
import { Cell } from "./cell";

export interface Notebook {
	sqlExecutor: SQLExecutor;

	getCellIds(): Promise<string[]>;
	getCell(id: string): Promise<Cell>;
	deleteCell(id: string): Promise<void>;
	updateCell(id: string, cell: Cell): Promise<void>;
	addCell(cell: Cell, index?: number): Promise<string>;
	moveCell(id: string, index: number): Promise<void>;
	addListener(callback: (id?: string) => void): void;
	removeListener(callback: () => void): void;

	reload(): Promise<void>;
	load(b: Blob): Promise<void>;
}

const initSQL = `
	CREATE TABLE IF NOT EXISTS sqlnb_cell (
		id TEXT NOT NULL PRIMARY KEY,
		seq FLOAT,
		locked BOOLEAN DEFAULT 0,
		data TEXT
	);
`;

export class SQLiteNotebook implements Notebook {
	private listeners: Set<(id?: string) => void>;
	private init: Promise<void>;

	constructor(public readonly sqlExecutor: SQLExecutor) {
		this.listeners = new Set();
		this.init = (async () => {
			await this.sqlExecutor.execute(initSQL);
		})();
	}

	async getCellIds(): Promise<string[]> {
		await this.init;
		const results = await this.sqlExecutor.execute("SELECT id FROM sqlnb_cell ORDER BY seq");
		if (results.length !== 1) {
			throw new Error("Unexpected result");
		}
		return results[0].rows.map((row) => row[0] as string);
	}

	async getCell(id: string): Promise<Cell> {
		await this.init;
		const results = await this.sqlExecutor.execute("SELECT seq, data FROM sqlnb_cell WHERE id = ?", [id]);
		if (results.length !== 1) {
			throw new Error("Unexpected result");
		}
		const row = results[0].rows[0];
		const index = row[0] as number;
		const data = row[1] as string;
		const json = JSON.parse(data);
		return { id, index, ...json };
	}

	async deleteCell(id: string): Promise<void> {
		await this.init;
		await this.sqlExecutor.execute("DELETE FROM sqlnb_cell WHERE id = ?", [id]);
		this.listeners.forEach((listener) => listener());
	}

	async updateCell(id: string, cell: Cell): Promise<void> {
		await this.init;
		const data = JSON.stringify(cell);
		await this.sqlExecutor.execute("UPDATE sqlnb_cell SET data = ? WHERE id = ?", data, [id]);
		this.listeners.forEach((listener) => listener(id));
	}

	async addCell(cell: Cell, index?: number): Promise<string> {
		const id = crypto.randomUUID();
		await this.init;
		const data = JSON.stringify(cell);
		await this.sqlExecutor.execute("INSERT INTO sqlnb_cell (id, data, seq) VALUES (?, ?, (SELECT COALESCE((SELECT MAX(seq) FROM sqlnb_cell), 0) + 1));", id, data);
		if (index !== undefined) {
			await this.moveCell(id, index);
		}
		this.listeners.forEach((listener) => listener());
		return id;
	}

	async moveCell(id: string, to: number): Promise<void> {
		await this.init;
		to = to | 0;
		if (to <= 0) {
			// move to first
			const first = await this.sqlExecutor.execute("SELECT seq FROM sqlnb_cell ORDER BY seq LIMIT 1");
			if (first.length === 0) {
				return;
			}
			const firstSeq = first[0].rows[0][0] as number;
			await this.sqlExecutor.execute("UPDATE sqlnb_cell SET seq = ? WHERE id = ?", [firstSeq - 1, id]);
			return;
		}
		const seqs = await this.sqlExecutor.execute("SELECT seq FROM sqlnb_cell ORDER BY seq LIMIT 2 OFFSET ?", [to - 1]);
		if (seqs.length !== 2) {
			// move to last
			const last = await this.sqlExecutor.execute("SELECT seq FROM sqlnb_cell ORDER BY seq DESC LIMIT 1");
			if (last.length === 0) {
				return;
			}
			const lastSeq = last[0].rows[0][0] as number;
			await this.sqlExecutor.execute("UPDATE sqlnb_cell SET seq = ? WHERE id = ?", [lastSeq + 1, id]);
			return;
		}
		const [prev, next] = seqs[0].rows.map((row) => row[0] as number);
		await this.sqlExecutor.execute("UPDATE sqlnb_cell SET seq = ? WHERE id = ?", [(prev + next) / 2, id]);
	}

	addListener(callback: () => void): void {
		this.listeners.add(callback);
		console.log("Added listener", this.listeners.size);
	}

	removeListener(callback: () => void): void {
		this.listeners.delete(callback);
	}

	async reload(): Promise<void> {
		await this.init;
		await this.sqlExecutor.execute(initSQL);
		this.listeners.forEach((listener) => listener());
	}

	async load(b: Blob): Promise<void> {
		await this.init;
		if (this.sqlExecutor.load === undefined) {
			throw new Error("SQLite load not implemented");
		}
		const reader = new FileReader();
		const promise = new Promise<ArrayBuffer>((resolve, reject) => {
			reader.onload = async () => {
				const ab = reader.result as ArrayBuffer;
				resolve(ab);
			};
			reader.onerror = reject;
		});
		reader.readAsArrayBuffer(b);
		const ab = await promise;
		await this.sqlExecutor.load(ab);
		await this.sqlExecutor.execute(initSQL);
	}
}

