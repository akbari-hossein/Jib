"use client";

import * as React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CURRENCY_LABEL } from "@/lib/config/app";
import {
  applyTomanInputChange,
  cleanTomanValue,
  formatTomanInput,
  parseTomanInput,
  TOMAN_INPUT_SEPARATOR,
} from "@/lib/currency/input";
import { cn } from "@/lib/utils";

type MoneyInputProps = Omit<
  React.ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange" | "inputMode"
> & {
  defaultValue?: string | number | bigint;
  allowNegative?: boolean;
  allowZero?: boolean;
  invalid?: boolean;
  onAmountChange?: (amount: bigint | null) => void;
};

function isSeparator(char: string | undefined): boolean {
  return char === TOMAN_INPUT_SEPARATOR;
}

function parseAmount(
  raw: string,
  allowNegative: boolean,
  allowZero: boolean,
): bigint | null {
  const cleaned = cleanTomanValue(raw, { allowNegative });
  if (!cleaned) {
    return allowZero ? 0n : null;
  }
  return parseTomanInput(cleaned, { allowNegative, allowZero });
}

export function MoneyInput({
  id,
  name,
  defaultValue,
  allowNegative = false,
  allowZero = false,
  invalid = false,
  onAmountChange,
  className,
  disabled,
  required,
  placeholder,
  onBlur,
  onFocus,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-invalid": ariaInvalid,
  ...rest
}: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);
  const onAmountChangeRef = useRef(onAmountChange);
  const [text, setText] = useState(() =>
    defaultValue == null || defaultValue === ""
      ? ""
      : formatTomanInput(defaultValue, { allowNegative }),
  );

  useEffect(() => {
    onAmountChangeRef.current = onAmountChange;
  }, [onAmountChange]);

  useEffect(() => {
    onAmountChangeRef.current?.(parseAmount(text, allowNegative, allowZero));
  }, [allowNegative, allowZero, text]);

  useEffect(() => {
    const input = inputRef.current;
    const form = input?.form;
    if (!form) {
      return;
    }

    function handleReset() {
      if (defaultValue == null || defaultValue === "") {
        setText("");
        return;
      }
      setText(formatTomanInput(defaultValue, { allowNegative }));
    }

    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [allowNegative, defaultValue]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const caret = caretRef.current;
    if (!input || caret == null) {
      return;
    }
    input.setSelectionRange(caret, caret);
    caretRef.current = null;
  }, [text]);

  function applyRaw(raw: string, caret: number) {
    const next = applyTomanInputChange(raw, caret, { allowNegative });
    caretRef.current = next.caret;
    setText(next.formatted);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const caret = event.target.selectionStart ?? event.target.value.length;
    applyRaw(event.target.value, caret);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const input = event.currentTarget;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (start !== end) {
      return;
    }

    if (event.key === "." || event.key === "٫" || event.key === "/") {
      event.preventDefault();
      return;
    }

    if (event.key === "Backspace" && start > 0 && isSeparator(input.value[start - 1])) {
      event.preventDefault();
      const next = `${input.value.slice(0, start - 2)}${input.value.slice(start)}`;
      applyRaw(next, start - 2);
      return;
    }

    if (event.key === "Delete" && isSeparator(input.value[start])) {
      event.preventDefault();
      const next = `${input.value.slice(0, start)}${input.value.slice(start + 2)}`;
      applyRaw(next, start);
    }
  }

  const submitted = cleanTomanValue(text, { allowNegative });
  const showInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";

  return (
    <div
      className={cn(
        "flex h-14 w-full items-center gap-3 rounded-2xl border bg-card px-4 transition-colors duration-150",
        showInvalid
          ? "border-destructive focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/25"
          : "border-border focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {name ? <input type="hidden" name={name} value={submitted} /> : null}
      <input
        {...rest}
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        enterKeyHint="done"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        dir="ltr"
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        onFocus={onFocus}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-invalid={showInvalid || undefined}
        className="numeric-display min-w-0 flex-1 bg-transparent text-left text-xl font-semibold tracking-tight text-foreground outline-none focus:ring-0 focus:ring-transparent placeholder:font-normal placeholder:text-muted-foreground"
      />
      <span className="shrink-0 text-sm text-muted-foreground">{CURRENCY_LABEL}</span>
    </div>
  );
}
