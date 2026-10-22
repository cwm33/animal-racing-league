"""Research the explicit seed roster without changing application data.

Fetch initial ADW metadata: python expansion/prepare.py --research
Compile reviewed pack data separately: python expansion/generate.py
Only writes beneath expansion/. No application data is changed.
"""
import concurrent.futures
import html
import json
from pathlib import Path
import re
import sys
import urllib.request

ROOT = Path(__file__).resolve().parent
DATE = '2026-10-22'
# id | name | scientific | group | order | family | mass kg | top m/s |
# locomotion | anatomical brief. Numbers are rounded editable MODEL PRESETS.
SEED = '''quokka|Quokka|Setonix brachyurus|mammal|Diprotodontia|Macropodidae|3|4|bound|Brown wallaby with round ears, short broad muzzle, black nose, hunched back, cream belly, two small forearms, two strong hind legs, relatively short slender bare tail; not a squirrel tail.
wombat|Common wombat|Vombatus ursinus|mammal|Diprotodontia|Vombatidae|27|6|gallop|Stocky grey-brown burrowing marsupial, broad blunt bare nose, small round ears, four short strong clawed legs, almost invisible tail; adult barrel body.
pangolin|Temminck's pangolin|Smutsia temminckii|mammal|Pholidota|Manidae|12|1|waddle|Overlapping ochre-brown keratin scales, long thick tapering scaled tail, small tapered head, no teeth visible, four limbs with large curved foreclaws, walking low; no armadillo armor bands.
aardvark|Aardvark|Orycteropus afer|mammal|Tubulidentata|Orycteropodidae|55|5|gallop|Pink-grey sparse-haired body, very long rabbit-like ears, elongated pig-like snout, arched back, four digging legs, thick tapering tail; no tusks.
echidna|Short-beaked echidna|Tachyglossus aculeatus|mammal|Monotremata|Tachyglossidae|4|0.5|crawl|Low dark brown body covered in cream-tipped spines, long narrow tubular beak, no external ear pinnae, four short sprawling digging limbs; no porcupine tail.
armadillo|Nine-banded armadillo|Dasypus novemcinctus|mammal|Cingulata|Dasypodidae|4|3|gallop|Grey bony armor with flexible transverse midbody bands, pointed snout, large upright ears, long ring-armored tail, four short clawed legs.
giant-anteater|Giant anteater|Myrmecophaga tridactyla|mammal|Pilosa|Myrmecophagidae|30|4|gallop|Long narrow tubular muzzle, small ears, grey-brown body with bold diagonal black and white shoulder stripe, huge shaggy tail, four legs; forefeet folded onto knuckles around long claws.
meerkat|Meerkat|Suricata suricatta|mammal|Carnivora|Herpestidae|0.8|5|gallop|Slender sandy mongoose with dark eye patches, tiny round ears, pointed nose, faint dark back bands, thin black-tipped tail, four legs in walking stance; not upright human posture.
badger|European badger|Meles meles|mammal|Carnivora|Mustelidae|11|5|gallop|Low broad grey body, white head with two bold black eye-to-ear stripes, small ears, black legs, four digging paws, short tail.
wolverine|Wolverine|Gulo gulo|mammal|Carnivora|Mustelidae|14|6|gallop|Stocky dark brown mustelid, broad head, small rounded ears, pale tan lateral flank bands, bushy short tail and four powerful plantigrade paws; no bear hump.
raccoon|Raccoon|Procyon lotor|mammal|Carnivora|Procyonidae|7|4|gallop|Grey coat, black eye mask, white brows and muzzle, bushy tail with distinct dark rings, four legs with dexterous five-toed forepaws.
red-panda|Red panda|Ailurus fulgens|mammal|Carnivora|Ailuridae|5|3|gallop|Russet fluffy coat, white ear rims and cheeks, dark tear marks, black belly and legs, long alternating russet-ringed bushy tail, four paws; not a giant panda.
fossa|Fossa|Cryptoprocta ferox|mammal|Carnivora|Eupleridae|8|6|gallop|Long sleek tawny-brown Malagasy carnivoran, small rounded ears, catlike short muzzle, four muscular legs, very long smooth cylindrical tail; no spots.
ring-tailed-lemur|Ring-tailed lemur|Lemur catta|mammal|Primates|Lemuridae|2.5|4|bound|Grey lemur with white face, black eye patches and muzzle, orange eyes, very long black-and-white ringed tail arcing behind, four limbs in terrestrial walk; no extra tail.
olive-baboon|Olive baboon|Papio anubis|mammal|Primates|Cercopithecidae|22|7|gallop|Adult olive-brown baboon with long dark dog-like muzzle, small rounded ears, four strong limbs in quadrupedal walk, single arched tail with downturned end; not a tailless ape.
crested-porcupine|Crested porcupine|Hystrix cristata|mammal|Rodentia|Hystricidae|15|2|waddle|Large dark rodent, long black-and-white banded quills fanning backwards and tall head crest, small rounded ears, blunt muzzle, four short clawed legs, short quilled tail.
hedgehog|European hedgehog|Erinaceus europaeus|mammal|Eulipotyphla|Erinaceidae|0.8|1|crawl|Small domed brown spine-covered body, pale furry pointed face, tiny round ears, black nose, four short feet; not porcupine-long quills.
tenrec|Tailless tenrec|Tenrec ecaudatus|mammal|Afrosoricida|Tenrecidae|2|1.2|crawl|Coarse brown bristly body with sparse short spines, long pointed pale muzzle, prominent whiskers, small ears, four short legs, no conspicuous tail; not a hedgehog ball.
shrew|Common shrew|Sorex araneus|mammal|Eulipotyphla|Soricidae|0.01|0.8|gallop|Tiny dark brown velvety mammal, elongated flexible pointed snout, tiny eyes and ears, pale belly, four small feet, slender medium-length tail; not a mouse with round ears.
elephant-shrew|Black and rufous sengi|Rhynchocyon petersi|mammal|Macroscelidea|Macroscelididae|0.5|5|bound|Rufous forebody and black hindquarters, long flexible downward-pointed trunk-like snout, large ears, slender long legs, narrow bare tail; not a miniature elephant.
springhare|South African springhare|Pedetes capensis|mammal|Rodentia|Pedetidae|3|8|bound|Sandy large jumping rodent, long ears, large dark eyes, two short forelimbs and two extremely long hind feet, long furry black-tipped tail, cream belly; not a kangaroo pouch.
okapi|Okapi|Okapia johnstoni|mammal|Artiodactyla|Giraffidae|240|8|gallop|Dark chocolate adult forest giraffid, short neck, large rounded ears, white lower face, white zebra-like stripes only on rump and upper legs, four long cloven-hoofed legs, small ossicones; not a full striped zebra.
cassowary|Southern cassowary|Casuarius casuarius|bird|Casuariiformes|Casuariidae|50|13|biped|Adult black shaggy flightless bird, bare cobalt-blue neck, two red wattles, tall brown casque on head, two powerful grey three-toed legs with long inner claws, tiny folded wings.
emu|Emu|Dromaius novaehollandiae|bird|Casuariiformes|Casuariidae|40|13|biped|Tall flightless bird with shaggy brown drooping double feathers, dark head and blue-grey upper neck, short broad beak, two long strong grey three-toed legs, tiny near-invisible wings; no casque.
secretary-bird|Secretary bird|Sagittarius serpentarius|bird|Accipitriformes|Sagittariidae|4|4|biped|Tall grey terrestrial raptor, long black-feathered thighs and long bare lower legs, black quill crest behind head, orange-red bare eye patch, hooked beak, long central tail feathers and two folded wings.
roadrunner|Greater roadrunner|Geococcyx californianus|bird|Cuculiformes|Cuculidae|0.3|8|biped|Slender streaked brown ground cuckoo, erect ragged crest, long straight tail, pointed grey beak, pale belly, two long running legs with two toes forward and two back; no cartoon purple plumage.
kiwi|North Island brown kiwi|Apteryx mantelli|bird|Apterygiformes|Apterygidae|2.5|2|biped|Round brown shaggy flightless bird, very long slender ivory bill with nostrils at tip, tiny eyes, no visible tail, wings hidden in plumage, two sturdy three-toed legs.
wild-turkey|Wild turkey|Meleagris gallopavo|bird|Galliformes|Phasianidae|6|6|biped|Adult male dark bronze wild turkey, bare blue-red head and red wattle, modest snood, folded wings, closed broad brown barred tail rather than display fan, two sturdy scaly legs.
guineafowl|Helmeted guineafowl|Numida meleagris|bird|Galliformes|Numididae|1.3|5|biped|Round charcoal body densely patterned with small white spots, tiny blue bare head with brown helmet and red wattles, short tail, folded wings, two dark running legs.
peafowl|Indian peafowl|Pavo cristatus|bird|Galliformes|Phasianidae|4.5|3|biped|Adult male with blue neck and head, small upright fan crest, green scaled upper back, long folded green eye-spotted train trailing compactly behind, two legs and folded wings; full train in frame, no display fan.
seriema|Red-legged seriema|Cariama cristata|bird|Cariamiformes|Cariamidae|1.5|7|biped|Long-legged buff-grey ground bird, red bill and legs, upright wispy forehead crest, long neck, dark barred tail, folded wings; two three-forward-toed feet, not a secretary bird.
kori-bustard|Kori bustard|Ardeotis kori|bird|Otidiformes|Otididae|10|3|biped|Large heavy brown mottled ground bird, thick grey barred neck, black swept-back crown tuft, white belly, long pale legs, folded wings and short tail; two three-toed feet.
tinamou|Great tinamou|Tinamus major|bird|Tinamiformes|Tinamidae|1.1|3|biped|Plump olive-brown subtly barred forest bird, small grey head and slender neck, short slightly curved bill, very short tail, tucked wings, two stout grey legs; not a kiwi beak.
lyrebird|Superb lyrebird|Menura novaehollandiae|bird|Passeriformes|Menuridae|1|3|biped|Brown adult male ground bird, long delicate tail with two outer lyre-shaped feathers and fine central filaments, slim dark beak, strong scratching feet, two folded wings; tail arched compactly fully in frame.
komodo-dragon|Komodo dragon|Varanus komodoensis|reptile|Squamata|Varanidae|70|4|crawl|Heavy grey-brown monitor lizard with granular scales, long low head, four powerful splayed clawed limbs, very long muscular tapering tail, forked tongue; no spikes, frill or wings.
gila-monster|Gila monster|Heloderma suspectum|reptile|Squamata|Helodermatidae|0.7|0.5|crawl|Stocky orange-pink and black bead-scaled lizard, broad head, thick short banded tail, four short splayed clawed limbs; no dorsal spines.
bearded-dragon|Central bearded dragon|Pogona vitticeps|reptile|Squamata|Agamidae|0.4|2|crawl|Sandy tan lizard with broad triangular head, spiny beard under jaw, flattened oval body, small lateral spines, four splayed clawed legs, long tapering tail; no neck frill.
frilled-lizard|Frilled lizard|Chlamydosaurus kingii|reptile|Squamata|Agamidae|0.6|3|biped|Brown slender lizard with large circular pleated orange-edged neck frill partly expanded, two long hind legs in bipedal run and two small raised forelegs, very long thin tail; no extra legs.
horned-lizard|Texas horned lizard|Phrynosoma cornutum|reptile|Squamata|Phrynosomatidae|0.06|0.8|crawl|Broad flattened sand-coloured body, crown of pointed head horns, two long rear head horns, rough spiny back and side fringes, four short splayed legs, short pointed tail; not thorny devil.
thorny-devil|Thorny devil|Moloch horridus|reptile|Squamata|Agamidae|0.05|0.3|crawl|Ochre and brown desert lizard densely covered in large conical spines, hornlike head spikes, false-head hump behind neck, four short splayed limbs, stiff short spiny tail.
blue-tongued-skink|Eastern blue-tongued skink|Tiliqua scincoides|reptile|Squamata|Scincidae|0.5|0.8|crawl|Smooth shiny broad brown-banded skink, large triangular head, briefly visible broad blue tongue, cylindrical body, four very small five-toed legs, thick tapering tail.
leopard-gecko|Leopard gecko|Eublepharis macularius|reptile|Squamata|Eublepharidae|0.06|0.6|crawl|Yellow and pale cream gecko with black spots, moveable eyelids, thick segmented fat tail, four small legs with clawed slender toes WITHOUT adhesive toe pads.
tuatara|Tuatara|Sphenodon punctatus|reptile|Rhynchocephalia|Sphenodontidae|0.7|0.5|crawl|Stout olive-grey reptile, triangular head, small white dorsal crest from head along back, four sprawling clawed limbs, long thick tapering tail; modest crest, no iguana dewlap.
rosy-boa|Rosy boa|Lichanura trivirgata|reptile|Squamata|Boidae|0.4|0.3|crawl|Small thick-bodied smooth-scaled boa, three reddish-brown LONGITUDINAL stripes on pale cream-grey body, blunt small head, compact flowing S-shaped slither right; absolutely no limbs, no hood.
common-toad|Common toad|Bufo bufo|amphibian|Anura|Bufonidae|0.05|0.3|bound|Warty brown adult toad, squat body, copper eyes with horizontal pupils, large oval parotoid glands behind eyes, two short forelegs and two bent hind legs, no tail.
fire-salamander|Fire salamander|Salamandra salamandra|amphibian|Caudata|Salamandridae|0.03|0.15|crawl|Shiny black terrestrial salamander with irregular bold yellow patches, broad head, four short limbs, four front toes and five rear toes, round-section tapering tail; no gills or fins.
tiger-salamander|Tiger salamander|Ambystoma tigrinum|amphibian|Caudata|Ambystomatidae|0.1|0.2|crawl|Stout terrestrial adult salamander, dark brown body with irregular yellow-olive blotches, broad round head, four short limbs, long thick tapering tail; no external larval gills.
tomato-frog|Tomato frog|Dyscophus antongilii|amphibian|Anura|Microhylidae|0.03|0.4|bound|Round plump red-orange adult female terrestrial frog, orange eyes, pale belly, two small forelegs and two short folded hind legs, no horns, no tail.
ornate-horned-frog|Ornate horned frog|Ceratophrys ornata|amphibian|Anura|Ceratophryidae|0.3|0.4|bound|Broad round green and brown patterned terrestrial frog, enormous wide mouth, small pointed raised eyelid horns, pale underside, two small forelegs and two folded powerful hind legs; not bull horns.
golden-mantella|Golden mantella|Mantella aurantiaca|amphibian|Anura|Mantellidae|0.002|0.3|bound|Tiny uniformly bright golden-orange terrestrial frog, without dark dorsal spots, black round eyes, smooth skin, two small forelegs and two folded long hind legs, slender toes, no tail; no oversized treefrog toe discs.
tarantula|Chilean rose tarantula|Grammostola rosea|terrestrial-invertebrate|Araneae|Theraphosidae|0.02|0.25|crawl|Hairy brown tarantula with pinkish copper carapace, TWO body sections, EIGHT jointed walking legs, two short pedipalps beside downward fangs, tiny clustered real spider eyes; no antennae, no cartoon eyeball stalks.
scorpion|Emperor scorpion|Pandinus imperator|terrestrial-invertebrate|Scorpiones|Scorpionidae|0.025|0.2|crawl|Glossy black scorpion, EIGHT walking legs plus TWO large grasping pedipalp pincers, segmented narrow tail curving above back ending in reddish stinger, small eyes; no antennae.
coconut-crab|Coconut crab|Birgus latro|terrestrial-invertebrate|Decapoda|Coenobitidae|2|0.3|crawl|Adult terrestrial coconut crab, blue-purple and rust armored broad body, two massive front claws with left larger, three pairs of obvious walking legs, reduced rear fifth pair tucked under body, long antennae, short abdomen curled under, no external shell.
tiger-beetle|Six-spotted tiger beetle|Cicindela sexguttata|terrestrial-invertebrate|Coleoptera|Carabidae|0.0001|0.5|gallop|Metallic emerald green beetle, six small cream elytral spots, large eyes and curved jaws, SIX long jointed running legs, two antennae, closed wing cases; never eight legs.
silver-ant|Saharan silver ant|Cataglyphis bombycina|terrestrial-invertebrate|Hymenoptera|Formicidae|0.00001|0.6|gallop|Silvery-haired desert worker ant, three clear body regions, narrow waist, SIX long thin jointed legs, two elbowed antennae, large dark eyes, no wings.
cockroach|Madagascar hissing cockroach|Gromphadorhina portentosa|terrestrial-invertebrate|Blattodea|Blaberidae|0.015|0.3|gallop|Large wingless mahogany and black oval cockroach, segmented abdomen, broad dark shield behind small head, two long antennae, SIX spiny running legs, no wings.
mantis|European mantis|Mantis religiosa|terrestrial-invertebrate|Mantodea|Mantidae|0.003|0.15|crawl|Adult green praying mantis, triangular mobile head, two compound eyes, two fine antennae, long prothorax, SIX legs total: two folded spined raptorial forelegs and four walking legs, folded wings.
stick-insect|Indian stick insect|Carausius morosus|terrestrial-invertebrate|Phasmatodea|Lonchodidae|0.002|0.04|crawl|Wingless brown-green stick insect, extremely elongated twiglike body, SIX very long slender jointed legs, two fine antennae, tiny head, no leaf wings.
giant-millipede|Giant African millipede|Archispirostreptus gigas|terrestrial-invertebrate|Spirostreptida|Spirostreptidae|0.1|0.03|crawl|Glossy dark chocolate cylindrical millipede with many ring segments, TWO PAIRS of short reddish legs per midbody segment, two short antennae, compact shallow C-shaped right-facing walking form; no pincers.
centipede|Giant desert centipede|Scolopendra heros|terrestrial-invertebrate|Scolopendromorpha|Scolopendridae|0.01|0.3|crawl|Flattened reddish-brown centipede with dark head, 21 pairs of yellow legs, ONE leg pair per trunk segment, long antennae, elongated rear leg pair; no millipede cylinder, no scorpion tail.
earthworm|Common earthworm|Lumbricus terrestris|terrestrial-invertebrate|Haplotaxida|Lumbricidae|0.005|0.005|crawl|Pink-brown segmented adult earthworm with swollen pale clitellum nearer front, tapering ends, compact natural curve facing right, NO eyes, NO limbs, NO antennae; subtle moist shading without slime trail.
slug|Black slug|Arion ater|terrestrial-invertebrate|Stylommatophora|Arionidae|0.02|0.002|crawl|Black terrestrial slug, rounded mantle on front back, elongated muscular foot, TWO upper eye-bearing tentacles and TWO short lower sensory tentacles, no shell, no limbs, no trail.
velvet-worm|Giant velvet worm|Mongeperipatus solorzanoi|terrestrial-invertebrate|Euonychophora|Peripatidae|0.003|0.02|crawl|Brown velvety soft wormlike body, 34 pairs of short closely spaced unjointed stubby lobopod legs in an adult male, two curved antennae, tiny dark eyes and two small oral papillae; no insect armor or centipede joints.
woodlouse|Common rough woodlouse|Porcellio scaber|terrestrial-invertebrate|Isopoda|Porcellionidae|0.0001|0.03|crawl|Small grey flattened oval terrestrial isopod, rough overlapping dorsal plates, SEVEN pairs of walking legs, two main antennae, short rear uropods, no snail shell, walking rather than rolled up.'''

