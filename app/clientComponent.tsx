"use client";
import React, {
    MutableRefObject,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ErrorType,
    MusicMap,
    PageType,
    Quiz,
    RankType,
    SimpleMusic,
    ThemeAppearanceType,
} from "./types";
import MusicList from "./muiscListComponent";
import { Dialog, Transition } from "@headlessui/react";
import { StartPage, TouhouMusicQuizContainer } from "./serverComponent";
import {
    ArrowLeftSSvg,
    Loader3FillSvg,
    PlayFillSvg,
    QuestionLineSvg,
} from "./svg";
import { Updater, useImmer } from "use-immer";
// import { OggOpusDecoderWebWorker, OpusDecodedAudio } from "ogg-opus-decoder";
import {
    filterMusicMap,
    flatMusicMap,
    digestMuiscName,
    selectMusicMapBySid,
    setMusicMapSelected,
} from "./tools";
import Link from "next/link";
import { separator } from "./constant";
import {
    ClearLocalStorage,
    GetLocalStorageValue,
    SetLocalStorageValue,
} from "./tools";
import { InitClientConstant } from "./clientConstant";
import { ControlledPromise, SemaType } from "./class";
import { Sema } from "@aldlss/async-sema";
import { ErrorBoundary } from "react-error-boundary";

export function QuizMain({ musicMap }: { musicMap: MusicMap }) {
    useEffect(() => {
        // 设置客户端的一些基本信息，不知道没有更好的办法
        InitClientConstant();

        // 检查是否过期，过期则清除一遍 localStorage，设置过期时间十五天
        const expireTimeDelta = 15 * 24 * 60 * 60 * 1000;
        // Number(null)为 0，大概不用担心
        const expireTime = Number(GetLocalStorageValue("expire_time"));
        if (expireTime + expireTimeDelta < Date.now() || isNaN(expireTime)) {
            ClearLocalStorage();
            SetLocalStorageValue(
                "expire_time",
                (Date.now() + expireTimeDelta).toString()
            );
        }
    }, []);
    const [pageState, setPageState] = useState(PageType.start);
    const [musicMapState, setMusicMapState] = useImmer(musicMap);
    const [nowQuizCount, setNowQuizCount] = useState(1);
    const [rightAnswerCount, setRightAnswerCount] = useState(0);
    const musicDuration = useRef(5);
    const [rank, setRank] = useState(RankType.normal);

    const themeMatchQuery = useRef<MediaQueryList | null>(null);
    const GetThemeMatchQuery = () => {
        if (themeMatchQuery.current === null) {
            themeMatchQuery.current = matchMedia(
                "(prefers-color-scheme: dark)"
            );
        }
        return themeMatchQuery.current;
    };
    // 因为不显示 Auto，所以不要
    const [showedThemeIcon, setShowedThemeIcon] = useState<
        ThemeAppearanceType.Light | ThemeAppearanceType.Dark
    >(ThemeAppearanceType.Light);
    // 根据三个状态进行处理
    const changeThemeAppearance = useCallback((target: ThemeAppearanceType) => {
        function changeTheme(dark: boolean) {
            if (dark) {
                setShowedThemeIcon(ThemeAppearanceType.Dark);
                document.documentElement.classList.add("dark");
            } else {
                setShowedThemeIcon(ThemeAppearanceType.Light);
                document.documentElement.classList.remove("dark");
            }
        }
        switch (target) {
            case ThemeAppearanceType.Auto:
                SetLocalStorageValue("theme_appearance", "auto");
                changeTheme(GetThemeMatchQuery().matches);
                GetThemeMatchQuery().onchange = (e) => {
                    changeTheme(e.matches);
                };
                break;
            case ThemeAppearanceType.Light:
                SetLocalStorageValue("theme_appearance", "light");
                GetThemeMatchQuery().onchange = null;
                changeTheme(false);
                break;
            case ThemeAppearanceType.Dark:
                SetLocalStorageValue("theme_appearance", "dark");
                GetThemeMatchQuery().onchange = null;
                changeTheme(true);
                break;
        }
    }, []);
    useEffect(() => {
        const theme = GetLocalStorageValue("theme_appearance", "auto");
        if (theme === "light") changeThemeAppearance(ThemeAppearanceType.Light);
        else if (theme === "dark")
            changeThemeAppearance(ThemeAppearanceType.Dark);
        else changeThemeAppearance(ThemeAppearanceType.Auto);
        // 虽然我感觉好像没必要加依赖(？
    }, [changeThemeAppearance]);

    return (
        <div className="h-full w-full overflow-hidden border-1 rounded-lg @container/main border-surface-color">
            {
                {
                    [PageType.start]: (
                        <StartPage
                            key={PageType.start}
                            setPageState={setPageState}
                            initFunc={() => {
                                setNowQuizCount(1);
                                setRightAnswerCount(0);
                            }}
                            themeAppearance={showedThemeIcon}
                            setThemeAppearance={(target) => {
                                if (
                                    (target === ThemeAppearanceType.Dark) ===
                                    GetThemeMatchQuery().matches
                                ) {
                                    changeThemeAppearance(
                                        ThemeAppearanceType.Auto
                                    );
                                } else {
                                    changeThemeAppearance(target);
                                }
                            }}
                        />
                    ),
                    [PageType.loading]: <div>loading</div>,
                    [PageType.selecting]: (
                        <SelectPage
                            key={PageType.selecting}
                            setPageState={setPageState}
                            musicMapState={musicMapState}
                            setMusicMapState={setMusicMapState}
                            setRank={setRank}
                            setMusicDuration={(duration: number) => {
                                musicDuration.current = duration;
                            }}
                        />
                    ),
                    [PageType.running]: (
                        <RunningPage
                            key={PageType.running}
                            setPageState={setPageState}
                            musicMapState={musicMapState}
                            nowQuizCount={nowQuizCount}
                            setNowQuizCount={setNowQuizCount}
                            rightAnswerCount={rightAnswerCount}
                            setRightAnswerCount={setRightAnswerCount}
                            musicDuration={musicDuration}
                            rank={rank}
                        />
                    ),
                    [PageType.end]: (
                        <EndPage
                            key={PageType.end}
                            setPageState={setPageState}
                            nowQuizCount={nowQuizCount}
                            rightAnswerCount={rightAnswerCount}
                        />
                    ),
                }[pageState]
            }
        </div>
    );
}

