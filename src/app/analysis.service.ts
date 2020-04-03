import {Injectable} from '@angular/core';
import {Protein} from './pages/protein-network';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {

  private selectedProteins = new Map<string, Protein>();
  private selectSubject = new Subject<{protein: Protein, selected: boolean}>();

  private token: string | null = null;
  private stats: any;
  private task: any;

  private intervalId: any;

  constructor(private http: HttpClient) {
    this.token = localStorage.getItem('token');
    if (this.token) {
      this.startWatching();
    }
  }

  addProtein(protein: Protein) {
    if (!this.inSelection(protein)) {
      this.selectedProteins.set(`${protein.proteinAc}`, protein);
      this.selectSubject.next({protein, selected: true});
    }
  }

  inSelection(protein: Protein): boolean {
    return this.selectedProteins.has(protein.proteinAc);
  }

  removeProtein(protein: Protein) {
    if (this.selectedProteins.delete(`${protein.proteinAc}`)) {
      this.selectSubject.next({protein, selected: false});
    }
  }

  getSelection(): Protein[] {
    return Array.from(this.selectedProteins.values());
  }

  getCount(): number {
    return this.selectedProteins.size;
  }

  subscribe(cb: (protein: Protein, selected: boolean) => void) {
    this.selectSubject.subscribe((event) => {
      cb(event.protein, event.selected);
    });
  }

  getTask(): any {
    return this.task;
  }

  reset() {
    this.token = null;
    this.task = null;
    this.stats = null;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getStats(): any {
    return this.stats;
  }

  async startAnalysis(algorithm, parameters) {
    const resp = await this.http.post<any>(`${environment.backend}task/`, {
      algorithm,
      parameters,
    }).toPromise();
    this.token = resp.token;
    localStorage.setItem('token', this.token);
    this.startWatching();
  }

  async startWatching() {
    this.intervalId = setInterval(async () => {
      const resp = await this.http.get<any>(`${environment.backend}task/?token=${this.token}`).toPromise().catch((e) => {
        clearInterval(this.intervalId);
      });
      this.task = resp.task;
      this.stats = resp.stats;
      if (this.task.done) {
        clearInterval(this.intervalId);
      }
    }, 1000);
  }

}
