import { reactive } from 'vue';

const store = reactive({
	selectedBreakerIndex: -1
});
window.appStore = store; // Handle for debugging
export default store;