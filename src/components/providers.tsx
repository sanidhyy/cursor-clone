import * as React from "react";

import { ThemeProvider } from "./theme-provider";

export const Providers = ({ children }: Readonly<React.PropsWithChildren>) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
};
