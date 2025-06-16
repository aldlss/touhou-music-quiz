import {
  DialogPanel,
  DialogTitle,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { useMemo } from "react";
import {
  type IContainerDialogPropsBase,
  ContainerDialog,
} from "../clientComponent";
import { type AnswerRecord } from "../types";
import {
  getDisplayMusicNameFromRouteName,
  getMusicPureNameFromRouteName,
} from "../nameTools";

interface IResultSummaryDialogProps extends IContainerDialogPropsBase {
  answerAndResults: AnswerRecord[];
}

export function ResultSummaryDialog(props: IResultSummaryDialogProps) {
  const { answerAndResults, ...containerDialogProps } = props;

  const AListItem = ({
    no,
    yourAnswer,
    correctAnswer,
    containerClassName,
    yourAnswerClassName,
  }: {
    no: string;
    yourAnswer: string;
    correctAnswer: string;
    containerClassName?: string;
    yourAnswerClassName?: string;
  }) => {
    return (
      <div
        className={`grid grid-cols-[2.5rem_repeat(2,_calc(50%-1.25rem))] overflow-clip whitespace-nowrap text-center ${containerClassName}`}
      >
        <p className="p-x-1">{no}</p>
        <p className={`overflow-clip p-x-1 ${yourAnswerClassName}`}>
          {yourAnswer}
        </p>
        <p className="overflow-clip p-x-1">{correctAnswer}</p>
      </div>
    );
  };

  const ResultSummary = useMemo(() => {
    return (
      <>
        <AListItem
          no="No."
          correctAnswer="正确答案"
          yourAnswer="你的答案"
          containerClassName="sticky top-0 bg-dialog text-h3"
        />
        <ol className="flex flex-col gap-1">
          {answerAndResults.map((answerAndResult, idx) => {
            const {
              playerAnswerSid,
              playerAnswerName,
              correctAnswerSid,
              correctAnswerName,
            } = answerAndResult;
            const isCorrect = playerAnswerSid === correctAnswerSid;
            return (
              <Disclosure
                key={idx}
                as="li"
                className="border-2 rounded-lg overflow-clip transition-transform border-tab-color-with-hover hover:translate-y--0.25"
              >
                <DisclosureButton className={`w-full p-y-1 bg-dialog-item`}>
                  <AListItem
                    no={`${idx + 1}`}
                    yourAnswer={getMusicPureNameFromRouteName(playerAnswerName)}
                    yourAnswerClassName={`${
                      isCorrect
                        ? "text-accepted dark:text-accepted-dark"
                        : "text-wrong-answer dark-text-wrong-answer-dark"
                    }`}
                    correctAnswer={getMusicPureNameFromRouteName(
                      correctAnswerName,
                    )}
                    containerClassName="text-p"
                  />
                </DisclosureButton>
                <DisclosurePanel
                  transition
                  className="whitespace-pre-wrap p-x-2 p-y-1 transition data-[enter]:data-[closed]:scale-y-0 data-[enter]:data-[closed]:opacity-0 transform-origin-top"
                >
                  你的答案：
                  {getDisplayMusicNameFromRouteName(playerAnswerName)}
                  {"\n"}
                  正确答案：
                  {getDisplayMusicNameFromRouteName(correctAnswerName)}
                </DisclosurePanel>
              </Disclosure>
            );
          })}
        </ol>
      </>
    );
  }, [answerAndResults]);

  return (
    <ContainerDialog {...containerDialogProps}>
      <DialogPanel className="flex flex-col gap-1 p-2">
        <DialogTitle className="text-center text-h2">结果总结</DialogTitle>
        {ResultSummary}
        <div className="sticky bottom-0 flex bg-dialog">
          <button
            type="button"
            onClick={containerDialogProps.onClose}
            className="m-x-auto w-30% p-1 secondary-button text-h3"
          >
            关闭
          </button>
        </div>
      </DialogPanel>
    </ContainerDialog>
  );
}
