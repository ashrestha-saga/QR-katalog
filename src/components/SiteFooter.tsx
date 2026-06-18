import { COMPANY } from "@/lib/company";

function PhoneIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-company hidden sm:block">
          <p className="site-footer-name">{COMPANY.name}</p>
          <address className="site-footer-address">
            {COMPANY.street}
            <br />
            {COMPANY.city}
            <br />
            {COMPANY.country}
          </address>
        </div>

        <div className="site-footer-col">
          <p className="site-footer-heading">Kontakt</p>
          <div className="sm:hidden">
            <p className="site-footer-name">{COMPANY.name}</p>
            <address className="site-footer-address">
              {COMPANY.street}
              <br />
              {COMPANY.city}
              <br />
              {COMPANY.country}
            </address>
          </div>
          <ul className="site-footer-contact">
            <li>
              <PhoneIcon />
              <span>{COMPANY.phone}</span>
            </li>
            <li>
              <MailIcon />
              <a href={`mailto:${COMPANY.email}`} className="hover:text-secondary">
                {COMPANY.email}
              </a>
            </li>
            <li>
              <GlobeIcon />
              <a
                href={COMPANY.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-secondary"
              >
                {COMPANY.website}
              </a>
            </li>
          </ul>
        </div>

        <div className="site-footer-col">
          <p className="site-footer-heading">Informationen</p>
          <a
            href={COMPANY.impressumUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer-link"
          >
            Impressum
          </a>
        </div>
      </div>
    </footer>
  );
}
