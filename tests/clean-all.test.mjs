import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const routeSource = readFileSync(
  new URL("../app/clean-all/route.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(routeSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function loadRoute(password = "test-password") {
  const calls = [];
  const exported = {};
  const cache = {
    revalidateTag: (...args) => calls.push(["tag", ...args]),
    revalidatePath: (...args) => calls.push(["path", ...args]),
  };
  runInNewContext(compiled, {
    exports: exported,
    require: (name) => {
      assert.equal(name, "next/cache");
      return cache;
    },
    process: { env: { API_CLEAN_PASSWORD: password } },
    Response,
  });
  return { ...exported, calls };
}

test("GET with a tag expires that tag immediately", async () => {
  const route = loadRoute();
  const response = await route.GET({
    nextUrl: new URL(
      "https://example.test/clean-all?clean_password=test-password&tag=music-names",
    ),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(body.tag, "music-names");
  assert.equal(body.revalidated, true);
  assert.deepEqual(JSON.parse(JSON.stringify(route.calls)), [
    ["tag", "music-names", { expire: 0 }],
  ]);
  assert.equal(JSON.stringify(body).includes("test-password"), false);
});

test("GET rejects missing or incorrect passwords without invalidating caches", async () => {
  for (const query of ["", "?clean_password=wrong-password"]) {
    const route = loadRoute();
    const response = await route.GET({
      nextUrl: new URL(`https://example.test/clean-all${query}`),
    });
    assert.equal(response.status, 401);
    assert.equal(route.calls.length, 0);
  }
});

test("an unconfigured password disables cache cleaning", async () => {
  const route = loadRoute("");
  const get = await route.GET({
    nextUrl: new URL("https://example.test/clean-all"),
  });
  assert.equal(get.status, 503);
  assert.equal(route.calls.length, 0);
});

test("GET without a tag invalidates every page under the root layout", async () => {
  const route = loadRoute();
  const response = await route.GET({
    nextUrl: new URL(
      "https://example.test/clean-all?clean_password=test-password",
    ),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(body.revalidated, true);
  assert.equal(body.path, "/");
  assert.equal(body.type, "layout");
  assert.deepEqual(JSON.parse(JSON.stringify(route.calls)), [
    ["path", "/", "layout"],
  ]);
});
