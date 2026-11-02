// The seven bars. Colours: bg = section background, deep = sleeve, ink = text on bg,
// choc = the chocolate itself, bits = inclusions scattered on the chocolate.
export const PRODUCTS = [
  {
    id: 'ruby', no: 1, name: 'Ruby', flavor: 'Raspberry & Rose',
    type: 'Ruby', cocoa: 47, origin: 'Ecuador',
    desc: 'Naturally pink ruby cacao folded with freeze-dried raspberries and a breath of rose. Bright, juicy and quietly romantic.',
    notes: ['Tart raspberry', 'Rose petal', 'Silky finish'],
    bg: '#f2295e', deep: '#a3082e', ink: '#fff6f3', choc: '#c45a72', bits: '#7d0620',
    ingredients: ['raspberry', 'petal']
  },
  {
    id: 'ember', no: 2, name: 'Ember', flavor: 'Mango & Chili',
    type: 'Dark', cocoa: 70, origin: 'Peru',
    desc: 'Seventy-percent dark with sun-dried mango and a slow chili glow that arrives just after the sweetness.',
    notes: ['Ripe mango', 'Slow heat', 'Toasted cocoa'],
    bg: '#ff6a13', deep: '#b83d00', ink: '#2b1105', choc: '#3f1e12', bits: '#ffb21f',
    ingredients: ['mango', 'chili']
  },
  {
    id: 'gold', no: 3, name: 'Gold', flavor: 'Honey & Sea Salt',
    type: 'Blond', cocoa: 35, origin: 'Madagascar',
    desc: 'Caramelised blond chocolate, wildflower honey and flakes of sea salt. Like the crunchy corner of a crème brûlée.',
    notes: ['Burnt caramel', 'Wild honey', 'Sea salt'],
    bg: '#ffc21a', deep: '#b87400', ink: '#2e1c02', choc: '#b37532', bits: '#fffaf0',
    ingredients: ['honeycomb', 'salt']
  },
  {
    id: 'grove', no: 4, name: 'Grove', flavor: 'Matcha & Yuzu',
    type: 'Matcha white', cocoa: 30, origin: 'Uji, Japan',
    desc: 'Ceremonial matcha whisked into creamy white chocolate, lifted with bright yuzu zest. Grassy, citrusy and calm.',
    notes: ['Green tea', 'Yuzu zest', 'Sweet cream'],
    bg: '#2fbf5b', deep: '#137a35', ink: '#06331a', choc: '#93ad58', bits: '#ffe14d',
    ingredients: ['leaf', 'yuzu']
  },
  {
    id: 'tide', no: 5, name: 'Tide', flavor: 'Mint & Cacao Nib',
    type: 'Dark', cocoa: 72, origin: 'Ghana',
    desc: 'Seventy-two percent dark with cool peppermint and crunchy roasted nibs. A deep breath in bar form.',
    notes: ['Cool mint', 'Nib crunch', 'Dark cherry'],
    bg: '#00b8b0', deep: '#00706b', ink: '#002f2c', choc: '#3a1c10', bits: '#7fecc4',
    ingredients: ['mint', 'nib']
  },
  {
    id: 'dusk', no: 6, name: 'Dusk', flavor: 'Blueberry & Lavender',
    type: 'Milk', cocoa: 45, origin: 'Dominican Republic',
    desc: 'Smooth milk chocolate with wild blueberries and a whisper of lavender. Twilight, but make it dessert.',
    notes: ['Wild blueberry', 'Lavender', 'Milk caramel'],
    bg: '#4f5bff', deep: '#2530b8', ink: '#f3f4ff', choc: '#5c2e1c', bits: '#2a2d8c',
    ingredients: ['blueberry', 'lavender']
  },
  {
    id: 'velvet', no: 7, name: 'Velvet', flavor: 'Ube & Blackcurrant',
    type: 'Ube white', cocoa: 32, origin: 'Philippines',
    desc: 'Purple ube white chocolate swirled with tart blackcurrant. Nutty, vanilla-soft and impossibly violet.',
    notes: ['Ube vanilla', 'Blackcurrant', 'Toasted coconut'],
    bg: '#9b3df5', deep: '#5a14a8', ink: '#fbf4ff', choc: '#9a73b8', bits: '#2a0b38',
    ingredients: ['ube', 'currant']
  }
];

export const CREAM = { bg: '#fff3e3', ink: '#2a160c' };
