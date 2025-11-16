import { getRequestConfig } from "next-intl/server";
import { headers, cookies } from "next/headers";
import { defaultLocale, isValidLocale } from "./config";

export default getRequestConfig(async () => {
  const headersList = await headers();
  const cookieStore = await cookies();

  // Priority: cookie > header > browser > default
  let locale =
    cookieStore.get("NEXT_LOCALE")?.value ||
    headersList.get("x-locale") ||
    headersList.get("accept-language")?.split(",")[0]?.split("-")[0] ||
    defaultLocale;

  // Validate and fallback to default
  if (!isValidLocale(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "UTC",
    now: new Date(),
  };
});
