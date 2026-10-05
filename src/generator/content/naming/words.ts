/**
 * Word pools for compound names ("The Ashen Concord", "Sela the Unbowed",
 * "Glimmering Reach"). Used alongside language-generated roots.
 * Every pool has at least 50 entries.
 */

export const ADJECTIVES = [
  'Ashen', 'Amber', 'Azure', 'Bitter', 'Black', 'Bleak', 'Brazen', 'Broken', 'Burning', 'Cinder',
  'Cobalt', 'Crimson', 'Crowned', 'Dawning', 'Deep', 'Distant', 'Drowned', 'Dusk', 'Ember', 'Endless',
  'Ever', 'Faded', 'Fallen', 'Far', 'Frozen', 'Gilded', 'Glass', 'Gleaming', 'Golden', 'Gray',
  'Hidden', 'Hollow', 'Howling', 'Iron', 'Ivory', 'Jade', 'Last', 'Lesser', 'Lonely', 'Lost',
  'Low', 'Midnight', 'Mirrored', 'Molten', 'Northern', 'Obsidian', 'Old', 'Pale', 'Quiet', 'Radiant',
  'Red', 'Restless', 'Risen', 'Rusted', 'Sable', 'Salt', 'Scarlet', 'Shattered', 'Shining', 'Silent',
  'Silver', 'Sleeping', 'Southern', 'Starlit', 'Still', 'Stone', 'Storm', 'Sundered', 'Sunken', 'Thorned',
  'Thousand', 'Twin', 'Umber', 'Unbroken', 'Veiled', 'Verdant', 'Violet', 'Waking', 'Weeping', 'White',
  'Wild', 'Winding', 'Withered', 'Woven',
];

export const NOUNS = [
  'Accord', 'Anvil', 'Archive', 'Banner', 'Beacon', 'Blade', 'Bloom', 'Bond', 'Bridge', 'Candle',
  'Chain', 'Chalice', 'Choir', 'Circle', 'Coil', 'Compass', 'Covenant', 'Crown', 'Dawn', 'Drum',
  'Eye', 'Flame', 'Gate', 'Hand', 'Harbor', 'Hearth', 'Helm', 'Horn', 'Hound', 'Key',
  'Lantern', 'Ledger', 'Lens', 'Loom', 'Mask', 'Mirror', 'Oath', 'Orchard', 'Pact', 'Pillar',
  'Quill', 'Root', 'Rose', 'Scale', 'Seal', 'Seed', 'Serpent', 'Shield', 'Signal', 'Spear',
  'Spindle', 'Star', 'Thread', 'Throne', 'Tide', 'Tower', 'Veil', 'Vigil', 'Wake', 'Wheel',
  'Wing', 'Wolf', 'Word', 'Wreath',
];

export const EPITHETS = [
  'Bold', 'Unbowed', 'Patient', 'Gray', 'Silent', 'Wise', 'Cruel', 'Lame', 'Lucky', 'Faithless',
  'Faithful', 'Hammer', 'Lantern', 'Red', 'Kind', 'Elder', 'Younger', 'Exile', 'Returned', 'Wanderer',
  'Twice-Born', 'Ironhand', 'Silvertongue', 'Burned', 'Unlucky', 'Last', 'Quiet', 'Merciful', 'Hollow',
  'Bright', 'Honest', 'Liar', 'Mapmaker', 'Smiling', 'Stern', 'Stormborn', 'Builder', 'Breaker', 'Thrice-Sworn',
  'Fox', 'Owl', 'Bull', 'Widow', 'Orphan', 'Debtless', 'Saint', 'Butcher', 'Gentle', 'Fearless',
  'Restless', 'Old', 'Undying', 'Starstruck', 'Saltblood', 'Coinless', 'Truthsayer', 'Ashwalker', 'Dreamer',
  'Unseen', 'Reckoner',
];

export const LANDFORMS = [
  'Reach', 'Hollow', 'Vale', 'Ridge', 'Crossing', 'Ford', 'Falls', 'Rise', 'Deep', 'Point',
  'Haven', 'Bluff', 'Basin', 'Shelf', 'Spur', 'Mesa', 'Fen', 'Moor', 'Strand', 'Cove',
  'Gulch', 'Pass', 'Barrens', 'Steppe', 'Wold', 'Heights', 'Terrace', 'Delta', 'Mire', 'Shoals',
  'Sound', 'Narrows', 'Crag', 'Fells', 'Downs', 'Dell', 'Gorge', 'Hook', 'Isle', 'Knoll',
  'Ledge', 'Mouth', 'Pools', 'Run', 'Scarp', 'Sink', 'Stair', 'Tor', 'Wash', 'Wells',
  'Wilds', 'Expanse', 'Flats', 'Dunes', 'Grove', 'Shore', 'Canyon', 'Crater', 'Spire', 'Hold',
];

/** Nouns for planetary governments ("The Concord of X"). */
export const GOVERNMENT_NOUNS = {
  unified: ['Hegemony', 'Unity', 'Dominion', 'Sovereignty', 'Directorate', 'Commonweal', 'Realm', 'Paramountcy'],
  federation: ['Federation', 'Concord', 'Assembly', 'Compact', 'League', 'Union', 'Accord', 'Confederacy'],
};

/** Titles for world-government leaders. */
export const WORLD_LEADER_TITLES = {
  unified: ['Sovereign', 'Supreme Director', 'World-Regent', 'Prime Custodian', 'Paramount', 'First of All', 'High Steward'],
  federation: ['Chancellor', 'First Speaker', 'President of the Assembly', 'High Arbiter', 'Concordant', 'Convenor', 'Speaker-General'],
};

/** Roman numerals for catalog designations ("Teshvar IV"). */
export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
