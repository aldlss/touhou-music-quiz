import { cache } from "react";
import { parse } from "yaml";
import {
  ErrorType,
  Music,
  MusicCollection,
  QuizMusic,
  RootMusicCollection,
} from "./types";
import { fetchMusicUrlPrefix } from "./constant";

type MusicNameMap = Record<string, string>;

export const getSortedDefaultMusicCollection = cache(async (locale: string) => {
  const musicCollection = await getMusicCollection();
  const musicNames = await getMusicNames(locale);
  const localizedMusicCollection = localizeMusicCollection(
    musicCollection,
    musicNames,
  );
  const sortedMusicCollection = sortMusicCollection(localizedMusicCollection);
  const defaultMusicCollection = setDefalutSetting(sortedMusicCollection);
  return defaultMusicCollection;
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

export function isMusicCollection(
  item: Music | MusicCollection,
): item is MusicCollection {
  return (item as MusicCollection).data !== undefined;
}

export function isMusicCollectionList(
  items: Music[] | MusicCollection[],
): items is MusicCollection[] {
  return items.length === 0 || isMusicCollection(items[0]);
}

export function isMusicList(
  items: Music[] | MusicCollection[],
): items is Music[] {
  return items.length === 0 || !isMusicCollection(items[0]);
}

export async function fetchDocsText(url: string): Promise<string> {
  const res = await fetch(url, {
    next: { revalidate: 86_400, tags: ["docs"] },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return await res.text();
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
    throw new Error("曲库数据缺少 defaultSelectedCollectionUuid。");
  }
  const defaultSelectedCollection = findMusicCollectionByUuid(
    musicCollection,
    musicCollection.defaultSelectedCollectionUuid,
  );
  if (!defaultSelectedCollection) {
    throw new Error(
      `默认选中分类 ${musicCollection.defaultSelectedCollectionUuid} 不在曲库中。`,
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

export const setMusicCollectionSelected = (
  musicCollection: MusicCollection,
  selected: boolean,
): number => {
  let sum = 0;

  for (const item of musicCollection.data) {
    if (isMusicCollection(item)) {
      let count = setMusicCollectionSelected(item, selected);
      sum += count;
    } else {
      item.selected = selected;
      sum += selected ? 1 : 0;
    }
  }
  musicCollection.selected = sum;
  return sum;
};

export const selectMusicCollectionBySid = (
  sid: number,
  musicCollection: MusicCollection,
): number => {
  if (sid === musicCollection.sid) {
    // 保存旧值，手动计算差值
    const oldSelected = musicCollection.selected;
    musicCollection.selected = setMusicCollectionSelected(
      musicCollection,
      !musicCollection.selected,
    );
    return musicCollection.selected - oldSelected;
  }

  let delta = 0;
  for (const item of musicCollection.data) {
    if (isMusicCollection(item)) {
      if (sid > item.sid) {
        // 因为父类的 sid 是大于所有子项的，所以如果 sid 大于当前项，那么就不用继续往里找了
        continue;
      }
      // 预期返回差值
      delta = selectMusicCollectionBySid(sid, item);
      // 保险一点
      if (delta !== 0) {
        break;
      }
    } else if (item.sid === sid) {
      item.selected = !item.selected;
      delta = item.selected ? 1 : -1;
      break;
    }
  }
  musicCollection.selected += delta;
  return delta;
};

// 返回的是 filter 后的深拷贝
export function filterMusicCollection(
  musicCollection: MusicCollection,
  ifFilter: (item: Music | MusicCollection) => boolean,
): MusicCollection {
  const temp: MusicCollection = {
    ...musicCollection,
    data: [],
  };
  if (musicCollection.data.length === 0) return temp;
  if (isMusicCollectionList(musicCollection.data)) {
    for (const item of musicCollection.data) {
      if (ifFilter(item)) {
        (temp.data as MusicCollection[]).push(
          filterMusicCollection(item, ifFilter),
        );
      }
    }
  } else {
    for (const item of musicCollection.data) {
      if (ifFilter(item)) {
        (temp.data as Music[]).push({ ...item });
      }
    }
  }
  return temp;
}

export function flattenMusicCollection(
  musicCollection: MusicCollection,
  collectionPath: string[] = [],
): QuizMusic[] {
  const result: QuizMusic[] = [];
  if (isMusicList(musicCollection.data)) {
    for (const music of musicCollection.data) {
      result.push({
        sid: music.sid,
        amount: music.amount,
        name: music.name,
        wikiName: music.wikiName,
        collectionPath,
        uuid: music.uuid,
      });
    }
  } else {
    // 这样做会造成顶层 musicColletion 的 name 是写不进去的，但是正符合要求
    for (const collection of musicCollection.data) {
      result.push(
        ...flattenMusicCollection(collection, [
          ...collectionPath,
          collection.name,
        ]),
      );
    }
  }
  return result;
}

export function checkIsSupportOggOpus() {
  const audio = document.createElement("audio");
  return audio.canPlayType("audio/ogg; codecs=opus") !== "";
}

/**
 * 根据曲子的 uuid 获取曲子
 * @param uuid 曲子的 uuid
 * @param idx 曲子片段的索引
 * @returns 返回曲子的 ArrayBuffer
 */
export const fetchMusicByUuid = async (uuid: string, idx: number) => {
  const fileName = `${uuid[0]}/${uuid}/${idx}.ogg`;
  const response = await fetch(`${fetchMusicUrlPrefix}${fileName}`, {
    headers: { Accept: "audio/ogg" },
    next: { tags: ["music"] },
  });
  if (!response.ok) {
    throw Error(ErrorType.NetworkError, {
      cause: `${response.status} ${response.statusText}`,
    });
  }
  return await response.arrayBuffer();
};
