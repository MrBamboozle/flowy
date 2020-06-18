<template>
<div class="container">
  <!-- <div class="flowers">
    <img src="../assets/rose-1.png" class="rose"/>
    <img src="../assets/rose-2.png" class="rose"/>
    <img src="../assets/rose-3.png" class="rose"/>
  </div> -->
    <!-- <button @click="addRose">Add</button>
    <button @click="removeRose">Remove</button> -->
  <div class="grid">
    <svg id="hex-grid" ref="hex-grid">
      <g class="available-roses">
        <image v-for="(rose, index) in roses" :href="rose.asset" :key="rose.id" :roseId="rose.id" :width="'64px'" :x="sourceRoseX(index)" class="initial-rose"/>
      </g>
      <rect class="dropzone" width="600" height="300" x="150" y="450" stroke="black" stroke-width="1" fill="rgba(0,0,0,0)"></rect>
      <g class="dropped-roses"></g>
    </svg>
  </div>

  {{roseCounter}}
  {{grids[roseCounter]}}
</div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import * as Honeycomb from 'honeycomb-grid'
import * as d3 from "d3"
import gsap from 'gsap'
import {Draggable, TweenLite} from "gsap/all";
import * as _ from "lodash"

interface Rose {
  asset: string;
  id: number;
}

interface DynamicGrid {
  hexes: Hex[];
  orientation: string;
  ammount: number;
}

interface Hex {
  id: number;
  x: number;
  y: number;
  rose: Rose | undefined;
}

@Component({})
export default class BoquetMaker extends Vue {

  draggedRose: any 
  previewElement: any

  dragging = false
  insideDropzone = false

  dropX: any
  dropY: any

  private roseCounter = 0

  get currentGrid(): DynamicGrid {
    return this.grids[this.roseCounter]
  }

  get xOffset(): number {
    const svg = this.$refs["hex-grid"] as HTMLElement
    return (svg.clientWidth / 2) - (this.currentGrid.ammount * 15)
  }

  get yOffset(): number {
    return 600
  }

  get gridAndCorners() {
    const Hex = Honeycomb.extendHex({ size: 30, orientation: this.currentGrid.orientation})
    const Grid = Honeycomb.defineGrid(Hex)
    const corners = Hex().corners()

    const grid = Grid(this.currentGrid.hexes, this.currentGrid.orientation)

    return {grid, corners}
  }



  private grids: DynamicGrid[] = [
    {hexes: [], orientation: 'flat', ammount: 0},
    {hexes: [{x: 0, y: 0, rose: undefined, id: 1}], orientation: 'flat', ammount: 1},
    {hexes: [{x: 0, y: 0, rose: undefined, id: 1}, {x: 1, y: 0, rose: undefined, id: 2}], orientation: 'pointy', ammount: 2},
    {hexes: [{x: 0, y: 0, rose: undefined, id: 1}, {x: 1, y: 0, rose: undefined, id: 2}, {x: 2, y: 0, rose: undefined, id: 3}], orientation: 'flat', ammount: 3},
    {hexes: [{x: 1, y: -1, rose: undefined, id: 3}, {x: 0, y: 0, rose: undefined, id: 1}, {x: 1, y: 0, rose: undefined, id: 2}, {x: 2, y: 0, rose: undefined, id: 3}], orientation: 'flat', ammount: 3},
  ] 

  private roses: Rose[] = [
    { asset: require("../assets/rose-1.png"), id: 1},
    { asset: require("../assets/rose-2.png"), id: 2},
    { asset: require("../assets/rose-3.png"), id: 3}
  ]

  mounted() {
    gsap.registerPlugin(Draggable)
    // this.appendAvailableRoses()
    this.createDropzone()
    
    Draggable.create(".initial-rose", {
      type:"x,y",
      bounds:"#hex-grid",
      onPress: this.onDragInitialRose,
      onDragEnd: this.onDropInitialRose,
      onDrag: this.testRectOverlap
    })
  }

