<template>
  <transition-group
    :id="id"
    ref="listEl"
    class="drag-list"
    move-class="drag-list--move"
    :tag="tag"
    :data-group="group"
    @dragleave="dragleave"
    @dragend="dragend"
    @drop="drop"
    @dragover="dragover"
    @dragstart.stop
    @dragenter="dragenter"
    @animationstart="setTransitionState(true)"
    @animationend="setTransitionState(false)"
    @transitionstart="setTransitionState(true)"
    @transitionend="setTransitionState(false)"
  >
    <div
      key="dummy-el"
      ref="dummyEl"
    />
    <template v-if="showPlaceholderMove || showPlaceholderAdd">
      <!-- We still add @dragstart when show placeholder because in production
      mode DragItem in placeholder may be reused after a success drop.
      So @dragstart may not be fired if we perform drag drop again. -->
      <DragItem
        v-for="(item, index) in itemsBeforePlaceholder"
        :key="idAdapter(item)"
        :data-transfer="{ index, value: item }"
        :data-index="index"
        :data-group="group"
        :group="group"
        :accept-data="acceptData"
        :trigger-move="triggerMove"
        :tag="childTag"
        @dragstart="dragstart"
        @dragentered="dragentered"
      >
        <template
          v-for="name of Object.keys($slots)"
          #[name]="scope"
        >
          <slot
            :name="name"
            v-bind="scope"
            :item="item"
            :index="index"
          />
        </template>
      </DragItem>
      <!-- @slot use for swapping inside list -->
      <DragItem
        v-if="showPlaceholderMove"
        ref="placeholderMoveEl"
        key="drag-item--placeholder--move"
        :tag="childTag"
        class="placeholder-move"
      >
        <slot
          name="placeholder-move"
          :data="draggingItem.data"
        />
      </DragItem>
      <!-- @slot use for swapping outside list -->
      <DragItem
        v-if="showPlaceholderAdd"
        ref="placeholderAddEl"
        key="drag-item--placeholder--add"
        :tag="childTag"
        class="placeholder-add"
      >
        <slot
          name="placeholder-add"
          :data="draggingItem.data"
        />
      </DragItem>
      <!-- index + 1 for placeholder -->
      <DragItem
        v-for="(item, index) in itemsAfterPlaceholder"
        :key="idAdapter(item)"
        :data-transfer="{ index: index + 1 + itemsBeforePlaceholder.length, value: item }"
        :data-index="index + 1 + itemsBeforePlaceholder.length"
        :data-group="group"
        :group="group"
        :accept-data="acceptData"
        :trigger-move="triggerMove"
        :tag="childTag"
        @dragstart="dragstart"
        @dragentered="dragentered"
      >
        <template
          v-for="name of Object.keys($slots)"
          #[name]="scope"
        >
          <slot
            :name="name"
            v-bind="scope"
            :item="item"
            :index="index + 1 + itemsBeforePlaceholder.length"
          />
        </template>
      </DragItem>
    </template>
    <DragItem
      v-for="(item, index) in list"
      v-else
      :key="idAdapter(item)"
      :data-transfer="{ index, value: item }"
      :group="group"
      :trigger-move="triggerMove"
      :accept-data="acceptData"
      :handle="handle"
      :tag="childTag"
      @dragstart="dragstart"
      @dragentered="dragentered"
    >
      <template
        v-for="name of Object.keys($slots)"
        #[name]="scope"
      >
        <slot
          :name="name"
          v-bind="scope"
          :item="item"
          :index="index"
        />
      </template>
    </DragItem>
  </transition-group>
