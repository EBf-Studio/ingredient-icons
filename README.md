# ingredient-icons

Soft 3D icons for cooking ingredients, one per entry of the [Open Food Facts ingredients taxonomy](https://wiki.openfoodfacts.org/Global_taxonomies). Made for recipe apps, where emojis run out fast: there is no emoji for a shallot or fresh cream, and 🧂 stands for both salt and pepper.

By [Marmalade](https://try-marmalade.com). Icons are public domain (CC0).

## What's inside

| Path | Content |
| --- | --- |
| `icons/png/{64,128,256,512}/` | Transparent PNG, the canonical format |
| `icons/webp/{64,128,256}/` | The same as WebP, for the web and React Native |
| `manifest.json` | Every icon by taxonomy id, the sizes and the path template |
| `taxonomy.json` | Parents of every taxonomy entry, and the English and French names of the ids that have an icon (ODbL) |

File names are taxonomy ids with `:` replaced by `_`: `en:shallot` → `icons/png/256/en_shallot.png`.

128 px covers a 40 pt icon on a 3× screen; 256 px covers almost everything else.

## Finding an icon

Look the id up in `manifest.json`. When it has no icon, walk up its parents in `taxonomy.json` and take the first ancestor that has one: cherry tomatoes get the tomato, lardons get bacon.

```ts
import manifest from "./manifest.json"
import taxonomy from "./taxonomy.json"

function iconFor(id: string, depth = 0): string | undefined {
  const icon = manifest.icons[id]
  if (icon) return icon.file
  if (depth > 6) return undefined
  for (const parent of taxonomy.parents[id] ?? []) {
    const file = iconFor(parent, depth + 1)
    if (file) return file
  }
}
```

Packages for npm and native platforms will follow under the [`@ingredient-icons`](https://www.npmjs.com/org/ingredient-icons) scope.

## Missing an ingredient?

Open an issue with its Open Food Facts id (`en:yuzu`) or its name. New icons ship in batches.

## Development

The icons are built from private sources (raw images and prompts). With them checked out next to this repository:

```sh
bun install
bun run build      # cut-out, every size and format, manifest.json, .out/review.html
bun run taxonomy   # pins the Open Food Facts taxonomy, writes taxonomy.json
bun run check      # types, files against the manifest, ids against the taxonomy
```

The repository grows with every batch: `git clone --depth 1` if you only need the icons.

## Licenses

- Icons and `manifest.json`: [CC0 1.0](LICENSE-ICONS). Created with Grok. No attribution required, a link back is appreciated.
- `taxonomy.json`: data from Open Food Facts, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). This project is not affiliated with Open Food Facts.
- Scripts: [MIT](LICENSE).

See [NOTICE](NOTICE).
