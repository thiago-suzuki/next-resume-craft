import { formatTailwindHTML } from "@/lib/utils";

import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { html, structure } = body;

    if (!html || !structure) {
      return Response.json({ message: "Parâmetros inválidos" }, { status: 400 });
    }

    const isDev = process.env.NODE_ENV === "development";

    const browser = await (isDev
      ? puppeteer.launch({ headless: true }) // usa Chromium local
      : puppeteerCore.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        }));

    const page = await browser.newPage();
    await page.setContent(formatTailwindHTML(html, structure), {
      waitUntil: "networkidle0",
    });

    const bodyHeight = await page.evaluate(() => document.body.scrollHeight + 20);

    const pdf = await page.pdf({
      width: "210mm",
      height: `${bodyHeight}px`,
      printBackground: true,
    });

    await browser.close();

    return new Response(pdf, {
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return Response.json(
      { message: "Erro ao gerar PDF", error: String(error) },
      { status: 500 }
    );
  }
};
