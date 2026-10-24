# @ingredient-icons/core

Soft 3D icons for cooking ingredients, keyed by the [Open Food Facts ingredients taxonomy](https://wiki.openfoodfacts.org/Global_taxonomies). An ingredient without its own icon gets its closest ancestor's: cherry tomatoes get the tomato, lardons get bacon.

```sh
npm install @ingredient-icons/core
```

```ts
import { findIcon, iconName, iconUrl } from "@ingredient-icons/core"

iconUrl("en:shallot")                 // https://cdn.jsdelivr.net/npm/@ingredient-icons/core@0.1.0/icons/webp/128/en_shallot.webp
iconUrl("en:cherry-tomato", { size: 64 }) // the tomato's icon
findIcon("en:cherry-tomato")          // { id: "en:tomato", file: "en_tomato", exact: false }
iconName("en:shallot", "fr")          // "échalote"
```

Icons ship as transparent WebP in 64, 128 and 256 px, under `icons/webp/{size}/`. URLs default to the jsDelivr CDN, pinned to the installed version; to serve the files yourself, expose the package's `icons/` folder and pass `{ baseUrl }`.

## Licenses

- Icons: CC0 1.0, public domain. Created with Grok.
- Taxonomy data (parents and names): Open Food Facts, ODbL 1.0. Not affiliated with Open Food Facts.
- Code: MIT.

By [Marmalade](https://try-marmalade.com).
