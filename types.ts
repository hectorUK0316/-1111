export interface WishData {
  title: string;
  body: string;
}

export interface TreeConfig {
  rotationSpeed: number;
  bloomIntensity: number;
  goldColor: string;
  emeraldColor: string;
}

export enum ViewState {
  INTRO = 'INTRO',
  INTERACTIVE = 'INTERACTIVE'
}

export enum TreeMorphState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE'
}
