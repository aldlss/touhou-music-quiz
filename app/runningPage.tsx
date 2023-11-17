"use client";
import { Sema } from "@aldlss/async-sema";
import { Dialog } from "@headlessui/react";
// import { OggOpusDecoderWebWorker, OpusDecodedAudio } from "ogg-opus-decoder";
import Link from "next/link";
import React, {
    MutableRefObject,
    useState,
    useMemo,
    useRef,
    useCallback,
    useEffect,
    memo,
} from "react";
import { useImmer } from "use-immer";
import { SemaType, ControlledPromise } from "./class";
import {
    ConfirmDialog,
    AsyncBoundary,
    ContainerDialog,
} from "./clientComponent";
import { difficultyColorAndText, separator, voidFunc } from "./constant";
import MusicList from "./muiscListComponent";
import { PlayFillSvg } from "./svg";
import {
    filterMusicMap,
    setMusicMapSelected,
    flatMusicMap,
    digestMuiscName,
    selectMusicMapBySid,
    GetLocalStorageValue,
    SetLocalStorageValue,
} from "./tools";
import {
    MusicMap,
    RankType,
    SimpleMusic,
    ErrorType,
    Quiz,
    PageType,
} from "./types";

export default function RunningPage({
    setPageState,
    musicMapState,
    nowQuizCount,
    setNowQuizCount,
    rightAnswerCount,
    setRightAnswerCount,
    musicDuration,
    rank,
}: {
    setPageState: Function;
    musicMapState: MusicMap;
    nowQuizCount: number;
    setNowQuizCount: Function;
    rightAnswerCount: number;
    setRightAnswerCount: Function;
    musicDuration: MutableRefObject<number>;
    rank: RankType;
}) {
    const [selectSid, setSelectSid] = useState(-1);
    const [quizMusicMap, setQuizMusicMap] = useImmer(() => {
        const quizMusicMap = filterMusicMap(
            musicMapState,
            (item) => Number(item.selected) > 0
        );
        setMusicMapSelected(quizMusicMap, false);
        return quizMusicMap;
    });
    const selectedMusicList = useMemo(() => {
        return flatMusicMap(quizMusicMap, () => true);
        // 这个依赖就是这个，因为对于 quizMusicMap 这个数据，只需要提取出来里面的 Music 就可以了
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [musicMapState]);
    const musicListOnClickMusic = useCallback(
        (sid: number) => {
            if (selectSid !== sid) {
                setQuizMusicMap((draft) => {
                    if (selectSid !== -1) selectMusicMapBySid(selectSid, draft);
                    selectMusicMapBySid(sid, draft);
                });
                setSelectSid(sid);
            } else {
                setQuizMusicMap((draft) => {
                    selectMusicMapBySid(sid, draft);
                });
                setSelectSid(-1);
            }
        },
        [selectSid, setQuizMusicMap]
    );

    const audioContext = useRef<AudioContext | null>(null);
    function getAudioContext() {
        if (audioContext.current === null) {
            audioContext.current = new AudioContext({ sampleRate: 48000 });
        }
        return audioContext.current;
    }

    const getMusicPiece = async (
        music: SimpleMusic,
        duration: number,
        // decoder: OggOpusDecoderWebWorker | null,
        audioContext: AudioContext
    ) => {
        // 选出要获取的段落
        // 这里加 0.099 的原因是解码出来的期望是 1s 的音频文件似乎会少 0.0065 秒，因此多加回来
        // 因为计划最多限制到小数点后一位的精度，因此考虑加 0.099 是比较无脑方便的，后面是会剪切的，别急
        const needFetchAmount = Math.ceil(duration + 0.099);
        const startIdx = Math.floor(
            // random() 不包括 1，放心用了
            Math.random() * (music.amount - needFetchAmount + 1)
        );

        // 异步并发获取段落
        const promises = [];
        const fetchMusic = async (originName: string) => {
            const digestName = await digestMuiscName(originName);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_FETCH_MUSIC_URL_PREFIX}/${digestName}.ogg`.replace(
                    /(?<=:\/\/.*)\/\//g,
                    "/"
                ),
                {
                    headers: { Accept: "audio/ogg" },
                    next: { tags: ["music"] },
                }
            );
            if (!response.ok) {
                throw Error(ErrorType.NetworkError, {
                    cause: `${response.status} ${response.statusText}`,
                });
            }
            return await response.arrayBuffer();
        };
        for (let i = 0; i < needFetchAmount; i++) {
            promises.push(
                fetchMusic(`${music.name}${separator}${i + startIdx}`)
            );
        }

        let responses: ArrayBuffer[] = [];
        try {
            responses = await Promise.all(promises);
        } catch (e) {
            throw Error(ErrorType.NetworkError, {
                cause: `获取音乐资源失败 ${e}`,
            });
        }

        let decodeBuffer: AudioBuffer[] = [];
        // 苹果的或者非主流浏览器的就用 webworker
        // if (decoder) {
        //     // web worker 解码
        //     const opusDecodedAudios: OpusDecodedAudio[] = [];
        //     await decoder.ready;
        //     try {
        //         for (const buffer of responses) {
        //             await decoder
        //                 .decode(new Uint8Array(buffer))
        //                 .then((data) => {
        //                     const temp = audioContext.createBuffer(
        //                         data.channelData.length,
        //                         data.samplesDecoded,
        //                         data.sampleRate
        //                     );
        //                     for (let i = 0; i < 2; i++) {
        //                         temp.getChannelData(i).set(data.channelData[i]);
        //                     }
        //                     decodeBuffer.push(temp);
        //                 });
        //             await decoder.reset();
        //         }
        //         // return opusDecodedAudios;
        //         if (opusDecodedAudios.length === 0) {
        //             throw Error(ErrorType.UnknownError, {
        //                 cause: "解码结果为空",
        //             });
        //         }
        //     } catch (e) {
        //         throw Error(ErrorType.DecodeError, { cause: e });
        //     }
        // } else {
        {
            // 用浏览器 API 解码
            try {
                const res = await Promise.all(
                    responses.map((buffer) =>
                        audioContext.decodeAudioData(buffer)
                    )
                );
                decodeBuffer = res;
            } catch (e) {
                throw Error(ErrorType.DecodeError, { cause: e });
            }
        }

        // 合并音频
        const lenghtSum = decodeBuffer.reduce(
            (sum, item) => sum + item.length,
            0
        );
        const offlineAudioContext = new OfflineAudioContext(
            decodeBuffer[0].numberOfChannels,
            lenghtSum,
            decodeBuffer[0].sampleRate
        );
        // 这里用这个方法，至少省去了猛拷 buffer 的时间，还转成了异步，我感觉可以
        let startTimeOffset = 0;
        for (const buffer of decodeBuffer) {
            const source = offlineAudioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(offlineAudioContext.destination);
            source.start(startTimeOffset);
            startTimeOffset += buffer.duration;
        }
        const sumBuffer = await offlineAudioContext.startRendering();

        return sumBuffer;
    };

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
    const [LoadingPromise, setLoadingPromise] = useState<Promise<void>>(
        new Promise(voidFunc)
    );
    // 因为使用了该信号量顺便传递 Promise，因此需要更改 initFn，不然不给传，这里的 initFn 无意义
    const quizAvailabled = useRef(
        new SemaType(0, {
            capacity: quizesLimit + 1,
            initFn: () => Promise.resolve({} as Quiz),
        })
    );
    const quizNeeded = useRef(
        new Sema(quizesLimit, { capacity: quizesLimit + 1 })
    );
    // 这个变量是基于这样一个设计，在不可避免地出错后，每次重试都不必马上把后面的队列也填满
    // 只有在本次尝试成功后才继续开始填，若失败则后面的也不用尝试了
    // 这个变量是为了弥补看不到现有信号量数量的遗憾
    const quizNeedMaxSize = useRef(quizesLimit);

    // 消费者的
    const nextQuiz = useCallback(() => {
        let stop = false;
        quizNeeded.current.release();
        setNowQuizInfo(null);
        const loadingPromise = new ControlledPromise<void>();
        setLoadingPromise(loadingPromise.promise);
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
    }, [quizesLimit]);

    useEffect(() => {
        const cancel = nextQuiz();
        return () => {
            cancel();
        };
    }, [nextQuiz]);

    // 生产者的
    useEffect(() => {
        // const decoder =
        //     osType === OsType.Mac ||
        //     osType === OsType.Other ||
        //     (browserType !== BrowserType.Chrome &&
        //         browserType !== BrowserType.Edge &&
        //         browserType !== BrowserType.FireFox)
        //         ? new OggOpusDecoderWebWorker()
        //         : null;
        // stop 用于在每个同步阶段开始时判断是否要停止
        let stop = false;
        const audioContext = getAudioContext();
        async function addQuizes() {
            while (await quizNeeded.current.acquire()) {
                if (stop) {
                    // 拿了指标没干活的要把指标还回去...
                    quizNeeded.current.release();
                    return;
                }
                let randomMusic: SimpleMusic;
                do {
                    // 单选的话这样比水池抽样大概快很多吧
                    randomMusic =
                        selectedMusicList[
                            Math.floor(Math.random() * selectedMusicList.length)
                        ];
                    // 如果选出来的音乐不够长，那么就再选一次，虽然运气不好的话会有巨大性能问题，但是应该不会吧（
                } while (randomMusic.amount < musicDuration.current);
                let resolve!: (value: Quiz | PromiseLike<Quiz>) => void,
                    reject!: (reason?: any) => void;
                // 多套一层的原因大概是 Promise 比较方便传递异常
                // 非要这样的流程是为了保持串行的同时也要让消费端等待该次生产
                quizAvailabled.current.release(
                    new Promise<Quiz>((res, rej) => {
                        resolve = res;
                        reject = rej;
                    })
                );
                try {
                    const randomAudioBuffer = await getMusicPiece(
                        randomMusic,
                        musicDuration.current,
                        // decoder,
                        audioContext
                    );
                    if (stop) return;
                    resolve({
                        music: randomAudioBuffer,
                        musicInfo: randomMusic,
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
            // decoder?.free();
            quizAvailabledCurrent.drain();
            stop = true;
        };
    }, [musicDuration, selectedMusicList]);

    const playTheMusic = useRef(voidFunc);

    const [showResultDialog, setShowResultDialog] = useState(false);
    const [showEndGameDialog, setShowEndGameDialog] = useState(false);
    const [answeredSid, setAnsweredSid] = useState(-1);

    const afterResultDialogClose = useCallback(() => {
        setNowQuizCount(nowQuizCount + 1);
        setQuizMusicMap((draft) => {
            if (answeredSid !== -1) selectMusicMapBySid(answeredSid, draft);
        });
        setSelectSid(-1);
        nextQuiz();
    }, [answeredSid, nextQuiz, nowQuizCount, setNowQuizCount, setQuizMusicMap]);
    const resultDialogOnClose = useCallback(() => {
        setShowResultDialog(false);
    }, []);
    const resultDialogAutoCloseTime = useCallback(
        () => Math.max(3000, musicDuration.current * 1000),
        [musicDuration]
    );

    const confirmDialogOnConfirm = useCallback(() => {
        setPageState(PageType.end);
    }, [setPageState]);
    const confirmDialogOnCancel = useCallback(() => {
        setShowEndGameDialog(false);
    }, []);

    const [difficultyTextColor, h1Text] = difficultyColorAndText[rank];
    return (
        <div className="h-full bg-container">
            <main className="relative h-full w-full flex flex-col animate-fade-in-up-fast">
                <header className="relative">
                    <p className="absolute left-0 top-0 p-2 text-h3">
                        {nowQuizCount}
                    </p>
                    <h1
                        className={`text-h2 flex-1 text-center ${difficultyTextColor}`}>
                        {h1Text}
                    </h1>
                    <button
                        className="absolute right-0 top-0 m-1 min-w-fit w-20% p-x-2 p-y-1 secondary-button text-h3"
                        type="button"
                        onClick={() => {
                            setShowEndGameDialog(true);
                        }}>
                        结束
                    </button>
                </header>
                {!!nowQuiz && (
                    <ResultDialog
                        show={showResultDialog}
                        selectedSid={answeredSid}
                        onClose={resultDialogOnClose}
                        afterClose={afterResultDialogClose}
                        nowQuizInfo={nowQuiz.musicInfo}
                        autoClose={true}
                        autoCloseTime={resultDialogAutoCloseTime}
                    />
                )}
                <ConfirmDialog
                    show={showEndGameDialog}
                    operation="结束测验"
                    onConfirm={confirmDialogOnConfirm}
                    onCancel={confirmDialogOnCancel}
                />
                <div className="h-10% w-full">
                    {!nowQuiz ? (
                        // 不得不说的是，这样处理 error 和 loading 总感觉有点方便(？
                        <AsyncBoundary onRetry={nextQuiz}>
                            {(async () => {
                                await LoadingPromise;
                                return <></>;
                            })()}
                        </AsyncBoundary>
                    ) : (
                        <MusicPlayer
                            audioBuffer={nowQuiz.music}
                            audioContext={getAudioContext()}
                            playTheMusic={playTheMusic}
                            musicDuration={musicDuration}
                        />
                    )}
                </div>
                <MusicList
                    musicMap={quizMusicMap}
                    onClickTab={voidFunc}
                    onClickMusic={musicListOnClickMusic}
                />
                <button
                    disabled={selectSid < 0 || nowQuiz === null}
                    className="self-center p-0.5 main-button"
                    type="button"
                    onClick={() => {
                        const correctSid = nowQuiz?.musicInfo.sid ?? -1;
                        if (correctSid === -1) {
                            return;
                        }
                        setShowResultDialog(true);
                        setAnsweredSid(selectSid);
                        if (selectSid === correctSid) {
                            setRightAnswerCount(rightAnswerCount + 1);
                        } else {
                            // 意思是错了要多听（
                            playTheMusic.current();
                        }
                    }}>
                    确定
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
    selectedSid,
    autoClose,
    autoCloseTime,
}: {
    show: boolean;
    onClose: () => void;
    afterClose: () => void;
    nowQuizInfo: SimpleMusic;
    selectedSid: number;
    autoClose: boolean;
    autoCloseTime: number | (() => number);
}) {
    const result = selectedSid === nowQuizInfo.sid;
    const description1 = <>{`正确答案${result ? "就" : ""}是`}</>;
    const description2 = useMemo(() => {
        const names = nowQuizInfo.name.split(separator);
        return (
            <>
                {names?.map((name, idx) => {
                    if (idx === 0) {
                        return <React.Fragment key={name}></React.Fragment>;
                    } else if (idx === names.length - 1) {
                        const nameWithoutIdx = name.replace(/\d{1,2}\. /g, "");
                        return (
                            <Link
                                href={`https://thwiki.cc/${nameWithoutIdx}`}
                                target="_blank"
                                key={name}>
                                <span className="text-sky-4 underline active:text-sky-3 focus:text-sky-5 hover:text-sky-5">
                                    {nameWithoutIdx}
                                </span>
                            </Link>
                        );
                    } else if (idx === 1 || idx === 2) {
                        return (
                            <span key={name}>
                                {/* 最后一个才加 “的” */}
                                {`${name}中${
                                    names.length - idx === 2 ? "的" : ""
                                }`}
                            </span>
                        );
                    } else {
                        return <React.Fragment key={name}></React.Fragment>;
                    }
                })}
            </>
        );
    }, [nowQuizInfo.name]);
    return (
        <ContainerDialog
            show={show}
            onClose={onClose}
            afterClose={afterClose}
            autoClose={autoClose}
            autoCloseTime={autoCloseTime}>
            <Dialog.Panel className="flex flex-col p-4">
                <button
                    type="button"
                    aria-label="close"
                    className="h-0 w-0"
                    onClick={onClose}
                />
                <Dialog.Title className="text-center text-h2">
                    答{result ? "对" : "错"}了
                </Dialog.Title>
                <Dialog.Description className="text-p">
                    {description1}
                    {description2}
                </Dialog.Description>
                <p className="self-center text-gray text-p">点击框外立即关闭</p>
            </Dialog.Panel>
        </ContainerDialog>
    );
});

