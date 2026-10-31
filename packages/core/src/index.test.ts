import { describe, expect, test } from "bun:test"

import { CDN_URL, findIcon, iconName, iconPath, iconUrl, ids, TAXONOMY_COMMIT, TAXONOMY_RELEASE } from "./index"

describe("findIcon", () => {
  test("an id with its own icon", () => {
    expect(findIcon("en:shallot")).toEqual({ id: "en:shallot", file: "en_shallot", exact: true })
  })

  test("an id without one takes its closest ancestor's", () => {
    expect(findIcon("en:peeled-tomatoes")).toEqual({ id: "en:tomato", file: "en_tomato", exact: false })
  })

  test("a parent Open Food Facts names by a synonym still leads up the taxonomy", () => {
    // ingredients.txt writes "< en: sheeps milk"; the entry is en:sheep-milk.
    expect(findIcon("en:whole-sheep-milk")).toEqual({ id: "en:milk", file: "en_milk", exact: false })
  })

  test("an unknown id has none", () => {
    expect(findIcon("en:not-an-ingredient")).toBeUndefined()
  })
})

test("paths and URLs point at the WebP file of the size asked", () => {
  expect(iconPath("en:shallot")).toBe("icons/webp/128/en_shallot.webp")
  expect(iconUrl("en:shallot", { size: 64 })).toBe(`${CDN_URL}/icons/webp/64/en_shallot.webp`)
  expect(iconUrl("en:shallot", { baseUrl: "https://example.com/i/" })).toBe(
    "https://example.com/i/icons/webp/128/en_shallot.webp",
  )
})

test("names come from the taxonomy", () => {
  expect(iconName("en:shallot", "fr")).toBe("échalote")
})

test("every id ships", () => {
  expect(ids.length).toBeGreaterThan(200)
})

test("the taxonomy release is exported with its commit", () => {
  expect(TAXONOMY_RELEASE).toMatch(/^v\d+\.\d+\.\d+$/)
  expect(TAXONOMY_COMMIT).toMatch(/^[0-9a-f]{40}$/)
})
