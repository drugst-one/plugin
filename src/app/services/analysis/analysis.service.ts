import {Wrapper, Task, getWrapperFromNode, Node, Dataset, Tissue} from '../../interfaces';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {NetexControllerService} from '../netex-controller/netex-controller.service';
import {DrugstoneConfigService} from '../drugstone-config/drugstone-config.service';
import {NetworkHandlerService} from '../network-handler/network-handler.service';
import {ToastService} from '../toast/toast.service';
import {NodeGroup} from 'src/app/config';

export type AlgorithmType =
  'trustrank'
  | 'keypathwayminer'
  | 'multisteiner'
  | 'closeness'
  | 'degree'
  | 'proximity'
  | 'betweenness';
export type QuickAlgorithmType = 'quick' | 'super' | 'connect' | 'connectSelected';

export const algorithmNames = {
  trustrank: 'TrustRank',
  keypathwayminer: 'KeyPathwayMiner',
  multisteiner: 'Multi-Steiner',
  closeness: 'Harmonic Centrality',
  degree: 'Degree Centrality',
  proximity: 'Network Proximity',
  betweenness: 'Betweenness Centrality',
  quick: 'Simple',
  super: 'Quick-start',
  connect: 'Connect all',
  connectSelected: 'Connect selected'
};

export interface Algorithm {
  slug: AlgorithmType | QuickAlgorithmType;
  name: string;
}

export const TRUSTRANK: Algorithm = {slug: 'trustrank', name: algorithmNames.trustrank};
export const CLOSENESS_CENTRALITY: Algorithm = {slug: 'closeness', name: algorithmNames.closeness};
export const DEGREE_CENTRALITY: Algorithm = {slug: 'degree', name: algorithmNames.degree};
export const NETWORK_PROXIMITY: Algorithm = {slug: 'proximity', name: algorithmNames.proximity};
export const BETWEENNESS_CENTRALITY: Algorithm = {slug: 'betweenness', name: algorithmNames.betweenness};
export const KEYPATHWAYMINER: Algorithm = {slug: 'keypathwayminer', name: algorithmNames.keypathwayminer};
export const MULTISTEINER: Algorithm = {slug: 'multisteiner', name: algorithmNames.multisteiner};

export const MAX_TASKS = 3;

@Injectable({
  providedIn: 'any'
})
export class AnalysisService {

  private selection = 'main';

  private selectedItems = new Map<string, Wrapper>();
  private selectListSubject = new Subject<{ items: Wrapper[], selected: boolean | null }>();
  public inputNetwork = {};
  private selections = new Map<string, Map<string, Wrapper>>();

  public tokens: string[] = [];
  public viewTokens: string[] = [];
  public viewInfos = [];
  private tokensCookieKey = `drugstone-tokens-${window.location.host}`;
  private selectionsCookieKey = `drugstone-selections-${window.location.host}`;
  private tokensFinishedCookieKey = `drugstone-finishedTokens-${window.location.host}`;
  public finishedTokens: string[] = [];
  public tasks: Task[] = [];

  private intervalId: any;
  private canLaunchNewTask = true;

  private launchingQuick = false;

  private tissues: Tissue[] = [];

  private viewTokenCallback: (task: (string | null)) => void;

  private taskTokenCallback: (task: (string | null)) => void;

  constructor(
    public toast: ToastService,
    private http: HttpClient,
    public netex: NetexControllerService,
    public drugstoneConfig: DrugstoneConfigService,
    public networkHandler: NetworkHandlerService
  ) {
    const tokens = localStorage.getItem(this.tokensCookieKey);
    const selections = localStorage.getItem(this.selectionsCookieKey);
    const finishedTokens = localStorage.getItem(this.tokensFinishedCookieKey);

    if (tokens) {
      this.tokens = JSON.parse(tokens);
    }
    if (selections) {
      this.viewTokens = JSON.parse(selections);
      this.setViewInfos();
    }
    if (finishedTokens) {
      this.finishedTokens = JSON.parse(finishedTokens);
    }
    this.startWatching();

    this.netex.tissues().subscribe((tissues) => {
      this.tissues = tissues;
    });
  }

  setViewTokenCallback(f): void {
    this.viewTokenCallback = f;
  }

