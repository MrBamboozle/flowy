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
        <image v-for="(rose, index) in roses" :href="rose.asset" :key="rose.id" :roseId="rose.id" :width="'64px'" :x="sourceRoseX(index)" class="rose"/>
      </g>
      <rect width="600" height="300" x="150" y="450" stroke="black" stroke-width="1" fill="rgba(0,0,0,0)"></rect>
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

interface Rose {
  asset: string;
  id: number;
}

interface DynamicGrid {
  hexes: Hex[];
  orientation: string;

}

interface Hex {
  x: number;
  y: number;
  rose: Rose | undefined;
}

@Component({})
export default class BoquetMaker extends Vue {

  clonedElement: any 
  previewElement: any


  private grids: DynamicGrid[] = [
    {hexes: [], orientation: 'flat'},
    {hexes: [{x: 0, y: 0, rose: undefined}], orientation: 'flat'},
    {hexes: [{x: 0, y: 0, rose: undefined}, {x: 1, y: 0, rose: undefined}], orientation: 'pointy'},
  ] 

  private roses: Rose[] = [
    { asset: require("../assets/rose-1.png"), id: 1},
    { asset: require("../assets/rose-2.png"), id: 2},
    { asset: require("../assets/rose-3.png"), id: 3}
  ]

  cloneRose(el: any) {
    const parent = el.srcElement.parentElement
    const newElement = el.srcElement.cloneNode()

    this.clonedElement = el.srcElement

    el.srcElement.setAttribute("opacity", "0.5")

    parent.prepend(newElement);

    Draggable.create(newElement, {
      type:"x,y",
      bounds:"#hex-grid",
      onPress: this.cloneRose,
      onRelease: this.appendRoseToGrid
    });
  }

  appendRoseToGrid(el: any) {
    if(this.previewElement) {
      TweenLite.to(this.clonedElement, 1, 
        { duration: 0.6, opacity: 1, x: this.previewElement.getAttribute("x") - this.clonedElement.getAttribute("x"), y: this.previewElement.getAttribute("y") }
        );
      this.destroyPreview()

      const gridElement = this.currentGrid.hexes.find((h) => h.rose === undefined)
      if(gridElement) {
        gridElement.rose = this.roses.find((r) => r.id == this.clonedElement.getAttribute("roseId"))
      }

      this.constructGrid()
    }
    // const parent = this.clonedElement.parentElement
    // parent.removeChild(this.clonedElement)
    // this.clonedElement = undefined
  }

  destroyPreview() {
    const parent = this.previewElement.parentElement
    parent.removeChild(this.previewElement)
    this.previewElement = undefined
  }

  sourceRoseX(index: number): number {
    const svg = this.$refs["hex-grid"] as HTMLElement
    return index * (svg ? svg.clientWidth : 900) / this.roses.length + 20
  }

  private roseCounter = 0

  @Watch('roseCounter') onRoseCounterChange() {
    this.constructGrid()
  }

  get currentGrid(): DynamicGrid {
    return this.grids[this.roseCounter]
  }

  get xOffset(): number {
    const svg = this.$refs["hex-grid"] as HTMLElement
    return (svg.clientWidth / 2)
  }

  get yOffset(): number {
    return 600
  }
  
  mounted() {
    gsap.registerPlugin(Draggable)
    // this.appendAvailableRoses()
    this.constructGrid()
    
    Draggable.create(".rose", {
      type:"x,y",
      bounds:"#hex-grid",
      onPress: this.cloneRose,
      onRelease: this.appendRoseToGrid
    })
  }

  private constructGrid(): void {
    console.log('calling construct')
    const Hex = Honeycomb.extendHex({ size: 30, orientation: this.currentGrid.orientation})
    const Grid = Honeycomb.defineGrid(Hex)
    // get the corners of a hex (they're the same for all hexes created with the same Hex factory)
    const corners = Hex().corners()

    // const grid = Grid.rectangle({ width: 10, height: 10 })
    let grid = Grid(this.currentGrid.hexes)
    const svg = d3.select("#hex-grid")
      .attr("width", "100%")
      .attr("height", "100%")

    // svg.selectAll("*").remove()
    svg.selectAll("rect")
      .on("mouseenter", () => {
        if(this.clonedElement) {
          this.roseCounter ++
          
          grid = Grid(this.currentGrid.hexes)
          const gridElement = grid.find((h) => h.rose === undefined)
          const { x, y } = gridElement.toPoint()

          const parent = this.clonedElement.parentElement
          this.previewElement = this.clonedElement.cloneNode()

          this.previewElement.setAttribute("x", x+this.xOffset)
          this.previewElement.setAttribute("y", y+this.yOffset)
          this.previewElement.setAttribute("transform", "")

          parent.append(this.previewElement);

        }
      })
      .on("mouseleave", () => {
        if(this.previewElement) {
          this.roseCounter --

          this.destroyPreview()
        }
      })

    svg.selectAll("polygon").remove()
    svg.selectAll("text").remove()
    console.log('clearing rect', svg.select("rect"))


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

    svg.selectAll("image")  
      .data(grid as any[])
      .enter().append("image")
      .attr("href", d => d.rose.asset)
      .attr("roseId", d => d.rose.id)
      .attr("width", d => "64px")
      .attr("class", d => "rose")
      .attr("transform", d => {
        const { x, y } = d.toPoint()
        return "translate(" + (x+this.xOffset) + "," + (y+this.yOffset) + ")"
      })
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
