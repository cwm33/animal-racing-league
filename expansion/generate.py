"""Compile reviewed facts and explicit model assumptions, without network access."""
import hashlib
import json
from pathlib import Path
from prepare import ROOT, DATE, seeds

def write(name, data):
    (ROOT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

# Supplemental references were read using web research on DATE. Notes paraphrase
# their scope; a source's mere existence never validates a racing preset.
# id: (url, title, evidence note, quantitative mass kg or None, evidence kind)
SUPPLEMENT = {
 'pangolin': [
  ('https://www.mammaldiversity.org/taxon/1005801/', 'Mammal Diversity Database: Ground Pangolin', 'Accepts Smutsia temminckii; Manis temminckii is an older combination.',None,'taxonomic_reference'),
  ('https://animaldiversity.org/accounts/Manis_temminckii/','ADW: Manis temminckii','The account under the older genus reports a 7–18 kg range.',[7,18],'reported_summary')],
 'wombat': [('https://museumsvictoria.com.au/article/can-wombats-run-at-40kmh/','Museums Victoria: Can wombats run at 40 km/h?','The familiar 40 km/h claim lacks scientific support; it is not used as a measured Vombatus speed.',None,'evidence_caution')],
 'kiwi': [('https://pmc.ncbi.nlm.nih.gov/articles/PMC12284840/','Survey of husbandry practices and captive environments for North Island brown kiwi','Captive adult female mean 2.5 kg; male mean 2.1 kg. This is a captive sample, not a species-wide range.',[2.1,2.5],'primary_measurement'),
  ('https://www.nzbirdsonline.org.nz/species/north-island-brown-kiwi','New Zealand Birds Online: North Island brown kiwi','Verifies common name, Apteryx mantelli, terrestrial anatomy and ecology.',None,'taxonomic_reference')],
 'seriema': [('https://www.torontozoo.com/animals/Red-legged%20Seriema','Toronto Zoo: Red-legged Seriema','Identifies Cariama cristata and reports typical adult mass 1.5–2.5 kg.',[1.5,2.5],'reported_summary')],
 'tinamou': [('https://www.zootierliste.de/en/?art=50904920&familie=20201&klasse=2&ordnung=202&subhaltungen=2','Zootierliste: Great tinamou','Zoo species directory reports 700–1240 g; a secondary summary, not an individual measurement.',[0.7,1.24],'reported_summary')],
 'lyrebird': [('https://www.adelaidezoo.com.au/animals/superb-lyrebird/','Adelaide Zoo: Superb Lyrebird','Identifies Menura novaehollandiae and lists 970 g.',0.97,'reported_summary')],
 'komodo-dragon': [('https://nationalzoo.si.edu/animals/komodo-dragon','Smithsonian National Zoo: Komodo dragon','Reports typical wild mass about 70 kg and brief running at 16–20 km/h. No speed measurement protocol is supplied.',70,'reported_summary')],
 'gila-monster': [('https://nationalzoo.si.edu/animals/gila-monster','Smithsonian National Zoo: Gila monster','Identifies Heloderma suspectum and reports top speed 2.4 km/h without measurement protocol; does not substantiate preset mass.',None,'reported_summary')],
 'bearded-dragon': [('https://reptilia.org/bearded-dragon/','Reptilia Zoo: Bearded Dragon','Identifies Pogona vitticeps and lists adult weight 280–500 g.',[0.28,0.5],'reported_summary')],
 'frilled-lizard': [('https://animaldiversity.org/accounts/Chlamydosaurus_kingii/','ADW: Frilled Lizard, physical description','Prose gives 400 g females and at least 870 g males. These are sex-specific examples, not a population mass range.',[0.4,0.87],'reported_summary')],
 'leopard-gecko': [('https://www.belfastcity.gov.uk/zoo/our-animals/reptiles/leopard-gecko','Belfast Zoo: Leopard gecko','Lists mass up to 80 g; confirms moveable eyelids and absence of adhesive toe pads.',{'max':0.08},'reported_summary')],
 'rosy-boa': [('https://reptile-database.reptarium.cz/species?genus=Lichanura&species=trivirgata','The Reptile Database: Lichanura trivirgata','Taxonomic identity; do not conflate the split species L. orcutti.',None,'taxonomic_reference'),
  ('https://ogdennaturecenter.org/meet-our-animal-ambassadors/pancake-rosy-boa','Ogden Nature Center: Rosy Boa','Lists average-weight interval 11 ounces–1.8 pounds, approximately 0.312–0.816 kg. Broad educational summary may include the historical species complex.',[0.312,0.816],'reported_summary')],
 'common-toad': [('https://www.wildlifetrusts.org/wildlife-explorer/amphibians/common-toad','The Wildlife Trusts: Common toad','Verifies Bufo bufo and terrestrial adult ecology. No quantitative mass or top land speed used.',None,'natural_history')],
 'ornate-horned-frog': [('https://seaworld.org/animals/facts/amphibians/south-american-ornate-horned-frog/','SeaWorld: South American ornate horned frog','Identifies Ceratophrys ornata and reports large females up to 480 g. Its family classification is dated; use Ceratophryidae as in ADW.',{'max':0.48},'reported_summary')],
 'golden-mantella': [('https://app-czn-prod-uks-headless.azurewebsites.net/media/zkhp0ud4/chester-zoo-annual-report-2016.pdf','Chester Zoo annual report 2016','Describes golden mantellas as less than two grams. The preset selects a rounded small adult; genus-level 56 g claims were rejected.',{'max':0.002},'reported_summary')],
 'tarantula': [('https://www.eindhovenzoo.nl/en/animals/chilean-rose-tarantula','Eindhoven Zoo: Chilean rose tarantula','Verifies Grammostola rosea and reports 55–85 g. No quantitative terrestrial top speed is provided.',[0.055,0.085],'reported_summary')],
 'silver-ant': [('https://journals.biologists.com/jeb/article/222/20/jeb198705/224418/High-speed-locomotion-in-the-Saharan-silver-ant','Pfeffer et al. (2019): High-speed locomotion in the Saharan silver ant','Video analysis of Cataglyphis bombycina measured a maximum absolute running speed of 855 mm/s (0.855 m/s). Performance depends on temperature and test conditions; no mass value is inferred.',None,'primary_measurement')],
 'cockroach': [('https://pmc.ncbi.nlm.nih.gov/articles/PMC5450327/','Adhesion and friction of the smooth attachment system of Gromphadorhina portentosa','Study describes adults around 5–10 g. It investigates attachment, not maximum terrestrial speed.',[0.005,0.01],'primary_measurement')],
 'stick-insect': [('https://pmc.ncbi.nlm.nih.gov/articles/PMC3859514/','Labonte & Federle (2013): Functionally Different Pads on the Same Foot','Experimental adult Carausius morosus, n=18, mass 0.58 g (SD 0.12 g). Preset rounded to 0.6 g.',{'mean':0.00058,'sd':0.00012},'primary_measurement')],
 'tiger-salamander': [('https://racinezoo.org/node/248','Racine Zoo: Eastern Tiger Salamander','Identifies Ambystoma tigrinum and lists 4.4 oz, approximately 0.125 kg. Preset 0.1 kg is rounded; this is a zoo summary, not a primary observation.',0.1247,'reported_summary')],
 'giant-millipede': [('https://animals.sandiegozoo.org/animals/giant-african-millipede','San Diego Zoo: Giant African Millipede','Verifies Archispirostreptus gigas and cylindrical, many-legged terrestrial anatomy.',None,'natural_history'),
  ('https://topekazoo.org/explore/animals/arthropod/','Topeka Zoo: Arthropods','Species entry lists approximately 85–115 g. Other zoo pages list larger masses; a rounded 100 g adult is selected, not a species maximum.',[0.085,0.115],'reported_summary')],
 'earthworm': [('https://pubmed.ncbi.nlm.nih.gov/10952876/','Quillin (2000): Ontogenetic scaling of burrowing forces in Lumbricus terrestris','Experimental animals span hatchlings 0.012 g to adults 8.9 g. Preset 5 g represents an adult within the experimental size span, not a population mean.',{'adultExample':0.0089},'primary_measurement')],
 'slug': [('https://onlinelibrary.wiley.com/doi/full/10.1111/ivb.12415','Nyqvist et al. (2023): Dispersal movements of terrestrial slugs','Collected Arion ater ater averaged 15.4 g (SD 3.4 g). The preset is rounded; displacement over hours is not sprint top speed.',{'mean':0.0154,'sd':0.0034},'primary_measurement')],
 'velvet-worm': [('https://pmc.ncbi.nlm.nih.gov/articles/PMC10680090/','Updated world checklist of Onychophora (2023)','Accepts Mongeperipatus solorzanoi, formerly Peripatus solorzanoi. No quantitative mass or racing performance is used from this checklist.',None,'taxonomic_reference'),
  ('https://pubmed.ncbi.nlm.nih.gov/21246983/','Morera-Brenes & Monge-Nájera (2010): A new giant species of placented worm','Original description under Peripatus solorzanoi confirms living terrestrial velvet-worm identity and morphology, not racing statistics.',None,'natural_history')],
}

# Explicit quantitative land-speed evidence. Presets may be deliberately lower.
SPEED = {
 'cassowary': ('reported_summary',13.8889,'https://perthzoo.wa.gov.au/animal/southern-cassowary','Perth Zoo: Southern Cassowary','Zoo reports up to 50 km/h; no measurement protocol. Preset 13 m/s is rounded below this claim.'),
 'emu': ('reported_summary',13.8889,'https://nationalzoo.si.edu/animals/emu','Smithsonian National Zoo: Emu','Zoo reports up to 50 km/h; no measurement protocol. Preset 13 m/s is rounded below this claim.'),
 'roadrunner': ('reported_summary',6.7056,'https://tpwd.texas.gov/publications/nonpwdpubs/introducing_birds/roadrunners/','Texas Parks and Wildlife: Roadrunners','Reports clocked running about 15 mph, without underlying protocol or sample. Preset 6.5 m/s is rounded below that figure.'),
 'komodo-dragon': ('reported_summary',[4.4444,5.5556],'https://nationalzoo.si.edu/animals/komodo-dragon','Smithsonian National Zoo: Komodo dragon','Reports brief running 16–20 km/h. Preset 4 m/s is a conservative model choice; gait multipliers still apply.'),
 'gila-monster': ('reported_summary',0.6667,'https://nationalzoo.si.edu/animals/gila-monster','Smithsonian National Zoo: Gila monster','Reports 2.4 km/h; preset 0.5 m/s is below the reported maximum.'),
 'raccoon': ('reported_summary',6.7056,'https://animaldiversity.org/accounts/Procyon_lotor/','ADW: Raccoon','Account reports 15 mph on the ground without a protocol; preset 4 m/s is conservative.'),
 'wolverine': ('conflicting_reported_summary',[4.1667,13.3333],'https://animaldiversity.org/accounts/Gulo_gulo/','ADW: Wolverine','Account describes travel not exceeding 15 km/h and attacks over 48 km/h. Contexts differ and no protocol is given. Neither is treated as an experimentally established maximum; preset 6 m/s is an estimate.'),
 'hedgehog': ('travel_speed_not_top_speed',[0.0279,0.0559],'https://animaldiversity.org/accounts/Erinaceus_europaeus/','ADW: European hedgehog','Reported average travel 110–220 yards/hour is not a maximum. The 1 m/s model sprint remains unsupported.'),
 'silver-ant': ('primary_measurement',0.855,'https://journals.biologists.com/jeb/article/222/20/jeb198705/224418/High-speed-locomotion-in-the-Saharan-silver-ant','Pfeffer et al. (2019): High-speed locomotion','Maximum measured running 855 mm/s; preset 0.8 m/s is deliberately rounded below the measured peak, not claimed as another observation.'),
}

OVERRIDES = {
 'roadrunner':{'topSpeed':6.5},'silver-ant':{'topSpeed':0.8},
 'tarantula':{'mass':0.07},'cockroach':{'mass':0.008},'slug':{'mass':0.015},
 'golden-mantella':{'mass':0.0015},'fire-salamander':{'mass':0.02},
 'stick-insect':{'mass':0.0006},
}

GROUPS = {
 'mammal':('Chordata','Mammalia','#b68657'),
 'bird':('Chordata','Aves','#648e9c'),
 'reptile':('Chordata','Reptilia','#82935e'),
 'amphibian':('Chordata','Amphibia','#c4934f'),
 'terrestrial-invertebrate':('Arthropoda','Insecta','#9a776b'),
}
INVERT = {
 'tarantula':('Arthropoda','Arachnida'),'scorpion':('Arthropoda','Arachnida'),
 'coconut-crab':('Arthropoda','Malacostraca'),'woodlouse':('Arthropoda','Malacostraca'),
 'giant-millipede':('Arthropoda','Diplopoda'),'centipede':('Arthropoda','Chilopoda'),
 'earthworm':('Annelida','Clitellata'),'slug':('Mollusca','Gastropoda'),
 'velvet-worm':('Onychophora','Udeonychophora'),
}

def model_stats(r):
    v=r['speed']; group=r['group']; gait=r['gait']
    # Launch times here precede the application's profile coefficients.
    # These are explicit model design rules, never allometric measurements.
    launch,sprint,pace,fatigue = {
      'mammal':(4,8,0.2,0.16),'bird':(4,8,0.2,0.16),
      'reptile':(3,4,0.15,0.22),'amphibian':(2,2,0.15,0.3),
      'terrestrial-invertebrate':(2,4,0.2,0.2),
    }[group]
    if r['id'] in ('cassowary','emu'):launch,sprint,pace,fatigue=5,20,0.3,0.1
    if r['id'] in ('red-panda','ring-tailed-lemur','fossa'):sprint=5
    if r['id'] in ('quokka','springhare'):sprint=6
    if r['id'] in ('pangolin','echidna','hedgehog','tenrec'):sprint=4
    if r['id'] in ('earthworm','slug','giant-millipede','woodlouse','velvet-worm'):sprint,pace,fatigue=5,0.3,0.12
    stats=dict(mass=r['mass'],topSpeed=v,acceleration=round(v/launch,6),sprint=sprint,sustainable=round(v*pace,6),fatigue=fatigue,delay=0)
    stats.update(OVERRIDES.get(r['id'],{}))
    # Recompute fields coupled to a deliberately revised speed, not to mass.
    if 'topSpeed' in OVERRIDES.get(r['id'],{}):
        stats['acceleration']=round(stats['topSpeed']/launch,6)
        stats['sustainable']=round(stats['topSpeed']*pace,6)
    return stats,dict(nominalLaunchSecondsBeforeProfile=launch,sprintReserveSeconds=sprint,sustainableFractionOfSprint=pace,fatiguePerSecondBeforeProfile=fatigue)

def main():
    cache=json.loads((ROOT/'research.json').read_text())
    animals=[]; provenance=[]; briefs={}
    for r in seeds():
        id=r['id']; stats,rules=model_stats(r); g=r['group']
        phylum,cls,color=GROUPS[g]
        if id in INVERT:phylum,cls=INVERT[id]
        refs=[]; found=cache[id]
        def ref(url,title,note,kind):
            for item in refs:
                if item['url']==url:return item['id']
            rid=f'{id}-{len(refs)+1}'
            refs.append(dict(id=rid,url=url,title=title,publisherOrType=kind,accessed=DATE,evidenceNote=note))
            return rid
        if found.get('identityPresent'):
            rid=ref(found['url'],found['title'],f"ADW {found['accountScope']} page checked for identity. Only quantitative mass data explicitly recorded below are used; classification pages supply no performance evidence.",'species_account')
        massFacts=[]
        if found.get('reportedMass'):
            # Retain adult range in preference to contradictory secondary means.
            chosen=found['reportedMass'][0]
            if id!='tiger-salamander':
                massFacts.append(dict(kind='reported_summary',valueKg=chosen['kg'],scope=chosen['kind'],sourceId=rid,note='Secondary species-account summary; not an individual weighed for this simulator.'))
        for url,title,note,mass,kind in SUPPLEMENT.get(id,[]):
            sid=ref(url,title,note,kind)
            if mass is not None:massFacts.append(dict(kind=kind,valueKg=mass,scope='see_source_note',sourceId=sid,note=note))
        speedFacts=[]
        if id in SPEED:
            kind,value,url,title,note=SPEED[id];sid=ref(url,title,note,kind)
            speedFacts.append(dict(kind=kind,valueMps=value,sourceId=sid,note=note))
        assert refs, id
        notes=[]
        if id=='tiger-salamander':notes.append('ADW/AnAge mean 9.402 g was not adopted as a representative adult mass; the rounded adult preset instead uses the separately cited Racine Zoo account. Other tiger-salamander species are excluded.')
        if id=='armadillo':notes.append('Historical ADW account predates recent Dasypus splits. Competitor means D. novemcinctus sensu stricto; no additional member of that complex is included. Adult mass is a broad historical summary.')
        if id=='red-panda':notes.append('Use Ailurus fulgens; do not add A. styani as a cosmetic variant. Historical account mass is broader than some modern species limits.')
        if id=='rosy-boa':notes.append('Mass reference may use the older rosy-boa complex. L. orcutti is excluded from the selection; the mass preset is approximate.')
        if id=='wombat':notes.append('Do not use the unsupported 40 km/h popular claim as a measurement for this species.')
        if id=='velvet-worm':notes.append('Current combination Mongeperipatus solorzanoi replaces Peripatus solorzanoi; generic English name is descriptive, not a second taxon.')
        if id in ('coconut-crab','woodlouse'):notes.append('Adult is terrestrial. Coconut-crab marine larvae and woodlouse brood-pouch stages are outside the race model.')
        if g=='amphibian':notes.append('Terrestrial adult only; excludes aquatic larvae. Hopping is represented by a continuous effective land-speed curve, not individual ballistic jumps.')
        if id in ('rosy-boa','earthworm','slug','velvet-worm'):notes.append('Crawl is the nearest existing software profile. Its coefficients do not model limbless peristalsis, muscular waves or lobopod mechanics.')
        massKind='rounded_preset_from_reported_mass' if massFacts else 'model_estimate'
        speedKind='rounded_model_preset_informed_by_evidence' if speedFacts else 'model_estimate'
        fields={
          'mass':dict(value=stats['mass'],unit='kg',status=massKind,evidence=massFacts,note='Editable representative adult preset, not a measured individual or species-wide mean.' if massFacts else 'No defensible quantitative adult mass found in consulted references; approximate adult-size model value.'),
          'topSpeed':dict(value=stats['topSpeed'],unit='m/s',status=speedKind,evidence=speedFacts,note='All presets remain simulation choices; evidence has its own status and value.' if speedFacts else 'No reliable measured maximum located in consulted species references. Conservative straight-land-race estimate; not a literature record.'),
        }
        for key,unit in [('acceleration','m/s^2'),('sprint','s'),('sustainable','m/s'),('fatigue','1/s'),('delay','s')]:
            fields[key]=dict(value=stats[key],unit=unit,status='model_estimate',evidence=[],note={
             'acceleration':'Nominal constant launch chosen by locomotor group; effective acceleration also receives existing gait launch multiplier. Not inferred from mass.',
             'sprint':'Seconds AFTER reaching topSpeed, matching application semantics. Conservative invented reserve; not measured time to exhaustion.',
             'sustainable':'Low positive mathematical tail for race comparison. Not evidence that an animal can maintain this pace for hours or days.',
             'fatigue':'Invented exponential relaxation rate toward sustainable; existing gait fatigue multiplier applies. Not a physiological fatigue assay.',
             'delay':'Zero is a deterministic standing-start convention, not a measured reaction time.'}[key])
        animal=dict(id=id,name=r['name'],scientific=r['scientific'],emoji='',color=color,category='Heavyweights' if stats['mass']>=100 else 'Distance stars' if id in ('cassowary','emu') else 'Sprinters' if stats['topSpeed']>=6 else 'Wildcards',locomotion=r['gait'],description=f"{r['name']}: a new contender for the straight land track.",biology=r['brief']+' Racing attributes are rounded model presets with separate evidence notes.',source='adw',stats=stats,
          biologicalGroup=g,taxonomy=dict(kingdom='Animalia',phylum=phylum,**{'class':cls},order=r['order'],family=r['family'],genus=r['scientific'].split()[0],rank='species',living=True),lifeStage='adult',raceMedium='land',provenanceId=id,artwork=f'../assets/animals/originals/{id}.png')
        if id=='velvet-worm':animal['name']="Solórzano's velvet worm";animal['taxonomy']['order']=None
        animals.append(animal);briefs[id]=r['brief']
        provenance.append(dict(speciesId=id,scientific=r['scientific'],commonName=animal['name'],identity=dict(status='verified_in_consulted_references',sourceIds=[x['id'] for x in refs],note='Current name checked against species accounts or specialist taxonomic references; see exceptions below.'),references=refs,fields=fields,modelRules=rules,assumptions=notes))
    original=json.loads((ROOT.parent/'assets/animals/art-direction.json').read_text())
    base='156fc5847dca42bc361c9e763d36e5b2eaf936beabfe405e4631bc8d73a17279' # Historical preparation baseline, before integration.
    write('species.json',animals)
    write('sources.json',dict(schemaVersion=1,accessed=DATE,units=dict(mass='kg',topSpeed='m/s',acceleration='m/s^2',sprint='s after reaching topSpeed',sustainable='m/s',fatigue='1/s',delay='s'),methodology='Every stats value is an editable simulation preset. Evidence values are separate. primary_measurement identifies a study observation; reported_summary identifies a secondary account/zoo statement without a reviewed measurement protocol; model_estimate has no quantitative empirical support in the consulted sources. Searches were scoped, not exhaustive literature reviews. No flight, swim, or isolated jump-takeoff speed is used. Mass never determines acceleration.',baseline=dict(rosterFile='src/data/animals.ts',sha256=base,existingCount=36,newCount=64,eventualCount=100),species=provenance))
    write('art-direction.json',dict(schemaVersion=1,created=DATE,generator='Built-in image generation',styleReference='../assets/animals/originals/cheetah.png',styleReferenceSha256=hashlib.sha256((ROOT.parent/'assets/animals/originals/cheetah.png').read_bytes()).hexdigest(),style=original['style'],generationNotes='Generated individually with the original cheetah attached as style reference. Prompts requested central 70–80% framing, transparent background and species-specific anatomy. Generated originals are retained unchanged; actual framing and alpha exceptions are documented in review/image-checks.json. Generative illustrations are not scientific reference plates.',species=briefs))
    print(f'Compiled {len(animals)} species; {sum(bool(x["fields"]["mass"]["evidence"]) for x in provenance)} have quantitative mass evidence; {sum(bool(x["fields"]["topSpeed"]["evidence"]) for x in provenance)} have quantitative speed context.')

if __name__=='__main__':main()
