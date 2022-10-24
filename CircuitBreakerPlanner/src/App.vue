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
			<div v-for="(row, index) in currentProject.rows" :key="index" class="breakerRow"
				 @keydown.up.down.left.right.prevent="onNavKey">
				<div class="rowNumber">{{index + 1}}</div>
				<Breaker class="leftBreaker" :breaker="row.left" :rowNumber="index + 1" side="left" @onMove="onBreakerMove" />
				<Breaker class="rightBreaker" :breaker="row.right" :rowNumber="index + 1" side="right" @onMove="onBreakerMove" />
			</div>
			<div v-if="selectedBreaker" class="selectedBreakerEdit">
				<div class="description">Breaker #{{selectedBreaker.index + 1}} is selected. This is the {{selectedBreaker.index % 2 == 0 ?'left':'right'}} breaker of row {{(selectedBreaker.index % 2 == 0 ? (selectedBreaker.index / 2) : ((selectedBreaker.index - 1) / 2)) + 1}}.</div>
				<div><label>Label: <textarea class="breakerTextArea" v-model="selectedBreaker.text" /></label></div>
				<div><label>Amps: <input type="number" v-model="selectedBreaker.amps" class="ampsInput" step="5" min="0" max="1000" /></label></div>
				<div><label>Average Watts Used: <input type="range" v-model="selectedBreaker.averageWatts" :min="0" :max="selectedBreaker.amps * 120" /> {{Math.round(selectedBreaker.averageWatts)}} watts<span v-if="selectedBreaker.averageWatts > selectedBreaker.amps * 120 * 0.8"> (consider a larger breaker)</span></label></div>
			</div>
			<p class="totals">Total Watts Expected: {{totalOddWatts + totalEvenWatts}}</p>
			<p class="totals">Odd rows: {{totalOddWatts}} ({{(totalOddWatts / 120).toFixed(1)}} amps)</p>
			<p class="totals">Even rows: {{totalEvenWatts}} ({{(totalEvenWatts / 120).toFixed(1)}} amps)</p>
		</div>
	</div>
</template>

<script>
	/* eslint no-mixed-spaces-and-tabs: 0*/
	import ProjectSelector from './components/ProjectSelector.vue';
	import Breaker from './components/Breaker.vue';
	import localforage from 'localforage';
	import EventBus from './EventBus.js'

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
		computed:
		{
			totalOddWatts()
			{
				let total = 0;
				for (let i = 0; i < this.currentProject.rows.length; i += 2)
				{
					let row = this.currentProject.rows[i];
					total += row.left.averageWatts;
					total += row.right.averageWatts;
				}
				return Math.round(total);
			},
			totalEvenWatts()
			{
				let total = 0;
				for (let i = 1; i < this.currentProject.rows.length; i += 2)
				{
					let row = this.currentProject.rows[i];
					total += row.left.averageWatts;
					total += row.right.averageWatts;
				}
				return Math.round(total);
			},
			breakersByIndex()
			{
				let breakers = {};
				for (let i = 0; i < this.currentProject.rows.length; i++)
				{
					let row = this.currentProject.rows[i];
					breakers[row.left.index] = row.left;
					breakers[row.right.index] = row.right;
				}
				return breakers;
			},
			selectedBreaker()
			{
				return this.breakersByIndex[EventBus.selectedBreakerIndex];
			}
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
							for (let i = 0; i < loadedProject.rows.length; i++)
								loadedProject.rows[i].left.selected = loadedProject.rows[i].right.selected = false;
							this.currentProject = loadedProject;
						}
						else
						{
							let newProject = { name: projectName, rows: [] };
							while (newProject.rows.length < 10)
								newProject.rows.push(this.newRow());
							this.currentProject = newProject;
						}
						// Validate all breakers
						// Reassign the index values for all breakers.
						for (let i = 0; i < this.currentProject.rows.length; i++)
						{
							let row = this.currentProject.rows[i];
							this.fixBreakerErrors(row.left);
							this.fixBreakerErrors(row.right);
							row.left.index = i * 2;
							row.right.index = (i * 2) + 1;
						}
					});
			},
			fixBreakerErrors(breaker)
			{
				if (typeof breaker.averageWatts !== "number" || breaker.averageWatts < 0 || isNaN(breaker.averageWatts))
					breaker.averageWatts = 0;
				if (typeof breaker.amps !== "number" || breaker.amps < 0 || isNaN(breaker.amps))
					breaker.averageWatts = 0;
				if (!breaker.text)
					breaker.text = "";
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
				return { left: this.newRandomBreaker(), right: this.newRandomBreaker() }
			},
			newBreaker()
			{
				return { text: "", amps: 0, averageWatts: 0, breakerIndex: 0 };
			},
			newRandomBreaker()
			{
				return {
					text: Math.round((Math.random() * 99999) + 100000).toString(),
					amps: 15 + Math.round(Math.random() * 9) * 5,
					averageWatts: Math.random() * 1000,
					selected: false,
					breakerIndex: 0
				};
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
			},
			onNavKey(e)
			{
				if (e.which === 37) // left
					this.navDirection(-1, 0);
				else if (e.which === 38) // up
					this.navDirection(0, -1);
				else if (e.which === 39) // right
					this.navDirection(1, 0);
				else if (e.which === 40) // down
					this.navDirection(0, 1);
			},
			navDirection(x, y)
			{
				if (EventBus.selectedBreakerIndex < 0)
					return;
				if (x < 0 && EventBus.selectedBreakerIndex % 2 == 1)
					EventBus.selectedBreakerIndex--;
				else if (x > 0 && EventBus.selectedBreakerIndex % 2 == 0)
					EventBus.selectedBreakerIndex++;
				else if (y < 0 && EventBus.selectedBreakerIndex >= 2)
					EventBus.selectedBreakerIndex -= 2;
				else if (y > 0 && EventBus.selectedBreakerIndex + 2 < this.currentProject.rows.length * 2)
					EventBus.selectedBreakerIndex += 2;
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

	.breakerTextArea
	{
		font-family: Arial, Helvetica, sans-serif;
		font-size: 12pt;
		padding: 2px 5px;
		line-height: 18px;
		width: 119px;
		height: 42px;
		border: 1px solid #000000;
		box-sizing: border-box;
		resize: none;
		text-align: center;
	}

	.selectedBreakerEdit
	{
		border: inset;
		padding: 2px 5px;
		margin: 1em 0px;
	}

		.selectedBreakerEdit .description
		{
			margin-bottom: 0.5em;
		}

		.selectedBreakerEdit .ampsInput
		{
			width: 50px;
			font-size: 14pt;
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

		.selectedBreakerEdit
		{
			display: none;
		}

		.totals
		{
			display: none;
		}
	}
</style>

