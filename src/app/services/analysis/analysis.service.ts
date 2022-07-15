import {Wrapper, Task, getWrapperFromNode, Node, Dataset, Tissue, Algorithm} from '../../interfaces';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {toast} from 'bulma-toast';
import {Injectable} from '@angular/core';
import {NetexControllerService} from '../netex-controller/netex-controller.service';

export const algorithmNames = {
  trustrank: 'TrustRank',
  keypathwayminer: 'KeyPathwayMiner',
  multisteiner: 'Multi-Steiner',
  closeness: 'Closeness Centrality',
  degree: 'Degree Centrality',
  proximity: 'Network Proximity',
  betweenness: 'Betweenness Centrality',
  quick: 'Simple',
  super: 'Quick-Start',
};

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

  private selections = new Map<string, Map<string, Wrapper>>();

  public tokens: string[] = [];
  private tokensCookieKey = `drugstone-tokens-${window.location.host}`;
  private tokensFinishedCookieKey = `drugstone-finishedTokens-${window.location.host}`;
  public finishedTokens: string[] = [];
  public tasks: Task[] = [];

  private intervalId: any;
  private canLaunchNewTask = true;

  private launchingQuick = false;

  private tissues: Tissue[] = [];

  constructor(private http: HttpClient, public netex: NetexControllerService) {
    const tokens = localStorage.getItem(this.tokensCookieKey);
    const finishedTokens = localStorage.getItem(this.tokensFinishedCookieKey);

    if (tokens) {
      this.tokens = JSON.parse(tokens);
    }
    if (finishedTokens) {
      this.finishedTokens = JSON.parse(finishedTokens);
    }
    this.startWatching();

    this.netex.tissues().subscribe((tissues) => {
      this.tissues = tissues;
    });
  }

  removeTask(token) {
    this.tokens = this.tokens.filter((item) => item !== token);
    this.finishedTokens = this.finishedTokens.filter((item) => item !== token);
    this.tasks = this.tasks.filter((item) => item.token !== (token));
    localStorage.setItem(this.tokensCookieKey, JSON.stringify(this.tokens));
  }

  removeAllTasks() {
    this.tasks = [];
    this.finishedTokens = [];
    this.tokens = [];
    localStorage.removeItem(this.tokensCookieKey);
  }

  async getTasks() {
    return await this.netex.getTasks(this.finishedTokens.length > 0 && this.tasks.length === 0 ? this.tokens : this.tokens.filter(t => this.finishedTokens.indexOf(t) === -1)).catch((e) => {
      clearInterval(this.intervalId);
    });
  }

  public getTissues(): Tissue[] {
    return this.tissues;
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

  public addSeeds(nodes) {
    const addedWrappers: Wrapper[] = [];
    nodes.forEach((node) => {
      if (node.isSeed === true && !this.inSelection(node)) {
        addedWrappers.push(node);
        this.selectedItems.set(node.id, node);
      }
    });
    this.selectListSubject.next({items: addedWrappers, selected: true});
  }

  public removeSeeds(nodes) {
    const removedWrappers: Wrapper[] = [];
    nodes.forEach((node) => {
      if (node.isSeed === true && this.inSelection(node)) {
        removedWrappers.push(node);
        this.selectedItems.delete(node.id);
      }
    });
    this.selectListSubject.next({items: removedWrappers, selected: false});
  }

  public invertSelection(nodes) {
    const newSelection = [];
    nodes.forEach((node: Node) => {
      const wrapper = getWrapperFromNode(node);
      if (!this.inSelection(wrapper)) {
        newSelection.push(wrapper);
      }
    });
    this.selectedItems.clear();
    for (const wrapper of newSelection) {
      this.selectedItems.set(wrapper.nodeId, wrapper);
    }
    this.selectListSubject.next({items: newSelection, selected: null});
  }

  resetSelection() {
    this.selectListSubject.next({items: Array.from(this.selectedItems.values()), selected: false});
    this.selectedItems.clear();
  }

  idInSelection(nodeId: string): boolean {
    return this.selectedItems.has(nodeId);
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

  async startQuickAnalysis(isSuper: boolean, dataset: Dataset) {
    if (!this.canLaunchTask()) {
      toast({
        message: `You can only run ${MAX_TASKS} tasks at once. Please wait for one of them to finish or delete it from the task list.`,
        duration: 5000,
        dismissible: true,
        pauseOnHover: true,
        type: 'is-danger',
        position: 'top-center',
        animate: {in: 'fadeIn', out: 'fadeOut'}
      });
      return;
    }

    if (dataset == null) {
      toast({
        message: `Passed dataset is null. This feature might be still under development.`,
        duration: 5000,
        dismissible: true,
        pauseOnHover: true,
        type: 'is-danger',
        position: 'top-center',
        animate: {in: 'fadeIn', out: 'fadeOut'}
      });
      return;
    }

    this.launchingQuick = true;

    const resp = await this.http.post<any>(`${environment.backend}task/`, {
      algorithm: isSuper ? 'super' : 'quick',
      target: 'drug',
      parameters: {
        strain_or_drugs: dataset.id,
        bait_datasets: dataset.data,
        seeds: isSuper ? [] : this.getSelection().map((i) => i.id),
      },
    }).toPromise();
    this.tokens.push(resp.token);
    localStorage.setItem(this.tokensCookieKey, JSON.stringify(this.tokens));
    this.startWatching();

    toast({
      message: 'Quick analysis started. This may take a while.' +
        ' Once the computation finished you can view the results in the task list to the right.',
      duration: 10000,
      dismissible: true,
      pauseOnHover: true,
      type: 'is-success',
      position: 'top-center',
      animate: {in: 'fadeIn', out: 'fadeOut'}
    });
  }

  async startAnalysis(algorithm, target: 'drug' | 'drug-target', parameters) {
    if (!this.canLaunchTask()) {
      toast({
        message: `You can only run ${MAX_TASKS} tasks at once. Please wait for one of them to finish or delete it from the task list.`,
        duration: 5000,
        dismissible: true,
        pauseOnHover: true,
        type: 'is-danger',
        position: 'top-center',
        animate: {in: 'fadeIn', out: 'fadeOut'}
      });
      return '';
    }
    const resp = await this.http.post<any>(`${environment.backend}task/`, {
      algorithm,
      target,
      parameters,
    }).toPromise();

    this.tokens.push(resp.token);
    localStorage.setItem(`drugstone-tokens-${window.location.host}`, JSON.stringify(this.tokens));
    this.startWatching();
    return resp.token;
  }

  public isLaunchingQuick(): boolean {
    return this.launchingQuick;
  }

  showToast(task: Task, status: 'DONE' | 'FAILED') {
    let toastMessage;
    let toastType;
    if (status === 'DONE') {
      toastMessage = 'Computation finished successfully. Click the task in the task list to view the results.';
      toastType = 'is-success';
    } else if (status === 'FAILED') {
      toastMessage = 'Computation failed.';
      toastType = 'is-danger';
    }

    toast({
      message: toastMessage,
      duration: 5000,
      dismissible: true,
      pauseOnHover: true,
      type: toastType,
      position: 'top-center',
      animate: {in: 'fadeIn', out: 'fadeOut'}
    });
  }

  public canLaunchTask(): boolean {
    return this.canLaunchNewTask;
  }

  startWatching() {
    const watch = async () => {
      if (this.tokens.length > 0) {
        const newtasks = await this.getTasks();
        if(newtasks.length === 0)
          return;
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
