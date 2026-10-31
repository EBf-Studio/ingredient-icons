<p align="center">
  <a href="https://ingredient-icons.vercel.app">
    <img alt="Ingredient Icons: an icon for every ingredient" src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/.github/assets/banner-light.webp" width="100%">
  </a>
</p>

<p align="center">
  <b>314 soft 3D icons for recipe apps, keyed by the Open Food Facts taxonomy.</b><br>
  Shallots, crème fraîche, salt and pepper each get their own, and anything else borrows its closest parent's.
</p>

<p align="center">
  <a href="https://ingredient-icons.vercel.app"><b>Website</b></a> ·
  <a href="https://ingredient-icons.vercel.app/docs">Docs</a> ·
  <a href="https://ingredient-icons.vercel.app/icons">Browse the icons</a> ·
  <a href="https://github.com/EBf-Studio/ingredient-icons">GitHub</a> ·
  <a href="https://github.com/EBf-Studio/ingredient-icons/issues/new">Request an icon</a>
</p>

## Emojis run out at the onion

There is no emoji for a shallot, and 🧂 has to stand in for salt and pepper. A recipe shows each ingredient as what it is.

| Emoji | Ingredient Icons |
| :---: | --- |
| 🧅 | <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_onion.png" width="56" alt="Onion"> <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_red-onion.png" width="56" alt="Red onion"> <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_shallot.png" width="56" alt="Shallot"> <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_spring-onion.png" width="56" alt="Spring onion"> <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_leek.png" width="56" alt="Leek"> |
| 🧂 | <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_salt.png" width="56" alt="Salt"> <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_black-pepper.png" width="56" alt="Black pepper"> <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_white-pepper.png" width="56" alt="White pepper"> <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_pink-peppercorn.png" width="56" alt="Pink peppercorn"> <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_celery-salt.png" width="56" alt="Celery salt"> |
| 🧀 | <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_brie.png" width="56" alt="Brie"> <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_feta.png" width="56" alt="Feta"> <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_roquefort.png" width="56" alt="Roquefort"> <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_mozzarella.png" width="56" alt="Mozzarella"> <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_parmigiano-reggiano.png" width="56" alt="Parmigiano Reggiano"> |

## Quick start

```sh
npm install @ingredient-icons/core
```

Pass the Open Food Facts id your recipe already stores, get back an image URL:

```tsx
import { iconUrl } from "@ingredient-icons/core"

export function Ingredient({ id, quantity, name }) {
  return (
    <li>
      <img src={iconUrl(id)} alt="" width={40} height={40} />
      {quantity} {name}
    </li>
  )
}

<Ingredient id="en:cherry-tomato" quantity="250 g" name="cherry tomatoes" />
```

URLs point to the exact release you installed on jsDelivr, so icons never change under you. Pass `baseUrl` to serve them from your own CDN or app bundle. Works in React, React Native, Node, Bun, Deno and anything else that shows images, with TypeScript types included.

```ts
import { findIcon, iconName, iconUrl } from "@ingredient-icons/core"

iconUrl("en:shallot", { size: 256 })
// https://cdn.jsdelivr.net/npm/@ingredient-icons/core@<version>/icons/webp/256/en_shallot.webp

findIcon("en:peeled-tomatoes")  // { id: "en:tomato", file: "en_tomato", exact: false }
iconName("en:shallot", "fr")  // "échalote"
findIcon("en:unicorn-steak")  // undefined: show your own placeholder
```

[React](https://ingredient-icons.vercel.app/docs/guides/react) · [React Native](https://ingredient-icons.vercel.app/docs/guides/react-native) · [Next.js](https://ingredient-icons.vercel.app/docs/guides/nextjs) · [Self-hosting](https://ingredient-icons.vercel.app/docs/guides/self-hosting) · [Without npm](https://ingredient-icons.vercel.app/docs/guides/without-npm) · [API reference](https://ingredient-icons.vercel.app/docs/reference/api)

## No icon of its own? It borrows its parent's

Ids follow the Open Food Facts taxonomy, which knows that fleur de sel is a sea salt and sea salt is a salt. When an ingredient has no icon, `findIcon` walks up its parents and takes the first one that has. That's how **314 icons cover 3,748 ingredients**.

<p>
  <code>en:fleur-de-sel</code> → <code>en:sea-salt</code> → <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_salt.png" width="40" alt="" align="center"> <code>en:salt</code><br>
  <code>en:peeled-tomatoes</code> → <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_tomato.png" width="40" alt="" align="center"> <code>en:tomato</code>
</p>

Try it with any ingredient [on the website](https://ingredient-icons.vercel.app).

The taxonomy is pinned to one [openfoodfacts-server release](https://github.com/openfoodfacts/openfoodfacts-server/releases), exported as `TAXONOMY_RELEASE` (and its commit as `TAXONOMY_COMMIT`). If your own Open Food Facts data comes from a release too, a test can check that both match, so your ids are the ones the package knows:

```ts
import { TAXONOMY_RELEASE } from "@ingredient-icons/core"

expect(TAXONOMY_RELEASE).toBe("v2.118.0")
```

## What's in the package

Transparent WebP in 64, 128 and 256 px, under `icons/webp/{size}/`. 128 px covers a 40 pt icon on a 3× screen; 256 px covers almost everything else. Names come in English and French, from Open Food Facts.

To serve the files yourself, expose the package's `icons/` folder and pass `{ baseUrl }`: see the [self-hosting guide](https://ingredient-icons.vercel.app/docs/guides/self-hosting). PNG up to 512 px, `manifest.json` and `taxonomy.json` are in the [GitHub repository](https://github.com/EBf-Studio/ingredient-icons).

## Missing an ingredient?

New icons ship in batches. [Open an issue](https://github.com/EBf-Studio/ingredient-icons/issues/new) with the Open Food Facts id (`en:yuzu`) or the name of the ingredient, and it goes on the list.

## Licenses

- Icons: [CC0 1.0](https://github.com/EBf-Studio/ingredient-icons/blob/main/LICENSE-ICONS). Created with Grok. No attribution required, a link back is appreciated.
- Taxonomy data (parents and names): Open Food Facts, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). This project is not affiliated with Open Food Facts.
- Code: [MIT](https://github.com/EBf-Studio/ingredient-icons/blob/main/LICENSE).

<p align="center">
  <br>
  <img src="https://raw.githubusercontent.com/EBf-Studio/ingredient-icons/main/icons/png/128/en_avocado.png" width="48" alt=""><br>
  Made by <a href="https://try-marmalade.com">Marmalade</a>
</p>
