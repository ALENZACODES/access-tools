/**
 * The held control gets a dashed outline as well as the bar, so the hold is shown in two places.
 * The second selector keeps the dashed outline when the held control also has keyboard focus,
 * where the games' own focus ring would otherwise replace it.
 */
export const DWELL_CSS = `
[data-dwell-target],
[data-games-root] [data-dwell-target]:focus-visible {
  outline: 4px dashed currentColor;
  outline-offset: 3px;
}
[data-dwell-layer] progress {
  width: 100%;
  height: 1.5rem;
}
`;