  setTaskTokenCallback(f): void {
    this.taskTokenCallback = f;
  }

  setViewInfos(): void {
    this.netex.getViewInfos(this.viewTokens).then(res => {
      // @ts-ignore
      this.viewInfos = res.reverse();
    });
  }

  removeAnalysis(token, type) {
    if (type !== 'view') {
      this.removeTask(token);
    } else {
      this.removeView(token);
    }
  }

  removeTask(token) {
    this.tokens = this.tokens.filter((item) => item !== token);
    this.finishedTokens = this.finishedTokens.filter((item) => item !== token);
    this.tasks = this.tasks.filter((item) => item.token !== (token));
    localStorage.setItem(this.tokensCookieKey, JSON.stringify(this.tokens));
  }

  removeView(token) {
    this.viewTokens = this.viewTokens.filter((item) => item !== token);
    localStorage.setItem(this.selectionsCookieKey, JSON.stringify(this.viewTokens));
    this.setViewInfos();
  }

  removeAllTasks() {
    this.tasks = [];
    this.finishedTokens = [];
    this.tokens = [];
    localStorage.removeItem(this.tokensCookieKey);
  }

  removeAllSelections() {
    this.viewTokens = [];
    this.viewInfos = [];
    localStorage.removeItem(this.selectionsCookieKey);
  }

  async getTasks() {
    return await this.netex.getTasks(this.finishedTokens.length > 0 && this.tasks.length === 0 ? this.tokens : this.tokens.filter(t => this.finishedTokens.indexOf(t) === -1)).catch((e) => {
      clearInterval(this.intervalId);
    });
  }

  async getViews() {
    return await this.netex.getTasks(this.finishedTokens.length > 0 && this.tasks.length === 0 ? this.tokens : this.tokens.filter(t => this.finishedTokens.indexOf(t) === -1)).catch((e) => {
      clearInterval(this.intervalId);
    });
  }

  public getTissues(): Tissue[] {
    return this.tissues;
  }

  public clearSelectionsExcept(id) {
    let keys = this.selections.keys()
    for (const key of keys) {
      if (key !== id) {
        this.selections.delete(key);
      }
    }
  }

  public switchSelection(id: string) {
    this.selections.set(this.selection, this.selectedItems);
    if (this.selections.has(id)) {
      this.selectedItems = this.selections.get(id);
    } else {
      this.selectedItems = new Map<string, Wrapper>();
    }
    this.selectListSubject.next({items: Array.from(this.selectedItems.values()), selected: null});
    this.selection = id;
  }

  public addItems(wrappers: Wrapper[]): number {
    const addedWrappers: Wrapper[] = [];
    for (const wrapper of wrappers) {
      if (!this.inSelection(wrapper)) {
        addedWrappers.push(wrapper);
        this.selectedItems.set(wrapper.id, wrapper);
      }
    }
    this.selectListSubject.next({items: addedWrappers, selected: true});
    return addedWrappers.length;
  }

  public removeItems(wrappers: Wrapper[]) {
    const removedWrappers: Wrapper[] = [];
    for (const wrapper of wrappers) {
      if (this.selectedItems.delete(wrapper.id)) {
        removedWrappers.push(wrapper);
      }
    }
    this.selectListSubject.next({items: removedWrappers, selected: false});
  }

  public addGroupToSelection(group: NodeGroup) {
    const wrappers: Wrapper[] = [];
    const unmappedNodes = [];
    this.networkHandler.activeNetwork.currentViewNodes.forEach((node) => {
      if (node.group !== group.groupID || node.drugstoneType !== 'protein') {
        if (node.drugstoneType !== 'drug' && node.drugstoneType !== 'disorder' && node.drugstoneId === undefined) {
          unmappedNodes.push(node.label);
        }
        // only consider proteins
        return;
      }
      wrappers.push(getWrapperFromNode(node));
    });
    this.addItems(wrappers);
    if (unmappedNodes.length > 0) {
      this.unmappedNodesToast(unmappedNodes);
    }
  }

