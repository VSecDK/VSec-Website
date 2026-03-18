declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"communities": {
"aarhus-citysec.md": {
	id: "aarhus-citysec.md";
  slug: "aarhus-citysec";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
"brunnerne.md": {
	id: "brunnerne.md";
  slug: "brunnerne";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
"bsides-aarhus.md": {
	id: "bsides-aarhus.md";
  slug: "bsides-aarhus";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
"bsides-kobenhavn.md": {
	id: "bsides-kobenhavn.md";
  slug: "bsides-kobenhavn";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
"cryptoaarhus.md": {
	id: "cryptoaarhus.md";
  slug: "cryptoaarhus";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
"cryptohagen.md": {
	id: "cryptohagen.md";
  slug: "cryptohagen";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
"hal9k.md": {
	id: "hal9k.md";
  slug: "hal9k";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
"jutlandia.md": {
	id: "jutlandia.md";
  slug: "jutlandia";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
"kalmarunionen.md": {
	id: "kalmarunionen.md";
  slug: "kalmarunionen";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
"labitat.md": {
	id: "labitat.md";
  slug: "labitat";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
"osaa.md": {
	id: "osaa.md";
  slug: "osaa";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
"owasp-aarhus.md": {
	id: "owasp-aarhus.md";
  slug: "owasp-aarhus";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
"owasp-copenhagen.md": {
	id: "owasp-copenhagen.md";
  slug: "owasp-copenhagen";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
"vsec.md": {
	id: "vsec.md";
  slug: "vsec";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
"zero-day-aarhus.md": {
	id: "zero-day-aarhus.md";
  slug: "zero-day-aarhus";
  body: string;
  collection: "communities";
  data: InferEntrySchema<"communities">
} & { render(): Render[".md"] };
};
"events": {
"2021-05-20-meetup-owasp-cph-norway-bank-hack-2021.md": {
	id: "2021-05-20-meetup-owasp-cph-norway-bank-hack-2021.md";
  slug: "2021-05-20-meetup-owasp-cph-norway-bank-hack-2021";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-06-27-meetup-cryptohagen-2021-06.md": {
	id: "2021-06-27-meetup-cryptohagen-2021-06.md";
  slug: "2021-06-27-meetup-cryptohagen-2021-06";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-07-01-workshop-owasp-cph-devsecops-2021.md": {
	id: "2021-07-01-workshop-owasp-cph-devsecops-2021.md";
  slug: "2021-07-01-workshop-owasp-cph-devsecops-2021";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-07-08-meetup-citysec-martino-2021.md": {
	id: "2021-07-08-meetup-citysec-martino-2021.md";
  slug: "2021-07-08-meetup-citysec-martino-2021";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-07-25-meetup-cryptohagen-2021-07.md": {
	id: "2021-07-25-meetup-cryptohagen-2021-07.md";
  slug: "2021-07-25-meetup-cryptohagen-2021-07";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-08-19-conference-bornhack-2021.md": {
	id: "2021-08-19-conference-bornhack-2021.md";
  slug: "2021-08-19-conference-bornhack-2021";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-08-19-workshop-vsec-cti-intro-2021.md": {
	id: "2021-08-19-workshop-vsec-cti-intro-2021.md";
  slug: "2021-08-19-workshop-vsec-cti-intro-2021";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-08-30-meetup-cryptohagen-2021-08.md": {
	id: "2021-08-30-meetup-cryptohagen-2021-08.md";
  slug: "2021-08-30-meetup-cryptohagen-2021-08";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-09-01-conference-sommerhack-2021.md": {
	id: "2021-09-01-conference-sommerhack-2021.md";
  slug: "2021-09-01-conference-sommerhack-2021";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-09-02-workshop-vsec-obsidian-workshop-2021.md": {
	id: "2021-09-02-workshop-vsec-obsidian-workshop-2021.md";
  slug: "2021-09-02-workshop-vsec-obsidian-workshop-2021";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-09-11-meetup-cryptoaarhus-2021-09.md": {
	id: "2021-09-11-meetup-cryptoaarhus-2021-09.md";
  slug: "2021-09-11-meetup-cryptoaarhus-2021-09";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-09-17-conference-bsides-kobenhavn-2021.md": {
	id: "2021-09-17-conference-bsides-kobenhavn-2021.md";
  slug: "2021-09-17-conference-bsides-kobenhavn-2021";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-09-26-meetup-cryptohagen-2021-09.md": {
	id: "2021-09-26-meetup-cryptohagen-2021-09.md";
  slug: "2021-09-26-meetup-cryptohagen-2021-09";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-10-05-workshop-improhound-workshop-2021.md": {
	id: "2021-10-05-workshop-improhound-workshop-2021.md";
  slug: "2021-10-05-workshop-improhound-workshop-2021";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-10-09-meetup-cryptoaarhus-2021-10.md": {
	id: "2021-10-09-meetup-cryptoaarhus-2021-10.md";
  slug: "2021-10-09-meetup-cryptoaarhus-2021-10";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-10-16-meetup-owasp-aarhus-2021-10.md": {
	id: "2021-10-16-meetup-owasp-aarhus-2021-10.md";
  slug: "2021-10-16-meetup-owasp-aarhus-2021-10";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-10-31-meetup-cryptohagen-2021-10.md": {
	id: "2021-10-31-meetup-cryptohagen-2021-10.md";
  slug: "2021-10-31-meetup-cryptohagen-2021-10";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-11-13-meetup-cryptoaarhus-2021-11.md": {
	id: "2021-11-13-meetup-cryptoaarhus-2021-11.md";
  slug: "2021-11-13-meetup-cryptoaarhus-2021-11";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-11-23-meetup-owasp-aarhus-2021-11.md": {
	id: "2021-11-23-meetup-owasp-aarhus-2021-11.md";
  slug: "2021-11-23-meetup-owasp-aarhus-2021-11";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-11-28-meetup-cryptohagen-2021-11.md": {
	id: "2021-11-28-meetup-cryptohagen-2021-11.md";
  slug: "2021-11-28-meetup-cryptohagen-2021-11";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2021-12-11-meetup-cryptoaarhus-2021-12.md": {
	id: "2021-12-11-meetup-cryptoaarhus-2021-12.md";
  slug: "2021-12-11-meetup-cryptoaarhus-2021-12";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-02-17-meetup-owasp-cph-war-stories-2022.md": {
	id: "2022-02-17-meetup-owasp-cph-war-stories-2022.md";
  slug: "2022-02-17-meetup-owasp-cph-war-stories-2022";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-03-01-meetup-owasp-aarhus-2022-03.md": {
	id: "2022-03-01-meetup-owasp-aarhus-2022-03.md";
  slug: "2022-03-01-meetup-owasp-aarhus-2022-03";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-03-16-meetup-vsec-citysec-hantwerk-2022.md": {
	id: "2022-03-16-meetup-vsec-citysec-hantwerk-2022.md";
  slug: "2022-03-16-meetup-vsec-citysec-hantwerk-2022";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-03-29-meetup-owasp-aarhus-2022-03b.md": {
	id: "2022-03-29-meetup-owasp-aarhus-2022-03b.md";
  slug: "2022-03-29-meetup-owasp-aarhus-2022-03b";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-04-09-meetup-cryptoaarhus-fairbar-2022.md": {
	id: "2022-04-09-meetup-cryptoaarhus-fairbar-2022.md";
  slug: "2022-04-09-meetup-cryptoaarhus-fairbar-2022";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-04-26-ctf-owasp-cph-hacking-talks-ctf-2022.md": {
	id: "2022-04-26-ctf-owasp-cph-hacking-talks-ctf-2022.md";
  slug: "2022-04-26-ctf-owasp-cph-hacking-talks-ctf-2022";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-04-26-meetup-owasp-aarhus-2022-04.md": {
	id: "2022-04-26-meetup-owasp-aarhus-2022-04.md";
  slug: "2022-04-26-meetup-owasp-aarhus-2022-04";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-05-24-meetup-owasp-aarhus-2022-05.md": {
	id: "2022-05-24-meetup-owasp-aarhus-2022-05.md";
  slug: "2022-05-24-meetup-owasp-aarhus-2022-05";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-06-21-meetup-owasp-aarhus-2022-06.md": {
	id: "2022-06-21-meetup-owasp-aarhus-2022-06.md";
  slug: "2022-06-21-meetup-owasp-aarhus-2022-06";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-06-26-meetup-cryptohagen-2022-06.md": {
	id: "2022-06-26-meetup-cryptohagen-2022-06.md";
  slug: "2022-06-26-meetup-cryptohagen-2022-06";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-08-03-conference-bornhack-2022.md": {
	id: "2022-08-03-conference-bornhack-2022.md";
  slug: "2022-08-03-conference-bornhack-2022";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-08-13-meetup-cryptoaarhus-2022-08.md": {
	id: "2022-08-13-meetup-cryptoaarhus-2022-08.md";
  slug: "2022-08-13-meetup-cryptoaarhus-2022-08";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-08-30-meetup-owasp-aarhus-2022-08.md": {
	id: "2022-08-30-meetup-owasp-aarhus-2022-08.md";
  slug: "2022-08-30-meetup-owasp-aarhus-2022-08";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-10-08-conference-bsides-copenhagen-2022.md": {
	id: "2022-10-08-conference-bsides-copenhagen-2022.md";
  slug: "2022-10-08-conference-bsides-copenhagen-2022";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-10-13-meetup-aarhus-citysec-2022-2.md": {
	id: "2022-10-13-meetup-aarhus-citysec-2022-2.md";
  slug: "2022-10-13-meetup-aarhus-citysec-2022-2";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-10-25-meetup-owasp-aarhus-2022-10.md": {
	id: "2022-10-25-meetup-owasp-aarhus-2022-10.md";
  slug: "2022-10-25-meetup-owasp-aarhus-2022-10";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-11-09-workshop-owasp-cph-secure-coding-2022.md": {
	id: "2022-11-09-workshop-owasp-cph-secure-coding-2022.md";
  slug: "2022-11-09-workshop-owasp-cph-secure-coding-2022";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2022-12-01-meetup-owasp-aarhus-2022-12.md": {
	id: "2022-12-01-meetup-owasp-aarhus-2022-12.md";
  slug: "2022-12-01-meetup-owasp-aarhus-2022-12";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-01-29-meetup-cryptohagen-2023-01.md": {
	id: "2023-01-29-meetup-cryptohagen-2023-01.md";
  slug: "2023-01-29-meetup-cryptohagen-2023-01";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-01-31-meetup-owasp-aarhus-2023-01.md": {
	id: "2023-01-31-meetup-owasp-aarhus-2023-01.md";
  slug: "2023-01-31-meetup-owasp-aarhus-2023-01";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-02-11-meetup-cryptoaarhus-2023-02.md": {
	id: "2023-02-11-meetup-cryptoaarhus-2023-02.md";
  slug: "2023-02-11-meetup-cryptoaarhus-2023-02";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-02-26-meetup-cryptohagen-2023-02.md": {
	id: "2023-02-26-meetup-cryptohagen-2023-02.md";
  slug: "2023-02-26-meetup-cryptohagen-2023-02";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-02-28-meetup-owasp-aarhus-2023-02.md": {
	id: "2023-02-28-meetup-owasp-aarhus-2023-02.md";
  slug: "2023-02-28-meetup-owasp-aarhus-2023-02";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-03-11-meetup-cryptoaarhus-2023-03.md": {
	id: "2023-03-11-meetup-cryptoaarhus-2023-03.md";
  slug: "2023-03-11-meetup-cryptoaarhus-2023-03";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-03-15-meetup-aarhus-citysec-2023-1.md": {
	id: "2023-03-15-meetup-aarhus-citysec-2023-1.md";
  slug: "2023-03-15-meetup-aarhus-citysec-2023-1";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-03-26-meetup-cryptohagen-2023-03.md": {
	id: "2023-03-26-meetup-cryptohagen-2023-03.md";
  slug: "2023-03-26-meetup-cryptohagen-2023-03";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-03-27-meetup-owasp-aarhus-2023-03-virtual.md": {
	id: "2023-03-27-meetup-owasp-aarhus-2023-03-virtual.md";
  slug: "2023-03-27-meetup-owasp-aarhus-2023-03-virtual";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-04-08-meetup-cryptoaarhus-2023-04.md": {
	id: "2023-04-08-meetup-cryptoaarhus-2023-04.md";
  slug: "2023-04-08-meetup-cryptoaarhus-2023-04";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-05-23-meetup-aarhus-citysec-2023-2.md": {
	id: "2023-05-23-meetup-aarhus-citysec-2023-2.md";
  slug: "2023-05-23-meetup-aarhus-citysec-2023-2";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-08-02-conference-bornhack-2023.md": {
	id: "2023-08-02-conference-bornhack-2023.md";
  slug: "2023-08-02-conference-bornhack-2023";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-08-17-meetup-aarhus-citysec-2023-3.md": {
	id: "2023-08-17-meetup-aarhus-citysec-2023-3.md";
  slug: "2023-08-17-meetup-aarhus-citysec-2023-3";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-08-23-conference-summerhack-2023.md": {
	id: "2023-08-23-conference-summerhack-2023.md";
  slug: "2023-08-23-conference-summerhack-2023";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-11-08-meetup-aarhus-citysec-2023-4.md": {
	id: "2023-11-08-meetup-aarhus-citysec-2023-4.md";
  slug: "2023-11-08-meetup-aarhus-citysec-2023-4";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2023-11-11-conference-bsides-kobenhavn-2023.md": {
	id: "2023-11-11-conference-bsides-kobenhavn-2023.md";
  slug: "2023-11-11-conference-bsides-kobenhavn-2023";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2026-03-12-conference-tech-hub-aarhus-day.md": {
	id: "2026-03-12-conference-tech-hub-aarhus-day.md";
  slug: "2026-03-12-conference-tech-hub-aarhus-day";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2026-04-01-conference-cyber-security-dagen-2026.md": {
	id: "2026-04-01-conference-cyber-security-dagen-2026.md";
  slug: "2026-04-01-conference-cyber-security-dagen-2026";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2026-04-15-conference-ot-security-summit.md": {
	id: "2026-04-15-conference-ot-security-summit.md";
  slug: "2026-04-15-conference-ot-security-summit";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2026-05-06-conference-v2-security-2026.md": {
	id: "2026-05-06-conference-v2-security-2026.md";
  slug: "2026-05-06-conference-v2-security-2026";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2026-05-20-meetup-citysec-q2.md": {
	id: "2026-05-20-meetup-citysec-q2.md";
  slug: "2026-05-20-meetup-citysec-q2";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2026-06-20-conference-bsides-aarhus.md": {
	id: "2026-06-20-conference-bsides-aarhus.md";
  slug: "2026-06-20-conference-bsides-aarhus";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2026-09-01-conference-industrial-security-conference-copenhagen.md": {
	id: "2026-09-01-conference-industrial-security-conference-copenhagen.md";
  slug: "2026-09-01-conference-industrial-security-conference-copenhagen";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2026-10-07-meetup-citysec-q3.md": {
	id: "2026-10-07-meetup-citysec-q3.md";
  slug: "2026-10-07-meetup-citysec-q3";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
"2026-11-18-meetup-citysec-q4.md": {
	id: "2026-11-18-meetup-citysec-q4.md";
  slug: "2026-11-18-meetup-citysec-q4";
  body: string;
  collection: "events";
  data: InferEntrySchema<"events">
} & { render(): Render[".md"] };
};
"incidents": {
"2017-06-27-ransomware-maersk.md": {
	id: "2017-06-27-ransomware-maersk.md";
  slug: "2017-06-27-ransomware-maersk";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2019-09-03-ransomware-demant.md": {
	id: "2019-09-03-ransomware-demant.md";
  slug: "2019-09-03-ransomware-demant";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2020-02-17-ransomware-iss.md": {
	id: "2020-02-17-ransomware-iss.md";
  slug: "2020-02-17-ransomware-iss";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2020-04-07-ransomware-desmi.md": {
	id: "2020-04-07-ransomware-desmi.md";
  slug: "2020-04-07-ransomware-desmi";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2020-12-13-supply-chain-solarwinds.md": {
	id: "2020-12-13-supply-chain-solarwinds.md";
  slug: "2020-12-13-supply-chain-solarwinds";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2021-06-04-ransomware-kompan.md": {
	id: "2021-06-04-ransomware-kompan.md";
  slug: "2021-06-04-ransomware-kompan";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2021-06-09-ransomware-techhotel.md": {
	id: "2021-06-09-ransomware-techhotel.md";
  slug: "2021-06-09-ransomware-techhotel";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2021-06-22-ransomware-bauhaus.md": {
	id: "2021-06-22-ransomware-bauhaus.md";
  slug: "2021-06-22-ransomware-bauhaus";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2021-07-03-supply-chain-kaseya.md": {
	id: "2021-07-03-supply-chain-kaseya.md";
  slug: "2021-07-03-supply-chain-kaseya";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2021-10-29-ransomware-illum.md": {
	id: "2021-10-29-ransomware-illum.md";
  slug: "2021-10-29-ransomware-illum";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2021-11-20-ransomware-vestas.md": {
	id: "2021-11-20-ransomware-vestas.md";
  slug: "2021-11-20-ransomware-vestas";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2021-12-22-unknown-wuerth-danmark.md": {
	id: "2021-12-22-unknown-wuerth-danmark.md";
  slug: "2021-12-22-unknown-wuerth-danmark";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2022-02-04-ransomware-sit.md": {
	id: "2022-02-04-ransomware-sit.md";
  slug: "2022-02-04-ransomware-sit";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2022-03-01-ransomware-lifa.md": {
	id: "2022-03-01-ransomware-lifa.md";
  slug: "2022-03-01-ransomware-lifa";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2022-03-13-ransomware-scanvogn.md": {
	id: "2022-03-13-ransomware-scanvogn.md";
  slug: "2022-03-13-ransomware-scanvogn";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2022-03-19-ransomware-nordex-food.md": {
	id: "2022-03-19-ransomware-nordex-food.md";
  slug: "2022-03-19-ransomware-nordex-food";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2022-03-29-unknown-daka.md": {
	id: "2022-03-29-unknown-daka.md";
  slug: "2022-03-29-unknown-daka";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2022-04-18-ransomware-jbs.md": {
	id: "2022-04-18-ransomware-jbs.md";
  slug: "2022-04-18-ransomware-jbs";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2022-06-13-dataleak-gyldendal.md": {
	id: "2022-06-13-dataleak-gyldendal.md";
  slug: "2022-06-13-dataleak-gyldendal";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2022-06-17-hacking-actas.md": {
	id: "2022-06-17-hacking-actas.md";
  slug: "2022-06-17-hacking-actas";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2022-06-24-ransomware-lokaltog.md": {
	id: "2022-06-24-ransomware-lokaltog.md";
  slug: "2022-06-24-ransomware-lokaltog";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2022-08-08-ransomware-7eleven.md": {
	id: "2022-08-08-ransomware-7eleven.md";
  slug: "2022-08-08-ransomware-7eleven";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2022-08-09-ransomware-ista.md": {
	id: "2022-08-09-ransomware-ista.md";
  slug: "2022-08-09-ransomware-ista";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
"2022-10-29-hacking-supeo.md": {
	id: "2022-10-29-hacking-supeo.md";
  slug: "2022-10-29-hacking-supeo";
  body: string;
  collection: "incidents";
  data: InferEntrySchema<"incidents">
} & { render(): Render[".md"] };
};
"learning": {
"campfire-security.md": {
	id: "campfire-security.md";
  slug: "campfire-security";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"darknet-diaries.md": {
	id: "darknet-diaries.md";
  slug: "darknet-diaries";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"dvwa.md": {
	id: "dvwa.md";
  slug: "dvwa";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"exploit-db.md": {
	id: "exploit-db.md";
  slug: "exploit-db";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"gtfobins.md": {
	id: "gtfobins.md";
  slug: "gtfobins";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"hacksplaining.md": {
	id: "hacksplaining.md";
  slug: "hacksplaining";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"hackthebox.md": {
	id: "hackthebox.md";
  slug: "hackthebox";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"hacktricks.md": {
	id: "hacktricks.md";
  slug: "hacktricks";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"ippsec.md": {
	id: "ippsec.md";
  slug: "ippsec";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"liveoverflow.md": {
	id: "liveoverflow.md";
  slug: "liveoverflow";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"lolbas.md": {
	id: "lolbas.md";
  slug: "lolbas";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"malicious-life.md": {
	id: "malicious-life.md";
  slug: "malicious-life";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"mitre-attck.md": {
	id: "mitre-attck.md";
  slug: "mitre-attck";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"offsec-pwk.md": {
	id: "offsec-pwk.md";
  slug: "offsec-pwk";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"overthewire.md": {
	id: "overthewire.md";
  slug: "overthewire";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"owasp-wstg.md": {
	id: "owasp-wstg.md";
  slug: "owasp-wstg";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"owasp.md": {
	id: "owasp.md";
  slug: "owasp";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"payloads-all-the-things.md": {
	id: "payloads-all-the-things.md";
  slug: "payloads-all-the-things";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"pentesterlab.md": {
	id: "pentesterlab.md";
  slug: "pentesterlab";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"portswigger.md": {
	id: "portswigger.md";
  slug: "portswigger";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"risky-business.md": {
	id: "risky-business.md";
  slug: "risky-business";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"sagalabs.md": {
	id: "sagalabs.md";
  slug: "sagalabs";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"sans-stormcast.md": {
	id: "sans-stormcast.md";
  slug: "sans-stormcast";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"security-now.md": {
	id: "security-now.md";
  slug: "security-now";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"smashing-security.md": {
	id: "smashing-security.md";
  slug: "smashing-security";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"snyk-learn.md": {
	id: "snyk-learn.md";
  slug: "snyk-learn";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"tcm-security.md": {
	id: "tcm-security.md";
  slug: "tcm-security";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"tryhackme.md": {
	id: "tryhackme.md";
  slug: "tryhackme";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
"webgoat.md": {
	id: "webgoat.md";
  slug: "webgoat";
  body: string;
  collection: "learning";
  data: InferEntrySchema<"learning">
} & { render(): Render[".md"] };
};
"members": {
"001-kristian-bodeholt.md": {
	id: "001-kristian-bodeholt.md";
  slug: "001-kristian-bodeholt";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"002-klaus-agnoletti.md": {
	id: "002-klaus-agnoletti.md";
  slug: "002-klaus-agnoletti";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"003-j-rgen-skov-rasmussen.md": {
	id: "003-j-rgen-skov-rasmussen.md";
  slug: "003-j-rgen-skov-rasmussen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"004-dennis-perto.md": {
	id: "004-dennis-perto.md";
  slug: "004-dennis-perto";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"005-michael-pedersen.md": {
	id: "005-michael-pedersen.md";
  slug: "005-michael-pedersen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"006-andrada-son.md": {
	id: "006-andrada-son.md";
  slug: "006-andrada-son";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"010-jesper-kastoft-bertelsen.md": {
	id: "010-jesper-kastoft-bertelsen.md";
  slug: "010-jesper-kastoft-bertelsen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"011-flemming-jacobsen.md": {
	id: "011-flemming-jacobsen.md";
  slug: "011-flemming-jacobsen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"012-martin-gohs.md": {
	id: "012-martin-gohs.md";
  slug: "012-martin-gohs";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"013-dennis-lund-christiansen.md": {
	id: "013-dennis-lund-christiansen.md";
  slug: "013-dennis-lund-christiansen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"014-jesper-hestkj-r.md": {
	id: "014-jesper-hestkj-r.md";
  slug: "014-jesper-hestkj-r";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"015-lasse-seidler.md": {
	id: "015-lasse-seidler.md";
  slug: "015-lasse-seidler";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"016-s-ren-fritzb-ger.md": {
	id: "016-s-ren-fritzb-ger.md";
  slug: "016-s-ren-fritzb-ger";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"017-christopher-buch.md": {
	id: "017-christopher-buch.md";
  slug: "017-christopher-buch";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"018-lars-wurtz-hammer.md": {
	id: "018-lars-wurtz-hammer.md";
  slug: "018-lars-wurtz-hammer";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"019-christian-m-lvadgaard.md": {
	id: "019-christian-m-lvadgaard.md";
  slug: "019-christian-m-lvadgaard";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"020-tobias-dala.md": {
	id: "020-tobias-dala.md";
  slug: "020-tobias-dala";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"021-ismail-botan.md": {
	id: "021-ismail-botan.md";
  slug: "021-ismail-botan";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"022-dennis-rand.md": {
	id: "022-dennis-rand.md";
  slug: "022-dennis-rand";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"023-emil-stahl.md": {
	id: "023-emil-stahl.md";
  slug: "023-emil-stahl";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"024-niklas-reusch.md": {
	id: "024-niklas-reusch.md";
  slug: "024-niklas-reusch";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"025-martin-boller.md": {
	id: "025-martin-boller.md";
  slug: "025-martin-boller";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"026-kent-adel-rasmussen.md": {
	id: "026-kent-adel-rasmussen.md";
  slug: "026-kent-adel-rasmussen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"027-claus-houmann.md": {
	id: "027-claus-houmann.md";
  slug: "027-claus-houmann";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"028-niklas-hansen.md": {
	id: "028-niklas-hansen.md";
  slug: "028-niklas-hansen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"029-ian-qvist.md": {
	id: "029-ian-qvist.md";
  slug: "029-ian-qvist";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"030-alexander-matzen.md": {
	id: "030-alexander-matzen.md";
  slug: "030-alexander-matzen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"031-victor-buch-hansen.md": {
	id: "031-victor-buch-hansen.md";
  slug: "031-victor-buch-hansen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"032-morten-lond.md": {
	id: "032-morten-lond.md";
  slug: "032-morten-lond";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"033-mathias-nordahl-rasmussen.md": {
	id: "033-mathias-nordahl-rasmussen.md";
  slug: "033-mathias-nordahl-rasmussen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"034-jonas-smedegaard.md": {
	id: "034-jonas-smedegaard.md";
  slug: "034-jonas-smedegaard";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"035-niels-ulrich-matthiessen.md": {
	id: "035-niels-ulrich-matthiessen.md";
  slug: "035-niels-ulrich-matthiessen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"036-pelle-jensen.md": {
	id: "036-pelle-jensen.md";
  slug: "036-pelle-jensen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"037-rasmus-h-g.md": {
	id: "037-rasmus-h-g.md";
  slug: "037-rasmus-h-g";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"038-hamid-jabbari-ilkhechi.md": {
	id: "038-hamid-jabbari-ilkhechi.md";
  slug: "038-hamid-jabbari-ilkhechi";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"039-alessandro-bruni.md": {
	id: "039-alessandro-bruni.md";
  slug: "039-alessandro-bruni";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"040-simon-b-laursen.md": {
	id: "040-simon-b-laursen.md";
  slug: "040-simon-b-laursen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"041-mitchell-impey.md": {
	id: "041-mitchell-impey.md";
  slug: "041-mitchell-impey";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"042-magnus-demant.md": {
	id: "042-magnus-demant.md";
  slug: "042-magnus-demant";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"043-lasse-moisen.md": {
	id: "043-lasse-moisen.md";
  slug: "043-lasse-moisen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"044-heino-skj-tt.md": {
	id: "044-heino-skj-tt.md";
  slug: "044-heino-skj-tt";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"045-mathias-kristensen.md": {
	id: "045-mathias-kristensen.md";
  slug: "045-mathias-kristensen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"046-ronnie-salomonsen.md": {
	id: "046-ronnie-salomonsen.md";
  slug: "046-ronnie-salomonsen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"047-sebastian-fischer.md": {
	id: "047-sebastian-fischer.md";
  slug: "047-sebastian-fischer";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"048-nangialy-nabi-zada.md": {
	id: "048-nangialy-nabi-zada.md";
  slug: "048-nangialy-nabi-zada";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"049-petrut-jianu.md": {
	id: "049-petrut-jianu.md";
  slug: "049-petrut-jianu";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"050-thomas-ljungberg-kristensen.md": {
	id: "050-thomas-ljungberg-kristensen.md";
  slug: "050-thomas-ljungberg-kristensen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"052-josefine-ehlers-davidsen.md": {
	id: "052-josefine-ehlers-davidsen.md";
  slug: "052-josefine-ehlers-davidsen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"053-ramal-safi.md": {
	id: "053-ramal-safi.md";
  slug: "053-ramal-safi";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"054-emil-h-rning.md": {
	id: "054-emil-h-rning.md";
  slug: "054-emil-h-rning";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"055-lars-westergaard-birch.md": {
	id: "055-lars-westergaard-birch.md";
  slug: "055-lars-westergaard-birch";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"056-jay-christiansen.md": {
	id: "056-jay-christiansen.md";
  slug: "056-jay-christiansen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"057-brian-munk-jensen.md": {
	id: "057-brian-munk-jensen.md";
  slug: "057-brian-munk-jensen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"058-rasmus-s-rensen.md": {
	id: "058-rasmus-s-rensen.md";
  slug: "058-rasmus-s-rensen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"059-jonas-kunert.md": {
	id: "059-jonas-kunert.md";
  slug: "059-jonas-kunert";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"060-silvio-condric.md": {
	id: "060-silvio-condric.md";
  slug: "060-silvio-condric";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"061-rasmus-vestergaard.md": {
	id: "061-rasmus-vestergaard.md";
  slug: "061-rasmus-vestergaard";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"062-sia-m-ller.md": {
	id: "062-sia-m-ller.md";
  slug: "062-sia-m-ller";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"063-rasmus-riis.md": {
	id: "063-rasmus-riis.md";
  slug: "063-rasmus-riis";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"064-shittal-shrestha.md": {
	id: "064-shittal-shrestha.md";
  slug: "064-shittal-shrestha";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"065-lorena-ronquillo.md": {
	id: "065-lorena-ronquillo.md";
  slug: "065-lorena-ronquillo";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"066-frederik-b-geskov-krogsgaard.md": {
	id: "066-frederik-b-geskov-krogsgaard.md";
  slug: "066-frederik-b-geskov-krogsgaard";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"067-denes-oliver-ovari.md": {
	id: "067-denes-oliver-ovari.md";
  slug: "067-denes-oliver-ovari";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"068-babak-bandpey.md": {
	id: "068-babak-bandpey.md";
  slug: "068-babak-bandpey";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"069-henrik-larsson.md": {
	id: "069-henrik-larsson.md";
  slug: "069-henrik-larsson";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"070-frederik-leed.md": {
	id: "070-frederik-leed.md";
  slug: "070-frederik-leed";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"071-michael-borchmann.md": {
	id: "071-michael-borchmann.md";
  slug: "071-michael-borchmann";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"072-martin-nielsen.md": {
	id: "072-martin-nielsen.md";
  slug: "072-martin-nielsen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"073-thor-kristiansen.md": {
	id: "073-thor-kristiansen.md";
  slug: "073-thor-kristiansen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"074-roland-j-rgensen.md": {
	id: "074-roland-j-rgensen.md";
  slug: "074-roland-j-rgensen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"075-niklas-falk.md": {
	id: "075-niklas-falk.md";
  slug: "075-niklas-falk";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"076-kasper-houlind.md": {
	id: "076-kasper-houlind.md";
  slug: "076-kasper-houlind";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"077-gustav-stofberg.md": {
	id: "077-gustav-stofberg.md";
  slug: "077-gustav-stofberg";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"078-stefan-daugaard-poulsen.md": {
	id: "078-stefan-daugaard-poulsen.md";
  slug: "078-stefan-daugaard-poulsen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"079-thomas-arnskov-holdgaard-lutzen.md": {
	id: "079-thomas-arnskov-holdgaard-lutzen.md";
  slug: "079-thomas-arnskov-holdgaard-lutzen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"080-mousa-yuusufi.md": {
	id: "080-mousa-yuusufi.md";
  slug: "080-mousa-yuusufi";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"081-karsten-jefsen.md": {
	id: "081-karsten-jefsen.md";
  slug: "081-karsten-jefsen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"082-rasmus-barner.md": {
	id: "082-rasmus-barner.md";
  slug: "082-rasmus-barner";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"083-linus-lagerhjelm.md": {
	id: "083-linus-lagerhjelm.md";
  slug: "083-linus-lagerhjelm";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"084-nikolaj-jensen-holm.md": {
	id: "084-nikolaj-jensen-holm.md";
  slug: "084-nikolaj-jensen-holm";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"085-daniel-stuhr-petersen.md": {
	id: "085-daniel-stuhr-petersen.md";
  slug: "085-daniel-stuhr-petersen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"086-kim-schulz.md": {
	id: "086-kim-schulz.md";
  slug: "086-kim-schulz";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"087-asbj-rn-hoffskov-lund.md": {
	id: "087-asbj-rn-hoffskov-lund.md";
  slug: "087-asbj-rn-hoffskov-lund";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"088-mikkel-mikjaer-christensen.md": {
	id: "088-mikkel-mikjaer-christensen.md";
  slug: "088-mikkel-mikjaer-christensen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"089-torben-krogh-johansen.md": {
	id: "089-torben-krogh-johansen.md";
  slug: "089-torben-krogh-johansen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"090-casper-mach-munksgaard.md": {
	id: "090-casper-mach-munksgaard.md";
  slug: "090-casper-mach-munksgaard";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"091-christian-henriksen.md": {
	id: "091-christian-henriksen.md";
  slug: "091-christian-henriksen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"092-jette-jerndal.md": {
	id: "092-jette-jerndal.md";
  slug: "092-jette-jerndal";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"093-freddy-murre.md": {
	id: "093-freddy-murre.md";
  slug: "093-freddy-murre";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"094-simon-refslund.md": {
	id: "094-simon-refslund.md";
  slug: "094-simon-refslund";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"095-dominykas-vaitkus.md": {
	id: "095-dominykas-vaitkus.md";
  slug: "095-dominykas-vaitkus";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"096-carl-melgaard.md": {
	id: "096-carl-melgaard.md";
  slug: "096-carl-melgaard";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"097-jesper-stark.md": {
	id: "097-jesper-stark.md";
  slug: "097-jesper-stark";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"098-anders-ernstpriis-kusk.md": {
	id: "098-anders-ernstpriis-kusk.md";
  slug: "098-anders-ernstpriis-kusk";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"099-morten-von-seelen.md": {
	id: "099-morten-von-seelen.md";
  slug: "099-morten-von-seelen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"100-anders-str-m-m-ller.md": {
	id: "100-anders-str-m-m-ller.md";
  slug: "100-anders-str-m-m-ller";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"101-henrik-frands-wojcik.md": {
	id: "101-henrik-frands-wojcik.md";
  slug: "101-henrik-frands-wojcik";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"102-anders-h-gedal-kortsen.md": {
	id: "102-anders-h-gedal-kortsen.md";
  slug: "102-anders-h-gedal-kortsen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"103-karsten-laursen.md": {
	id: "103-karsten-laursen.md";
  slug: "103-karsten-laursen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"104-rasmus-lau-petersen.md": {
	id: "104-rasmus-lau-petersen.md";
  slug: "104-rasmus-lau-petersen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"105-mogens-hede-villumsen.md": {
	id: "105-mogens-hede-villumsen.md";
  slug: "105-mogens-hede-villumsen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"106-jonas-h-jer.md": {
	id: "106-jonas-h-jer.md";
  slug: "106-jonas-h-jer";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"107-william-ben-embarek.md": {
	id: "107-william-ben-embarek.md";
  slug: "107-william-ben-embarek";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"108-tomas-kr-mer.md": {
	id: "108-tomas-kr-mer.md";
  slug: "108-tomas-kr-mer";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"109-casper-jensen.md": {
	id: "109-casper-jensen.md";
  slug: "109-casper-jensen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"110-avesta-fahimipour.md": {
	id: "110-avesta-fahimipour.md";
  slug: "110-avesta-fahimipour";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"111-mikkel-korsgaard-clement.md": {
	id: "111-mikkel-korsgaard-clement.md";
  slug: "111-mikkel-korsgaard-clement";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"112-jakob-nordenlund.md": {
	id: "112-jakob-nordenlund.md";
  slug: "112-jakob-nordenlund";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"113-jesper-have.md": {
	id: "113-jesper-have.md";
  slug: "113-jesper-have";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"114-sebastian-birk.md": {
	id: "114-sebastian-birk.md";
  slug: "114-sebastian-birk";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"115-chanthosh-sivanandam.md": {
	id: "115-chanthosh-sivanandam.md";
  slug: "115-chanthosh-sivanandam";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"116-gustav-ask-larsen.md": {
	id: "116-gustav-ask-larsen.md";
  slug: "116-gustav-ask-larsen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"117-martin-nygaard-christensen.md": {
	id: "117-martin-nygaard-christensen.md";
  slug: "117-martin-nygaard-christensen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"118-marc-munk.md": {
	id: "118-marc-munk.md";
  slug: "118-marc-munk";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"119-bertram-madsen.md": {
	id: "119-bertram-madsen.md";
  slug: "119-bertram-madsen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"120-sarah-vangs-e-wohlin.md": {
	id: "120-sarah-vangs-e-wohlin.md";
  slug: "120-sarah-vangs-e-wohlin";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"121-kim-emanuelsen.md": {
	id: "121-kim-emanuelsen.md";
  slug: "121-kim-emanuelsen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"122-anders-grundal-kahlke.md": {
	id: "122-anders-grundal-kahlke.md";
  slug: "122-anders-grundal-kahlke";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"123-philip-heidemann-jensen.md": {
	id: "123-philip-heidemann-jensen.md";
  slug: "123-philip-heidemann-jensen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"124-patrick-rotman.md": {
	id: "124-patrick-rotman.md";
  slug: "124-patrick-rotman";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"125-kevin-k-kragh.md": {
	id: "125-kevin-k-kragh.md";
  slug: "125-kevin-k-kragh";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"126-martin-sohn.md": {
	id: "126-martin-sohn.md";
  slug: "126-martin-sohn";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"127-simon-christensen.md": {
	id: "127-simon-christensen.md";
  slug: "127-simon-christensen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"128-lars-gottschalk.md": {
	id: "128-lars-gottschalk.md";
  slug: "128-lars-gottschalk";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"129-marcus-sand.md": {
	id: "129-marcus-sand.md";
  slug: "129-marcus-sand";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"130-oliver-nordestgaard.md": {
	id: "130-oliver-nordestgaard.md";
  slug: "130-oliver-nordestgaard";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"131-qendrim-fazliu.md": {
	id: "131-qendrim-fazliu.md";
  slug: "131-qendrim-fazliu";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"132-marcus-lyngbye-kolbe.md": {
	id: "132-marcus-lyngbye-kolbe.md";
  slug: "132-marcus-lyngbye-kolbe";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"133-sami-andersen.md": {
	id: "133-sami-andersen.md";
  slug: "133-sami-andersen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"134-lars-bo-frydenskov.md": {
	id: "134-lars-bo-frydenskov.md";
  slug: "134-lars-bo-frydenskov";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"135-magnus-schmidt.md": {
	id: "135-magnus-schmidt.md";
  slug: "135-magnus-schmidt";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"136-ronni-ravn-skansing.md": {
	id: "136-ronni-ravn-skansing.md";
  slug: "136-ronni-ravn-skansing";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"137-simon-max-nielsen.md": {
	id: "137-simon-max-nielsen.md";
  slug: "137-simon-max-nielsen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"138-malene-krambech.md": {
	id: "138-malene-krambech.md";
  slug: "138-malene-krambech";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"139-amar-djebbara.md": {
	id: "139-amar-djebbara.md";
  slug: "139-amar-djebbara";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"140-mads-legard-nielsen.md": {
	id: "140-mads-legard-nielsen.md";
  slug: "140-mads-legard-nielsen";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
"141-casper-skyum-h-gh.md": {
	id: "141-casper-skyum-h-gh.md";
  slug: "141-casper-skyum-h-gh";
  body: string;
  collection: "members";
  data: InferEntrySchema<"members">
} & { render(): Render[".md"] };
};
"posts": {
"2021-06-01-introduction-and-community-pledge.md": {
	id: "2021-06-01-introduction-and-community-pledge.md";
  slug: "2021-06-01-introduction-and-community-pledge";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"2021-09-11-using-securitytxt-to-improve-communication-and-collaboration.md": {
	id: "2021-09-11-using-securitytxt-to-improve-communication-and-collaboration.md";
  slug: "2021-09-11-using-securitytxt-to-improve-communication-and-collaboration";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"2022-04-02-community-spotlight-christian-henriksen.md": {
	id: "2022-04-02-community-spotlight-christian-henriksen.md";
  slug: "2022-04-02-community-spotlight-christian-henriksen";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"2022-06-20-community-spotlight-asbjorn-hoffskov.md": {
	id: "2022-06-20-community-spotlight-asbjorn-hoffskov.md";
  slug: "2022-06-20-community-spotlight-asbjorn-hoffskov";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"2022-09-13-community-article-aveste-hunting-windows-event-logs.md": {
	id: "2022-09-13-community-article-aveste-hunting-windows-event-logs.md";
  slug: "2022-09-13-community-article-aveste-hunting-windows-event-logs";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"2023-05-07-community-spotlight-sarah-wohlin.md": {
	id: "2023-05-07-community-spotlight-sarah-wohlin.md";
  slug: "2023-05-07-community-spotlight-sarah-wohlin";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"2024-02-29-community-spotlight-lars-bo-frydenskov.md": {
	id: "2024-02-29-community-spotlight-lars-bo-frydenskov.md";
  slug: "2024-02-29-community-spotlight-lars-bo-frydenskov";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
};
"projects": Record<string, {
  id: string;
  slug: string;
  body: string;
  collection: "projects";
  data: InferEntrySchema<"projects">;
  render(): Render[".md"];
}>;
"sponsors": {
"eksempel-sponsor.md": {
	id: "eksempel-sponsor.md";
  slug: "eksempel-sponsor";
  body: string;
  collection: "sponsors";
  data: InferEntrySchema<"sponsors">
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("./../../src/content/config.js");
}
