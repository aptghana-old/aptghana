// Single source of truth for all APT Ghana domains.
// Change SITE_DOMAIN here and every URL, link, and email address updates automatically.

// Note: CONTACT_DOMAIN is used for sending emails via Resend, so it has to be a separate subdomain with proper DKIM/SPF records set up. For receiving emails, we can use catch-all on the main domain.

//since aptghana.com, store.aptghana.com, and admin.aptghana.com are all taken by Vercel, we are using web.aptghana.com for the main site, and admin-v2.aptghana.com and store-v2.aptghana.com for the admin panel and store respectively. This allows us to keep all domains under our control while avoiding conflicts with existing Vercel deployments.

export const SITE_DOMAIN = "aptghana.com";
export const STORE_DOMAIN = `store-v2.${SITE_DOMAIN}`;
export const ADMIN_DOMAIN = `admin-v2.${SITE_DOMAIN}`;

export const CONTACT_DOMAIN = `contact.${SITE_DOMAIN}`; // Resend-verified DKIM/SPF sending subdomain
export const CDN_DOMAIN = `cdn.${SITE_DOMAIN}`;

// Base URLs
export const SITE_URL = `https://web.${SITE_DOMAIN}`;
export const STORE_URL = `https://${STORE_DOMAIN}`;
export const ADMIN_URL = `https://${ADMIN_DOMAIN}`;

// Email addresses
export const EMAIL_SALES = `sales@${SITE_DOMAIN}`;
export const EMAIL_SUPPORT = `support@${SITE_DOMAIN}`;
export const EMAIL_PRIVACY = `privacy@${SITE_DOMAIN}`;
export const EMAIL_CAREERS = `careers@${SITE_DOMAIN}`;
export const EMAIL_INFO = `info@${SITE_DOMAIN}`;
export const EMAIL_HELLO = `hello@${SITE_DOMAIN}`;
export const EMAIL_ADMIN = `admin@${SITE_DOMAIN}`;
export const EMAIL_NOREPLY = `noreply@${CONTACT_DOMAIN}`;
