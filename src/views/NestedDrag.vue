<template>
  <DragList
    v-model:list="taskList"
    trigger-move=".title"
    class="nest"
    :id-adapter="(val) => val.name"
    mode="cut"
  >
    <template #default="{item}">
      <p class="title">
        {{ item.name }}
      </p>
      <NestedDrag :tasks="item.tasks" />
    </template>
    <template #placeholder-add>
      add
    </template>
    <template #placeholder-move>
      <div>move</div>
    </template>
  </DragList>
</template>

<script>
import DragList from '@/components/DragDrop/DragList'
import {computed} from 'vue'
export default {
    name: 'NestedDrag',
    components: {DragList},
    props: {
      tasks: Array
    },
    setup (props, {emit}) {
      const taskList = computed({
        get: () => props.tasks,
        set: val => {
          emit('update:tasks', val)
        }
      })
      return {taskList}
    }
}
</script>

<style scoped>
.nest {
  margin-top: 20px;
  border: 1px dashed black;
  min-height: 50px;
}
:deep(.drag-container) {
  padding: 10px;
}
</style>