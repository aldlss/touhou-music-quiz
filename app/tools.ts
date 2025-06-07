import { cache } from "react";
import { parse } from "yaml";
import { ErrorType, Music, MusicCollection, SimpleMusic } from "./types";
import { fetchMusicUrlPrefix, separator } from "./constant";
import { localStorageAvailable } from "./clientConstant";

export const getSortedDefaultMusicCollection = cache(async () => {
  const musicCollection = await getMusicCollection();
  const sortedMusicCollection = sortMusicCollection(musicCollection);
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

const getMusicCollection = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_FETCH_DATA_URL}`, {
    next: { revalidate: 86_400, tags: ["music-collection"] },
  });
  if (!res.ok) throw new Error("Failed to fetch music collection");
  const text = await res.text();
  const data: MusicCollection = parse(text);
  return data;
};

const sortMusicCollection = (
  musicCollection: MusicCollection,
): MusicCollection => {
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
  musicCollection: MusicCollection,
): MusicCollection => {
  setMusicCollectionSelected(musicCollection, false);
  generateSid(musicCollection);
  selectMusicCollectionBySid(
    musicCollection.data.find((value) => value.name === "Windows作品")!.sid,
    musicCollection,
  );
  return musicCollection;
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

export function flatMusicColletion(
  musicColletion: MusicCollection,
  ifSelect: (music: Music) => boolean,
  prefix: string = "",
): SimpleMusic[] {
  const result: SimpleMusic[] = [];
  if (isMusicList(musicColletion.data)) {
    musicColletion.data.forEach((music) => {
      if (ifSelect(music)) {
        result.push({
          sid: music.sid,
          amount: music.amount,
          name: `${prefix}${separator}${music.idx}. ${music.name}`,
          uuid: music.uuid,
        });
      }
    });
  } else {
    // 这样做会造成顶层 musicColletion 的 name 是写不进去的，但是正符合要求
    for (let collection of musicColletion.data) {
      result.push(
        ...flatMusicColletion(
          collection,
          ifSelect,
          `${prefix}${prefix === "" ? "" : separator}${collection.name}`,
        ),
      );
    }
  }
  return result;
}

export async function digestMuiscName(str: string): Promise<string> {
  const res = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(str),
  );
  return Array.from(new Uint8Array(res))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function CheckLocalStorageAvailable(): boolean {
  try {
    const storage = window.localStorage;
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
}

export function SetLocalStorageValue(key: string, value: string) {
  if (!localStorageAvailable) {
    return false;
  }
  window.localStorage.setItem(key, value);
  return true;
}

export function GetLocalStorageValue(key: string): string | null;
export function GetLocalStorageValue(key: string, defaultValue: string): string;
export function GetLocalStorageValue(key: string, defaultValue?: string) {
  if (!localStorageAvailable) {
    return defaultValue ?? null;
  }
  const value = window.localStorage.getItem(key);
  if (defaultValue === undefined) {
    return value ?? null;
  } else {
    if (value === null) {
      SetLocalStorageValue(key, defaultValue);
      return defaultValue;
    } else {
      return value;
    }
  }
}

export function ClearLocalStorage() {
  if (!localStorageAvailable) {
    return;
  }
  window.localStorage.clear();
}

export function checkIsSupportOggOpus() {
  const audio = document.createElement("audio");
  return audio.canPlayType("audio/ogg; codecs=opus") !== "";
}

/**
 * 根据曲子名称获取曲子
 * @param originName 带路径原始曲子名称
 * @returns 返回曲子的 ArrayBuffer
 * @deprecated 改动了曲子获取方式，现使用 `fetchMusicByUuid`
 */
export const fetchMusic = async (originName: string) => {
  const digestName = await digestMuiscName(originName);
  const response = await fetch(`${fetchMusicUrlPrefix}${digestName}.ogg`, {
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
