"use client";

import { CheckBoxItem } from "@openuidev/react-components";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type RefObject } from "react";
import { names, styles } from "./filterSelect.styles";

export interface FilterOption {
  value: string;
  label: string;
}

/** Closes an open dropdown on a click outside or on Escape, which also returns focus to its trigger. */
function useDismiss(ref: RefObject<HTMLElement | null>, isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      onClose();
      ref.current?.querySelector("button")?.focus();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [ref, isOpen, onClose]);
}

export interface FilterSelectProps {
  /** Groups the radio inputs. */
  name: string;
  label?: string;
  options: FilterOption[];
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
}

export function FilterSelect({
  name,
  label,
  options,
  value = "",
  placeholder,
  disabled,
  onValueChange,
}: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const id = useId();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItem = options.find((item) => item.value === value);
  const summary = selectedItem?.label ?? placeholder ?? "Select...";

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  useDismiss(dropdownRef, isOpen, closeDropdown);

  return (
    <div className={clsx(styles.root, names.root)}>
      {label && (
        <label
          id={`${id}-label`}
          htmlFor={`${id}-trigger`}
          className={clsx(styles.label, names.label)}
        >
          {label}
        </label>
      )}
      <div className={clsx(styles.control, names.control)} ref={dropdownRef}>
        <button
          id={`${id}-trigger`}
          type="button"
          aria-labelledby={label ? `${id}-label ${id}-trigger` : undefined}
          data-empty={!selectedItem || undefined}
          className={clsx(styles.trigger, names.trigger, styles.triggerSingle, names.triggerSingle)}
          disabled={disabled}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((c) => !c)}
        >
          <span className={clsx(styles.value, names.value)}>{summary}</span>
          <ChevronDown
            data-open={isOpen || undefined}
            className={clsx(styles.chevron, names.chevron)}
            size={14}
          />
        </button>
        {isOpen ? (
          <div
            className={clsx(styles.popover, names.popover, styles.radioPopover, names.radioPopover)}
            role="radiogroup"
          >
            {options.map((item) => (
              <label
                key={item.value}
                className={clsx(styles.option, names.option, styles.radioOption, names.radioOption)}
              >
                <input
                  className={clsx(styles.radioInput, names.radioInput)}
                  type="radio"
                  name={name}
                  value={item.value}
                  checked={value === item.value}
                  disabled={disabled}
                  onChange={() => {
                    onValueChange(item.value);
                    setIsOpen(false);
                  }}
                />
                <span className={clsx(styles.radioLabel, names.radioLabel)}>{item.label}</span>
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export interface FilterMultiSelectProps {
  label?: string;
  options: FilterOption[];
  values?: string[];
  placeholder?: string;
  disabled?: boolean;
  onValuesChange: (values: string[]) => void;
}

export function FilterMultiSelect({
  label,
  options,
  values = [],
  placeholder,
  disabled,
  onValuesChange,
}: FilterMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const id = useId();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setIsOpen(false), []);
  useDismiss(dropdownRef, isOpen, closeDropdown);

  const summary = values.length
    ? values.map((val) => options.find((o) => o.value === val)?.label ?? val).join(", ")
    : null;

  const toggleValue = (value: string) =>
    onValuesChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);

  return (
    <div className={clsx(styles.root, names.root)}>
      {label && (
        <label
          id={`${id}-label`}
          htmlFor={`${id}-trigger`}
          className={clsx(styles.label, names.label)}
        >
          {label}
        </label>
      )}
      <div className={clsx(styles.control, names.control)} ref={dropdownRef}>
        <button
          id={`${id}-trigger`}
          type="button"
          aria-labelledby={label ? `${id}-label ${id}-trigger` : undefined}
          data-empty={!values.length || undefined}
          className={clsx(styles.trigger, names.trigger, styles.triggerMulti, names.triggerMulti)}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          aria-expanded={isOpen}
        >
          {summary ? (
            <span className={clsx(styles.summary, names.summary)}>
              <span className={clsx(styles.summaryText, names.summaryText)}>{summary}</span>
              <span className={clsx(styles.count, names.count)}>{values.length}</span>
            </span>
          ) : (
            <span className={names.placeholder}>{placeholder ?? "Select..."}</span>
          )}
          <ChevronDown
            data-open={isOpen || undefined}
            className={clsx(styles.chevron, names.chevron)}
            size={14}
          />
        </button>
        {isOpen && (
          <div
            className={clsx(
              styles.popover,
              names.popover,
              styles.checkboxPopover,
              names.checkboxPopover,
            )}
          >
            <div className={clsx(styles.options, names.options)}>
              {options.map((option) => (
                <div key={option.value} className={clsx(styles.option, names.option)}>
                  <CheckBoxItem
                    name={option.value}
                    label={option.label}
                    checked={values.includes(option.value)}
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
