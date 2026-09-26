// Verifies the translation files: same keys in English and Bangla, matching {placeholders}, and every
// literal t("...") / tOr("...") key used in src/ exists. Run with `npm run check:i18n`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { flatten, lookup } from "../src/i18n/translate.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const en = (await import(pathToFileURL(join(root, "src/i18n/locales/en.js")).href)).default;
const bn = (await import(pathToFileURL(join(root, "src/i18n/locales/bn.js")).href)).default;

const problems = [];
const enKeys = new Set(flatten(en));
const bnKeys = new Set(flatten(bn));

for (const key of enKeys) if (!bnKeys.has(key)) problems.push(`missing in bn: ${key}`);
for (const key of bnKeys) if (!enKeys.has(key)) problems.push(`missing in en: ${key}`);

const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
for (const key of enKeys) {
  if (!bnKeys.has(key)) continue;
  if (placeholders(lookup(en, key)) !== placeholders(lookup(bn, key))) problems.push(`placeholder mismatch: ${key}`);
  if (String(lookup(bn, key)).trim() === "") continue;
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.(jsx?|mjs)$/.test(name) ? [path] : [];
  });

const usedKeys = new Set();
for (const file of walk(join(root, "src"))) {
  if (file.includes(`${join("src", "i18n")}`)) continue;
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/\b(?:t|tOr|tError)\(\s*["']([\w.]+)["']/g)) usedKeys.add(match[1]);
}
const has = (key) => enKeys.has(key) || enKeys.has(`${key}_one`) || enKeys.has(`${key}_other`);
for (const key of usedKeys) if (!has(key)) problems.push(`used in code but not defined: ${key}`);

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} i18n problem(s)`);
  process.exit(1);
}
console.log(`i18n OK: ${enKeys.size} keys in en and bn, ${usedKeys.size} literal keys used in code`);
