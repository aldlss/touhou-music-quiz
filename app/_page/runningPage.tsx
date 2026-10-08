"use client";
import { Sema } from "@aldlss/async-sema";
import { Description, DialogPanel, DialogTitle } from "@headlessui/react";
import type { OggOpusDecoderWebWorker } from "ogg-opus-decoder";
import React, {
  type RefObject,
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  memo,
  useImperativeHandle,
} from "react";
import { type Updater, useImmer } from "use-immer";
import { SemaType, ControlledPromise } from "../class";
import { ConfirmDialog, ContainerDialog } from "../_dialog/commonDialogs";
import { AsyncBoundary } from "../serverComponent";
import {
  difficultyColorAndText,
  previousQuizSetCapacity,
  voidFunc,
} from "../constant";
import { MusicList } from "../musicListComponent";
import { PlayFillSvg } from "../svg";
import {
  filterMusicCollection,
  setMusicCollectionSelected,
  flattenMusicCollection,
  selectMusicCollectionBySid,
} from "../_tools/musicCollection";
import { isSupportOggOpus } from "../_tools/audio.client";
import { selectMusicWindow } from "../_tools/audioWindowSelection.client";
import {
  GetLocalStorageValue,
  LocalStorageKey,
  SetLocalStorageValue,
} from "../_tools/localStorage";
import {
  RankType,
  type QuizMusic,
  ErrorType,
  type Quiz,
  PageType,
  type MusicCollection,
  type AnswerRecord,
} from "../types";
import { importOggOpusDecoder } from "../dynamicImport";
import { DisplayMusicName } from "../nameTools";
import { useTranslations } from "next-intl";

export interface IRunningPageProps {
  setPageState: Function;
  musicCollectionState: MusicCollection;
  nowQuizCount: number;
  setNowQuizCount: Function;
  rightAnswerCount: number;
  setRightAnswerCount: Function;
  musicDuration: number;
  rank: RankType;
  setAnswerRecords: Updater<AnswerRecord[]>;
  invokeResultSummaryDialog: () => void;
}

