import "client-only";

import type { OggOpusDecoderWebWorker } from "ogg-opus-decoder";
import { importOggOpusDecoder } from "../dynamicImport";
import { ErrorType } from "../types";
import { fetchMusicByUuid, isSupportOggOpus } from "./audio.client";

const FRAME_SECONDS = 0.02;
const SILENCE_ENERGY = 10 ** (-55 / 10);
export const MAX_ATTEMPTS = 5;
const TOTAL_SILENCE_RATIO_LIMIT = 0.6;
const CONTINUOUS_SILENCE_RATIO_LIMIT = 0.5;
const CONTINUOUS_SILENCE_SECONDS_LIMIT = 1;
const MAX_BATCH_SIZE = 12;
const workerQueues = new WeakMap<OggOpusDecoderWebWorker, Promise<void>>();

export type AudioWindowAnalysis = {
  frames: Uint8Array;
  silentSeconds: number;
  longestSilentSeconds: number;
  silentLimitSeconds: number;
  longestSilentLimitSeconds: number;
  risk: number;
};

export type AudioWindowSelectionAttempt = {
  startChunk: number;
  startTime: number;
  audioBuffer: AudioBuffer;
  analysis: AudioWindowAnalysis;
};

export type AudioWindowSelectionTrace = {
  attempts: AudioWindowSelectionAttempt[];
  selectedAttemptIndex: number;
};

type Options = {
  musicUuid: string;
  totalChunkCount: number;
  duration: number;
  audioContext: AudioContext;
  decoderRef: { current: OggOpusDecoderWebWorker | null };
  signal?: AbortSignal;
  onTrace?: (trace: AudioWindowSelectionTrace) => void;
  errorMessages: {
    fetchMusicError: (error: unknown) => string;
    decodeResultMissing: string;
  };
};

function checkAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException("Aborted", "AbortError");
  }
}

function getRequiredChunkCount(duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new RangeError("duration must be positive");
  }

  // 切片单独解码后通常略短于 1 秒，按 0.99 秒计算可避免最终长度不足。
  return Math.ceil(duration / 0.99);
}

/**
 * 分析实际播放窗口中的低能量帧，并计算是否值得重新随机选段的风险值。
 *
 * PCM 按 20ms 分帧，以 -55dBFS 为静音阈值。每个声道单独计算能量，只要
 * 任一声道超过阈值，该帧就视为有声，避免双声道反相信号相互抵消。
 *
 * 风险值取以下两项的较大值：
 * - 总静音时长 / 播放时长的 60%；
 * - 最长连续静音 / `min(播放时长的 50%, 1 秒)`。
 *
 * `risk < 1` 表示可以直接使用；`risk >= 1` 只表示值得换一个随机窗口，
 * 并不是音频损坏或不可播放。
 *
 * @param audioBuffer 已解码并合并的连续音频。
 * @param startTime 播放窗口在 `audioBuffer` 内的起始秒数。
 * @param duration 播放窗口时长，单位为秒。
 * @returns 静音帧、静音时长、对应阈值及风险值。
 * @throws {RangeError} 参数不是有限数值、窗口越界或时长不大于 0 时抛出。
 */
export function analyzeAudioWindow(
  audioBuffer: AudioBuffer,
  startTime: number,
  duration: number,
): AudioWindowAnalysis {
  if (
    !Number.isFinite(startTime) ||
    startTime < 0 ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    throw new RangeError("invalid audio window");
  }

  const startSample = Math.floor(startTime * audioBuffer.sampleRate);
  const requiredSamples = Math.ceil(duration * audioBuffer.sampleRate);
  const endSample = startSample + requiredSamples;
  if (endSample > audioBuffer.length) {
    throw new RangeError("audio buffer is too short");
  }

  const frameSize = Math.max(
    1,
    Math.round(audioBuffer.sampleRate * FRAME_SECONDS),
  );
  const frames = new Uint8Array(Math.ceil(requiredSamples / frameSize));
  let silentSamples = 0;
  let currentSilentSamples = 0;
  let longestSilentSamples = 0;

  for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
    const frameStart = startSample + frameIndex * frameSize;
    const frameEnd = Math.min(frameStart + frameSize, endSample);
    const sampleCount = frameEnd - frameStart;
    const energyLimit = SILENCE_ENERGY * sampleCount;
    let isSilent = true;

    for (
      let channelIndex = 0;
      channelIndex < audioBuffer.numberOfChannels;
      channelIndex++
    ) {
      const channel = audioBuffer.getChannelData(channelIndex);
      let energy = 0;
      for (
        let sampleIndex = frameStart;
        sampleIndex < frameEnd;
        sampleIndex++
      ) {
        const sample = channel[sampleIndex];
        energy += sample * sample;
        if (energy > energyLimit) break;
      }
      if (!Number.isFinite(energy) || energy > energyLimit) {
        isSilent = false;
        break;
      }
    }

    if (isSilent) {
      frames[frameIndex] = 1;
      silentSamples += sampleCount;
      currentSilentSamples += sampleCount;
      longestSilentSamples = Math.max(
        longestSilentSamples,
        currentSilentSamples,
      );
    } else {
      currentSilentSamples = 0;
    }
  }

  const silentSeconds = silentSamples / audioBuffer.sampleRate;
  const longestSilentSeconds = longestSilentSamples / audioBuffer.sampleRate;
  const silentLimitSeconds = duration * TOTAL_SILENCE_RATIO_LIMIT;
  const longestSilentLimitSeconds = Math.min(
    duration * CONTINUOUS_SILENCE_RATIO_LIMIT,
    CONTINUOUS_SILENCE_SECONDS_LIMIT,
  );

  return {
    frames,
    silentSeconds,
    longestSilentSeconds,
    silentLimitSeconds,
    longestSilentLimitSeconds,
    risk: Math.max(
      silentSeconds / silentLimitSeconds,
      longestSilentSeconds / longestSilentLimitSeconds,
    ),
  };
}

