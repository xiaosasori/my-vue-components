<template>
  <div>
    <VDragDrop
      ref="trashRef"
      hover-class="hovering"
      :class="{full: hasTrash}"
      class="trash"
      @dropped="trashDrop"
    />
    <VDragDrop
      v-for="doc in docs"
      :key="doc"
      :droppable="false"
      :data-transfer="{value: doc}"
      @customdrag="drag"
      @dragend="dragend"
    >
      <img
        :draggable="false"
        class="document"
        src="@/assets/document.png"
      >
      <template #drag-image>
        <img
          v-show="idx === 0"
          class="drag-image"
          src="@/assets/smiley01.png"
        >
        <img
          v-show="idx === 1"
          class="drag-image"
          src="@/assets/smiley02.png"
        >
        <img
          v-show="idx === 2"
          class="drag-image"
          src="@/assets/smiley03.png"
        >
        <img
          v-show="idx === 3"
          class="drag-image"
          src="@/assets/smiley04.png"
        >
        <img
          v-show="idx === 4"
          class="drag-image"
          src="@/assets/smiley05.png"
        >
        <img
          v-show="idx === 5"
          class="drag-image"
          src="@/assets/smiley06.png"
        >
      </template>
    </VDragDrop>
  </div>
</template>

<script>
import {ref, reactive} from 'vue'
import VDragDrop from '@/components/DragDrop/DragItem'
export default {
components: { VDragDrop },
    setup() {
      const docs = ref(['doc1', 'doc2'])
      const startPosition = reactive({})
      const totalDistance = reactive({value: 0, lock: false})
      const idx = ref(0)
      const hasTrash = ref(false)
      const trashRef = ref(null)
        function drag(e) {
            if (startPosition.x === undefined) Object.assign(startPosition, {x: e.clientX, y: e.clientY})
            const {top, left, height, width} = trashRef.value.$el.getBoundingClientRect()
            const trashCenter = {x: left + width / 2, y: top + height / 2}
            const remainingDistance = Math.sqrt(Math.pow(trashCenter.x-e.clientX, 2) + Math.pow(trashCenter.y-e.clientY, 2))
            // lock for calculating totalDistance only once since drag start
            if (!totalDistance.lock) {
              totalDistance.value = Math.sqrt(Math.pow(startPosition.x-trashCenter.x, 2) + Math.pow(startPosition.y-trashCenter.y, 2))
              totalDistance.lock = true
            }
            const distancePercent = Math.min(1, remainingDistance / totalDistance.value)
            // console.log(remainingDistance, this.totalDistance.value, distancePercent);
            if (distancePercent < 0.1) idx.value = 5
            else if (distancePercent >= 0.1 && distancePercent < 0.3) idx.value = 4
            else if (distancePercent >= 0.3 && distancePercent < 0.5) idx.value = 3
            else if (distancePercent >= 0.5 && distancePercent < 0.7) idx.value = 2
            else if (distancePercent >= 0.7 && distancePercent < 0.9) idx.value = 1
            else if (distancePercent >= 0.9) idx.value = 0
          }
        function dragend() {
            startPosition.x = undefined
            totalDistance.lock = false
          }
        function trashDrop() {
            hasTrash.value = true
          }
      return { idx, docs, hasTrash, drag, dragend, trashDrop, trashRef };
    }
}
</script>

<style>
.trash {
  background: url('~@/assets/trash.png') top left no-repeat;
  height: 128px;
  width: 128px;
  margin-top: 90px;
  float: right;
  opacity: 0.7;
}

.trash.full {
  background: url('~@/assets/trash.png') top right no-repeat;
}
.document {
  margin-top: 10px;
  display: block;
  cursor: pointer;
  cursor: grab;
  cursor: -webkit-grab;
}
.drag-image {
  max-width: unset;
  width: 100px;
  height: 100px;
}
.hovering {
  box-shadow: 0 0 2px 4px gray;
}
</style>