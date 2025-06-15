"use client";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  type AnswerRecord,
  type MusicCollection,
  PageType,
  RankType,
  ThemeAppearanceType,
} from "./types";
import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { TouhouMusicQuizContainer } from "./serverComponent";
import { useImmer } from "use-immer";
import {
  ClearLocalStorage,
  GetLocalStorageValue,
  LocalStorageKey,
  SetLocalStorageValue,
} from "./_tools/localStorage";
import { InitClientConstant } from "./clientConstant";
import { voidFunc } from "./constant";
import { StartPage } from "./_page/startPage";
import { SelectPage } from "./_page/selectPage";
import { RunningPage } from "./_page/runningPage";
import { EndPage } from "./_page/endPage";
import { ResultSummaryDialog } from "./_dialog/resultSummaryDialog";

export function QuizMain({
  musicCollection,
}: {
  musicCollection: MusicCollection;
}) {
  useEffect(() => {
    // 设置客户端的一些基本信息，不知道没有更好的办法
    InitClientConstant();
    window.AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    window.OfflineAudioContext =
      window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;

    // 检查是否过期，过期则清除一遍 localStorage，设置过期时间十五天
    const expireTimeDelta = 15 * 24 * 60 * 60 * 1000;
    // Number(null)为 0，大概不用担心
    const expireTime = Number(GetLocalStorageValue(LocalStorageKey.ExpireTime));
    if (expireTime + expireTimeDelta < Date.now() || isNaN(expireTime)) {
      ClearLocalStorage();
      SetLocalStorageValue(
        LocalStorageKey.ExpireTime,
        (Date.now() + expireTimeDelta).toString(),
      );
    }
  }, []);
  const [pageState, setPageState] = useState(PageType.start);
  const [musicCollectionState, setMusicCollectionState] =
    useImmer(musicCollection);
  const [nowQuizCount, setNowQuizCount] = useState(1);
  const [rightAnswerCount, setRightAnswerCount] = useState(0);
  const musicDuration = useRef(5);
  const [rank, setRank] = useState(RankType.normal);
  const [answerRecords, setAnswerRecords] = useImmer<AnswerRecord[]>([]);
  const [resultSummaryDialogShow, setResultSummaryDialogShow] = useState(false);

  const themeMatchQuery = useRef<MediaQueryList | null>(null);
  const GetThemeMatchQuery = () => {
    if (themeMatchQuery.current === null) {
      themeMatchQuery.current = matchMedia("(prefers-color-scheme: dark)");
    }
    return themeMatchQuery.current;
  };
  // 因为不显示 Auto，所以不要
  const [showedTheme, setShowedTheme] = useState<
    ThemeAppearanceType.Light | ThemeAppearanceType.Dark
  >(ThemeAppearanceType.Light);
  // 根据三个状态进行处理
  const changeThemeAppearance = useCallback((target: ThemeAppearanceType) => {
    function changeTheme(dark: boolean) {
      if (dark) {
        setShowedTheme(ThemeAppearanceType.Dark);
        document.documentElement.classList.add("dark");
      } else {
        setShowedTheme(ThemeAppearanceType.Light);
        document.documentElement.classList.remove("dark");
      }
    }
    switch (target) {
      case ThemeAppearanceType.Auto:
        SetLocalStorageValue(LocalStorageKey.ThemeAppearance, "auto");
        changeTheme(GetThemeMatchQuery().matches);
        GetThemeMatchQuery().onchange = (e) => {
          changeTheme(e.matches);
        };
        break;
      case ThemeAppearanceType.Light:
        SetLocalStorageValue(LocalStorageKey.ThemeAppearance, "light");
        GetThemeMatchQuery().onchange = null;
        changeTheme(false);
        break;
      case ThemeAppearanceType.Dark:
        SetLocalStorageValue(LocalStorageKey.ThemeAppearance, "dark");
        GetThemeMatchQuery().onchange = null;
        changeTheme(true);
        break;
    }
  }, []);
  const generateSwitchThemeAppearance = useCallback(
    (nowShowedTheme: ThemeAppearanceType.Light | ThemeAppearanceType.Dark) => {
      return () => {
        if (
          (nowShowedTheme === ThemeAppearanceType.Light) ===
          GetThemeMatchQuery().matches
        ) {
          changeThemeAppearance(ThemeAppearanceType.Auto);
        } else {
          changeThemeAppearance(
            nowShowedTheme === ThemeAppearanceType.Dark
              ? ThemeAppearanceType.Light
              : ThemeAppearanceType.Dark,
          );
        }
      };
    },
    [changeThemeAppearance],
  );
  useEffect(() => {
    const theme = GetLocalStorageValue(LocalStorageKey.ThemeAppearance, "auto");
    if (theme === "light") changeThemeAppearance(ThemeAppearanceType.Light);
    else if (theme === "dark") changeThemeAppearance(ThemeAppearanceType.Dark);
    else changeThemeAppearance(ThemeAppearanceType.Auto);
    // 虽然我感觉好像没必要加依赖(？
  }, [changeThemeAppearance]);

  const SelectPageSetMusicDuration = useCallback((duration: number) => {
    musicDuration.current = duration;
  }, []);
  return (
    <div className="h-full w-full overflow-hidden border-1 rounded-lg @container/main border-surface-color">
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
              switchThemeAppearance={generateSwitchThemeAppearance(showedTheme)}
            />
          ),
          [PageType.loading]: <div>loading</div>,
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

interface IContainerDialogProps {
  show: boolean;
  onClose: () => void;
  afterClose?: () => void;
  autoClose?: boolean;
  autoCloseTime?: number | (() => number);
  appear?: boolean;
  children: React.ReactNode;
}

export type IContainerDialogPropsBase = Omit<IContainerDialogProps, "children">;

/**
 * 需要自行在其中添加 Dialog 组件，例如 DialogPanel 以及 DialogTitle
 */
export function ContainerDialog(props: IContainerDialogProps) {
  const {
    show,
    onClose,
    afterClose = voidFunc,
    autoClose = false,
    autoCloseTime = 2000,
    appear = false,
    children,
  } = props;

  // 用于自动关闭界面
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoClose && show) {
      timer = setTimeout(
        () => {
          onClose();
        },
        typeof autoCloseTime === "function" ? autoCloseTime() : autoCloseTime,
      );
    }
    return () => {
      clearTimeout(timer);
    };
  }, [autoClose, autoCloseTime, onClose, show]);
  return (
    <Transition
      show={show}
      as={React.Fragment}
      afterLeave={afterClose}
      appear={appear}
    >
      <Dialog
        className="absolute left-0 top-0 h-full w-full"
        onClose={() => {
          onClose();
        }}
      >
        <TouhouMusicQuizContainer>
          <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden rounded-lg">
            <TransitionChild
              as={React.Fragment}
              enter="transition transform-gpu"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition transform-gpu"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div
                className="absolute left-0 top-0 h-full w-full bg-black/10"
                aria-hidden={true}
              />
            </TransitionChild>
            <TransitionChild
              as={React.Fragment}
              enter="transition transform-gpu"
              enterFrom="scale-0 opacity-0"
              enterTo="scale-100 opacity-100"
              leave="transition transform-gpu"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y--30%"
            >
              <div className="z-10 max-h-90% w-90% overflow-y-auto border-1 rounded-lg shadow-md border-surface-color bg-dialog">
                {children}
              </div>
            </TransitionChild>
          </div>
        </TouhouMusicQuizContainer>
      </Dialog>
    </Transition>
  );
}

export const ConfirmDialog = memo(function ConfirmDialog({
  show,
  onCancel,
  onConfirm,
  operation,
  onClose = onCancel,
}: {
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  operation: string;
  onClose?: () => void;
}) {
  return (
    <ContainerDialog show={show} onClose={onClose}>
      <DialogPanel className="flex flex-col gap-2 p-4">
        <DialogTitle className="text-center text-h2">{operation}</DialogTitle>
        <Description className="text-p">确认要{operation}吗？</Description>
        <div className="flex flex-row justify-evenly gap-2 p-x-4">
          <button
            type="button"
            className="max-w-40% flex-1 p-1 secondary-button text-h3"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            type="button"
            className="max-w-40% flex-1 p-1 text-h3 main-button"
            onClick={onConfirm}
          >
            确认
          </button>
        </div>
      </DialogPanel>
    </ContainerDialog>
  );
});
