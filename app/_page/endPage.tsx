import { useState } from "react";
import { difficultyColorAndText } from "../constant";
import {
  GetLocalStorageValue,
  LocalStorageKey,
  SetLocalStorageValue,
} from "../_tools/localStorage";
import { RankType, PageType } from "../types";

export interface IEndPageProps {
  setPageState: Function;
  nowQuizCount: number;
  rightAnswerCount: number;
  rank: RankType;
  invokeResultSummaryDialog: () => void;
}

export function EndPage(props: IEndPageProps) {
  const {
    setPageState,
    nowQuizCount,
    rightAnswerCount,
    rank,
    invokeResultSummaryDialog,
  } = props;

  const [nickname, setNickname] = useState(() => {
    return GetLocalStorageValue(LocalStorageKey.Nickname, "");
  });
  const [editNickName, setEditNickName] = useState(true);
  const [difficultyColor, difficultyText] = difficultyColorAndText[rank];
  return (
    <div className="h-full bg-container">
      <main className="h-full w-full flex flex-col animate-fade-in-up-fast items-center justify-center gap-1">
        <h1 className="text-h1 text-pure-red font-extrabold dark:text-red">
          喜报
        </h1>
        {editNickName ? (
          <>
            <input
              name="nickname"
              placeholder="Player"
              autoComplete="off"
              className="max-w-90% border-2 border-tab-color rounded-lg bg-gray-3 p-1 text-center text-h2 font-bold hover:border-blue dark:bg-material-dark-8 dark:hover:border-cyan"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
              }}
            />
            <button
              type="button"
              disabled={nickname.length === 0}
              className="w-30% secondary-button p-2"
              onClick={() => {
                setEditNickName(false);
                SetLocalStorageValue(LocalStorageKey.Nickname, nickname);
              }}
            >
              确认
            </button>
          </>
        ) : (
          <h2 className="text-h2 font-bold">{nickname}</h2>
        )}
        <h3 className="text-center text-h3">
          在东方原曲认知测验无尽版
          <br />
          <span className={difficultyColor}>{difficultyText}</span>
          &nbsp;难度获得
        </h3>
        <h3 className="text-h2 text-rose font-600">
          <button
            className="tertiary-button p-x-1"
            onClick={invokeResultSummaryDialog}
          >
            {`${rightAnswerCount}/${nowQuizCount}`}
          </button>
        </h3>
        <h3 className="text-h3">的好成绩</h3>
        <h2 className="text-h2">可喜可贺，可喜可贺</h2>
        <button
          type="button"
          className="main-button p-y-2"
          onClick={() => {
            setPageState(PageType.start);
          }}
        >
          重来
        </button>
      </main>
    </div>
  );
}
