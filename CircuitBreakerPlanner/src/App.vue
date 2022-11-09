<template>
	<div id="app">
		<ProjectSelector :projectNames="projectNames"
						 :currentProjectName="currentProject ? currentProject.name : null"
						 @projectload="onProjectLoad"
						 @projectdelete="onProjectDelete"></ProjectSelector>
		<div class="panel" v-if="currentProject">
			<div class="panelTitleBar hideWhenPrinting">
				<span class="loadedProjectName">{{currentProject.name}}</span>
				<input type="button" value="Add row" @click="addRow" />
				<input type="button" value="Remove last row" @click="removeRow" />
				<input type="button" value="Rename" @click="renameStart" :disabled="isRenaming" />
				<label v-if="isRenaming">New name: <input type="text" v-model="newName" /></label>
				<input v-if="isRenaming" type="button" value="save" @click="renameFinish" />
			</div>
			<div v-for="(row, index) in currentProject.rows" :key="index" class="breakerRow"
				 @keydown.up.down.left.right.prevent="onNavKey">
				<div class="rowNumber" v-if="showRowNumbers">{{index + 1}}</div>
				<div class="rowNumber" v-if="showBreakerNumbers">{{row.left.index + 1}}</div>
				<Breaker class="leftBreaker" :breaker="row.left" :showAmps="showAmpRatings" @onMove="onBreakerMove" />
				<Breaker class="rightBreaker" :breaker="row.right" :showAmps="showAmpRatings" @onMove="onBreakerMove" />
				<div class="rowNumber" v-if="showBreakerNumbers">{{row.right.index + 1}}</div>
			</div>
			<div v-if="selectedBreaker" class="selectedBreakerEdit hideWhenPrinting">
				<div class="description">Breaker #{{selectedBreaker.index + 1}} is selected. This is the {{selectedBreaker.index % 2 == 0 ?'left':'right'}} breaker of row {{(selectedBreaker.index % 2 == 0 ? (selectedBreaker.index / 2) : ((selectedBreaker.index - 1) / 2)) + 1}}.</div>
				<div><label>Label: <textarea class="breakerTextArea" v-model="selectedBreaker.text" /></label></div>
				<div>
					<label>Amps: <input type="number" v-model="selectedBreaker.amps" class="ampsInput" step="5" min="0" max="1000" /></label>
					<input type="button" class="ampButton" value=" - " @click="selectedBreaker.amps = Math.max(0, selectedBreaker.amps - 5)" />
					<input type="button" class="ampButton" value=" + " @click="selectedBreaker.amps = Math.min(1000, selectedBreaker.amps + 5)" />
					<br>
					<input type="button" class="ampButton" v-for="size in ampSizes" :key="size" :value="size" @click="selectedBreaker.amps = size" />
				</div>
				<div>
					<label>Average Watts Used: <input type="number" class="wattsNumberInput" v-model.number="selectedBreaker.averageWatts" :min="0" :max="Math.max(120, selectedBreaker.amps * 120)" /> watts<span v-if="selectedBreaker.averageWatts > selectedBreaker.amps * 120 * 0.8"> (consider a larger breaker)</span><br /><input type="range" v-model.number="selectedBreaker.averageWatts" :min="0" :max="Math.max(120, selectedBreaker.amps * 120)" /></label>
				</div>
			</div>
			<div class="hideWhenPrinting">
				<p>Total Watts Expected: {{totalOddWatts + totalEvenWatts}}</p>
				<p>Odd rows: {{totalOddWatts}} ({{(totalOddWatts / 120).toFixed(1)}} amps)</p>
				<p>Even rows: {{totalEvenWatts}} ({{(totalEvenWatts / 120).toFixed(1)}} amps)</p>
				<p><label><input type="checkbox" v-model="showAmpRatings" /> show amp ratings</label></p>
				<p><label><input type="checkbox" v-model="showRowNumbers" /> show row numbers</label></p>
				<p><label><input type="checkbox" v-model="showBreakerNumbers" /> show breaker numbers</label></p>
				<p><input type="button" value="Print" @click="print" /></p>
				<p><input type="button" :value="showExport ? 'Hide Export Section' : 'Export Project'" @click="showExport = !showExport" /></p>
				<div v-if="showExport" class="exportContainer">
					<div class="exportStr">
						<div class="textBlockSmall">{{exported.str}}</div> <input type="button" value="copy text" @click="copyExportedStr" /> or scan this QR code:
					</div>
					<p v-if="exported.svgError">QR Code could not be generated because of error: {{exported.svgError}}</p>
					<div class="exportQr" v-if="exported.svg" v-html="exported.svg">
					</div>
				</div>
			</div>
		</div>
		<div class="hideWhenPrinting">
			<p><input type="button" :value="showImport ? 'Hide Import Section' : 'Import Project'" @click="showImport = !showImport" /></p>
			<div v-if="showImport" class="importContainer">
				<p>There are two ways to import.</p>
				<p class="importStr">
					1. <label>Paste the string from an earlier export: <input type="text" v-model="importText" /></label>
				</p>
				<p>
					2. If you have a camera connected, <input type="button" :value="showVideoImport ? 'Stop Scanning' : 'Scan QR with Camera'" @click="toggleQrImport" />
				</p>
				<p>When a valid string has been entered or a valid QR code has been scanned, an Import button will appear below:</p>
				<p class="importStatus">
					{{importStatus}}
				</p>
				<p v-if="importReady"><input type="button" value="Import" @click="importBtnClicked" /></p>
				<div class="videoContainer" v-show="showVideoImport">
					<p>Note, getting a QR code to scan can be a bit frustrating. Try bringing the camera closer or further away. The code should not usually be very large in the camera's view.</p>
					<p><label><input type="checkbox" v-model="mirrorVideo" /> mirror video display</label></p>
					<video ref="videoEle" :class="{ videoEle: true, mirrorVideo: mirrorVideo, importReady: importReady }"></video>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
	/* eslint no-mixed-spaces-and-tabs: 0*/
	import ProjectSelector from './components/ProjectSelector.vue';
	import Breaker from './components/Breaker.vue';
	import localforage from 'localforage';
	import EventBus from './EventBus.js';
	import QrScanner from './criteo-forks-qr-scanner/qr-scanner.min.js';

	export default {
		components: { ProjectSelector, Breaker },
		data()
		{
			return {
				projectNames: [],
				currentProject: null,
				isRenaming: false,
				newName: "",
				showAmpRatings: true,
				showRowNumbers: true,
				showBreakerNumbers: false,
				showExport: false,
				showImport: false,
				importText: "",
				importData: null,
				showVideoImport: false,
				qrScanner: null,
				mirrorVideo: false
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
					if (row.left.amps > 0)
						total += row.left.averageWatts;
					if (row.right.amps > 0)
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
					if (row.left.amps > 0)
						total += row.left.averageWatts;
					if (row.right.amps > 0)
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
			},
			ampSizes()
			{
				let sizes = { 0: true, 15: true, 20: true, 30: true, 40: true, 50: true, 60: true };
				for (let i = 0; i < this.currentProject.rows.length; i++)
				{
					let row = this.currentProject.rows[i];
					sizes[row.left.amps] = true;
					sizes[row.right.amps] = true;
				}
				let arr = [];
				for (let size in sizes)
					arr.push(parseInt(size));
				arr.sort((a, b) => a - b);
				return arr;
			},
			exported()
			{
				if (this.currentProject && this.showExport)
				{
					try
					{
						// Make a slimmed-down copy of the project
						let json = JSON.stringify(this.currentProject);
						let copy = JSON.parse(json);
						for (let i = 0; i < copy.rows.length; i++)
							copy.rows[i] = compressRow(copy.rows[i]);

						// Convert to JSON and compress
						json = JSON.stringify(copy);
						let compressed = window.LZString.compressToUint8Array(json);
						let compressedStr = window.LZString.compressToEncodedURIComponent(json);
						//console.log(json.length, json);
						//console.log(compressed.length, compressed);
						//console.log(compressedStr.length, compressedStr);

						// Create QR Code
						let svg = "";
						let svgError = "";
						try
						{
							const QRC = window.qrcodegen.QrCode;
							const qr0 = QRC.encodeBinary(compressed, QRC.Ecc.LOW);
							svg = qrToSvgString(qr0, 4, "#FFFFFF", "#000000");
						}
						catch (ex)
						{
							svgError = ex;
						}
						return { svg: svg, svgError: svgError, str: compressedStr };
					}
					catch (ex)
					{
						console.error(ex);
					}
				}
				return { svg: null, str: null };
			},
			importedProject()
			{
				if (this.importText)
				{
					let json = window.LZString.decompressFromEncodedURIComponent(this.importText);
					let importedProject = JSON.parse(json);
					return importedProject;
				}
				if (this.importData)
				{
					let json = window.LZString.decompressFromUint8Array(this.importData);
					let importedProject = JSON.parse(json);
					return importedProject;
				}
				return null;
			},
			importReady()
			{
				return this.importedProject && this.importedProject.name && this.importedProject.rows;
			},
			importStatus()
			{
				if (this.importReady)
					return "Ready to import project: \"" + this.importedProject.name + "\"";
				else if (this.importText)
					return "String is not a valid export.";
				else if (this.importData)
					return "QR code is not a valid export.";
				else
					return "Please paste a string or scan a QR code.";
			}
		},
		methods:
		{
			onProjectLoad(projectName)
			{
				if (this.currentProject && this.currentProject.name === projectName)
					this.currentProject = null;
				else
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
								newProject.showAmpRatings = this.showAmpRatings;
								newProject.showRowNumbers = this.showRowNumbers;
								newProject.showBreakerNumbers = this.showBreakerNumbers;
								this.currentProject = newProject;
							}
							this.showAmpRatings = this.currentProject.showAmpRatings;
							this.showRowNumbers = this.currentProject.showRowNumbers;
							this.showBreakerNumbers = this.currentProject.showBreakerNumbers;
							// Validate all breakers
							for (let i = 0; i < this.currentProject.rows.length; i++)
							{
								let row = this.currentProject.rows[i];
								this.fixBreakerErrors(row.left);
								this.fixBreakerErrors(row.right);
							}
							// Reassign the index values for all breakers.
							this.reassignBreakerIndexValues();
						});
				}
			},
			reassignBreakerIndexValues()
			{
				for (let i = 0; i < this.currentProject.rows.length; i++)
				{
					let row = this.currentProject.rows[i];
					row.left.index = i * 2;
					row.right.index = (i * 2) + 1;
				}
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
					if ((this.breakerSlotEmpty(lastRow.left) && this.breakerSlotEmpty(lastRow.right))
						|| confirm("Bottom row is not empty.  Confirm you wish to delete the bottom row and its breakers."))
					{
						this.currentProject.rows.splice(idx, 1);
					}
				}
			},
			breakerSlotEmpty(breaker)
			{
				return !breaker.text.trim() && breaker.amps === 0 && breaker.averageWatts === 0;
			},
			print()
			{
				window.print();
			},
			newRow()
			{
				let idx = this.currentProject ? (this.currentProject.rows.length * 2) : 0;
				return { left: this.newBreaker(idx), right: this.newBreaker(idx + 1) }
			},
			newBreaker(index)
			{
				return { text: "", amps: 0, averageWatts: 0, index: index };
			},
			//newRandomBreaker()
			//{
			//	return {
			//		text: Math.round((Math.random() * 99999) + 100000).toString(),
			//		amps: 15 + Math.round(Math.random() * 9) * 5,
			//		averageWatts: Math.random() * 1000,
			//		selected: false,
			//		index: index
			//	};
			//},
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
				if (args.src.index === args.dst.index)
				{
					console.log("Move had no effect.");
					return;
				}
				for (let i = 0; i < this.currentProject.rows.length; i++)
				{
					let row = this.currentProject.rows[i];

					if (row.left.index === args.src.index)
						row.left = args.dst;
					else if (row.left.index === args.dst.index)
						row.left = args.src;

					if (row.right.index === args.src.index)
						row.right = args.dst;
					else if (row.right.index === args.dst.index)
						row.right = args.src;
				}

				if (EventBus.selectedBreakerIndex === args.src.index)
					EventBus.selectedBreakerIndex = args.dst.index; // Should always happen
				else if (EventBus.selectedBreakerIndex === args.dst.index)
					EventBus.selectedBreakerIndex = args.src.index; // Should never happen

				this.reassignBreakerIndexValues();
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
			},
			copyExportedStr()
			{
				navigator.clipboard.writeText(this.exported.str);
			},
			importBtnClicked()
			{
				for (let i = 0; i < this.projectNames.length; i++)
				{
					if (this.projectNames[i] === this.importedProject.name)
					{
						if (confirm("You already have a project named \"" + this.importedProject.name + "\". Overwrite it?"))
						{
							this.commitImport();
						}
						return;
					}
				}
				this.commitImport();
			},
			commitImport()
			{
				let alreadyExists = false;
				for (let i = 0; i < this.projectNames.length; i++)
					if (this.projectNames[i] === this.importedProject.name)
						alreadyExists = true;
				if (!alreadyExists)
				{
					this.projectNames.push(this.importedProject.name);
					this.projectNames.sort();
				}
				let copy = JSON.parse(JSON.stringify(this.importedProject));
				// Uncompress copy (add missing fields)
				for (let i = 0; i < copy.rows.length; i++)
					copy.rows[i] = uncompressRow(copy.rows[i]);
				this.currentProject = copy;
				this.reassignBreakerIndexValues();
				this.importText = "";
				this.importData = null;
				this.showImport = false;
			},
			toggleQrImport()
			{
				this.importData = null;
				if (this.showVideoImport)
				{
					this.showVideoImport = false;
					if (this.qrScanner)
						this.qrScanner.stop();
				}
				else
				{
					this.showVideoImport = true;
					this.qrScanner = new QrScanner(this.$refs.videoEle, result =>
					{
						console.log('decoded qr code:', result)
						this.importText = null;
						this.importData = result.bytes;
					}, { returnDetailedScanResult: true });
					this.qrScanner.start();
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
			},
			showAmpRatings()
			{
				this.currentProject.showAmpRatings = this.showAmpRatings;
			},
			showRowNumbers()
			{
				if (this.showRowNumbers)
					this.showBreakerNumbers = false;
				this.currentProject.showRowNumbers = this.showRowNumbers;
			},
			showBreakerNumbers()
			{
				if (this.showBreakerNumbers)
					this.showRowNumbers = false;
				this.currentProject.showBreakerNumbers = this.showBreakerNumbers;
			}
		}
	};
	function compressRow(row)
	{
		row.left = compressBreaker(row.left);
		row.right = compressBreaker(row.right);
		return row;
	}
	function compressBreaker(breaker)
	{
		if (!breaker.name || breaker.name.trim() === "")
			delete breaker.name;
		if (!breaker.amps)
			delete breaker.amps;
		if (!breaker.averageWatts)
			delete breaker.averageWatts;
		return breaker;
	}
	function uncompressRow(row)
	{
		row.left = uncompressBreaker(row.left);
		row.right = uncompressBreaker(row.right);
		return row;
	}
	function uncompressBreaker(breaker)
	{
		if (!breaker.name)
			breaker.name = "";
		if (!breaker.amps)
			breaker.amps = 0;
		if (!breaker.averageWatts)
			breaker.averageWatts = 0;
		return breaker;
	}
	function qrToSvgString(qr, border, lightColor, darkColor)
	{
		if (border < 0)
			throw new RangeError("Border must be non-negative");
		let parts = [];
		for (let y = 0; y < qr.size; y++)
		{
			for (let x = 0; x < qr.size; x++)
			{
				if (qr.getModule(x, y))
					parts.push(`M${x + border},${y + border}h1v1h-1z`);
			}
		}
		return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${qr.size + border * 2} ${qr.size + border * 2}" stroke="none">
	<rect width="100%" height="100%" fill="${lightColor}"/>
	<path d="${parts.join(" ")}" fill="${darkColor}"/>
</svg>
`;
	}
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
		margin-bottom: 1em;
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
		font-size: 14pt;
	}

		.selectedBreakerEdit > *
		{
			margin-bottom: 1em;
		}

			.selectedBreakerEdit > *:last-child
			{
				margin-bottom: 0px;
			}

		.selectedBreakerEdit .description
		{
		}

		.selectedBreakerEdit .ampsInput,
		.selectedBreakerEdit .wattsNumberInput
		{
			width: 50px;
			font-size: 14pt;
			margin-bottom: 0.3em;
		}

		.selectedBreakerEdit .wattsNumberInput
		{
			width: 80px;
			font-size: 14pt;
		}

		.selectedBreakerEdit .ampButton
		{
			margin-left: 0.5em;
			font-size: 14pt;
		}

		.selectedBreakerEdit input[type="range"]
		{
			width: 100%;
		}

	.exportContainer
	{
		border-top: 1px solid black;
		border-bottom: 1px solid black;
	}

	.exportStr
	{
		padding-top: 1em;
		display: flex;
		align-items: baseline;
	}

		.exportStr .textBlockSmall
		{
			display: inline-block;
			border: 1px solid black;
			padding: 2px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			width: 160px;
			user-select: all;
		}

		.exportStr input[type="button"]
		{
			margin-left: 0.5em;
			margin-right: 0.5em;
		}

	.exportQr
	{
		text-align: center;
		padding-top: 1em;
		padding-bottom: 1em;
	}

		.exportQr /deep/ svg
		{
			width: 100%;
			height: 100%;
			max-width: 90vw;
			max-height: 90vh;
		}

	.videoContainer
	{
		text-align: center;
	}

	.videoEle
	{
		width: 100%;
		height: 100%;
		max-width: 90vw;
		max-height: 90vh;
		transform: scale(1, 1) !important;
		border: 5px solid #FF0000;
	}

		.videoEle.mirrorVideo
		{
			transform: scale(-1, 1) !important;
		}

		.videoEle.importReady
		{
			border: 5px solid #00FF00;
		}

	.importStatus
	{
		font-size: 1.2em;
		/*font-style: italic;*/
		/*color: #006600;*/
		border: 2px dashed #FF9900;
		display: inline-block;
		padding: 4px 12px;
	}

	@media print
	{
		.panel
		{
			margin-top: 0px;
			padding-top: 0px;
			border: none;
		}

		.hideWhenPrinting
		{
			display: none;
		}
	}
</style>

