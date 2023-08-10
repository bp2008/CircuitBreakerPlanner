<template>
	<div :class="{ breaker: true, draggingOver: draggingOver, isSelected: selected }"
		 :style="breakerStyle"
		 draggable="true"
		 @dragstart="onDragStart"
		 @dragenter="onDragEnter"
		 @dragleave="onDragLeave"
		 @dragover="onDragOver"
		 @drop="onDrop"
		 @click="toggleSelection"
		 tabindex="0">
		<div class="breakerAmpDisplay" v-if="showAmpsEle">
			{{breaker.amps}}
		</div>
		<div class="breakerTextDisplay" v-bind:style="textDisplayStyle" ref="breakerTextDisplay">
			{{breaker.text}}
		</div>
	</div>
</template>

<script>
	/* eslint no-mixed-spaces-and-tabs: 0, no-unused-vars: 0 */
	import store from '/src/store.js'
	import { fitTextToBox } from '/src/textFit.js';

	export default {
		components: {},
		props: {
			breaker: {
				type: Object,
				required: true
			},
			showAmps: {
				type: Boolean,
				default: true
			}
		},
		data()
		{
			return {
				editing: false,
				draggingOver: false,
				textDisplayStyle: { fontSize: "16px" }
			};
		},
		created()
		{
		},
		mounted()
		{
			this.setTextSize();
		},
		computed:
		{
			//rowNumber()
			//{
			//	return this.breaker.index % 2 == 0 ? this.breaker.index / 2 : this.breaker.index;
			//},
			//side()
			//{
			//	return this.breaker.index % 2 == 0 ? "left" : "right";
			//},
			breakerStyle()
			{
				let fillColor = '#FFAAAA';
				let wattSustainedCapacity = 120 * 0.8 * this.breaker.amps;
				if (wattSustainedCapacity <= 0)
					return "";
				let wattPercent = this.breaker.averageWatts / wattSustainedCapacity;
				if (wattPercent < 0)
					wattPercent = 0;
				else if (wattPercent > 1)
					wattPercent = 1;
				wattPercent = Math.round(wattPercent * 100);
				let style = 'background: linear-gradient(0deg, ' + fillColor + ' 0%, ' + fillColor + ' ' + wattPercent + '%, #FFFFFF ' + wattPercent + '%, #FFFFFF 100%);';
				return style;
			},
			selected()
			{
				return this.breaker.index === store.selectedBreakerIndex;
			},
			breakerText()
			{
				return this.breaker.text;
			},
			showAmpsEle()
			{
				return this.showAmps && this.breaker.amps;
			}
		},
		methods:
		{
			onDragStart(e)
			{
				e.dataTransfer.setData("text/plain", JSON.stringify(this.breaker));
				e.dataTransfer.dropEffect = "move";
				if (!this.selected)
					this.toggleSelection();
				//console.log();
			},
			onDragEnter(e)
			{
				// Not reliable in Chrome. Gets called unnecessarily.
				e.preventDefault();
				e.dataTransfer.dropEffect = "move";
				this.draggingOver = true;
			},
			onDragLeave(e)
			{
				// Not reliable in Chrome. Gets called unnecessarily.
				this.draggingOver = false;
			},
			onDragOver(e)
			{
				e.preventDefault();
				e.dataTransfer.dropEffect = "move";
				this.draggingOver = true;
			},
			onDrop(e)
			{
				e.preventDefault();
				this.draggingOver = false;
				let srcBreaker = JSON.parse(e.dataTransfer.getData("text/plain"));
				this.$emit("onMove", {
					src: srcBreaker, dst: this.breaker
				});
			},
			toggleSelection()
			{
				if (store.selectedBreakerIndex === this.breaker.index)
					store.selectedBreakerIndex = -1;
				else
					store.selectedBreakerIndex = this.breaker.index;
			},
			setTextSize()
			{
				this.$nextTick(() =>
				{
					if (this.$refs.breakerTextDisplay)
					{
						this.textDisplayStyle.fontSize = fitTextToBox("#app", 36, this.$refs.breakerTextDisplay, this.breakerText);
					}
				});
			}
		},
		watch:
		{
			breakerText()
			{
				this.setTextSize();
			},
			showAmpsEle()
			{
				this.setTextSize();
			}
		}
	};
</script>

<style scoped>
	.breaker
	{
		margin: 2px;
		border: 1px solid black;
		width: 160px;
		height: 40px;
		display: flex;
		align-items: center;
		position: relative;
		overflow: hidden;
	}

	.draggingOver
	{
		outline: 4px outset #00FF00;
		z-index: 2;
	}

	.isSelected
	{
		outline: 4px outset #0099FF;
	}

	.breakerAmpDisplay
	{
		rotate: -90deg;
		flex: 0 0 auto;
		font-weight: bold;
		font-size: 16pt;
		border: 2px solid black;
		width: 30px;
		text-align: center;
		margin: 0px 4px 0px 5px;
	}

	.breakerTextDisplay
	{
		flex: 1 1 auto;
		padding: 2px 5px;
		/*line-height: 18px;*/
		box-sizing: border-box;
		text-align: center;
		word-break: break-word;
		white-space: pre-wrap;
	}

	.editing
	{
		width: 100%;
		height: 100%;
	}

	.display
	{
		width: 100%;
		height: 100%;
		cursor: pointer;
	}

	@media print
	{
		.breaker
		{
			background: #FFFFFF !important;
			outline: none !important;
		}
	}
</style>

