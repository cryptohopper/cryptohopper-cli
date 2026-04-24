import pc from "picocolors";

import { fail, getClient } from "../api.js";

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
    for (const t of rows) {
      const id = String(t.id ?? "—");
      const name = (t.name as string | undefined) ?? "(unnamed)";
      const desc = (t.description as string | undefined) ?? "";
      console.log(`${pc.bold(id.padEnd(8))} ${name.padEnd(28)} ${pc.dim(desc)}`);
    }
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
  if (!opts.yes && !json) {
    console.error(
      pc.yellow(
        `Loading template ${templateId} into hopper ${hopperId} overwrites that hopper's config. ` +
          `Re-run with --yes to confirm.`,
      ),
    );
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
  if (!opts.yes && !json) {
    console.error(
      pc.yellow(
        `This will delete template ${templateId} permanently. Re-run with --yes to confirm.`,
      ),
    );
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
