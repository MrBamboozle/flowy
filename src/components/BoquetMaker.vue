<template>
<div class="container">
  <div class="flowers">
    <img src="../assets/rose-1.png"/>
    <img src="../assets/rose-2.png"/>
    <img src="../assets/rose-3.png"/>
    <button @click="addRose">Add</button>
    <button @click="removeRose">Remove</button>
  </div>
  <div class="grid">
    <svg id="hex-grid">
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



@Component({})
export default class BoquetMaker extends Vue {

  private grids: any[][] = [
    [{x: 0, y: 0}],
    [{x: 0, y: 0}, {x: 1, y: 0}],
    [{x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}],
    [{x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}],
  ] 

  private roseCounter = 0

  @Watch('roseCounter') onRoseCounterChange(newCounter: number) {
    console.log('wut')
    this.constructGrid(newCounter)
  }
  

  mounted() {

    this.constructGrid(this.roseCounter)


    // d3.selectAll("polygon")
    //   .on("mouseenter", (_, i, n) => {
    //     this.onMouseOver(n[i])
    //   })
  }

  private constructGrid(number: number): void {
    const Hex = Honeycomb.extendHex({ size: 30 })
    const Grid = Honeycomb.defineGrid(Hex)
    // get the corners of a hex (they're the same for all hexes created with the same Hex factory)
    const corners = Hex().corners()

    // const grid = Grid.rectangle({ width: 10, height: 10 })
    const grid = Grid(this.grids[number])
    const svg = d3.select("#hex-grid")
      .attr("width", "100%")
      .attr("height", "100%")

    svg.selectAll("*").remove()

    svg.selectAll("text")
      .data(grid as any[])
      .enter().append("text")
      .text(d => d.x + "," + d.y)
      .attr("transform", d => {
        const { x, y } = d.toPoint()
        return "translate(" + (x+20) + "," + (y+20) + ")"
      })
      
    svg.selectAll("polygon")
      .data(grid as any[])
      .enter().append("polygon")
      .attr("points", d => corners.map(({ x, y }) => `${x},${y}`).join(' '))
      .attr("transform", d => {
        const { x, y } = d.toPoint()
        return "translate(" + x + "," + y + ")"
      })
      .attr("fill", "rgba(0,0,0,0.0)")
      .attr("stroke", "black")
      .attr("stroke-width", d => 1)
      .on("mouseenter", d => {
        console.log(d.x, d.y)
        // d3.select(d).attr("fill", "red")  

      })
  }

  onMouseOver(element) {
    console.log('element', d3.select(element))
    d3.select(element).attr("fill", "red")  
  }

  addRose() {
    if(this.roseCounter < 3)
      this.roseCounter ++
  }
  removeRose() {
    if(this.roseCounter > 0)
      this.roseCounter --
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
    height:300px;
  }
}
</style>
