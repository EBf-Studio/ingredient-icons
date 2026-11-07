// Icons the home page, the Open Graph image and the logo pick by hand. Each must have its
// own icon: lib/doc-ids.test.ts checks them, and the pages throw at build on a missing one.

/** Ingredients that share one emoji, and the icons that tell them apart. */
export const EMOJI_ROWS = [
  { emoji: '🧅', label: 'onion', ids: ['onion', 'red-onion', 'shallot', 'spring-onion', 'leek'] },
  { emoji: '🧂', label: 'salt shaker', ids: ['salt', 'black-pepper', 'white-pepper', 'peppercorn', 'celery-salt'] },
  { emoji: '🧀', label: 'cheese wedge', ids: ['brie', 'feta', 'blue-cheese', 'mozzarella', 'parmesan'] },
];

/** A recipe as an app stores it: catalog ids, some without an icon of their own. */
export const RECIPE = [
  { id: 'aubergine', quantity: '1', name: 'aubergine' },
  { id: 'courgette', quantity: '2', name: 'courgettes' },
  { id: 'red-bell-pepper', quantity: '1', name: 'red pepper' },
  { id: 'onion', quantity: '1', name: 'onion' },
  { id: 'garlic', quantity: '3', name: 'garlic cloves' },
  { id: 'cherry-tomato', quantity: '250 g', name: 'cherry tomatoes' },
  { id: 'thyme', quantity: '4 sprigs', name: 'thyme' },
  { id: 'extra-virgin-olive-oil', quantity: '3 tbsp', name: 'olive oil' },
];

// Hand-picked so every column of the shelf mixes colours and shapes instead of clumping greens together.
export const SHELF_PICKS = [
  'tomato', 'avocado', 'brie', 'lemon', 'salmon', 'garlic', 'strawberry', 'cheddar',
  'shallot', 'basil', 'eggs', 'carrot', 'parmesan', 'blueberry', 'prawn', 'aubergine',
  'butter', 'chili-pepper', 'mushrooms', 'pomegranate', 'breads', 'spaghetti', 'leek', 'pita-bread',
  'red-onion', 'maple-syrup', 'pineapple', 'squid', 'cinnamon', 'broccoli', 'mozzarella', 'peach',
  'olive-oil', 'pumpkin', 'star-anise', 'fig', 'bacon', 'lime', 'radish', 'dark-chocolate',
  'mango', 'artichoke', 'rosemary', 'crab', 'beetroot', 'coconut-milk', 'cherry', 'ginger',
];

/** The wall of icons behind the closing call to action. */
export const CTA_ICONS = [
  'lemon', 'garlic', 'basil', 'eggs', 'tomato', 'butter',
  'avocado', 'carrot', 'strawberry', 'mushrooms', 'brie', 'chili-pepper',
  'pear', 'shallot', 'cherry', 'broccoli', 'aubergine', 'peach',
];

/** The grid of the Open Graph image. */
export const OG_ICONS = ['avocado', 'tomato', 'shallot', 'brie', 'lemon', 'basil', 'salmon', 'garlic', 'strawberry'];
