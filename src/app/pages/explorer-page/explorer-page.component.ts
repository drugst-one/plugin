import {AfterViewInit, Component, ElementRef, OnInit, ViewChild, Output, EventEmitter} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Effect, ProteinGroup, ProteinNetwork} from '../protein-network';
import {HttpClient} from '@angular/common/http';
import {ApiService} from '../../api.service';
import {AnalysisService} from '../../analysis.service';

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

  public baitProteins: Array<{ checked: boolean; data: Effect }> = [];

  public proteinData: ProteinNetwork;

  public filteredProteins = [];
  public proteinGroups: any;
  public effects: any;
  public edges: any;

  private network: any;
  private nodeData: { nodes: any, edges: any } = {nodes: null, edges: null};

  private networkData: any = [];

  private seed = 1;  // TODO: Remove this

  private dumpPositions = false;
  public physicsEnabled = false;


  public queryItems = [];
  public showAnalysisDialog = false;


  @ViewChild('network', {static: false}) networkEl: ElementRef;

  constructor(private http: HttpClient,
              private route: ActivatedRoute,
              private router: Router,
              private api: ApiService,
              public analysis: AnalysisService) {
    this.geneNames.push('IFI16');
    this.proteinNames.push('Gamma-interface-inducible protein 16');
    this.proteinACs.push('Q16666');

    this.route.queryParams.subscribe(async (params) => {
      this.dumpPositions = params.dumpPositions;
      this.physicsEnabled = !!this.dumpPositions;

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
        // TODO Also highlight node when reloading the page/sharing the URL
        return;
      }

      // We have a new proteinGroup id, so we need to load it and show the modal...

      this.proteinGroup = proteinGroup;

      // TODO: Perform call here for 'proteinGroup'...
      // this.zoomToNode(proteinGroup)
      this.showDetails = true;
    });

    this.analysis.subscribe((protein, selected) => {
      const nodeId = `pg_${protein.groupId}`;
      if (selected) {
        const node = this.nodeData.nodes.get(nodeId);
        if (node) {
          node.color = '#c42eff';
          this.nodeData.nodes.update(node);
        }
      } else {
        const node = this.nodeData.nodes.get(nodeId);
        if (node) {
          node.color = '#e2b600';
          this.nodeData.nodes.update(node);
        }
      }
    });
  }

  ngOnInit() {
  }


  async ngAfterViewInit() {
    if (!this.network) {
      await this.createNetwork();
    }
  }

  fillQueryItems() {
    this.queryItems = this.filteredProteins;
  }

  private async getNetwork() {
    const data: any = await this.api.getNetwork();
    this.proteinGroups = data.proteinGroups;
    this.effects = data.effects;
    this.edges = data.edges;
  }

  public reset(event) {
    const checked = event.target.checked;
    this.baitProteins.forEach(item => item.checked = checked);
    this.filterNodes();
  }

  private zoomToNode(id: string) {
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

  public async openSummary(groupId: string, zoom: boolean) {
    await this.router.navigate(['explorer'], {queryParams: {proteinGroup: groupId}});
    if (zoom) {
      this.zoomToNode(this.proteinGroup);
    }
  }

  public async closeSummary() {
    await this.router.navigate(['explorer']);
  }


  private async createNetwork() {
    await this.getNetwork();
    this.proteinData = new ProteinNetwork(this.proteinGroups, this.effects, this.edges);
    if (!this.dumpPositions) {
      await this.proteinData.loadPositions(this.http);
    }
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
        enabled: this.physicsEnabled,
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
        this.openSummary(id[0], false);
      }
    });

    if (this.dumpPositions) {
      this.network.on('stabilizationIterationsDone', () => {
        console.log(JSON.stringify(this.network.getPositions()));
      });
      this.network.stabilize();
    }

    if (this.proteinGroup) {
      this.zoomToNode(this.proteinGroup);
    }

    this.filteredProteins = this.proteinGroups;
    this.fillQueryItems();

  }


  public async filterNodes() {
    const visibleIds = new Set<string>(this.nodeData.nodes.getIds());

    const removeIds = new Set<string>();
    const addNodes = new Map<string, Node>();

    const showAll = !this.baitProteins.find((eff) => eff.checked);
    console.log(showAll);

    const connectedProteinGroupIds = new Set<number>();

    this.baitProteins.forEach((bait) => {
      const nodeId = `eff_${bait.data.name}`;
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
    this.filteredProteins = [];
    for (const proteinGroup of this.proteinData.proteinGroups) {
      const nodeId = `pg_${proteinGroup.groupId}`;
      const contains = connectedProteinGroupIds.has(proteinGroup.id);
      const found = visibleIds.has(nodeId);
      if (contains) {
        this.filteredProteins.push(proteinGroup);
      }
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
    this.fillQueryItems();
  }


  public updatePhysicsEnabled() {
    this.network.setOptions({
      physics: {enabled: this.physicsEnabled},
    });
  }

  private mapProteinGroupToNode(proteinGroup: ProteinGroup): any {
    let color = '#e2b600';
    if (this.analysis.inSelection(proteinGroup)) {
      color = '#c42eff';
    }
    return {
      id: `pg_${proteinGroup.groupId}`,
      label: `${proteinGroup.name}`,
      size: 10, font: '5px', color, shape: 'ellipse', shadow: false,
      x: proteinGroup.x,
      y: proteinGroup.y
    };
  }

  private mapEffectToNode(effect: Effect): any {
    return {
      id: `eff_${effect.name}`,
      label: `${effect.name}`,
      size: 10, color: '#118AB2', shape: 'box', shadow: true, font: {color: '#FFFFFF'},
      x: effect.x,
      y: effect.y
    };
  }

  private mapEdge(edge: any): any {
    return {from: `pg_${edge.groupId}`, to: `eff_${edge.effectName}`, color: {color: '#afafaf', highlight: '#854141'}};
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

  // Selection
  // TODO: Improve usage of group ids, revise this after models have been changed to just protein

  inSelection(groupIdStr: string): boolean {
    if (!this.proteinData || !groupIdStr) {
      return false;
    }
    const groupId = Number(groupIdStr.split('_')[1]);
    const protein = this.proteinData.getProteinGroup(groupId);
    return this.analysis.inSelection(protein);
  }

  addToSelection(groupIdStr: string) {
    if (!groupIdStr) {
      return;
    }
    const groupId = Number(groupIdStr.split('_')[1]);
    const protein = this.proteinData.getProteinGroup(groupId);
    this.analysis.addProtein(protein);
  }

  removeFromSelection(groupIdStr: string) {
    if (!groupIdStr) {
      return;
    }
    const groupId = Number(groupIdStr.split('_')[1]);
    const protein = this.proteinData.getProteinGroup(groupId);
    this.analysis.removeProtein(protein);
  }

}
