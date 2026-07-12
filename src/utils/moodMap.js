import { hexToHsl, hashString, mulberry32 } from './color';

// 24 hue zones spanning 0-360 with NO wraparound duplicate (the old version
// repeated "Feral" at both hue 0 and hue 360, which is why opposite ends of a
// linear arc kept producing the same mood — 0 and 360 are the same color on
// a color WHEEL, but this is a straight arc, so that repeat was a real bug).
//
// Each zone has its own adjective pool AND noun pool. The mood label is built
// by combining one of each (e.g. "Kindled Ember", "Restless Static"), so a
// single zone alone produces dozens of distinct-sounding labels, not one
// fixed word. Combined with 5 energy bands x 5 depth bands for the
// descriptor line, the total distinct "mood card" content is in the
// thousands, and it's keyed off the literal hex value, so nearby-but-not-
// identical colors reliably produce different combinations.
const HUE_ZONES = [
  { max: 15, key: 'feral', genres: ['hyperpop', 'punk', 'drum and bass', 'hardcore'], adjectives: ['chaotic', 'unhinged', 'combustible', 'feverish'], nouns: ['Riot', 'Meltdown', 'Wildfire', 'Static'] },
  { max: 30, key: 'scorched', genres: ['punk', 'garage rock', 'noise rock', 'metal'], adjectives: ['seething', 'blistering', 'raw', 'volatile'], nouns: ['Ember', 'Flare', 'Short Fuse', 'Ash'] },
  { max: 45, key: 'sunburnt', genres: ['funk', 'soul', 'afrobeat', 'disco'], adjectives: ['warm', 'golden', 'strutting', 'loose-limbed'], nouns: ['Sunspot', 'Porch Light', 'Heat Wave', 'Amber'] },
  { max: 60, key: 'kindled', genres: ['funk', 'soul', 'motown', 'neo soul'], adjectives: ['glowing', 'confident', 'radiant', 'unhurried'], nouns: ['Slow Burn', 'Kindling', 'Warm Front', 'Firelight'] },
  { max: 75, key: 'restless', genres: ['indie rock', 'garage rock', 'surf rock', 'power pop'], adjectives: ['energetic', 'gritty', 'fidgety', 'sun-baked'], nouns: ['Static', 'Loose Wire', 'Pacing', 'Sunburn'] },
  { max: 90, key: 'charged', genres: ['pop rock', 'indie rock', 'new wave', 'britpop'], adjectives: ['buoyant', 'wired', 'sparking', 'alert'], nouns: ['Live Current', 'Spark Plug', 'Overdrive', 'Signal'] },
  { max: 105, key: 'electric', genres: ['pop', 'dance pop', 'electropop', 'synth pop'], adjectives: ['bright', 'buzzing', 'euphoric', 'candy-coated'], nouns: ['Neon', 'Live Wire', 'Sugar Rush', 'Pulse'] },
  { max: 120, key: 'fizzy', genres: ['bubblegum pop', 'dance pop', 'disco', 'nu disco'], adjectives: ['effervescent', 'giddy', 'sparkling', 'weightless'], nouns: ['Soda Pop', 'Sparkler', 'Champagne', 'Fizz'] },
  { max: 135, key: 'overgrown', genres: ['indie folk', 'chamber pop', 'bedroom pop', 'freak folk'], adjectives: ['lush', 'wandering', 'unruly', 'green'], nouns: ['Backyard', 'Wildflower', 'Greenhouse', 'Moss'] },
  { max: 150, key: 'mossy', genres: ['folk', 'indie folk', 'americana', 'acoustic'], adjectives: ['soft-edged', 'quiet', 'patient', 'sheltered'], nouns: ['Undergrowth', 'Fern Patch', 'Quiet Trail', 'Soft Ground'] },
  { max: 165, key: 'verdant', genres: ['folk', 'acoustic', 'singer-songwriter', 'americana'], adjectives: ['grounded', 'earthy', 'steady', 'unbothered'], nouns: ['Dirt Road', 'Front Porch', 'Garden Hose', 'Barefoot'] },
  { max: 180, key: 'still-water', genres: ['ambient folk', 'acoustic', 'neoclassical', 'singer-songwriter'], adjectives: ['calm', 'clear-headed', 'settled', 'unclouded'], nouns: ['Glassy Lake', 'Low Tide', 'Flat Calm', 'No Ripples'] },
  { max: 195, key: 'adrift', genres: ['ambient', 'dream pop', 'shoegaze', 'ambient pop'], adjectives: ['floaty', 'hazy', 'weightless', 'half-asleep'], nouns: ['Daydream', 'Cloud Cover', 'Sea Legs', 'Floating Rib'] },
  { max: 210, key: 'undertow', genres: ['chillwave', 'downtempo', 'trip hop', 'lo-fi'], adjectives: ['submerged', 'cool', 'slow-motion', 'muffled'], nouns: ['Riptide', 'Deep End', 'Slow Drip', 'Undertow'] },
  { max: 225, key: 'glacial', genres: ['synthwave', 'electronic', 'ambient techno', 'idm'], adjectives: ['crisp', 'distant', 'shimmering', 'sharp-edged'], nouns: ['Frostbite', 'Cold Open', 'Ice Machine', 'Glacier'] },
  { max: 240, key: 'deep-freeze', genres: ['ambient techno', 'minimal techno', 'synthwave', 'dark ambient'], adjectives: ['stark', 'numb-calm', 'metallic', 'echoing'], nouns: ['Permafrost', 'Cold Snap', 'Ice Age', 'Blue Frost'] },
  { max: 255, key: 'midnight', genres: ['r&b', 'neo soul', 'alternative r&b', 'quiet storm'], adjectives: ['moody', 'velvet', 'late-night', 'low-lit'], nouns: ['3am Thoughts', 'Streetlight', 'Nightcap', 'Afterhours'] },
  { max: 270, key: 'blue-hour', genres: ['neo soul', 'r&b', 'jazz fusion', 'trip hop'], adjectives: ['pensive', 'smoky', 'unresolved', 'in-between'], nouns: ['Dusk Static', 'Half Light', 'Blue Hour', 'In Between'] },
  { max: 285, key: 'wistful', genres: ['dream pop', 'indie pop', 'lo-fi', 'jangle pop'], adjectives: ['nostalgic', 'blurry', 'tender', 'half-remembered'], nouns: ['Old Photos', 'Rerun', 'Faded Polaroid', 'Static on the Radio'] },
  { max: 300, key: 'haunted', genres: ['alt rock', 'gothic rock', 'darkwave', 'post-punk'], adjectives: ['brooding', 'shadowed', 'intense', 'unresolved'], nouns: ['Ghost Story', 'Empty House', 'Shadow Puppet', 'Static Noise'] },
  { max: 315, key: 'lovesick', genres: ['pop r&b', 'bedroom pop', 'indie pop', 'r&b'], adjectives: ['aching', 'romantic', 'soft-focus', 'starry-eyed'], nouns: ['Situationship', 'Slow Dance', 'Heart Eyes', 'Butterflies'] },
  { max: 330, key: 'flushed', genres: ['pop', 'indie pop', 'dream pop', 'synth pop'], adjectives: ['blushing', 'shy-bold', 'tender-loud', 'infatuated'], nouns: ['Warm Cheeks', 'Nervous Laugh', 'Butterfingers', 'Soft Spot'] },
  { max: 345, key: 'feverish', genres: ['pop rock', 'dance', 'disco', 'nu disco'], adjectives: ['flushed', 'urgent', 'glittery', 'overheated'], nouns: ['Fever Dream', 'Hot Mess', 'Sugar High', 'Overheating'] },
  { max: 360, key: 'crimson-edge', genres: ['punk', 'hardcore', 'industrial', 'post-punk'], adjectives: ['sharp', 'cutting', 'unresolved', 'electric'], nouns: ['Red Alert', 'Last Straw', 'Fault Line', 'Live Wire'] }
];

