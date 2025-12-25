export function Logo({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="Logo"
      width={size}
      height={size}
      className="object-cover rounded-full"
    />
  );
}



export function Plus({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="16"
        y1="6"
        x2="16"
        y2="26"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="6"
        y1="16"
        x2="26"
        y2="16"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}