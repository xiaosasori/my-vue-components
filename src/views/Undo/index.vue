<template>
  <div>
    {{ a.state[0].count }}
    <button
      class="p-2 ml-2 bg-gray-400"
      @click="a.state[0].count++"
    >
      +
    </button>
    <button
      class="p-2 ml-2 bg-gray-400"
      @click="a.state[0].count--"
    >
      -
    </button>
    {{ a.state[0].count2 }}
    <button
      class="p-2 ml-2 bg-gray-400"
      @click="a.state[0].count2++"
    >
      +
    </button>
    <button
      class="p-2 ml-2 bg-gray-400"
      @click="a.state[0].count2--"
    >
      -
    </button>
    {{ a.state[1].count }}
    <button
      class="p-2 ml-2 bg-gray-400"
      @click="a.state[1].count++"
    >
      +
    </button>
    <button
      class="p-2 ml-2 bg-gray-400"
      @click="a.state[1].count--"
    >
      -
    </button>
    {{ a.state[1].count2 }}
    <button
      class="p-2 ml-2 bg-gray-400"
      @click="a.state[1].count2++"
    >
      +
    </button>
    <button
      class="p-2 ml-2 bg-gray-400"
      @click="a.state[1].count2--"
    >
      -
    </button>
    <button
      class="p-2 ml-2 bg-gray-400 d"
      :class="{ 'cursor-not-allowed': !a.past.length }"
      :disabled="!a.past.length"
      @click="a.undo()"
    >
      undo {{ !a.past.length }}
    </button>
    <button
      class="p-2 ml-2 bg-gray-400 d"
      :class="{ 'cursor-not-allowed': !a.future.length }"
      :disabled="!a.future.length"
      @click="a.redo()"
    >
      redo {{ !a.future.length }}
    </button>
    <div>{{ a.current }}</div>
    <div>{{ a.past }}</div>
    <div>{{ a.future }}</div>
    <Child v-model:items="items" />
    <div>
      {{ count.state.value }}
      <button @click="count.state.value+=1">
        Incre
      </button>
      <button @click="count.undo">
        Undo
      </button>
      <button @click="count.redo">
        Redo
      </button>
    </div>
  </div>
</template>

<script>
import Tracker from '@/hooks/useTracker'
import {reactive, ref} from 'vue'
import Child from './child'
export default {
  components: {Child},
  setup() {
    const a = new Tracker(reactive([{count: 0, count2: 0}, {count: 0, count2: 0}]))
    const items = ref([{count: Math.random(), count2: 0}, {count: 0, count2: 0}])
    const count = new Tracker(ref(10))
    return {a, items, count}
  }

}
</script>

<style>
</style>
