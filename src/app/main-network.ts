import {HttpClient} from '@angular/common/http';
import {ProteinProteinInteraction, Protein, getProteinNodeId} from './interfaces';

export function getDatasetFilename(dataset: Array<[string, string]>): string {
  return `network-${JSON.stringify(dataset).replace(/[\[\]\",]/g, '')}.json`;
}

export class ProteinNetwork {

  constructor(public proteins: Protein[], public edges: ProteinProteinInteraction[]) {
  }

  public async loadPositions(http: HttpClient, dataset: Array<[string, string]>) {
    const nodePositions = await http.get(`assets/positions/${getDatasetFilename(dataset)}`).toPromise();
    this.proteins.forEach((node) => {
      const nodePosition = nodePositions[getProteinNodeId(node)];
      if (nodePosition) {
        node.x = nodePosition.x;
        node.y = nodePosition.y;
      }
    });
  }

  public getProtein(ac: string): Protein | undefined {
    return this.proteins.find((p) => p.proteinAc === ac);
  }

  public linkNodes() {
    this.proteins.forEach((pg) => {
      pg.interactions = [];
    });
    this.edges.forEach((edge) => {
      const protein1 = this.getProtein(edge.from);
      const protein2 = this.getProtein(edge.to);
      if (protein1 && protein2) {
        protein1.interactions.push(protein2);
        protein2.interactions.push(protein1);
      }
    });
  }

}
