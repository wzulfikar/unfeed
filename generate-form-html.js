import { readFileSync, writeFileSync } from "fs";
import { minify } from "html-minifier";

const html = minify(readFileSync("./src/form.html").toString(), {
  collapseWhitespace: true,
  collapseInlineTagWhitespace: true,
});

writeFileSync(
  "./src/form-html.ts",
  ["export const formHTML = (t: any) => `", html, "`;"].join("")
);
