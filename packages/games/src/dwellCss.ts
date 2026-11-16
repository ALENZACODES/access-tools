/**
 * The held control gets a dashed outline as well as the bar, so the hold is shown in two places.
 * The second selector keeps the dashed outline when the held control also has keyboard focus,
 * where the games' own focus ring would otherwise replace it.
 * The strip at the bottom of the window has rows of fixed height, and the page
 * keeps room above it when it scrolls a control into view, so the strip does
 * not sit on top of the control in use.
 */
export const DWELL_CSS = `
[data-dwell-target],
[data-games-root] [data-dwell-target]:focus-visible {
  outline: 4px dashed currentColor;
  outline-offset: 3px;
}
[data-dwell-layer] progress,
[data-dwell-layer] [data-dwell-bar-space] {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 1.5rem;
}
html:has([data-dwell-layer]) {
  scroll-padding-bottom: 12rem;
}
`;
