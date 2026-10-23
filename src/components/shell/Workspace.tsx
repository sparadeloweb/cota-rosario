import type { ReactNode } from "react";
import { BottomSheet } from "@/components/BottomSheet";

interface WorkspaceProps {
  rail: ReactNode;
  lienzo: ReactNode;
  lienzoInferior?: ReactNode;
}

export function Workspace({ rail, lienzo, lienzoInferior }: WorkspaceProps) {
  return (
    <div className="relative flex min-h-0 flex-1 lg:flex-row">
      <BottomSheet>
        {rail}
        {lienzoInferior ? <div className="hairline px-5 py-6 lg:hidden">{lienzoInferior}</div> : null}
      </BottomSheet>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">{lienzo}</div>
        {lienzoInferior ? (
          <div className="glass-rail hidden max-h-[45%] shrink-0 overflow-y-auto border-t border-rule px-5 py-5 sm:px-6 lg:block">{lienzoInferior}</div>
        ) : null}
      </div>
    </div>
  );
}
