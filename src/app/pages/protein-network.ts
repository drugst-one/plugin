import {HttpClient} from '@angular/common/http';

export interface ProteinGroup {
  id: number;
  name: string;
  groupId: number;
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
  groupId: number;
  effectName: string;
}

export class ProteinNetwork {

  constructor(public proteinGroups: ProteinGroup[], public effects: Effect[], public edges: Edge[]) {
  }

  public async loadPositions(http: HttpClient) {
    const nodePositions = await http.get(`assets/positions/network.json`).toPromise();
    this.proteinGroups.forEach((node) => {
      const nodePosition = nodePositions[`pg_${node.groupId}`];
      if (nodePosition) {
        node.x = nodePosition.x;
        node.y = nodePosition.y;
      }
    });
    this.effects.forEach((node) => {
      const nodePosition = nodePositions[`eff_${node.name}`];
      if (nodePosition) {
        node.x = nodePosition.x;
        node.y = nodePosition.y;
      }
    });
  }

  public getProteinGroup(id: number): ProteinGroup {
    return this.proteinGroups.find((pg) => pg.groupId === id);
  }

  public getEffect(name: string): Effect {
    return this.effects.find((eff) => eff.name === name);
  }

  public linkNodes() {
    this.proteinGroups.forEach((pg) => {
      pg.effects = [];
    });
    this.effects.forEach((eff) => {
      eff.proteinGroups = [];
    });
    this.edges.forEach((edge) => {
      const proteinGroup = this.getProteinGroup(edge.groupId);
      const effect = this.getEffect(edge.effectName);
      if (proteinGroup && effect) {
        proteinGroup.effects.push(effect);
        effect.proteinGroups.push(proteinGroup);
      }
    });
  }

}
