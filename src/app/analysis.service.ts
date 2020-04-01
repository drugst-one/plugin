import {Injectable} from '@angular/core';
import {Protein} from './pages/protein-network';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {

  private selectedProteins = new Map<string, Protein>();
  private selectSubject = new Subject<{protein: Protein, selected: boolean}>();

  constructor() {
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

}
