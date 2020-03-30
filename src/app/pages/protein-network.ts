export interface ProteinGroup {
  id: number;
  name: string;
  effects?: Effect[];
  x?: number;
  y?: number;
}

export interface Effect {
  id: number;
  name: string;
  proteinGroups?: ProteinGroup[];
  x?: number;
  y?: number;
}

export interface Edge {
  proteinGroupId: number;
  effectId: number;
}

export class ProteinNetwork {

  constructor(public proteinGroups: ProteinGroup[], public effects: Effect[], public edges: Edge[]) {
  }

  public loadPositions() {
    const savedPositions = localStorage.getItem('positions');
    if (!savedPositions) {
      return;
    }
    const nodePositions = JSON.parse(savedPositions);
    this.proteinGroups.forEach((node) => {
      const nodePosition = nodePositions[`pg${node.id}`];
      if (nodePosition) {
        node.x = nodePosition.x;
        node.y = nodePosition.y;
      }
    });
    this.effects.forEach((node) => {
      const nodePosition = nodePositions[`eff${node.id}`];
      if (nodePosition) {
        node.x = nodePosition.x;
        node.y = nodePosition.y;
      }
    });
  }

  public getProteinGroup(id: number): ProteinGroup {
    return this.proteinGroups.find((pg) => pg.id === id);
  }

  public getEffect(id: number): Effect {
    return this.effects.find((eff) => eff.id === id);
  }

  public linkNodes() {
    this.proteinGroups.forEach((pg) => {
      pg.effects = [];
    });
    this.effects.forEach((eff) => {
      eff.proteinGroups = [];
    });
    this.edges.forEach((edge) => {
      const proteinGroup = this.getProteinGroup(edge.proteinGroupId);
      const effect = this.getEffect(edge.effectId);
      if (proteinGroup && effect) {
        proteinGroup.effects.push(effect);
        effect.proteinGroups.push(proteinGroup);
      }
    });
  }

}
