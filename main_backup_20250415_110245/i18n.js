const translations = {
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

let currentLanguage = localStorage.getItem('language') || 'en';

document.addEventListener('DOMContentLoaded', () => {
  changeLanguage(currentLanguage);
});

function changeLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);

  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[lang][key]) {
      if (element.tagName === 'INPUT') {
        element.placeholder = translations[lang][key];
      } else {
        element.textContent = translations[lang][key];
      }
    }
  });

  document.documentElement.setAttribute('lang', lang);

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`${lang}-btn`).classList.add('active');
}