  testRectOverlap(el) {
    if(Draggable.hitTest(this.draggedRose, '.dropzone', 50)) {
      if(!this.insideDropzone) {
        this.insideDropzone = true
        this.addHex()

        const {grid, corners} = this.gridAndCorners
  
        this.drawBouquet(grid, corners)

        const gridElement = grid.find((h) => h.rose === undefined)
        const { x, y } = gridElement.toPoint()

        this.dropX = x + this.xOffset
        this.dropY = y + this.yOffset
        this.appendPreviewToGrid(this.draggedRose, grid, this.dropX, this.dropY)
      } 
    } else {
      if(this.insideDropzone) {
        this.insideDropzone = false

        this.removeHex()

        const {grid, corners} = this.gridAndCorners
  
        this.drawBouquet(grid, corners)

        this.destroyPreview()
      }
    }
  }

  private createDropzone(): void {
    
    const svg = d3.select("#hex-grid")
      .attr("width", "100%")
      .attr("height", "100%")

    // svg.selectAll(".dropzone")
    //   .on("mouseleave", () => {
    //     this.insideDropzone = false
    //   })
  }

  addHex() {
    const previousHexes = [...this.currentGrid.hexes]
    this.roseCounter ++
    this.mapRosesFromPrevious(previousHexes)
  }

  removeHex() {
    const previousHexes = [...this.currentGrid.hexes]
    this.roseCounter --
    this.remapRoses(previousHexes)

  }

  private remapRoses(prevHexes: Hex[]) {
    const roses = prevHexes.filter((h) => !!h.rose).map((h) => h.rose)
    this.currentGrid.hexes.forEach((h, index) => {h.rose = roses[index]})
  }

  private mapRosesFromPrevious(hexes: Hex[]): void {
    console.log('current', JSON.stringify(this.currentGrid.hexes))
    hexes.forEach((h) => {
      const currentHex = this.currentGrid.hexes.find((ch) => ch.id === h.id)
      if(currentHex)
        currentHex.rose = h.rose
    })
  }

  private appendPreviewToGrid(el, grid, x, y) {
    const parent = el.parentElement
    const previewRose = el.cloneNode()

    previewRose.setAttribute("x", x)
    previewRose.setAttribute("y", y)
    previewRose.setAttribute("transform", "")
    previewRose.setAttribute("class", "preview-rose")
    previewRose.setAttribute("opacity", "0.5")

    parent.append(previewRose);
  }

  destroyPreview() {
    const previewElements = document.getElementsByClassName('preview-rose');
    while(previewElements.length > 0){
        previewElements[0].parentNode.removeChild(previewElements[0]);
    }
  }

  destroyElement(el) {
    const parent = el.parentElement
    parent.removeChild(el)
  }

  private onDragInitialRose(el) {
    this.dragging = true
    this.draggedRose = el.srcElement

    const clonedRose = this.cloneRose(el.srcElement)
    this.initDrag(clonedRose, this.onDragInitialRose, this.onDropInitialRose)
    this.transformToDragged(el.srcElement)
  }
  
  private cloneRose(el: any) {
    const parent = el.parentElement
    const newElement = el.cloneNode()

    parent.prepend(newElement)

    return newElement
  }

  private transformToDragged(el) {
    el.setAttribute("class", "dragged-rose")
    el.setAttribute("opacity", "0.5")
  }

  private initDrag(el, onPress, onDragEnd) {
    Draggable.create(el, {
      type:"x,y",
      bounds:"#hex-grid",
      onPress: onPress,
      onDragEnd: onDragEnd,
      onDrag: this.testRectOverlap
    })
  }

  onDropInitialRose(el: any) {
    this.dragging = false
    if(this.insideDropzone) {
      TweenLite.to(this.draggedRose, 1, 
        { duration: 0.6, opacity: 1, x: this.dropX - this.draggedRose.getAttribute("x"), y: this.dropY}
        );
      this.destroyPreview()

      const gridElement = this.currentGrid.hexes.find((h) => h.rose === undefined)
      if(gridElement) {
        gridElement.rose = this.roses.find((r) => r.id == this.draggedRose.getAttribute("roseId"))
      }

      setTimeout(() => {
        this.destroyElement(this.draggedRose)
        const {grid, corners} = this.gridAndCorners
        this.drawBouquet(grid, corners)
      }, 1000)
    } else {
      this.destroyElement(this.draggedRose)
    }
    this.insideDropzone = false
  }

