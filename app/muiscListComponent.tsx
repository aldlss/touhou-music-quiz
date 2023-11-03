"use client";
import { Switch, Tab } from "@headlessui/react";
import { Music, MusicCollection, MusicMap } from "./types";
import React, { SyntheticEvent, memo, useCallback, useState } from "react";
import { voidFunc } from "./constant";

export default function MusicList({
    musicMap,
    onClickTab,
    onClickMusic,
}: {
    musicMap: MusicMap;
    onClickTab: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
    onClickMusic: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    const [selectedH1Tab, setSelectedH1Tab] = useState(0);
    return (
        musicMap && (
            <div className="flex flex-1 flex-col gap-1 overflow-auto p-0.5">
                <Tab.Group
                    selectedIndex={selectedH1Tab}
                    onChange={setSelectedH1Tab}>
                    <H1TabList musicMap={musicMap} onClickTab={onClickTab} />
                    <H1TabPanels
                        selectedH1Tab={selectedH1Tab}
                        musicMap={musicMap}
                        onClickTab={onClickTab}
                        onClickMusic={onClickMusic}
                    />
                </Tab.Group>
            </div>
        )
    );
}

function H1TabList({
    musicMap,
    onClickTab,
}: {
    musicMap: MusicMap;
    onClickTab: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    return (
        <Tab.List className="flex flex-row overflow-x-auto border-1 rounded-lg text-center border-tab-list-color">
            {Object.entries(musicMap).map(([categoryName, value]) => (
                <H1TabListItem
                    key={categoryName}
                    categoryName={categoryName}
                    itemSid={value.sid}
                    slectedChild={value.selected !== 0}
                    onClickTab={onClickTab}
                />
            ))}
        </Tab.List>
    );
}

const H1TabListItem = memo(function H1TabListItem({
    categoryName,
    itemSid,
    slectedChild,
    onClickTab,
}: {
    categoryName: string;
    itemSid: number;
    slectedChild: boolean;
    onClickTab: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    return (
        <>
            <TabListItemShell
                className="min-w-22.5 flex-1 border-l-2 @xs/main:min-w-initial border-tab-color first:border-unset"
                slectedChild={slectedChild}>
                <H1TabListInner
                    categoryName={categoryName}
                    itemSid={itemSid}
                    onClickTab={onClickTab}
                />
            </TabListItemShell>
        </>
    );
});

const H1TabListInner = memo(function H1TabListInner({
    categoryName,
    itemSid,
    onClickTab,
}: {
    categoryName: string;
    itemSid: number;
    onClickTab: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    return (
        <Tab
            // 感觉这个样式快要写爆了，已经要加 important 了
            className="bg-tab-child-checked h-full w-full p-1 text-center transition bg-tab-list data-selected:bg-sky-4 text-p data-selected:hover:text-common-color hover:text-purple !simple-hover-active-var !dark:data-selected:bg-deep-cyan-2"
            onClick={(e) => {
                onClickTab(itemSid, e);
            }}>
            {categoryName}
        </Tab>
    );
});

function H1TabPanels({
    musicMap,
    selectedH1Tab,
    onClickTab,
    onClickMusic,
}: {
    musicMap: MusicMap;
    selectedH1Tab: number;
    onClickTab: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
    onClickMusic: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    return (
        // 占据下方空间的
        <Tab.Panels className="flex-1 overflow-hidden">
            {Object.entries(musicMap).map(
                ([categoryName, classMap], idx) =>
                    idx === selectedH1Tab && (
                        // 将下方空间化为左右两份的
                        <H1TabPanelsItem
                            key={categoryName}
                            classMap={classMap}
                            onClickTab={onClickTab}
                            onClickMusic={onClickMusic}
                        />
                    )
            )}
        </Tab.Panels>
    );
}

const H1TabPanelsItem = memo(function H1TabPanelsItem({
    classMap,
    onClickMusic,
    onClickTab,
}: {
    classMap: MusicCollection;
    onClickMusic: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
    onClickTab: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    const [selectedH2Tab, setSelectedH2Tab] = useState(0);
    return (
        <Tab.Panel
            className="h-full flex flex-row gap-2 overflow-hidden"
            static>
            <Tab.Group
                selectedIndex={selectedH2Tab}
                onChange={setSelectedH2Tab}>
                <H2TabList
                    classMap={classMap.data as MusicMap}
                    onClickTab={onClickTab}
                />
                <H2TabPanels
                    selectedH2Tab={selectedH2Tab}
                    classMap={classMap.data as MusicMap}
                    onClickMusic={onClickMusic}
                />
            </Tab.Group>
        </Tab.Panel>
    );
});

function H2TabList({
    classMap,
    onClickTab,
}: {
    classMap: MusicMap;
    onClickTab: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    return (
        <Tab.List className="w-40% flex flex-col overflow-y-auto border-1 rounded-lg border-tab-list-color">
            {Object.entries(classMap).map(([albumName, value], idx) => (
                <H2TabListItem
                    key={albumName}
                    albumName={albumName}
                    slectedChild={value.selected !== 0}
                    itemSid={value.sid}
                    onClickTab={onClickTab}
                />
            ))}
        </Tab.List>
    );
}

const H2TabListItem = memo(function H2TabListItem({
    albumName,
    slectedChild,
    itemSid,
    onClickTab,
}: {
    albumName: string;
    slectedChild: boolean;
    itemSid: number;
    onClickTab: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    return (
        <>
            <TabListItemShell
                className="border-t-2 border-tab-color first:border-unset"
                slectedChild={slectedChild}>
                <H2TabListInner
                    albumName={albumName}
                    itemSid={itemSid}
                    onClickTab={onClickTab}
                />
            </TabListItemShell>
        </>
    );
});

const TabListItemShell = memo(function TabListItemShell({
    className,
    slectedChild,
    children,
}: {
    className?: string;
    slectedChild: boolean;
    children: React.ReactNode;
}) {
    return (
        <div
            className={`group ${className}`}
            data-thmquiz-state={
                slectedChild ? "child-checked" : "not-child-checked"
            }>
            {children}
        </div>
    );
});

const H2TabListInner = memo(function H2TabListInner({
    albumName,
    itemSid,
    onClickTab,
}: {
    albumName: string;
    itemSid: number;
    onClickTab: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    return (
        <Tab
            className="bg-tab-child-checked h-full w-full p-0.5 text-left transition bg-tab-list data-selected:bg-sky-3 text-p data-selected:hover:text-common-color hover:text-purple !simple-hover-active-var !dark:data-selected:bg-deep-cyan-r-2"
            onClick={(e) => {
                onClickTab(itemSid, e);
            }}>
            {albumName}
        </Tab>
    );
});

function H2TabPanels({
    classMap,
    selectedH2Tab,
    onClickMusic,
}: {
    classMap: MusicMap;
    selectedH2Tab: number;
    onClickMusic: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    return (
        <Tab.Panels className="flex-1 overflow-y-auto border-1 rounded-lg border-tab-list-color">
            {Object.entries(classMap).map(
                ([albumName, album], idx) =>
                    selectedH2Tab === idx && (
                        <H2TabPanelsItem
                            key={albumName}
                            album={album}
                            onClickMusic={onClickMusic}
                        />
                    )
            )}
        </Tab.Panels>
    );
}

const H2TabPanelsItem = memo(function H2TabPanelsItem({
    album,
    onClickMusic,
}: {
    album: MusicCollection;
    onClickMusic: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    // 这样搞是为了 onClickMusic 变化的时候不至于渲染下面所有的组件
    const musicOnClick = useCallback(
        (e: SyntheticEvent<HTMLDivElement, MouseEvent>) => {
            if (e.target instanceof HTMLButtonElement) {
                const sid = Number(e.target.dataset.sid);
                if (!isNaN(sid) && sid >= 0) {
                    // 这里该怎么改
                    onClickMusic(sid, e as any);
                }
            }
        },
        [onClickMusic]
    );
    return (
        <Tab.Panel className="" static={true}>
            <div onClick={musicOnClick}>
                {album.data instanceof Array ? (
                    <AlbumArrayList
                        albumArray={album.data}
                        onClickMusic={voidFunc}
                    />
                ) : (
                    <AlbumMapList
                        albumMap={album.data}
                        onClickMusic={voidFunc}
                    />
                )}
            </div>
        </Tab.Panel>
    );
});

function AlbumArrayList({
    albumArray,
    onClickMusic,
}: {
    albumArray: Music[];
    onClickMusic: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    return (
        <ol className="">
            {albumArray.map((value: Music) => (
                <AlbumArrayListItem
                    key={`${value.idx}.${value.name}`}
                    music={value}
                    onClickMusic={onClickMusic}
                />
            ))}
        </ol>
    );
}

const AlbumArrayListItem = memo(function AlbumArrayListItem({
    music,
    onClickMusic,
}: {
    music: Music;
    onClickMusic: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    return (
        <li className="group">
            <Switch
                data-sid={music.sid}
                className="group w-full p-0.5 text-left transition group-even:bg-gray-3 group-odd:bg-gray-2.5 text-p group-hover:text-purple hover:brightness-102.5 dark:group-even:bg-neutral-5.5 dark:group-odd:bg-neutral-6 group-even:data-checked:bg-sky-1.5 group-odd:data-checked:bg-sky-2 group-hover:data-checked:text-dark-orange dark:group-even:data-checked:bg-deep-cyan-1 dark:group-odd:data-checked:bg-deep-cyan-r-1"
                checked={music.selected}
                onClick={(e) => {
                    onClickMusic(music.sid, e);
                }}>
                {music.name}
            </Switch>
        </li>
    );
});

function AlbumMapList({
    albumMap,
    onClickMusic,
}: {
    albumMap: MusicMap;
    onClickMusic: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    return Object.entries(albumMap).map(([key, albumArray]) => (
        <>
            <div key={key} className="p-1 text-p">
                {key}
            </div>
            {albumArray.data instanceof Array ? (
                <AlbumArrayList
                    albumArray={albumArray.data}
                    onClickMusic={onClickMusic}
                />
            ) : (
                <></>
            )}
        </>
    ));
}
