import { defineCollection } from 'astro:content';
import { flexaContent } from './lib/flexa-loaders';

/**
 * Every entry of the Flexa workspace in one collection, with `{entity}/{slug}`
 * ids. Read it through `src/lib/flexa.ts`.
 */
export const collections = {
    flexa: defineCollection({ loader: flexaContent() }),
};
