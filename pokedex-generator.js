/**
 * Processes a CSV file named 'pokedex.csv' containing the differences
 * introduced by a Pokémon-Showdown mod and converts it to a PS-readable JavaScript file.
 *
 * It may accept an alternative path, if specified as a parameter when ran using Node.js
 *
 */

var Pokedex, Aliases, filename, contents, lines, indexMap, speciesIndex, line, validProperties;
var fs = require('fs');

function string (str) {
	if (typeof str === 'string' || typeof str === 'number') return '' + str;
	return '';
}

function toId (text) {
	if (text && text.id) text = text.id;
	else if (text && text.userid) text = text.userid;

	return string(text).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function capitalizeFirst (text) {
	if (!text.length) return '';
	return text[0].toUpperCase() + text.slice(1);
}

function splitComma (text) {
	return text.split(',');
}

function buildDexEntry (line) {
	var entry = Object.create(null);
	entry.inherit = true;
	for (var key in indexMap) {
		if (key === 'species') continue;
		entry[validProperties[key].name] = validProperties[key].validate(line[indexMap[key]]);
	}
	return entry;
}

function parseAlias (alias) {
	return Aliases[toId(alias)] || alias;
}

Pokedex = Object.create(null);
indexMap = Object.create(null);

validProperties = {
	'num': {
		name: 'num',
		validate: function (val) {return Number(val)},
	},
	'species': {
		name: 'species',
		validate: function (val) {return capitalizeFirst(toId(parseAlias(val)))},
	},
	'types': {
		name: 'types',
		validate: function (val) {return val.split('/').map(toId).map(capitalizeFirst)},
	},
	'genderratio': {
		name: 'genderRatio',
		validate: function (val) {return Number(val)},
	},
	'basestats': {
		name: 'baseStats',
		validate: function (val) {
			var stats = val.split('/');
			return {
				'hp': Number(stats[0]),
				'atk': Number(stats[1]),
				'def': Number(stats[2]),
				'spa': Number(stats[3]),
				'spd': Number(stats[4]),
				'spe': Number(stats[5])
			};
		}
	},
	'abilities': {
		name: 'abilities',
		validate: function (val) {
			var abilities = val.split('/').map(toId);
			var output = {'0': capitalizeFirst(abilities[0])};
			if (abilities[1]) output['1'] = capitalizeFirst(abilities[1]);
			if (abilities[2]) output['H'] = capitalizeFirst(abilities[2]);
			return output;
		}
	},
	'heightm': {
		name: 'heightm',
		validate: function (val) {return Number(val)}
	},
	'weightkg': {
		name: 'weightkg',
		validate: function (val) {return Number(val)}
	},
	'color': {
		name: 'color',
		validate: function (val) {return val}
	},
	'prevo': {
		name: 'prevo',
		validate: function (val) {return val}
	},
	'evolevel': {
		name: 'evoLevel',
		validate: function (val) {return Number(val)}
	},
	'egggroups': {
		name: 'eggGroups',
		validate: function (val) {return val.split(',').map(toId).map(capitalizeFirst)}
	},
	'otherformes': {
		name: 'otherFormes',
		validate: function (val) {return val.split(',').map(toId).map(capitalizeFirst)}
	}
};

Aliases = {
	// mega evos
	"megaabomasnow": "Abomasnow-Mega",
	"megaabsol": "Absol-Mega",
	"megaaerodactyl": "Aerodactyl-Mega",
	"megaaggron": "Aggron-Mega",
	"megaalakazam": "Alakazam-Mega",
	"megaampharos": "Ampharos-Mega",
	"megabanette": "Banette-Mega",
	"megablastoise": "Blastoise-Mega",
	"megablaziken": "Blaziken-Mega",
	"megacharizard": "Charizard-Mega-Y",
	"megacharizardx": "Charizard-Mega-X",
	"megacharizardy": "Charizard-Mega-Y",
	"megagarchomp": "Garchomp-Mega",
	"megagardevoir": "Gardevoir-Mega",
	"megagengar": "Gengar-Mega",
	"megagyarados": "Gyarados-Mega",
	"megaheracross": "Heracross-Mega",
	"megahoundoom": "Houndoom-Mega",
	"megakangaskhan": "Kangaskhan-Mega",
	"megalatias": "Latias-Mega",
	"megalatios": "Latios-Mega",
	"megalucario": "Lucario-Mega",
	"megaluke": "Lucario-Mega",
	"megamanectric": "Manectric-Mega",
	"megamawile": "Mawile-Mega",
	"megamaw": "Mawile-Mega",
	"megamedicham": "Medicham-Mega",
	"megamedi": "Medicham-Mega",
	"megamewtwo": "Mewtwo-Mega-Y",
	"megamewtwox": "Mewtwo-Mega-X",
	"megamewtwoy": "Mewtwo-Mega-Y",
	"megapinsir": "Pinsir-Mega",
	"megascizor": "Scizor-Mega",
	"megatyranitar": "Tyranitar-Mega",
	"megattar": "Tyranitar-Mega",
	"megavenusaur": "Venusaur-Mega",
	"megavenu": "Venusaur-Mega",
	"mmx": "Mewtwo-Mega-X",
	"mmy": "Mewtwo-Mega-Y",

	// formes
	"bugceus": "Arceus-Bug",
	"darkceus": "Arceus-Dark",
	"dragonceus": "Arceus-Dragon",
	"eleceus": "Arceus-Electric",
	"fairyceus": "Arceus-Fairy",
	"fightceus": "Arceus-Fighting",
	"fireceus": "Arceus-Fire",
	"flyceus": "Arceus-Flying",
	"ghostceus": "Arceus-Ghost",
	"grassceus": "Arceus-Grass",
	"groundceus": "Arceus-Ground",
	"iceceus": "Arceus-Ice",
	"poisonceus": "Arceus-Poison",
	"psyceus": "Arceus-Psychic",
	"rockceus": "Arceus-Rock",
	"steelceus": "Arceus-Steel",
	"waterceus": "Arceus-Water",
	"basculinb": "Basculin-Blue-Striped",
	"basculinblue": "Basculin-Blue-Striped",
	"basculinbluestripe": "Basculin-Blue-Striped",
	"castformh": "Castform-Snowy",
	"castformice": "Castform-Snowy",
	"castformr": "Castform-Rainy",
	"castformwater": "Castform-Rainy",
	"castforms": "Castform-Sunny",
	"castformfire": "Castform-Sunny",
	"cherrims": "Cherrim-Sunshine",
	"cherrimsunny": "Cherrim-Sunshine",
	"cofag": "Cofagrigus",
	"darmanitanz": "Darmanitan-Zen",
	"darmanitanzenmode": "Darmanitan-Zen",
	"deoxysnormal": "Deoxys",
	"deon": "Deoxys",
	"deoxysa": "Deoxys-Attack",
	"deoa": "Deoxys-Attack",
	"deoxysd": "Deoxys-Defense",
	"deoxysdefence": "Deoxys-Defense",
	"deod": "Deoxys-Defense",
	"deoxyss": "Deoxys-Speed",
	"deos": "Deoxys-Speed",
	"ekiller": "Arceus",
	"esca": "Escavalier",
	"giratinao": "Giratina-Origin",
	"gourgeisthuge": "Gourgeist-Super",
	"keldeor": "Keldeo-Resolute",
	"keldeoresolution": "Keldeo-Resolute",
	"kyuremb": "Kyurem-Black",
	"kyuremw": "Kyurem-White",
	"landorust": "Landorus-Therian",
	"meloettap": "Meloetta-Pirouette",
	"meloettas": "Meloetta-Pirouette",
	"pumpkaboohuge": "Pumpkaboo-Super",
	"rotomc": "Rotom-Mow",
	"rotomf": "Rotom-Frost",
	"rotomh": "Rotom-Heat",
	"rotoms": "Rotom-Fan",
	"rotomw": "Rotom-Wash",
	"shaymins": "Shaymin-Sky",
	"skymin": "Shaymin-Sky",
	"thundurust": "Thundurus-Therian",
	"tornadust": "Tornadus-Therian",
	"wormadamg": "Wormadam-Sandy",
	"wormadamground": "Wormadam-Sandy",
	"wormadams": "Wormadam-Trash",
	"wormadamsteel": "Wormadam-Trash",
	"floettee": "Floette-Eternal-Flower",

	// base formes
	"nidoranfemale": "Nidoran-F",
	"nidoranmale": "Nidoran-M",
	"giratinaa": "Giratina",
	"giratinaaltered": "Giratina",
	"cherrimo": "Cherrim",
	"cherrimovercast": "Cherrim",
	"meloettaa": "Meloetta",
	"meloettaaria": "Meloetta",
	"basculinr": "Basculin",
	"basculinred": "Basculin",
	"basculinredstripe": "Basculin",
	"basculinredstriped": "Basculin",
	"tornadusi": "Tornadus",
	"tornadusincarnation": "Tornadus",
	"thundurusi": "Thundurus",
	"thundurusincarnation": "Thundurus",
	"landorusi": "Landorus",
	"landorusincarnation": "Landorus",
	"pumpkabooaverage": "Pumpkaboo",
	"gourgeistaverage": "Gourgeist",

	// cosmetic formes
	"gastrodone": "Gastrodon",
	"gastrodoneast": "Gastrodon",
	"gastrodonw": "Gastrodon",
	"gastrodonwest": "Gastrodon",

	// items
	"band": "Choice Band",
	"cb": "Choice Band",
	"chesto": "Chesto Berry",
	"chople": "Chople Berry",
	"custap": "Custap Berry",
	"fightgem": "Fighting Gem",
	"flightgem": "Flying Gem",
	"lefties": "Leftovers",
	"lo": "Life Orb",
	"lum": "Lum Berry",
	"occa": "Occa Berry",
	"salac": "Salac Berry",
	"scarf": "Choice Scarf",
	"specs": "Choice Specs",
	"yache": "Yache Berry",
	"av": "Assault Vest",
	"assvest": "Assault Vest",

	// gen 1-2 berries
	"berry": "Oran Berry",
	"bitterberry": "Persim Berry",
	"burntberry": "Rawst Berry",
	"goldberry": "Sitrus Berry",
	"iceberry": "Aspear Berry",
	"mintberry": "Chesto Berry",
	"miracleberry": "Lum Berry",
	"mysteryberry": "Leppa Berry",
	"przcureberry": "Cheri Berry",
	"psncureberry": "Pecha Berry",

	// pokemon
	"aboma": "Abomasnow",
	"chomp": "Garchomp",
	"dnite": "Dragonite",
	"don": "Groudon",
	"dogars": "Koffing",
	"ferro": "Ferrothorn",
	"forry": "Forretress",
	"gar": "Gengar",
	"garde": "Gardevoir",
	"hippo": "Hippowdon",
	"kyub": "Kyurem-Black",
	"kyuw": "Kyurem-White",
	"lando": "Landorus",
	"landoi": "Landorus",
	"landot": "Landorus-Therian",
	"luke":  "Lucario",
	"mence": "Salamence",
	"ogre": "Kyogre",
	"p2": "Porygon2",
	"pory2": "Porygon2",
	"pz": "Porygon-Z",
	"poryz": "Porygon-Z",
	"rank": "Reuniclus",
	"smogon": "Koffing",
	"talon": "Talonflame",
	"terra": "Terrakion",
	"ttar": "Tyranitar",
	"zam": "Alakazam",

	// moves
	"bpass": "Baton Pass",
	"cc": "Close Combat",
	"cm": "Calm Mind",
	"dd": "Dragon Dance",
	"eq": "Earthquake",
	"espeed": "ExtremeSpeed",
	"faintattack": "Feint Attack",
	"hjk": "High Jump Kick",
	"hijumpkick": "High Jump Kick",
	"np": "Nasty Plot",
	"pup": "Power-up Punch",
	"qd": "Quiver Dance",
	"rocks": "Stealth Rock",
	"sd": "Swords Dance",
	"se": "Stone Edge",
	"spin": "Rapid Spin",
	"sr": "Stealth Rock",
	"sub": "Substitute",
	"tr": "Trick Room",
	"troom": "Trick Room",
	"tbolt": "Thunderbolt",
	"tspikes": "Toxic Spikes",
	"twave": "Thunder Wave",
	"web": "Sticky Web",
	"wow": "Will-O-Wisp",
	"playaround": "Play Rough",
	"glowpunch": "Power-up Punch",

	// Japanese names
	"birijion": "Virizion",
	"terakion": "Terrakion",
	"agirudaa": "Accelgor",
	"randorosu": "Landorus",
	"urugamosu": "Volcarona",
	"erufuun": "Whimsicott",
	"doryuuzu": "Excadrill",
	"burungeru": "Jellicent",
	"nattorei": "Ferrothorn",
	"shandera": "Chandelure",
	"roobushin": "Conkeldurr",
	"ononokusu": "Haxorus",
	"sazandora": "Hydreigon",
	"chirachiino": "Cinccino",
	"kyuremu": "Kyurem",
	"jarooda": "Serperior",
	"zoroaaku": "Zoroark",
	"shinboraa": "Sigilyph",
	"barujiina": "Mandibuzz",
	"rankurusu": "Reuniclus",
	"borutorosu": "Thundurus"
	// there's no need to type out the other Japanese names
	// I'll autogenerate them at some point
};

filename = process.argv[2] || 'pokedex.csv';
try {
	contents = ''+fs.readFileSync(filename);
} catch (err) {
	console.log("Error: File '" + filename + "' was not found or could not be read.");
	process.exit(-1);
}
lines = contents.split(/[\r\n]/).filter(function (line) {return line}).map(splitComma);
lines.shift().map(toId).forEach(function (value, index) {
	if (!validProperties.hasOwnProperty(value)) {
		console.log("Header '" + value + "' is invalid. Use one of the following: " + Object.keys(validProperties).join(', '));
		return;
	}
	indexMap[value] = index;
});

speciesIndex = indexMap['species'];

if (typeof speciesIndex === 'undefined') {
	console.log("Error: 'Species' header not found in file: '" + filename + "'.");
	process.exit(-1);
}

for (var i = 0, len = lines.length; i < len; i++) {
	line = lines[i];
	Pokedex[toId(parseAlias(line[speciesIndex]))] = buildDexEntry(lines[i]);
}

try {
	fs.writeFileSync('./pokedex.js.out', 'exports.BattlePokedex = ' + JSON.stringify(Pokedex, null, '\t').replace(/[\r\n]/g, '\r\n') + ';\r\n');
} catch (err) {
	console.log("Error while trying to write output to file: 'pokedex.js.out'.");
	process.exit(-1);
}

console.log("File 'pokedex.js.out' successfully written.");
