/** Site taxonomy that is not a clinic fact: body areas, home pillars, menu groups, form options. */

export const bodyAreaList = [
  { id: 'scalp', label: 'Scalp and hair', short: 'Scalp' },
  { id: 'face', label: 'Face', short: 'Face' },
  { id: 'body', label: 'Body', short: 'Body' },
  { id: 'hands-nails', label: 'Hands and nails', short: 'Hands and nails' },
  { id: 'feet', label: 'Feet', short: 'Feet' },
] as const;

export type BodyAreaId = (typeof bodyAreaList)[number]['id'];

export const menuGroupList = [
  { id: 'dermatology', label: 'Dermatology' },
  { id: 'aesthetics-and-laser', label: 'Aesthetics and laser' },
  { id: 'internal-medicine', label: 'Internal medicine' },
] as const;

/** Home "pillars" (brief §8.3). Each category sits in exactly one. `layer` drives the skin model. */
export const pillars = [
  {
    id: 'consultations-and-tests',
    title: 'Consultations and tests',
    blurb: 'A diagnosis first: examination, dermoscopy, biopsies, allergy and fungal tests.',
    categories: ['dermatology-consultations', 'skin-tests-and-diagnostics'],
    layer: 'surface',
  },
  {
    id: 'clinical-dermatology',
    title: 'Clinical dermatology',
    blurb: 'Acne, eczema, pigmentation, infections and long-term skin conditions.',
    categories: ['clinical-dermatology', 'foot-skin-care', 'mens-and-womens-skin-health', 'dermatology-pharmacy'],
    layer: 'epidermis',
  },
  {
    id: 'skin-cancer-and-mole-checks',
    title: 'Skin cancer and mole checks',
    blurb: 'Mole mapping, dermoscopy and treatment of suspicious growths.',
    categories: ['skin-cancer-care'],
    layer: 'melanocytes',
  },
  {
    id: 'hair-scalp-and-nails',
    title: 'Hair, scalp and nails',
    blurb: 'Hair loss, scalp conditions and nail disease, from diagnosis to regrowth treatment.',
    categories: ['hair-and-scalp', 'nail-care'],
    layer: 'follicle',
  },
  {
    id: 'childrens-skin',
    title: 'Children’s skin',
    blurb: 'Eczema, rashes, birthmarks and infections in babies, children and teenagers.',
    categories: ['childrens-skin-care'],
    layer: 'barrier',
  },
  {
    id: 'aesthetics-and-laser',
    title: 'Aesthetics and laser',
    blurb: 'Injectables, peels, microneedling and lasers matched to your skin type.',
    categories: ['aesthetic-treatments', 'laser-treatments'],
    layer: 'dermis',
  },
  {
    id: 'skin-surgery-and-wound-care',
    title: 'Skin surgery and wound care',
    blurb: 'Removal of moles, cysts and keloids, and care for wounds that are slow to heal.',
    categories: ['skin-surgery', 'wound-care'],
    layer: 'fat',
  },
  {
    id: 'internal-medicine',
    title: 'Internal medicine',
    blurb: 'General medical consultations and care for blood pressure, diabetes and cholesterol.',
    categories: ['internal-medicine'],
    layer: 'vessels',
  },
] as const;

export const faqGroups = [
  { id: 'booking', label: 'Booking an appointment' },
  { id: 'fees-and-hmo', label: 'Fees and HMOs' },
  { id: 'online', label: 'Online consultations' },
  { id: 'first-visit', label: 'Your first consultation' },
  { id: 'children', label: 'Children' },
  { id: 'treatments', label: 'Treatments' },
  { id: 'location', label: 'Finding us' },
] as const;

export const articleTopics: Record<string, { label: string; tint: 'rose' | 'blush' | 'leaf' }> = {
  skin: { label: 'Skin', tint: 'blush' },
  hair: { label: 'Hair and scalp', tint: 'rose' },
  aesthetics: { label: 'Aesthetics', tint: 'blush' },
  laser: { label: 'Laser', tint: 'rose' },
  'general-health': { label: 'General health', tint: 'leaf' },
  clinic: { label: 'Seeing a dermatologist', tint: 'leaf' },
};

export const mainNav = [
  { id: 'services', label: 'Services', href: '/services/', menu: true },
  { id: 'conditions', label: 'Conditions', href: '/conditions/', menu: true },
  { id: 'learn', label: 'Learn', href: '/blog/', menu: false },
  { id: 'about', label: 'About', href: '/about/', menu: false },
  { id: 'contact', label: 'Contact', href: '/contact/', menu: false },
] as const;

export const legalPages = [
  { label: 'Privacy policy', href: '/privacy-policy/' },
  { label: 'Terms', href: '/terms/' },
  { label: 'Cookie policy', href: '/cookie-policy/' },
  { label: 'Medical disclaimer', href: '/medical-disclaimer/' },
  { label: 'Editorial policy', href: '/editorial-policy/' },
] as const;
