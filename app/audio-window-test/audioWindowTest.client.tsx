"use client";

import type { OggOpusDecoderWebWorker } from "ogg-opus-decoder";
import { DialogPanel, DialogTitle } from "@headlessui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContainerDialog } from "../_dialog/commonDialogs";
import {
  MAX_ATTEMPTS,
  type AudioWindowSelectionAttempt,
  type AudioWindowSelectionTrace,
  selectMusicWindow,
} from "../_tools/audioWindowSelection.client";
import {
  flattenMusicCollection,
  isMusicCollection,
} from "../_tools/musicCollection";
import { MusicList } from "../musicListComponent";
import type { MusicCollection, QuizMusic } from "../types";

type Track = Pick<
  QuizMusic,
  "name" | "uuid" | "amount" | "collectionPath" | "sid"
>;
type Run = {
  audioBuffer: AudioBuffer;
  startTime: number;
  trace?: AudioWindowSelectionTrace;
};

const EDGE_RESULT_RATIO = 0.05;

function isEdgeAttempt(
  attempt: AudioWindowSelectionAttempt,
  totalChunkCount: number,
  duration: number,
) {
  const lastStartChunk = Math.max(
    0,
    totalChunkCount - Math.ceil(duration / 0.99),
  );
  if (lastStartChunk === 0) return false;
  const position = attempt.startChunk / lastStartChunk;
  return position <= EDGE_RESULT_RATIO || position >= 1 - EDGE_RESULT_RATIO;
}

function getPickerCollection(
  musicCollection: MusicCollection,
  selectedUuid: string,
) {
  const result = structuredClone(musicCollection);
  const updateSelected = (collection: MusicCollection): number => {
    let selected = 0;
    for (const item of collection.data) {
      if (isMusicCollection(item)) {
        selected += updateSelected(item);
      } else {
        item.selected = item.uuid === selectedUuid;
        if (item.selected) selected++;
      }
    }
    collection.selected = selected;
    return selected;
  };
  updateSelected(result);
  return result;
}