export function EndPage({
    setPageState,
    nowQuizCount,
    rightAnswerCount,
}: {
    setPageState: Function;
    nowQuizCount: number;
    rightAnswerCount: number;
}) {
    const [nickname, setNickname] = useState(() => {
        return GetLocalStorageValue("nickname", "");
    });
    const [editNickName, setEditNickName] = useState(true);
    return (
        <div className="h-full bg-container">
            <main className="h-full w-full flex flex-col animate-fade-in-up-fast items-center justify-center gap-1">
                <h1 className="font-extrabold text-pure-red text-h1 dark:text-red">
                    喜报
                </h1>
                {editNickName ? (
                    <>
                        <input
                            name="nickname"
                            placeholder="Player"
                            autoComplete="off"
                            className="max-w-90% border-2 rounded-lg bg-gray-3 p-1 text-center font-bold border-tab-color hover:border-blue dark:bg-material-dark-8 text-h2 dark:hover:border-cyan"
                            type="text"
                            value={nickname}
                            onChange={(e) => {
                                setNickname(e.target.value);
                            }}
                        />
                        <button
                            type="button"
                            disabled={nickname.length === 0}
                            className="w-30% p-2 secondary-button"
                            onClick={() => {
                                setEditNickName(false);
                                SetLocalStorageValue("nickname", nickname);
                            }}>
                            确认
                        </button>
                    </>
                ) : (
                    <h2 className="font-bold text-h2">{nickname}</h2>
                )}
                <h3 className="text-center text-h3">
                    在东方原曲认知测验无尽版
                    <br />
                    获得
                </h3>
                <h3 className="font-600 text-rose text-h2">{`${rightAnswerCount}/${
                    nowQuizCount - 1
                }`}</h3>
                <h3 className="text-h3">的好成绩</h3>
                <h2 className="text-h2">可喜可贺，可喜可贺</h2>
                <button
                    type="button"
                    className="p-y-2 main-button"
                    onClick={() => {
                        setPageState(PageType.start);
                    }}>
                    重来
                </button>
            </main>
        </div>
    );
}

