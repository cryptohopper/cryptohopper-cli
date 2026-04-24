import pc from "picocolors";

import { fail, getClient } from "../api.js";

export interface WhoamiOptions {
  json?: boolean;
}

export async function whoamiCommand(opts: WhoamiOptions): Promise<void> {
  const json = opts.json ?? false;
  const { client, apiUrl } = await getClient({ requireAuth: true });

  try {
    const me = (await client.user.get()) as Record<string, unknown>;
    if (json) {
      console.log(JSON.stringify({ ok: true, user: me, apiUrl }));
    } else {
      const who =
        (me["email"] as string | undefined) ??
        (me["username"] as string | undefined) ??
        String(me["id"] ?? "user");
      console.log(`${pc.dim("User: ")}${pc.bold(who)}`);
      if (me["username"]) console.log(`${pc.dim("Name: ")}${me["username"]}`);
      console.log(`${pc.dim("API:  ")}${apiUrl}`);
    }
  } catch (err) {
    return fail(err, json);
  }
}
