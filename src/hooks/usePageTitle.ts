import { useEffect } from "react";

const SITE_NAME = "Bank Sampah Sembada";

/**
 * Update the document title when the component mounts.
 * Format: "Page Title | Bank Sampah Sembada"
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | ${SITE_NAME}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