export function RunningPage(props: IRunningPageProps) {
  const t = useTranslations("RunningPage");
  const {
    setPageState,
    musicCollectionState,
    nowQuizCount,
    setNowQuizCount,
    rightAnswerCount,
    setRightAnswerCount,
    musicDuration,
    rank,
    setAnswerRecords,
    invokeResultSummaryDialog,
  } = props;

  const [selectSid, setSelectSid] = useState(-1);
  const [quizMusicCollection, setQuizMusicCollection] = useImmer(() => {
    const quizMusicCollection = filterMusicCollection(
      musicCollectionState,
      (item) => Number(item.selected) > 0,
    );
    setMusicCollectionSelected(quizMusicCollection, false);
    return quizMusicCollection;
  });
  const selectedMusicList = useMemo(() => {
    return flattenMusicCollection(quizMusicCollection);
    // 这个依赖就是这个，因为对于 quizMusicCollection 这个数据，只需要提取出来里面的 Music 就可以了
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicCollectionState]);
  const selectedMusicBySid = useMemo(
    () => new Map(selectedMusicList.map((music) => [music.sid, music])),
    [selectedMusicList],
  );
  const musicListOnClickMusic = useCallback(
    (sid: number) => {
      if (selectSid !== sid) {
        setQuizMusicCollection((draft) => {
          if (selectSid !== -1) selectMusicCollectionBySid(selectSid, draft);
          selectMusicCollectionBySid(sid, draft);
        });
        setSelectSid(sid);
      } else {
        setQuizMusicCollection((draft) => {
          selectMusicCollectionBySid(sid, draft);
        });
        setSelectSid(-1);
      }
    },
    [selectSid, setQuizMusicCollection],
  );

  const audioContext = useRef<AudioContext | null>(null);
  const getAudioContext = useCallback(() => {
    if (audioContext.current === null) {
      audioContext.current = new AudioContext({ sampleRate: 48000 });
    }
    return audioContext.current;
  }, []);

  const decoderRef = useRef<OggOpusDecoderWebWorker | null>(null);
  useEffect(() => {
    let disposed = false;
    // 浏览器不能直接解码 OGG Opus 时提前准备 Worker，避免首题临时加载。
    if (!isSupportOggOpus) {
      void importOggOpusDecoder()
        .then((module) => {
          if (!disposed) {
            decoderRef.current =
              decoderRef.current ?? new module.OggOpusDecoderWebWorker();
          }
        })
        .catch(() => undefined);
    }
    return () => {
      disposed = true;
      const decoder = decoderRef.current;
      decoderRef.current = null;
      if (decoder !== null) void decoder.free();
    };
  }, []);

  // 页面只负责题目队列；随机选段、静音检测、获取和解码都收在独立方法里。
  const getMusicPiece = useCallback(
    (
      music: QuizMusic,
      duration: number,
      audioContext: AudioContext,
      signal: AbortSignal,
    ) => {
      return selectMusicWindow({
        musicUuid: music.uuid,
        totalChunkCount: music.amount,
        duration,
        audioContext,
        decoderRef,
        signal,
        errorMessages: {
          fetchMusicError: (error) =>
            t("fetchMusicError", { error: String(error) }),
          decodeResultMissing: t("decodeResultMissing"),
        },
      });
    },
    [t],
  );

  const quizesLimit = useMemo(() => {
    var temp = Number(process.env.NEXT_PUBLIC_QUIZ_BUFFER_SIZE);
    const rankValue = {
      [RankType.easy]: 2,
      [RankType.normal]: 2,
      [RankType.hard]: 1,
      [RankType.lunatic]: 1,
    };
    return isNaN(temp) ? rankValue[rank] : temp;
  }, [rank]);
  // 这个起着表示 loading 状态和作为 quiz 的功能，原谅我一变量多用 = =
  const [nowQuiz, setNowQuizInfo] = useState<Quiz | null>(null);
  // 用于显示 loading 界面，为什么非要这样子写，因为真想试试 suspense 和 error boundary
  const [loadingControllerPromise, setLoadingControllerPromise] = useState<
    ControlledPromise<void>
  >(() => new ControlledPromise());
  // 因为使用了该信号量顺便传递 Promise，因此需要更改 initFn，不然不给传，这里的 initFn 无意义
  const quizAvailabled = useRef(
    new SemaType(0, {
      capacity: quizesLimit + 1,
      initFn: () => Promise.resolve({} as Quiz),
    }),
  );
  const quizNeeded = useRef(
    new Sema(quizesLimit, { capacity: quizesLimit + 1 }),
  );
  // 这个变量是基于这样一个设计，在不可避免地出错后，每次重试都不必马上把后面的队列也填满
  // 只有在本次尝试成功后才继续开始填，若失败则后面的也不用尝试了
  // 这个变量是为了弥补看不到现有信号量数量的遗憾
  const quizNeedMaxSize = useRef(quizesLimit);

  // 消费者的
  const startNextQuiz = useCallback(
    (loadingPromise: ControlledPromise<void>) => {
      let stop = false;
      quizNeeded.current.release();
      const solve = (quiz: Quiz) => {
        setNowQuizInfo(quiz);
        loadingPromise.resolve();
        for (let i = 0; i < quizesLimit - quizNeedMaxSize.current; ++i) {
          quizNeeded.current.release();
        }
        quizNeedMaxSize.current = quizesLimit;
      };
      const getNextQuiz = async () => {
        try {
          // await 的是 Promise<Promise<Quiz>>，直接展平了
          const quiz: Quiz = await quizAvailabled.current.acquire();
          if (stop) return;
          solve(quiz);
        } catch (e) {
          // 这里总体思想是出错后看看后面的有没有出错，没有的话就直接 resolve
          // 后面都出错的话那就爆
          let quizPromiseTry: Promise<Quiz> | undefined;
          // 这个是为了保证最多只会尝试缓存这么多的 Promise
          // 然后就是要把用了的资源还回去
          let count = 0;
          const releaseCount = () => {
            for (let i = 0; i < count; ++i) {
              quizNeeded.current.release();
            }
          };
          while ((quizPromiseTry = quizAvailabled.current.tryAcquire())) {
            ++count;
            try {
              const quiz = await quizPromiseTry;
              releaseCount();
              if (stop) return;
              solve(quiz);
              return;
            } catch (error) {
              e = error;
            }
          }
          quizNeedMaxSize.current -= count;
          if (stop) return;
          loadingPromise.reject(e);
        }
      };
      getNextQuiz();
      return () => {
        stop = true;
      };
    },
    [quizesLimit],
  );

  // nextQuiz 更新 UI 信息 --触发--> quiz effect --调用--> startNextQuiz
  // 用 effect 驱动调用还能顺便统一 cancel，不过总感觉有点怪
  const nextQuiz = useCallback(() => {
    setNowQuizInfo(null);
    setLoadingControllerPromise(new ControlledPromise());
  }, []);

  useEffect(() => {
    const cancel = startNextQuiz(loadingControllerPromise);
    return () => {
      cancel();
    };
  }, [loadingControllerPromise, startNextQuiz]);

  // 生产者的
  useEffect(() => {
    // stop 用于在每个同步阶段开始时判断是否要停止
    let stop = false;
    const abortController = new AbortController();
    const audioContext = getAudioContext();
    const previousQuizUuids: string[] = [];
    const previousQuizUuidSet = new Set<string>();
    // 这个是考虑到如果选的曲子太少，那么重复是不可避免的
    const localPreviousQuizSetCapacity = Math.min(
      previousQuizSetCapacity,
      Math.max(0, selectedMusicList.length - 3),
    );
    async function addQuizes() {
      while (await quizNeeded.current.acquire()) {
        if (stop) {
          // 拿了指标没干活的要把指标还回去...
          quizNeeded.current.release();
          return;
        }
        let randomMusic: QuizMusic;
        do {
          // 单选的话这样比水池抽样大概快很多吧
          randomMusic =
            selectedMusicList[
              Math.floor(Math.random() * selectedMusicList.length)
            ];
          // 如果和之前几个重复，那么就再选一次，虽然运气不好的话会有巨大性能问题，但是应该不会吧（
        } while (previousQuizUuidSet.has(randomMusic.uuid));
        previousQuizUuidSet.add(randomMusic.uuid);
        previousQuizUuids.push(randomMusic.uuid);
        if (previousQuizUuids.length > localPreviousQuizSetCapacity) {
          previousQuizUuidSet.delete(previousQuizUuids.shift()!);
        }
        let resolve!: (value: Quiz | PromiseLike<Quiz>) => void,
          reject!: (reason?: any) => void;
        // 多套一层的原因大概是 Promise 比较方便传递异常
        // 非要这样的流程是为了保持串行的同时也要让消费端等待该次生产
        quizAvailabled.current.release(
          new Promise<Quiz>((res, rej) => {
            resolve = res;
            reject = rej;
          }),
        );
        try {
          const selectedWindow = await getMusicPiece(
            randomMusic,
            musicDuration,
            audioContext,
            abortController.signal,
          );
          if (stop) return;
          resolve({
            music: selectedWindow.audioBuffer,
            musicInfo: randomMusic,
            startTime: selectedWindow.startTime,
          });
        } catch (e) {
          if (stop) return;
          reject(e);
        }
      }
    }
    addQuizes();
    const quizAvailabledCurrent = quizAvailabled.current;
    return () => {
      stop = true;
      abortController.abort();
      quizAvailabledCurrent.drain();
    };
  }, [getAudioContext, getMusicPiece, musicDuration, selectedMusicList]);

  const musicPlayerRef = useRef<MusicPlayerHandle | null>(null);

  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);
  const [answeredSid, setAnsweredSid] = useState(-1);

  const afterResultDialogClose = useCallback(() => {
    setQuizMusicCollection((draft) => {
      if (answeredSid !== -1) selectMusicCollectionBySid(answeredSid, draft);
    });
    setSelectSid(-1);
    nextQuiz();
  }, [answeredSid, nextQuiz, setQuizMusicCollection]);
  const resultDialogOnClose = useCallback(() => {
    setShowResultDialog(false);
  }, []);
  const resultDialogAutoCloseTime = useCallback(
    () => Math.max(3000, musicDuration * 1000),
    [musicDuration],
  );

  const confirmDialogOnConfirm = useCallback(() => {
    setPageState(PageType.end);
  }, [setPageState]);
  const confirmDialogOnCancel = useCallback(() => {
    setShowEndGameDialog(false);
  }, []);

  const [difficultyTextColor, difficultyText] = difficultyColorAndText[rank];
  return (
    <div className="h-full bg-container">
      <main className="relative h-full w-full flex flex-col animate-fade-in-up-fast">
        <header className="relative">
          <button
            className="absolute left-0 top-0 tertiary-button p-2 text-h3"
            type="button"
            onClick={invokeResultSummaryDialog}
          >
            <span className="text-accepted dark:text-accepted-dark">
              {rightAnswerCount}
            </span>
            {`/${nowQuizCount}`}
          </button>
          <h1 className={`flex-1 text-center text-h2 ${difficultyTextColor}`}>
            {difficultyText}
          </h1>
          <button
            className="absolute right-0 top-0 m-1 min-w-fit w-20% secondary-button p-x-2 p-y-1 text-h3"
            type="button"
            onClick={() => {
              setShowEndGameDialog(true);
            }}
          >
            {t("end")}
          </button>
        </header>
        {!!nowQuiz && (
          <ResultDialog
            show={showResultDialog}
            selectedUuid={selectedMusicBySid.get(answeredSid)?.uuid}
            onClose={resultDialogOnClose}
            afterClose={afterResultDialogClose}
            nowQuizInfo={nowQuiz.musicInfo}
            autoClose={true}
            autoCloseTime={resultDialogAutoCloseTime}
          />
        )}
        <ConfirmDialog
          show={showEndGameDialog}
          title={t("endQuizTitle")}
          operation={t("endQuiz")}
          onConfirm={confirmDialogOnConfirm}
          onCancel={confirmDialogOnCancel}
        />
        <div className="h-10% w-full">
          {!nowQuiz ? (
            // 不得不说的是，这样处理 error 和 loading 总感觉有点方便(？
            <AsyncBoundary onRetry={nextQuiz}>
              {(async () => {
                await loadingControllerPromise.promise;
                return <></>;
              })()}
            </AsyncBoundary>
          ) : (
            <MusicPlayer
              audioBuffer={nowQuiz.music}
              getAudioContext={getAudioContext}
              ref={musicPlayerRef}
              musicDuration={musicDuration}
              startTime={nowQuiz.startTime}
            />
          )}
        </div>
        <MusicList
          musicCollection={quizMusicCollection}
          onClickTab={voidFunc}
          onClickMusic={musicListOnClickMusic}
        />
        <button
          disabled={selectSid < 0 || nowQuiz === null}
          className="main-button self-center p-0.5"
          type="button"
          onClick={() => {
            if (nowQuiz === null) {
              return;
            }
            const playerAnswer = selectedMusicBySid.get(selectSid);
            if (!playerAnswer) {
              throw Error(ErrorType.InvalidStateError, {
                cause: t("playerAnswerNotFound", { sid: selectSid }),
              });
            }
            const correctAnswer = nowQuiz.musicInfo;
            const isCorrect = playerAnswer.uuid === correctAnswer.uuid;
            setShowResultDialog(true);
            setAnsweredSid(selectSid);
            setNowQuizCount(nowQuizCount + 1);
            setAnswerRecords((draft) => {
              draft.push({
                playerAnswer,
                correctAnswer,
              });
            });
            if (isCorrect) {
              setRightAnswerCount(rightAnswerCount + 1);
            } else {
              // 意思是错了要多听（
              musicPlayerRef.current?.playTheMusic();
            }
          }}
        >
          {t("submitAnswer")}
        </button>
      </main>
    </div>
  );
}

