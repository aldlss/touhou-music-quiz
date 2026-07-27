import {
  DialogPanel,
  DialogTitle,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { memo } from "react";
import {
  type IContainerDialogPropsBase,
  ContainerDialog,
} from "../clientComponent";
import { type AnswerRecord } from "../types";
import { DisplayMusicName } from "../nameTools";
import { useTranslations } from "next-intl";

interface IResultSummaryDialogProps extends IContainerDialogPropsBase {
  answerAndResults: AnswerRecord[];
}

const AListItem = ({
  no,
  yourAnswer,
  correctAnswer,
  containerClassName,
  yourAnswerClassName,
  allowWrap = false,
}: {
  no: string;
  yourAnswer: string;
  correctAnswer: string;
  containerClassName?: string;
  yourAnswerClassName?: string;
  allowWrap?: boolean;
}) => {
  return (
    <div
      className={`grid grid-cols-[2.5rem_repeat(2,calc(50%-1.25rem))] overflow-clip ${allowWrap ? "whitespace-normal" : "whitespace-nowrap"} text-center ${containerClassName}`}
    >
      <p className="p-x-1">{no}</p>
      <p className={`overflow-clip p-x-1 ${yourAnswerClassName}`}>
        {yourAnswer}
      </p>
      <p className="overflow-clip p-x-1">{correctAnswer}</p>
    </div>
  );
};

const ResultSummaryContent = memo(function ResultSummaryContent({
  answerAndResults,
}: {
  answerAndResults: AnswerRecord[];
}) {
  const t = useTranslations("ResultSummary");

  return (
    <>
      <DialogTitle className="text-center text-h2">{t("title")}</DialogTitle>
      <AListItem
        no="No."
        correctAnswer={t("correctAnswer")}
        yourAnswer={t("yourAnswer")}
        containerClassName="sticky top-0 z-10 bg-dialog text-h3"
        allowWrap
      />
      <ol className="flex flex-col gap-1">
        {answerAndResults.map((answerAndResult, idx) => {
          const { playerAnswer, correctAnswer } = answerAndResult;
          const isCorrect = playerAnswer.uuid === correctAnswer.uuid;
          return (
            <Disclosure
              key={idx}
              as="li"
              className="overflow-clip border-2 border-tab-color-with-hover rounded-lg transition-transform hover:translate-y--0.25"
            >
              <DisclosureButton className="w-full bg-dialog-item p-y-1">
                <AListItem
                  no={`${idx + 1}`}
                  yourAnswer={playerAnswer.name}
                  yourAnswerClassName={
                    isCorrect
                      ? "text-accepted dark:text-accepted-dark"
                      : "text-wrong-answer dark-text-wrong-answer-dark"
                  }
                  correctAnswer={correctAnswer.name}
                  containerClassName="text-p"
                />
              </DisclosureButton>
              <DisclosurePanel
                transition
                className="data-enter:data-closed:scale-y-0 data-enter:data-closed:opacity-0 transform-origin-top whitespace-pre-wrap p-x-2 p-y-1 transition"
              >
                {t.rich("yourAnswerDetail", {
                  answer: () => <DisplayMusicName music={playerAnswer} />,
                })}
                {"\n"}
                {t.rich("correctAnswerDetail", {
                  answer: () => <DisplayMusicName music={correctAnswer} />,
                })}
              </DisclosurePanel>
            </Disclosure>
          );
        })}
      </ol>
    </>
  );
});

export function ResultSummaryDialog(props: IResultSummaryDialogProps) {
  const { answerAndResults, ...containerDialogProps } = props;
  const common = useTranslations("Common");

  return (
    <ContainerDialog {...containerDialogProps}>
      <DialogPanel className="flex flex-col gap-1 p-2">
        <ResultSummaryContent answerAndResults={answerAndResults} />
        <div className="sticky bottom-0 flex bg-dialog">
          <button
            type="button"
            onClick={containerDialogProps.onClose}
            className="m-x-auto w-30% secondary-button p-1 text-h3"
          >
            {common("close")}
          </button>
        </div>
      </DialogPanel>
    </ContainerDialog>
  );
}
