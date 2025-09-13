import logoLight from "@/assets/logodark.png";   // light-mode version
import logoDark from "@/assets/logolight.png";     // dark-mode version

type Props = {
  className?: string;        
  alt?: string;
};

export default function Logo({ className = "h-6 w-auto", alt = "Jarvis logo" }: Props) {
  return (
    <span className="inline-block">
      {/* Light (day) */}
      <img src={logoLight} alt={alt} className={`block dark:hidden ${className}`} />
      {/* Dark (night) */}
      <img src={logoDark} alt={alt} className={`hidden dark:block ${className}`} />
    </span>
  );
}