  sourceRoseX(index: number): number {
    const svg = this.$refs["hex-grid"] as HTMLElement
    return index * (svg ? svg.clientWidth : 900) / this.roses.length + 20
  }


  @Watch('roseCounter') onRoseCounterChange() {
    // this.constructGrid()
  }

  

  private drawBouquet(grid: Honeycomb.Grid, corners: Honeycomb.Point[]) {
    const svg = d3.select("#hex-grid")

    svg.selectAll("polygon").remove()
    svg.selectAll("text").remove()
    svg.selectAll(".dropped-rose").remove()


    svg.selectAll("text")
      .data(grid as any[])
      .enter().append("text")
      .text(d => d.x + "," + d.y)
      .attr("transform", d => {
        const { x, y } = d.toPoint()
        return "translate(" + (x+20+this.xOffset) + "," + (y+20+this.yOffset) + ")"
      })
      
    svg.selectAll("polygon")
      .data(grid as any[])
      .enter().append("polygon")
      .attr("points", d => corners.map(({ x, y }) => `${x},${y}`).join(' '))
      .attr("transform", d => {
        const { x, y } = d.toPoint()
        return "translate(" + (x+this.xOffset) + "," + (y+this.yOffset) + ")"
      })
      .attr("fill", "rgba(0,0,0,0.0)")
      .attr("stroke", "black")
      .attr("stroke-width", d => 1)
      .filter((d) => d.rose !== undefined)

      console.log('dropped roses', svg.select(".dropped-roses").selectAll("image")  
      .data(grid as any[])
      .enter()
        .filter(d => {
          return !!d.rose
        }), grid)

    svg.select(".dropped-roses").selectAll(".dropped-rose")  
      .data(grid as any[])
      .enter()
        .filter(d => {
          return !!d.rose
        }).append("image")
      .attr("href", d => d.rose.asset)
      .attr("roseId", d => d.rose.id)
      .attr("width", d => "64px")
      .attr("class", d => "dropped-rose rose")
      .attr("transform", d => {
        const { x, y } = d.toPoint()
        return "translate(" + (x+this.xOffset) + "," + (y+this.yOffset) + ")"
      })

      Draggable.create(".dropped-rose", {
        type:"x,y",
        bounds:"#hex-grid",
        onPress: this.onDragDroppedRose,
        onDragEnd: this.onDropInitialRose,
        onDrag: this.testRectOverlap,
      })
  }

  private onDragDroppedRose(el) {
    console.log('yo')
    this.insideDropzone = true
    this.dragging = true
    this.draggedRose = el.srcElement
    this.transformToDragged(el.srcElement)
    const roseHex = this.currentGrid.hexes.find((h) => !h.rose || h.rose.id == el.srcElement.getAttribute("roseId"))
    if (roseHex)
      roseHex.rose = undefined

    const {grid, corners} = this.gridAndCorners

    const gridElement = grid.find((h) => h.rose === undefined)
    const { x, y } = gridElement.toPoint()

    this.dropX = x + this.xOffset
    this.dropY = y + this.yOffset
    this.appendPreviewToGrid(this.draggedRose, grid, this.dropX, this.dropY)
  }

  onMoveDroppedRose(el) {
    if(Draggable.hitTest(this.draggedRose, '.dropzone', 2)) {
      console.log('overlap')
    }
  }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.container {
  width: 900px;
  margin: 0 auto;

  .flowers{
    display: flex;
    justify-content: center;

    img {
      width:64px;
      height:288px;
    }
  }

  .grid{
    justify-content: center;
    height:900px;
  }
}
</style>
