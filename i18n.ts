/**
 * @fileoverview Internationalization module for Web3 Streaming Service
 * @module i18n
 */

/** Dictionary of translations for a specific language */
interface TranslationDictionary {
  [key: string]: string;
}

/** All available language translations */
interface Translations {
  [language: string]: TranslationDictionary;
}

/** Translation lookup table for all supported languages */
const translations: Translations = {
  en: {
    "title": "Web3 Crypto Streaming Service",
    "logo": "Web3 Streaming",
    "nav-home": "Home",
    "nav-beta": "Beta Program",
    "nav-docs": "Documentation",
    "nav-whitepaper": "Whitepaper",
    "hero-title": "Web3 Crypto Streaming Service",
    "hero-description": "Revolutionizing content streaming through decentralized blockchain technology",
    "hero-join-beta": "Join Beta",
    "hero-read-whitepaper": "Read Whitepaper",
    "footer": "© 2025 Web3 Crypto Streaming Service. All rights reserved."
  },
  pt: {
    "title": "Serviço de Streaming Web3 Crypto",
    "logo": "Streaming Web3",
    "nav-home": "Início",
    "nav-beta": "Programa Beta",
    "nav-docs": "Documentação",
    "nav-whitepaper": "Whitepaper",
    "hero-title": "Serviço de Streaming Web3 Crypto",
    "hero-description": "Revolucionando o streaming de conteúdo através da tecnologia blockchain descentralizada",
    "hero-join-beta": "Participar do Beta",
    "hero-read-whitepaper": "Ler o Whitepaper",
    "footer": "© 2025 Serviço de Streaming Web3 Crypto. Todos os direitos reservados."
  }
};

/** Currently active language code */
let currentLanguage: string = localStorage.getItem('language') || 'en';

/**
 * Set up language on document load
 * @public
 */
export function initializeLanguage(): void {
  document.addEventListener('DOMContentLoaded', (): void => {
    changeLanguage(currentLanguage);
  });
}

/**
 * Change the active language throughout the application
 * @param {string} lang - Language code to switch to
 * @public
 */
export function changeLanguage(lang: string): void {
  // Update current language state
  currentLanguage = lang;
  localStorage.setItem('language', lang);

  // Update DOM elements with translations
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element): void => {
    const key = element.getAttribute('data-i18n');
    if (key && translations[lang] && translations[lang][key]) {
      if (element.tagName === 'INPUT') {
        (element as HTMLInputElement).placeholder = translations[lang][key];
      } else {
        element.textContent = translations[lang][key];
      }
    }
  });

  // Update HTML lang attribute
  document.documentElement.setAttribute('lang', lang);

  // Update UI state for language buttons
  document.querySelectorAll<HTMLElement>('.lang-btn').forEach((btn): void => {
    btn.classList.remove('active');
  });
  
  const activeButton = document.getElementById(`${lang}-btn`);
  if (activeButton) {
    activeButton.classList.add('active');
  }
}

// Export for module usage
export { translations, currentLanguage };
