<template>
	<div class="projectSelector">
		<div class="projectList">
			<div v-for="projectName in projectNames" :key="projectName" class="projectLink" role="button" tabindex="0" @click="loadProject(projectName)">{{projectName}}<span v-if="projectName === currentProjectName"> - LOADED</span></div>
		</div>
		<div class="newProject">
			<label>New Project: <input type="text" v-model="newProjectName" /></label> <input type="button" @click="createNewProject" value="Create" />
		</div>
	</div>
</template>
<script>
	export default {
		components: {},
		props: {
			projectNames: Array,
			currentProjectName: {
				type: String,
				default: ""
			}
		},
		data()
		{
			return {
				newProjectName: ""
			};
		},
		created()
		{
		},
		methods:
		{
			createNewProject()
			{
				this.projectNames.push(this.newProjectName);
				this.newProjectName = "";
			},
			loadProject(projectName)
			{
				this.$emit("projectload", projectName);
			}
		}
	};
</script>
<style scoped>
	.projectSelector
	{
		margin-bottom: 1em;
	}

	.projectList
	{
		display: flex;
		flex-direction: column;
		color: #0033FF;
		font-weight: bold;
	}

	.projectLink
	{
		margin-bottom: 1em;
		border-bottom: 1px solid #AAAAAA;
		cursor: pointer;
	}

		.projectLink:last-child
		{
			border-bottom: none;
		}
</style>

