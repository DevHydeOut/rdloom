/** One link in the footer. */
export interface FooterLink {
  label: string;
  href: string;
  /** Opens another site in a new tab; screen readers are told. */
  external?: boolean;
}

/** A titled list of links, for the columns layout. */
export interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

export const isGroups = (links: FooterLink[] | FooterLinkGroup[]): links is FooterLinkGroup[] => links.length > 0 && "links" in (links[0] as object);
