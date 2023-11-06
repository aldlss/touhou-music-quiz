import { defineConfig, presetUno, transformerVariantGroup } from "unocss";

export default defineConfig({
    presets: [presetUno()],
    transformers: [transformerVariantGroup()],
    shortcuts: {
        "text-common-color": "text-black dark:text-gray-2",
        "border-surface-color":
            "border-gray-2 dark:border-dark transition-border-color",
        "border-tab-list-color":
            "border-yellow dark:border-gray-6 transition-border-color",
        "border-tab-color":
            "border-gray-2 dark:border-gray-4.5 transition-border-color",
        "bg-tab-h1":
            "bg-tab-list dark:data-selected:bg-deep-cyan-2 dark:group-data-not-child-checked:data-selected:bg-[#008384]  data-selected:bg-sky-4 group-data-not-child-checked:data-selected:bg-[#30a1d3]",
        "bg-tab-h2":
            "bg-tab-list data-selected:bg-sky-3 group-data-not-child-checked:data-selected:bg-[#6ab3d6] dark:data-selected:bg-deep-cyan-r-2 dark:group-data-not-child-checked:data-selected:bg-[#309596]",
        "text-h1": "text-8 @md/main:text-10 @lg/main:text-12",
        "text-h2": "text-6 @md/main:text-8 @lg/main:text-10",
        "text-h3": "text-5 @md/main:text-6 @lg/main:text-7",
        "text-p": "text-4 @md/main:text-5 @lg/main:text-6",
        "text-small": "text-3 @md/main:text-4 @lg/main:text-5",
        "transition-common": "transition ease-in-out duration-300",
        "simple-hover-active": "active:brightness-95 hover:brightness-105",
        "bg-bg":
            "bg-gray-1  dark:bg-material-dark-1 transition-background-color",
        "bg-container":
            "bg-white dark:bg-material-dark-2 transition-background-color",
        "bg-tab-list":
            "bg-white group-data-not-child-checked:bg-neutral-3 dark:bg-material-dark-5 dark:group-data-not-child-checked:bg-neutral-5.5 transition-background-color",
        "bg-dialog":
            "bg-white dark:bg-material-dark-6 transition-background-color",
        "common-button":
            "border-1 dark:border-dark rounded-lg text-center shadow-md disabled:grayscale transition-common",
        "secondary-button":
            "common-button bg-slate dark:bg-emerald simple-hover-active",
        "main-button":
            "max-w-360px min-w-max w-50% bg-amber dark:bg-violet-4 common-button active:bg-orange active:dark:bg-violet-4/50 hover:bg-yellow hover:dark:bg-[#b29afb] text-h2",
        "flex-2": "flex-[2_2_0%]",
        "flex-3": "flex-[3_3_0%]",
        "animate-fade-in-up-fast":
            "animate-fade-in-up animate-duration-800 animate-ease-out",
        "transition-opacity-delay":
            "transition-property-opacity transition-delay-100 transition-duration-300 transition-ease-out",
    },
    rules: [
        ["justify-center-safe", { "justify-content": "safe center" }],
        [
            "will-change-scroll-opacity",
            { "will-change": "scroll-position, opacity" },
        ],
    ],
    theme: {
        data: {
            selected: "headlessui-state~=selected",
            checked: "headlessui-state~=checked",
            "child-checked": "thmquiz-state~=child-checked",
            "not-child-checked": "thmquiz-state~=not-child-checked",
        },
        colors: {
            "pure-red": "#ff0000",
            "sky-1.5": "#cdecfe",
            "gray-2.5": "#dbdee3",
            "gray-4.5": "#7b8691",
            "gray-6.5": "#5c6b82",
            "easy-mode": "#5df44c",
            "normal-mode": "#51ace7",
            "hard-mode": "#1974fc",
            "lunatic-mode": "#bf00bd",
            "deep-pink": "#ff1493",
            "dark-orange": "#ff8c00",
            "neutral-5.5": "#606060",
            "material-dark-1": "#121212",
            "material-dark-2": "#1e1e1e",
            "material-dark-3": "#212121",
            "material-dark-4": "#242424",
            "material-dark-5": "#272727",
            "material-dark-6": "#2c2c2c",
            "material-dark-7": "#2e2e2e",
            "material-dark-8": "#333333",
            "material-dark-9": "#363636",
            "material-dark-10": "#383838",
            "material-dark-11": "#3d3d3d",
            "material-dark-12": "#424242",
            "material-dark-13": "#4a4a4a",
            "material-dark-14": "#515151",
            "deep-cyan-1": "#007678",
            "deep-cyan-2": "#009a9b",
            "deep-cyan-r-1": "#327f7f",
            "deep-cyan-r-2": "#38afb0",
        },
        media: {
            "h-sm": "(min-height: 480px)",
            "h-md": "(min-height: 600px)",
            "h-lg": "(min-height: 720px)",
        },
        containers: {
            xs: "(min-width: 22rem)",
            "2xs": "(min-width: 20rem)",
        },
    },
});
