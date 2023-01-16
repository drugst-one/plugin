import {Component, Input, Output, EventEmitter, OnInit, ViewChild} from '@angular/core';
import {NgSelectComponent} from '@ng-select/ng-select';
import {NetworkHandlerService} from 'src/app/services/network-handler/network-handler.service';
import {Wrapper} from '../../interfaces';

@Component({
  selector: 'app-query-tile-component',
  templateUrl: './query-tile.component.html',
  styleUrls: ['./query-tile.component.scss']
})
export class QueryTileComponent implements OnInit {

  constructor(public networkHandler: NetworkHandlerService) {

  }

  ngOnInit(): void {
    this.networkHandler.getChange$.forEach(data => this.reset());
  }

  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  @Output() selectItem: EventEmitter<any> = new EventEmitter();
  @Input() queryItems: Wrapper[];
  public selectedItem = undefined;

  public reset() {
    this.ngSelectComponent.handleClearClick();
  }

  private entryInList = (elements: any[], term) => {
    return elements.filter(s => s.toLowerCase().indexOf(term) !== -1).length > 0;
  }

  querySearch = (term: string, item: Wrapper) => {
    term = term.toLowerCase();
    const data = {...item.data}
    // add possible missing attributes to not throw errors
    if (data.ensg === undefined) {
      data.ensg = []
    }
    if (data.groupName === undefined) {
      data.groupName = ''
    }
    if (data.type === undefined) {
      data.type = ''
    }
    if (data.symbol === undefined) {
      data.symbol = []
    }
    if (data.proteinName === undefined) {
      data.proteinName = []
    }
    if (data.uniprot === undefined) {
      data.uniprot = []
    }
    if (data.drugId === undefined) {
      data.drugId = ''
    }
    const query = term.toLowerCase();
    return this.entryInList(data.symbol, query) || this.entryInList(data.uniprot, query) ||
      data.label.toLowerCase().indexOf(term) > -1 || this.entryInList(data.ensg, query) || data.id.toLowerCase().indexOf(term) > -1
      || this.entryInList(data.proteinName, query) || data.type.toLowerCase().indexOf(term) > -1 ||
      data.groupName.toLowerCase().indexOf(term) > -1 || data.drugId.toLowerCase().indexOf(term) > -1;
  }

  select(item) {
    this.selectedItem = item;
    this.selectItem.emit(item);
  }

  getLabel() {
    if (this.selectedItem != null)
      return ""
    return "Search...";
  }
}
