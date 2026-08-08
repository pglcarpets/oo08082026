import fs from "fs/promises";
import path from "path";
import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";

const ALLOWED_PREFIX = "lighthouse-report-";
const ALLOWED_EXT = [".html", ".json"];

function isAllowedFileName(name: string) {
    if (!name.startsWith(ALLOWED_PREFIX)) {return false;}
    if (name.includes("..") || name.includes("/") || name.includes("\\")) {return false;}
    return ALLOWED_EXT.some((ext) => name.endsWith(ext));
}

export async function GET(req: Request) {
    const rateError = await enforcePublicApiRateLimit(req, "dev-tools:lighthouse:get", 10, 60 * 1000);
    if (rateError) {return rateError;}

    // Prevent exposing dev artifacts in production
    if (process.env.NODE_ENV === "production") {
        return new Response("Not available", {status: 404});
    }

    const url = new URL(req.url);
    const file = url.searchParams.get("file");
    const tmpDir = path.join(process.cwd(), "tmp");

    try {
        await fs.access(tmpDir);
    } catch {
        return new Response(JSON.stringify([]), {status: 200, headers: {"Content-Type": "application/json"}});
    }

    if (file) {
        if (!isAllowedFileName(file)) {
            return new Response(JSON.stringify({error: "invalid file"}), {
                status: 400,
                headers: {"Content-Type": "application/json"}
            });
        }

        const filePath = path.join(tmpDir, file);
        try {
            const content = await fs.readFile(filePath, "utf8");
            if (file.endsWith(".html")) {
                return new Response(content, {status: 200, headers: {"Content-Type": "text/html; charset=utf-8"}});
            }
            return new Response(JSON.stringify({content}), {headers: {"Content-Type": "application/json"}});
        } catch {
            return new Response("Not found", {status: 404});
        }
    }

    const files = await fs.readdir(tmpDir);
    const reports = await Promise.all(
        files
            .filter((f) => isAllowedFileName(f))
            .map(async (f) => {
                const st = await fs.stat(path.join(tmpDir, f));
                return {name: f, mtime: st.mtime.toISOString(), size: st.size};
            }),
    );

    return new Response(JSON.stringify(reports.sort((a, b) => b.mtime.localeCompare(a.mtime))), {
        headers: {"Content-Type": "application/json"},
    });
}
