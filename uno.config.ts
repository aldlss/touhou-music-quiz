import { defineConfig, presetUno, transformerVariantGroup } from "unocss";

export default defineConfig({
    presets: [presetUno()],
    transformers: [transformerVariantGroup()],
    shortcuts: {
        "text-h1": "text-8 @md/main:text-10 @lg/main:text-12",
        "text-h2": "text-6 @md/main:text-8 @lg/main:text-10",
        "text-h3": "text-5 @md/main:text-6 @lg/main:text-7",
        "text-p": "text-4 @md/main:text-5 @lg/main:text-6",
        "transition-common": "transition ease-in-out duration-300",
        "simple-hover-active": "active:brightness-95 hover:brightness-105",
        "simple-hover-active-var":
            "active:brightness-[calc(var(--thm-s-h-a)-0.05)] hover:brightness-[calc(var(--thm-s-h-a)+0.05)]",
        "bg-bg": "bg-gray-1",
        "common-button":
            "border-1 rounded-lg text-center shadow-md disabled:grayscale transition-common",
        "secondary-button": "common-button bg-slate simple-hover-active",
        "main-button":
            "max-w-360px min-w-max w-50% bg-amber common-button active:bg-orange hover:bg-yellow text-h2",
        "flex-2": "flex-[2_2_0%]",
        "flex-3": "flex-[3_3_0%]",
        "animate-fade-in-up-fast":
            "animate-fade-in-up animate-duration-800 animate-ease-out",
    },
    rules: [["justify-center-safe", { "justify-content": "safe center" }]],
    theme: {
        data: {
            selected: "headlessui-state~=selected",
            checked: "headlessui-state~=checked",
        },
        colors: {
            "pure-yellow": "#ffff00",
            "pure-red": "#ff0000",
            "sky-1.5": "#cdecfe",
            "gray-2.5": "#dbdee3",
            "easy-mode": "#5df44c",
            "normal-mode": "#51ace7",
            "hard-mode": "#1974fc",
            "lunatic-mode": "#bf00bd",
            "deep-pink": "#ff1493",
            "dark-orange": "#ff8c00",
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
        animation: {},
    },
});
