"use client";
import { useState } from "react";
import { ContainerDialog } from "../clientComponent";
import { BilibiliFillSvg, GithubFillSvg, InformationLineSvg } from "../svg";
import { Dialog } from "@headlessui/react";
import Link from "next/link";
import { CommonSecondaryButton } from "../serverComponent";

export function InfoDialog() {
    const [isShow, setIsShow] = useState(false);

    return (
        <div>
            <button
                type="button"
                aria-label="show infomation dialog"
                onClick={() => {
                    "a".startsWith("w");
                    setIsShow(true);
                }}>
                <InformationLineSvg className="tips-icon" />
            </button>
            <ContainerDialog
                show={isShow}
                onClose={() => {
                    setIsShow(false);
                }}>
                <Dialog.Panel className="p-4">
                    <Dialog.Title className="text-center text-h2">
                        关于
                    </Dialog.Title>
                    <p className="whitespace-pre-wrap p-2 text-center text-p">
                        {`【程序】\naldlss\n【设计】\naldlss\n【曲子资源及信息来源】\n`}
                        <Link
                            href="https://thwiki.cc"
                            target="_blank"
                            className="text-link">
                            THBWiki
                        </Link>
                        {`\n【图标来源】\n`}
                        <Link
                            href="https://remixicon.com/"
                            target="_blank"
                            className="text-link">
                            Remix Icon
                        </Link>
                        {`\n【特别感谢】\nLizBaka / Ghost_ABB / 椿梦栀结 / 锵群的米娜 \n And You.`}
                    </p>
                    <address className="flex justify-center gap-2">
                        <Link
                            href="https://github.com/aldlss/touhou-music-quiz"
                            target="_blank">
                            <GithubFillSvg className="w-8" />
                        </Link>
                        <Link
                            href="https://www.bilibili.com/video/BV1Nz42167QC/"
                            target="_blank">
                            <BilibiliFillSvg className="w-8 fill-pink" />
                        </Link>
                    </address>
                    <div className="m-t-4 flex justify-center">
                        <CommonSecondaryButton
                            onClick={() => {
                                setIsShow(false);
                            }}>
                            关闭
                        </CommonSecondaryButton>
                    </div>
                </Dialog.Panel>
            </ContainerDialog>
        </div>
    );
}
