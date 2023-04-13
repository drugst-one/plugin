import {Injectable} from '@angular/core';
import {LegendContext} from '../../interfaces';

@Injectable({
  providedIn: 'root'
})
export class LegendService {

  constructor() {
  }

  private default_delete = ['foundNode', 'foundDrug', 'seedNode', 'default', 'defaultDisorder', 'connectorNode'];
  private context = [];

  private contextNodeGroupsToDelete = {
    adjacentDrugs: ['foundNode', 'seedNode', 'default', 'defaultDisorder', 'connectorNode'],
    adjacentDisorders: ['foundDrug', 'foundNode', 'seedNode', 'default', 'connectorNode'],
    drugTarget: ['foundDrug', 'seedNode', 'default', 'defaultDisorder'],
    drug: ['foundNode', 'seedNode', 'default', 'defaultDisorder'],
    seeds: ['default', 'foundNode', 'foundDrug', 'defaultDisorder']
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
