# Astro Flexa

Astro 7 starter with Tailwind CSS v4 and content from [Flexa CMS](https://flexacms.com), loaded with [`@flexacms/astro`](https://www.npmjs.com/package/@flexacms/astro).

```bash
npx degit ivanmercedes/astro-flexa my-site
cd my-site
cp .env.example .env   # set FLEXA_URL and FLEXA_API_KEY
npm install
npm run dev
```

## Content

`src/content.config.ts` defines one collection, `flexa`, with every entry of the workspace: each entity is loaded with `flexaLoader` and its entries get `{entity}/{slug}` ids. Read it through `src/lib/flexa.ts`:

```astro
---
import { flexa } from '../lib/flexa';

const home = await flexa.entity('home').get();           // { title, slug, ...values } of home/default
const post = await flexa.entity('posts').get('hello');   // posts/hello
const posts = await flexa.collection('posts').list();    // every entry of posts
const site = await flexa.site();                         // site/default: header, footer…
const primaryMenu = await flexa.menu('primary');         // [{ title, url, target, children }]
---
<h1>{home.title}</h1>
{posts.map((post) => <a href={`/blog/${post.slug}`}>{post.title}</a>)}
```

You can also use `astro:content` directly: `getCollection('flexa', (entry) => entry.id.startsWith('posts/'))`, where `data` is the full API entry.

Menus are read from the `menus` value of the `site/default` entry, keyed by location.

## Local content file

Set `FLEXA_CONTENT_FILE` to read the content from a JSON file instead of Flexa: to work offline, for previews, or for tests. In `astro dev` the file is reloaded when it changes.

```json
{
    "entities": {
        "home": { "default": { "title": "Hello", "intro": "Welcome" } },
        "posts": { "hello": { "title": "Hello world", "body": "<p>…</p>" } }
    },
    "menus": {
        "primary": [{ "title": "Home", "url": "/", "target": "", "children": [] }]
    }
}
```

## Design tokens

`src/styles/tokens.css` defines the Tailwind theme: `primary`, `secondary`, `dark` and `light` colors and the `font-heading` / `font-body` fonts.

## Scripts

| Command           |                                  |
| ----------------- | -------------------------------- |
| `npm run dev`     | Development server               |
| `npm run build`   | Static build in `dist/`          |
| `npm run preview` | Serve the build                  |

Pages are rendered at build time: rebuild (for example from a Flexa webhook) to publish content changes.

## License

MIT
