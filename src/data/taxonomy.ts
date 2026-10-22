import expansionMetadata from './expansion-metadata.json'

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
  order: string | null
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
  quokka: {
    classId: 'mammals',
    groupId: 'marsupials',
    order: 'Diprotodontia',
    family: 'Macropodidae',
  },
  wombat: {
    classId: 'mammals',
    groupId: 'marsupials',
    order: 'Diprotodontia',
    family: 'Vombatidae',
  },
  pangolin: {
    classId: 'mammals',
    groupId: 'mammals',
    order: 'Pholidota',
    family: 'Manidae',
  },
  aardvark: {
    classId: 'mammals',
    groupId: 'mammals',
    order: 'Tubulidentata',
    family: 'Orycteropodidae',
  },
  echidna: {
    classId: 'mammals',
    groupId: 'monotremes',
    order: 'Monotremata',
    family: 'Tachyglossidae',
  },
  armadillo: {
    classId: 'mammals',
    groupId: 'mammals',
    order: 'Cingulata',
    family: 'Dasypodidae',
  },
  'giant-anteater': {
    classId: 'mammals',
    groupId: 'mammals',
    order: 'Pilosa',
    family: 'Myrmecophagidae',
  },
  meerkat: {
    classId: 'mammals',
    groupId: 'mammals',
    order: 'Carnivora',
    family: 'Herpestidae',
  },
  badger: {
    classId: 'mammals',
    groupId: 'mammals',
    order: 'Carnivora',
    family: 'Mustelidae',
  },
  wolverine: {
    classId: 'mammals',
    groupId: 'mammals',
    order: 'Carnivora',
    family: 'Mustelidae',
  },
  raccoon: {
    classId: 'mammals',
    groupId: 'mammals',
    order: 'Carnivora',
    family: 'Procyonidae',
  },
  'red-panda': {
    classId: 'mammals',
    groupId: 'mammals',
    order: 'Carnivora',
    family: 'Ailuridae',
  },
  fossa: {
    classId: 'mammals',
    groupId: 'mammals',
    order: 'Carnivora',
    family: 'Eupleridae',
  },
  'ring-tailed-lemur': {
    classId: 'mammals',
    groupId: 'primates',
    order: 'Primates',
    family: 'Lemuridae',
  },
  'olive-baboon': {
    classId: 'mammals',
    groupId: 'primates',
    order: 'Primates',
    family: 'Cercopithecidae',
  },
  'crested-porcupine': {
    classId: 'mammals',
    groupId: 'rodents',
    order: 'Rodentia',
    family: 'Hystricidae',
  },
  hedgehog: {
    classId: 'mammals',
    groupId: 'mammals',
    order: 'Eulipotyphla',
    family: 'Erinaceidae',
  },
  tenrec: {
    classId: 'mammals',
    groupId: 'mammals',
    order: 'Afrosoricida',
    family: 'Tenrecidae',
  },
  shrew: {
    classId: 'mammals',
    groupId: 'mammals',
    order: 'Eulipotyphla',
    family: 'Soricidae',
  },
  'elephant-shrew': {
    classId: 'mammals',
    groupId: 'mammals',
    order: 'Macroscelidea',
    family: 'Macroscelididae',
  },
  springhare: {
    classId: 'mammals',
    groupId: 'rodents',
    order: 'Rodentia',
    family: 'Pedetidae',
  },
  okapi: {
    classId: 'mammals',
    groupId: 'hoofed-mammals',
    order: 'Artiodactyla',
    family: 'Giraffidae',
  },
  cassowary: {
    classId: 'birds',
    groupId: 'birds',
    order: 'Casuariiformes',
    family: 'Casuariidae',
  },
  emu: {
    classId: 'birds',
    groupId: 'birds',
    order: 'Casuariiformes',
    family: 'Casuariidae',
  },
  'secretary-bird': {
    classId: 'birds',
    groupId: 'birds',
    order: 'Accipitriformes',
    family: 'Sagittariidae',
  },
  roadrunner: {
    classId: 'birds',
    groupId: 'birds',
    order: 'Cuculiformes',
    family: 'Cuculidae',
  },
  kiwi: {
    classId: 'birds',
    groupId: 'birds',
    order: 'Apterygiformes',
    family: 'Apterygidae',
  },
  'wild-turkey': {
    classId: 'birds',
    groupId: 'birds',
    order: 'Galliformes',
    family: 'Phasianidae',
  },
  guineafowl: {
    classId: 'birds',
    groupId: 'birds',
    order: 'Galliformes',
    family: 'Numididae',
  },
  peafowl: {
    classId: 'birds',
    groupId: 'birds',
    order: 'Galliformes',
    family: 'Phasianidae',
  },
  seriema: {
    classId: 'birds',
    groupId: 'birds',
    order: 'Cariamiformes',
    family: 'Cariamidae',
  },
  'kori-bustard': {
    classId: 'birds',
    groupId: 'birds',
    order: 'Otidiformes',
    family: 'Otididae',
  },
  tinamou: {
    classId: 'birds',
    groupId: 'birds',
    order: 'Tinamiformes',
    family: 'Tinamidae',
  },
  lyrebird: {
    classId: 'birds',
    groupId: 'birds',
    order: 'Passeriformes',
    family: 'Menuridae',
  },
  'komodo-dragon': {
    classId: 'reptiles',
    groupId: 'reptiles',
    order: 'Squamata',
    family: 'Varanidae',
  },
  'gila-monster': {
    classId: 'reptiles',
    groupId: 'reptiles',
    order: 'Squamata',
    family: 'Helodermatidae',
  },
  'bearded-dragon': {
    classId: 'reptiles',
    groupId: 'reptiles',
    order: 'Squamata',
    family: 'Agamidae',
  },
  'frilled-lizard': {
    classId: 'reptiles',
    groupId: 'reptiles',
    order: 'Squamata',
    family: 'Agamidae',
  },
  'horned-lizard': {
    classId: 'reptiles',
    groupId: 'reptiles',
    order: 'Squamata',
    family: 'Phrynosomatidae',
  },
  'thorny-devil': {
    classId: 'reptiles',
    groupId: 'reptiles',
    order: 'Squamata',
    family: 'Agamidae',
  },
  'blue-tongued-skink': {
    classId: 'reptiles',
    groupId: 'reptiles',
    order: 'Squamata',
    family: 'Scincidae',
  },
  'leopard-gecko': {
    classId: 'reptiles',
    groupId: 'reptiles',
    order: 'Squamata',
    family: 'Eublepharidae',
  },
  tuatara: {
    classId: 'reptiles',
    groupId: 'reptiles',
    order: 'Rhynchocephalia',
    family: 'Sphenodontidae',
  },
  'rosy-boa': {
    classId: 'reptiles',
    groupId: 'reptiles',
    order: 'Squamata',
    family: 'Boidae',
  },
  'common-toad': {
    classId: 'amphibians',
    groupId: 'amphibians',
    order: 'Anura',
    family: 'Bufonidae',
  },
  'fire-salamander': {
    classId: 'amphibians',
    groupId: 'amphibians',
    order: 'Caudata',
    family: 'Salamandridae',
  },
  'tiger-salamander': {
    classId: 'amphibians',
    groupId: 'amphibians',
    order: 'Caudata',
    family: 'Ambystomatidae',
  },
  'tomato-frog': {
    classId: 'amphibians',
    groupId: 'amphibians',
    order: 'Anura',
    family: 'Microhylidae',
  },
  'ornate-horned-frog': {
    classId: 'amphibians',
    groupId: 'amphibians',
    order: 'Anura',
    family: 'Ceratophryidae',
  },
  'golden-mantella': {
    classId: 'amphibians',
    groupId: 'amphibians',
    order: 'Anura',
    family: 'Mantellidae',
  },
  tarantula: {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: 'Araneae',
    family: 'Theraphosidae',
  },
  scorpion: {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: 'Scorpiones',
    family: 'Scorpionidae',
  },
  'coconut-crab': {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: 'Decapoda',
    family: 'Coenobitidae',
  },
  'tiger-beetle': {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: 'Coleoptera',
    family: 'Carabidae',
  },
  'silver-ant': {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: 'Hymenoptera',
    family: 'Formicidae',
  },
  cockroach: {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: 'Blattodea',
    family: 'Blaberidae',
  },
  mantis: {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: 'Mantodea',
    family: 'Mantidae',
  },
  'stick-insect': {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: 'Phasmatodea',
    family: 'Lonchodidae',
  },
  'giant-millipede': {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: 'Spirostreptida',
    family: 'Spirostreptidae',
  },
  centipede: {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: 'Scolopendromorpha',
    family: 'Scolopendridae',
  },
  earthworm: {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: 'Haplotaxida',
    family: 'Lumbricidae',
  },
  slug: {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: 'Stylommatophora',
    family: 'Arionidae',
  },
  'velvet-worm': {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: null,
    family: 'Peripatidae',
  },
  woodlouse: {
    classId: 'invertebrates',
    groupId: 'invertebrates',
    order: 'Isopoda',
    family: 'Porcellionidae',
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

/** Full researched ranks for additions; unknown order stays null. */
export function expansionMetadataFor(id: string) {
  return Object.hasOwn(expansionMetadata, id)
    ? expansionMetadata[id as keyof typeof expansionMetadata]
    : undefined
}
