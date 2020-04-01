import {HttpClient} from '@angular/common/http';

export interface Protein {
  name: string;
  proteinAc: string;
  effects?: Effect[];
  x?: number;
  y?: number;
}

export interface Effect {
  effectId: string;
  effectName: string;
  datasetName: string;
  virusName: string;
  proteins?: Protein[];
  x?: number;
  y?: number;
}

export interface Edge {
  proteinAc: string;
  effectId: string;
}

export class ProteinNetwork {

  constructor(public proteins: Protein[], public effects: Effect[], public edges: Edge[]) {
  }

  public async loadPositions(http: HttpClient) {
    const nodePositions = await http.get(`assets/positions/network.json`).toPromise();
    this.proteins.forEach((node) => {
      const nodePosition = nodePositions[`pg_${node.proteinAc}`];
      if (nodePosition) {
        node.x = nodePosition.x;
        node.y = nodePosition.y;
      }
    });
    this.effects.forEach((node) => {
      const nodePosition = nodePositions[`eff_${node.effectId}`];
      if (nodePosition) {
        node.x = nodePosition.x;
        node.y = nodePosition.y;
      }
    });
  }

  public getProtein(ac: string): Protein {
    return this.proteins.find((p) => p.proteinAc === ac);
  }

  public getEffect(name: string): Effect {
    return this.effects.find((eff) => eff.effectId === name);
  }

  public linkNodes() {
    this.proteins.forEach((pg) => {
      pg.effects = [];
    });
    this.effects.forEach((eff) => {
      eff.proteins = [];
    });
    this.edges.forEach((edge) => {
      const proteinGroup = this.getProtein(edge.proteinAc);
      const effect = this.getEffect(edge.effectId);
      if (proteinGroup && effect) {
        proteinGroup.effects.push(effect);
        effect.proteins.push(proteinGroup);
      }
    });
  }

}
