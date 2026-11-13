import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(
  new URL("../app/_tools/musicSelection.ts", import.meta.url),
  "utf8",
);
const exported = {};
runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  { exports: exported },
);
const { createMusicPicker } = exported;
const songs = (size) =>
  Array.from({ length: size }, (_, i) => ({ uuid: String(i), name: "同名曲" }));

function sequence(...values) {
  let index = 0;
  return () => {
    assert.ok(index < values.length, "随机数调用次数超出预期");
    return values[index++];
  };
}

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

test("空曲库立即报错", () => {
  assert.throws(() => createMusicPicker([], 10), /选曲列表不能为空/);
});

test("只有一首时允许连续重复；同一 UUID 不作为两个候选", () => {
  const song = songs(1)[0];
  const pick = createMusicPicker([song, song], 10, () => 0);
  for (let i = 0; i < 20; i++) assert.equal(pick(), song);
});

test("次数相同时，两种随机结果分别选中两首候选", () => {
  const music = songs(2);
  assert.equal(createMusicPicker(music, 0, sequence(0, 0, 0.49))(), music[1]);
  assert.equal(createMusicPicker(music, 0, sequence(0, 0, 0.5))(), music[0]);
});

test("第二候选跳过第一候选的位置，其余位置均可抽到", () => {
  const music = songs(5);
  for (let first = 0; first < music.length; first++) {
    const remaining = music.filter((_, index) => index !== first);
    for (let second = 0; second < remaining.length; second++) {
      const pick = createMusicPicker(
        music,
        0,
        sequence(
          (first + 0.5) / music.length,
          (second + 0.5) / remaining.length,
          0,
        ),
      );
      assert.equal(pick(), remaining[second]);
    }
  }
});

test("第二首候选与第一首不同，且次数少的优先", () => {
  const music = songs(2);
  const pick = createMusicPicker(
    music,
    10,
    sequence(0, 0, 0.9, 0, 0, 0.99, 0, 0.9, 0.99, 0),
  );
  // 第一次平局选 0；第二次选较少的 1；第三次平局选 1；第四次选较少的 0。
  assert.deepEqual(
    Array.from({ length: 4 }, () => pick().uuid),
    ["0", "1", "1", "0"],
  );
});

test("两首曲目累计次数最多相差一次，各局计数独立", () => {
  const music = songs(2);
  const pick = createMusicPicker(music, 10, () => 0);
  const counts = [0, 0];
  for (let i = 0; i < 100; i++) {
    counts[Number(pick().uuid)]++;
    assert.ok(Math.abs(counts[0] - counts[1]) <= 1);
  }
  assert.equal(pick(), music[1]);
  const fresh = createMusicPicker(music, 10, () => 0);
  assert.equal(fresh(), music[1]);
  assert.equal(fresh(), music[0]);
});

test("近期去重适配小曲库，不会因固定随机数而陷入重抽", () => {
  for (const size of [3, 4, 5, 20]) {
    const music = songs(size);
    const pick = createMusicPicker(music, 10, () => 0);
    const capacity = Math.min(10, size - 3);
    const recent = [];
    for (let i = 0; i < 100; i++) {
      const selected = pick();
      assert.ok(music.includes(selected));
      assert.ok(!recent.includes(selected.uuid));
      recent.push(selected.uuid);
      if (recent.length > capacity) recent.shift();
    }
  }
});

test("可选池交换删除与环形队列多次周转后，曲目不丢失且间隔有效", () => {
  for (const size of [4, 20, 1000]) {
    const music = songs(size);
    const original = music.slice();
    const capacity = size - 3;
    const pick = createMusicPicker(music, capacity, seededRandom(20261110));
    const lastSeen = new Map();
    for (let i = 0; i < size * 20; i++) {
      const selected = pick();
      assert.equal(selected, music[Number(selected.uuid)]);
      if (lastSeen.has(selected.uuid)) {
        assert.ok(i - lastSeen.get(selected.uuid) > capacity);
      }
      lastSeen.set(selected.uuid, i);
    }
    assert.equal(lastSeen.size, size);
    assert.deepEqual(music, original);
  }
});

test("100 首抽 150 次的固定种子模拟：减少遗漏和高频重复", () => {
  const music = songs(100);
  const totals = [];
  for (const balanced of [false, true]) {
    let unseen = 0;
    let fivePlus = 0;
    for (let run = 0; run < 1000; run++) {
      // 每轮独立设种子，两种算法使用相同的一组种子。
      const random = seededRandom(20261110 + run);
      const counts = Array(100).fill(0);
      const recent = [];
      const pick = balanced ? createMusicPicker(music, 10, random) : null;
      for (let i = 0; i < 150; i++) {
        let index;
        if (pick) index = Number(pick().uuid);
        else {
          do {
            index = Math.floor(random() * 100);
          } while (recent.includes(index));
          recent.push(index);
          if (recent.length > 10) recent.shift();
        }
        counts[index]++;
      }
      unseen += counts.filter((count) => count === 0).length;
      fivePlus += counts.filter((count) => count >= 5).length;
    }
    totals.push({ unseen, fivePlus });
  }
  assert.ok(
    totals[1].unseen < totals[0].unseen * 0.5,
    `遗漏曲目总数应减少一半以上：${JSON.stringify(totals)}`,
  );
  assert.ok(
    totals[1].fivePlus < totals[0].fivePlus * 0.1,
    `高频重复曲目总数应减少九成以上：${JSON.stringify(totals)}`,
  );
});
