export default function Logo({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`font-bold text-orange-600 ${className}`}
      style={{
        fontSize: size * 0.4,
        lineHeight: 1,
      }}
    >
      Wally'z Grill
    </div>
  );
}
