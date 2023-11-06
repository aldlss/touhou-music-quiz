import { RankType } from "./types";

export const separator = "//";
export const voidFunc = () => {};
export const difficultyColorAndText = {
    [RankType.easy]: ["text-easy-mode", "Easy"],
    [RankType.normal]: ["text-normal-mode", "Normal"],
    [RankType.hard]: ["text-hard-mode", "Hard"],
    [RankType.lunatic]: ["text-lunatic-mode", "Lunatic"],
};