const ResultDialog = memo(function ResultDialog({
  show,
  onClose,
  afterClose,
  nowQuizInfo,
  selectedUuid,
  autoClose,
  autoCloseTime,
}: {
  show: boolean;
  onClose: () => void;
  afterClose: () => void;
  nowQuizInfo: QuizMusic;
  selectedUuid: string | undefined;
  autoClose: boolean;
  autoCloseTime: number | (() => number);
}) {
  const t = useTranslations("RunningPage");
  const result = selectedUuid === nowQuizInfo.uuid;
  const resultMessage = result ? "correctResult" : "wrongResult";
  return (
    <ContainerDialog
      show={show}
      onClose={onClose}
      afterClose={afterClose}
      autoClose={autoClose}
      autoCloseTime={autoCloseTime}
    >
      <DialogPanel className="flex flex-col p-4">
        <button
          data-autofocus
          type="button"
          aria-label={t("closeResult")}
          className="h-0 w-0"
          onClick={onClose}
        />
        <DialogTitle className="text-center text-h2">
          {result ? t("correctTitle") : t("wrongTitle")}
        </DialogTitle>
        <Description className="text-p">
          {t.rich(resultMessage, {
            answer: () => <DisplayMusicName music={nowQuizInfo} />,
          })}
        </Description>
        <p className="self-center text-p text-gray">{t("closeHint")}</p>
      </DialogPanel>
    </ContainerDialog>
  );
});