  public addNodesByIdsToSelection(ids: string[]) {
    const wrappers: Wrapper[] = [];
    const unmappedNodes = [];
    const unselectableNodes = [];
    this.networkHandler.activeNetwork.currentViewNodes.forEach((node) => {
      if (ids.indexOf(node.id) > -1) {
        if (node.drugstoneId === undefined) {
          unmappedNodes.push(node.label);
        } else if (node.drugstoneType === 'drug' || node.drugstoneType === 'disorder') {
          unselectableNodes.push(node.label);
        } else {
          // only consider proteins
          wrappers.push(getWrapperFromNode(node));
        }
      }
    });
    this.addItems(wrappers);
    if (unmappedNodes.length > 0) {
      this.unmappedNodesToast(unmappedNodes);
    }
    if (unselectableNodes.length > 0) {
      this.unselectableNodesToast(unselectableNodes);
    }
  }


  // Adds first neighbors of selected nodes to selection
  public addFirstNeighbors() {
    const wrappers: Wrapper[] = [];
    const mappedNodes = {};
    this.networkHandler.activeNetwork.currentViewNodes.forEach((node) => {
      if (node.drugstoneType === 'protein' && node.drugstoneId) {
        mappedNodes[node.label] = node;
      }
    });
    const selectedNodes = new Set(this.selectedItems.keys());
    const firstNeighborNodes: Set<string> = new Set(selectedNodes);
    this.networkHandler.activeNetwork.currentViewEdges.forEach(edge => {
      if (selectedNodes.has(edge.from)) {
        firstNeighborNodes.add(edge.to);
      }
      if (selectedNodes.has(edge.to)) {
        firstNeighborNodes.add(edge.from);
      }
    });

    firstNeighborNodes.forEach(n => {
      if (mappedNodes[n]) {
        wrappers.push(getWrapperFromNode(mappedNodes[n]));
      }
    });
    this.addItems(wrappers);
  }

  // Identifies connected components of all selected nodes and adds all nodes of the components to the selection
  public addConnectedComponents() {
    const wrappers: Wrapper[] = [];
    const mappedNodes = {};
    this.networkHandler.activeNetwork.currentViewNodes.forEach((node) => {
      if (node.drugstoneType === 'protein' && node.drugstoneId) {
        mappedNodes[node.label] = node;
      }
    });
    const selectedNodes = new Set(this.selectedItems.keys());
    let previousSize = 0;
    while (previousSize !== selectedNodes.size) {
      previousSize = selectedNodes.size;
      this.networkHandler.activeNetwork.currentViewEdges.forEach(edge => {
        if (selectedNodes.has(edge.from)) {
          selectedNodes.add(edge.to);
        }
        if (selectedNodes.has(edge.to)) {
          selectedNodes.add(edge.from);
        }
      });
    }

    selectedNodes.forEach(n => {
      if (!this.selectedItems.has(n)) {
        if (mappedNodes[n]) {
          wrappers.push(getWrapperFromNode(mappedNodes[n]));
        }
      }
    });
    this.addItems(wrappers);
  }

  public addAllToSelection() {
    const wrappers: Wrapper[] = [];
    const unmappedNodes = [];
    this.networkHandler.activeNetwork.currentViewNodes.forEach((node) => {
      if (node.drugstoneType !== 'protein') {
        if (node.drugstoneType !== 'drug' && node.drugstoneType !== 'disorder' && node.drugstoneId === undefined) {
          unmappedNodes.push(node.label);
        }
        // only consider proteins
        return;
      }
      wrappers.push(getWrapperFromNode(node));
    });
    if (unmappedNodes.length > 0) {
      this.unmappedNodesToast(unmappedNodes);
    }
    this.addItems(wrappers);
  }

  public invertSelection(nodes) {
    const newSelection = [];
    const unmappedNodes = [];
    nodes.forEach((node: Node) => {
      if (node.drugstoneType !== 'protein') {
        if (node.drugstoneType !== 'drug' && node.drugstoneType !== 'disorder' && node.drugstoneId === undefined) {
          unmappedNodes.push(node.label);
        }
        // only consider proteins
        return;
      }
      const wrapper = getWrapperFromNode(node);
      if (!this.inSelection(wrapper)) {
        newSelection.push(wrapper);
      }
    });
    this.resetSelection();
    for (const wrapper of newSelection) {
      this.selectedItems.set(wrapper.id, wrapper);
    }
    this.selectListSubject.next({items: newSelection, selected: true});
    if (unmappedNodes.length > 0) {
      this.unmappedNodesToast(unmappedNodes);
    }
  }

