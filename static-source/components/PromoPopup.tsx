import React, {useEffect, useRef, useState} from 'react';
import './promo-popup.css';

type PromoPopupProps = {
  announcement: string;
  whatsapp: string;
};

const DISMISSED_UNTIL_KEY = 'bbweb_promo_closed_until';
const REOPEN_DELAY_MS = 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 1800;

/** A public, admin-controlled promotion. Empty announcement disables the popup. */
export default function PromoPopup({announcement, whatsapp}: PromoPopupProps) {
  const message = String(announcement || '').trim();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    if (!message) return;
    try {
      if (Number(localStorage.getItem(DISMISSED_UNTIL_KEY) || 0) > Date.now()) return;
    } catch {
      // Storage may be disabled; the popup should still work for this visit.
    }
    const timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [message]);

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + REOPEN_DELAY_MS));
    } catch {
      // Dismissal still applies to the current page.
    }
  }

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') || []);
      if (!focusables.length) return;
      if (event.shiftKey && document.activeElement === focusables[0]) {
        event.preventDefault();
        focusables[focusables.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusables[focusables.length - 1]) {
        event.preventDefault();
        focusables[0].focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [open]);

  if (!open || !message) return null;
  const phone = String(whatsapp || '').replace(/\D/g, '');
  const whatsappUrl = phone.length >= 8 && phone.length <= 15
    ? 'https://wa.me/' + phone + '?text=' + encodeURIComponent('Halo BisaBikinWeb, saya tertarik dengan promo di website.')
    : '';
  const destination = whatsappUrl || '/kontak/';

  return (
    <div
      className="bbweb-promo-overlay"
      onMouseDown={event => { if (event.target === event.currentTarget) dismiss(); }}
    >
      <div
        ref={dialogRef}
        className="bbweb-promo-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bbweb-promo-title"
        aria-describedby="bbweb-promo-description"
      >
        <button
          ref={closeRef}
          className="bbweb-promo-close"
          type="button"
          aria-label="Tutup promosi"
          onClick={dismiss}
        >×</button>
        <span className="bbweb-promo-kicker">PENAWARAN SPESIAL / BISABIKINWEB</span>
        <h2 id="bbweb-promo-title">Website bagus, bisnis makin serius.</h2>
        <p className="bbweb-promo-copy" id="bbweb-promo-description">{message}</p>
        <a
          className="bbweb-promo-cta"
          href={destination}
          target={whatsappUrl ? '_blank' : undefined}
          rel={whatsappUrl ? 'noopener noreferrer' : undefined}
        >Konsultasi promonya <span aria-hidden="true">↗</span></a>
        <small>Tanpa komitmen · Diskusikan kebutuhan websitemu dulu</small>
      </div>
    </div>
  );
}
