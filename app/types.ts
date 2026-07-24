export type Music = {
  idx: number;
  name: string;
  wikiName: string;
  amount: number;
  sid: number;
  selected: boolean;
  uuid: string;
};

export type QuizMusic = {
  name: string;
  wikiName: string;
  collectionPath: string[];
  amount: number;
  sid: number;
  uuid: string;
};

export type Quiz = { musicInfo: QuizMusic; music: AudioBuffer };

export type MusicCollection = {
  idx: number;
  name: string;
  uuid: string;
  sid: number;
  data: MusicCollection[] | Music[];
  selected: number;
};

export type RootMusicCollection = MusicCollection & {
  defaultSelectedCollectionUuid: string;
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

export type AnswerRecord = {
  playerAnswer: QuizMusic;
  correctAnswer: QuizMusic;
};
