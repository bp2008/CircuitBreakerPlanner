<template>
	<div id="app">
		<ProjectSelector :projectNames="projectNames" :currentProjectName="currentProject ? currentProject.name : null" @projectload="onProjectLoad"></ProjectSelector>
		<div class="panel" v-if="currentProject">
			<div class="loadedProjectName">{{currentProject.name}}</div>
			<div v-for="(row, index) in currentProject.rows" :key="index" class="breakerRow">
				<div class="rowNumber">{{index + 1}}</div>
				<Breaker class="leftBreaker" :breaker="row.left" :rowNumber="index+1" side="left"></Breaker>
				<Breaker class="rightBreaker" :breaker="row.right" :rowNumber="index+1" side="right"></Breaker>
			</div>
			<br />
			<br />
			<input type="button" value="Add row to panel" @click="addRow" />
			<br />
			<br />
			<input type="button" value="Remove last row from panel" @click="removeRow" />
		</div>
	</div>
</template>

<script>
	import ProjectSelector from './components/ProjectSelector.vue';
	import Breaker from './components/Breaker.vue';
	import localforage from 'localforage';

	export default {
		components: { ProjectSelector, Breaker },
		data()
		{
			return {
				projectNames: [],
				currentProject: null
			};
		},
		created()
		{
			window.app = this;
			localforage.getItem('circuitBreakerPlannerProjectNames').then(value =>
			{
				if (value)
					this.projectNames = JSON.parse(value);
			});
			localforage.getItem('circuitBreakerPlannerCurrentProjectName').then(value =>
			{
				if (value)
					this.onProjectLoad(value);
			});
		},
		methods:
		{
			onProjectLoad(projectName)
			{
				localforage.getItem('circuitBreakerPlannerProject_' + projectName)
					.then(value =>
					{
						if (value)
						{
							let loadedProject = JSON.parse(value);
							loadedProject.name = projectName;
							this.currentProject = loadedProject;
						}
						else
						{
							let newProject = { name: projectName, rows: [] };
							while (newProject.length < 10)
								newProject.rows.push(this.newRow());
							this.currentProject = newProject;
						}
					});
			},
			addRow()
			{
				this.currentProject.rows.push(this.newRow());
			},
			removeRow()
			{
				if (this.currentProject.rows.length)
				{
					let idx = this.currentProject.rows.length - 1;
					let lastRow = this.currentProject.rows[idx];
					if (!lastRow.text && !lastRow.amps && !lastRow.averageWatts)
						this.currentProject.rows.splice(idx, 1);
				}
			},
			newRow()
			{
				return { left: { text: "", amps: 0, averageWatts: 0 }, right: { text: "", amps: 0, averageWatts: 0 } }
			}
		},
		watch:
		{
			projectNames: {
				deep: true,
				handler()
				{
					if (this.projectNames)
						localforage.setItem('circuitBreakerPlannerProjectNames', JSON.stringify(this.projectNames));
				}
			},
			currentProject: {
				deep: true,
				handler()
				{
					console.log("Change detected in ", this.currentProject);
					if (this.currentProject)
					{
						localforage.setItem('circuitBreakerPlannerCurrentProjectName', this.currentProject.name);
						localforage.setItem('circuitBreakerPlannerProject_' + this.currentProject.name, JSON.stringify(this.currentProject));
					}
				}
			}
		}
	};
</script>

<style scoped>
	#app
	{
		font-family: Arial, Helvetica, sans-serif;
	}

	.panel
	{
		margin-top: 1em;
		padding-top: 1em;
		border-top: 1px solid black;
	}

	.loadedProjectName
	{
		font-size: 14pt;
		font-weight: bold;
		margin-bottom: 1em;
	}

	.breakerRow
	{
		display: flex;
		align-items: center;
	}

	.rowNumber
	{
		font-size: 16pt;
		margin-left: 0.25em;
		margin-right: 0.5em;
	}
</style>

