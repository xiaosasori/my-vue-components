import { reactive } from 'vue'

const DnDState = reactive({inProgress: false, data: null, dragType: null, success: false, dropId: ''})
export { DnDState }