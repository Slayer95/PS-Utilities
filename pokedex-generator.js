/**
 * Pokédex Generator
 * 
 * Processes a CSV file containing the differences introduced by a Pokémon Showdown mod,
 * and converts it to a PS-readable JavaScript Pokédex file.
 *
 * How to use:
 * node pokedex-generator.js
 * 
 * It accepts some arguments, in the form:
 * node pokedex-generator.js <input filename> <output filename> <--option>
 * 
 * Currently, the only supported options is "new", which removes the "inherit" flag from dex entries.
 * 
 * Examples:
 * 	node pokedex-generator.js --new
 *	node pokedex-generator.js mydatabase.csv pokedex.js
 *	node pokedex-generator.js mydatabase.csv pokedex.js --new
 * 
 * The default filenames are:
 * 	input: pokedex.csv
 * 	output: pokedex.js.out
 * 
 */

var Pokedex, Aliases, argv, inputFileName, outputFileName, isNewEntries, contents, lines, indexMap, speciesIndex, line, validProperties;
var fs = require('fs');
var colorCyan = '\x1B[36m';
var colorRed = '\x1B[31m';
var colorMagenta = '\x1B[35m';
var colorEnd = '\x1B[39m';

var capitalizeAll = (function () {
	var re = /([\ \-]+)(.)/g;
	var capitalize = function (word) {
		return word.charAt(0).toUpperCase() + word.slice(1);
	};
	var capitalize$2 = function (match, p1, p2) {
		return p1 + p2.toUpperCase();
	};
	return function (text) {
		return capitalize(text).replace(re, capitalize$2);
	};
})();

