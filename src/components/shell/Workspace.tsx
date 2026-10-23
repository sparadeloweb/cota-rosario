import type { ReactNode } from "react";
import { BottomSheet } from "@/components/BottomSheet";

interface WorkspaceProps {
  rail: ReactNode;
  canvas: ReactNode;
  lowerCanvas?: ReactNode;
}

export function Workspace({ rail, canvas, lowerCanvas }: WorkspaceProps) {
  return (
    <div className="relative flex min-h-0 flex-1 lg:flex-row">
      <BottomSheet>
        {rail}
        {lowerCanvas ? <div className="hairline px-5 py-6 lg:hidden">{lowerCanvas}</div> : null}
      </BottomSheet>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">{canvas}</div>
        {lowerCanvas ? (
          <div className="glass-rail hidden max-h-[45%] shrink-0 overflow-y-auto border-t border-rule px-5 py-5 sm:px-5 lg:block">{lowerCanvas}</div>
        ) : null}
      </div>
    </div>
  );
}