  resetSelection() {
    this.selectListSubject.next({items: Array.from(this.selectedItems.values()), selected: false});
    this.selectedItems.clear();
  }

  async viewFromSelection() {

    const seeds = this.getSelection().map((item) => item.id);
    const seedsFiltered = seeds.filter(el => el != null);
    const initialNetwork = this.networkHandler.activeNetwork.getResetInputNetwork();
    const filteredNodes = initialNetwork.nodes.filter(node => seedsFiltered.includes(node.id));
    const filteredEdges = initialNetwork.edges.filter(edge => seedsFiltered.includes(edge.from) && seedsFiltered.includes(edge.to));
    this.resetSelection();
    const payload: any = {
      config: this.drugstoneConfig.currentConfig(),
      network: {nodes: filteredNodes, edges: filteredEdges}
    };
    const resp = await this.http.post<any>(`${this.netex.getBackend()}save_selection`, payload).toPromise();
    // @ts-ignore
    this.viewTokens.push(resp.token);
    this.setViewInfos();
    localStorage.setItem(this.selectionsCookieKey, JSON.stringify(this.viewTokens));

    this.toast.setNewToast({
      message: 'New network view based of the selection has been created. Load the new view by clicking here or on the entry in the \'Views\' list to the ' + this.drugstoneConfig.config.showSidebar,
      type: 'success',
      callback: () => {
        this.viewTokenCallback(resp.token);
      }
    });
    // @ts-ignore
    return resp.token;
  }

  inSelection(wrapper: Wrapper): boolean {
    return this.selectedItems.has(wrapper.id);
  }


  getSelection(): Wrapper[] {
    const out = Array.from(this.selectedItems.values());
    return out != null ? out : [];
  }

  getCount(): number {
    return this.selectedItems.size;
  }

  subscribeList(cb: (items: Array<Wrapper>, selected: boolean | null) => void) {
    this.selectListSubject.subscribe((event) => {
      cb(event.items, event.selected);
    });
  }

  async startQuickAnalysis(isSuper: boolean, algorithm: QuickAlgorithmType) {
    if (!this.canLaunchTask()) {
      this.toast.setNewToast({
        message: `You can only run ${MAX_TASKS} tasks at once. Please wait for one of them to finish or delete it from the task list.`,
        type: 'danger'
      });
      return;
    }

    this.launchingQuick = true;
    let seeds = [];
    if (!isSuper) {
      // get ids for selected nodes
      seeds = this.getSelection().map((item: Wrapper) => item.id);
    } else {
      // get all node ids
      const unmappedNodes = [];
      this.networkHandler.activeNetwork.currentViewProteins.forEach((item: Node) => {
        if (item.drugstoneType === 'protein') {
          seeds.push(item.id);
        } else if (item.drugstoneType !== 'drug' && item.drugstoneType !== 'disorder' && item.drugstoneId === undefined) {
          unmappedNodes.push(item.label);
        }
      });
      if (unmappedNodes.length) {
        this.unmappedNodesToast(unmappedNodes);
      }
    }
    this.resetSelection();
    const target = ['connect', 'connectSelected'].includes(algorithm) ? 'drug-target' : 'drug';
    const parameters: any = {
      seeds: seeds,
      config: this.drugstoneConfig.currentConfig(),
      input_network: this.networkHandler.activeNetwork.getResetInputNetwork(),
      ppi_dataset: this.drugstoneConfig.currentConfig().interactionProteinProtein,
      pdi_dataset: this.drugstoneConfig.currentConfig().interactionDrugProtein,
      target: target,
      num_trees: 5,
      tolerance: 10,
      custom_edges: this.drugstoneConfig.currentConfig().customEdges.default,
      licenced: this.drugstoneConfig.config.licensedDatasets
    };

    const resp = await this.http.post<any>(`${this.netex.getBackend()}task/`, {
      algorithm: algorithm,
      target: target,
      parameters: parameters,
    }).toPromise();
    this.tokens.push(resp.token);
    localStorage.setItem(this.tokensCookieKey, JSON.stringify(this.tokens));
    this.startWatching();

    this.toast.setNewToast({
      message: 'Quick analysis started. This may take a while. ' +
        `Once the computation finished you can view the results in the task list to the ${this.drugstoneConfig.config.showSidebar}.`,
      type: 'success'
    });
    return {taskId: resp.token, algorithm: algorithm, target: target, params: parameters};
  }

