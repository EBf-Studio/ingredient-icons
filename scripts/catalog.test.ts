import { describe, expect, test } from "bun:test"

import { iconOf, snapshot } from "./catalog"

// A catalog build as @marmalade/ingredient-catalog writes it in dist/data.js.
const build = {
  release: "55b7261a61575e16",
  entries: [
    {
      id: "cheeses",
      names: { en: { name: "cheeses", synonyms: [] }, fr: { name: "fromages", synonyms: [] } },
    },
    {
      id: "hard-cheese",
      parent: "cheeses",
      wikidata: "Q1135928",
      names: { en: { name: "hard cheese", synonyms: [] } },
    },
    {
      id: "parmesan",
      parent: "hard-cheese",
      wikidata: "Q155858",
      openFoodFacts: "en:parmigiano-reggiano",
      names: {
        en: { name: "Parmesan", synonyms: ["Parmigiano-Reggiano"] },
        it: { name: "Parmigiano Reggiano", synonyms: [] },
      },
    },
    { id: "herbs", names: { en: { name: "herbs", synonyms: [] } } },
  ],
  corrections: [
    { wording: { text: "fromage blanc", language: "fr" }, recognition: { outcome: "none" } },
  ],
}

describe("snapshot", () => {
  test("keeps the release, and each entry's parent, family and names", () => {
    expect(snapshot(build)).toEqual({
      release: "55b7261a61575e16",
      license: "CC0-1.0",
      entries: {
        cheeses: {
          names: { en: { name: "cheeses", synonyms: [] }, fr: { name: "fromages", synonyms: [] } },
        },
        "hard-cheese": {
          parent: "cheeses",
          family: "cheeses",
          names: { en: { name: "hard cheese", synonyms: [] } },
        },
        herbs: { names: { en: { name: "herbs", synonyms: [] } } },
        parmesan: {
          parent: "hard-cheese",
          family: "cheeses",
          names: {
            en: { name: "Parmesan", synonyms: ["Parmigiano-Reggiano"] },
            it: { name: "Parmigiano Reggiano", synonyms: [] },
          },
        },
      },
    })
  })
})

describe("iconOf", () => {
  const catalog = snapshot(build)

  test("an entry with its own icon shows it", () => {
    expect(iconOf("parmesan", new Set(["parmesan", "hard-cheese", "cheeses"]), catalog)).toBe("parmesan")
  })

  test("an entry without one shows its nearest ancestor's, its family's last", () => {
    expect(iconOf("parmesan", new Set(["hard-cheese", "cheeses"]), catalog)).toBe("hard-cheese")
    expect(iconOf("parmesan", new Set(["cheeses"]), catalog)).toBe("cheeses")
  })

  test("none when neither it nor an ancestor has one, or the id is not in the catalog", () => {
    expect(iconOf("parmesan", new Set(["herbs"]), catalog)).toBeUndefined()
    expect(iconOf("unicorn-steak", new Set(["cheeses"]), catalog)).toBeUndefined()
  })
})
