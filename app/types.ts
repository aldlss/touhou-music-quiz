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

export type EventPromise = {
    active: () => void;
    cancel: () => void;
};

export enum BrowserType {
    Chrome = "Chrome",
    FireFox = "FireFox",
    Safari = "Safari",
    Edge = "Edge",
    IE = "IE",
    Opera = "Opera",
    Other = "Other",
}

// 不太关心具体是手机还是电脑了
// 主要是为了把苹果的专门拿出来适配一下
export enum OsType {
    Windows = "Windows",
    Mac = "Mac",
    Linux = "Linux",
    Other = "Other",
}

export enum ThemeAppearanceType {
    Light = "Light",
    Dark = "Dark",
    Auto = "Auto",
}