// lucide-react ships its lazy icon loader as dynamic.mjs with types in dynamic.d.ts and
// no exports map. Importing the .mjs path lets every bundler (including the openui CLI's
// esbuild step, which does not try .mjs) resolve it; this gives that path its types.
declare module "lucide-react/dynamic.mjs" {
  export * from "lucide-react/dynamic";
}
