/**
 * Slack payload normalizers: extract the values interactive elements report in
 * block_actions and view_submission payloads, keyed for the engine's actionMap.
 */

/** The value a bound input reports in its block_action payload. */
export function inputValue(action: any): unknown {
  switch (action.type) {
    case "static_select":
    case "radio_buttons":
    case "overflow":
      return action.selected_option?.value;
    case "multi_static_select":
    case "checkboxes":
      return (action.selected_options ?? []).map((o: any) => o.value);
    case "datepicker":
      return action.selected_date;
    case "timepicker":
      return action.selected_time;
    case "datetimepicker":
      return action.selected_date_time;
    case "users_select":
      return action.selected_user;
    case "multi_users_select":
      return action.selected_users ?? [];
    case "channels_select":
      return action.selected_channel;
    case "multi_channels_select":
      return action.selected_channels ?? [];
    case "conversations_select":
      return action.selected_conversation;
    case "multi_conversations_select":
      return action.selected_conversations ?? [];
    case "plain_text_input":
      return action.value; // in-message TextBox, dispatched on Enter
    default:
      return undefined; // button: runs a plan, carries no value
  }
}

/** Collect { $var: value } from a submitted modal's field values. */
export function viewValues(view: any): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const values = view?.state?.values ?? {};
  for (const blockId of Object.keys(values)) {
    for (const actionId of Object.keys(values[blockId])) {
      const v = viewInputValue(values[blockId][actionId]);
      if (v !== undefined) patch[actionId] = v;
    }
  }
  return patch;
}

function viewInputValue(el: any): unknown {
  switch (el?.type) {
    case "number_input":
      return el.value === "" || el.value == null ? undefined : Number(el.value);
    case "static_select":
      return el.selected_option?.value;
    case "multi_static_select":
      return (el.selected_options ?? []).map((o: any) => o.value);
    case "datepicker":
      return el.selected_date;
    case "timepicker":
      return el.selected_time;
    case "datetimepicker":
      return el.selected_date_time;
    default:
      return el?.value; // plain_text_input / email_text_input / url_text_input
  }
}
