import { getTestBed } from "@angular/core/testing";
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from "@angular/platform-browser-dynamic/testing";
import { afterAll, beforeAll } from "vitest";
import "zone.js";
import "zone.js/testing";

let initialized = false;

beforeAll(() => {
  if (!initialized) {
    getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
    initialized = true;
  }
});

afterAll(() => {
  if (initialized) {
    getTestBed().resetTestEnvironment();
    initialized = false;
  }
});
