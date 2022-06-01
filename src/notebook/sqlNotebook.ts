import { SQLExecutor } from "../sql/types";
import type { Cell, Notebook } from "./types";

import initSQL from "./init.sql";

export class SQLNotebook implements Notebook {
	private listeners: Set<(id?: string) => void>;
	private init: Promise<void>;

	constructor(private executor: SQLExecutor) {
		this.listeners = new Set();
		this.init = (async () => {
			await this.executor.execute(initSQL);
		})();
	}

	async getCellIds(): Promise<string[]> {
		await this.init;
		const results = await this.executor.execute("SELECT id FROM sqlnb_cell ORDER BY seq");
		if (results.length !== 1) {
			throw new Error("Unexpected result");
		}
		return results[0].rows.map((row) => row[0] as string);
	}

	async getCell(id: string): Promise<Cell> {
		await this.init;
		const results = await this.executor.execute("SELECT seq, data FROM sqlnb_cell WHERE id = ?", id);
		if (results.length !== 1) {
			throw new Error("Unexpected result");
		}
		const row = results[0].rows[0];
		const index = row[0] as number;
		const data = row[1] as string;
		console.log("DATA", data);
		const json = JSON.parse(data);
		return { id, index, ...json };
	}

	async deleteCell(id: string): Promise<void> {
		await this.init;
		await this.executor.execute("DELETE FROM sqlnb_cell WHERE id = ?", id);
		this.listeners.forEach((listener) => listener());
	}

	async updateCell(id: string, cell: Cell): Promise<void> {
		await this.init;
		const data = JSON.stringify(cell);
		await this.executor.execute("UPDATE sqlnb_cell SET data = ? WHERE id = ?", data, id);
		this.listeners.forEach((listener) => listener(id));
	}

	async addCell(cell: Cell): Promise<string> {
		const id = crypto.randomUUID();
		await this.init;
		const data = JSON.stringify(cell);
		await this.executor.execute("INSERT INTO sqlnb_cell (id, data, seq) VALUES (?, ?, (SELECT COALESCE((SELECT MAX(seq) FROM sqlnb_cell), 0) + 1));", id, data);
		this.listeners.forEach((listener) => listener());
		return id;
	}

	async moveCell(id: string, index: number): Promise<void> {
		await this.init;
		throw new Error("Not implemented");
	}

	addListener(callback: () => void): void {
		this.listeners.add(callback);
	}

	removeListener(callback: () => void): void {
		this.listeners.delete(callback);
	}

	async reload(): Promise<void> {
		await this.init;
		await this.executor.execute(initSQL);
		this.listeners.forEach((listener) => listener());
	}
}
