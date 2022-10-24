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
		<div class="breakerAmpDisplay">
			{{breaker.amps}}
		</div>
		<div class="breakerTextDisplay">
			{{breaker.text}}
		</div>
	</div>
</template>

<script>
	/* eslint no-mixed-spaces-and-tabs: 0, no-unused-vars: 0 */
	import EventBus from '../EventBus.js'

	export default {
		components: {},
		props: {
			breaker: {
				type: Object,
				required: true
			},
			rowNumber: {
				type: Number,
				required: true
			},
			side: {
				type: String,
				required: true
			}
		},
		data()
		{
			return {
				textInput: "",
				editing: false,
				draggingOver: false
			};
		},
		created()
		{
			this.textInput = this.breaker.text;
		},
		computed:
		{
			breakerStyle()
			{
				let fillColor = '#FFAAAA';
				let wattSustainedCapacity = 120 * 0.8 * this.breaker.amps;
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
				return this.breaker.index === EventBus.selectedBreakerIndex;
			}
		},
		methods:
		{
			getData()
			{
				return {
					breaker: this.breaker,
					rowNumber: this.rowNumber,
					side: this.side
				};
			},
			onDragStart(e)
			{
				e.dataTransfer.setData("text/plain", JSON.stringify(this.getData()));
				e.dataTransfer.dropEffect = "move";
				//console.log();
			},
			onDragEnter(e)
			{
				// Not reliable in Chrome. Gets called unnecessarily.
				e.preventDefault();
				e.dataTransfer.setData("text/plain", JSON.stringify(this.getData()));
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
					src: srcBreaker, dst: this.getData()
				});
			},
			toggleSelection()
			{
				if (EventBus.selectedBreakerIndex === this.breaker.index)
					EventBus.selectedBreakerIndex = -1;
				else
					EventBus.selectedBreakerIndex = this.breaker.index;
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
		background-color: rgba(0,0,0,0.25);
	}

	.isSelected
	{
		outline: 2px solid #0099FF;
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
		line-height: 18px;
		box-sizing: border-box;
		text-align: center;
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

