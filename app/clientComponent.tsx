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
import { Dialog, Transition } from "@headlessui/react";
import { TouhouMusicQuizContainer } from "./serverComponent";
import { Loader3FillSvg } from "./svg";
import { useImmer } from "use-immer";
import {
    ClearLocalStorage,
    GetLocalStorageValue,
    SetLocalStorageValue,
} from "./tools";
import { InitClientConstant } from "./clientConstant";
import { ErrorBoundary } from "react-error-boundary";
import { voidFunc } from "./constant";
import { StartPage } from "./_page/startPage";
import { SelectPage } from "./_page/selectPage";
import { RunningPage } from "./_page/runningPage";
import { EndPage } from "./_page/endPage";

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
                                setNowQuizCount(0);
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
