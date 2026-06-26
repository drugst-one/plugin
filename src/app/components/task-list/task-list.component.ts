import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { DrugstoneConfigService } from 'src/app/services/drugstone-config/drugstone-config.service';
import {AnalysisService, algorithmNames} from '../../services/analysis/analysis.service';
import {HttpClient} from "@angular/common/http";
import {ToastService} from "../../services/toast/toast.service";
import {NetexControllerService} from "../../services/netex-controller/netex-controller.service";


@Component({
  standalone: false,
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})

export class TaskListComponent implements OnInit {

  @Input() token: string;
  @Output() tokenChange: EventEmitter<string> = new EventEmitter();

  editing = false;
  taskTextMap: { [key: string]: string } = {};
  justEdited: string = null
  currentEditingTask: string = null;

  public algorithmNames = algorithmNames;

  constructor(public drugstoneConfig: DrugstoneConfigService, public analysis: AnalysisService, public netex: NetexControllerService, private http: HttpClient,public toast: ToastService) {
  }

  ngOnInit(): void {
  }

  open(token) {
    if (this.editing)
      return
    if(this.justEdited == token){
      this.justEdited = null;
      return;
    }
    this.token = token;
    this.tokenChange.emit(token);
  }

  editingTask(task) {
    this.currentEditingTask = task.token;
    if (!this.taskTextMap[task.token]) {
      this.taskTextMap[task.token] = task.name;
    }
    this.editing = true;
  }

  async saveSelectionName(task) {
    this.justEdited = task.token;
    this.editing = false;
    const newName = this.taskTextMap[task.token];
    const payload: any = {
      token: task.token,
      name: newName
    };
    try {
      const resp = await this.http.put<any>(`${this.netex.getBackend()}rename_task`, payload).toPromise();
      if (resp && resp.message === 'Name updated successfully.') {
        this.toast.setNewToast({
          message: 'The name of the task has been updated successfully.',
          type: 'success'
        });
        this.analysis.setViewInfos();
      } else {
        this.toast.setNewToast({
          message: 'Failed to update the name of the task.',
          type: 'warning'
        });
      }
    } catch (error) {
      console.error('Error while saving name:', error);
    }
  }
}
