import { getCollection } from 'astro:content';

type Values = Record<string, any>;

/** Entry of the collection, or undefined (getEntry() would log a warning). */
async function find(id: string): Promise<Values | undefined> {
    return (await getCollection('flexa', (entry) => entry.id === id))[0]?.data as Values | undefined;
}

/** The values of an entry, with its title and slug. */
function valuesOf(data: Values | undefined): Values {
    return data ? { title: data.title, slug: data.slug, ...(data.values ?? {}) } : {};
}

/**
 * Content of the site:
 *
 *     const page = await flexa.entity('home').get();
 *     const site = await flexa.site();
 *     const primaryMenu = await flexa.menu('primary');
 *     const posts = await flexa.collection('posts').list();
 */
export const flexa = {
    entity(slug: string) {
        return {
            async get(entrySlug = 'default'): Promise<Values> {
                return valuesOf(await find(`${slug}/${entrySlug}`));
            },
        };
    },

    /** Global content (header, footer…): the `default` entry of the `site` entity. */
    async site(): Promise<Values> {
        return this.entity('site').get('default');
    },

    /**
     * Items ({ title, url, target, children }) of the menu of a location, from
     * the content file or the `menus` value of the site entry. The array also
     * exposes them as `.items`.
     */
    async menu(location: string): Promise<Values[] & { items: Values[] }> {
        const local = await find(`menus/${location}`);
        const items: Values[] = local
            ? local.items
            : ((await this.site()).menus?.[location] ?? []);

        return Object.assign([...items], { items });
    },

    collection(slug: string) {
        return {
            async list(): Promise<Values[]> {
                const entries = await getCollection('flexa', (entry) => entry.id.startsWith(`${slug}/`));

                return entries.map((entry) => valuesOf(entry.data as Values));
            },
        };
    },
};