async function inBatches<Item, Result>(
  items: Item[],
  operation: (item: Item) => Promise<Result>,
) {
  const results: Result[] = [];
  for (let start = 0; start < items.length; start += MAX_BATCH_SIZE) {
    results.push(
      ...(await Promise.all(
        items.slice(start, start + MAX_BATCH_SIZE).map(operation),
      )),
    );
  }
  return results;
}

function createChunkLoader(options: Omit<Options, "duration" | "onTrace">) {
  const decoded = new Map<number, AudioBuffer>();
  const { audioContext, decoderRef, signal } = options;

  const decodeWithWorker = async (encodedChunks: ArrayBuffer[]) => {
    checkAborted(signal);
    if (decoderRef.current === null) {
      const { OggOpusDecoderWebWorker } = await importOggOpusDecoder();
      checkAborted(signal);
      decoderRef.current = decoderRef.current ?? new OggOpusDecoderWebWorker();
    }

    const decoder = decoderRef.current;
    const previous = workerQueues.get(decoder) ?? Promise.resolve();
    const task = previous.then(async () => {
      try {
        await decoder.ready;
        const buffers: AudioBuffer[] = [];
        for (const encoded of encodedChunks) {
          // Worker 会重置内部状态，同一个实例不能并发执行 decodeFile。
          checkAborted(signal);
          const data = await decoder.decodeFile(new Uint8Array(encoded));
          const buffer = audioContext.createBuffer(
            data.channelData.length,
            data.samplesDecoded,
            data.sampleRate,
          );
          data.channelData.forEach((channel, index) => {
            buffer.getChannelData(index).set(channel);
          });
          buffers.push(buffer);
        }
        return buffers;
      } catch (error) {
        if (signal?.aborted) throw error;
        throw Error(ErrorType.DecodeError, { cause: error });
      }
    });

    // 队列保存一个始终成功的完成信号，防止一次失败阻断后续解码任务。
    workerQueues.set(
      decoder,
      task.then(
        () => undefined,
        () => undefined,
      ),
    );
    return task;
  };

  const fetchChunks = async (indices: number[]) => {
    try {
      return await inBatches(indices, (index) =>
        fetchMusicByUuid(options.musicUuid, index, signal),
      );
    } catch (error) {
      if (signal?.aborted) throw error;
      throw Error(ErrorType.NetworkError, {
        cause: options.errorMessages.fetchMusicError(error),
      });
    }
  };

  return async (indices: number[]) => {
    const missing = indices.filter((index) => !decoded.has(index));
    if (missing.length > 0) {
      const encoded = await fetchChunks(missing);
      let buffers: AudioBuffer[];
      if (decoderRef.current !== null || !isSupportOggOpus) {
        buffers = await decodeWithWorker(encoded);
      } else {
        try {
          buffers = await inBatches(encoded, (item) =>
            audioContext.decodeAudioData(item),
          );
        } catch {
          // decodeAudioData 可能已分离输入，只在失败时重新获取 Worker 所需数据。
          buffers = await decodeWithWorker(await fetchChunks(missing));
        }
      }

      if (buffers.length !== missing.length) {
        throw Error(ErrorType.UnknownError, {
          cause: options.errorMessages.decodeResultMissing,
        });
      }
      missing.forEach((index, offset) => decoded.set(index, buffers[offset]));
    }
    return indices.map((index) => decoded.get(index)!);
  };
}

