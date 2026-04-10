import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { load } from "cheerio";

const querySchema = z.object({
  url: z.string().url().refine((u) => u.startsWith("http://") || u.startsWith("https://"), "URL must start with http:// or https://"),
});

export async function getOpenGraph(req: Request, res: Response, next: NextFunction) {
  try {
    const { url } = querySchema.parse(req.query);

    let html: string;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "LeCabanon/1.0 (link preview)" },
      });
      clearTimeout(timeout);

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        res.json({ url, title: null, description: null, image: null, siteName: null });
        return;
      }

      // Limit response size to 1MB
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > 1_048_576) {
        html = new TextDecoder().decode(buffer.slice(0, 1_048_576));
      } else {
        html = new TextDecoder().decode(buffer);
      }
    } catch {
      res.json({ url, title: null, description: null, image: null, siteName: null });
      return;
    }

    const $ = load(html);

    const title = $('meta[property="og:title"]').attr("content") || $("title").text() || null;
    const description = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || null;
    const image = $('meta[property="og:image"]').attr("content") || null;
    const siteName = $('meta[property="og:site_name"]').attr("content") || null;

    res.json({ url, title, description, image, siteName });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
}
