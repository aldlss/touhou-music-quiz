"use client";
import { useState } from "react";
import { ContainerDialog } from "../clientComponent";
import { BilibiliFillSvg, GithubFillSvg, InformationLineSvg } from "../svg";
import { DialogPanel, DialogTitle } from "@headlessui/react";
import Link from "next/link";
import { CommonSecondaryButton } from "../serverComponent";
import { useTranslations } from "next-intl";

export function InfoDialog() {
  const [isShow, setIsShow] = useState(false);
  const t = useTranslations("StartPage");
  const common = useTranslations("Common");

  return (
    <div>
      <button
        type="button"
        aria-label={t("showInformation")}
        onClick={() => {
          setIsShow(true);
        }}
      >
        <InformationLineSvg className="tips-icon" />
      </button>
      <ContainerDialog
        show={isShow}
        onClose={() => {
          setIsShow(false);
        }}
      >
        <DialogPanel className="p-4">
          <DialogTitle className="text-center text-h2">
            {t("about")}
          </DialogTitle>
          <p className="whitespace-pre-wrap p-2 text-center text-p">
            {`${t("program")}\naldlss\n${t("design")}\naldlss\n${t("musicSource")}\n`}
            <Link
              href="https://thwiki.cc"
              target="_blank"
              className="text-link"
            >
              THBWiki
            </Link>
            {`\n${t("iconSource")}\n`}
            <Link
              href="https://remixicon.com/"
              target="_blank"
              className="text-link"
            >
              Remix Icon
            </Link>
            {`\n${t("musicLists")}\n`}
            <Link href="/docs/selected" target="_blank" className="text-link">
              {t("byCategory")}
            </Link>
            {`   `}
            <Link href="/docs/same-name" target="_blank" className="text-link">
              {t("byName")}
            </Link>
            {`\n${t("specialThanks")}\nLizBaka / Ghost_ABB / 椿梦栀结 / 锵群的米娜 \n And You.`}
          </p>
          <address className="flex justify-center gap-2">
            <Link
              href="https://github.com/aldlss/touhou-music-quiz"
              target="_blank"
            >
              <GithubFillSvg className="w-8" />
            </Link>
            <Link
              href="https://www.bilibili.com/video/BV1Nz42167QC/"
              target="_blank"
            >
              <BilibiliFillSvg className="w-8 fill-pink" />
            </Link>
          </address>
          <div className="m-t-4 flex justify-center">
            <CommonSecondaryButton
              onClick={() => {
                setIsShow(false);
              }}
            >
              {common("close")}
            </CommonSecondaryButton>
          </div>
        </DialogPanel>
      </ContainerDialog>
    </div>
  );
}
