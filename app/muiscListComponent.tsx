"use client";
import { Switch, Tab } from "@headlessui/react";
import { Music, MusicCollection, MusicMap, PageType } from "./types";
import { SyntheticEvent, useMemo } from "react";

let MusicListType: PageType,
    OnClickTab: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void,
    OnClickMusic: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;

// TODO: 优化加载切换，pad上测试有点卡
export default function MusicList({
    musicMap,
    musicListType,
    onClickTab,
    onClickMusic,
}: {
    musicMap: MusicMap;
    musicListType: PageType.selecting | PageType.running;
    onClickTab: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
    onClickMusic: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    MusicListType = musicListType;
    OnClickMusic = onClickMusic;
    OnClickTab = onClickTab;
    return (
        musicMap && (
            <div className="flex flex-1 flex-col gap-1 overflow-auto p-0.5">
                <Tab.Group>
                    <H1TabList musicMap={musicMap} onClickTab={onClickTab} />
                    <H1TabPanels
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
        <Tab.List className="flex flex-row overflow-x-auto border-1 border-yellow rounded-lg text-center">
            {Object.entries(musicMap).map(([categoryName, value]) => (
                <Tab
                    key={categoryName}
                    className={`text-center min-w-22.5 @xs/main:min-w-initial flex-1 text-p p-1 border-x-1 bg-bg data-selected:bg-sky-4 hover:text-deep-pink data-selected:hover:text-inherit simple-hover-active-var transition ${
                        value.selected === 0
                            ? "brightness-85 [--thm-s-h-a:0.85]"
                            : "brightness-100 [--thm-s-h-a:1]"
                    }`}
                    onClick={(e) => {
                        OnClickTab(value.sid, e);
                    }}>
                    {categoryName}
                </Tab>
            ))}
        </Tab.List>
    );
}

function H1TabPanels({
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
    return (
        // 占据下方空间的
        <Tab.Panels className="flex-1 overflow-hidden">
            {Object.values(musicMap).map((classMap, idx) => (
                // 将下方空间化为左右两份的
                <Tab.Panel
                    key={idx}
                    className={`flex flex-row overflow-hidden h-full gap-2`}>
                    <Tab.Group>
                        <H2TabList
                            classMap={classMap.data as MusicMap}
                            onClickTab={onClickTab}
                        />
                        <H2TabPanels
                            classMap={classMap.data as MusicMap}
                            onClickMusic={onClickMusic}
                        />
                    </Tab.Group>
                </Tab.Panel>
            ))}
        </Tab.Panels>
    );
}

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
        <Tab.List className="w-40% flex flex-col overflow-y-auto border-1 border-yellow rounded-lg">
            {Object.entries(classMap).map(([albumName, value]) => (
                <Tab
                    key={albumName}
                    className={`text-p p-0.5 border-y-1 data-selected:bg-sky-3 hover:text-deep-pink data-selected:hover:text-inherit bg-bg simple-hover-active-var transition text-left ${
                        value.selected === 0
                            ? "brightness-85 [--thm-s-h-a:0.85]"
                            : "brightness-100 [--thm-s-h-a:1]"
                    }`}
                    onClick={(e) => {
                        OnClickTab(value.sid, e);
                    }}>
                    {albumName}
                </Tab>
            ))}
        </Tab.List>
    );
}

function H2TabPanels({
    classMap,
    onClickMusic,
}: {
    classMap: MusicMap;
    onClickMusic: (
        sid: number,
        e: SyntheticEvent<HTMLButtonElement, MouseEvent>
    ) => void;
}) {
    return (
        <Tab.Panels
            className={`flex-1 overflow-y-auto border-1 border-amber rounded-lg`}>
            {Object.values(classMap).map((album, idx) => (
                <Tab.Panel key={idx} className={``}>
                    {album.data instanceof Array ? (
                        <AlbumArrayList
                            albumArray={album.data}
                            onClickMusic={onClickMusic}
                        />
                    ) : (
                        <AlbumMapList
                            albumMap={album.data}
                            onClickMusic={onClickMusic}
                        />
                    )}
                </Tab.Panel>
            ))}
        </Tab.Panels>
    );
}

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
        <ol className="border-y-1">
            {albumArray.map((value: Music) => (
                <li key={value.idx} className={`group`}>
                    <Switch
                        className="group w-full p-0.5 text-left transition group-even:bg-gray-3 group-odd:bg-gray-2.5 text-p group-hover:text-deep-pink hover:brightness-102.5 group-even:data-checked:bg-sky-1.5 group-odd:data-checked:bg-sky-2 group-hover:data-checked:text-dark-orange"
                        checked={value.selected}
                        onClick={(e) => {
                            OnClickMusic(value.sid, e);
                        }}>
                        {value.name}
                    </Switch>
                </li>
            ))}
        </ol>
    );
}

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
            <div key={key} className={`text-p p-1`}>
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
