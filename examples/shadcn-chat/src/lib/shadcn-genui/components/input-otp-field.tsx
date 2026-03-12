"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  defineComponent,
  useFormName,
  useGetFieldValue,
  useIsStreaming,
  useSetFieldValue,
} from "@openuidev/react-lang";
import { z } from "zod";

const InputOTPFieldSchema = z.object({
  name: z.string(),
  length: z.number().optional(),
  groupSize: z.number().optional(),
});

export const InputOTPField = defineComponent({
  name: "InputOTPField",
  props: InputOTPFieldSchema,
  description:
    "OTP code input field. length: total digits (default 6). groupSize: digits per group (default 3).",
  component: ({ props }) => {
    const formName = useFormName();
    const getFieldValue = useGetFieldValue();
    const setFieldValue = useSetFieldValue();
    const isStreaming = useIsStreaming();

    const fieldName = props.name as string;
    const length = props.length ?? 6;
    const groupSize = props.groupSize ?? 3;
    const value = (getFieldValue(formName, fieldName) as string | undefined) ?? "";

    const groups: number[][] = [];
    for (let i = 0; i < length; i += groupSize) {
      const group: number[] = [];
      for (let j = i; j < Math.min(i + groupSize, length); j++) {
        group.push(j);
      }
      groups.push(group);
    }

    return (
      <InputOTP
        maxLength={length}
        value={value}
        onChange={(val) => setFieldValue(formName, "InputOTPField", fieldName, val, true)}
        disabled={isStreaming}
      >
        {groups.map((group, gi) => (
          <span key={gi} className="inline-flex items-center">
            {gi > 0 && <InputOTPSeparator />}
            <InputOTPGroup>
              {group.map((slotIndex) => (
                <InputOTPSlot key={slotIndex} index={slotIndex} />
              ))}
            </InputOTPGroup>
          </span>
        ))}
      </InputOTP>
    );
  },
});
