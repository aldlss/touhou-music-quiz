export type Music = {
    idx: number;
    name: string;
    amount: number;
    sid: number;
    selected: boolean;
};

export type SimpleMusic = {
    name: string;
    amount: number;
    sid: number;
};

export type Quiz = { musicInfo: SimpleMusic; music: AudioBuffer };

export type MusicCollection = {
    idx: number;
    sid: number;
    data: MusicMap | Music[];
    selected: number;
};

export type MusicMap = {
    [name: string]: MusicCollection;
};

export enum PageType {
    start,
    loading,
    selecting,
    running,
    end,
}

export enum RankType {
    easy,
    normal,
    hard,
    lunatic,
}

export enum ErrorType {
    NetworkError = "NetworkError",
    DecodeError = "DecodeError",
    UnknownError = "UnknownError",
}

export enum ThemeAppearanceType {
    Light = "Light",
    Dark = "Dark",
    Auto = "Auto",
}