/**
 * Phase 04 + 08 smoke — writes results/asset-cutover/smoke-report.json
 * Usage (repo root): node scripts/asset-cutover-smoke.mjs
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import sharp from "sharp";

dotenv.config({ path: ".env.local" });

const OUT = path.resolve("results/asset-cutover/smoke-report.json");
const BUCKET = process.env.R2_NEW_BUCKET || "oando-assets-clean-20260805";
const DEV_BASE = "http://localhost:3000";
const WORKER_BASE = (
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  "https://oando-worker-proxy.mayoite.workers.dev"
)
  .trim()
  .replace(/\/+$/, "");

function r2Client() {
  const endpoint =
    process.env.CLOUDFLARE_S3_URL?.trim() ||
    process.env.CLOULDFLARE_S3_URL?.trim() ||
    (process.env.CLOUDFLARE_ACCOUNT_ID
      ? `https://${process.env.CLOUDFLARE_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com`
      : "");
  const accessKeyId =
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() ||
    process.env.CLOUDFLARE_ACCESS_KEY_ID?.trim();
  const secretAccessKey =
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() ||
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY?.trim();
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials missing in .env.local");
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

async function sampleKeys(client, max = 6) {
  const samples = [];
  const prefixes = [
    "marketing/hero/slides/",
    "marketing/brand/logos/",
    "catalog/flagship/",
    "catalog/seating/",
  ];
  for (const prefix of prefixes) {
    const out = await client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, MaxKeys: 20 }),
    );
    for (const obj of out.Contents || []) {
      if (!obj.Key || obj.Key.endsWith("/")) continue;
      if (/\.(webp|jpg|jpeg|png)$/i.test(obj.Key)) {
        samples.push(obj.Key);
        break;
      }
    }
    if (samples.length >= max) break;
  }
  return samples;
}

async function decodeBuffer(buf) {
  const meta = await sharp(buf).metadata();
  return { format: meta.format, width: meta.width, height: meta.height };
}

async function fetchUrl(url) {
  const res = await fetch(url, { redirect: "follow" });
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, bytes: buf.length, buf };
}

async function contactApiSmoke() {
  const payload = {
    name: "Cutover smoke",
    message: `Asset cutover phase 08 API smoke ${new Date().toISOString()}`,
    email: "cutover-smoke@example.com",
    source: "asset-cutover-smoke",
  };
  const res = await fetch(`${DEV_BASE}/api/customer-queries/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: DEV_BASE,
    },
    body: JSON.stringify(payload),
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = { parseError: true };
  }
  return {
    url: `${DEV_BASE}/api/customer-queries/`,
    status: res.status,
    ok: res.ok,
    body,
  };
}

async function main() {
  const report = {
    at: new Date().toISOString(),
    bucket: BUCKET,
    phase04: { pass: false, checks: [] },
    phase08: { pass: false, contact: null, devUp: false },
  };

  try {
    await fetch(DEV_BASE, { method: "GET" });
    report.phase08.devUp = true;
  } catch {
    report.phase08.devUp = false;
    report.phase08.contact = { error: "dev server not reachable at localhost:3000" };
  }

  if (report.phase08.devUp) {
    report.phase08.contact = await contactApiSmoke();
    report.phase08.pass =
      report.phase08.contact.status === 201 &&
      report.phase08.contact.body?.success === true &&
      typeof report.phase08.contact.body?.queryId === "string";
  }

  const client = r2Client();
  try {
    await client.send(new HeadBucketCommand({ Bucket: BUCKET }));
    report.phase04.bucketHead = "ok";
  } catch (e) {
    report.phase04.bucketHead = e.message || String(e);
    report.phase04.checks.push({ step: "headBucket", pass: false, error: report.phase04.bucketHead });
  }

  if (report.phase04.bucketHead === "ok") {
    const keys = await sampleKeys(client);
    report.phase04.sampleKeys = keys;

    for (const key of keys) {
      const assetPath = `/assets/${key}`;
      const check = { key, assetPath, s3Head: null, worker: null, pass: false };

      try {
        const head = await client.send(
          new HeadObjectCommand({ Bucket: BUCKET, Key: key }),
        );
        check.s3Head = { ok: true, size: head.ContentLength, type: head.ContentType };
      } catch (e) {
        check.s3Head = { ok: false, error: e.message || String(e) };
      }

      try {
        const got = await client.send(
          new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        );
        const chunks = [];
        for await (const chunk of got.Body) {
          chunks.push(Buffer.from(chunk));
        }
        const buf = Buffer.concat(chunks);
        check.s3Get = { ok: true, bytes: buf.length };
        check.decode = await decodeBuffer(buf);
        check.sha256 = createHash("sha256").update(buf).digest("hex").slice(0, 16);
      } catch (e) {
        check.s3Get = { ok: false, error: e.message || String(e) };
      }

      try {
        const workerUrl = `${WORKER_BASE}${assetPath}`;
        const fetched = await fetchUrl(workerUrl);
        check.worker = { url: workerUrl, status: fetched.status, bytes: fetched.bytes };
      } catch (e) {
        check.worker = { error: e.message || String(e) };
      }

      // Phase-04 bar: object exists in clean bucket and decodes. Worker may lag (F1).
      check.pass =
        check.s3Head?.ok === true &&
        check.s3Get?.ok === true &&
        Boolean(check.decode?.format);

      report.phase04.checks.push(check);
    }

    report.phase04.pass =
      report.phase04.checks.length > 0 && report.phase04.checks.every((c) => c.pass);
  }

  report.overall =
    report.phase04.pass && report.phase08.pass
      ? "pass"
      : report.phase04.pass && !report.phase08.devUp
        ? "phase04-only-dev-down"
        : "fail";

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(report, null, 2));
  console.log("WROTE", OUT);
  console.log(JSON.stringify({ overall: report.overall, phase04: report.phase04.pass, phase08: report.phase08.pass }, null, 2));
  process.exit(report.overall === "pass" ? 0 : 1);
}

main().catch(async (e) => {
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(
    OUT,
    JSON.stringify({ at: new Date().toISOString(), fatal: e.message || String(e) }, null, 2),
  );
  console.error(e);
  process.exit(1);
});