async function mergeAudioBuffers(buffers: AudioBuffer[]) {
  if (buffers.length === 1) return buffers[0];
  const context = new OfflineAudioContext(
    buffers[0].numberOfChannels,
    buffers.reduce((sum, buffer) => sum + buffer.length, 0),
    buffers[0].sampleRate,
  );

  let startTime = 0;
  for (const buffer of buffers) {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(startTime);
    startTime += buffer.duration;
  }
  return context.startRendering();
}

/**
 * 从指定曲目中随机选择一段长度符合要求、且不过度静音的连续音频。
 *
 * 每次尝试只获取最终可能播放的完整窗口，并扫描实际播放范围。风险值小于 1
 * 时立即返回；否则重新随机，最多尝试五次。五次都超过阈值时返回风险最低的
 * 一次，因此静音阈值不会使答题流程报错或卡住。不同尝试之间会复用重叠切片。
 * 曲目不足目标时长时直接返回整首曲目，不进行静音检测。
 *
 * @param options 选段所需的曲目信息、音频上下文、解码器和错误文案。
 * @param options.musicUuid 曲目的稳定 UUID，用于生成切片请求地址。
 * @param options.totalChunkCount 曲目现有的切片总数。
 * @param options.duration 最终需要播放的时长，单位为秒。
 * @param options.audioContext 用于浏览器解码及创建 Worker 解码结果的音频上下文。
 * @param options.decoderRef 页面级 OGG Opus Worker 引用，可在多道题之间复用。
 * @param options.signal 可选的取消信号；取消后不再继续该次选段任务。
 * @param options.onTrace 可选的过程回调，包含每次完整尝试，仅供开发调试。
 * @param options.errorMessages 网络和解码结果异常所使用的页面文案。
 * @returns 选中的合并音频及实际播放起点。
 * @throws {RangeError} 时长无效，或曲目没有可用切片时抛出。
 * @throws {Error} 音频请求、解码或合并结果异常时抛出。
 */
export async function selectMusicWindow({
  duration,
  onTrace,
  ...options
}: Options): Promise<{ audioBuffer: AudioBuffer; startTime: number }> {
  const chunkCount = getRequiredChunkCount(duration);
  if (options.totalChunkCount <= 0) {
    throw new RangeError("music has no chunks");
  }

  const loadChunks = createChunkLoader(options);
  if (options.totalChunkCount < chunkCount) {
    const indices: number[] = [];
    for (let index = 0; index < options.totalChunkCount; index++) {
      indices.push(index);
    }
    const buffers = await loadChunks(indices);
    checkAborted(options.signal);
    const audioBuffer = await mergeAudioBuffers(buffers);
    checkAborted(options.signal);
    return { audioBuffer, startTime: 0 };
  }

  const legalStartCount = options.totalChunkCount - chunkCount + 1;
  const attemptedStartChunks: number[] = [];
  const traceAttempts: AudioWindowSelectionAttempt[] | undefined =
    onTrace === undefined ? undefined : [];
  let bestAttempt: AudioWindowSelectionAttempt | undefined;
  let bestAttemptIndex = 0;

  for (let attemptIndex = 0; attemptIndex < MAX_ATTEMPTS; attemptIndex++) {
    const unusedStartCount = legalStartCount - attemptedStartChunks.length;
    let startChunk = Math.floor(
      Math.random() * (unusedStartCount > 0 ? unusedStartCount : legalStartCount),
    );
    if (unusedStartCount > 0) {
      // 先抽取未使用起点中的序号，再跳过按升序排列的已使用起点。
      for (const attemptedStartChunk of attemptedStartChunks) {
        if (attemptedStartChunk > startChunk) break;
        startChunk++;
      }
      attemptedStartChunks.push(startChunk);
      attemptedStartChunks.sort((left, right) => left - right);
    }
    const indices: number[] = [];
    for (let offset = 0; offset < chunkCount; offset++) {
      indices.push(startChunk + offset);
    }

    const audioBuffer = await mergeAudioBuffers(await loadChunks(indices));
    checkAborted(options.signal);
    const movableDuration = audioBuffer.duration - duration;
    if (movableDuration < 0) {
      throw Error(ErrorType.UnknownError, {
        cause: options.errorMessages.decodeResultMissing,
      });
    }

    const startTime = Math.random() * movableDuration;
    const analysis = analyzeAudioWindow(audioBuffer, startTime, duration);
    const attempt = { startChunk, startTime, audioBuffer, analysis };
    traceAttempts?.push(attempt);

    if (
      bestAttempt === undefined ||
      analysis.risk < bestAttempt.analysis.risk
    ) {
      bestAttempt = attempt;
      bestAttemptIndex = attemptIndex;
    }

    if (analysis.risk < 1) break;
  }

  onTrace?.({
    attempts: traceAttempts!,
    selectedAttemptIndex: bestAttemptIndex,
  });
  return {
    audioBuffer: bestAttempt!.audioBuffer,
    startTime: bestAttempt!.startTime,
  };
}
