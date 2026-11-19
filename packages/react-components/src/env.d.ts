// Lets development checks read `process.env.NODE_ENV` in dot form, the only form Vite's dev server
// replaces in a package it serves unbundled, such as a linked workspace package.
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: string;
  }
}
