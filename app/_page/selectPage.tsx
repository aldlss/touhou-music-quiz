import {
  Description,
  DialogPanel,
  DialogTitle,
  Transition,
} from "@headlessui/react";
import { useState, useCallback, memo } from "react";
import { Updater } from "use-immer";
import { ContainerDialog } from "../clientComponent";
import { MusicList } from "../musicListComponent";
import { ArrowRightSSvg, QuestionLineSvg } from "../svg";
import { selectMusicCollectionBySid } from "../tools";
import {
  GetLocalStorageValue,
  LocalStorageKey,
  SetLocalStorageValue,
} from "../_tools/localStorage";
import { MusicCollection, PageType, RankType } from "../types";
import { CommonSecondaryButton } from "../serverComponent";
import { useTranslations } from "next-intl";

export interface ISelectPageProps {
  setPageState: Function;
  musicCollectionState: MusicCollection;
  setMusicCollectionState: Updater<MusicCollection>;
  setRank: Function;
  setMusicDuration: Function;
}

export function SelectPage(props: ISelectPageProps) {
  const t = useTranslations("SelectPage");
  const {
    setPageState,
    musicCollectionState,
    setMusicCollectionState,
    setRank,
    setMusicDuration,
  } = props;

  const [showTimeSelect, setShowTimeSelect] = useState(false);
  const [showMusicSelect, setShowMusicSelect] = useState(true);
  const [showHelpDialog, setShowHelpDialog] = useState(() => {
    const isFirstVisit = Number(
      GetLocalStorageValue(LocalStorageKey.THM_FirstVisit, "1"),
    );
    return isFirstVisit !== 0;
  });
  // 可能并不是最好的办法
  const nextButtonEnable = musicCollectionState.selected > 0;
  const onclickCallback = useCallback(
    (sid: number) => {
      setMusicCollectionState((draft) => {
        selectMusicCollectionBySid(sid, draft);
      });
    },
    [setMusicCollectionState],
  );
  const onClickTab = useCallback(
    (sid: number, e: React.SyntheticEvent<HTMLButtonElement, MouseEvent>) => {
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
    [onclickCallback],
  );
  const onClickMusic = useCallback(
    (sid: number, e: React.SyntheticEvent<HTMLButtonElement, MouseEvent>) => {
      onclickCallback(sid);
    },
    [onclickCallback],
  );
  const durationSelectPageOnClose = useCallback(() => {
    setShowTimeSelect(false);
  }, []);
  const SelectHelpDialogOnClose = useCallback(() => {
    setShowHelpDialog(false);
    SetLocalStorageValue(LocalStorageKey.THM_FirstVisit, "0");
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
        aria-hidden={!showMusicSelect}
      >
        <header className="relative w-full">
          <h1 className="text-center text-h1">{t("title")}</h1>
          <button
            type="button"
            aria-label={t("help")}
            className="absolute right-0 top-0"
            onClick={() => {
              setShowHelpDialog(true);
            }}
          >
            <QuestionLineSvg className="tips-icon" />
          </button>
        </header>
        <MusicList
          musicCollection={musicCollectionState}
          onClickTab={onClickTab}
          onClickMusic={onClickMusic}
        />
        <button
          disabled={!nextButtonEnable}
          className="main-button self-center p-0.5"
          type="button"
          onClick={() => {
            setShowTimeSelect(true);
          }}
        >
          {t("next")}
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
  const t = useTranslations("SelectPage");

  return (
    <ContainerDialog show={show} onClose={onClose} appear={true}>
      <DialogPanel className="flex flex-col gap-2 p-4">
        <DialogTitle className="text-center text-h2">
          {t("helpTitle")}
        </DialogTitle>
        <Description className="whitespace-pre-line text-p">
          {t("helpDescription")}
        </Description>
        <CommonSecondaryButton onClick={onClose}>
          {t("understood")}
        </CommonSecondaryButton>
      </DialogPanel>
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
  const t = useTranslations("SelectPage");

  function makeDurationSelectDivProps(
    title: string,
    onClick: () => void,
    description: string,
    buttonClassName?: string,
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
      t("easyTitle"),
      onDurationSelectClick(10, RankType.easy),
      t("easyDescription"),
      "bg-easy-mode",
    ),
    makeDurationSelectDivProps(
      t("normalTitle"),
      onDurationSelectClick(5, RankType.normal),
      t("normalDescription"),
      "bg-normal-mode",
    ),
    makeDurationSelectDivProps(
      t("hardTitle"),
      onDurationSelectClick(1, RankType.hard),
      t("hardDescription"),
      "bg-hard-mode",
    ),
    makeDurationSelectDivProps(
      t("lunaticTitle"),
      onDurationSelectClick(0.5, RankType.lunatic),
      t("lunaticDescription"),
      "bg-lunatic-mode",
    ),
  ];
  return (
    <Transition
      className="absolute h-full w-full flex flex-col translate-y--100% bg-container transition-common"
      as="section"
      show={show}
      enterFrom="translate-x-100%"
      enterTo="translate-x-0"
      afterEnter={afterEnter}
      beforeLeave={beforeLeave}
      leaveFrom="translate-x-0"
      leaveTo="translate-x-100%"
    >
      <header className="relative">
        <button
          type="button"
          aria-label={t("back")}
          className="absolute left-0 top-0 w-fit p-1"
          onClick={() => {
            closePage();
          }}
        >
          <ArrowRightSSvg className="h-8 w-8" />
        </button>
        <h1 className="m-x-auto w-fit text-h1">
          {t("difficultyTitle")}
        </h1>
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
          ),
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
        className={`common-button p-x-4 p-y-2 text-h2 text-shadow-sm text-shadow-color-gray simple-hover-active ${
          buttonClassName ?? ""
        } dark:[--un-bg-opacity:0.8]`}
        type="button"
        onClick={onClick}
      >
        {title}
      </button>
      <p className="whitespace-pre-wrap text-center text-p">{description}</p>
    </div>
  );
}
