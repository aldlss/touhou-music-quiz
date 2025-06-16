import { createStore } from "zustand";
import {
  GetLocalStorageValue,
  LocalStorageKey,
  SetLocalStorageValue,
} from "../_tools/localStorage";
import { isClientSide } from "../_tools/clientSide";

export enum ThemeAppearanceType {
  Light = "Light",
  Dark = "Dark",
  Auto = "Auto",
}

export interface ThemeStore {
  showedTheme: ThemeAppearanceType.Light | ThemeAppearanceType.Dark;
  changeThemeAppearance: (target: ThemeAppearanceType) => void;
  switchThemeAppearance: () => void;
}

export const themeStore = createStore<ThemeStore>(() => ({
  showedTheme: ThemeAppearanceType.Light,
  changeThemeAppearance: () => {},
  switchThemeAppearance: () => {},
}));

let isInit = false;

/**
 * 初始化主题存储
 * @tips 请在客户端环境下调用此函数
 */
export function initThemeStore() {
  // 如果是 SSR 环境，则不需要处理主题
  if (!isClientSide() || isInit) return;
  isInit = true;

  // 监听系统主题变化
  // 注意：在 SSR 环境下，matchMedia 不可用，因此需要在客户端环境下使用
  const themeMatchQuery = matchMedia("(prefers-color-scheme: dark)");

  const changeThemeAppearance = (target: ThemeAppearanceType) => {
    function changeTheme(dark: boolean) {
      if (dark) {
        themeStore.setState({ showedTheme: ThemeAppearanceType.Dark });
        document.documentElement.classList.add("dark");
      } else {
        themeStore.setState({ showedTheme: ThemeAppearanceType.Light });
        document.documentElement.classList.remove("dark");
      }
    }
    switch (target) {
      case ThemeAppearanceType.Auto:
        SetLocalStorageValue(LocalStorageKey.ThemeAppearance, "auto");
        changeTheme(themeMatchQuery.matches);
        themeMatchQuery.onchange = (e) => {
          changeTheme(e.matches);
        };
        break;
      case ThemeAppearanceType.Light:
        SetLocalStorageValue(LocalStorageKey.ThemeAppearance, "light");
        themeMatchQuery.onchange = null;
        changeTheme(false);
        break;
      case ThemeAppearanceType.Dark:
        SetLocalStorageValue(LocalStorageKey.ThemeAppearance, "dark");
        themeMatchQuery.onchange = null;
        changeTheme(true);
        break;
    }
  };

  // 初始化主题
  const theme = GetLocalStorageValue(LocalStorageKey.ThemeAppearance, "auto");
  if (theme === "light") changeThemeAppearance(ThemeAppearanceType.Light);
  else if (theme === "dark") changeThemeAppearance(ThemeAppearanceType.Dark);
  else changeThemeAppearance(ThemeAppearanceType.Auto);

  themeStore.setState({
    changeThemeAppearance,

    switchThemeAppearance: () => {
      const { showedTheme: nowShowedTheme, changeThemeAppearance } =
        themeStore.getState();
      if (
        (nowShowedTheme === ThemeAppearanceType.Light) ===
        themeMatchQuery.matches
      ) {
        changeThemeAppearance(ThemeAppearanceType.Auto);
      } else {
        changeThemeAppearance(
          nowShowedTheme === ThemeAppearanceType.Dark
            ? ThemeAppearanceType.Light
            : ThemeAppearanceType.Dark,
        );
      }
    },
  });
}
