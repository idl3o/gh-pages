/**
 * @fileoverview Language switcher component for Web3 Streaming Service
 * @module LanguageSwitcher
 */

import React, { useState, useEffect, memo } from 'react';
import { changeLanguage } from '../i18n';

/** Component props interface */
interface LanguageSwitcherProps {
  /** Optional CSS class name */
  className?: string;
  /** Available languages to display */
  availableLanguages?: Array<{code: string, label: string}>;
}

/**
 * Language switcher component that allows users to change the application language
 * @param {LanguageSwitcherProps} props - Component properties
 * @returns {JSX.Element} Rendered language switcher component
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '',
  availableLanguages = [
    { code: 'en', label: 'English' },
    { code: 'pt', label: 'Português' }
  ] 
}) => {
  // Get initial language from local storage or default to 'en'
  const [activeLanguage, setActiveLanguage] = useState<string>(
    localStorage.getItem('language') || 'en'
  );

  /**
   * Handle language change event
   * @param {string} lang - Language code to switch to
   */
  const handleLanguageChange = (lang: string): void => {
    changeLanguage(lang);
    setActiveLanguage(lang);
  };

  // Initialize language on component mount
  useEffect(() => {
    changeLanguage(activeLanguage);
  }, []);

  return (
    <div className={`language-switcher ${className}`} data-testid="language-switcher">
      {availableLanguages.map((language) => (
        <button
          key={language.code}
          onClick={() => handleLanguageChange(language.code)}
          className={`lang-btn ${activeLanguage === language.code ? 'active' : ''}`}
          id={`${language.code}-btn`}
          aria-pressed={activeLanguage === language.code}
          type="button"
        >
          {language.label}
        </button>
      ))}
    </div>
  );
};

// Use memo for performance optimization
export default memo(LanguageSwitcher);
