import { describe, expect, test } from "bun:test"

import { setSubject } from "./subject"

const file = `[
  { "slug": "en:tomato", "subject": "a ripe red tomato" },
  { "slug": "en:onion", "subject": "a golden onion" }
]
`

describe("setSubject", () => {
  test("appends a new slug as the last line, keeping the others as they are", () => {
    const { text, added } = setSubject(file, "en:honey", 'a jar of "golden" honey')
    expect(added).toBe(true)
    expect(text).toBe(`[
  { "slug": "en:tomato", "subject": "a ripe red tomato" },
  { "slug": "en:onion", "subject": "a golden onion" },
  { "slug": "en:honey", "subject": "a jar of \\"golden\\" honey" }
]
`)
  })

  test("replaces the subject of a slug in place, comma included", () => {
    expect(setSubject(file, "en:tomato", "a green tomato").text).toBe(file.replace("a ripe red tomato", "a green tomato"))
    expect(setSubject(file, "en:onion", "a red onion").text).toBe(file.replace("a golden onion", "a red onion"))
  })

  test("accepts ids with accents, as the taxonomy has them", () => {
    expect(setSubject(file, "en:pošip", "a bunch of white grapes").added).toBe(true)
  })

  test("accepts the reserved generic id, which is not an Open Food Facts one", () => {
    expect(setSubject(file, "generic", "a paper grocery bag").added).toBe(true)
  })

  test("refuses a file whose slug is already there twice, or not one entry per line", () => {
    const twice = file.replace("en:onion", "en:tomato")
    expect(() => setSubject(twice, "en:tomato", "a green tomato")).toThrow("more than once")
    expect(() => setSubject(JSON.stringify(JSON.parse(file), null, 2), "en:honey", "a jar")).toThrow("one entry per line")
  })

  test("refuses what is not an id or not one sentence on one line", () => {
    expect(() => setSubject(file, "honey", "a jar")).toThrow()
    expect(() => setSubject(file, "en:honey", "a jar\nof honey")).toThrow()
    expect(() => setSubject(file, "en:honey", " ")).toThrow()
  })
})
