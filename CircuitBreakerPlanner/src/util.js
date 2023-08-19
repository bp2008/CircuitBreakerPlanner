export function debounce(fn, delay)
{
	var timeout = null;
	return function ()
	{
		clearTimeout(timeout);
		timeout = setTimeout(fn, delay);
	};
}
export function throttle(fn, delay)
{
	var interval;
	var queued;
	return function ()
	{
		if (!interval)
		{
			fn.apply(this, arguments);
			interval = setInterval(function ()
			{
				if (queued)
				{
					fn.apply(this, queued.args);
					queued = null;
				}
				else
				{
					clearInterval(interval);
					interval = null;
				}
			}, delay);
		}
		else
			queued = { args: arguments };
	};
}