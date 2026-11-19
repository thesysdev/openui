// Raw fragments are compiled together in shared/styles.ts to retain the original cascade.
export const rampKeyRules = [
  // [0] colour ramp key
  String.raw`
  /* A ramp's colour key above its grid (Heatmap, Cohorts), 10px over the first row like every legend.
     After the legend rules: the key is a legend too, and this must win. */
  .openui-dashboard-ramp-key {
    align-items: center;
    margin-bottom: 10px;
  }
`,
] as const;
