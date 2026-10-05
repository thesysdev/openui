"use client";

import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import MuiSwitch from "@mui/material/Switch";
import {
  defineComponent,
  useFormName,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
} from "@openuidev/react-lang";
import { z } from "zod";

const SwitchItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const SwitchItem = defineComponent({
  name: "SwitchItem",
  props: SwitchItemSchema,
  description: "Toggle option in a SwitchGroup.",
  component: () => null,
});

const SwitchGroupSchema = z.object({
  name: z.string(),
  items: z.array(SwitchItem.ref),
});

export const SwitchGroup = defineComponent({
  name: "SwitchGroup",
  props: SwitchGroupSchema,
  description: "Group of toggle switches. items: SwitchItem[].",
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();

    const fieldName = props.name as string;
    const current = (getFieldValue(formName, fieldName) as string[] | undefined) ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = ((props.items ?? []) as any[]).filter((item) => item?.props?.value);

    return (
      <FormGroup>
        {items.map((item, i) => {
          const val = item.props.value as string;
          const checked = current.includes(val);
          return (
            <FormControlLabel
              key={i}
              labelPlacement="start"
              sx={{ justifyContent: "space-between", ml: 0 }}
              control={
                <MuiSwitch
                  checked={checked}
                  disabled={isStreaming}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...current, val]
                      : current.filter((v: string) => v !== val);
                    setFieldValue(formName, "SwitchGroup", fieldName, next, true);
                  }}
                />
              }
              label={item.props.label || val}
            />
          );
        })}
      </FormGroup>
    );
  },
});
