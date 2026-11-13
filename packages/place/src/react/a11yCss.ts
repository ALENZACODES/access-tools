export const a11yCss = `
:where(.app-ui) {
  color: #1b1b1b;
  background: #ffffff;
  font-family: "Segoe UI", "Atkinson Hyperlegible", "Noto Sans", sans-serif;
  font-size: 1.0625rem;
  line-height: 1.5;
}
:where(.app-ui) * { box-sizing: border-box; }
:where(.app-ui) a { color: #0b3a82; }
:where(.app-ui) a:focus-visible,
:where(.app-ui) button:focus-visible,
:where(.app-ui) input:focus-visible,
:where(.app-ui) select:focus-visible,
:where(.app-ui) textarea:focus-visible,
:where(.app-ui) .table-scroll:focus-visible {
  outline: 3px solid #0b3a82;
  outline-offset: 2px;
}
:where(.app-ui) button,
:where(.app-ui) input,
:where(.app-ui) select,
:where(.app-ui) textarea {
  font: inherit;
  color: #1b1b1b;
  background: #ffffff;
}
:where(.app-ui) button,
:where(.app-ui) select,
:where(.app-ui) input[type="text"],
:where(.app-ui) input[type="number"],
:where(.app-ui) input[type="search"] {
  min-height: 2.75rem;
  min-width: 2.75rem;
}
:where(.app-ui) input[type="checkbox"],
:where(.app-ui) input[type="radio"] {
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  accent-color: #0b3a82;
}
:where(.app-ui) .prototype-notice {
  background: #fff4d6;
  border: 2px solid #8a5a00;
  padding: 0.75rem 1rem;
  margin: 0.5rem 0 1rem;
  font-weight: 700;
}
:where(.app-ui) .honesty {
  background: #f4f7fb;
  border-left: 4px solid #0b3a82;
  padding: 0.75rem 1rem;
}
:where(.app-ui) .unknown { background: #fff8e8; }
:where(.app-ui) table { border-collapse: collapse; width: 100%; }
:where(.app-ui) th, :where(.app-ui) td {
  border: 1px solid #4a4a4a;
  padding: 0.5rem;
  text-align: left;
  vertical-align: top;
}
:where(.app-ui) th { background: #eef2f6; }
:where(.app-ui) .table-scroll { overflow-x: auto; max-width: 100%; }
:where(.app-ui) .card {
  border: 1px solid #4a4a4a;
  padding: 1rem;
  margin: 0.75rem 0;
}
:where(.app-ui) .visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
:where(.app-ui) .stack { display: grid; gap: 0.75rem; max-width: 42rem; }
:where(.app-ui) fieldset > label,
:where(.app-ui) fieldset > select,
:where(.app-ui) fieldset > input[type="text"] {
  display: block;
  max-width: 100%;
}
:where(.app-ui) .error { color: #7a1020; font-weight: 700; }
@media (prefers-reduced-motion: reduce) {
  :where(.app-ui) * { scroll-behavior: auto; }
}
`;