  async startAnalysis(algorithm, target: 'drug' | 'drug-target', parameters) {
    if (!this.canLaunchTask()) {
      this.toast.setNewToast({
        message: `You can only run ${MAX_TASKS} tasks at once. Please wait for one of them to finish or delete it from the task list.`,
        type: 'danger',
      });
      return '';
    }
    const resp = await this.http.post<any>(`${this.netex.getBackend()}task/`, {
      algorithm,
      target,
      parameters,
    }).toPromise();

    this.tokens.push(resp.token);
    localStorage.setItem(`drugstone-tokens-${window.location.host}`, JSON.stringify(this.tokens));
    this.startWatching();

    this.toast.setNewToast({
      message: 'Analysis task started. This may take a while. ' +
        `Once the computation finished you can view the results in the task list to the ${this.drugstoneConfig.config.showSidebar}.`,
      type: 'success'
    });
    return resp.token;
  }

  public isLaunchingQuick(): boolean {
    return this.launchingQuick;
  }

  showToast(task: Task, status: 'DONE' | 'FAILED') {
    let toastMessage;
    let toastType;
    let onClick = () => {
    };
    if (status === 'DONE') {
      toastMessage = 'Computation finished successfully. Click here or the task in the task list to view the results.';
      toastType = 'success';
      onClick = () => {
        this.taskTokenCallback(task.token);
      };
    } else if (status === 'FAILED') {
      toastMessage = 'Computation failed.';
      toastType = 'danger';
    }

    this.toast.setNewToast({
      message: toastMessage,
      type: toastType,
      callback: onClick
    });
  }

  unmappedNodeToast() {
    this.toast.setNewToast({
      message: 'This node cannot be selected because either it could not be mapped correctly or it is not of type gene or protein.',
      type: 'warning',
    });
  }

  unmappedNodesToast(l) {
    this.toast.setNewToast({
      message: 'The following node(s) cannot be selected because they could not be mapped correctly: ' + l.join(', '),
      type: 'warning',
    });
  }

  screenshotError() {
    this.toast.setNewToast({
      message: 'Screenshot could not be saved, because the network contains images that are loaded loaded from another website.',
      type: 'danger'
    });
  }
  unselectableNodesToast(l) {
    this.toast.setNewToast({
      message: 'The following node(s) cannot be selected because they are not of type portein or gene: ' + l.join(', '),
      type: 'warning',
    });
  }

  public canLaunchTask(): boolean {
    return this.canLaunchNewTask;
  }

  startWatching() {
    const watch = async () => {
      if (this.tokens.length > 0) {
        const newtasks = await this.getTasks();
        if (newtasks.length === 0) {
          return;
        }
        const newTaskIds = newtasks.map(t => t.token.toString());
        this.tasks = newtasks.concat(this.tasks.filter(t => newTaskIds.indexOf(t.token) === -1));
        if (!this.tasks) {
          return;
        }
        let queuedOrRunningTasks = 0;
        this.tasks.forEach((task) => {
          if (!task.info.done && !task.info.failed) {
            queuedOrRunningTasks++;
          }
          if (!this.finishedTokens.find((finishedToken) => finishedToken === task.token)) {
            if (task.info.done) {
              this.finishedTokens.push(task.token);
              this.showToast(task, 'DONE');
              localStorage.setItem(this.tokensFinishedCookieKey, JSON.stringify(this.finishedTokens));
            } else if (task.info.failed) {
              this.finishedTokens.push(task.token);
              this.showToast(task, 'FAILED');
              localStorage.setItem(this.tokensFinishedCookieKey, JSON.stringify(this.finishedTokens));
            } else {
            }
          }
        });
        this.canLaunchNewTask = queuedOrRunningTasks < MAX_TASKS;
      } else {
        this.canLaunchNewTask = true;
      }
      this.launchingQuick = false;
    };
    watch();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    // 5000
    this.intervalId = setInterval(watch, 5000);
  }


}
