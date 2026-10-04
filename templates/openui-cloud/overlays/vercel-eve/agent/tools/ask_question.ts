// The chat UI has no renderer for Eve's ask_question input requests, so the
// session would park on an invisible question. Disabling the built-in makes
// the model ask clarifying questions in plain (OpenUI) text instead.
import { disableTool } from "eve/tools";

export default disableTool();
