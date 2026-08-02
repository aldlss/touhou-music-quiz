"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Translate2LineSvg } from "../svg";

const localeLabels: Record<(typeof routing.locales)[number], string> = {
  "zh-CN": "中文",
  en: "English",
  ja: "日本語",
};

export function LanguageSwitcher({ label }: { label: string }) {
  const currentLocale = useLocale();

  return (
    <Menu as="div" className="relative">
      <MenuButton type="button" aria-label={label} className="icon-button">
        <Translate2LineSvg className="h-8 w-8" />
      </MenuButton>
      <MenuItems
        transition
        anchor="bottom"
        className="data-closed:scale-95 data-closed:opacity-0 z-20 mt-2 w-32 border-1 border-tab-color rounded-lg bg-dialog p-1 text-center text-p shadow-lg transition duration-100 ease-out"
      >
        {routing.locales.map((locale) => {
          const isCurrent = locale === currentLocale;
          return (
            <MenuItem key={locale}>
              <Link
                href="/"
                locale={locale}
                lang={locale}
                aria-current={isCurrent ? "page" : undefined}
                className={`data-focus:bg-tab-h2 block rounded-md p-x-2 p-y-1 transition ${
                  isCurrent ? "text-purple" : "hover:text-purple"
                }`}
              >
                {localeLabels[locale]}
              </Link>
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
}
