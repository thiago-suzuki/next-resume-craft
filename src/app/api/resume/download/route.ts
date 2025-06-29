import { formatTailwindHTML } from "@/lib/utils";
import type { NextRequest } from "next/server";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { html, structure } = body;

    if (!html || !structure) {
      return new Response(
        JSON.stringify({ message: "Parâmetros inválidos" }),
        { status: 400 }
      );
    }

    const isDev = process.env.NODE_ENV === "development";

    const puppeteerModule = isDev
      ? await import("puppeteer")
      : await import("puppeteer-core");

    const chromium = !isDev ? await import("@sparticuz/chromium") : null;

    const browser = await puppeteerModule.default.launch(
      isDev
        ? { headless: true }
        : {
            args: chromium!.default.args,
            defaultViewport: chromium!.default.defaultViewport,
            executablePath: await chromium!.default.executablePath(),
            headless: chromium!.default.headless,
          }
    );

    const page = await browser.newPage();

    await page.setContent(formatTailwindHTML(html, structure), {
      waitUntil: "networkidle0",
    });

    // ✅ Aqui fazemos o cast direto para any para evitar conflitos de tipo
    const bodyHeight = await (page as any).evaluate(() => {
      return document.body.scrollHeight + 20;
    });

    const pdf = await page.pdf({
      width: "210mm",
      height: `${bodyHeight}px`,
      printBackground: true,
    });

    await browser.close();

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return new Response(
      JSON.stringify({ message: "Erro ao gerar PDF", error: String(error) }),
      { status: 500 }
    );
  }
};
