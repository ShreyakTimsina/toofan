import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FloatingContact({ deferredPrompt, onInstall, whatsappNumber, phoneNumber }: { deferredPrompt?: any, onInstall?: () => void, whatsappNumber?: string, phoneNumber?: string }) {
  return (
    <div className="floating-actions">
      {whatsappNumber && (
        <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="action-btn whatsapp" title="WhatsApp Us">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
        </a>
      )}
      {phoneNumber && (
        <a href={`tel:${phoneNumber}`} className="action-btn phone" title="Call Us">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
        </a>
      )}
      <button onClick={onInstall} className="action-btn download" title="Download App">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      </button>

      <style jsx>{`
        .floating-actions {
          position: fixed;
          bottom: 24px;
          right: 24px;
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
        .action-btn.download { background: linear-gradient(135deg, var(--clr-accent), var(--clr-accent-2)); display: none; }

        @media (max-width: 1024px) {
          .action-btn.download { display: flex; }
        }

        @media (max-width: 540px) {
          .floating-actions {
            bottom: 84px; /* above the mobile order bar */
            right: 16px;
            left: auto;
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
