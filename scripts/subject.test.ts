import { describe, expect, test } from "bun:test"

import { setSubject } from "./subject"

const file = `[
  { "slug": "tomato", "subject": "a ripe red tomato" },
  { "slug": "onion", "subject": "a golden onion" }
]
`

describe("setSubject", () => {
  test("appends a new slug as the last line, keeping the others as they are", () => {
    const { text, added } = setSubject(file, "honey", 'a jar of "golden" honey')
    expect(added).toBe(true)
    expect(text).toBe(`[
  { "slug": "tomato", "subject": "a ripe red tomato" },
  { "slug": "onion", "subject": "a golden onion" },
  { "slug": "honey", "subject": "a jar of \\"golden\\" honey" }
]
`)
  })

  test("replaces the subject of a slug in place, comma included", () => {
    expect(setSubject(file, "tomato", "a green tomato").text).toBe(file.replace("a ripe red tomato", "a green tomato"))
    expect(setSubject(file, "onion", "a red onion").text).toBe(file.replace("a golden onion", "a red onion"))
  })

  test("accepts catalog ids only: English kebab-case", () => {
    expect(setSubject(file, "spice-blends", "a small bowl of mixed ground spices").added).toBe(true)
    for (const slug of ["en:honey", "Honey", "olive oil", "crème-fraîche", "-honey"])
      expect(() => setSubject(file, slug, "a jar")).toThrow("Not a catalog id")
  })

  test("accepts the reserved generic id, which is not a catalog one", () => {
    expect(setSubject(file, "generic", "a paper grocery bag").added).toBe(true)
  })

  test("refuses a file whose slug is already there twice, or not one entry per line", () => {
    const twice = file.replace("onion", "tomato")
    expect(() => setSubject(twice, "tomato", "a green tomato")).toThrow("more than once")
    expect(() => setSubject(JSON.stringify(JSON.parse(file), null, 2), "honey", "a jar")).toThrow("one entry per line")
  })

  test("refuses what is not one sentence on one line", () => {
    expect(() => setSubject(file, "honey", "a jar\nof honey")).toThrow()
    expect(() => setSubject(file, "honey", " ")).toThrow()
  })
})
