export function ProductPreview() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-[2.2rem] border border-border bg-surface p-5 shadow-none">
      <p className="text-sm text-foreground/55">عصر بخیر حسین</p>
      <p className="mt-6 text-xs text-foreground/45">قابل خرج</p>
      <p className="numeric-display mt-1 text-[2.1rem] font-semibold leading-none tracking-tight">
        ۸٬۴۲۰٬۰۰۰
        <span className="ms-1 text-base font-medium text-foreground/45">تومان</span>
      </p>
      <div className="mt-6 rounded-2xl bg-surface-muted px-4 py-4">
        <p className="text-[15px] leading-7 text-foreground">
          امروز می‌تونی تا{" "}
          <span className="font-semibold">۴۸۰ هزار تومان</span> خرج کنی.
        </p>
        <p className="mt-2 text-xs text-foreground/45">۱۳ روز تا درآمد بعدی</p>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-foreground/55">این ماه</span>
        <span className="numeric-display font-medium">۷.۸ میلیون</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full w-[70%] rounded-full bg-primary/80" />
      </div>
      <p className="mt-2 text-xs text-foreground/40">غذا ۷۰٪ از بودجه</p>
    </div>
  );
}