def seeds():
    records=[]
    for line in SEED.splitlines():
        id,name,sci,group,order,family,mass,speed,gait,brief=line.split('|')
        records.append(dict(id=id,name=name,scientific=sci,group=group,order=order,family=family,mass=float(mass),speed=float(speed),gait=gait,brief=brief))
    assert len(records)==64
    return records

def fetch_account(r):
    url='https://animaldiversity.org/accounts/'+r['scientific'].replace(' ','_')+'/'
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'AnimalRacingLeague-expansion-research/1.0'})
        with urllib.request.urlopen(req,timeout=45) as f:
            raw=f.read().decode(); final=f.url
        text=html.unescape(re.sub('<[^>]+>',' ',raw))
        text=re.sub(r'\s+',' ',text).strip()
        # Bounded paraphrase aids for review; do not archive entire accounts.
        physical=text.split('Physical Description',1)[-1].split('Reproduction',1)[0]
        masses=[]
        for m in re.finditer(r'(Range|Average) mass ([.\d]+)(?: to ([.\d]+))?( \(high\))? (kg|g)',physical):
            kind,a,b,high,unit=m.groups();scale=1 if unit=='kg' else 0.001
            item={'kind':('upper_bound' if high else 'range' if b else 'average'),'kg':[float(a)*scale,float(b)*scale] if b else float(a)*scale}
            if item not in masses:masses.append(item)
        title=re.search('<title>(.*?)</title>',raw,re.S).group(1).strip()
        scope='information' if 'INFORMATION' in title else 'classification' if 'CLASSIFICATION' in title else 'unavailable'
        return r['id'],dict(url=url,resolvedUrl=final,status='not_found' if '404' in title else 'retrieved',accessed=DATE,title=title,reportedMass=masses,identityPresent=r['scientific'] in text,accountScope=scope)
    except Exception as e:
        return r['id'],dict(url=url,status='unavailable',attempted=DATE,error=str(e))

if __name__=='__main__' and '--research' in sys.argv:
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        results=dict(pool.map(fetch_account,seeds()))
    (ROOT/'research.json').write_text(json.dumps(results,indent=2)+'\n')
    for id,r in results.items():
        print(id,r['status'],r.get('reportedMass'))
