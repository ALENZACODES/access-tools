/** The held control gets a dashed outline as well as the bar, so the hold is shown in two places. */
export const DWELL_CSS = `
[data-dwell-target] {
  outline: 4px dashed currentColor;
  outline-offset: 3px;
}
[data-dwell-layer] progress {
  width: 100%;
  height: 1.5rem;
}
`;
