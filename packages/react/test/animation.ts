import { fireEvent } from "@testing-library/react";

/**
 * Ends the animation of an element, the way a browser does when it finishes. React listens for the event under
 * one name or the other depending on which style properties the DOM implementation has (a newer jsdom reports
 * only the prefixed one), so both are sent. A listener runs once: React attaches to only one of the two.
 */
export function animationEnd(element: Element) {
  fireEvent.animationEnd(element);
  fireEvent(element, new Event("webkitAnimationEnd", { bubbles: true }));
}
