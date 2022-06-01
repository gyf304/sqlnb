import { Mutex } from "async-mutex";

import type { Request as WorkerRequest, Response as WorkerResponse } from "../workers/sqlite";
import { SQLExecutor, SQLResult } from "./types";

import wasm from "@yifangu/sqlite/dist/wasm/sqlite3.wasm";

export class SQLiteWorkerExecutor implements SQLExecutor {
	private id = 0;

	private worker: Worker;
	private init: Promise<void>;

	private requests: Map<number, Promise<WorkerResponse>>;
	private resolvers: Map<number, {resolve: (res: WorkerResponse) => void; reject: (err: Error) => void}>;

	private mutex: Mutex;

	constructor() {
		const worker = new Worker("workers/sqlite.js");
		this.worker = worker;
		this.requests = new Map();
		this.resolvers = new Map();
		this.mutex = new Mutex();

		worker.addEventListener("message", (ev) => this.onMessage(ev));
		this.init = (async () => {
			const wasmAb = await fetch(wasm).then((res) => res.arrayBuffer());
			const request: WorkerRequest = { id: 0, kind: "wasm", wasm: wasmAb };
			await this.call(request);
		})();
	}

	private onMessage(event: MessageEvent): void {
		const { data } = event;
		const { id } = data;
		const res = this.resolvers.get(id);
		if (res === undefined) {
			throw new Error("unknown id");
		}
		this.resolvers.delete(id);
		res.resolve(data);
	}

	private async call(req: Omit<WorkerRequest, "id">): Promise<WorkerResponse> {
		return await this.mutex.runExclusive(async () => {
			const id = this.id;
			this.requests.set(id, new Promise((resolve, reject) => {
				this.resolvers.set(id, { resolve, reject });
			}));
			this.worker.postMessage({ ...req, id });
			this.id = id + 1;
			const result = await this.requests.get(id)!;
			this.requests.delete(id);
			if (result.kind === "error") {
				throw new Error(result.error);
			}
			return result;
		});
	}

	async execute(sql: string, ...args: any[]): Promise<SQLResult[]> {
		await this.init;
		const request: WorkerRequest = { id: 0, kind: "exec", sql, args };
		const resp = await this.call(request);
		if (resp.kind !== "exec") {
			throw new Error("unexpected response");
		}
		return resp.results;
	}

	async save(): Promise<ArrayBuffer> {
		await this.init;
		const request: WorkerRequest = { id: 0, kind: "serialize" };
		const resp = await this.call(request);
		if (resp.kind !== "serialize") {
			throw new Error("unexpected response");
		}
		return resp.data;
	}

	async load(data: ArrayBuffer): Promise<void> {
		await this.init;
		const request: WorkerRequest = { id: 0, kind: "load", data };
		const resp = await this.call(request);
		if (resp.kind !== "load") {
			throw new Error("unexpected response");
		}
	}
}
