<template>
  <div
    v-if="context.show"
    v-click-outside="() => (context.show = false)"
    class="bg-white shadow-sm context__container"
    :style="{
      left: context.event.clientX + 'px',
      top: context.event.clientY + 'px',
    }"
  >
    <!-- <button @click="context.show = false" class="btn-close"></button> -->
    <ul role="menu">
      <slot :context="context">
        <li
          v-for="(action, index) in actions"
          :key="`menu-item-${index}`"
          role="menuitem"
          class="hover:bg-gray-400"
          @click="handleAction"
        >
          {{ action.label }}
        </li>
      </slot>
    </ul>
  </div>
</template>

<script>
import {getCurrentInstance, onMounted, nextTick, reactive} from 'vue'
import clickOutside from '@/directives/clickOutSide.ts'
export default {
  name: 'ContextMenu',
  directives: {'click-outside': clickOutside},
  props: {
    actions: {
      type: Array,
      default: () => []
    }
  },
  setup() {
    const instance = getCurrentInstance()
    onMounted(() => {
      nextTick(() => {
        instance.proxy.$parent.$el.addEventListener('contextmenu', (event) => {
          event.preventDefault()
          context.show = true
          context.event = event
        })
      })
    })
    const handleAction = (e) => {
      console.log('action')
    }
    const context = reactive({show: false, event: {clientX: 0, clientY: 0}})
    return {handleAction, context}
  }
}
</script>

<style scoped>
.context__container {
  position: fixed;
  z-index: 1;
}

.btn-close {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: auto;
}
</style>