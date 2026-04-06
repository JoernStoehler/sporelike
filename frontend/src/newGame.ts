import type { GameState, Era } from './types';

const era1: Era = {
  number: 1,
  name: 'The Primordial Pools',
  playerSpeciesId: 'sp-cilia',
  species: [
    {
      id: 'sp-cilia',
      name: 'Cilia',
      description: 'A fast-spinning photosynthetic microorganism that thrives in shallow, sunlit pools. Its hair-like cilia propel it rapidly through water while chloroplast-like organelles harvest light energy. Fragile but quick.',
      imagePrompt: 'microscopic organism with flowing green cilia tendrils, bioluminescent, translucent body, in a sunlit tide pool, scientific illustration style',
      imageUrl: '/placeholders/cilia.png',
      traits: ['photosynthetic', 'fast-spinning', 'fragile', 'microscopic'],
      isPlayer: true,
    },
    {
      id: 'sp-gulper',
      name: 'Gulper',
      description: 'A slow, balloon-shaped predator that expands its membrane to engulf smaller organisms whole. Ambush hunter that drifts near thermal vents where prey congregates.',
      imagePrompt: 'translucent balloon-shaped predatory microorganism with expanding membrane mouth, dark purple, floating near underwater thermal vent, scientific illustration style',
      imageUrl: '/placeholders/gulper.png',
      traits: ['predatory', 'slow', 'expandable-membrane', 'ambush'],
      isPlayer: false,
    },
    {
      id: 'sp-rockwort',
      name: 'Rockwort',
      description: 'A colonial organism that anchors to mineral deposits and filters nutrients from water currents. Forms dense mats that provide shelter for smaller species. Cannot move.',
      imagePrompt: 'dense colony of orange-brown sessile filter-feeding organisms anchored to underwater rocks, branching structures, scientific illustration style',
      imageUrl: '/placeholders/rockwort.png',
      traits: ['sessile', 'colonial', 'filter-feeder', 'shelter-provider'],
      isPlayer: false,
    },
    {
      id: 'sp-dartfin',
      name: 'Dartfin',
      description: 'A needle-shaped predator with a single powerful flagellum. Incredibly fast in straight lines but cannot turn well. Hunts by ramming prey at speed.',
      imagePrompt: 'needle-shaped microscopic predator with single long flagellum tail, metallic silver body, streamlined, scientific illustration style',
      imageUrl: '/placeholders/dartfin.png',
      traits: ['predatory', 'fast', 'poor-turning', 'ram-hunter'],
      isPlayer: false,
    },
    {
      id: 'sp-bloomdust',
      name: 'Bloomdust',
      description: 'Tiny photosynthetic particles that reproduce explosively when nutrients are abundant. Individually harmless but massive blooms deplete oxygen and choke other species.',
      imagePrompt: 'cloud of tiny golden photosynthetic particles forming a dense bloom in water, sparkling, microscopic view, scientific illustration style',
      imageUrl: '/placeholders/bloomdust.png',
      traits: ['photosynthetic', 'fast-reproducing', 'bloom-forming', 'tiny'],
      isPlayer: false,
    },
  ],
  features: [
    {
      id: 'ft-thermal-vent',
      name: 'Thermal Vent Field',
      description: 'Cracks in the pool floor release warm, mineral-rich water. Creates temperature gradients that drive water circulation and concentrate nutrients.',
      type: 'geological',
      imagePrompt: 'underwater thermal vents with shimmering heat distortion and mineral deposits, dark rocky seafloor, warm orange glow',
      imageUrl: '/placeholders/thermal-vent.png',
    },
    {
      id: 'ft-tidal-flats',
      name: 'Tidal Flats',
      description: 'Shallow areas that periodically dry out during low tide. Only organisms that can tolerate desiccation or burrow into wet sediment survive here.',
      type: 'geological',
      imagePrompt: 'shallow tidal flat with receding water, exposed sediment, small pools remaining, coastal microscopic ecosystem',
      imageUrl: '/placeholders/tidal-flats.png',
    },
    {
      id: 'ft-nutrient-cycle',
      name: 'Detritus Web',
      description: 'Dead organisms decompose and release nutrients that fuel photosynthetic species. The faster things die, the richer the water becomes — creating boom-bust cycles.',
      type: 'ecological',
      imageUrl: '/placeholders/nutrient-cycle.png',
    },
  ],
  challenges: [
    {
      id: 'ch-1-gulper-ambush',
      description: 'A Gulper has drifted into your feeding grounds near the thermal vents. Its membrane is already expanding. Your Cilia colony is directly in its path.',
      involvedSpeciesIds: ['sp-cilia', 'sp-gulper'],
      involvedFeatureIds: ['ft-thermal-vent'],
      actions: [
        { label: 'Scatter outward in all directions', outcome: 'Your colony fragments. Most escape, but the scattered individuals struggle to find food alone. Some drift into Dartfin territory.', pointsAwarded: 1 },
        { label: 'Spin rapidly to create a water vortex', outcome: 'The coordinated spinning deflects the Gulper sideways! It tumbles past harmlessly. But the effort costs energy — your colony dims slightly.', pointsAwarded: 3 },
        { label: 'Retreat behind the Rockwort mats', outcome: 'You shelter in the Rockwort colony. The Gulper can\'t reach you here, but the Rockwort filters nutrients from the water before you can absorb them. You\'re safe but hungry.', pointsAwarded: 2 },
        { label: 'Hold position and hope it passes', outcome: 'The Gulper engulfs a significant portion of your colony. A harsh lesson in passivity.', pointsAwarded: 0 },
      ],
    },
    {
      id: 'ch-1-bloom-event',
      description: 'A Bloomdust explosion is underway. Golden particles fill the water, blocking sunlight from reaching deeper layers. Your photosynthesis is dropping fast.',
      involvedSpeciesIds: ['sp-cilia', 'sp-bloomdust'],
      involvedFeatureIds: ['ft-nutrient-cycle'],
      actions: [
        { label: 'Rise to the surface above the bloom', outcome: 'You reach the sunlight but you\'re exposed — no shelter up here, and Dartfins patrol the open water. You photosynthesize frantically.', pointsAwarded: 2 },
        { label: 'Switch to consuming dead Bloomdust particles', outcome: 'You tentatively absorb decomposing Bloomdust. It works! A new food source discovered — but your photosynthetic efficiency drops slightly from disuse.', pointsAwarded: 3 },
        { label: 'Wait it out near the thermal vents', outcome: 'The vent warmth sustains you minimally. The bloom passes after a period of starvation, but you survive intact. Some weaker colony members don\'t make it.', pointsAwarded: 1 },
      ],
    },
    {
      id: 'ch-1-dartfin-chase',
      description: 'A Dartfin has locked onto your colony during open-water transit. It\'s approaching fast in a straight line — you have seconds to react.',
      involvedSpeciesIds: ['sp-cilia', 'sp-dartfin'],
      involvedFeatureIds: [],
      actions: [
        { label: 'Sharp lateral dodge at the last moment', outcome: 'Your spinning cilia let you pivot sideways. The Dartfin rockets past, unable to turn. It\'ll take time to circle back — you\'re clear. Beautiful evasion!', pointsAwarded: 3 },
        { label: 'Dive toward the pool floor', outcome: 'You descend rapidly. The Dartfin follows but slows near the sediment — its speed advantage disappears in tight spaces. You lose it in the Rockwort.', pointsAwarded: 2 },
        { label: 'Release bioluminescent flash', outcome: 'You didn\'t know you could do that — but your chloroplasts flare brightly under stress. The Dartfin flinches and veers off. An accidental defense mechanism!', pointsAwarded: 2 },
      ],
    },
  ],
  events: [],
};

export function newGameState(): GameState {
  return {
    currentEraIndex: 0,
    eras: [era1],
    mutationCandidates: [],
  };
}
