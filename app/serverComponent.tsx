import { PageType, ThemeAppearanceType } from "./types";
import packageInfo from "../package.json";
import { MoonLineSvg, SunLineSvg } from "./svg";
import { voidFunc } from "./constant";

export function StartPage({
    setPageState,
    initFunc = voidFunc,
    themeAppearance,
    setThemeAppearance,
}: {
    setPageState: Function;
    initFunc?: Function;
    themeAppearance: ThemeAppearanceType.Dark | ThemeAppearanceType.Light;
    setThemeAppearance: (
        themeAppearance: ThemeAppearanceType.Dark | ThemeAppearanceType.Light
    ) => void;
}) {
    return (
        <main className="h-full w-full flex flex-col justify-between bg-container">
            <div className="p-2 text-right text-gray text-p">
                {packageInfo.version}
            </div>
            <div className="flex flex-col items-center gap-6">
                <h1 className="text-center text-h1">
                    东方原曲认知测验
                    <br />
                    无尽版
                </h1>
                <button
                    type="button"
                    className="p-4 main-button"
                    onClick={() => {
                        setPageState(PageType.selecting);
                        initFunc();
                    }}>
                    开始
                </button>
                <button
                    type="button"
                    aria-label="change theme"
                    onClick={() =>
                        setThemeAppearance(
                            themeAppearance === ThemeAppearanceType.Dark
                                ? ThemeAppearanceType.Light
                                : ThemeAppearanceType.Dark
                        )
                    }>
                    {themeAppearance === ThemeAppearanceType.Dark ? (
                        <MoonLineSvg className="w-8" />
                    ) : (
                        <SunLineSvg className="w-8" />
                    )}
                </button>
            </div>
            <div className="p-2 text-p">
                详细介绍可参看 Bilibili 视频，若有问题可在评论区或者 Github
                页面进行反馈（目前都没有）
            </div>
        </main>
    );
}

export function AdaptiveMainContain({
    children,
}: {
    children: React.JSX.Element;
}) {
    return (
        <div className="aspect-[2/3] h-auto max-h-95% w-95%">
            <div className="m-x-auto aspect-[2/3] h-100% max-w-100% w-auto">
                {children}
            </div>
        </div>
    );
}

export function TouhouMusicQuizContainer({
    children,
}: {
    children: React.JSX.Element;
}) {
    return (
        <main className="h-screen min-h-408px min-w-272px w-full flex items-center justify-center">
            <AdaptiveMainContain>{children}</AdaptiveMainContain>
        </main>
    );
}
