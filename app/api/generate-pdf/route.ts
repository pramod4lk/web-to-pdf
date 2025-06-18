import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import path from "path";

export const runtime = "nodejs";

function getFileNameFromUrl(url: string) {
  try {
    const u = new URL(url);
    let slug = u.pathname.split("/").filter(Boolean).pop() || "page";
    slug = slug.replace(/[^a-zA-Z0-9\-_]/g, "-");
    return `${slug || 'page'}.pdf`;
  } catch {
    return `webpage.pdf`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();
    const fileName = getFileNameFromUrl(url);
    // Convert to Buffer for Node.js compatibility
    const buffer = Buffer.from(pdfBuffer);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "X-Filename": fileName,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate PDF" }, { status: 500 });
  }
}
