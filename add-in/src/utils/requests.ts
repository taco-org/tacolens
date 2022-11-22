export class Requests {
  private static async extract<T, R>(res: Response, cb?: (data: T) => Promise<R>) {
    const data = await res.json();
    return cb == null ? (data as R) : await cb(data);
  }

  public static async get<T, R>(url: string, opts: RequestInit = {}, cb?: (data: T) => Promise<R>) {
    const res = await fetch(url, {
      ...opts,
      method: "GET",
      mode: "cors",
    });
    return await this.extract(res, cb);
  }

  public static async post<T, R>(url: string, opts: RequestInit = {}, cb?: (data: T) => Promise<R>) {
    const res = await fetch(url, {
      ...opts,
      method: "POST",
      mode: "cors",
    });
    return await this.extract(res, cb);
  }
}
