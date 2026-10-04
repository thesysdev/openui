"use client";

import {
  type ComponentRenderProps,
  defineComponent,
  useFormName,
  useIsStreaming,
  useSetFieldValue,
  useStateField,
} from "@openuidev/react-lang";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import React, { useCallback } from "react";
import { CheckBoxItem } from "../../../../components/CheckBoxItem";
import { DASHBOARD_CLASS_PREFIX } from "../../classPrefix";
import {
  type FilterMultiSelectProps,
  filterMultiSelectPropsSchema,
  type FilterSelectProps,
  filterSelectPropsSchema,
} from "./schema";

type OptionItem = { value: string; label: string };

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  React.useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [ref, onClose]);
}

function normalizeOptions(options: Array<{ value?: string; label?: string } | any>): OptionItem[] {
  return options
    .map((opt) => {
      const props = opt?.props ?? opt;
      return {
        value: props?.value as string | undefined,
        label: (props?.label ?? props?.value) as string | undefined,
      };
    })
    .filter((o): o is OptionItem => !!o.value);
}

function FilterSelectRenderer({ props }: ComponentRenderProps<FilterSelectProps>) {
  const isStreaming = useIsStreaming();
  const formName = useFormName();
  const setFieldValue = useSetFieldValue();
  const field = useStateField(props.name, props.defaultValue);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const items = normalizeOptions(props.options ?? []);
  const selectedValue = (field.value as string | undefined) ?? "";
  const selectedItem = items.find((item) => item.value === selectedValue);
  const summary = selectedItem?.label ?? props.placeholder ?? "Select...";

  const syncBinding = React.useCallback(
    (value: string) => {
      if (!field.isReactive) {
        setFieldValue(formName, "FilterSelect", `$${props.name}`, value, false);
      }
    },
    [field.isReactive, formName, props.name, setFieldValue],
  );

  const closeDropdown = React.useCallback(() => setIsOpen(false), []);
  useClickOutside(dropdownRef, closeDropdown);

  return (
    <div className={`${DASHBOARD_CLASS_PREFIX}-filter-select`}>
      {props.label && (
        <label className={`${DASHBOARD_CLASS_PREFIX}-filter-select__label`}>{props.label}</label>
      )}
      <div className={`${DASHBOARD_CLASS_PREFIX}-filter-single-select`} ref={dropdownRef}>
        <button
          type="button"
          className={clsx(
            `${DASHBOARD_CLASS_PREFIX}-filter-single-select__trigger`,
            !selectedItem && `${DASHBOARD_CLASS_PREFIX}-filter-single-select__trigger--empty`,
          )}
          disabled={isStreaming}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((c) => !c)}
        >
          <span className={`${DASHBOARD_CLASS_PREFIX}-filter-single-select__value`}>{summary}</span>
          <ChevronDown
            className={clsx(
              `${DASHBOARD_CLASS_PREFIX}-filter-single-select__chevron`,
              isOpen && `${DASHBOARD_CLASS_PREFIX}-filter-single-select__chevron--open`,
            )}
            size={14}
          />
        </button>
        {isOpen ? (
          <div
            className={`${DASHBOARD_CLASS_PREFIX}-filter-single-select__content`}
            role="radiogroup"
          >
            {items.map((item) => (
              <label
                key={item.value}
                className={`${DASHBOARD_CLASS_PREFIX}-filter-single-select__radio-option`}
              >
                <input
                  className={`${DASHBOARD_CLASS_PREFIX}-filter-single-select__radio-input`}
                  type="radio"
                  name={field.name}
                  value={item.value}
                  checked={selectedValue === item.value}
                  disabled={isStreaming}
                  onChange={() => {
                    field.setValue(item.value);
                    syncBinding(item.value);
                    setIsOpen(false);
                  }}
                />
                <span className={`${DASHBOARD_CLASS_PREFIX}-filter-single-select__radio-control`} />
                <span className={`${DASHBOARD_CLASS_PREFIX}-filter-single-select__radio-label`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FilterMultiSelectRenderer({ props }: ComponentRenderProps<FilterMultiSelectProps>) {
  const isStreaming = useIsStreaming();
  const formName = useFormName();
  const setFieldValue = useSetFieldValue();
  const field = useStateField(props.name, props.defaultValues ?? []);
  const selectedValues = Array.isArray(field.value)
    ? (field.value as string[]).filter(Boolean)
    : [];
  const items = normalizeOptions(props.options ?? []);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const syncBinding = React.useCallback(
    (value: string[]) => {
      if (!field.isReactive) {
        setFieldValue(formName, "FilterMultiSelect", `$${props.name}`, value, false);
      }
    },
    [field.isReactive, formName, props.name, setFieldValue],
  );

  const toggleValue = useCallback(
    (value: string) => {
      const current = Array.isArray(field.value) ? (field.value as string[]) : [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      field.setValue(next);
      syncBinding(next);
    },
    [field, syncBinding],
  );

  const closeDropdown = React.useCallback(() => setIsOpen(false), []);
  useClickOutside(dropdownRef, closeDropdown);

  const summary = selectedValues.length
    ? selectedValues.map((val) => items.find((o) => o.value === val)?.label ?? val).join(", ")
    : null;

  return (
    <div
      className={`${DASHBOARD_CLASS_PREFIX}-filter-select ${DASHBOARD_CLASS_PREFIX}-filter-select--multi`}
    >
      {props.label && (
        <label className={`${DASHBOARD_CLASS_PREFIX}-filter-select__label`}>{props.label}</label>
      )}
      <div className={`${DASHBOARD_CLASS_PREFIX}-filter-multi-select`} ref={dropdownRef}>
        <button
          type="button"
          className={clsx(
            `${DASHBOARD_CLASS_PREFIX}-filter-multi-select__trigger`,
            !selectedValues.length &&
              `${DASHBOARD_CLASS_PREFIX}-filter-multi-select__trigger--empty`,
          )}
          onClick={() => setIsOpen(!isOpen)}
          disabled={isStreaming}
          aria-expanded={isOpen}
        >
          {summary ? (
            <span className={`${DASHBOARD_CLASS_PREFIX}-filter-multi-select__summary`}>
              <span className={`${DASHBOARD_CLASS_PREFIX}-filter-multi-select__summary-text`}>
                {summary}
              </span>
              <span className={`${DASHBOARD_CLASS_PREFIX}-filter-multi-select__count`}>
                {selectedValues.length}
              </span>
            </span>
          ) : (
            <span className={`${DASHBOARD_CLASS_PREFIX}-filter-multi-select__placeholder`}>
              {props.placeholder ?? "Select..."}
            </span>
          )}
          <ChevronDown
            className={clsx(
              `${DASHBOARD_CLASS_PREFIX}-filter-multi-select__chevron`,
              isOpen && `${DASHBOARD_CLASS_PREFIX}-filter-multi-select__chevron--open`,
            )}
            size={14}
          />
        </button>
        {isOpen && (
          <div className={`${DASHBOARD_CLASS_PREFIX}-filter-multi-select__dropdown`}>
            <div className={`${DASHBOARD_CLASS_PREFIX}-filter-multi-select__options`}>
              {items.map((option) => (
                <div
                  key={option.value}
                  className={clsx(
                    `${DASHBOARD_CLASS_PREFIX}-filter-multi-select__option`,
                    selectedValues.includes(option.value) &&
                      `${DASHBOARD_CLASS_PREFIX}-filter-multi-select__option--selected`,
                  )}
                >
                  <CheckBoxItem
                    name={option.value}
                    label={option.label}
                    checked={selectedValues.includes(option.value)}
                    onChange={() => toggleValue(option.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const FilterSelectComponent = defineComponent({
  name: "FilterSelect",
  props: filterSelectPropsSchema,
  description: "",
  component: FilterSelectRenderer,
});

export const FilterMultiSelectComponent = defineComponent({
  name: "FilterMultiSelect",
  props: filterMultiSelectPropsSchema,
  description: "",
  component: FilterMultiSelectRenderer,
});
