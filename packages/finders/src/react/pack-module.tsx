import { createElement, type ReactElement } from "react";
import { PackFindersPage } from "./PackFindersPage.js";
import type { PackSource } from "../pack-types.js";

/** Shell adapter: the passed data source is the only source of finder records. */
export function createFindersModule(source: PackSource) {
  function Page(): ReactElement { return createElement(PackFindersPage, { source }); }
  return { id: "finders", path: "/finders", Page, Component: Page };
}
