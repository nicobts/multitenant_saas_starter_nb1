"use client";

import { useTranslations as useNextIntlTranslations } from "next-intl";

/**
 * Hook to access translations in client components
 * @param namespace - The translation namespace (e.g., 'common', 'auth', 'dashboard')
 * @returns Translation function
 *
 * @example
 * ```tsx
 * const t = useTranslations('common');
 * return <button>{t('save')}</button>
 * ```
 */
export function useTranslations(namespace?: string) {
  return useNextIntlTranslations(namespace);
}
