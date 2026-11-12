import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient, flexaLoader, type Entry } from '@flexacms/astro';
import type { Loader, LoaderContext } from 'astro/loaders';

type Values = Record<string, unknown>;

/** Shape of FLEXA_CONTENT_FILE. */
interface ContentFile {
    entities?: Record<string, Record<string, Values>>;
    menus?: Record<string, Values[]>;
}

const env = (name: string): string | undefined =>
    (import.meta.env as Record<string, string | undefined>)[name] || process.env[name] || undefined;

/**
 * Loads the content of the site: from FLEXA_CONTENT_FILE when it is set (and
 * reloads it when the file changes), otherwise every entity of the Flexa
 * workspace with @flexacms/astro.
 */
export function flexaContent(): Loader {
    const file = env('FLEXA_CONTENT_FILE');

    return file ? contentFileLoader(resolve(process.cwd(), file)) : workspaceLoader();
}

function workspaceLoader(): Loader {
    return {
        name: 'flexa-workspace',
        async load(context) {
            const url = env('FLEXA_URL');
            const apiKey = env('FLEXA_API_KEY');

            if (!url || !apiKey) {
                context.logger.warn('Set FLEXA_URL and FLEXA_API_KEY (or FLEXA_CONTENT_FILE) to load content.');

                return;
            }

            const entities = await createClient({ url, apiKey }).entities();

            context.store.clear();

            for (const { slug } of entities) {
                await flexaLoader({ entity: slug, url, apiKey }).load({
                    ...context,
                    store: {
                        set: (entry) => context.store.set({ ...entry, id: `${slug}/${entry.id}` }),
                        clear: () => {},
                    },
                });
            }
        },
    };
}

function contentFileLoader(path: string): Loader {
    const sync = async ({ store, logger, parseData, generateDigest }: LoaderContext): Promise<void> => {
        let content: ContentFile = {};

        try {
            content = JSON.parse(await readFile(path, 'utf8')) as ContentFile;
        } catch {
            logger.warn(`Could not read ${path}.`);
        }

        store.clear();

        for (const [entity, entries] of Object.entries(content.entities ?? {})) {
            for (const [slug, values] of Object.entries(entries)) {
                const id = `${entity}/${slug}`;
                const entry: Partial<Entry> = {
                    entity_slug: entity,
                    title: typeof values.title === 'string' ? values.title : null,
                    slug,
                    status: 'published',
                    values,
                };
                const data = await parseData({ id, data: entry as Values });
                store.set({ id, data, digest: generateDigest(data) });
            }
        }

        for (const [location, items] of Object.entries(content.menus ?? {})) {
            const id = `menus/${location}`;
            const data = await parseData({ id, data: { items } });
            store.set({ id, data, digest: generateDigest(data) });
        }
    };

    return {
        name: 'flexa-content-file',
        async load(context) {
            await sync(context);

            context.watcher?.add(path);
            context.watcher?.on('change', (changed) => {
                if (resolve(changed) === path) {
                    sync(context);
                }
            });
        },
    };
}
