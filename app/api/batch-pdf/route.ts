import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import puppeteer from "puppeteer";
import path from "path";

export const runtime = "nodejs";

function getFileNameFromUrl(url: string, index: number) {
  try {
    const u = new URL(url);
    let slug = u.pathname.split("/").filter(Boolean).pop() || "page";
    slug = slug.replace(/[^a-zA-Z0-9\-_]/g, "-");
    return `${slug || 'page'}-${index + 1}.pdf`;
  } catch {
    return `webpage-${index + 1}.pdf`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json();
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
    }
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const zip = new JSZip();
    const results: { url: string; status: string; pdfName?: string; error?: string }[] = [];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        const pdfBuffer = await page.pdf({ format: "A4" });
        const pdfName = getFileNameFromUrl(url, i);
        zip.file(pdfName, pdfBuffer);
        results.push({ url, status: "done", pdfName });
        await page.close();
      } catch (err: any) {
        results.push({ url, status: "error", error: err.message });
      }
    }
    await browser.close();
    const zipBuffer = await zip.generateAsync({ type: "uint8array" });
    return new NextResponse(Buffer.from(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=webpages.zip`,
        "X-Results": encodeURIComponent(JSON.stringify(results)),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate ZIP" }, { status: 500 });
  }
}
