import { RankType } from "./types";

export const separator = "//";
export const voidFunc = () => {};
export const difficultyColorAndText = {
  [RankType.easy]: ["text-easy-mode", "Easy"],
  [RankType.normal]: ["text-normal-mode", "Normal"],
  [RankType.hard]: ["text-hard-mode", "Hard"],
  [RankType.lunatic]: ["text-lunatic-mode", "Lunatic"],
};
// 如果结尾没有 / 则加上 /
export const fetchMusicUrlPrefix: string =
  `${process.env.NEXT_PUBLIC_FETCH_MUSIC_URL_PREFIX}`.endsWith("/")
    ? `${process.env.NEXT_PUBLIC_FETCH_MUSIC_URL_PREFIX}`
    : `${process.env.NEXT_PUBLIC_FETCH_MUSIC_URL_PREFIX}/`;

// 如果有结尾的 / 则去掉
export const fetchBase: string =
  `${process.env.NEXT_PUBLIC_FETCH_BASE}`.endsWith("/")
    ? `${process.env.NEXT_PUBLIC_FETCH_BASE}`.slice(0, -1)
    : `${process.env.NEXT_PUBLIC_FETCH_BASE}`;

export const previousQuizSetCapacity: number = (() => {
  const temp = Number(process.env.NEXT_PUBLIC_PREVIOUS_QUIZ_SET_CAPACITY);
  return isNaN(temp) ? 10 : temp >= 0 ? temp : 10;
})();

export const WEB_TITLE = "东方原曲认知测验无尽版";
export const WEB_DESCRIPTION =
  "东方 Project 原曲认知测验无尽版。随机播放乐曲片段，可自由选择测试曲目范围和 10s、5s、1s、0.5s 片段时长的难度，无题量限制，适合熟悉和挑战东方原曲，成为东方原曲领域大神。";
export const SITE_URL = "https://quiz.touhou.page";
