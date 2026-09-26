// Framework-free translation core so it can be unit-tested with plain `node`.

/** Looks up a dotted key ("nav.home") in a nested dictionary. Returns undefined when missing. */
export const lookup = (dictionary, key) =>
  key.split(".").reduce((node, part) => (node && typeof node === "object" ? node[part] : undefined), dictionary);

/**
 * Replaces {name} placeholders. Unknown placeholders are left untouched.
 * A numeric `count` is passed through `formatCount` (when given) so Bangla shows Bangla digits.
 */
export const interpolate = (template, params, formatCount) => {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    if (!(name in params)) return match;
    const value = params[name];
    return name === "count" && typeof value === "number" && formatCount ? formatCount(value) : String(value);
  });
};

/**
 * Translates `key` for `lang`, falling back to English and finally to the key itself so a
 * missing translation is visible (and never crashes the page).
 * A numeric `count` param selects the `key_one` / `key_other` plural form when those exist.
 */
export const translate = (dictionaries, lang, key, params, formatCount) => {
  const candidates = params && typeof params.count === "number"
    ? [`${key}_${params.count === 1 ? "one" : "other"}`, key]
    : [key];
  for (const dictionary of [dictionaries[lang], dictionaries.en]) {
    for (const candidate of candidates) {
      const found = lookup(dictionary, candidate);
      if (typeof found === "string") return interpolate(found, params, formatCount);
    }
  }
  return key;
};

/** Flattens a nested dictionary into dotted keys (used by the parity check). */
export const flatten = (dictionary, prefix = "") =>
  Object.entries(dictionary).flatMap(([key, value]) =>
    value && typeof value === "object" ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );
