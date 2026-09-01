/** Derives the domain the mailto address belongs to, so we can link to the
 * site the address was picked up from (often a fiscal sponsor or staffing
 * partner's site, not the org's own website). */
export function mailtoSourceUrl(url: string | null): string | null {
  if (!url || !url.startsWith('mailto:')) return null;
  const address = url.slice('mailto:'.length).split('?')[0];
  const domain = address.split('@')[1];
  if (!domain) return null;
  return `https://${domain}`;
}
