export interface DynamicGrid {
  hexes: Hex[];
  orientation: string;
  ammount: number;
}

export interface Hex {
  id: number;
  x: number;
  y: number;
  rose: Rose | undefined;
}

export interface Rose {
  asset: string;
  id: number;
}

export class GridGenerator {
  public getDynamicGrids(amount: number): DynamicGrid[] {
    const dynamicGrids: DynamicGrid[] = []

    

    return dynamicGrids
  }
}