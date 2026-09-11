// Eve treats openai.responses as OpenAI and injects the hosted web_search
// provider tool. This overlay does not attach Cloud search; disable Eve's
// copy so it does not try to run `ws_*` calls locally.
import { disableTool } from "eve/tools";

export default disableTool();
