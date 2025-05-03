import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <h4 className={styles.footerTitle}>Web3Stream</h4>
          <p className={styles.footerText}>
            A decentralized streaming platform empowering creators and viewers through blockchain technology.
          </p>
        </div>
        
        <div className={styles.footerSection}>
          <h4 className={styles.footerTitle}>Resources</h4>
          <ul className={styles.footerLinks}>
            <li><a href="/about" className={styles.footerLink}>About</a></li>
            <li><a href="/developers" className={styles.footerLink}>Developers</a></li>
            <li><a href="/blog" className={styles.footerLink}>Blog</a></li>
          </ul>
        </div>
        
        <div className={styles.footerSection}>
          <h4 className={styles.footerTitle}>Legal</h4>
          <ul className={styles.footerLinks}>
            <li><a href="/terms" className={styles.footerLink}>Terms</a></li>
            <li><a href="/privacy" className={styles.footerLink}>Privacy</a></li>
            <li><a href="/copyright" className={styles.footerLink}>Copyright</a></li>
          </ul>
        </div>
        
        <div className={styles.footerSection}>
          <h4 className={styles.footerTitle}>Connect</h4>
          <div className={styles.socialLinks}>
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Twitter">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="GitHub">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>
            <a href="https://discord.com/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Discord">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5.5 8.5l.5-.5h12l.5.5V15l-.5.5h-3.5l-.5.5L12 18l-1.5-2-.5-.5H5.5l-.5-.5V8.5l.5-.5z"></path>
                <path d="M10 12h.01M14 12h.01"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      <div className={styles.copyright}>
        <p>&copy; {currentYear} Web3Stream. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;