/* eslint no-unused-vars: 0 */
import Vue from 'vue';
import App from './App.vue';
import EventBus from './EventBus.js'

Vue.config.productionTip = true;

new Vue({
	render: h => h(App)
}).$mount('#app');
