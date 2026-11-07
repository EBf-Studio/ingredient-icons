import { describe, expect, test } from "bun:test"

import catalog from "../catalog.json"
import { CATALOG_RELEASE, CDN_URL, GENERIC_ID, iconPath, iconUrl, ids } from "./index"

test("paths and URLs point at the WebP file of the size asked, named by catalog id", () => {
  expect(iconPath("shallot")).toBe("icons/webp/128/shallot.webp")
  expect(iconUrl("shallot", { size: 64 })).toBe(`${CDN_URL}/icons/webp/64/shallot.webp`)
  expect(iconUrl("shallot", { baseUrl: "https://example.com/i/" })).toBe(
    "https://example.com/i/icons/webp/128/shallot.webp",
  )
})

test("a family has its own icon", () => {
  expect(iconPath("cheeses")).toBe("icons/webp/128/cheeses.webp")
})

test("an id without its own icon has none: no fallback in the package", () => {
  expect(iconPath("acorn-squash")).toBeUndefined()
  expect(iconPath("en:shallot")).toBeUndefined()
  expect(iconUrl("unicorn-steak")).toBeUndefined()
})

describe("the generic icon", () => {
  test("has a reserved id, which ships with the others", () => {
    expect(GENERIC_ID).toBe("generic")
    expect(ids).toContain(GENERIC_ID)
  })

  test("is what to show for an id that has no icon", () => {
    expect(iconUrl("unicorn-steak") ?? iconUrl(GENERIC_ID)).toBe(
      `${CDN_URL}/icons/webp/128/generic.webp`,
    )
  })
})

describe("the catalog snapshot", () => {
  test("ships with the package, from the release it exports", () => {
    expect(catalog.release).toBe(CATALOG_RELEASE)
    expect(catalog.license).toBe("CC0-1.0")
  })

  test("gives each catalog ingredient its parent, its family and its names", () => {
    expect(catalog.entries["shallot"]).toMatchObject({
      family: "vegetables",
      names: { en: { name: "shallot" }, fr: { name: "échalote" } },
    })
  })
})
