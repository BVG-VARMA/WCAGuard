/**
 * WCAGuard Honest Violation Classifier
 * Classifies violations into:
 * 1. CERTIFIED_CANDIDATE: Safe, deterministic, machine-checkable automatic repair exists
 * 2. NEEDS_REVIEW: Requires human judgment (e.g. meaningful image alt text, semantic link purpose)
 * 3. UNFIXABLE: Cannot safely be repaired automatically (e.g. video captions, complex third-party widgets)
 */

export const CLASSIFICATIONS = {
  CERTIFIED_CANDIDATE: 'Certified candidate',
  NEEDS_REVIEW: 'Needs review',
  UNFIXABLE: 'Unfixable'
};

const RULE_KNOWLEDGE_BASE = {
  'image-alt': {
    name: 'Images Must Have Alternate Text',
    criterion: 'WCAG 1.1.1 Non-text Content (Level A)',
    simpleExplanation: 'An image on this page has no text description for people who cannot see it.',
    technicalExplanation: '<img> or element with role="img" missing a valid alt attribute or accessible name.',
    whyItMatters: 'Screen reader users hear the filename or nothing at all, missing out on important information or context.',
    classification: CLASSIFICATIONS.NEEDS_REVIEW,
    suggestedSolution: 'Add alt="" for purely decorative graphics, or provide a descriptive text equivalent.',
    safeFixAvailable: true
  },
  'button-name': {
    name: 'Buttons Must Have Discernible Text',
    criterion: 'WCAG 4.1.2 Name, Role, Value (Level A)',
    simpleExplanation: 'A clickable button has no text label, so voice or screen reader users cannot tell what it does.',
    technicalExplanation: '<button> element has an empty accessible name computation (missing inner text, aria-label, or title).',
    whyItMatters: 'Blind and visually impaired users cannot identify the button\'s purpose or trigger actions reliably.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Add descriptive inner text or an explicit aria-label attribute based on the button action.',
    safeFixAvailable: true
  },
  'label': {
    name: 'Form Inputs Must Have Accessible Labels',
    criterion: 'WCAG 1.3.1 Info and Relationships (Level A)',
    simpleExplanation: 'A form input field does not tell people what information is expected.',
    technicalExplanation: '<input>, <select>, or <textarea> lacks an associated <label> or aria-label.',
    whyItMatters: 'People using screen readers or voice input cannot determine what data to enter into the field.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Associate a <label htmlFor="..."> element or supply an explicit aria-label.',
    safeFixAvailable: true
  },
  'color-contrast': {
    name: 'Text Must Have Sufficient Contrast',
    criterion: 'WCAG 1.4.3 Contrast (Minimum) (Level AA)',
    simpleExplanation: 'The text color is too close to its background color, making it difficult to read.',
    technicalExplanation: 'Calculated contrast ratio is below the WCAG 4.5:1 minimum threshold for regular text.',
    whyItMatters: 'Users with low vision, color blindness, or people using mobile devices in bright sunlight cannot read this text.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Adjust foreground or background luminance to achieve at least 4.5:1 contrast.',
    safeFixAvailable: true
  },
  'html-has-lang': {
    name: '<html> Element Must Have a Lang Attribute',
    criterion: 'WCAG 3.1.1 Language of Page (Level A)',
    simpleExplanation: 'The website does not specify what language it is written in.',
    technicalExplanation: 'The root <html> element is missing a valid lang="..." attribute.',
    whyItMatters: 'Screen readers might read the text with an incorrect foreign pronunciation or accent.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Add lang="en" (or the appropriate BCP 47 language code) to the root <html> tag.',
    safeFixAvailable: true
  },
  'link-name': {
    name: 'Links Must Have Discernible Purpose',
    criterion: 'WCAG 2.4.4 Link Purpose (In Context) (Level A)',
    simpleExplanation: 'A link says "click here" or has no descriptive name, making navigation confusing.',
    technicalExplanation: '<a> element has an empty accessible name or uses generic ambiguous phrases without context.',
    whyItMatters: 'Screen reader users navigating by links alone cannot tell where the destination leads.',
    classification: CLASSIFICATIONS.NEEDS_REVIEW,
    suggestedSolution: 'Provide meaningful destination text or add an aria-label explaining the target page.',
    safeFixAvailable: true
  },
  'target-size': {
    name: 'Touch Targets Must Have Sufficient Size',
    criterion: 'WCAG 2.5.8 Target Size (Minimum) (Level AA)',
    simpleExplanation: 'A button or clickable link is too small to tap easily on a touchscreen.',
    technicalExplanation: 'Interactive element bounding box is less than 24x24 CSS pixels.',
    whyItMatters: 'People with motor tremors, arthritis, or users on mobile devices frequently miss or mis-tap the control.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Add padding or minimum dimensions (min-height: 24px; min-width: 24px).',
    safeFixAvailable: true
  },
  'document-title': {
    name: 'Document Must Have a <title> Element',
    criterion: 'WCAG 2.4.2 Page Titled (Level A)',
    simpleExplanation: 'The web page does not have a browser window title.',
    technicalExplanation: '<head> element lacks a non-empty <title> tag.',
    whyItMatters: 'Users switching between browser tabs cannot quickly identify the content or purpose of the page.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Add a descriptive <title> in the HTML <head> section.',
    safeFixAvailable: true
  },
  'heading-order': {
    name: 'Heading Levels Should Increase Incrementally',
    criterion: 'WCAG 1.3.1 Info and Relationships (Level A)',
    simpleExplanation: 'Headings skip levels (e.g. jump from Main Heading directly to Sub-sub-heading).',
    technicalExplanation: 'Heading hierarchy skipped levels (e.g. <h1> immediately followed by <h4>).',
    whyItMatters: 'Screen reader users rely on headings to build a mental outline of the page.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Ensure heading elements increment sequentially without skipping levels.',
    safeFixAvailable: true
  },
  'aria-roles': {
    name: 'ARIA Roles Must Be Valid',
    criterion: 'WCAG 4.1.2 Name, Role, Value (Level A)',
    simpleExplanation: 'An element uses an unrecognized or invalid ARIA role name (e.g. role="banana").',
    technicalExplanation: 'The role attribute must match a valid WAI-ARIA 1.2 landmark, widget, or structure role.',
    whyItMatters: 'Assistive technologies ignore custom or unrecognized roles, stripping the intended accessible meaning.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Remove the invalid role or replace with a valid WAI-ARIA role (such as region, alert, status, button).',
    safeFixAvailable: true
  },
  'aria-valid-attr': {
    name: 'ARIA Attributes Must Be Valid and Spelled Correctly',
    criterion: 'WCAG 4.1.2 Name, Role, Value (Level A)',
    simpleExplanation: 'An assistive technology code (ARIA) is misspelled or invalid.',
    technicalExplanation: 'Element contains unknown or misspelled ARIA attributes (e.g. aria-labeledby).',
    whyItMatters: 'Assistive technologies ignore corrupted attributes, leaving users without accessibility aids.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Fix attribute typos (e.g. change aria-labeledby to aria-labelledby) or remove invalid attributes.',
    safeFixAvailable: true
  },
  'aria-valid-attr-value': {
    name: 'ARIA Attributes Must Have Valid Values',
    criterion: 'WCAG 4.1.2 Name, Role, Value (Level A)',
    simpleExplanation: 'An ARIA attribute contains an invalid value (e.g. invalid state or token).',
    technicalExplanation: 'The value supplied to an aria-* attribute is not supported by the WAI-ARIA specification.',
    whyItMatters: 'Screen readers can misinterpret or ignore the element state.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Update the attribute value to a valid token (e.g. true/false or valid IDREF).',
    safeFixAvailable: true
  },
  'aria-allowed-attr': {
    name: 'ARIA Attributes Must Be Allowed on This Element Role',
    criterion: 'WCAG 4.1.2 Name, Role, Value (Level A)',
    simpleExplanation: 'An ARIA attribute is placed on an element or role where it is prohibited.',
    technicalExplanation: 'The ARIA attribute is not permitted for the specified element or ARIA role.',
    whyItMatters: 'Invalid ARIA combinations can cause assistive technology crashes or inconsistent announcement.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Remove the incompatible ARIA attribute from this element.',
    safeFixAvailable: true
  },
  'tabindex': {
    name: 'Elements Must Not Use Positive Tabindex',
    criterion: 'WCAG 2.4.3 Focus Order (Level A)',
    simpleExplanation: 'Keyboard focus jumps around unpredictably instead of moving in normal reading order.',
    technicalExplanation: 'Element has tabIndex > 0, which disrupts natural sequential DOM navigation.',
    whyItMatters: 'Keyboard-only and switch-device users experience disorientation and skipped content.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Change tabIndex to 0 (to make focusable) or -1 (programmatic only), avoiding positive values.',
    safeFixAvailable: true
  },
  'landmark-one-main': {
    name: 'Page Must Contain a Main Landmark',
    criterion: 'WCAG 1.3.1 Info and Relationships (Level A)',
    simpleExplanation: 'The page lacks a main landmark container to skip repetitive navigation headers.',
    technicalExplanation: 'Document has no <main> element or element with role="main".',
    whyItMatters: 'Keyboard and screen reader users cannot quickly jump straight to the central page content.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Wrap primary page content inside a semantic <main> tag.',
    safeFixAvailable: true
  },
  'video-caption': {
    name: 'Prerecorded Video Must Have Captions',
    criterion: 'WCAG 1.2.2 Captions (Prerecorded) (Level A)',
    simpleExplanation: 'A video does not provide text captions for spoken dialogue or audio cues.',
    technicalExplanation: '<video> tag lacks a corresponding <track kind="captions">.',
    whyItMatters: 'Deaf or hard-of-hearing users cannot follow auditory dialogue and sound effects.',
    classification: CLASSIFICATIONS.UNFIXABLE,
    suggestedSolution: 'Transcribe spoken audio and add <track kind="captions" src="/captions.vtt" srclang="en" label="English">.',
    safeFixAvailable: false
  },
  'table-missing-headers': {
    name: 'Data Tables Must Have Header Cells',
    criterion: 'WCAG 1.3.1 Info and Relationships (Level A)',
    simpleExplanation: 'A data table lacks column or row headers (<th>), so screen readers cannot associate cells with their labels.',
    technicalExplanation: '<table> has <td> data cells but zero <th> header cells or caption.',
    whyItMatters: 'Blind users navigating the table hear raw values without knowing which column or row they belong to.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Add a <thead> row containing <th scope="col"> elements for each column header.',
    safeFixAvailable: true
  },
  'moving-content-no-pause': {
    name: 'Moving or Sliding Content Must Have a Pause Mechanism',
    criterion: 'WCAG 2.2.2 Pause, Stop, Hide (Level A)',
    simpleExplanation: 'A moving animation starts automatically and loops infinitely without a way to stop or pause it.',
    technicalExplanation: 'Infinite CSS animation or moving element lacks user pause controls or prefers-reduced-motion alternative.',
    whyItMatters: 'Distracting moving animations cause severe cognitive strain for users with ADHD or vestibular disorders.',
    classification: CLASSIFICATIONS.NEEDS_REVIEW,
    suggestedSolution: 'Provide a visible Pause/Play toggle button or respect @media (prefers-reduced-motion).',
    safeFixAvailable: false
  },
  'region': {
    name: 'Page Content Must Be Contained by Landmarks',
    criterion: 'WCAG 1.3.1 / 2.4.1 Landmark Hierarchy (Level A)',
    simpleExplanation: 'Some content is placed outside recognizable structural sections (<header>, <main>, <nav>, <footer>).',
    technicalExplanation: 'DOM elements reside directly in the document flow outside semantic landmark containers.',
    whyItMatters: 'Users who navigate via screen reader landmarks skip over or lose access to content outside landmarks.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Ensure all sections are enclosed within <main>, <header>, <nav>, or <section aria-labelledby="...">.',
    safeFixAvailable: true
  },
  'color-contrast-enhanced': {
    name: 'Text Contrast (Enhanced)',
    criterion: 'WCAG 1.4.6 Contrast (Enhanced) (Level AAA)',
    simpleExplanation: 'The contrast ratio is below the AAA enhanced target of 7:1.',
    technicalExplanation: 'Foreground and background luminance ratio is below 7:1 for normal text.',
    whyItMatters: 'Higher contrast enables users with severe low vision to read text comfortably without screen magnification.',
    classification: CLASSIFICATIONS.CERTIFIED_CANDIDATE,
    suggestedSolution: 'Darken text color or lighten background to achieve at least 7.0:1 contrast.',
    safeFixAvailable: true
  }
};

