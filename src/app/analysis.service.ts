import {Injectable} from '@angular/core';
import {QueryItem, Task} from './interfaces';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class AnalysisService {

  private selectedItems = new Map<string, QueryItem>();
  private selectSubject = new Subject<{ item: QueryItem, selected: boolean }>();

  public tokens: string[] = [];
  public tasks: Task[] = [];

  private intervalId: any;

  constructor(private http: HttpClient) {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      this.tokens = JSON.parse(tokens);
    }
    this.startWatching();
  }

  removeTask(token) {
    this.tokens = this.tokens.filter((item) => item !== token);
    this.tasks = this.tasks.filter((item) => item.token !== (token));
    localStorage.setItem('tokens', JSON.stringify(this.tokens));
  }

  removeAllTasks() {
    this.tasks.forEach((task) => {
      this.removeTask(task.token);
    });
  }

  async getTasks() {
    return await this.http.get<any>(`${environment.backend}tasks/?tokens=${JSON.stringify(this.tokens)}`).toPromise().catch((e) => {
      clearInterval(this.intervalId);
    });
  }

  public addItem(item: QueryItem) {
    if (!this.inSelection(item.name)) {
      this.selectedItems.set(`${item.name}`, item);
      this.selectSubject.next({item, selected: true});
    }
  }

  resetSelection() {
    const oldSelection = this.selectedItems.values();
    for (const item of oldSelection) {
      this.removeItem(item.name);
    }
  }

  inSelection(itemName: string): boolean {
    return this.selectedItems.has(itemName);
  }

  removeItem(itemName: string) {
    const item = this.selectedItems.get(itemName);
    if (this.selectedItems.delete(itemName)) {
      this.selectSubject.next({item, selected: false});
    }
  }

  getSelection(): QueryItem[] {
    return Array.from(this.selectedItems.values());
  }

  getCount(): number {
    return this.selectedItems.size;
  }

  subscribe(cb: (item: QueryItem, selected: boolean) => void) {
    this.selectSubject.subscribe((event) => {
      cb(event.item, event.selected);
    });
  }

  async startAnalysis(algorithm, parameters) {
    const resp = await this.http.post<any>(`${environment.backend}task/`, {
      algorithm,
      parameters,
    }).toPromise();
    this.tokens.push(resp.token);
    localStorage.setItem('tokens', JSON.stringify(this.tokens));
    this.startWatching();
  }

  startWatching() {
    const watch = async () => {
      if (this.tokens.length > 0) {
        this.tasks = await this.getTasks();
      }
    };
    watch();
    this.intervalId = setInterval(watch, 5000);
  }

}
