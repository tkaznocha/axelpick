"use client";

export default function BudgetBar({
  picksUsed,
  picksLimit,
  budgetSpent,
  budgetTotal,
  onLock,
  isLocking,
  isLocked,
  replacementMode,
  replacementReady,
}: {
  picksUsed: number;
  picksLimit: number;
  budgetSpent: number;
  budgetTotal: number;
  onLock: () => void;
  isLocking: boolean;
  isLocked: boolean;
  replacementMode?: boolean;
  replacementReady?: boolean;
}) {
  const budgetRemaining = budgetTotal - budgetSpent;
  const isOverBudget = budgetRemaining < 0;
  const isReady = replacementMode
    ? !!replacementReady && !isOverBudget
    : picksUsed === picksLimit && !isOverBudget;

  const spentM = (budgetSpent / 1_000_000).toFixed(1);
  const totalM = (budgetTotal / 1_000_000).toFixed(0);
  const remainM = (Math.abs(budgetRemaining) / 1_000_000).toFixed(1);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 bg-card/95 backdrop-blur-lg">
      <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Picks counter */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-text-secondary">Picks</p>
              <p className="font-mono font-semibold">
                <span className={picksUsed === picksLimit ? "text-emerald" : ""}>
                  {picksUsed}
                </span>
                <span className="text-text-secondary">/{picksLimit}</span>
              </p>
            </div>

            <div className="h-8 w-px bg-black/10" />

            {/* Budget */}
            <div>
              <p className="text-xs text-text-secondary">Budget</p>
              <p className="font-mono font-semibold">
                <span className={isOverBudget ? "text-red-600" : ""}>
                  ${spentM}M
                </span>
                <span className="text-text-secondary">/${totalM}M</span>
              </p>
            </div>

            <div className="hidden sm:block">
              <p className="text-xs text-text-secondary">Remaining</p>
              <p
                className={`font-mono font-semibold ${
                  isOverBudget ? "text-red-600" : "text-emerald"
                }`}
              >
                {isOverBudget ? "-" : ""}${remainM}M
              </p>
            </div>
          </div>

          {/* Lock button */}
          {isLocked ? (
            <div className="rounded-xl bg-black/5 px-5 py-2.5 text-sm font-medium text-text-secondary">
              Picks Locked
            </div>
          ) : (
            <button
              onClick={onLock}
              disabled={!isReady || isLocking}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isReady
                  ? "aurora-gradient hover:shadow-lg hover:shadow-emerald/20"
                  : "bg-gray-300"
              }`}
            >
              {isLocking
                ? replacementMode
                  ? "Replacing..."
                  : "Locking..."
                : replacementMode
                  ? "Confirm Replacement"
                  : "Lock Picks"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
