import * as esbuild from "esbuild";
import path from "node:path";

const settings = {
  entryPoints: [path.join(import.meta.dirname, "..", "src", "index.ts")],
  bundle: true,
  platform: "node",
  packages: "external",
  target: ["node20"],
  minify: true,
};
await esbuild.build({
  ...settings,
  outfile: path.join(import.meta.dirname, "..", "dist", "index.mjs"),
  format: "esm",
});

await esbuild.build({
  ...settings,
  outfile: path.join(import.meta.dirname, "..", "dist", "index.js"),
  format: "cjs",
});
