import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {NodeGroup} from 'src/app/config';

import { LegendService } from 'src/app/services/legend-service/legend-service.service';



@Component({

  selector: 'app-group-selection',

  templateUrl: './group-selection.component.html',

  styleUrls: ['./group-selection.component.scss']

})

export class GroupSelectionComponent implements OnInit {



  constructor(public legendService: LegendService) {

  }



  ngOnInit(): void {

  }



  // undefined groupName is selected node group

  private unselecableGroups = ['Drug', 'Disorders', undefined, 'Seed Nodes', 'Default Node Group', 'Connector Nodes', 'Found Nodes'];

  public _nodeGroupsList: NodeGroup[];



  @Output() selectGroupEmitter: EventEmitter<NodeGroup> = new EventEmitter();



  @Input() set nodeGroups(value: { string: NodeGroup }) {

    const groupsToDelete = this.legendService.get_nodes_to_delete();

    this._nodeGroupsList = Object.entries(value)

      .filter(([key, nodeGroup]) =>

        !this.unselecableGroups.includes(nodeGroup.groupName) &&

        !groupsToDelete.includes(key)

      )

      .map(([key, nodeGroup]) => {

        nodeGroup.groupID = key;

        return nodeGroup;

      });

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