export function SelectPage({
    setPageState,
    musicMapState,
    setMusicMapState,
    setRank,
    setMusicDuration,
}: {
    setPageState: Function;
    musicMapState: MusicMap;
    setMusicMapState: Updater<MusicMap>;
    setRank: Function;
    setMusicDuration: Function;
}) {
    const [showTimeSelect, setShowTimeSelect] = useState(false);
    const [showHelpDialog, setShowHelpDialog] = useState(() => {
        const isFirstVisit = Number(
            GetLocalStorageValue("thm_first_visit", "1")
        );
        return isFirstVisit !== 0;
    });
    // 可能并不是最好的办法
    const nextButtonEnable =
        Object.values(musicMapState).reduce(
            (sum, item) => sum + item.selected,
            0
        ) > 0;
    const onclickCallback = (sid: number) => {
        setMusicMapState((draft) => {
            selectMusicMapBySid(sid, draft);
        });
    };
    return (
        <main className="h-full w-full bg-container">
            <section className="h-full w-full flex flex-col animate-fade-in-up-fast gap-1">
                <header className="relative w-full">
                    <h1 className="text-center text-h1">选择乐曲</h1>
                    <button
                        type="button"
                        aria-label="help"
                        className="absolute right-0 top-0"
                        onClick={() => {
                            setShowHelpDialog(true);
                        }}>
                        <QuestionLineSvg className="w-10 fill-lightblue p-1 transition-common simple-hover-active" />
                    </button>
                </header>
                <MusicList
                    musicMap={musicMapState}
                    musicListType={PageType.selecting}
                    onClickTab={(sid, e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.target instanceof HTMLButtonElement) {
                            if (
                                e.target.hasAttribute("aria-selected") &&
                                e.target.getAttribute("aria-selected") ===
                                    "true"
                            ) {
                                onclickCallback(sid);
                            }
                        }
                    }}
                    onClickMusic={(sid) => {
                        onclickCallback(sid);
                    }}
                />
                <button
                    disabled={!nextButtonEnable}
                    className="self-center p-0.5 main-button"
                    type="button"
                    onClick={() => {
                        setShowTimeSelect(true);
                    }}>
                    下一步
                </button>
            </section>
            <DurationSelectPage
                show={showTimeSelect}
                setPageState={setPageState}
                closePage={() => {
                    setShowTimeSelect(false);
                }}
                setRank={setRank}
                setMusicDuration={setMusicDuration}
            />
            <SelectHelpDialog
                show={showHelpDialog}
                onClose={() => {
                    setShowHelpDialog(false);
                    SetLocalStorageValue("thm_first_visit", "0");
                }}
            />
        </main>
    );
}

function SelectHelpDialog({
    show,
    onClose,
}: {
    show: boolean;
    onClose: () => void;
}) {
    return (
        <ContainerDialog show={show} onClose={onClose} appear={true}>
            <Dialog.Panel className="flex flex-col gap-2 p-4">
                <Dialog.Title className="text-center text-h2">
                    选择原曲说明
                </Dialog.Title>
                <Dialog.Description className="text-p">
                    主要是用于提高自由度的，简单来说就是可以选取用于进行测验的曲子的范围。
                    <br />
                    对于某一类目，在选取状态后再次点击可以 全选/全不选
                    该类目下的所有曲子。
                </Dialog.Description>
                <button
                    type="button"
                    className="w-fit self-center p-x-4 p-y-2 secondary-button"
                    onClick={() => {
                        onClose();
                    }}>
                    我知道了
                </button>
            </Dialog.Panel>
        </ContainerDialog>
    );
}

