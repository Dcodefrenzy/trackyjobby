import { Moon, Sun, User, Target, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FeedbackModal from './FeedbackModal';
import './Navbar.css';

export default function Navbar() {
    const navigate = useNavigate();
    // Default to true (dark theme) since we set :root colors to dark in index.css
    const [isDark, setIsDark] = useState(true);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    useEffect(() => {
        // Check initial theme preferences on mount
        const isLightMode = document.documentElement.getAttribute('data-theme') === 'light';
        setIsDark(!isLightMode);
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'light');
            setIsDark(false);
        } else {
            document.documentElement.removeAttribute('data-theme');
            setIsDark(true);
        }
    };

    return (
        <nav className="navbar">
            <Link to="/dashboard" className="nav-logo">
                <Target size={24} className="text-primary" />
                <span>TrackyJobby</span>
            </Link>

            <div className="nav-actions">
                <button
                    onClick={() => setIsFeedbackOpen(true)}
                    className="nav-icon-btn feedback-trigger"
                    aria-label="Send Feedback"
                >
                    <MessageSquare size={18} />
                </button>
                <button onClick={toggleTheme} className="nav-icon-btn" aria-label="Toggle Theme">
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button
                    className="nav-icon-btn profile-btn"
                    aria-label="Profile"
                    onClick={() => navigate('/profile')}
                >
                    <User size={18} />
                </button>
            </div>

            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
            />
        </nav>
    );
}
