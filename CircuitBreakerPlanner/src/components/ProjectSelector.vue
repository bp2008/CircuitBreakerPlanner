<template>
	<div class="projectSelector">
		<p v-if="projectNames.length > 0">Existing Projects:</p>
		<ul class="projectList">
			<li v-for="projectName in projectNames" :key="projectName">
				<a class="projectName" role="button" tabindex="0" @click="loadProject(projectName)">
					{{projectName}}
				</a>
				<span v-if="projectName === currentProjectName">
					(LOADED)
					<input type="button" value="delete" @click="deleteMe" />
				</span>
			</li>
		</ul>
		<div class="newProject">
			<label>New Project: <input type="text" v-model="newProjectName" /></label> <input type="button" @click="createNewProject" value="Create" />
		</div>
		<p>Projects are saved in your browser's IndexedDB.</p>
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
				this.projectNames.sort();
				this.loadProject(this.newProjectName);
				this.newProjectName = "";
			},
			loadProject(projectName)
			{
				this.$emit("projectload", projectName);
			},
			deleteMe()
			{
				if (confirm("Confirm you wish to delete \"" + this.currentProjectName + "\"."))
				{
					this.$emit("projectdelete", this.currentProjectName);
				}
			}
		}
	};
</script>
<style scoped>
	.projectSelector
	{
		margin-bottom: 1em;
	}

	.projectName
	{
		color: #0033FF;
		font-weight: bold;
		text-decoration: underline;
		cursor: pointer;
	}

	@media print
	{
		.projectSelector
		{
			display: none;
		}
	}
</style>

