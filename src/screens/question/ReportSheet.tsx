import { X } from '@phosphor-icons/react';
import { REPORT_REASONS } from '../../data/mock';
import ModalFrame from '../../components/ModalFrame';

interface ReportSheetProps {
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export default function ReportSheet({ onClose, onSubmit }: ReportSheetProps) {
  return (
    <ModalFrame title="Reportar questão" onClose={onClose} sheet>
      {(close) => (
        <div className="bg-surface p-[8px_20px_24px]">
          <div className="mx-auto mb-4 mt-2 h-[5px] w-[42px] rounded-[3px] bg-border" />
          <div className="flex items-center justify-between gap-3">
            <div className="font-display text-[18px] font-extrabold text-ink">Reportar questão</div>
            <button
              onClick={close}
              className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-app-bg text-text2"
              aria-label="Fechar"
            >
              <X size={17} />
            </button>
          </div>
          <div className="mt-0.5 font-sans text-[12.5px] font-semibold text-text2">
            Ajude a manter o banco de questões correto.
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            {REPORT_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => onSubmit(r)}
                className="flex w-full items-center justify-between rounded-2xl border-[1.5px] border-border2 bg-surface p-3.5 text-left font-sans text-[13.5px] font-bold text-ink"
              >
                {r}
                <span className="text-[16px] text-[#c2c9da]">›</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </ModalFrame>
  );
}
