// React Native entry — identical to the web entry minus the devtools
// bootstrap: Metro resolves all import specifiers statically (including
// dynamic import()), and react-dom does not exist on native platforms.
// tsdown builds this entry with `.native` resolution, so `./components`
// resolves to components/index.native.tsx and the renderers mount react-native primitives.
export * from "./exports";
