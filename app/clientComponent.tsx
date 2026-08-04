"use client";
import { useCallback, useState } from "react";
import {
  type AnswerRecord,
  type MusicCollection,
  PageType,
  RankType,
} from "./types";
import { themeStore } from "./_store/themeStore";
import { useImmer } from "use-immer";
import { StartPage } from "./_page/startPage";
import { SelectPage } from "./_page/selectPage";
import { RunningPage } from "./_page/runningPage";
import { EndPage } from "./_page/endPage";
import { ResultSummaryDialog } from "./_dialog/resultSummaryDialog";
import { useStore } from "zustand";
import { useTranslations } from "next-intl";

export function QuizMain({
  musicCollection,
}: {
  musicCollection: MusicCollection;
}) {
  const common = useTranslations("Common");
  const [pageState, setPageState] = useState(PageType.start);
  const [musicCollectionState, setMusicCollectionState] =
    useImmer(musicCollection);
  const [nowQuizCount, setNowQuizCount] = useState(1);
  const [rightAnswerCount, setRightAnswerCount] = useState(0);
  const [musicDuration, setMusicDuration] = useState(5);
  const [rank, setRank] = useState(RankType.normal);
  const [answerRecords, setAnswerRecords] = useImmer<AnswerRecord[]>([]);
  const [resultSummaryDialogShow, setResultSummaryDialogShow] = useState(false);

  const switchThemeAppearance = useStore(
    themeStore,
    (state) => state.switchThemeAppearance,
  );

  const SelectPageSetMusicDuration = useCallback((duration: number) => {
    setMusicDuration(duration);
  }, []);
  return (
    <div className="h-full w-full overflow-hidden border-1 border-surface-color rounded-lg @container/main">
      {
        {
          [PageType.start]: (
            <StartPage
              key={PageType.start}
              setPageState={setPageState}
              initFunc={() => {
                setNowQuizCount(0);
                setRightAnswerCount(0);
                setAnswerRecords([]);
              }}
              switchThemeAppearance={switchThemeAppearance}
            />
          ),
          [PageType.loading]: <div>{common("loading")}</div>,
          [PageType.selecting]: (
            <SelectPage
              key={PageType.selecting}
              setPageState={setPageState}
              musicCollectionState={musicCollectionState}
              setMusicCollectionState={setMusicCollectionState}
              setRank={setRank}
              setMusicDuration={SelectPageSetMusicDuration}
            />
          ),
          [PageType.running]: (
            <RunningPage
              key={PageType.running}
              setPageState={setPageState}
              musicCollectionState={musicCollectionState}
              nowQuizCount={nowQuizCount}
              setNowQuizCount={setNowQuizCount}
              rightAnswerCount={rightAnswerCount}
              setRightAnswerCount={setRightAnswerCount}
              musicDuration={musicDuration}
              rank={rank}
              setAnswerRecords={setAnswerRecords}
              invokeResultSummaryDialog={() => {
                setResultSummaryDialogShow(true);
              }}
            />
          ),
          [PageType.end]: (
            <EndPage
              key={PageType.end}
              setPageState={setPageState}
              nowQuizCount={nowQuizCount}
              rightAnswerCount={rightAnswerCount}
              rank={rank}
              invokeResultSummaryDialog={() => {
                setResultSummaryDialogShow(true);
              }}
            />
          ),
        }[pageState]
      }
      <ResultSummaryDialog
        show={resultSummaryDialogShow}
        onClose={() => {
          setResultSummaryDialogShow(false);
        }}
        answerAndResults={answerRecords}
      ></ResultSummaryDialog>
    </div>
  );
}
