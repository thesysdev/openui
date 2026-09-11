// Eve treats openai.responses as OpenAI and injects the hosted web_search
// provider tool. Thesys already has its own search tools; mixing them leaves
// unanswered `ws_*` calls in the loop. This overlay does not attach hosted
// search — disable Eve's copy so the model only sees app tools like get_weather.
import { disableTool } from "eve/tools";

export default disableTool();
