'use strict';

import IRichLanguageConfiguration = monaco.languages.LanguageConfiguration;
import ILanguage = monaco.languages.IMonarchLanguage;

export const conf: IRichLanguageConfiguration = {
	// the default separators except `@$`
	wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
	// Not possible to make comments in PromQL syntax
	comments: {},
	brackets: [
		['{', '}'],
		['[', ']'],
		['(', ')'],
	],
	autoClosingPairs: [
		{open: '{', close: '}'},
		{open: '[', close: ']'},
		{open: '(', close: ')'},
		{open: '"', close: '"'},
		{open: '\'', close: '\''},
	],
	surroundingPairs: [
		{open: '{', close: '}'},
		{open: '[', close: ']'},
		{open: '(', close: ')'},
		{open: '"', close: '"'},
		{open: '\'', close: '\''},
		{open: '<', close: '>'},
	],
	folding: {}
};

// PromQL Aggregation Operators
// (https://prometheus.io/docs/prometheus/latest/querying/operators/#aggregation-operators)
const aggregations = [
	'sum',
	'min',
	'max',
	'avg',
	'stddev',
	'stdvar',
	'count',
	'count_values',
	'bottomk',
	'topk',
	'quantile',
];

// PromQL functions
// (https://prometheus.io/docs/prometheus/latest/querying/functions/)
const functions = [
	'abs',
	'absent',
	'ceil',
	'changes',
	'clamp_max',
	'clamp_min',
	'day_of_month',
	'day_of_week',
	'days_in_month',
	'delta',
	'deriv',
	'exp',
	'floor',
	'histogram_quantile',
	'holt_winters',
	'hour',
	'idelta',
	'increase',
	'irate',
	'label_join',
	'label_replace',
	'ln',
	'log2',
	'log10',
	'minute',
	'month',
	'predict_linear',
	'rate',
	'resets',
	'round',
	'scalar',
	'sort',
	'sort_desc',
	'sqrt',
	'time',
	'timestamp',
	'vector',
	'year',
];

// PromQL specific functions: Aggregations over time
// (https://prometheus.io/docs/prometheus/latest/querying/functions/#aggregation_over_time)
const aggregationsOverTime = [];
for (const agg of aggregations) {
	aggregationsOverTime.push(agg + '_over_time');
}
// PromQL vector matching + the by and without clauses
// (https://prometheus.io/docs/prometheus/latest/querying/operators/#vector-matching)
const vectorMatching = [
	'on',
	'ignoring',
	'group_right',
	'group_left',
	'by',
	'without',
];
// Produce a regex matching element : (elt1|elt2|...)
const vectorMatchingRegex = `(${vectorMatching.reduce((prev, curr) => prev = `${prev}|${curr}`)})`

// PromQL Operators
// (https://prometheus.io/docs/prometheus/latest/querying/operators/)
const operators = [
	'+', '-', '*', '/', '%', '^',
	'==', '!=', '>', '<', '>=', '<=',
	'and', 'or', 'unless',
];

export const language = <ILanguage>{
	ignoreCase: false,
	defaultToken: '',
	tokenPostfix: '.promql',

	// Merging all the keywords in one list, adding the 'by' and 'without' clauses.
	keywords: aggregations.concat(functions).concat(aggregationsOverTime).concat(vectorMatching),

	operators: operators,
	vectorMatching: vectorMatchingRegex,

	// we include these common regular expressions
	symbols: /[=><!~?:&|+\-*\/\^%]+/,
	escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
	digits: /\d+(_+\d+)*/,
	octaldigits: /[0-7]+(_+[0-7]+)*/,
	binarydigits: /[0-1]+(_+[0-1]+)*/,
	hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,
	integersuffix: /(ll|LL|u|U|l|L)?(ll|LL|u|U|l|L)?/,
	floatsuffix: /[fFlL]?/,

	// The main tokenizer for our languages
	tokenizer: {
		root: [

			// 'by', 'without' and vector matching
			[/@vectorMatching\s*(?=\()/, 'type', '@clauses'],

			// labels
			[/[a-z_]\w*(?=\s*(=|!=|=~|!~))/, 'tag'],

			// all keywords have the same color
			[/[a-zA-Z_]\w*/, {
				cases: {
					'@keywords': 'type',
					'@default': 'identifier'
				}
			}],

			// strings
			[/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
			[/'([^'\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
			[/"/, 'string', '@string_double'],
			[/'/, 'string', '@string_single'],
			[/`/, 'string', '@string_backtick'],

			// whitespace
			{include: '@whitespace'},
			
			// delimiters and operators
			[/[{}()\[\]]/, '@brackets'],
			[/[<>](?!@symbols)/, '@brackets'],
			[/@symbols/, {
				cases: {
					'@operators': 'delimiter',
					'@default': ''
				}
			}],

			// numbers
			[/\d*\d+[eE]([\-+]?\d+)?(@floatsuffix)/, 'number.float'],
			[/\d*\.\d+([eE][\-+]?\d+)?(@floatsuffix)/, 'number.float'],
			[/0[xX][0-9a-fA-F']*[0-9a-fA-F](@integersuffix)/, 'number.hex'],
			[/0[0-7']*[0-7](@integersuffix)/, 'number.octal'],
			[/0[bB][0-1']*[0-1](@integersuffix)/, 'number.binary'],
			[/\d[\d']*\d(@integersuffix)/, 'number'],
			[/\d(@integersuffix)/, 'number'],
			[/\d+[smhdwy]/, 'number']
		],

		string_double: [
			[/[^\\"]+/, 'string'],
			[/@escapes/, 'string.escape'],
			[/\\./, 'string.escape.invalid'],
			[/"/, 'string', '@pop']
		],

		string_single: [
			[/[^\\']+/, 'string'],
			[/@escapes/, 'string.escape'],
			[/\\./, 'string.escape.invalid'],
			[/'/, 'string', '@pop']
		],

		clauses: [
			[/[^\(,\)]/, 'tag'],
			[/\)/, 'identifier', '@pop']
		],

		string_backtick: [
			[/[^\\`$]+/, 'string'],
			[/@escapes/, 'string.escape'],
			[/\\./, 'string.escape.invalid'],
			[/`/, 'string', '@pop']
		],

		comment: [
			[/[^\/*]+/, 'comment'],
			[/\/\*/, 'comment', '@push'],    // nested comment
			["\\*/", 'comment', '@pop'],
			[/[\/*]/, 'comment']
		],

		whitespace: [
			[/[ \t\r\n]+/, 'white'],
			[/\/\*/, 'comment', '@comment'],
			[/\/\/.*$/, 'comment'],
		],
	},
};
