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
  name: string;
  sid: number;
  data: MusicCollection[] | Music[];
  selected: number;
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

export type AnswerRecord = {
  playerAnswerSid: number;
  playerAnswerName: string;
  correctAnswerSid: number;
  correctAnswerName: string;
};
