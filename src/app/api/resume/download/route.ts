import { formatTailwindHTML } from "@/lib/utils";

import puppeteer from "puppeteer";
import { chromium as playwright} from "playwright-core";
import chromium from "@sparticuz/chromium";

export const dynamic = 'force-dynamic'

export const POST = async (request: Request) => {
  try {
    const body = await request.json();

    const { html, structure } = body;

    if (!html || !structure) return Response.json(
      { message: "Parâmetros inválidos" },
      { status: 400 }
    );

    let browser = null, page = null, context = null;

    if (process.env.NODE_ENV === "development") {
      browser = await puppeteer.launch();
      page = await browser.newPage();
    } else {
      browser = await playwright.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
      });

      context = await browser.newContext()
      page = await context.newPage();
    }

    await page.setContent(formatTailwindHTML(html, structure));

    // @ts-expect-error
    const bodyHeight = await page.evaluate(() => {
      return document.body.scrollHeight + 20;
    });

    const pdf = await page.pdf({
      width: "210mm",
      height: `${bodyHeight}px`,
      printBackground: true,
    });

    if (process.env.NODE_ENV === "development") {
      await browser.close();
    }
    else {
      await context?.close();
      await browser.close();
    }

    return new Response(pdf, {
      headers: {
        "Content-type": "application/pdf",
      }
    })
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Ocorreu um erro inesperado", error },
      { status: 500 }
    )
  }
}