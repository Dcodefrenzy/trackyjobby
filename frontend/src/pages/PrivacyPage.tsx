import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, ChevronLeft } from 'lucide-react';
import './PrivacyPage.css';

const PrivacyPage: React.FC = () => {
  return (
    <div className="privacy-page">
      <nav className="privacy-nav">
        <Link to="/" className="back-link">
          <ChevronLeft size={20} /> Back to Home
        </Link>
      </nav>

      <div className="privacy-container glass">
        <header className="privacy-header">
          <div className="icon-badge">
            <Shield size={32} className="text-primary" />
          </div>
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: March 19, 2026</p>
        </header>

        <section className="privacy-section">
          <h2><Lock size={20} /> Our Commitment</h2>
          <p>
            At TrackyJobby, we believe your application journey is personal. Our mission is to help you stay organized, 
            not to monetize your data. We collect only what is strictly necessary to provide the tracking services 
            you've requested.
          </p>
        </section>

        <section className="privacy-section">
          <h2><Eye size={20} /> Data We Collect</h2>
          <ul>
            <li><strong>Account Information:</strong> Your email and name to manage your account and sync your data across devices.</li>
            <li><strong>Authentication Data:</strong> Secure tokens (JWT) to keep your session private and protected.</li>
            <li><strong>Application Data:</strong> Details you explicitly save—such as company names, job titles, and URLs—so we can display them on your dashboard.</li>
            <li><strong>Email Metadata:</strong> If you use our forwarding service, we only parse emails you send to your unique tracking address to extract relevant application updates.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>How We Use Your Data</h2>
          <p>
            Your data is used solely to:
          </p>
          <ul>
            <li>Provide the core tracking features of the TrackyJobby platform and extension.</li>
            <li>Analyze application trends in aggregate (completely anonymous) to improve our service.</li>
            <li>Send you essential service updates or troubleshooting information.</li>
          </ul>
          <p className="highlight">
            <strong>We never sell, rent, or trade your personally identifiable information to advertisers or third parties.</strong>
          </p>
        </section>

        <section className="privacy-section">
          <h2>Data Security</h2>
          <p>
            We use industry-standard encryption and secure Supabase infrastructure to protect your data. 
            All communication between the extension and our servers is encrypted via SSL/TLS.
          </p>
        </section>

        <footer className="privacy-footer">
          <p>If you have questions about this policy, contact us at <a href="mailto:hello@trackyjobby.com">hello@trackyjobby.com</a></p>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPage;
