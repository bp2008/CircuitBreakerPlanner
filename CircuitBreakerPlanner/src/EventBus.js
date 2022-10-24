import Vue from 'vue';
/////////////////////////////////////////
// READ THIS BEFORE IMPORTING ANYTHING //
/////////////////////////////////////////
// EventBus is a vue component that is created when this file is imported.
//
// Circular dependencies can create a complex situation where a dependency imported by EventBus.js is not loaded before the EventBus component is created.

// If you need to import something here, make sure that EventBus.js is imported very early in the application initialization.  A good place would be just after importing babel-polyfill (which should typically be the first thing imported).
/////////////////////////////////////////

/**
 * This object can be used to provide "global" event handling.  Based on https://alligator.io/vuejs/global-event-bus/
 * Import the EventBus and use EventBus.$on('eventName', …), EventBus.$off('eventName', …), and EventBus.$emit('EventName', …)
 * Or depending on your need, simply create reactive data using the EventBus data property.
 * The EventBus is good for things that need to be shared between components with fast reactivity and should not be persisted between page reloads.
 * EventBus is orders of magnitude faster than the vuex store.
 */
const EventBus = new Vue({
	data:
	{
		selectedBreakerIndex: -1
	},
	created()
	{
	},
	mounted()
	{
	},
	beforeDestroy()
	{
	},
	computed:
	{
	},
	methods:
	{
	}
});
window.appEventBus = EventBus; // Handle for debugging
export default EventBus;