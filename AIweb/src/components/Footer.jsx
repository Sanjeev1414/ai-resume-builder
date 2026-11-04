import { useEffect, useState } from 'react';
import { QuoteIcon } from './Icons.jsx';

const QUOTES = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Arise, awake, and stop not till the goal is reached.', author: 'Swami Vivekananda' },
  { text: 'Dream is not that which you see while sleeping, it is something that does not let you sleep.', author: 'A. P. J. Abdul Kalam' },
  { text: 'Opportunities don\'t happen. You create them.', author: 'Chris Grosser' },
  { text: 'Stay hungry. Stay foolish.', author: 'Steve Jobs' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'You are never too old to set another goal or to dream a new dream.', author: 'C. S. Lewis' },
  { text: 'The future depends on what you do today.', author: 'Mahatma Gandhi' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
  { text: 'It always seems impossible until it\'s done.', author: 'Nelson Mandela' },
];

const ROTATE_MS = 30_000;

/** Footer: a motivational quote that changes every 30 seconds, plus the copyright line. */
export default function Footer() {
  // Start on a different quote each day
  const [index, setIndex] = useState(() => Math.floor(Date.now() / 86_400_000) % QUOTES.length);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % QUOTES.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  const quote = QUOTES[index];
  return (
    <footer className="app-footer">
      <figure className="footer-quote" key={index} aria-live="polite">
        <span className="quote-mark"><QuoteIcon size={16} /></span>
        <blockquote>{quote.text}</blockquote>
        <figcaption>- {quote.author}</figcaption>
      </figure>
      <span className="footer-copy">© {new Date().getFullYear()} ResumeAI · Sanjeev Nandihalli</span>
    </footer>
  );
}