/**
 * Classifies an axe-core violation and augments it with human explanations
 */
export function classifyViolation(violation) {
  const ruleId = violation.id;
  const kb = RULE_KNOWLEDGE_BASE[ruleId] || {
    name: violation.help || ruleId,
    criterion: violation.tags?.find(t => t.startsWith('wcag')) || 'WCAG Guideline',
    simpleExplanation: violation.help || 'Accessibility issue detected on page element.',
    technicalExplanation: violation.description || 'Failed axe-core rule assertion.',
    whyItMatters: 'May create navigation barriers for people using assistive technologies.',
    classification: CLASSIFICATIONS.UNFIXABLE,
    suggestedSolution: violation.help ? `${violation.help}. Remove or correct the invalid attribute.` : 'Remove or correct the invalid attribute.',
    safeFixAvailable: false
  };

  return {
    ...violation,
    name: kb.name,
    wcagCriterion: kb.criterion,
    simpleExplanation: kb.simpleExplanation,
    technicalExplanation: kb.technicalExplanation,
    whyItMatters: kb.whyItMatters,
    classification: kb.classification,
    suggestedSolution: kb.suggestedSolution,
    safeFixAvailable: kb.safeFixAvailable
  };
}

export function classifyAllViolations(violations = []) {
  return violations.map(classifyViolation);
}
