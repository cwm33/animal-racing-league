/** Browsing groups are taxonomy-inspired, not equivalent taxonomic ranks. */
export const BIOLOGICAL_GROUPS = [
  { id: 'mammals', label: 'All mammals' },
  { id: 'big-cats', label: 'Big cats' },
  { id: 'canines', label: 'Canines' },
  { id: 'hoofed-mammals', label: 'Hoofed mammals' },
  { id: 'marsupials', label: 'Marsupials' },
  { id: 'rodents', label: 'Rodents' },
  { id: 'primates', label: 'Primates' },
  { id: 'bears', label: 'Bears' },
  { id: 'hyenas', label: 'Hyenas' },
  { id: 'elephants', label: 'Elephants' },
  { id: 'lagomorphs', label: 'Rabbits & relatives' },
  { id: 'monotremes', label: 'Monotremes' },
  { id: 'pinnipeds', label: 'Seals & relatives' },
  { id: 'sloths', label: 'Sloths & relatives' },
  { id: 'birds', label: 'Birds' },
  { id: 'reptiles', label: 'Reptiles' },
  { id: 'amphibians', label: 'Amphibians' },
  { id: 'invertebrates', label: 'Invertebrates' },
] as const
export type BiologicalGroup = (typeof BIOLOGICAL_GROUPS)[number]['id']
export interface SpeciesClassification {
  classId: 'mammals' | 'birds' | 'reptiles' | 'amphibians' | 'invertebrates'
  groupId: BiologicalGroup
  order: string
  family: string
}
const mammal = (
  groupId: BiologicalGroup,
  order: string,
  family: string,
): SpeciesClassification => ({ classId: 'mammals', groupId, order, family })
// Explicit species-ID metadata. Never infer ancestry from a common name, gait,
// racing stats, or a user-renamed monster. Identity stays in animals.ts.
export const SPECIES_CLASSIFICATION: Readonly<
  Record<string, SpeciesClassification>
> = {
  cheetah: mammal('big-cats', 'Carnivora', 'Felidae'),
  lion: mammal('big-cats', 'Carnivora', 'Felidae'),
  tiger: mammal('big-cats', 'Carnivora', 'Felidae'),
  greyhound: mammal('canines', 'Carnivora', 'Canidae'),
  wolf: mammal('canines', 'Carnivora', 'Canidae'),
  fox: mammal('canines', 'Carnivora', 'Canidae'),
  horse: mammal('hoofed-mammals', 'Perissodactyla', 'Equidae'),
  zebra: mammal('hoofed-mammals', 'Perissodactyla', 'Equidae'),
  rhino: mammal('hoofed-mammals', 'Perissodactyla', 'Rhinocerotidae'),
  hippo: mammal('hoofed-mammals', 'Cetartiodactyla', 'Hippopotamidae'),
  giraffe: mammal('hoofed-mammals', 'Cetartiodactyla', 'Giraffidae'),
  bison: mammal('hoofed-mammals', 'Cetartiodactyla', 'Bovidae'),
  goat: mammal('hoofed-mammals', 'Cetartiodactyla', 'Bovidae'),
  pronghorn: mammal('hoofed-mammals', 'Cetartiodactyla', 'Antilocapridae'),
  moose: mammal('hoofed-mammals', 'Cetartiodactyla', 'Cervidae'),
  camel: mammal('hoofed-mammals', 'Cetartiodactyla', 'Camelidae'),
  warthog: mammal('hoofed-mammals', 'Cetartiodactyla', 'Suidae'),
  kangaroo: mammal('marsupials', 'Diprotodontia', 'Macropodidae'),
  squirrel: mammal('rodents', 'Rodentia', 'Sciuridae'),
  capybara: mammal('rodents', 'Rodentia', 'Caviidae'),
  gorilla: mammal('primates', 'Primates', 'Hominidae'),
  human: mammal('primates', 'Primates', 'Hominidae'),
  bear: mammal('bears', 'Carnivora', 'Ursidae'),
  hyena: mammal('hyenas', 'Carnivora', 'Hyaenidae'),
  elephant: mammal('elephants', 'Proboscidea', 'Elephantidae'),
  rabbit: mammal('lagomorphs', 'Lagomorpha', 'Leporidae'),
  platypus: mammal('monotremes', 'Monotremata', 'Ornithorhynchidae'),
  seal: mammal('pinnipeds', 'Carnivora', 'Phocidae'),
  sloth: mammal('sloths', 'Pilosa', 'Bradypodidae'),
  ostrich: {
    classId: 'birds',
    groupId: 'birds',
    order: 'Struthioniformes',
    family: 'Struthionidae',
  },
  penguin: {
    classId: 'birds',
    groupId: 'birds',
    order: 'Sphenisciformes',
    family: 'Spheniscidae',
  },
  chicken: {
    classId: 'birds',
    groupId: 'birds',
    order: 'Galliformes',
    family: 'Phasianidae',
  },
  duck: {
    classId: 'birds',
    groupId: 'birds',
    order: 'Anseriformes',
    family: 'Anatidae',
  },
  tortoise: {
    classId: 'reptiles',
    groupId: 'reptiles',
    order: 'Testudines',
    family: 'Testudinidae',
  },
  crocodile: {
    classId: 'reptiles',
    groupId: 'reptiles',
    order: 'Crocodylia',
    family: 'Crocodylidae',
  },
  snail: {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: 'Stylommatophora',
    family: 'Helicidae',
  },
}
export function classificationFor(
  id: string,
): SpeciesClassification | undefined {
  return Object.hasOwn(SPECIES_CLASSIFICATION, id)
    ? SPECIES_CLASSIFICATION[id]
    : undefined
}
export function groupLabel(id: string): string {
  const group = classificationFor(id)?.groupId
  return (
    BIOLOGICAL_GROUPS.find((item) => item.id === group)?.label ?? 'Unclassified'
  )
}
export function belongsToGroup(id: string, group: BiologicalGroup): boolean {
  const metadata = classificationFor(id)
  return metadata?.classId === group || metadata?.groupId === group
}