interface MusicPlayerHandle {
  playTheMusic: () => void;
}

const MusicPlayer = memo(function MusicPlayer({
  ref,
  audioBuffer,
  getAudioContext,
  musicDuration,
  startTime,
}: {
  ref: RefObject<MusicPlayerHandle | null>;
  audioBuffer: AudioBuffer;
  getAudioContext: () => AudioContext;
  musicDuration: number;
  startTime: number;
}) {
  const t = useTranslations("RunningPage");
  const volumeNode = useRef<GainNode | null>(null);
  // 从 localStorage 里面读取之前设置的音量，没有的话就用（可能）默认的音量
  const getVolumeNode = useCallback(() => {
    if (volumeNode.current === null) {
      const audioContext = getAudioContext();
      volumeNode.current = audioContext.createGain();
      volumeNode.current.gain.value = Number(
        GetLocalStorageValue(LocalStorageKey.THM_Volume, "0.5"),
      );
    }
    return volumeNode.current;
  }, [getAudioContext]);

  // 用于播放音乐的
  const audioSource: RefObject<AudioBufferSourceNode | null> = useRef(null);
  const playMusic = useCallback(() => {
    const audioContext = getAudioContext();
    // 防止默认挂起导致不能自动播放
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    // 有正在播放的就停止，防止多重存在
    if (audioSource.current !== null) {
      audioSource.current.stop();
    }
    audioSource.current = audioContext.createBufferSource();
    audioSource.current.buffer = audioBuffer;
    audioSource.current.connect(getVolumeNode());
    getVolumeNode().connect(audioContext.destination);
    // startTime 已在选段阶段确定，这里不能再次随机，否则重播内容会变化。
    audioSource.current.start(0, startTime, musicDuration);
  }, [audioBuffer, getAudioContext, getVolumeNode, musicDuration, startTime]);
  // 用于在外部调用播放音乐的，改进为使用该 hook，更加贴合点
  useImperativeHandle(
    ref,
    () => ({
      playTheMusic: playMusic,
    }),
    [playMusic],
  );

  useEffect(() => {
    playMusic();
    return () => {
      // 防止切换了还在响
      audioSource.current?.stop();
    };
  }, [playMusic]);
  return (
    <div className="h-full w-full flex flex-row justify-evenly p-1">
      <button
        type="button"
        aria-label={t("playMusic")}
        className="aspect-square h-full max-h-10vh max-w-10vh common-button rounded-3xl bg-sky-3 simple-hover-active dark:bg-sky-6"
        onClick={() => {
          playMusic();
        }}
      >
        <PlayFillSvg className="h-full w-full fill-white p-2" />
      </button>
      <input
        aria-label={t("volume")}
        className="max-w-50% min-w-30%"
        type="range"
        min={0}
        max={1}
        step={0.01}
        // 防止 render 时写入操作，因此设为 false
        defaultValue={Number(
          GetLocalStorageValue(LocalStorageKey.THM_Volume, "0.5", false),
        )}
        onChange={(e) => {
          getVolumeNode().gain.value = Number(e.target.value);
        }}
        // 考虑在设定之后再保存，感觉大概可以避免频繁的保存
        onPointerUp={() => {
          SetLocalStorageValue(
            LocalStorageKey.THM_Volume,
            getVolumeNode().gain.value.toString(),
          );
        }}
      />
    </div>
  );
});
