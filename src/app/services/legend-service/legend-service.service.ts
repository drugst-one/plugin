import { Injectable } from '@angular/core';
import { LegendContext } from '../../interfaces';

@Injectable({
  providedIn: 'root'
})
export class LegendService {

  constructor() {
  }

  private default_delete = ['foundNode', 'foundDrug', 'seedNode', 'default', 'defaultDisorder', 'overlap', 'onlyNetwork', 'onlyPathway', 'connectorNode', 'firstNeighbor'];
  public context = [];
  public networkHasConnector = false;

  private contextNodeGroupsToDelete = {
    pathway: ['foundNode', 'foundDrug', 'seedNode', 'default', 'defaultDisorder', 'connectorNode', 'firstNeighbor'],
    louvain: ['foundNode', 'foundDrug', 'seedNode', 'default', 'defaultDisorder', 'overlap', 'onlyNetwork', 'onlyPathway', 'connectorNode', 'firstNeighbor'],
    adjacentDrugs: ['foundNode', 'seedNode', 'default', 'defaultDisorder', 'overlap', 'onlyNetwork', 'onlyPathway', 'connectorNode', 'firstNeighbor'],
    adjacentDisorders: ['foundDrug', 'foundNode', 'seedNode', 'default', 'overlap', 'onlyNetwork', 'onlyPathway', 'connectorNode', 'firstNeighbor'],
    drugTarget: ['foundDrug', 'seedNode', 'default', 'defaultDisorder', 'overlap', 'onlyNetwork', 'onlyPathway', 'firstNeighbor'],
    drug: ['foundNode', 'seedNode', 'default', 'defaultDisorder', 'overlap', 'onlyNetwork', 'onlyPathway', 'firstNeighbor'],
    seeds: ['default', 'foundNode', 'foundDrug', 'defaultDisorder', 'overlap', 'onlyNetwork', 'onlyPathway', 'firstNeighbor'],
    firstNeighbor: ['foundNode', 'foundDrug', 'default', 'defaultDisorder', 'overlap', 'onlyNetwork', 'onlyPathway', 'connectorNode'],
  };

  public add_to_context(value: LegendContext) {
    if (this.context.indexOf(value) === -1) {
      this.context.push(value);
    }
  }

  public remove_from_context(value: LegendContext) {
    const idx = this.context.indexOf(value);
    if (idx > -1) {
      this.context.splice(idx, 1);
    }
  }

  public reset() {
    this.context = [];
  }

  public get_nodes_to_delete() {
    const out = [].concat(this.default_delete);
    for (const node of this.default_delete) {
      let keep = false;

      // delete connectorNodes if network does not contain any 
      if (node === 'connectorNode' && !this.networkHasConnector) {
        break;
      }

      for (const c of this.context) {
        if (this.contextNodeGroupsToDelete[c].indexOf(node) === -1) {
          keep = true;
          break;
        }
      }
      if (keep) {
        out.splice(out.indexOf(node), 1);
      }
    }
    return out;
  }


}
