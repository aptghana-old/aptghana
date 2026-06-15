/**
 * Odoo JSON-RPC client.
 * The website never calls Odoo directly — all data goes through this layer,
 * which owns the translation between Odoo models and APT domain types.
 */

interface OdooRpcResult {
  result?: unknown;
  error?: { message: string; data?: unknown };
}

export class OdooClient {
  private uid: number | null = null;

  private get config() {
    return {
      url: process.env.ODOO_URL ?? "",
      db: process.env.ODOO_DB ?? "",
      username: process.env.ODOO_USERNAME ?? "",
      password: process.env.ODOO_PASSWORD ?? "",
    };
  }

  private async rpc(endpoint: string, params: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${this.config.url}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "call", id: 1, params }),
      cache: "no-store",
    });

    const data = (await response.json()) as OdooRpcResult;
    if (data.error) throw new Error(`Odoo RPC error: ${data.error.message}`);
    return data.result;
  }

  async authenticate(): Promise<number> {
    if (this.uid) return this.uid;
    const { db, username, password } = this.config;
    const uid = await this.rpc("/web/session/authenticate", {
      db,
      login: username,
      password,
    });
    this.uid = uid as number;
    return this.uid;
  }

  async searchRead<T>(
    model: string,
    domain: unknown[],
    fields: string[],
    options: { limit?: number; offset?: number; order?: string } = {}
  ): Promise<T[]> {
    await this.authenticate();
    return this.rpc("/web/dataset/call_kw", {
      model,
      method: "search_read",
      args: [domain, fields],
      kwargs: {
        limit: options.limit ?? 100,
        offset: options.offset ?? 0,
        order: options.order,
      },
    }) as Promise<T[]>;
  }

  async create(model: string, values: Record<string, unknown>): Promise<number> {
    await this.authenticate();
    return this.rpc("/web/dataset/call_kw", {
      model,
      method: "create",
      args: [values],
      kwargs: {},
    }) as Promise<number>;
  }

  async write(model: string, ids: number[], values: Record<string, unknown>): Promise<boolean> {
    await this.authenticate();
    return this.rpc("/web/dataset/call_kw", {
      model,
      method: "write",
      args: [ids, values],
      kwargs: {},
    }) as Promise<boolean>;
  }
}

let _odooClient: OdooClient | null = null;

export function getOdooClient(): OdooClient {
  if (!_odooClient) _odooClient = new OdooClient();
  return _odooClient;
}
