"use client";
import React, {
    Suspense,
    memo,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { MusicMap, PageType, RankType, ThemeAppearanceType } from "./types";
import MusicList from "./muiscListComponent";
import { Dialog, Transition } from "@headlessui/react";
import { StartPage, TouhouMusicQuizContainer } from "./serverComponent";
import { ArrowRightSSvg, Loader3FillSvg, QuestionLineSvg } from "./svg";
import { Updater, useImmer } from "use-immer";
import { selectMusicMapBySid } from "./tools";
import {
    ClearLocalStorage,
    GetLocalStorageValue,
    SetLocalStorageValue,
} from "./tools";
import { InitClientConstant } from "./clientConstant";
import { ErrorBoundary } from "react-error-boundary";
import RunningPage from "./runningPage";
import { difficultyColorAndText, voidFunc } from "./constant";

export function QuizMain({ musicMap }: { musicMap: MusicMap }) {
    useEffect(() => {
        // 设置客户端的一些基本信息，不知道没有更好的办法
        InitClientConstant();
        window.AudioContext =
            window.AudioContext || (window as any).webkitAudioContext;
        window.OfflineAudioContext =
            window.OfflineAudioContext ||
            (window as any).webkitOfflineAudioContext;

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
                            setMusicDuration={SelectPageSetMusicDuration}
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
                            rank={rank}
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
    rank,
}: {
    setPageState: Function;
    nowQuizCount: number;
    rightAnswerCount: number;
    rank: RankType;
}) {
    const [nickname, setNickname] = useState(() => {
        return GetLocalStorageValue("nickname", "");
    });
    const [editNickName, setEditNickName] = useState(true);
    const [difficultyColor, difficultyText] = difficultyColorAndText[rank];
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
                    <span className={difficultyColor}>{difficultyText}</span>
                    &nbsp;难度获得
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
    const [showMusicSelect, setShowMusicSelect] = useState(true);
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
    const onclickCallback = useCallback(
        (sid: number) => {
            setMusicMapState((draft) => {
                selectMusicMapBySid(sid, draft);
            });
        },
        [setMusicMapState]
    );
    const onClickTab = useCallback(
        (
            sid: number,
            e: React.SyntheticEvent<HTMLButtonElement, MouseEvent>
        ) => {
            if (e.target !== e.currentTarget) return;
            if (e.target instanceof HTMLButtonElement) {
                if (
                    e.target.hasAttribute("aria-selected") &&
                    e.target.getAttribute("aria-selected") === "true"
                ) {
                    onclickCallback(sid);
                }
            }
        },
        [onclickCallback]
    );
    const onClickMusic = useCallback(
        (
            sid: number,
            e: React.SyntheticEvent<HTMLButtonElement, MouseEvent>
        ) => {
            onclickCallback(sid);
        },
        [onclickCallback]
    );
    const durationSelectPageOnClose = useCallback(() => {
        setShowTimeSelect(false);
    }, []);
    const SelectHelpDialogOnClose = useCallback(() => {
        setShowHelpDialog(false);
        SetLocalStorageValue("thm_first_visit", "0");
    }, []);
    const durationSelectPageBeforeLeave = useCallback(() => {
        setShowMusicSelect(true);
    }, []);
    const durationSelectPageAfterEnter = useCallback(() => {
        setShowMusicSelect(false);
    }, []);
    return (
        <main className="relative h-full w-full bg-container">
            <section
                className={`h-full w-full flex flex-col animate-fade-in-up-fast gap-1 ${
                    showMusicSelect ? "" : "invisible"
                }`}
                aria-hidden={!showMusicSelect}>
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
                    onClickTab={onClickTab}
                    onClickMusic={onClickMusic}
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
                closePage={durationSelectPageOnClose}
                setRank={setRank}
                setMusicDuration={setMusicDuration}
                afterEnter={durationSelectPageAfterEnter}
                beforeLeave={durationSelectPageBeforeLeave}
            />
            <SelectHelpDialog
                show={showHelpDialog}
                onClose={SelectHelpDialogOnClose}
            />
        </main>
    );
}

const SelectHelpDialog = memo(function SelectHelpDialog({
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
                    <br />
                    默认已选取 Windows 作品 下的所有曲子。
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
});

export const LoadingPage = memo(function LoadingPage() {
    return (
        <div className="h-full flex flex-row items-center justify-center">
            <Loader3FillSvg className="w-8 animate-spin" />
            <h1 className="text-center text-h3">少女加载中...</h1>
        </div>
    );
});

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
        <Suspense fallback={<LoadingPage />}>
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
    afterClose = voidFunc,
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
        if (autoClose && show) {
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
    }, [autoClose, autoCloseTime, onClose, show]);
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
});

const DurationSelectPage = memo(function DurationSelectPage({
    show,
    setPageState,
    closePage,
    setRank,
    setMusicDuration,
    afterEnter,
    beforeLeave,
}: {
    show: boolean;
    setPageState: Function;
    closePage: () => void;
    setRank: Function;
    setMusicDuration: Function;
    afterEnter?: () => void;
    beforeLeave?: () => void;
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
            className="absolute h-full w-full flex flex-col translate-y--100% transition-common bg-container"
            as="section"
            show={show}
            enterFrom="translate-x-100%"
            enterTo="translate-x-0"
            afterEnter={afterEnter}
            beforeLeave={beforeLeave}
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
                    <ArrowRightSSvg className="h-8 w-8" />
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
});

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
