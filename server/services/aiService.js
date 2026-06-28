import { extractRulesFromText as extractRulesViaMLService } from "./mlService.js";

export async function extractRulesFromText(text) {
  return extractRulesViaMLService(text);
}
