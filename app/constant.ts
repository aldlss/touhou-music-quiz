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
