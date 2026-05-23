type ApiResponse<T> = { data: T; error: { message: string } | null };

type AuthUser = {
	id: string;
	email: string;
	[key: string]: unknown;
};

type AuthSession = {
	user: AuthUser;
};

type AuthChangeEvent = "SIGNED_IN" | "SIGNED_OUT" | "USER_UPDATED";
type AuthChangeCallback = (event: AuthChangeEvent, session: AuthSession | null) => void;

const channelIntervals = new Map<string, number>();
const authCallbacks = new Set<AuthChangeCallback>();
let currentUser: AuthUser | null = null;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, {
		credentials: "include",
		headers: {
			"content-type": "application/json",
			...(init?.headers ?? {}),
		},
		...init,
	});

	const payload = await response.json();
	return payload as T;
}

function emitAuth(event: AuthChangeEvent, user: AuthUser | null) {
	const session = user ? { user } : null;
	for (const cb of authCallbacks) {
		cb(event, session);
	}
}

function normalizeStoragePublicUrl(bucket: string, filePath: string) {
	const encodedPath = filePath
		.split("/")
		.map((part) => encodeURIComponent(part))
		.join("/");

	return `/storage/v1/object/public/${bucket}/${encodedPath}`;
}

class QueryBuilder {
	private readonly table: string;
	private mode: "select" | "insert" | "update" | "delete" = "select";
	private selected = "*";
	private singleRow = false;
	private orderBy?: { column: string; ascending: boolean };
	private limitBy?: number;
	private eqFilters: Record<string, unknown> = {};
	private gteFilters: Record<string, unknown> = {};
	private lteFilters: Record<string, unknown> = {};
	private values: unknown = null;

	constructor(table: string) {
		this.table = table;
	}

	select(columns = "*") {
		this.mode = "select";
		this.selected = columns;
		return this;
	}

	insert(values: unknown) {
		this.mode = "insert";
		this.values = values;
		return this.execute();
	}

	update(values: unknown) {
		this.mode = "update";
		this.values = values;
		return this;
	}

	delete() {
		this.mode = "delete";
		return this;
	}

	eq(column: string, value: unknown) {
		this.eqFilters[column] = value;
		return this;
	}

	gte(column: string, value: unknown) {
		this.gteFilters[column] = value;
		return this;
	}

	lte(column: string, value: unknown) {
		this.lteFilters[column] = value;
		return this;
	}

	order(column: string, options?: { ascending?: boolean }) {
		this.orderBy = { column, ascending: options?.ascending ?? true };
		return this;
	}

	limit(value: number) {
		this.limitBy = value;
		return this;
	}

	single() {
		this.singleRow = true;
		return this;
	}

	maybeSingle() {
		this.singleRow = true;
		return this;
	}

	then<TResult1 = unknown, TResult2 = never>(
		onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
		onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
	) {
		return this.execute().then(onfulfilled, onrejected);
	}

	private async executeSelect() {
		const search = new URLSearchParams();
		search.set("select", this.selected);

		if (this.orderBy) {
			search.set("orderBy", this.orderBy.column);
			search.set("ascending", String(this.orderBy.ascending));
		}

		if (this.limitBy) {
			search.set("limit", String(this.limitBy));
		}

		if (this.singleRow) {
			search.set("single", "true");
		}

		for (const [key, value] of Object.entries(this.eqFilters)) {
			search.set(`eq.${key}`, String(value));
		}

		for (const [key, value] of Object.entries(this.gteFilters)) {
			search.set(`gte.${key}`, String(value));
		}

		for (const [key, value] of Object.entries(this.lteFilters)) {
			search.set(`lte.${key}`, String(value));
		}

		return fetchJson<ApiResponse<any>>(`/api/db/${this.table}?${search.toString()}`);
	}

	private async executeInsert() {
		return fetchJson<ApiResponse<any>>(`/api/db/${this.table}`, {
			method: "POST",
			body: JSON.stringify({ values: this.values }),
		});
	}

	private async executeUpdate() {
		return fetchJson<ApiResponse<any>>(`/api/db/${this.table}`, {
			method: "PATCH",
			body: JSON.stringify({ updates: this.values, eq: this.eqFilters }),
		});
	}

	private async executeDelete() {
		return fetchJson<ApiResponse<any>>(`/api/db/${this.table}`, {
			method: "DELETE",
			body: JSON.stringify({ eq: this.eqFilters }),
		});
	}

	private async execute() {
		if (this.mode === "insert") return this.executeInsert();
		if (this.mode === "update") return this.executeUpdate();
		if (this.mode === "delete") return this.executeDelete();
		return this.executeSelect();
	}
}

class LocalChannel {
	private readonly name: string;
	private readonly handlers: Array<() => void> = [];

