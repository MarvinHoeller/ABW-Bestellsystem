import { Site } from '../../schemas/Schemas';

export function ArrayEquals(a: Array<any>, b: Array<any>) {
  a = a.sort();
  b.sort();

  return (
    Array.isArray(b) &&
    Array.isArray(a) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  );
}

export function formatToCurrent(number: number = 0) {
  return Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(number);
}

export function breadTranslate(bread: string) {
  switch (bread) {
    case 'normal':
      return 'Normal';
    case 'multigrain':
      return 'Mehrkorn';
  }
}

export function sauceTranslator(key: string) {
  switch (key) {
    case 'ketchup':
      return 'Ketchup';
    case 'mustard':
      return 'Senf';
    case 'sweetMustard':
      return 'süßer Senf';
  }
}

export function formatToLittleDate(dateString: string) {
  return Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date(dateString));
}

/**
 * It takes a siteID and an array of sites and returns the sitename of the site that matches the siteID
 * @param {string | undefined} siteID - string | undefined
 * @param {(Site | undefined)[]} sites - (Site | undefined)[]
 * @returns the sitename or undefined.
 */
export function siteIDTranslator(
  siteID: string | undefined,
  sites: (Site | undefined)[]
): string | undefined {
  return (
    siteID &&
    sites.find((site: Site | undefined) => site?._id === siteID)?.sitename
  );
}

/**
 * Converting a username like "john.doe" to "John Doe"
 * @param {string} username - string - The username to convert
 * @returns A the converted username
 */
export function convertUsername(username: string) {
  return username
    .split('.')
    .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
    .join(' ');
}
