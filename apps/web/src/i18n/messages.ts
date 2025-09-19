export type Locale = 'en' | 'nl';

export type MessageDictionary = Record<string, string>;

export const defaultLocale: Locale = 'en';

export const messages: Record<Locale, MessageDictionary> = {
  en: {
    'skip.main': 'Skip to main content',
    'nav.features': 'Features',
    'nav.progress': 'Progress',
    'nav.pricing': 'Pricing',
    'nav.docs': 'Docs',
    'nav.dashboard': 'Dashboard',
    'nav.rewards': 'Rewards',
    'nav.account': 'Account',
    'nav.coach': 'Coach',
    'nav.learn': 'Learn',
    'nav.support': 'Support',
    'nav.primary': 'Primary navigation',
    'footer.product': 'Product',
    'footer.company': 'Company',
    'footer.resources': 'Resources',
    'cta.startTrial': 'Start free trial',
    'language.english': 'English',
    'language.dutch': 'Nederlands',
    'language.toggle': 'Switch language',
  },
  nl: {
    'skip.main': 'Ga naar hoofdinhoud',
    'nav.features': 'Functies',
    'nav.progress': 'Voortgang',
    'nav.pricing': 'Prijzen',
    'nav.docs': 'Documentatie',
    'nav.dashboard': 'Dashboard',
    'nav.rewards': 'Beloningen',
    'nav.account': 'Account',
    'nav.coach': 'Coach',
    'nav.learn': 'Leren',
    'nav.support': 'Ondersteuning',
    'nav.primary': 'Primaire navigatie',
    'footer.product': 'Product',
    'footer.company': 'Bedrijf',
    'footer.resources': 'Hulpbronnen',
    'cta.startTrial': 'Start gratis proefperiode',
    'language.english': 'Engels',
    'language.dutch': 'Nederlands',
    'language.toggle': 'Wissel taal',
  },
};
