import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { translate, interpolate, lookup, flatten } from "../src/i18n/translate.js";
import { localizeServerMessage, bnServerMessages } from "../src/i18n/locales/serverMessages.js";
import en from "../src/i18n/locales/en.js";
import bn from "../src/i18n/locales/bn.js";

const dictionaries = {
  en: { hi: "Hello {name}", only: "English only", items_one: "{count} item", items_other: "{count} items" },
  bn: { hi: "হ্যালো {name}", items_one: "{count}টি জিনিস", items_other: "{count}টি জিনিস" },
};

describe("translate", () => {
  it("interpolates placeholders and leaves unknown ones", () => {
    assert.equal(interpolate("Hi {name}, {other}", { name: "Sam" }), "Hi Sam, {other}");
    assert.equal(interpolate("plain"), "plain");
  });

  it("returns the requested language", () => {
    assert.equal(translate(dictionaries, "bn", "hi", { name: "রিনা" }), "হ্যালো রিনা");
    assert.equal(translate(dictionaries, "en", "hi", { name: "Rina" }), "Hello Rina");
  });

  it("falls back to English, then to the key itself", () => {
    assert.equal(translate(dictionaries, "bn", "only"), "English only");
    assert.equal(translate(dictionaries, "bn", "nope.missing"), "nope.missing");
  });

  it("picks plural forms from a numeric count and formats the count", () => {
    assert.equal(translate(dictionaries, "en", "items", { count: 1 }), "1 item");
    assert.equal(translate(dictionaries, "en", "items", { count: 3 }), "3 items");
    const banglaDigits = (n) => new Intl.NumberFormat("bn-BD").format(n);
    assert.equal(translate(dictionaries, "bn", "items", { count: 12 }, banglaDigits), "১২টি জিনিস");
  });

  it("looks up nested keys and flattens dictionaries", () => {
    assert.equal(lookup({ a: { b: { c: "x" } } }, "a.b.c"), "x");
    assert.equal(lookup({ a: 1 }, "a.b"), undefined);
    assert.deepEqual(flatten({ a: { b: "1", c: "2" }, d: "3" }), ["a.b", "a.c", "d"]);
  });
});

describe("real translation files", () => {
  it("have identical keys and placeholders in English and Bangla", () => {
    const enKeys = flatten(en);
    const bnKeys = flatten(bn);
    assert.deepEqual([...enKeys].sort(), [...bnKeys].sort());
    for (const key of enKeys) {
      const names = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      assert.deepEqual(names(lookup(bn, key)), names(lookup(en, key)), key);
    }
  });

  it("contain Bangla text where English is expected", () => {
    const bengali = /[\u0980-\u09FF]/;
    const untranslated = flatten(bn).filter((key) => !bengali.test(lookup(bn, key)));
    // Brand names, units and plain numbers/symbols legitimately stay Latin
    const allowed = /^(language\.label|.*\.(short|label)|home\.hero\.eyebrow)$/;
    assert.deepEqual(untranslated.filter((key) => !allowed.test(key) && String(lookup(bn, key)).trim().length > 12), []);
  });
});

describe("server message translation", () => {
  it("translates known API errors to Bangla and leaves English alone", () => {
    assert.equal(localizeServerMessage("bn", "Invalid user credentials"), bnServerMessages["Invalid user credentials"]);
    assert.equal(localizeServerMessage("en", "Invalid user credentials"), "Invalid user credentials");
  });

  it("falls back to the original text for unknown messages and handles dynamic ones", () => {
    assert.equal(localizeServerMessage("bn", "Something brand new"), "Something brand new");
    assert.match(localizeServerMessage("bn", "You can have at most 10 job alerts. Delete one to add another."), /১০|10/);
    assert.equal(localizeServerMessage("bn", undefined), undefined);
  });
});