const ENERGY_WORDS = {
  faded: ['muted', 'faded', 'dusty', 'washed-out', 'pale'],
  low: ['soft', 'gentle', 'quiet-burning', 'understated', 'reserved'],
  mid: ['steady', 'balanced', 'even-keeled', 'grounded', 'level'],
  high: ['saturated', 'vivid', 'loud', 'electric', 'full-throated'],
  max: ['blazing', 'maxed-out', 'unfiltered', 'searing', 'overdriven']
};

const DEPTH_WORDS = {
  darkest: ['shadowed', 'dim', 'smoky', 'low-lit', 'buried'],
  dark: ['dusky', 'muted-dark', 'close', 'hushed', 'private'],
  mid: ['clear', 'open', 'even', 'unclouded', 'plain'],
  light: ['airy', 'lifted', 'lit-up', 'unguarded', 'open-hearted'],
  lightest: ['radiant', 'blown-out', 'bright', 'washed in light', 'overexposed']
};

function getHueZone(h) {
  // Clamp so a floating-point value that lands exactly on 360 still resolves
  // to the last real zone instead of falling through to nothing.
  const clamped = Math.min(h, 359.999);
  return HUE_ZONES.find((z) => clamped <= z.max) || HUE_ZONES[HUE_ZONES.length - 1];
}

function energyBand(s) {
  if (s < 20) return 'faded';
  if (s < 42) return 'low';
  if (s < 64) return 'mid';
  if (s < 86) return 'high';
  return 'max';
}

function depthBand(l) {
  if (l < 20) return 'darkest';
  if (l < 40) return 'dark';
  if (l < 60) return 'mid';
  if (l < 80) return 'light';
  return 'lightest';
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function getMoodProfile(hex) {
  const { h, s, l } = hexToHsl(hex);
  const zone = getHueZone(h);
  const eBand = energyBand(s);
  const dBand = depthBand(l);
  const rand = mulberry32(hashString(hex));

  const adjective = zone.adjectives[Math.floor(rand() * zone.adjectives.length)];
  const noun = zone.nouns[Math.floor(rand() * zone.nouns.length)];
  const energyWord = ENERGY_WORDS[eBand][Math.floor(rand() * ENERGY_WORDS[eBand].length)];
  const depthWord = DEPTH_WORDS[dBand][Math.floor(rand() * DEPTH_WORDS[dBand].length)];

  return {
    label: `${capitalize(adjective)} ${noun}`,
    descriptor: `${energyWord}, ${depthWord}`,
    genres: zone.genres,
    searchSeeds: [...zone.genres, adjective, energyWord],
    zoneKey: zone.key,
    hue: h,
    saturation: s,
    lightness: l
  };
}
