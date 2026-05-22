function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
export function Loader() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <SpinnerIcon className="animate-spin text-primary size-8" />
    </div>
  );
}