	constructor(name: string) {
		this.name = name;
	}

	on(
		_type: string,
		filter: { event?: string; schema?: string; table?: string; filter?: string },
		callback: (payload: any) => void
	) {
		const eventName = filter?.event ? `channel:${this.name}:${filter.event}` : `channel:${this.name}`;
		const listener = (event: Event) => callback((event as CustomEvent).detail ?? {});

		window.addEventListener(eventName, listener as EventListener);
		this.handlers.push(() => window.removeEventListener(eventName, listener as EventListener));
		return this;
	}

	subscribe() {
		const key = this.name;
		if (!channelIntervals.has(key)) {
			const intervalId = window.setInterval(() => {
				const event = new CustomEvent(`channel:${this.name}`, { detail: {} });
				window.dispatchEvent(event);
			}, 15000);
			channelIntervals.set(key, intervalId);
		}
		return this;
	}

	async send(payload: { type?: string; event: string; payload?: any }) {
		const event = new CustomEvent(`channel:${this.name}:${payload.event}`, {
			detail: { payload: payload.payload ?? {} },
		});
		window.dispatchEvent(event);
		return { data: { sent: true }, error: null };
	}

	unsubscribe() {
		for (const cleanup of this.handlers) {
			cleanup();
		}
		this.handlers.length = 0;

		const id = channelIntervals.get(this.name);
		if (id) {
			window.clearInterval(id);
			channelIntervals.delete(this.name);
		}
	}
}

export const supabase = {
	auth: {
		async getUser() {
			const response = await fetchJson<ApiResponse<{ user: AuthUser | null }>>("/api/auth/me", {
				method: "GET",
			});

			currentUser = response.data?.user ?? null;
			return { data: { user: currentUser }, error: response.error };
		},

		async signInWithPassword({ email, password }: { email: string; password: string }) {
			const response = await fetchJson<ApiResponse<{ user: AuthUser }>>("/api/auth/login", {
				method: "POST",
				body: JSON.stringify({ email, password }),
			});

			if (!response.error && response.data?.user) {
				currentUser = response.data.user;
				emitAuth("SIGNED_IN", currentUser);
			}

			return response;
		},

		async signUp({
			email,
			password,
			options,
		}: {
			email: string;
			password: string;
			options?: { data?: Record<string, unknown> };
		}) {
			const response = await fetchJson<ApiResponse<{ user: AuthUser }>>("/api/auth/register", {
				method: "POST",
				body: JSON.stringify({
					email,
					password,
					metadata: options?.data ?? {},
				}),
			});

			if (!response.error && response.data?.user) {
				currentUser = response.data.user;
				emitAuth("SIGNED_IN", currentUser);
			}

			return response;
		},

		async signOut() {
			const response = await fetchJson<ApiResponse<{ success: boolean }>>("/api/auth/logout", {
				method: "POST",
			});
			currentUser = null;
			emitAuth("SIGNED_OUT", null);
			return response;
		},

		async updateUser({ password }: { password: string }) {
			const response = await fetchJson<ApiResponse<{ success: boolean }>>("/api/auth/update-password", {
				method: "PATCH",
				body: JSON.stringify({ password }),
			});

			if (!response.error) {
				emitAuth("USER_UPDATED", currentUser);
			}

			return response;
		},

		onAuthStateChange(callback: AuthChangeCallback) {
			authCallbacks.add(callback);

			if (currentUser) {
				callback("SIGNED_IN", { user: currentUser });
			}

			return {
				data: {
					subscription: {
						unsubscribe() {
							authCallbacks.delete(callback);
						},
					},
				},
			};
		},
	},

	from(table: string) {
		return new QueryBuilder(table);
	},

	storage: {
		from(bucket: string) {
			return {
				async upload(filePath: string, file: File, options?: { upsert?: boolean }) {
					const form = new FormData();
					form.append("bucket", bucket);
					form.append("path", filePath);
					form.append("upsert", options?.upsert ? "true" : "false");
					form.append("file", file);

					const response = await fetch("/api/storage/upload", {
						method: "POST",
						body: form,
						credentials: "include",
					});

					return (await response.json()) as ApiResponse<{ path: string }>;
				},

				getPublicUrl(filePath: string) {
					return {
						data: {
							publicUrl: normalizeStoragePublicUrl(bucket, filePath),
						},
					};
				},

				async remove(paths: string[]) {
					return fetchJson<ApiResponse<{ success: boolean }>>("/api/storage/remove", {
						method: "POST",
						body: JSON.stringify({ bucket, paths }),
					});
				},
			};
		},
	},

	channel(name: string) {
		return new LocalChannel(name);
	},

	removeChannel(channel: { unsubscribe: () => void }) {
		channel.unsubscribe();
	},
};