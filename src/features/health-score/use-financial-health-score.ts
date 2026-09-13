"use client";

import { useState } from "react";
import type { RecapExportVariant } from "@/lib/share/recap-image";

export function useFinancialHealthScore() {
  const [variant, setVariant] = useState<RecapExportVariant>("story");
  const [includeHighlight, setIncludeHighlight] = useState(false);

  return {
    variant,
    setVariant,
    includeHighlight,
    setIncludeHighlight,
  };
}
