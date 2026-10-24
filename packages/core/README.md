# @ingredient-icons/core

Soft 3D icons for cooking ingredients, keyed by the [Open Food Facts ingredients taxonomy](https://wiki.openfoodfacts.org/Global_taxonomies). An ingredient without its own icon gets its closest ancestor's: cherry tomatoes get the tomato, lardons get bacon.

```sh
npm install @ingredient-icons/core
```

```ts
import { findIcon, iconName, iconUrl } from "@ingredient-icons/core"

iconUrl("en:shallot")                 // https://cdn.jsdelivr.net/npm/@ingredient-icons/core@<version>/icons/webp/128/en_shallot.webp
iconUrl("en:cherry-tomato", { size: 64 }) // the tomato's icon
findIcon("en:cherry-tomato")          // { id: "en:tomato", file: "en_tomato", exact: false }
iconName("en:shallot", "fr")          // "échalote"
```

Icons ship as transparent WebP in 64, 128 and 256 px, under `icons/webp/{size}/`. URLs default to the jsDelivr CDN, pinned to the installed version.

## Serving the files yourself

Expose the package's `icons/` folder and pass `{ baseUrl }`. With Express:

```ts
import { createRequire } from "node:module"
import path from "node:path"
import express from "express"
import { iconUrl } from "@ingredient-icons/core"

const root = path.dirname(createRequire(import.meta.url).resolve("@ingredient-icons/core/package.json"))
const app = express()
app.use("/ingredient-icons/icons", express.static(path.join(root, "icons"), { immutable: true, maxAge: "1y" }))

iconUrl("en:shallot", { baseUrl: "https://api.example.com/ingredient-icons" })
```

An icon can change between versions: if you cache forever, put the package version (`VERSION`) in the path.

## Licenses

- Icons: CC0 1.0, public domain. Created with Grok.
- Taxonomy data (parents and names): Open Food Facts, ODbL 1.0. Not affiliated with Open Food Facts.
- Code: MIT.

By [Marmalade](https://try-marmalade.com).
