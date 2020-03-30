import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {Effect, ProteinNetwork} from '../protein-network';
import { ApiService } from '../../api.service';

declare var vis: any;

@Component({
  selector: 'app-explorer-page',
  templateUrl: './explorer-page.component.html',
  styleUrls: ['./explorer-page.component.scss'],
})
export class ExplorerPageComponent implements OnInit, AfterViewInit {

  public showDetails = false;
  public groupId = '';
  public geneNames: Array<string> = [];
  public proteinGroup = '';
  public proteinNames: Array<string> = [];
  public proteinACs: Array<string> = [];
  public baitNames: Array<string> = [];

  public baitProteins: Array<{ checked: boolean; data: Effect }> = [];

  public proteinData: ProteinNetwork;

  public proteinGroups: any;
  public effects: any;
  public edges: any;

  private network: any;
  private nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};

  private networkData: any = [];

  private seed = 1;  // TODO: Remove this

  @ViewChild('network', {static: false}) networkEl: ElementRef;

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {
    this.groupId = 'IFI16';
    this.geneNames.push('IFI16');
    this.proteinNames.push('Gamma-interface-inducible protein 16');
    this.proteinACs.push('Q16666');
    this.baitNames.push('Bait Protein 1');
    this.baitNames.push('Bait Protein 2');
    this.baitNames.push('Bait Protein 3');
    this.baitNames.push('Bait Protein 4');
    this.baitNames.push('Bait Protein 5');

    this.route.queryParams.subscribe(async (params) => {
      const proteinGroup = params.proteinGroup;
      if (!proteinGroup) {
        // In this case, the URL is just `/explorer`
        // Therefore, we do not show a modal
        this.showDetails = false;
        return;
      }

      // In this case, the URL is `/explorer/<proteinGroup>`

      if (this.proteinGroup === proteinGroup) {
        // The protein group is the same as before, so we do not need to do anything
        return;
      }

      // We have a new proteinGroup id, so we need to load it and show the modal...

      this.proteinGroup = proteinGroup;

      // TODO: Perform call here for 'proteinGroup'...
      // this.zoomToNode(proteinGroup)
      this.showDetails = true;
    });
  }

  ngOnInit() {
  }



  async ngAfterViewInit() {
    if (!this.network) {
      await this.createNetwork();
    }
  }

  private async getNetwork() {
    const data: any = await this.api.getNetwork();
    this.proteinGroups = data.proteinGroups;
    this.effects = data.effects;
    this.edges = data.edges;
  }

  public zoomToNode(id: string) {
    const coords = this.network.getPositions(id)[id];
    this.network.moveTo({
      position: {x: coords.x, y: coords.y},
      scale: 1.0,
      animation: true,
    });
  }

  public getGroupId() {
    return this.groupId;
  }

  public async openSummary(groupId: string) {
    await this.router.navigate(['explorer'], {queryParams: {proteinGroup: groupId}});
    this.zoomToNode(this.proteinGroup);
  }

  public async closeSummary() {
    await this.router.navigate(['explorer']);
  }

  private async createNetwork() {
    await this.getNetwork();
    this.proteinData = new ProteinNetwork(this.proteinGroups, this.effects, this.edges);
    this.proteinData.loadPositions();
    this.proteinData.linkNodes();

    // Populate baits
    this.proteinData.effects.forEach((effect) => {
      this.baitProteins.push({
        checked: false,
        data: effect,
      });
    });

    const {nodes, edges} = this.mapDataToNodes(this.proteinData);

    this.nodeData.nodes = new vis.DataSet(nodes);
    this.nodeData.edges = new vis.DataSet(edges);

    const container = this.networkEl.nativeElement;
    const options = {
      layout: {
        improvedLayout: false,
      },
      edges: {
        smooth: false,
      },
      physics: {
        stabilization: {
          enabled: false,
        },
      },
    };

    this.network = new vis.Network(container, this.nodeData, options);
    this.network.on('click', (properties) => {
      const id: Array<string> = properties.nodes;
      // TODO use groupID
      console.log(id);
      if (id.length > 0) {
        console.log('clicked node:', id);
        this.openSummary(id[0]);
      }
    });

    if (!localStorage.getItem('positions')) {
      this.network.on('stabilizationIterationsDone', () => {
        localStorage.setItem('positions', JSON.stringify(this.network.getPositions()));
      });
      this.network.stabilize();
    }

    if (this.proteinGroup) {
      this.zoomToNode(this.proteinGroup);
    }
  }


  public async filterNodes() {
    const visibleIds = new Set<string>(this.nodeData.nodes.getIds());

    const removeIds = new Set<string>();
    const addNodes = new Map<string, Node>();

    const showAll = !this.baitProteins.find((eff) => eff.checked);
    console.log(showAll);

    const connectedProteinGroupIds = new Set<number>();
    this.baitProteins.forEach((bait) => {
      const nodeId = `eff${bait.data.id}`;
      const found = visibleIds.has(nodeId);
      if ((bait.checked || showAll) && !found) {
        const node = this.mapEffectToNode(bait.data);
        // this.nodeData.nodes.add(node);
        addNodes.set(node.id, node);
      } else if ((!showAll && !bait.checked) && found) {
        // this.nodeData.nodes.remove(nodeId);
        removeIds.add(nodeId);
      }
      if (bait.checked || showAll) {
        bait.data.proteinGroups.forEach((pg) => {
          connectedProteinGroupIds.add(pg.id);
        });
      }
    });
    for (const proteinGroup of this.proteinData.proteinGroups) {
      const nodeId = `pg${proteinGroup.id}`;
      const contains = connectedProteinGroupIds.has(proteinGroup.id);
      const found = visibleIds.has(nodeId);
      if (contains && !found) {
        const node = this.mapProteinGroupToNode(proteinGroup);
        // this.nodeData.nodes.add(node);
        addNodes.set(node.id, node);
      } else if (!contains && found) {
        // this.nodeData.nodes.remove(nodeId);
        removeIds.add(nodeId);
      }
    }

    this.nodeData.nodes.remove(Array.from(removeIds.values()));
    this.nodeData.nodes.add(Array.from(addNodes.values()));
  }


  private mapProteinGroupToNode(proteinGroup: any): any {
    return {
      id: `pg${proteinGroup.id}`,
      label: `pg${proteinGroup.id}`,
      size: 5, color: '#ADADAD', shape: 'square', shadow: true,
      x: proteinGroup.x,
      y: proteinGroup.y
    };
  }

  private mapEffectToNode(effect: any): any {
    return {
      id: `eff${effect.id}`,
      label: `eff${effect.id}`,
      size: 10, color: '#118AB2', shape: 'circle', shadow: true,
      x: effect.x,
      y: effect.y
    };
  }

  private mapEdge(edge: any): any {
    return {from: `pg${edge.proteinGroupId}`, to: `eff${edge.effectId}`};
  }

  private mapDataToNodes(data: ProteinNetwork): { nodes: any[], edges: any[] } {
    const nodes = [];
    const edges = [];

    for (const proteinGroup of data.proteinGroups) {
      nodes.push(this.mapProteinGroupToNode(proteinGroup));
    }

    for (const effect of data.effects) {
      nodes.push(this.mapEffectToNode(effect));
    }

    for (const edge of data.edges) {
      edges.push(this.mapEdge(edge));
    }

    return {
      nodes,
      edges,
    };
  }

  // TODO: Remove this:
  private random() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

}
