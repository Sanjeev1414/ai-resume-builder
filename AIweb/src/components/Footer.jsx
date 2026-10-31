import { Link } from 'react-router-dom';
import { QuoteIcon } from './Icons.jsx';

const QUOTES = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Arise, awake, and stop not till the goal is reached.', author: 'Swami Vivekananda' },
  { text: 'Dream is not that which you see while sleeping, it is something that does not let you sleep.', author: 'A. P. J. Abdul Kalam' },
  { text: 'Opportunities don\'t happen. You create them.', author: 'Chris Grosser' },
  { text: 'Stay hungry. Stay foolish.', author: 'Steve Jobs' },
];

// A new quote each day, the same one all day
const dayNumber = Math.floor(Date.now() / 86_400_000);
const quote = QUOTES[dayNumber % QUOTES.length];

/** One-line footer: daily quote, copyright and links. */
export default function Footer() {
  return (
    <footer className="app-footer">
      <figure className="footer-quote">
        <span className="quote-mark"><QuoteIcon size={16} /></span>
        <blockquote>{quote.text}</blockquote>
        <figcaption>- {quote.author}</figcaption>
      </figure>
      <span className="footer-copy">© {new Date().getFullYear()} ResumeAI · Sanjeev Nandihalli</span>
      <nav className="footer-links" aria-label="Footer">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/history">History</Link>
        <Link to="/account/password">Account</Link>
      </nav>
    </footer>
  );
}
