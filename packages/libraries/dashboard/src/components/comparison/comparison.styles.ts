export const comparisonRules = [
  String.raw`
  .openui-dashboard-rowchart {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .openui-dashboard-rowchart-rows {
    flex: 1 1 auto;
    display: grid;
    gap: 6px;
    align-content: space-between;
  }
  /* His stylesheet raises a ranked list that opens its card onto the subtitle's line
     (margin-top: -32px), then cancels it whenever the card has a .card-controls element. Every
     Card renders that toolbar, so in his library the list never rises; it isn't ported. */
`,
] as const;
