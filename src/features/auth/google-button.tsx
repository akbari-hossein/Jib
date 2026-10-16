import { Button } from "@/components/ui/button";

export function GoogleButton({ referralCode }: { referralCode?: string }) {
  return (
    <>
      <div className="flex items-center gap-3 text-xs text-foreground/40">
        <span className="h-px flex-1 bg-border" />
        یا
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button asChild variant="outline" className="w-full">
        <a href={referralCode ? `/api/auth/google?ref=${encodeURIComponent(referralCode)}` : "/api/auth/google"}>
          <GoogleMark />
          ادامه با گوگل
        </a>
      </Button>
    </>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46c-.28 1.5-1.12 2.77-2.39 3.63v3.02h3.87c2.26-2.08 3.55-5.14 3.55-8.68Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3.02c-1.07.72-2.45 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.27v3.12C3.25 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.25A7.2 7.2 0 0 1 4.87 12c0-.78.13-1.53.38-2.25V6.63H1.27A11.97 11.97 0 0 0 0 12c0 1.94.46 3.77 1.27 5.37l3.98-3.12Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.14 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.63l3.98 3.12C6.2 6.87 8.86 4.75 12 4.75Z"
      />
    </svg>
  );
}
