import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FloatingContact({ deferredPrompt, onInstall }: { deferredPrompt?: any, onInstall?: () => void }) {
  return (
    <div className="floating-actions">
      <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="action-btn whatsapp" title="WhatsApp Us">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
      </a>
      <a href="tel:+1234567890" className="action-btn phone" title="Call Us">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
      </a>
      {deferredPrompt && (
        <button onClick={onInstall} className="action-btn download" title="Download App">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>
      )}

      <style jsx>{`
        .floating-actions {
          position: fixed;
          bottom: 24px;
          left: 24px;
          z-index: 999;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .action-btn {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25);
          transition: transform 0.2s, box-shadow 0.2s;
          border: none;
          cursor: pointer;
        }
        .action-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .action-btn.whatsapp { background: linear-gradient(135deg, #25D366, #128C7E); }
        .action-btn.phone { background: linear-gradient(135deg, #007AFF, #0056b3); }
        .action-btn.download { background: linear-gradient(135deg, var(--clr-accent), var(--clr-accent-2)); }

        @media (max-width: 540px) {
          .floating-actions {
            bottom: 84px; /* above the mobile order bar */
            left: 16px;
            gap: 12px;
          }
          .action-btn {
            width: 48px;
            height: 48px;
          }
          .action-btn svg {
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </div>
  );
}
