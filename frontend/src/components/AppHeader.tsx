import { ModeToggle } from "@/components/ModeToggle"; // or wherever yours lives
import { Link } from "react-router-dom"; // or next/link if Next.js
import Logo from "@/assets/logoblack.svg"; // day logo
import LogoWhite from "@/assets/logowhite.svg"; // dark logo

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/60 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
        {/* Left: logo */}
        <Link to="/" className="flex items-center gap-2">
          {/* swap based on theme via CSS or a small component */}
          <img
            src={Logo}
            alt="Jarvis"
            className="h-6 dark:hidden"
          />
          <img
            src={LogoWhite}
            alt="Jarvis"
            className="hidden h-6 dark:block"
          />
        </Link>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
