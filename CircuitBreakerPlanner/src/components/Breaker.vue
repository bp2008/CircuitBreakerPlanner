<template>
	<div class="breaker" draggable="true"
		 @dragstart="onDragStart"
		 @dragover="onDragOver"
		 @drop="onDrop">
		<div v-if="editing" class="editing">
			<textarea class="breakerTextArea" v-model="breaker.text"></textarea>
		</div>
		<div v-else class="display">
			{{breaker.text}}
		</div>
	</div>
</template>

<script>
	/* eslint no-mixed-spaces-and-tabs: 0*/
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
				editing: false
			};
		},
		created()
		{
			this.textInput = this.breaker.text;
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
			onDragOver(e)
			{
				e.preventDefault();
				e.dataTransfer.dropEffect = "move";
			},
			onDrop(e)
			{
				e.preventDefault();
				let srcBreaker = JSON.parse(e.dataTransfer.getData("text/plain"));
				this.$emit("onMove", {
					src: srcBreaker, dst: this.getData()
				});
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
	}

	.breakerTextDisplay
	{
		padding: 2px 5px;
		line-height: 18px;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		border: none;
		text-align: center;
	}

	.breakerTextArea
	{
		font-family: Arial, Helvetica, sans-serif;
		padding: 2px 5px;
		line-height: 18px;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		border: none;
		resize: none;
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
</style>

