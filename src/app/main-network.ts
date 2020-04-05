import {HttpClient} from '@angular/common/http';
import {ProteinViralInteraction, ViralProtein, Protein} from './interfaces';

export function getDatasetFilename(dataset: Array<[string, string]>): string {
  return `network-${JSON.stringify(dataset).replace(/[\[\]\",]/g, '')}.json`;
}

export class ProteinNetwork {

  constructor(public proteins: Protein[], public effects: ViralProtein[], public edges: ProteinViralInteraction[]) {
  }

  public async loadPositions(http: HttpClient, dataset: Array<[string, string]>) {
    const nodePositions = await http.get(`assets/positions/${getDatasetFilename(dataset)}`).toPromise();
    this.proteins.forEach((node) => {
      const nodePosition = nodePositions[`pg_${node.proteinAc}`];
      if (nodePosition) {
        node.x = nodePosition.x;
        node.y = nodePosition.y;
      }
    });
    this.effects.forEach((node) => {
      const nodePosition = nodePositions[`eff_${node.effectName}_${node.virusName}_${node.datasetName}`];
      if (nodePosition) {
        node.x = nodePosition.x;
        node.y = nodePosition.y;
      }
    });
  }

  public getProtein(ac: string): Protein | undefined {
    return this.proteins.find((p) => p.proteinAc === ac);
  }

  public getEffect(name: string, virus: string, dataset: string): ViralProtein | undefined {
    return this.effects.find((eff) => eff.effectName === name && eff.virusName === virus && eff.datasetName === dataset);
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
      const effect = this.getEffect(edge.effectName, edge.virusName, edge.datasetName);
      if (proteinGroup && effect) {
        proteinGroup.effects.push(effect);
        effect.proteins.push(proteinGroup);
      }
    });
  }

}
