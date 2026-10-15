import { PageType } from "../types";
import packageInfo from "../../package.json";
import { MoonLineSvg, SunLineSvg } from "../svg";
import { voidFunc } from "../constant";
import { InfoDialog } from "./startPageClient";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "../_component/languageSwitcher";

export interface IStartPageProps {
  setPageState: Function;
  initFunc?: Function;
  switchThemeAppearance: () => void;
}

export function StartPage(props: IStartPageProps) {
  const { setPageState, initFunc = voidFunc, switchThemeAppearance } = props;
  const t = useTranslations("StartPage");

  return (
    <main className="h-full w-full flex flex-col justify-between bg-container">
      <div className="flex flex-row justify-between">
        <Link
          href="/docs/version"
          className="p-2 text-right text-p text-gray hover:text-link"
        >
          {packageInfo.version}
        </Link>
        <InfoDialog />
      </div>
      <p className="absolute m-t-20 aspect-9999/1 min-h-0 overflow-y-hidden whitespace-pre-line">
        {t("browserWarning")}
      </p>
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-center text-h1">
          {t("title")}
          <br />
          {t("edition")}
        </h1>
        <button
          type="button"
          className="main-button p-4"
          onClick={() => {
            setPageState(PageType.selecting);
            initFunc();
          }}
        >
          {t("start")}
        </button>
        <div className="flex items-center gap-4">
          <LanguageSwitcher label={t("changeLanguage")} />
          <button
            type="button"
            aria-label={t("changeTheme")}
            className="icon-button"
            onClick={switchThemeAppearance}
          >
            <SunLineSvg className="block h-8 w-8 dark:hidden" />
            <MoonLineSvg className="hidden h-8 w-8 dark:block" />
          </button>
        </div>
      </div>
      <div className="p-2 text-small">
        {t.rich("footer", {
          bilibili: (chunks) => (
            <Link
              href="https://www.bilibili.com/video/BV1Nz42167QC/"
              target="_blank"
              className="text-link"
            >
              {chunks}
            </Link>
          ),
          github: (chunks) => (
            <Link
              href="https://github.com/aldlss/touhou-music-quiz"
              target="_blank"
              className="text-link"
            >
              {chunks}
            </Link>
          ),
        })}
      </div>
    </main>
  );
}
