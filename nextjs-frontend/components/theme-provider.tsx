"use client";

type Props = {
  children: React.ReactNode;
};

// Minimal stub: preserves API without pulling next-themes (React 19 peer conflict)
function ThemeProvider({ children }: Props) {
  return <>{children}</>;
}

export { ThemeProvider };