function toName (text) {
	if (text && text.id) text = text.id;
	if (typeof text !== 'string' && typeof text !== 'number') return '';
	return capitalizeAll(('' + text).toLowerCase().trim().replace(/[^a-z0-9\ \-\']+/g, ''));
}

function toId (text) {
	if (text && text.id) text = text.id;
	if (typeof text !== 'string' && typeof text !== 'number') return '';
	return ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function buildDexEntry (line) {
	var entry = Object.create(null);
	if (!isNewEntries) entry.inherit = true;
	for (var key in indexMap) {
		if (key === 'species' && !isNewEntries) continue;
		if (!line[indexMap[key]]) continue;
		entry[validProperties[key].name] = validProperties[key].validate(line[indexMap[key]]);
	}
	return entry;
}

function parseAlias (alias) {
	return Aliases[toId(alias)] || alias;
}

function toShowdownStyle (text) {
	text = text.replace(/[\r\n]+/g, '\r\n'); // CRLF
	text = text.replace(/\r\n\t\t\t/g, ' '); // don't indent so deep
	text = text.replace(/\r\n\t\t\}/g, '}').replace(/\{\ /g, '{'); // fix what second replace broke
	text = text.replace(/\r\n\t\t\]/g, ']').replace(/\[\ /g, '['); // fix what second replace broke
	return text;
}

/**
 *
 * Modified function to parse a CSV string
 *
 * Original function by ridgerunner
 * http://stackoverflow.com/questions/8493195/how-can-i-parse-a-csv-string-with-javascript
 *
 */

function CSVtoArray(text, index) {
	var re_valid = /^\s*(?:"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,"\s\\]*(?:\s+[^,"\s\\]+)*)\s*(?:,\s*(?:"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,"\s\\]*(?:\s+[^,"\s\\]+)*)\s*)*$/;
	var re_value = /(?!\s*$)\s*(?:"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,"\s\\]*(?:\s+[^,"\s\\]+)*))\s*(?:,|$)/g;

	if (!re_valid.test(text)) {
		console.log(
			"" + colorRed + "Error  " + colorCyan + "File '" + colorMagenta + inputFileName + colorCyan + "' does not contain valid CSV data:\n" +
			colorRed + "L" + (index + 1) + "  " + colorMagenta + text + colorEnd
		);
		process.exit(1);
	}
	var a = []; // Initialize array to receive values.
	text.replace(re_value, // "Walk" the string using replace with callback.
		function (m0, m1, m2) {
			// Remove backslash from \" in double quoted values.
			if (m1 !== undefined) a.push(m1.replace(/\\"/g, '"'));
			else if (m2 !== undefined) a.push(m2);
			return ''; // Return empty string.
		});
	// Handle special case of empty last value.
	if (/,\s*$/.test(text)) a.push('');
	return a;
}

Pokedex = Object.create(null);
indexMap = Object.create(null);

validProperties = {
	'num': {
		name: 'num',
		validate: function (val) {return parseInt(val, 10)}
	},
	'species': {
		name: 'species',
		validate: function (val) {return toName(parseAlias(val)).replace(/\s/g, '-')}
	},
	'basespecies': {
		name: 'baseSpecies',
		validate: function (val) {return toName(parseAlias(val).replace(/[\s\-]/g, ''))}
	},
	'forme': {
		name: 'forme',
		validate: function (val) {return toName(val).replace(/\s/g, '-')}
	},
	'formeletter': {
		name: 'formeLetter',
		validate: function (val) {return val.trim().charAt(0).toUpperCase()}
	},
	'types': {
		name: 'types',
		validate: function (val) {return val.split('/').map(toId).map(capitalizeAll)}
	},
	'gender': {
		name: 'gender',
		validate: function (val) {return val.trim().charAt(0).toUpperCase()}
	},
	'genderratio': {
		name: 'genderRatio',
		validate: function (val) {
			var ratio = val.replace(/\,/g, '.').split('/');
			return {
				'M': Number(ratio[0]),
				'F': Number(ratio[1])
			};
		}
	},
	'basestats': {
		name: 'baseStats',
		validate: function (val) {
			var stats = val.split('/');
			return {
				'hp': parseInt(stats[0], 10),
				'atk': parseInt(stats[1], 10),
				'def': parseInt(stats[2], 10),
				'spa': parseInt(stats[3], 10),
				'spd': parseInt(stats[4], 10),
				'spe': parseInt(stats[5], 10)
			};
		}
	},
	'abilities': {
		name: 'abilities',
		validate: function (val) {
			var abilities = val.replace(/\-/g, '\s').split('/').map(toName);
			var output = {'0': abilities[0]};
			if (abilities[1]) output['1'] = abilities[1];
			if (abilities[2]) output['H'] = abilities[2];
			return output;
		}
	},
	'heightm': {
		name: 'heightm',
		validate: function (val) {return Number(val.replace(/\,/g, '.'))}
	},
	'weightkg': {
		name: 'weightkg',
		validate: function (val) {return Number(val.replace(/\,/g, '.'))}
	},
	'color': {
		name: 'color',
		validate: function (val) {return toId(val)}
	},
	'prevo': {
		name: 'prevo',
		validate: function (val) {return toId(val)}
	},
	'evolevel': {
		name: 'evoLevel',
		validate: function (val) {return parseInt(val, 10)}
	},
	'egggroups': {
		name: 'eggGroups',
		validate: function (val) {return val.split('/').map(toName)}
	},
	'otherformes': {
		name: 'otherFormes',
		validate: function (val) {return val.split('/').map(toId)}
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
};

argv = process.argv.slice(2).filter(function (option) {
	if (option[0] === '-' && option[1] === '-') {
		if (toId(option.slice(2)) === 'new') isNewEntries = true;
		return false;
	}
	return true;
});
inputFileName = argv[0] || 'pokedex.csv';
outputFileName = argv[1] || 'pokedex.js.out';

try {
	contents = '' + fs.readFileSync(inputFileName);
} catch (err) {
	console.log("" + colorRed + "Error  " + colorCyan + "File " + colorMagenta + "'" + inputFileName + colorCyan + "' was not found or could not be read." + colorEnd);
	process.exit(-1);
}

lines = contents.split(/[\r\n]/).filter(function (line) {return line}).map(CSVtoArray);
lines.shift().map(toId).forEach(function (value, index) {
	if (!validProperties.hasOwnProperty(value)) {
		console.log(
			"" + colorRed + "Warn   " + colorCyan + "'" + colorMagenta + value + colorCyan + "'" + " header is invalid.\n" +
			"Use one of the following:\n" + colorMagenta + Object.keys(validProperties).join(colorCyan + ", " + colorMagenta) + colorCyan + "." + colorEnd
		);
		return;
	}
	if (value in indexMap) {
		console.log("" + colorRed + "Error  " + colorCyan + "More than one column has the header '" + colorMagenta + value + colorCyan + "'." + colorEnd);
		process.exit(1);
	}
	indexMap[value] = index;
});

speciesIndex = indexMap['species'];

if (typeof speciesIndex === 'undefined') {
	console.log("" + colorRed + "Error  " + colorCyan + "'" + colorMagenta + "Species" + colorCyan + "' header not found in file: '" + colorMagenta + inputFileName + colorCyan + "'." + colorEnd);
	process.exit(1);
}

for (var i = 0, len = lines.length; i < len; i++) {
	line = lines[i];
	Pokedex[toId(parseAlias(line[speciesIndex]))] = buildDexEntry(lines[i]);
}

try {
	fs.writeFileSync('./' + outputFileName , toShowdownStyle('exports.BattlePokedex = ' + JSON.stringify(Pokedex, null, '\t') + ';\r\n'));
} catch (err) {
	console.log("" + colorRed + "Error " + colorCyan + " It was not possible to write output to file: '" + colorMagenta + outputFileName + colorCyan + "'." + colorEnd);
	process.exit(1);
}

console.log("" + colorCyan + "File '" + colorMagenta + outputFileName + colorCyan + "' successfully written." + colorEnd);
