export const MAX_QUANTITY = 99;

export const OPTION_GROUPS = [
  {
    key: 'size',
    label: 'Size',
    choices: [
      ['S', -50],
      ['M', 0],
      ['L', 100],
    ],
  },
  {
    key: 'temperature',
    label: 'Temperature',
    choices: [
      ['Hot', 0],
      ['Warm', 0],
      ['Iced', 0],
      ['Extra Hot', 0],
    ],
  },
  {
    key: 'strength',
    label: 'Strength',
    choices: [
      ['Single', 0],
      ['Double', 80],
      ['Extra Strong', 150],
    ],
  },
  {
    key: 'foam',
    label: 'Foam',
    choices: [
      ['No Foam', 0],
      ['Light Foam', 0],
      ['Extra Foam', 30],
      ['Creamy', 40],
    ],
  },
  {
    key: 'sweetener',
    label: 'Sweetener',
    choices: [
      ['None', 0],
      ['Sugar', 0],
      ['Brown Sugar', 0],
      ['Honey', 0],
      ['Stevia', 0],
    ],
  },
  {
    key: 'milk',
    label: 'Milk',
    choices: [
      ['Whole', 0],
      ['Trim', 0],
      ['Oat', 70],
      ['Almond', 70],
      ['Soy', 50],
    ],
  },
];

export const TOPPINGS = [
  ['Chocolate Drizzle', 50],
  ['Caramel Drizzle', 50],
  ['Whipped Cream', 70],
  ['Cocoa Powder', 30],
  ['Cinnamon', 30],
];

export const DEFAULT_SELECTION = {
  size: 'M',
  temperature: 'Hot',
  strength: 'Single',
  foam: 'Light Foam',
  sweetener: 'None',
  milk: 'Whole',
  toppings: [],
};

export function normalizeSelection(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new Error('Choose valid coffee options.');
  const selection = {};
  for (const group of OPTION_GROUPS) {
    const value = input[group.key] ?? DEFAULT_SELECTION[group.key];
    if (!group.choices.some(([name]) => name === value)) {
      throw new Error(`Choose a valid ${group.label.toLowerCase()}.`);
    }
    selection[group.key] = value;
  }
  const toppings = input.toppings ?? [];
  if (
    !Array.isArray(toppings) ||
    toppings.some((value) => !TOPPINGS.some(([name]) => name === value))
  ) {
    throw new Error('Choose valid toppings.');
  }
  selection.toppings = [...new Set(toppings)].sort();
  return selection;
}

export function describeSelection(selection) {
  return [
    `Size ${selection.size}`,
    selection.temperature,
    selection.strength,
    selection.foam,
    selection.milk,
    selection.sweetener !== 'None' ? selection.sweetener : null,
    ...selection.toppings,
  ]
    .filter(Boolean)
    .join(' · ');
}
