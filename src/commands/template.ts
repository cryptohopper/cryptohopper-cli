import pc from "picocolors";

import { fail, getClient } from "../api.js";
import { fmt, printTable } from "../ui/table.js";

interface CommonOpts {
  json?: boolean;
}

export async function templateListCommand(opts: CommonOpts): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const rows = await client.template.list();
    if (json) {
      console.log(JSON.stringify({ ok: true, templates: rows }));
      return;
    }
    if (rows.length === 0) {
      console.log(pc.dim("No templates."));
      return;
    }
    printTable(
      ["ID", "Name", "Description"],
      rows.map((t) => [
        fmt(t.id),
        (t.name as string | undefined) ?? "(unnamed)",
        fmt(t.description),
      ]),
    );
  } catch (err) {
    return fail(err, json);
  }
}

export async function templateGetCommand(
  templateId: string,
  opts: CommonOpts,
): Promise<void> {
  const json = opts.json ?? false;
  const { client } = await getClient({ requireAuth: true });
  try {
    const t = await client.template.get(templateId);
    if (json) {
      console.log(JSON.stringify({ ok: true, template: t }));
    } else {
      console.log(JSON.stringify(t, null, 2));
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function templateLoadCommand(
  templateId: string,
  hopperId: string,
  opts: CommonOpts & { yes?: boolean },
): Promise<void> {
  const json = opts.json ?? false;
  if (!opts.yes) {
    const msg =
      `Loading template ${templateId} into hopper ${hopperId} overwrites that hopper's config. ` +
      `Re-run with --yes to confirm.`;
    if (json) {
      console.error(
        JSON.stringify({
          ok: false,
          error: { code: "CONFIRMATION_REQUIRED", message: msg },
        }),
      );
    } else {
      console.error(pc.yellow(msg));
    }
    process.exit(1);
  }
  const { client } = await getClient({ requireAuth: true });
  try {
    await client.template.load(templateId, hopperId);
    if (json) {
      console.log(JSON.stringify({ ok: true, templateId, hopperId }));
    } else {
      console.log(
        pc.green(
          `✓ Loaded template ${pc.bold(templateId)} into hopper ${pc.bold(hopperId)}`,
        ),
      );
    }
  } catch (err) {
    return fail(err, json);
  }
}

export async function templateDeleteCommand(
  templateId: string,
  opts: CommonOpts & { yes?: boolean },
): Promise<void> {
  const json = opts.json ?? false;
  if (!opts.yes) {
    const msg = `This will delete template ${templateId} permanently. Re-run with --yes to confirm.`;
    if (json) {
      console.error(
        JSON.stringify({
          ok: false,
          error: { code: "CONFIRMATION_REQUIRED", message: msg },
        }),
      );
    } else {
      console.error(pc.yellow(msg));
    }
    process.exit(1);
  }
  const { client } = await getClient({ requireAuth: true });
  try {
    await client.template.delete(templateId);
    if (json) {
      console.log(JSON.stringify({ ok: true, templateId }));
    } else {
      console.log(pc.green(`✓ Deleted template ${templateId}`));
    }
  } catch (err) {
    return fail(err, json);
  }
}
