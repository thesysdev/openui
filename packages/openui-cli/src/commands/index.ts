import { createCommand } from "./create/command";
import { deployCommand } from "./deploy/command";
import { generateApiKeyCommand } from "./generate-api-key/command";
import { generateCommand } from "./generate/command";

export const commands = [createCommand, deployCommand, generateApiKeyCommand, generateCommand];
