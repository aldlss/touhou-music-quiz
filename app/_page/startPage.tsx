import { PageType, ThemeAppearanceType } from "../types";
import packageInfo from "../../package.json";
import { MoonLineSvg, SunLineSvg } from "../svg";
import { voidFunc } from "../constant";

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
            <p className="absolute m-t-20 aspect-[9999/1] min-h-0 overflow-y-hidden">
                如果你看到了这行字
                <br />
                而且界面显得很扁的话
                <br />
                那么为了保证体验
                <br />
                很可能您需要升级或更换浏览器
            </p>
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
            <div className="p-2 text-small">
                测验片段为随机选取，结果不具有参考价值，仅供娱乐。详细介绍可参看
                Bilibili 视频，若有问题可在评论区或者 Github
                页面进行反馈（目前都没有）
            </div>
        </main>
    );
}
