# 🌍 Internationalization (i18n) Guide

This application uses **next-intl** for internationalization, supporting multiple languages out of the box.

---

## Supported Languages

| Language | Code | Flag | Status |
|----------|------|------|--------|
| **English** (Primary) | `en` | 🇬🇧 | ✅ Complete |
| Italian | `it` | 🇮🇹 | ✅ Complete |
| German (Deutsch) | `de` | 🇩🇪 | ✅ Complete |
| Spanish (Español) | `es` | 🇪🇸 | ✅ Complete |

**Default Language:** English (`en`)

---

## Translation Files

All translations are stored in JSON files in the `messages/` directory:

```
messages/
├── en.json  (English - Primary)
├── it.json  (Italian)
├── de.json  (German)
└── es.json  (Spanish)
```

### Translation Structure

Each language file contains the same structure:

```json
{
  "common": {
    "welcome": "Welcome",
    "login": "Login",
    "signup": "Sign up",
    ...
  },
  "nav": {
    "dashboard": "Dashboard",
    "projects": "Projects",
    ...
  },
  "dashboard": { ... },
  "projects": { ... },
  "team": { ... },
  "billing": { ... },
  "auth": { ... },
  "errors": { ... }
}
```

---

## How It Works

### 1. Language Detection

The system detects the user's language in this priority order:

1. **Cookie** - `NEXT_LOCALE` cookie (persisted choice)
2. **Header** - `x-locale` header (custom)
3. **Browser** - `Accept-Language` header (auto-detect)
4. **Default** - Falls back to English (`en`)

### 2. Configuration Files

#### `src/i18n/config.ts`
Defines supported locales and locale metadata:

```typescript
export const locales = ["en", "it", "de", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  it: "Italiano",
  de: "Deutsch",
  es: "Español",
};
```

#### `src/i18n/request.ts`
Handles locale detection and message loading:

```typescript
export default getRequestConfig(async () => {
  // Detect locale from cookies, headers, or browser
  const locale = detectLocale();

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

---

## Using Translations

### In Server Components

Use the `useTranslations` hook from `next-intl`:

```tsx
import { useTranslations } from "next-intl";

export default function MyPage() {
  const t = useTranslations("common");

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <button>{t("login")}</button>
    </div>
  );
}
```

### In Client Components

Use the custom hook:

```tsx
"use client";

import { useTranslations } from "@/hooks/use-translations";

export function MyComponent() {
  const t = useTranslations("dashboard");

  return <h1>{t("title")}</h1>;
}
```

### Multiple Namespaces

You can use multiple translation namespaces:

```tsx
export function MyComponent() {
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");

  return (
    <>
      <h1>{tCommon("welcome")}</h1>
      <nav>
        <a>{tNav("dashboard")}</a>
        <a>{tNav("projects")}</a>
      </nav>
    </>
  );
}
```

---

## Language Switcher Component

The `LanguageSwitcher` component allows users to change languages:

```tsx
import { LanguageSwitcher } from "@/components/language-switcher";

