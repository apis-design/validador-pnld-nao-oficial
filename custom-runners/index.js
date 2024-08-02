'use strict';

const runner = module.exports = {};

runner.supports = '^8.0.0 || ^8.0.0-alpha || ^8.0.0-beta';

runner.scripts = [];

runner.run = (options, pa11y) => {

	const issueTypeMap = {
		1: 'error',
		2: 'warning',
		3: 'notice'
	};

	function runCode() {

		return [
			// {
			// 	code: 'WCAG2AA.Principle1.Guideline1_1.1_1_1.H30.2',
			// 	context: '<a href="https://example.com/"><img src="example.jpg" alt=""/></a>',
			// 	message: 'Img element is the only content of the link, but is missing alt text. The alt text should describe the purpose of the link.',
			// 	selector: 'html > body > p:nth-child(1) > a',
			// 	type: 'error',
			// 	typeCode: 1
			// },
		]
	}

	function processIssue(issue) {
		return {
			code: issue.code,
			message: issue.msg,
			type: issueTypeMap[issue.type] || 'unknown',
			element: issue.element
		};
	}

	// temos que enviar um array de issue, se não quebra
	const results = runCode();
	return results;

};