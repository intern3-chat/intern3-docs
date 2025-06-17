import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Logo } from "./components/logo";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <Logo className="w-6 h-6" />
        intern3.chat
      </>
    ),
  },
  // see https://fumadocs.dev/docs/ui/navigation/links
  links: [],
};
