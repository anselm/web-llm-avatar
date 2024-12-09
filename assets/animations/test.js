function extractTokens(str) {
    // Regular expression to match tokens within brackets
    const regex = /\[(\w+)\]/g;
    let tokens = [];
    let resultString = str.replace(regex, (match, token) => {
        tokens.push(token);
        return '';
    });

    // Clean up extra spaces resulting from token removal
    resultString = resultString.replace(/\s+/g, ' ').trim();

    return {
        resultString,
        tokens
    };
}

function extract_tokens(str="") {
	const regex = /\[(\w+)\]/g
	let tokens = []
	let resultString = str.replace(regex, (match, token) => { tokens.push(token); return '' })
	resultString = resultString.replace(/\s+/g, ' ').trim();
	return { resultString, tokens }
}


const inputStr = "mary ran [run] across the field and tom laughed [laugh] at this situation.";

const { results, tokens } = extract_tokens(inputStr)

console.log(results); // "mary ran across the field and tom laughed at this situation"
console.log(tokens); // ["run", "laugh"]

