import "server-only";

import { cache } from "react";
import { parse } from "yaml";
import {
  isMusicCollection,
  isMusicCollectionList,
  selectMusicCollectionBySid,
  setMusicCollectionSelected,
} from "../_tools/musicCollection";
import type { MusicCollection, RootMusicCollection } from "../types";

type MusicNameMap = Record<string, string>;

export const getSortedDefaultMusicCollection = cache(async (locale: string) => {
  const [musicCollection, musicNames] = await Promise.all([
    getMusicCollection(),
    getMusicNames(locale),
  ]);
  const localizedMusicCollection = localizeMusicCollection(
    musicCollection,
    musicNames,
  );
  const sortedMusicCollection = sortMusicCollection(localizedMusicCollection);
  return setDefalutSetting(sortedMusicCollection);
});

export function checkEnv(): void {
  if (!process.env.NEXT_PUBLIC_FETCH_DATA_URL)
    throw new Error(
      "Please set NEXT_PUBLIC_FETCH_URL_BASE environment variables and rebuild!",
    );
  if (!process.env.NEXT_PUBLIC_FETCH_MUSIC_URL_PREFIX)
    throw new Error(
      "Please set NEXT_PUBLIC_FETCH_MUSIC_URL_PREFIX environment variables and rebuild!",
    );
  const musicNamesUrl = process.env.NEXT_PUBLIC_FETCH_MUSIC_NAMES_URL;
  if (!musicNamesUrl)
    throw new Error(
      "Please set NEXT_PUBLIC_FETCH_MUSIC_NAMES_URL environment variables and rebuild!",
    );
  if (!musicNamesUrl.includes("{locale}"))
    throw new Error(
      "NEXT_PUBLIC_FETCH_MUSIC_NAMES_URL must include the {locale} placeholder.",
    );
}

const getMusicCollection = async (): Promise<RootMusicCollection> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_FETCH_DATA_URL}`, {
    next: { revalidate: 86_400, tags: ["music-collection"] },
  });
  if (!res.ok) throw new Error("Failed to fetch music collection");
  const text = await res.text();
  const data: RootMusicCollection = parse(text);
  return data;
};

const isMusicNameMap = (value: unknown): value is MusicNameMap => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((name) => typeof name === "string");
};

const getMusicNames = async (locale: string): Promise<MusicNameMap> => {
  if (locale === "zh-CN") return {};

  const urlTemplate = process.env.NEXT_PUBLIC_FETCH_MUSIC_NAMES_URL;
  if (!urlTemplate || !urlTemplate.includes("{locale}")) {
    throw new Error(
      "NEXT_PUBLIC_FETCH_MUSIC_NAMES_URL must include the {locale} placeholder.",
    );
  }

  const url = urlTemplate.replace("{locale}", locale);
  try {
    const res = await fetch(url, {
      next: {
        revalidate: 86_400,
        tags: ["music-names", `music-names-${locale}`],
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);

    const names: unknown = await res.json();
    if (!isMusicNameMap(names)) {
      throw new Error(`Invalid music names data: ${url}`);
    }
    return names;
  } catch (error) {
    console.error(`Failed to load ${locale} music names; using Chinese.`, error);
    return {};
  }
};

const localizeMusicCollection = (
  musicCollection: RootMusicCollection,
  names: MusicNameMap,
): RootMusicCollection => {
  const localizedMusicCollection = structuredClone(musicCollection);

  const visit = (collection: MusicCollection) => {
    collection.name = names[collection.uuid] ?? collection.name;
    for (const item of collection.data) {
      if (isMusicCollection(item)) {
        visit(item);
      } else {
        item.wikiName = item.name;
        item.name = names[item.uuid] ?? item.name;
      }
    }
  };

  visit(localizedMusicCollection);
  return localizedMusicCollection;
};

const sortMusicCollection = <Collection extends MusicCollection>(
  musicCollection: Collection,
): Collection => {
  musicCollection.data.sort((a, b) => a.idx - b.idx);
  for (const item of musicCollection.data) {
    if (isMusicCollection(item)) {
      sortMusicCollection(item);
    } else {
      break;
    }
  }
  return musicCollection;
};

const setDefalutSetting = (
  musicCollection: RootMusicCollection,
): RootMusicCollection => {
  setMusicCollectionSelected(musicCollection, false);
  generateSid(musicCollection);
  if (!musicCollection.defaultSelectedCollectionUuid) {
    throw new Error(
      "Music collection data is missing defaultSelectedCollectionUuid.",
    );
  }
  const defaultSelectedCollection = findMusicCollectionByUuid(
    musicCollection,
    musicCollection.defaultSelectedCollectionUuid,
  );
  if (!defaultSelectedCollection) {
    throw new Error(
      `Default selected collection ${musicCollection.defaultSelectedCollectionUuid} was not found in the music collection.`,
    );
  }
  selectMusicCollectionBySid(defaultSelectedCollection.sid, musicCollection);
  return musicCollection;
};

const findMusicCollectionByUuid = (
  musicCollection: MusicCollection,
  uuid: string,
): MusicCollection | undefined => {
  if (musicCollection.uuid === uuid) return musicCollection;
  if (!isMusicCollectionList(musicCollection.data)) return undefined;

  for (const collection of musicCollection.data) {
    const result = findMusicCollectionByUuid(collection, uuid);
    if (result) return result;
  }
  return undefined;
};

// 这样较为刻意地构造后，sid 可用于从上至下查找某一 sid 的位置
const generateSid = (musicCollection: MusicCollection) => {
  let sidCount = 0;
  const dfs = (musicCollection: MusicCollection) => {
    for (const item of musicCollection.data) {
      if (isMusicCollection(item)) {
        dfs(item);
      } else {
        item.sid = sidCount++;
      }
    }
    musicCollection.sid = sidCount++;
  };
  dfs(musicCollection);
};
