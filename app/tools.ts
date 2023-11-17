import { cache } from "react";
import { parse } from "yaml";
import { Music, MusicCollection, MusicMap, SimpleMusic } from "./types";
import { separator } from "./constant";
import { localStorageAvailable } from "./clientConstant";

export const getSortedDefaultMusicMap = cache(async () => {
    const musicMap = await getMusicMap();
    const sortedMusicMap = sortMusicMap(musicMap);
    const defaultMusicMap = setDefalutSetting(sortedMusicMap);
    return defaultMusicMap;
});

export function checkEnv(): void {
    if (!process.env.NEXT_PUBLIC_FETCH_DATA_URL)
        throw new Error(
            "Please set NEXT_PUBLIC_FETCH_URL_BASE environment variables and rebuild!"
        );
    if (!process.env.NEXT_PUBLIC_FETCH_MUSIC_URL_PREFIX)
        throw new Error(
            "Please set NEXT_PUBLIC_FETCH_MUSIC_URL_PREFIX environment variables and rebuild!"
        );
}

const getMusicMap = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_FETCH_DATA_URL}`, {
        next: { revalidate: 86_400, tags: ["music-map"] },
    });
    if (!res.ok) throw new Error("Failed to fetch music map");
    const text = await res.text();
    const data: MusicMap = parse(text);
    return data;
};

const sortMusicMap = (musicMap: MusicMap): MusicMap => {
    let temp = Object.fromEntries(
        Object.entries(musicMap).sort((a, b) => a[1].idx - b[1].idx)
    );
    Object.values(temp).forEach((value) => {
        if (value.data instanceof Array) {
            value.data.sort((a, b) => a.idx - b.idx);
        } else {
            value.data = sortMusicMap(value.data);
        }
    });
    return temp;
};

const setDefalutSetting = (musicMap: MusicMap): MusicMap => {
    setMusicMapSelected(musicMap, false);
    generateSid(musicMap);
    selectMusicMapBySid(musicMap["Windows作品"].sid, musicMap);
    return musicMap;
};

// 这样较为刻意地构造后，sid 可用于从上至下查找某一 sid 的位置
const generateSid = (musicMap: MusicMap) => {
    let sidCount = 0;
    const dfs = (musicMap: MusicMap) => {
        Object.values(musicMap).forEach((value) => {
            if (value.data instanceof Array) {
                value.data.forEach((music) => {
                    music.sid = sidCount++;
                });
            } else {
                dfs(value.data);
            }
            value.sid = sidCount++;
        });
    };
    dfs(musicMap);
};

export const setMusicMapSelected = (
    musicMap: MusicMap | Music[],
    selected: boolean
): number => {
    let sum = 0;

    if (musicMap instanceof Array) {
        musicMap.forEach((music) => {
            music.selected = selected;
            sum += selected ? 1 : 0;
        });
        return sum;
    }

    Object.entries(musicMap).forEach(([name, value]) => {
        let count = 0;
        count += setMusicMapSelected(value.data, selected);
        value.selected = count;
        sum += count;
    });
    return sum;
};

export const selectMusicMapBySid = (
    sid: number,
    musicMap: MusicMap | Music[]
): number => {
    if (musicMap instanceof Array) {
        for (const music of musicMap) {
            if (music.sid === sid) {
                music.selected = !music.selected;
                return music.selected ? 1 : -1;
            }
        }
    } else {
        for (const value of Object.values(musicMap)) {
            if (value.sid === sid) {
                // 保存旧值，手动计算差值
                const oldSelected = value.selected;
                value.selected = setMusicMapSelected(
                    value.data,
                    !value.selected
                );
                return value.selected - oldSelected;
            } else if (sid > value.sid) {
                // 因为父类的 sid 是大于所有子项的，所以如果 sid 大于当前项，那么就不用继续往里找了
                continue;
            } else {
                // 预期返回差值
                const delta = selectMusicMapBySid(sid, value.data);
                // 保险一点
                if (delta !== 0) {
                    value.selected += delta;
                    return delta;
                }
            }
        }
    }
    return 0;
};

// 返回的是 filter 后的深拷贝
export function filterMusicMap(
    musicMap: MusicMap,
    ifFilter: (item: Music | MusicCollection) => boolean
): MusicMap {
    const temp: MusicMap = Object.fromEntries(
        Object.entries(musicMap).filter(([_, item]) => {
            return ifFilter(item);
        })
    );
    Object.keys(temp).forEach((name) => {
        const value = temp[name];
        let newValue = { ...value };
        if (value.data instanceof Array) {
            const data: Music[] = [];
            for (const music of value.data) {
                if (ifFilter(music)) {
                    data.push({ ...music });
                }
            }
            newValue.data = data;
        } else {
            newValue.data = filterMusicMap(value.data, ifFilter);
        }
        temp[name] = newValue;
    });
    return temp;
}

export function flatMusicMap(
    musicMap: MusicMap | Music[],
    ifSelect: (music: Music) => boolean,
    prefix: string = ""
): SimpleMusic[] {
    const result: SimpleMusic[] = [];
    if (musicMap instanceof Array) {
        musicMap.forEach((music) => {
            if (ifSelect(music)) {
                result.push({
                    sid: music.sid,
                    amount: music.amount,
                    name: `${prefix}${separator}${music.idx - 1}. ${
                        music.name
                    }`,
                });
            }
        });
    } else {
        Object.entries(musicMap).forEach(([name, value]) => {
            result.push(
                ...flatMusicMap(
                    value.data,
                    ifSelect,
                    `${prefix}${prefix === "" ? "" : separator}${name}`
                )
            );
        });
    }
    return result;
}

export async function digestMuiscName(str: string): Promise<string> {
    const res = await crypto.subtle.digest(
        "SHA-1",
        new TextEncoder().encode(str)
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