function RunningPage({
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
        new Promise(() => {})
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
                quizAvailabled.current.release(
                    new Promise<Quiz>(async (resolve, reject) => {
                        let randomMusic: SimpleMusic;
                        do {
                            // 单选的话这样比水池抽样大概快很多吧
                            randomMusic =
                                selectedMusicList[
                                    Math.floor(
                                        Math.random() * selectedMusicList.length
                                    )
                                ];
                            // 如果选出来的音乐不够长，那么就再选一次，虽然运气不好的话会有巨大性能问题，但是应该不会吧（
                        } while (randomMusic.amount < musicDuration.current);
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
                    })
                );
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

    const playTheMusic = useRef(() => {});

    const [showResultDialog, setShowResultDialog] = useState(false);
    const [showEndGameDialog, setShowEndGameDialog] = useState(false);
    const [answeredSid, setAnsweredSid] = useState(-1);

    const afterResultDialogClose = () => {
        setNowQuizCount(nowQuizCount + 1);
        setQuizMusicMap((draft) => {
            if (selectSid !== -1) selectMusicMapBySid(selectSid, draft);
        });
        setSelectSid(-1);
        nextQuiz();
    };

    const [difficultyTextColor, h1Text] = {
        [RankType.easy]: ["text-easy-mode", "Easy"],
        [RankType.normal]: ["text-normal-mode", "Normal"],
        [RankType.hard]: ["text-hard-mode", "Hard"],
        [RankType.lunatic]: ["text-lunatic-mode", "Lunatic"],
    }[rank];
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
                        onClose={() => setShowResultDialog(false)}
                        afterClose={afterResultDialogClose}
                        nowQuizInfo={nowQuiz.musicInfo}
                        autoClose={true}
                        autoCloseTime={() =>
                            Math.max(3000, musicDuration.current * 1000)
                        }
                    />
                )}
                <ConfirmDialog
                    show={showEndGameDialog}
                    operation="结束测验"
                    onConfirm={() => {
                        setPageState(PageType.end);
                    }}
                    onCancel={() => {
                        setShowEndGameDialog(false);
                    }}
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
                    musicListType={PageType.running}
                    onClickTab={() => {}}
                    onClickMusic={(sid) => {
                        if (selectSid !== sid) {
                            setQuizMusicMap((draft) => {
                                if (selectSid !== -1)
                                    selectMusicMapBySid(selectSid, draft);
                                selectMusicMapBySid(sid, draft);
                            });
                            setSelectSid(sid);
                        } else {
                            setQuizMusicMap((draft) => {
                                selectMusicMapBySid(sid, draft);
                            });
                            setSelectSid(-1);
                        }
                    }}
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

export function AsyncBoundary({
    children,
    onRetry,
    resetKeys,
}: {
    children: React.ReactNode;
    onRetry?: () => void;
    resetKeys?: any[];
}) {
    return (
        <Suspense
            fallback={
                <div className="h-full flex flex-row items-center justify-center">
                    <Loader3FillSvg className="w-8 animate-spin" />
                    <h1 className="text-center text-h3">少女加载中...</h1>
                </div>
            }>
            <ErrorBoundary
                resetKeys={resetKeys}
                onReset={onRetry}
                fallbackRender={({ error, resetErrorBoundary }) => {
                    return (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="text-center">
                                <h1 className="inline text-p">少女出错了！</h1>
                                <pre className="inline">{error.message}</pre>
                            </div>
                            <button
                                className="p-2 secondary-button"
                                type="button"
                                onClick={() => {
                                    resetErrorBoundary();
                                }}>
                                重试
                            </button>
                        </div>
                    );
                }}>
                {children}
            </ErrorBoundary>
        </Suspense>
    );
}

export function ContainerDialog({
    show,
    onClose,
    afterClose = () => {},
    autoClose = false,
    autoCloseTime = 2000,
    appear = false,
    children,
}: {
    show: boolean;
    onClose: () => void;
    afterClose?: () => void;
    autoClose?: boolean;
    autoCloseTime?: number | (() => number);
    appear?: boolean;
    children: React.ReactNode;
}) {
    // 用于自动关闭界面
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (autoClose) {
            timer = setTimeout(
                () => {
                    onClose();
                },
                typeof autoCloseTime === "function"
                    ? autoCloseTime()
                    : autoCloseTime
            );
        }
        return () => {
            clearTimeout(timer);
        };
    }, [autoClose, autoCloseTime, onClose]);
    return (
        <Transition
            show={show}
            as={React.Fragment}
            afterLeave={afterClose}
            appear={appear}>
            <Dialog
                className="absolute left-0 top-0 h-full w-full"
                onClose={() => {
                    onClose();
                }}>
                <TouhouMusicQuizContainer>
                    <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden rounded-lg">
                        <Transition.Child
                            as={React.Fragment}
                            enter="transition transform-gpu"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition transform-gpu"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0">
                            <div
                                className="absolute left-0 top-0 h-full w-full bg-black/10"
                                aria-hidden={true}
                            />
                        </Transition.Child>
                        <Transition.Child
                            as={React.Fragment}
                            enter="transition transform-gpu"
                            enterFrom="scale-0 opacity-0"
                            enterTo="scale-100 opacity-100"
                            leave="transition transform-gpu"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y--30%">
                            <div className="z-10 w-90% border-1 rounded-lg shadow-md border-surface-color bg-dialog">
                                {children}
                            </div>
                        </Transition.Child>
                    </div>
                </TouhouMusicQuizContainer>
            </Dialog>
        </Transition>
    );
}