const MusicPlayer = memo(function MusicPlayer({
    audioBuffer,
    audioContext,
    playTheMusic,
    musicDuration,
}: {
    audioBuffer: AudioBuffer;
    audioContext: AudioContext;
    playTheMusic: MutableRefObject<() => void>;
    musicDuration: MutableRefObject<number>;
}) {
    const startTime = useRef(0);
    const volumeNode = useRef<GainNode | null>(null);
    // 从 localStorage 里面读取之前设置的音量，没有的话就用（可能）默认的音量
    const getVolumeNode = useCallback(() => {
        if (volumeNode.current === null) {
            volumeNode.current = audioContext.createGain();
            volumeNode.current.gain.value = Number(
                GetLocalStorageValue("thm_volume", "0.5")
            );
        }
        return volumeNode.current;
    }, [audioContext]);

    // 用于播放音乐的
    const audioSource: MutableRefObject<AudioBufferSourceNode | null> =
        useRef(null);
    const playMusic = useCallback(() => {
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
        audioSource.current.start(startTime.current, 0, musicDuration.current);
    }, [audioBuffer, audioContext, getVolumeNode, musicDuration]);
    // 用于在外部调用播放音乐的，没想到更好的办法
    playTheMusic.current = playMusic;

    useEffect(() => {
        // 既然有片段，那么在片段里面也随机一下，max 是兜底
        startTime.current = Math.max(
            Math.random() * (audioBuffer.duration - musicDuration.current),
            0
        );

        playMusic();
        return () => {
            // 防止切换了还在响
            audioSource.current?.stop();
        };
    }, [audioBuffer.duration, musicDuration, playMusic]);
    return (
        <div className="h-full w-full flex flex-row justify-evenly p-1">
            <button
                type="button"
                aria-label="play music"
                className="aspect-square rounded-3xl bg-sky-3 common-button dark:bg-sky-6 simple-hover-active"
                onClick={() => {
                    playMusic();
                }}>
                <PlayFillSvg className="h-full w-full fill-white p-2" />
            </button>
            <input
                className="max-w-50% min-w-30%"
                type="range"
                min={0}
                max={1}
                step={0.01}
                defaultValue={getVolumeNode().gain.value}
                onChange={(e) => {
                    getVolumeNode().gain.value = Number(e.target.value);
                }}
                // 考虑在设定之后再保存，感觉大概可以避免频繁的保存
                onPointerUp={() => {
                    SetLocalStorageValue(
                        "thm_volume",
                        getVolumeNode().gain.value.toString()
                    );
                }}
            />
        </div>
    );
});
