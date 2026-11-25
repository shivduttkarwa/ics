import fs from "node:fs";
import path from "node:path";
import less from "less";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import * as esbuild from "esbuild";

const PROD = process.env.ELEVENTY_RUN_MODE === "build";

function relativeUrls(html, pageUrl) {
  const up = "../".repeat(pageUrl.split("/").length - 2);
  return html
    .replace(/\b(href|src|poster|action|data-src|data-thumb|data-search-index)="\/(?!\/)([^"]*)"/g, (_, attr, url) => `${attr}="${up + url || "./"}"`)
    .replace(/\bsrcset="([^"]*)"/g, (_, set) => `srcset="${set.replace(/(^|[\s,])\/(?!\/)/g, `$1${up}`)}"`);
}

async function compileCss() {
  const input = "src/assets/styles/main.less";
  const out = await less.render(fs.readFileSync(input, "utf8"), {
    filename: path.resolve(input),
    paths: ["node_modules", "src/assets/styles"],
  });
  const prefixed = await postcss([autoprefixer]).process(out.css, { from: undefined });
  const css = PROD
    ? (await esbuild.transform(prefixed.css, { loader: "css", minify: true, legalComments: "none" })).code
    : prefixed.css;
  fs.mkdirSync("dist/assets/css", { recursive: true });
  fs.writeFileSync("dist/assets/css/main.css", css);
}

// the site search's index (search.js), read from each rendered page; a <main> with data-search-skip is left out
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", ndash: "–", mdash: "—", hellip: "…" };
const decode = (text) => text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code) => {
  if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? whole;
  return String.fromCodePoint(code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10));
});
// inline tags join the words either side of them; every other tag is a break between words
const textOf = (html) => decode(html
  .replace(/<\/?(?:em|strong|i|b|a|abbr|sup|sub|small|mark|u|q|cite)\b[^>]*>/gi, "")
  .replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

function searchEntry(html, url, siteName) {
  const main = html.match(/<main\b([^>]*)>([\s\S]*)<\/main>/i);
  if (!main || /\bdata-search-skip\b/.test(main[1])) return null;
  const body = main[2]
    .replace(/<(section|nav)\b[^>]*\bdata-search-skip\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(script|style|svg|template|video|noscript)\b[\s\S]*?<\/\1>/gi, " ");
  const title = textOf(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").split(" | ").filter((part) => part !== siteName).join(" | ");
  return {
    url,
    title: title || siteName,
    description: decode(html.match(/<meta name="description" content="([^"]*)"/i)?.[1] || ""),
    headings: [...body.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => textOf(m[2])).filter(Boolean),
    text: textOf(body),
  };
}

function writeSearchIndex(results) {
  const { name } = JSON.parse(fs.readFileSync("src/_data/site.json", "utf8"));
  const entries = results
    .filter(({ url, outputPath }) => url && outputPath?.endsWith(".html") && !url.startsWith("/lab/"))
    .map(({ content, url }) => searchEntry(content, url.endsWith("/") ? `${url}index.html` : url, name))
    .filter(Boolean)
    .sort((a, b) => a.url.localeCompare(b.url));
  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync("dist/search-index.json", JSON.stringify(entries));
}

export default function (eleventyConfig) {
  eleventyConfig.addTransform("relative-urls", function (content) {
    return (this.page.outputPath || "").endsWith(".html") ? relativeUrls(content, this.page.url) : content;
  });

  if (PROD) eleventyConfig.ignores.add("src/lab/**");

  // Django's own filter, so templates stay within what Wagtail can render
  eleventyConfig.addFilter("divisibleby", (value, divisor) => Number(value) % Number(divisor) === 0);

  eleventyConfig.on("eleventy.before", compileCss);
  eleventyConfig.on("eleventy.after", ({ results }) => writeSearchIndex(results));
  eleventyConfig.addWatchTarget("src/assets/styles/");
  eleventyConfig.addWatchTarget("dist/assets/js/");

  for (const dir of ["images", "icons", "fonts", "video"]) {
    if (fs.existsSync(`src/assets/${dir}`)) {
      eleventyConfig.addPassthroughCopy({ [`src/assets/${dir}`]: `assets/${dir}` });
    }
  }

  eleventyConfig.setServerOptions({ port: 3000, showAllHosts: true });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "dist" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "html"],
  };
}
