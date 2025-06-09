"use client";
import {
  Switch,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from "@headlessui/react";
import { Music, MusicCollection } from "./types";
import React, {
  Fragment,
  SyntheticEvent,
  memo,
  useCallback,
  useState,
  useTransition,
} from "react";
import { voidFunc } from "./constant";
import { isMusicList } from "./tools";

export const MusicList = memo(function MusicList({
  musicCollection,
  onClickTab,
  onClickMusic,
}: {
  musicCollection: MusicCollection;
  onClickTab: (
    sid: number,
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
  onClickMusic: (
    sid: number,
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
}) {
  const [selectedH1Tab, setSelectedH1Tab] = useState(0);
  const [isH1Pending, startH1Transition] = useTransition();
  const onChangeH1Tab = useCallback((n: number) => {
    startH1Transition(() => {
      setSelectedH1Tab(n);
    });
  }, []);
  return (
    musicCollection && (
      <div className="flex flex-1 flex-col gap-1 overflow-auto p-0.5">
        <TabGroup
          as={Fragment}
          selectedIndex={selectedH1Tab}
          onChange={onChangeH1Tab}
        >
          <H1TabList
            categoryCollection={musicCollection}
            onClickTab={onClickTab}
          />
          <H1TabPanels
            selectedH1Tab={selectedH1Tab}
            categoryCollection={musicCollection}
            isH1Pending={isH1Pending}
            onClickTab={onClickTab}
            onClickMusic={onClickMusic}
          />
        </TabGroup>
      </div>
    )
  );
});

const H1TabList = memo(function H1TabList({
  categoryCollection,
  onClickTab,
}: {
  categoryCollection: MusicCollection;
  onClickTab: (
    sid: number,
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
}) {
  return (
    <TabList className="flex flex-row overflow-x-auto border-1 rounded-lg text-center border-tab-list-color">
      {categoryCollection.data.map((category) => (
        <H1TabListItem
          key={category.name}
          categoryName={category.name}
          itemSid={category.sid}
          slectedChild={category.selected !== 0}
          onClickTab={onClickTab}
        />
      ))}
    </TabList>
  );
});

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
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
}) {
  return (
    <>
      <TabListItemShell
        className="min-w-22.5 flex-1 border-l-2 @xs/main:min-w-initial border-tab-color first:border-unset"
        slectedChild={slectedChild}
      >
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
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
}) {
  return (
    <Tab
      className="h-full w-full p-1 text-center transition text-p data-selected:hover:text-common-color hover:text-purple simple-hover-active bg-tab-h1"
      onClick={(e) => {
        onClickTab(itemSid, e);
      }}
    >
      {categoryName}
    </Tab>
  );
});

function H1TabPanels({
  categoryCollection,
  selectedH1Tab,
  isH1Pending,
  onClickTab,
  onClickMusic,
}: {
  categoryCollection: MusicCollection;
  selectedH1Tab: number;
  isH1Pending: boolean;
  onClickTab: (
    sid: number,
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
  onClickMusic: (
    sid: number,
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
}) {
  return (
    // 占据下方空间的
    <TabPanels
      className={`flex-1 overflow-hidden will-change-opacity transition-opacity-delay ${
        isH1Pending ? "opacity-80" : ""
      }`}
    >
      {categoryCollection.data.map(
        (category, idx) =>
          idx === selectedH1Tab && (
            // 将下方空间化为左右两份的
            <H1TabPanelsItem
              key={category.name}
              albumCollection={category as MusicCollection}
              onClickTab={onClickTab}
              onClickMusic={onClickMusic}
            />
          ),
      )}
    </TabPanels>
  );
}

const H1TabPanelsItem = memo(function H1TabPanelsItem({
  albumCollection,
  onClickMusic,
  onClickTab,
}: {
  albumCollection: MusicCollection;
  onClickMusic: (
    sid: number,
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
  onClickTab: (
    sid: number,
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
}) {
  const [selectedH2Tab, setSelectedH2Tab] = useState(0);
  const [isH2Pending, startH2Transition] = useTransition();
  const onChangeH2Tab = useCallback((n: number) => {
    startH2Transition(() => {
      setSelectedH2Tab(n);
    });
  }, []);
  return (
    <TabPanel className="h-full flex flex-row gap-2 overflow-hidden" static>
      <TabGroup
        as={Fragment}
        selectedIndex={selectedH2Tab}
        onChange={onChangeH2Tab}
      >
        <H2TabList albumCollection={albumCollection} onClickTab={onClickTab} />
        <H2TabPanels
          selectedH2Tab={selectedH2Tab}
          albumCollection={albumCollection}
          isH2Pending={isH2Pending}
          onClickMusic={onClickMusic}
        />
      </TabGroup>
    </TabPanel>
  );
});

const H2TabList = memo(function H2TabList({
  albumCollection,
  onClickTab,
}: {
  albumCollection: MusicCollection;
  onClickTab: (
    sid: number,
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
}) {
  return (
    <TabList className="w-40% overflow-y-auto border-1 rounded-lg will-change-scroll border-tab-list-color">
      {albumCollection.data.map((album) => (
        <H2TabListItem
          key={album.name}
          albumName={album.name}
          slectedChild={album.selected !== 0}
          itemSid={album.sid}
          onClickTab={onClickTab}
        />
      ))}
    </TabList>
  );
});

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
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
}) {
  return (
    <>
      <TabListItemShell
        className="border-t-2 border-tab-color first:border-unset"
        slectedChild={slectedChild}
      >
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
      data-thmquiz-state={slectedChild ? "child-checked" : "not-child-checked"}
    >
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
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
}) {
  return (
    <Tab
      className="h-full w-full p-0.5 text-left transition text-p data-selected:hover:text-common-color hover:text-purple simple-hover-active bg-tab-h2"
      onClick={(e) => {
        onClickTab(itemSid, e);
      }}
    >
      {albumName}
    </Tab>
  );
});

function H2TabPanels({
  albumCollection,
  selectedH2Tab,
  isH2Pending,
  onClickMusic,
}: {
  albumCollection: MusicCollection;
  selectedH2Tab: number;
  isH2Pending: boolean;
  onClickMusic: (
    sid: number,
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
}) {
  return (
    <TabPanels
      className={`flex-1 overflow-y-auto border-1 rounded-lg will-change-scroll-opacity border-tab-list-color transition-opacity-delay ${
        isH2Pending ? "opacity-80" : ""
      }`}
    >
      {albumCollection.data.map(
        (album, idx) =>
          selectedH2Tab === idx && (
            <H2TabPanelsItem
              key={album.name}
              album={album as MusicCollection}
              onClickMusic={onClickMusic}
            />
          ),
      )}
    </TabPanels>
  );
}

const H2TabPanelsItem = memo(function H2TabPanelsItem({
  album,
  onClickMusic,
}: {
  album: MusicCollection;
  onClickMusic: (
    sid: number,
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
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
    [onClickMusic],
  );
  return (
    <TabPanel className="" static={true}>
      <div onClick={musicOnClick}>
        {isMusicList(album.data) ? (
          <AlbumMusicList musicList={album.data} onClickMusic={voidFunc} />
        ) : (
          <SubAlbumCollectionList
            subAlbumList={album.data}
            onClickMusic={voidFunc}
          />
        )}
      </div>
    </TabPanel>
  );
});

function AlbumMusicList({
  musicList,
  onClickMusic,
}: {
  musicList: Music[];
  onClickMusic: (
    sid: number,
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
}) {
  return (
    <ol className="">
      {musicList.map((value: Music) => (
        <AlbumMusicListItem
          key={`${value.idx}.${value.name}`}
          music={value}
          onClickMusic={onClickMusic}
        />
      ))}
    </ol>
  );
}

const AlbumMusicListItem = memo(function AlbumMusicListItem({
  music,
  onClickMusic,
}: {
  music: Music;
  onClickMusic: (
    sid: number,
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
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
        }}
      >
        {music.name}
      </Switch>
    </li>
  );
});

function SubAlbumCollectionList({
  subAlbumList,
  onClickMusic,
}: {
  subAlbumList: MusicCollection[];
  onClickMusic: (
    sid: number,
    e: SyntheticEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
}) {
  return subAlbumList.map((subAlbum) => (
    <>
      <div key={subAlbum.name} className="p-1 text-p">
        {subAlbum.name}
      </div>
      {isMusicList(subAlbum.data) ? (
        <AlbumMusicList musicList={subAlbum.data} onClickMusic={onClickMusic} />
      ) : (
        <></>
      )}
    </>
  ));
}
