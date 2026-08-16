import { NativeSelect } from "@/components/ui/native-select";
import { toPersianDigits } from "@/lib/currency/format";
import type { JalaliDate } from "@/lib/dates/tehran";
import { JALALI_MONTHS } from "@/lib/labels";

export function JalaliDateFields({
  prefix,
  defaultValue,
  optional = false,
  minYear,
  maxYear,
}: {
  prefix: string;
  defaultValue?: JalaliDate | null;
  optional?: boolean;
  minYear: number;
  maxYear: number;
}) {
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);

  return (
    <div className="grid grid-cols-3 gap-2">
      <NativeSelect name={`${prefix}Day`} defaultValue={defaultValue ? String(defaultValue.day) : ""}>
        {optional ? <option value="">روز</option> : null}
        {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
          <option key={day} value={day}>
            {toPersianDigits(day)}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        name={`${prefix}Month`}
        defaultValue={defaultValue ? String(defaultValue.month) : ""}
      >
        {optional ? <option value="">ماه</option> : null}
        {JALALI_MONTHS.map((month, index) => (
          <option key={month} value={index + 1}>
            {month}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        name={`${prefix}Year`}
        defaultValue={defaultValue ? String(defaultValue.year) : ""}
      >
        {optional ? <option value="">سال</option> : null}
        {years.map((year) => (
          <option key={year} value={year}>
            {toPersianDigits(year)}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
