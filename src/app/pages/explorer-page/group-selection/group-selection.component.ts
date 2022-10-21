import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NodeGroup } from 'src/app/config';

@Component({
  selector: 'app-group-selection',
  templateUrl: './group-selection.component.html',
  styleUrls: ['./group-selection.component.scss']
})
export class GroupSelectionComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  // undefined groupName is selected node group
  private unselecableGroups = ['Drug', 'Disorders', undefined, 'Seed Nodes', 'Default Node Group', 'Connector Nodes', 'Found Nodes'];
  public _nodeGroupsList: NodeGroup[];

  @Output() selectGroupEmitter: EventEmitter<NodeGroup> = new EventEmitter();
  @Input() set nodeGroups(value: { string: NodeGroup }) {
    this._nodeGroupsList = Object.values(value).filter(nodeGroup => !this.unselecableGroups.includes(nodeGroup.groupName));
    console.log(this._nodeGroupsList)
  }
  public selectedGroup = null;

  selectGroup(item) {
    if (item === undefined) {
      return
    }
    this.selectedGroup = item;
    this.selectGroupEmitter.emit(item);
  }

  getAddGroupLabel() {
    if (this.selectedGroup != null)
      return ""
    return "Group";
  }

}
