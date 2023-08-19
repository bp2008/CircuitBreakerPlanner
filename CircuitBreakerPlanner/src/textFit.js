let testDiv = null;

let maxTextSizePx = 24;
export function setMaxTextSizePx(px)
{
	maxTextSizePx = px;
}

let minTextSizePx = 5;
export function setMinTextSizePx(px)
{
	minTextSizePx = px;
}

let textSizeStepPx = 0.5;
export function setTextSizeStepPx(px)
{
	textSizeStepPx = px;
}

/**
 * Returns the font-size string (e.g. "16px") most appropriate for the given text box.
 * @param {String} parentSelector Selector for the parent element.
 * @param {Number} maxHeight Available height in pixels for the text to render in (do not include padding, borders, or margin).
 * @param {any} el DOM element whose width should be considered.
 * @param {String} text The text to fit into the DOM element.
 */
export function fitTextToBox(parentSelector, maxHeight, el, text)
{
	let w = el.clientWidth;
	let h = maxHeight; //el.clientHeight;
	const computedStyle = getComputedStyle(el);

	w -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);

	if (!testDiv)
	{
		testDiv = document.createElement("div")
		testDiv.style.border = "1px solid black";
		testDiv.style.textAlign = "center";
		testDiv.style.overflow = "hidden";
		testDiv.style.wordBreak = "break-word";
		testDiv.style.boxSizing = "border-box";
		testDiv.style.whiteSpace = "pre-wrap";
		testDiv.style.position = "fixed";
		testDiv.style.visibility = "hidden";
		testDiv.style.top = "0px";
		testDiv.style.right = "0px";
		document.querySelector(parentSelector).appendChild(testDiv);
	}
	testDiv.style.width = w + "px";
	testDiv.innerText = text;

	for (let i = maxTextSizePx; i >= minTextSizePx; i -= textSizeStepPx)
	{
		if (doesTextFit(i, h))
		{
			//console.log("el.innerText", el.innerText);
			//console.log(w + "x" + h, testDiv.clientHeight + " / " + h);
			return i + "px";
		}
	}
	return minTextSizePx + "px";
}

function doesTextFit(fontSizePx, heightLimit)
{
	testDiv.style.fontSize = fontSizePx + "px";
	return testDiv.clientHeight <= heightLimit;
}