function TrackPickerDialog({
  show,
  musicCollection,
  selectedUuid,
  onSelect,
  onClose,
}: {
  show: boolean;
  musicCollection: MusicCollection;
  selectedUuid: string;
  onSelect: (sid: number) => void;
  onClose: () => void;
}) {
  const pickerCollection = useMemo(
    () => getPickerCollection(musicCollection, selectedUuid),
    [musicCollection, selectedUuid],
  );
  const ignoreTabSelection = useCallback(() => undefined, []);

  return (
    <ContainerDialog show={show} onClose={onClose} appear>
      <DialogPanel
        className="flex flex-col gap-2 p-3"
        style={{ height: "min(80vh, 42rem)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <DialogTitle className="text-h2">选择测试曲目</DialogTitle>
            <p className="text-sm text-gray-6 dark:text-gray-4">
              点击曲名后立即切换。
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 secondary-button p-x-3 p-y-1"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
        <MusicList
          musicCollection={pickerCollection}
          onClickTab={ignoreTabSelection}
          onClickMusic={onSelect}
        />
      </DialogPanel>
    </ContainerDialog>
  );
}

function getTimelineBackground(frames: Uint8Array) {
  const stops: string[] = [];
  let start = 0;
  for (let index = 1; index <= frames.length; index++) {
    if (index === frames.length || frames[index] !== frames[start]) {
      const color = frames[start] === 1 ? "#ef4444" : "#10b981";
      stops.push(
        `${color} ${(start / frames.length) * 100}%`,
        `${color} ${(index / frames.length) * 100}%`,
      );
      start = index;
    }
  }
  return stops.length === 0
    ? "#d1d5db"
    : `linear-gradient(to right, ${stops.join(", ")})`;
}

function AttemptCard({
  attempt,
  index,
  selected,
  onPlay,
}: {
  attempt: AudioWindowSelectionAttempt;
  index: number;
  selected: boolean;
  onPlay: () => void;
}) {
  const { analysis } = attempt;
  return (
    <article className="flex flex-col gap-2 border border-surface-color rounded-lg p-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-5 font-bold">第 {index + 1} 次尝试</h3>
        <span
          className={
            analysis.risk < 1
              ? "rounded bg-green-1 p-x-2 text-sm text-green-8 dark:bg-green-9/30 dark:text-green-2"
              : "rounded bg-red-1 p-x-2 text-sm text-red-8 dark:bg-red-9/30 dark:text-red-2"
          }
        >
          {analysis.risk < 1 ? "通过" : "触发重试"}
        </span>
        {selected && (
          <span className="rounded bg-blue-1 p-x-2 text-sm text-blue-8 dark:bg-blue-9/30 dark:text-blue-2">
            最终采用
          </span>
        )}
      </div>
      <p className="text-sm">
        第 {attempt.startChunk + 1} 片起，候选内偏移
        {attempt.startTime.toFixed(2)}s
      </p>
      <div
        className="h-5 border border-surface-color rounded-md"
        role="img"
        aria-label="绿色为有声，红色为静音"
        style={{ background: getTimelineBackground(analysis.frames) }}
      />
      <p className="text-sm">
        总静音 {analysis.silentSeconds.toFixed(2)}s / 阈值
        {analysis.silentLimitSeconds.toFixed(2)}s
      </p>
      <p className="text-sm">
        最长连续静音 {analysis.longestSilentSeconds.toFixed(2)}s / 阈值
        {analysis.longestSilentLimitSeconds.toFixed(2)}s
      </p>
      <p className="font-bold">风险值：{analysis.risk.toFixed(3)}</p>
      <button
        type="button"
        className="w-fit tertiary-button p-x-4 p-y-1"
        onClick={onPlay}
      >
        播放本次窗口
      </button>
    </article>
  );
}

export default function AudioWindowTest({
  musicCollection,
}: {
  musicCollection: MusicCollection;
}) {
  const tracks: Track[] = useMemo(
    () => flattenMusicCollection(musicCollection),
    [musicCollection],
  );
  const [trackUuid, setTrackUuid] = useState(tracks[0].uuid);
  const [showTrackPicker, setShowTrackPicker] = useState(false);
  const [duration, setDuration] = useState(0.5);
  const [run, setRun] = useState<Run | null>(null);
  const [excludeEdgeResults, setExcludeEdgeResults] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchProgress, setSearchProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const decoderRef = useRef<OggOpusDecoderWebWorker | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const track = tracks.find((item) => item.uuid === trackUuid)!;

  const getAudioContext = () => {
    audioContextRef.current ??= new AudioContext({ sampleRate: 48000 });
    return audioContextRef.current;
  };

  const stopPlaying = () => {
    sourceRef.current?.stop();
    sourceRef.current = null;
  };

  const clearResult = () => {
    stopPlaying();
    setRun(null);
    setError(null);
    setSearchProgress(null);
  };

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      sourceRef.current?.stop();
      if (decoderRef.current !== null) void decoderRef.current.free();
      if (audioContextRef.current !== null) {
        void audioContextRef.current.close();
      }
    },
    [],
  );

  const selectTrack = (sid: number) => {
    const selectedTrack = tracks.find((item) => item.sid === sid);
    if (selectedTrack !== undefined) {
      setTrackUuid(selectedTrack.uuid);
      clearResult();
    }
    setShowTrackPicker(false);
  };

  const play = async (
    audioBuffer: AudioBuffer,
    startTime: number,
    playDuration: number,
  ) => {
    const audioContext = getAudioContext();
    if (audioContext.state === "suspended") await audioContext.resume();
    stopPlaying();
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    sourceRef.current = source;
    source.onended = () => {
      if (sourceRef.current === source) sourceRef.current = null;
    };
    source.start(
      0,
      startTime,
      Math.min(playDuration, audioBuffer.duration - startTime),
    );
  };

  const selectOnce = async (signal: AbortSignal) => {
    let trace: AudioWindowSelectionTrace | undefined;
    const selection = await selectMusicWindow({
      musicUuid: track.uuid,
      totalChunkCount: track.amount,
      duration,
      audioContext: getAudioContext(),
      decoderRef,
      signal,
      onTrace: (value) => {
        trace = value;
      },
      errorMessages: {
        fetchMusicError: String,
        decodeResultMissing: "解码结果长度不足",
      },
    });
    return { ...selection, trace } satisfies Run;
  };

  const generate = async (findRetry: boolean) => {
    if (!Number.isFinite(duration) || duration <= 0) {
      setError("时长必须是大于 0 的数字");
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    clearResult();
    setLoading(true);
    let completed = 0;

    try {
      for (;;) {
        if (findRetry) {
          setSearchProgress(`正在寻找触发重试的结果（已完成 ${completed} 轮）`);
        }
        const nextRun = await selectOnce(controller.signal);
        completed++;
        const firstAttempt = nextRun.trace?.attempts[0];
        const foundRetry =
          (nextRun.trace?.attempts.length ?? 0) > 1 &&
          (!excludeEdgeResults ||
            (firstAttempt !== undefined &&
              !isEdgeAttempt(firstAttempt, track.amount, duration)));
        if (!findRetry || nextRun.trace === undefined || foundRetry) {
          setRun(nextRun);
          break;
        }
      }
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    } finally {
      if (controllerRef.current === controller) {
        setLoading(false);
        setSearchProgress(null);
      }
    }
  };

  const selectedAttempt = run?.trace?.attempts[run.trace.selectedAttemptIndex];

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="m-x-auto max-w-5xl flex flex-col gap-4">
        <header>
          <h1 className="text-8 font-bold">音频选段重试测试</h1>
          <p className="m-t-2 text-gray-6 dark:text-gray-4">
            完整检查实际播放窗口；风险达到 1
            时重新随机，最多 {MAX_ATTEMPTS} 次，最终采用风险最低的一次。
          </p>
        </header>

        <section className="grid gap-3 border border-surface-color rounded-xl bg-container p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_10rem] md:items-end">
          <div className="min-w-0 flex flex-col gap-1 font-bold">
            <span>曲目</span>
            <button
              type="button"
              aria-haspopup="dialog"
              className="min-w-0 w-full flex items-center justify-between gap-3 border border-surface-color rounded-md bg-bg p-2 text-left"
              disabled={loading}
              onClick={() => setShowTrackPicker(true)}
            >
              <span className="min-w-0 truncate font-normal">
                {[...track.collectionPath, track.name].join(" / ")}（
                {track.amount} 片）
              </span>
              <span className="shrink-0 text-sm">更换</span>
            </button>
          </div>
          <label className="flex flex-col gap-1 font-bold">
            播放时长（秒）
            <input
              className="min-w-0 w-full border border-surface-color rounded-md bg-bg p-2 font-normal"
              type="number"
              min="0.1"
              step="0.1"
              value={duration}
              disabled={loading}
              onChange={(event) => {
                setDuration(Number(event.target.value));
                clearResult();
              }}
            />
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button
              type="button"
              className="main-button min-w-36 flex-1 p-x-5 p-y-2 text-lg"
              disabled={loading}
              onClick={() => void generate(false)}
            >
              随机运行一次
            </button>
            <button
              type="button"
              className="min-w-36 flex-1 secondary-button p-x-5 p-y-2 text-lg"
              disabled={loading}
              onClick={() => void generate(true)}
            >
              寻找一次真实重试
            </button>
            {loading && (
              <button
                type="button"
                className="min-w-36 flex-1 tertiary-button p-x-5 p-y-2 text-lg"
                onClick={() => controllerRef.current?.abort()}
              >
                取消当前任务
              </button>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={excludeEdgeResults}
              disabled={loading}
              onChange={(event) => setExcludeEdgeResults(event.target.checked)}
            />
            寻找重试时忽略曲首、曲尾各 5% 的首次尝试
          </label>
        </section>

        {searchProgress !== null && (
          <p className="text-center text-gray-6 dark:text-gray-4">
            {searchProgress}
          </p>
        )}
        {error !== null && (
          <p className="border border-red-4 rounded-lg bg-red-1 p-3 text-red-8 dark:bg-red-9/30 dark:text-red-2">
            {error}
          </p>
        )}

        {run !== null && run.trace === undefined && (
          <section className="flex items-center justify-between gap-3 border border-surface-color rounded-xl bg-container p-4 shadow-sm">
            <div>
              <h2 className="text-6 font-bold">曲目短于目标时长</h2>
              <p className="text-sm">跳过静音检测，直接返回整首曲目。</p>
            </div>
            <button
              type="button"
              className="secondary-button p-x-5 p-y-2"
              onClick={() =>
                void play(run.audioBuffer, 0, run.audioBuffer.duration)
              }
            >
              播放整首
            </button>
          </section>
        )}

        {run?.trace !== undefined && (
          <section className="flex flex-col gap-3 border border-surface-color rounded-xl bg-container p-4 shadow-sm">
            <div>
              <h2 className="text-6 font-bold">本次完整运行记录</h2>
              <p className="m-t-1 text-sm text-gray-6 dark:text-gray-4">
                每张卡片都是实际检查过的完整播放窗口，可以逐段试听。
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {run.trace.attempts.map((attempt, index) => (
                <AttemptCard
                  key={index}
                  attempt={attempt}
                  index={index}
                  selected={index === run.trace!.selectedAttemptIndex}
                  onPlay={() =>
                    void play(attempt.audioBuffer, attempt.startTime, duration)
                  }
                />
              ))}
            </div>
            {selectedAttempt !== undefined && (
              <p className="font-bold">
                {selectedAttempt.analysis.risk < 1
                  ? run.trace.attempts.length === 1
                    ? "首次尝试通过，直接采用。"
                    : `第 ${run.trace.selectedAttemptIndex + 1} 次尝试通过，直接采用。`
                  : `已完成 ${run.trace.attempts.length} 次尝试，采用风险最低的第 ${run.trace.selectedAttemptIndex + 1} 次。`}
              </p>
            )}
          </section>
        )}
      </div>

      <TrackPickerDialog
        show={showTrackPicker}
        musicCollection={musicCollection}
        selectedUuid={trackUuid}
        onSelect={selectTrack}
        onClose={() => setShowTrackPicker(false)}
      />
    </main>
  );
}
