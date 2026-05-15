export default function Logo({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Wallyz Grill"
      className={`object-contain ${className}`}
      style={{ width: size, height: 'auto' }}
    />
  );
}
