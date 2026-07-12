const PREFIXES = [
  'The', 'A', 'Certified', 'Low-Key', 'Extremely', 'Emotionally',
  'Strictly', 'Mildly', 'Chronically', 'Unofficial', 'Aggressively'
];

const MOOD_NOUNS = {
  feral: ['Meltdown', 'Feral Hour', 'Chaos Engine', 'Blackout', 'Riot Act'],
  scorched: ['Scorched Earth', 'Short Fuse', 'Static Burn', 'Flashpoint'],
  sunburnt: ['Sun Damage', 'Golden Hour', 'Heat Stroke', 'Porch Light'],
  kindled: ['Slow Burn', 'Ember', 'Kindling', 'Warm Front'],
  restless: ['Fidget', 'Static', 'Loose Wire', 'Pacing'],
  charged: ['Live Current', 'Spark Plug', 'Wired', 'Overclocked'],
  electric: ['Sugar Rush', 'Live Wire', 'Neon Pulse', 'Static Shock'],
  fizzy: ['Soda Pop', 'Sparkler', 'Champagne Problem', 'Fizzy Logic'],
  overgrown: ['Backyard', 'Wildflower', 'Greenhouse', 'Moss'],
  mossy: ['Undergrowth', 'Quiet Trail', 'Fern Patch', 'Soft Ground'],
  verdant: ['Dirt Road', 'Front Porch', 'Barefoot', 'Garden Hose'],
  'still-water': ['Glassy Lake', 'No Ripples', 'Flat Calm', 'Low Tide'],
  adrift: ['Daydream', 'Cloud Cover', 'Floating Rib', 'Sea Legs'],
  undertow: ['Riptide', 'Deep End', 'Slow Drip', 'Undertow'],
  glacial: ['Frostbite', 'Cold Open', 'Ice Machine', 'Deep Freeze'],
  'deep-freeze': ['Permafrost', 'Cold Snap', 'Ice Age', 'Blue Frost'],
  midnight: ['3am Thoughts', 'Streetlight', 'Nightcap', 'Afterhours'],
  'blue-hour': ['Dusk Static', 'In Between', 'Half Light', 'Blue Hour'],
  wistful: ['Old Photos', 'Static on the Radio', 'Rerun', 'Faded Polaroid'],
  haunted: ['Ghost Story', 'Empty House', 'Static Noise', 'Shadow Puppet'],
  lovesick: ['Situationship', 'Slow Dance', 'Heart Eyes', 'Butterflies'],
  flushed: ['Blushing', 'Butterfingers', 'Warm Cheeks', 'Nervous Laugh'],
  feverish: ['Fever Dream', 'Hot Mess', 'Sugar High', 'Overheating'],
  'crimson-edge': ['Red Alert', 'Fault Line', 'Last Straw', 'Live Wire']
};

const FALLBACK_NOUNS = ['Mystery Mood', 'Unlabeled Feeling', 'Color Study', 'Untitled Emotion'];

const SUFFIXES = [
  'Mixtape', 'Playlist', 'Soundtrack', 'Sessions', 'Radio', 'Diaries',
  'Chronicles', 'Anthology', 'Bootleg', 'Tapes'
];

const CONNECTORS = ['of', 'for', 'from', ''];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generatePlaylistTitle(moodProfile) {
  const nouns = MOOD_NOUNS[moodProfile.zoneKey] || FALLBACK_NOUNS;
  const prefix = pick(PREFIXES);
  const noun = pick(nouns);
  const suffix = pick(SUFFIXES);
  const connector = pick(CONNECTORS);

  const shapes = [
    `${prefix} ${noun} ${suffix}`,
    `${noun}: ${suffix} ${connector} the ${moodProfile.descriptor.split(', ')[0]}`,
    `${prefix} ${moodProfile.label} ${suffix}`,
    `${noun} (${moodProfile.descriptor.split(', ')[1]} version)`,
    `${prefix} ${noun}`
  ];

  return pick(shapes).replace(/\s+/g, ' ').replace(/\s([:)])/g, '$1').trim();
}