</template>
<script>
import {ref, computed, reactive} from 'vue'
import {DnDState, DragListState} from './DnDStore'
import DragItem from './DragItem'
export default {
  components: {DragItem},
  props: {
    list: {
      type: Array,
      required: true
    },
    /** func to get key of drag elements */
    idAdapter: {
      type: Function,
      default: (item) => (item)
    },
    /** HTML tag for draglist */
    tag: {
      type: String,
      default: 'div'
    },
    /** HTML tag for dragitem */
    childTag: {
      type: String,
      default: 'div'
    },
    /** DragItem prop */
    handle: String,
    /** DragItem prop */
    triggerMove: String,
    group: String,
    acceptData: {
      type: Function,
      default: () => {}
    },
    /** if mode == 'cut', remove orginal element */
    mode: {
      type: String,
      default: 'copy'
    }
  },
  setup(props, {emit, slots}) {
    const listEl = ref(null)
    // draggingOver listEl
    const listBeingDraggedOver = ref(null)
    // currentIndex for hanlding move immediate only
    const draggingItem = reactive({inProgress: false, originalIndex: -1, currentIndex: -1, data: null})
    // index of hovering element
    const placeholderIndex = ref(-1)
    const enteringRef = ref(null)
    const hasPlaceholderMoveSlot = Object.keys(slots).includes('placeholder-move')
    const hasPlaceholderAddSlot = Object.keys(slots).includes('placeholder-add')
    // item events
    const dragstart = (e) => {
      // user can select text then drag even if draggable = false
      if (!e.target.draggable) return
      const payload = JSON.parse(e.dataTransfer.getData('text'))
      // init state
      Object.assign(draggingItem, {inProgress: true, originalIndex: payload.index, currentIndex: payload.index, data: payload})
      DragListState.id = id
      placeholderIndex.value = payload.index
      console.log('dragstart', `placeholderIndex: ${payload.index}`, props.list[0])
    }

    const dummyEl = ref(null)
    function dragover (e) {
      if (props.group !== DnDState.group) return
      // get closest drag element
      const dragItemElTarget = e.target.nodeType === 1 ? e.target.closest('.drag-container') : e.target.parentElement.closest('.drag-container')
      // stop update enteringRef if in transition
      // fast moving causes sometimes e.target is listEl. So dragItemElTarget would be null
      if (dragItemElTarget && !dragItemElTarget.classList.contains('drag-list--move')) {
        if (enteringRef.value !== dragItemElTarget) {
          const index = dragItemElTarget.dataset.index
          // run once in draglist
          // if (enteringRef.value === null && !isNaN(index) && !(dragItemElTarget.classList.contains('placeholder-move') || dragItemElTarget.classList.contains('placeholder-add'))) {
          //   console.log('+1', props.list[0], index, dragItemElTarget, dragItemElTarget.dataset.index)
          //   placeholderIndex.value = Number(index) + 1
          // }
          enteringRef.value = dragItemElTarget
          console.log('over', dragItemElTarget, props.list[0], placeholderIndex.value, index, dragItemElTarget.dataset.index)
        }

        if (dragItemElTarget.dataset.index === '0') {
          const {width, height, top, left} = dragItemElTarget.getBoundingClientRect()
          const center = {x: width / 2 + left, y: height / 2 + top}
          const distanceToFirstItem = Math.sqrt(Math.pow(center.x - e.clientX, 2) + Math.pow(center.y - e.clientY, 2))
          const dummyElRect = dummyEl.value.getBoundingClientRect()
          const dummyCenterPosition = {x: dummyElRect.width / 2 + dummyElRect.left, y: dummyElRect.height / 2 + dummyElRect.top}
          const distanceToDummyEl = Math.sqrt(Math.pow(dummyCenterPosition.x - e.clientX, 2) + Math.pow(dummyCenterPosition.y - e.clientY, 2))
          if (distanceToDummyEl <= distanceToFirstItem) {
            placeholderIndex.value = 0
            console.log('set 0')
          }
        }
        if (dragItemElTarget.dataset.index === '1' && itemsBeforePlaceholder.value.length === 0) {
          const {width, height, top, left} = dragItemElTarget.getBoundingClientRect()
          const center = {x: width / 2 + left, y: height / 2 + top}
          const distanceToFirstItem = Math.sqrt(Math.pow(center.x - e.clientX, 2) + Math.pow(center.y - e.clientY, 2))
          const dummyElRect = dummyEl.value.getBoundingClientRect()
          const dummyCenterPosition = {x: dummyElRect.width / 2 + dummyElRect.left, y: dummyElRect.height / 2 + dummyElRect.top}
          const distanceToDummyEl = Math.sqrt(Math.pow(dummyCenterPosition.x - e.clientX, 2) + Math.pow(dummyCenterPosition.y - e.clientY, 2))
          if (distanceToFirstItem < distanceToDummyEl) {
            placeholderIndex.value = 1
            console.log('set 1')
          }
        }
      }
    }
    function dragenter (e) {
      // init list with 0 item
      if (props.list.length === 0 && !listBeingDraggedOver.value
       && !DnDState.ref.contains(e.target)
        && DnDState.group === props.group) {
        console.log('list dragenter')
        placeholderIndex.value = 0
        listBeingDraggedOver.value = true
        draggingItem.data = DnDState.data
        e.stopPropagation()
      }
    }

    // this fire before list's dragover
    function dragentered({detail: payload}) {
      // stop if target element is moving
      // inTransition can't stop if directly dragenter children of target; cause bug in safari
      if (payload.ref.classList.contains('drag-list--move')) {console.log('intransition', inTransition.value);return}
      // prevent drag into its nested list
      const closestList = payload.ref.closest('.drag-list')
       if (DnDState.ref.contains(closestList)) {
         console.log('prevent bubbled from nested list')
         return
       }
      // dragenter from outside source
      if (!draggingItem.inProgress) {
          draggingItem.data = DnDState.data
      }
      listBeingDraggedOver.value = true
      // move with placeholder
      if (showPlaceholderMove.value || showPlaceholderAdd.value) {
        // enter from placeholder
        if (enteringRef.value === placeholderMoveEl.value?.$el || enteringRef.value === placeholderAddEl.value?.$el) {
          placeholderIndex.value = payload.index
          console.log('placeholder', placeholderIndex.value, payload.index, enteringRef.value, props.list[0])
        } else {
          console.log('# entering ph:', placeholderIndex.value, 'item index:',payload.index, props.list[0])
          if (placeholderIndex.value > payload.index) {
            placeholderIndex.value = payload.index + 1
          } else {
            placeholderIndex.value = payload.index
          }
          console.log('after enter. ph:', placeholderIndex.value)
        }
        // ?
        enteringRef.value = payload.ref
        payload.event.stopPropagation()
        return
      }
      // move item immediately
      if (!hasPlaceholderMoveSlot && draggingItem.inProgress && draggingItem.currentIndex !== payload.index) {
        console.log('move immediate',draggingItem.currentIndex, payload.index)
        array_move(props.list, draggingItem.currentIndex, payload.index, false)
        // update index of dragging element
        draggingItem.currentIndex = payload.index
        Object.assign(DnDState, {dropId: id})
      }
      // add item but no placehoder-slot
      if (!hasPlaceholderAddSlot && !draggingItem.inProgress) {
        console.warn('DragList should be provided placeholder-add slot')
      }
      payload.event.stopPropagation()
    }
    const itemsBeforePlaceholder = computed(() => {
      return props.list.slice(0, placeholderIndex.value)
    })
    const itemsAfterPlaceholder = computed(() => {
      return props.list.slice(placeholderIndex.value)
    })
    const showPlaceholderMove = computed(() => {
      const res = hasPlaceholderMoveSlot && draggingItem.inProgress && listBeingDraggedOver.value
      console.log('showPlaceholderMove:', res, 'dragging:', draggingItem.inProgress, props.list[0])
      return res
    })
    const showPlaceholderAdd = computed(() => {
      const res = hasPlaceholderAddSlot && !draggingItem.inProgress && listBeingDraggedOver.value
      console.log('showPlaceholderAdd:', res, 'dragging:', draggingItem.inProgress, props.list[0])
      return res
    })
    // list events
    const id = (Date.now() + Math.random()).toString(36)
    function dragend (e) {
      console.log('dragend', e, props.list[0], DnDState.success, draggingItem.inProgress, DnDState.success && props.mode === 'cut' && draggingItem.inProgress)
      if (draggingItem.inProgress && DnDState.success && props.mode === 'cut' && DnDState.dropId !== id) {
        const clone = props.list
        clone.splice(draggingItem.originalIndex, 1)
        emit('update:list', clone)
      }
      draggingItem.inProgress = false
      draggingItem.originalIndex = -1
      listBeingDraggedOver.value = false
      enteringRef.value = null
      placeholderIndex.value = -1
    }
    const dataAllowed = computed(() => {
      return props.acceptData(DnDState.data)
    })
    function drop (e) {
      // remember that we may drop on placeholder
      console.log('drop not allowed', dataAllowed.value === false || DnDState.group !== props.group, e)
      if (dataAllowed.value === false || DnDState.group !== props.group) return
      console.log(props.list[0], showPlaceholderMove.value, showPlaceholderAdd.value, !showPlaceholderMove.value && !showPlaceholderAdd.value)
      if (!showPlaceholderMove.value && !showPlaceholderAdd.value) {
        console.log('drop fail', props.list[0])
        DnDState.success = false
      } else {
        // though we set success as true in DragItem's drop but users may drop on
        // positions belong to list only
        DnDState.success = true
      }
      // handle add el from other list
      if (showPlaceholderAdd.value) {
        console.log('drop add', placeholderIndex.value, props.list[0])
        const dataTransfer = JSON.parse(e.dataTransfer.getData('text'))
        const clone = props.list
        clone.splice(placeholderIndex.value, 0, dataTransfer.value)
        emit('update:list', clone)
        listBeingDraggedOver.value = false
        enteringRef.value = null
        Object.assign(DnDState, {dropId: id})
        e.stopPropagation()
      }
      // handle move el inside list
      if (showPlaceholderMove.value) {
        console.log('drop lazy from', e, draggingItem.currentIndex, `to ${placeholderIndex.value}`, props.list[0])
        if (placeholderIndex.value < draggingItem.currentIndex)
          array_move(props.list, draggingItem.currentIndex, placeholderIndex.value, false)
        // -1 in case of move el up
        if (placeholderIndex.value > draggingItem.currentIndex)
          array_move(props.list, draggingItem.currentIndex, placeholderIndex.value - 1, false)
        // set inProgress as false to prevent remove el when drop success in dragend
        draggingItem.inProgress = false
        Object.assign(DnDState, {dropId: id})
        e.stopPropagation()
      }
    }
    const inTransition = ref(false)
    function setTransitionState (val) {
      // console.log('setTransition', val)
      inTransition.value = val
    }
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    function dragleave (e) {
      // move back to original if drag out of list or cancel
      // safari always return relatedTarget as null so we use elementFromPoint instead
      if (isSafari) {
        const mouseEl = document.elementFromPoint(e.clientX, e.clientY)
        const closestList =  mouseEl && mouseEl.nodeType === 1 ? mouseEl.closest('.drag-list') : mouseEl?.parentElement.closest('.drag-list')

        if (listBeingDraggedOver.value && (
          !listEl.value.$el.contains(mouseEl) // leave to outside
          || (closestList // leave to other el's nested list
              && !DnDState.ref.contains(mouseEl) // prevent leave to inside dragging el
              && listEl.value.$el !== closestList
              && closestList.id !== DragListState.id // there are chances dragleave el from nested one to parent relatedTarget was original list itself
              && closestList.dataset.group === props.group
            )
          )
        ) {
          handler()
        }
        return
      }
      const closestList =  e.relatedTarget && e.relatedTarget.nodeType === 1 ? e.relatedTarget.closest('.drag-list') : e.relatedTarget?.parentElement?.closest('.drag-list')
      if (listBeingDraggedOver.value && (
          !listEl.value.$el.contains(e.relatedTarget) // leave to outside
          || (closestList // leave to other el's nested list
              && !DnDState.ref.contains(e.relatedTarget) // prevent leave to inside dragging el
              && listEl.value.$el !== closestList
              && closestList.id !== DragListState.id // there are chances dragleave el from nested one to parent relatedTarget was original list itself
              && closestList.dataset.group === props.group
            )
          )
        ) {
       console.log('LEFT', props.list[0], listEl.value.$el, e.target, e.relatedTarget, DragListState.id)
        handler()
        e.stopPropagation()
      }
      function handler () {
        // firefox will fire dragenter and dragleave forever
        // if dragging at border of list when list is in transition
        if (!inTransition.value && draggingItem.originalIndex > -1) {
          array_move(props.list, draggingItem.currentIndex, draggingItem.originalIndex, false)
          draggingItem.currentIndex = draggingItem.originalIndex
        }
        listBeingDraggedOver.value = false
        enteringRef.value = null
        console.log('leave', e, showPlaceholderMove.value, props.list[0])
      }
    }
    const placeholderMoveEl = ref(null)
    const placeholderAddEl = ref(null)

    return { id, dragenter, dummyEl, listBeingDraggedOver, dragover, placeholderMoveEl, placeholderAddEl, setTransitionState, draggingItem, drop, showPlaceholderMove, showPlaceholderAdd, listEl, placeholderIndex, dragentered, dragstart, dragleave, dragend, itemsBeforePlaceholder, itemsAfterPlaceholder}
  }
}
function array_move(arr, oldIndex, newIndex, allowNegative = true) {
  if (!allowNegative && (oldIndex < 0 || newIndex < 0)) return
  console.log('move from', oldIndex, 'to', newIndex)
        while (oldIndex < 0) {
            oldIndex += arr.length;
        }
        while (newIndex < 0) {
            newIndex += arr.length;
        }
        if (newIndex >= arr.length) {
            let k = newIndex - arr.length + 1;
            while (k--) {
                arr.push(undefined);
            }
        }
        arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
        return arr; // for testing purposes
    }
</script>
<style scoped>
.drag-list--move {
  transition: transform 0.2s ease-out;
}
</style>