export function Header() {
  return (
    <header>
      <nav>
        {/* Your navigation */}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
```

### Features

- ✅ Shows current language with flag emoji
- ✅ Dropdown menu to select language
- ✅ Visual indicator for active language
- ✅ Responsive (adapts to screen size)
- ✅ Persists choice in cookie
- ✅ Auto-refreshes page after selection

---

## Adding New Languages

### Step 1: Create Translation File

Create a new JSON file in `messages/`:

```bash
touch messages/fr.json  # For French
```

### Step 2: Add Translations

Copy the structure from `en.json` and translate:

```json
{
  "common": {
    "welcome": "Bienvenue",
    "login": "Connexion",
    ...
  },
  ...
}
```

### Step 3: Update Configuration

Add the locale to `src/i18n/config.ts`:

```typescript
export const locales = ["en", "it", "de", "es", "fr"] as const;

export const localeNames: Record<Locale, string> = {
  en: "English",
  it: "Italiano",
  de: "Deutsch",
  es: "Español",
  fr: "Français", // Add this
};

export const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  it: "🇮🇹",
  de: "🇩🇪",
  es: "🇪🇸",
  fr: "🇫🇷", // Add this
};
```

### Step 4: Test

The new language will automatically appear in the language switcher!

---

## Translation Keys Reference

### `common` - Common UI Elements
```
welcome, logout, login, signup, email, password, name,
save, cancel, delete, edit, create, search, loading,
error, success
```

### `nav` - Navigation
```
dashboard, projects, settings, team, billing
```

### `dashboard` - Dashboard Page
```
title, description
```

### `projects` - Projects Section
```
title, description, create, noProjects, createFirst
```

### `team` - Team Management
```
title, description, invite, role, owner, admin, member
```

### `billing` - Billing & Subscriptions
```
title, description, plan, free, starter, pro, enterprise,
upgrade, manageSubscription
```

### `auth` - Authentication
```
signIn, signUp, forgotPassword, resetPassword,
verifyEmail, emailSent, emailNotVerified
```

### `errors` - Error Messages
```
unauthorized, notFound, serverError, validationError
```

---

## Best Practices

### 1. Use Semantic Keys

❌ Bad:
```json
{
  "button1": "Click here",
  "text1": "Hello"
}
```

✅ Good:
```json
{
  "submitButton": "Submit",
  "welcomeMessage": "Welcome"
}
```

### 2. Organize by Feature/Page

Group related translations:

```json
{
  "dashboard": {
    "title": "Dashboard",
    "subtitle": "Welcome back",
    "stats": {
      "users": "Total Users",
      "revenue": "Revenue"
    }
  }
}
```

### 3. Handle Pluralization

Use next-intl's built-in pluralization:

```json
{
  "itemCount": "{count, plural, =0 {No items} =1 {One item} other {# items}}"
}
```

Usage:
```tsx
t("itemCount", { count: 5 }) // "5 items"
```

### 4. Use Variables

Support dynamic content:

```json
{
  "greeting": "Hello, {name}!"
}
```

Usage:
```tsx
t("greeting", { name: "John" }) // "Hello, John!"
```

### 5. Date & Number Formatting

```tsx
import { useFormatter } from "next-intl";

function MyComponent() {
  const format = useFormatter();

  return (
    <div>
      {format.dateTime(new Date(), { dateStyle: "long" })}
      {format.number(1234.56, { style: "currency", currency: "EUR" })}
    </div>
  );
}
```

---

## Translation Workflow

### For Developers

1. **Add new features** - Write code in English
2. **Extract strings** - Identify translatable text
3. **Add to en.json** - Add keys to English translation file
4. **Copy structure** - Duplicate structure to other language files
5. **Mark for translation** - Add `TODO: translate` comments
6. **Request translations** - Send to translators or use AI

### For Translators

1. **Receive JSON files** - Get translation files
2. **Translate values only** - Keep keys unchanged
3. **Maintain formatting** - Preserve variables like `{name}`
4. **Test in context** - Review translations in UI
5. **Submit updates** - Return translated files

---

## Common Issues & Solutions

### Issue: Translations not updating

**Solution:**
1. Clear Next.js cache: `rm -rf .next`
2. Restart dev server: `npm run dev`
3. Hard refresh browser: `Ctrl + Shift + R`

### Issue: Missing translation key

**Solution:**
The app will display the key name. Add the missing key to all translation files.

### Issue: Language not persisting

**Solution:**
Check that cookies are enabled. The `NEXT_LOCALE` cookie stores the preference.

### Issue: Wrong language detected

**Solution:**
Override with the language switcher or set the `x-locale` header.

---

## Testing Translations

### Manual Testing

1. Use the language switcher in the UI
2. Check each page in all languages
3. Verify variables render correctly
4. Test pluralization edge cases

### Automated Testing

```typescript
// Example test
import { getTranslations } from "next-intl/server";

describe("Translations", () => {
  it("should have all required keys", async () => {
    const t = await getTranslations({ locale: "en" });

    expect(t("common.welcome")).toBeDefined();
    expect(t("nav.dashboard")).toBeDefined();
  });
});
```

---

## Translation Coverage

Current translation coverage:

| Namespace | Keys | Coverage |
|-----------|------|----------|
| common | 18 | 100% ✅ |
| nav | 5 | 100% ✅ |
| dashboard | 2 | 100% ✅ |
| projects | 5 | 100% ✅ |
| team | 7 | 100% ✅ |
| billing | 7 | 100% ✅ |
| auth | 6 | 100% ✅ |
| errors | 4 | 100% ✅ |

**Total:** 54 translation keys × 4 languages = **216 translations** ✅

---

## Future Enhancements

Planned i18n improvements:

- [ ] RTL (Right-to-Left) language support (Arabic, Hebrew)
- [ ] Language-specific date/time formats
- [ ] Locale-based number formatting
- [ ] Translation management UI for admins
- [ ] Automatic translation with AI
- [ ] Translation versioning
- [ ] Context-aware translations
- [ ] A/B testing for translations

---

## Resources

### Documentation
- [next-intl Docs](https://next-intl-docs.vercel.app/)
- [Next.js i18n](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)

### Tools
- [i18n Ally](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally) - VS Code extension
- [JSON Editor Online](https://jsoneditoronline.org/) - Edit translation files
- [DeepL](https://www.deepl.com/) - High-quality translations

---

## Support

Need help with translations?

1. Check this documentation
2. Review the [next-intl documentation](https://next-intl-docs.vercel.app/)
3. Open an issue on GitHub
4. Contact the development team

---

**Happy translating! 🌍**