function ResultDialog({
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
}

function ConfirmDialog({
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
            <Dialog.Panel className="flex flex-col gap-2 p-4">
                <Dialog.Title className="text-center text-h2">
                    {operation}
                </Dialog.Title>
                <Dialog.Description className="text-p">
                    确认要{operation}吗？
                </Dialog.Description>
                <div className="flex flex-row justify-evenly gap-2 p-x-4">
                    <button
                        type="button"
                        className="max-w-40% flex-1 p-1 secondary-button text-h3"
                        onClick={onCancel}>
                        取消
                    </button>
                    <button
                        type="button"
                        className="max-w-40% flex-1 p-1 text-h3 main-button"
                        onClick={onConfirm}>
                        确认
                    </button>
                </div>
            </Dialog.Panel>
        </ContainerDialog>
    );
}

function MusicPlayer({
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
}

function DurationSelectPage({
    show,
    setPageState,
    closePage,
    setRank,
    setMusicDuration,
}: {
    show: boolean;
    setPageState: Function;
    closePage: () => void;
    setRank: Function;
    setMusicDuration: Function;
}) {
    function makeDurationSelectDivProps(
        title: string,
        onClick: () => void,
        description: string,
        buttonClassName?: string
    ) {
        return {
            title,
            onClick,
            description,
            buttonClassName,
        };
    }
    function onDurationSelectClick(duration: number, rank: RankType) {
        return () => {
            setPageState(PageType.running);
            setRank(rank);
            setMusicDuration(duration);
        };
    }
    const durationSelectDivProps = [
        makeDurationSelectDivProps(
            "妖精级",
            onDurationSelectClick(10, RankType.easy),
            "用于熟悉曲子的难度(10s)\n再求精进是为人的基本",
            "bg-easy-mode"
        ),
        makeDurationSelectDivProps(
            "河童级",
            onDurationSelectClick(5, RankType.normal),
            "用于享受测验的难度(5s)\n幸福源于对自己充满信心",
            "bg-normal-mode"
        ),
        makeDurationSelectDivProps(
            "天狗级",
            onDurationSelectClick(1, RankType.hard),
            "让人拿出真本事的难度(1s)\n有必要好好研究一下其中的段落",
            "bg-hard-mode"
        ),
        makeDurationSelectDivProps(
            "鬼神级",
            onDurationSelectClick(0.5, RankType.lunatic),
            "逗你玩的难度(0.5s)\n一边喝酒一边听好了",
            "bg-lunatic-mode"
        ),
    ];
    return (
        <Transition
            className="h-full w-full flex flex-col translate-y--100% transition-common bg-container"
            as="section"
            show={show}
            enterFrom="translate-x-100%"
            enterTo="translate-x-0"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-100%">
            <header className="relative">
                <button
                    type="button"
                    aria-label="back"
                    className="absolute left-0 top-0 w-fit p-1"
                    onClick={() => {
                        closePage();
                    }}>
                    <ArrowLeftSSvg className="h-8 w-8" />
                </button>
                <h1 className="m-x-auto w-fit text-h1">难度选择</h1>
            </header>
            <div className="flex flex-1 flex-col justify-between gap-3 overflow-y-auto after:content-[''] before:content-['']">
                {durationSelectDivProps.map(
                    ({ title, onClick, description, buttonClassName }) => (
                        <DurationSelectItem
                            key={title}
                            title={title}
                            onClick={onClick}
                            description={description}
                            buttonClassName={buttonClassName}
                        />
                    )
                )}
            </div>
        </Transition>
    );
}

function DurationSelectItem({
    title,
    onClick,
    description,
    buttonClassName,
}: {
    title: string;
    onClick: () => void;
    description: string;
    buttonClassName?: string;
}) {
    return (
        <div className="flex flex-col items-center gap-1">
            <button
                className={`text-shadow-sm text-shadow-color-gray common-button p-y-2 p-x-4 text-h2 simple-hover-active ${
                    buttonClassName ?? ""
                } dark:[--un-bg-opacity:0.8]`}
                type="button"
                onClick={onClick}>
                {title}
            </button>
            <p className="whitespace-pre-wrap text-center text-p">
                {description}
            </p>
        </div>
    );
}
