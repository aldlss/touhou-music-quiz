"use client";

import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { useTranslations } from "next-intl";
import React, { memo, useEffect } from "react";
import { voidFunc } from "../constant";
import { TouhouMusicQuizContainer } from "../serverComponent";

interface IContainerDialogProps {
  show: boolean;
  onClose: () => void;
  afterClose?: () => void;
  autoClose?: boolean;
  autoCloseTime?: number | (() => number);
  appear?: boolean;
  children: React.ReactNode;
}

export type IContainerDialogPropsBase = Omit<IContainerDialogProps, "children">;

/**
 * 需要自行在其中添加 Dialog 组件，例如 DialogPanel 以及 DialogTitle
 */
export function ContainerDialog(props: IContainerDialogProps) {
  const {
    show,
    onClose,
    afterClose = voidFunc,
    autoClose = false,
    autoCloseTime = 2000,
    appear = false,
    children,
  } = props;

  // 用于自动关闭界面
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoClose && show) {
      timer = setTimeout(
        () => {
          onClose();
        },
        typeof autoCloseTime === "function" ? autoCloseTime() : autoCloseTime,
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
      appear={appear}
    >
      <Dialog
        className="absolute left-0 top-0 h-full w-full"
        onClose={() => {
          onClose();
        }}
      >
        <TouhouMusicQuizContainer>
          <div className="relative h-full w-full flex flex-col items-center justify-center overflow-hidden rounded-lg">
            <TransitionChild
              as={React.Fragment}
              enter="transition transform-gpu"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition transform-gpu"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div
                className="absolute left-0 top-0 h-full w-full bg-black/10"
                aria-hidden={true}
              />
            </TransitionChild>
            <TransitionChild
              as={React.Fragment}
              enter="transition transform-gpu"
              enterFrom="scale-0 opacity-0"
              enterTo="scale-100 opacity-100"
              leave="transition transform-gpu"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y--30%"
            >
              <div className="z-10 max-h-90% w-90% overflow-y-auto border-1 border-surface-color rounded-lg bg-dialog shadow-md">
                {children}
              </div>
            </TransitionChild>
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
  title = operation,
  onClose = onCancel,
}: {
  show: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  operation: string;
  title?: string;
  onClose?: () => void;
}) {
  const t = useTranslations("Common");

  return (
    <ContainerDialog show={show} onClose={onClose}>
      <DialogPanel className="flex flex-col gap-2 p-4">
        <DialogTitle className="text-center text-h2">{title}</DialogTitle>
        <Description className="text-p">
          {t("confirmOperation", { operation })}
        </Description>
        <div className="flex flex-row justify-evenly gap-2 p-x-4">
          <button
            type="button"
            className="max-w-40% flex-1 secondary-button p-1 text-h3"
            onClick={onCancel}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            className="main-button max-w-40% flex-1 p-1 text-h3"
            onClick={onConfirm}
          >
            {t("confirm")}
          </button>
        </div>
      </DialogPanel>
    </ContainerDialog>
  );
});
