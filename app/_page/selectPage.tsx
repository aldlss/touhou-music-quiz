import {
  Description,
  DialogPanel,
  DialogTitle,
  Transition,
} from "@headlessui/react";
import { useState, useCallback, memo } from "react";
import { Updater } from "use-immer";
import { ContainerDialog } from "../clientComponent";
import { MusicList } from "../muiscListComponent";
import { ArrowRightSSvg, QuestionLineSvg } from "../svg";
import { selectMusicCollectionBySid } from "../tools";
import {
  GetLocalStorageValue,
  LocalStorageKey,
  SetLocalStorageValue,
} from "../_tools/localStorage";
import { MusicCollection, PageType, RankType } from "../types";
import { CommonSecondaryButton } from "../serverComponent";

export interface ISelectPageProps {
  setPageState: Function;
  musicCollectionState: MusicCollection;
  setMusicCollectionState: Updater<MusicCollection>;
  setRank: Function;
  setMusicDuration: Function;
}

export function SelectPage(props: ISelectPageProps) {
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
          <h1 className="text-center text-h1">选择乐曲</h1>
          <button
            type="button"
            aria-label="help"
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
          className="self-center p-0.5 main-button"
          type="button"
          onClick={() => {
            setShowTimeSelect(true);
          }}
        >
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
      <DialogPanel className="flex flex-col gap-2 p-4">
        <DialogTitle className="text-center text-h2">选择原曲说明</DialogTitle>
        <Description className="text-p">
          主要是用于提高自由度的，简单来说就是可以选取用于进行测验的曲子的范围。
          <br />
          对于某一类目，在选取状态后再次点击可以 全选/全不选
          该类目下的所有曲子。
          <br />
          默认已选取 Windows 作品 下的所有曲子。
        </Description>
        <CommonSecondaryButton onClick={onClose}>
          我知道了
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
      "妖精级",
      onDurationSelectClick(10, RankType.easy),
      "用于熟悉曲子的难度(10s)\n再求精进是为人的基本",
      "bg-easy-mode",
    ),
    makeDurationSelectDivProps(
      "河童级",
      onDurationSelectClick(5, RankType.normal),
      "用于享受测验的难度(5s)\n幸福源于对自己充满信心",
      "bg-normal-mode",
    ),
    makeDurationSelectDivProps(
      "天狗级",
      onDurationSelectClick(1, RankType.hard),
      "让人拿出真本事的难度(1s)\n有必要好好研究一下其中的段落",
      "bg-hard-mode",
    ),
    makeDurationSelectDivProps(
      "鬼神级",
      onDurationSelectClick(0.5, RankType.lunatic),
      "逗你玩的难度(0.5s)\n一边喝酒一边听好了",
      "bg-lunatic-mode",
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
      leaveTo="translate-x-100%"
    >
      <header className="relative">
        <button
          type="button"
          aria-label="back"
          className="absolute left-0 top-0 w-fit p-1"
          onClick={() => {
            closePage();
          }}
        >
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
        className={`text-shadow-sm text-shadow-color-gray common-button p-y-2 p-x-4 text-h2 simple-hover-active ${
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
