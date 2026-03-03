import type { Party } from "./types";
import { parties as mockParties } from "./mock-data";

export function getSeedParties(): Party[] {
  return [...mockParties];
}
