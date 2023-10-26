"use client";
import { create } from "zustand";
import { BrowserType, MusicMap, OsType, RankType } from "./types";

interface State {
    musicMap?: MusicMap;
    musicDuration: number;
    rank: RankType;
    nowQuizCount: number;
    rightAnswerCount: number;
    browserType: BrowserType;
    osType: OsType;
    localStorageAvailable: boolean;
}

const initialState: State = {
    musicDuration: 5,
    rank: RankType.normal,
    nowQuizCount: 1,
    rightAnswerCount: 0,
    browserType: BrowserType.Other,
    osType: OsType.Other,
    localStorageAvailable: false,
};

interface Action {
    setMusicDuration: (musicDuration: number) => void;
    setRank: (rank: RankType) => void;
    setNowQuizCount: (nowQuizCount: number) => void;
    setRightAnswerCount: (rightAnswerCount: number) => void;
    setBrowserType: (browserType: BrowserType) => void;
    setOsType: (osType: OsType) => void;
    setLocalStorageAvailable: (localStorageAvailable: boolean) => void;
    setLocalStorageValue: (key: string, value: string) => boolean;
    getLocalStorageValue: {
        (key: string): string | null;
        (key: string, defaultValue: string): string;
    };
    clearLocalStorage: () => void;
}

type Store = State & Action;

export const useStore = create<Store>((set, get) => ({
    ...initialState,

    setMusicDuration: (musicDuration) => set({ musicDuration }),
    setRank: (rank) => set({ rank }),
    setNowQuizCount: (nowQuizCount) => set({ nowQuizCount }),
    setRightAnswerCount: (rightAnswerCount) => set({ rightAnswerCount }),
    setBrowserType: (browserType) => set({ browserType }),
    setOsType: (osType) => set({ osType }),
    setLocalStorageAvailable: (localStorageAvailable) =>
        set({ localStorageAvailable }),
    setLocalStorageValue: (key, value) => {
        const { localStorageAvailable } = get();
        if (!localStorageAvailable) {
            return false;
        }
        window.localStorage.setItem(key, value);
        return true;
    },
    // 这里不知道为什么，defaultValue 得是 any，设置 string | undefined 都不行
    getLocalStorageValue: function (key: string, defaultValue?: any) {
        const { localStorageAvailable, setLocalStorageValue } = get();
        if (!localStorageAvailable) {
            return defaultValue ?? null;
        }
        const value = window.localStorage.getItem(key);
        if (defaultValue === undefined) {
            return value ?? null;
        } else {
            if (value === null) {
                setLocalStorageValue(key, defaultValue);
                return defaultValue;
            } else {
                return value;
            }
        }
    },
    clearLocalStorage: () => {
        const { localStorageAvailable } = get();
        if (!localStorageAvailable) {
            return;
        }
        window.localStorage.clear();
    },
}));
