import { expect, test } from "bun:test"

import { parseTaxonomy } from "./taxonomy"

test("a comment inside an entry does not split it", () => {
  const entries = parseTaxonomy(`#category/cucumbers
< en: fruit vegetable
en: cucumber, cucumbers
da: agurk, agurker
# de: Gurke, Gurken # also "en: gherkin"
es: pepino
fr: concombre

< en: cucumber
en: pickled cucumber
`)

  expect(entries.map((e) => e.id)).toEqual(["en:cucumber", "en:pickled-cucumber"])
  expect(entries[0]!.parents).toEqual(["en:fruit-vegetable"])
  expect(entries[0]!.names.get("fr")).toBe("concombre")
})
