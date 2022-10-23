<template>
	<div id="app">
		<ProjectSelector :projectNames="projectNames"
						 :currentProjectName="currentProject ? currentProject.name : null"
						 @projectload="onProjectLoad"
						 @projectdelete="onProjectDelete"></ProjectSelector>
		<div class="panel" v-if="currentProject">
			<div class="panelTitleBar">
				<span class="loadedProjectName">{{currentProject.name}}</span>
				<input type="button" value="Add row" @click="addRow" />
				<input type="button" value="Remove last row" @click="removeRow" />
				<input type="button" value="Print" @click="print" />
				<input type="button" value="Rename" @click="renameStart" :disabled="isRenaming" />
				<label v-if="isRenaming">New name: <input type="text" v-model="newName" /></label>
				<input v-if="isRenaming" type="button" value="save" @click="renameFinish" />
			</div>
			<div v-for="(row, index) in currentProject.rows" :key="index" class="breakerRow">
				<div class="rowNumber">{{index + 1}}</div>
				<Breaker class="leftBreaker" :breaker="row.left" :rowNumber="index+1" side="left" @onMove="onBreakerMove" />
				<Breaker class="rightBreaker" :breaker="row.right" :rowNumber="index+1" side="right" @onMove="onBreakerMove" />
			</div>
		</div>
	</div>
</template>

<script>
	/* eslint no-mixed-spaces-and-tabs: 0*/
	import ProjectSelector from './components/ProjectSelector.vue';
	import Breaker from './components/Breaker.vue';
	import localforage from 'localforage';

	export default {
		components: { ProjectSelector, Breaker },
		data()
		{
			return {
				projectNames: [],
				currentProject: null,
				isRenaming: false,
				newName: ""
			};
		},
		created()
		{
			window.app = this;
			localforage.getItem('circuitBreakerPlannerProjectNames').then(value =>
			{
				if (value)
					this.projectNames = value;
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
							let loadedProject = value;
							loadedProject.name = projectName;
							this.currentProject = loadedProject;
						}
						else
						{
							let newProject = { name: projectName, rows: [] };
							while (newProject.rows.length < 10)
								newProject.rows.push(this.newRow());
							this.currentProject = newProject;
						}
					});
			},
			onProjectDelete(projectName)
			{
				this.currentProject = null;
				localforage.removeItem('circuitBreakerPlannerProject_' + projectName);
				for (let i = 0; i < this.projectNames.length; i++)
				{
					if (this.projectNames[i] === projectName)
					{
						this.projectNames.splice(i, 1);
						i--;
					}
				}
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
					else
						alert("Bottom row must be empty in order to remove it.");
				}
			},
			print()
			{
				window.print();
			},
			newRow()
			{
				return { left: this.newBreaker(), right: this.newBreaker() }
			},
			newBreaker()
			{
				return { text: "", amps: 0, averageWatts: 0 };
			},
			compareBreakers(a, b)
			{
				if (a.text < b.text)
					return -1;
				else if (a.text > b.text)
					return 1;
				if (a.amps < b.amps)
					return -1;
				else if (a.amps > b.amps)
					return 1;
				if (a.averageWatts < b.averageWatts)
					return -1;
				else if (a.averageWatts > b.averageWatts)
					return 1;
				return 0;
			},
			renameStart()
			{
				this.newName = this.currentProject.name;
				this.isRenaming = true;
			},
			renameFinish()
			{
				let project = this.currentProject;
				let oldName = project.name;
				let newName = this.newName;
				this.newName = "";
				this.isRenaming = false;
				if (oldName !== newName)
				{
					this.onProjectDelete(oldName);
					this.projectNames.push(newName);
					this.projectNames.sort();
					project.name = newName;
					this.currentProject = project;
				}
			},
			onBreakerMove(args)
			{
				console.log("onBreakerMove", args);
				if (this.compareBreakers(args.src, args.dst) === 0)
				{
					console.log("Move had no effect.");
					return;
				}
				for (let i = 0; i < this.currentProject.rows.length; i++)
				{
					let row = this.currentProject.rows[i];

					if (this.compareBreakers(row.left, args.src) === 0)
						row.left = args.dst;
					else if (this.compareBreakers(row.left, args.dst) === 0)
						row.left = args.src;

					if (this.compareBreakers(row.right, args.src) === 0)
						row.right = args.dst;
					else if (this.compareBreakers(row.right, args.dst) === 0)
						row.right = args.src;
				}
			}
		},
		watch:
		{
			projectNames: {
				deep: true,
				handler()
				{
					if (this.projectNames)
						localforage.setItem('circuitBreakerPlannerProjectNames', this.projectNames);
				}
			},
			currentProject: {
				deep: true,
				handler()
				{
					if (this.currentProject)
					{
						console.log("currentProject is ", this.currentProject.name);
						localforage.setItem('circuitBreakerPlannerCurrentProjectName', this.currentProject.name);
						localforage.setItem('circuitBreakerPlannerProject_' + this.currentProject.name, this.currentProject);
					}
					else
					{
						console.log("currentProject is ", this.currentProject);
						localforage.removeItem('circuitBreakerPlannerCurrentProjectName');
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

	.panelTitleBar
	{
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
	}

		.panelTitleBar > *
		{
			margin-left: 1em;
		}

			.panelTitleBar > *:first-child
			{
				margin-left: 0px;
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
		margin-right: 0.25em;
		min-width: 35px;
		text-align: center;
	}

	@media print
	{
		.panel
		{
			margin-top: 0px;
			padding-top: 0px;
			border: none;
		}

		.panelTitleBar
		{
			display: none;
		}
	}
</style>

