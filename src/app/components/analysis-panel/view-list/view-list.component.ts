import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DrugstoneConfigService} from '../../../services/drugstone-config/drugstone-config.service';
import {algorithmNames, AnalysisService} from '../../../services/analysis/analysis.service';
import { NetexControllerService } from 'src/app/services/netex-controller/netex-controller.service';
import { HttpClient } from '@angular/common/http';
import { ToastService } from 'src/app/services/toast/toast.service';


@Component({
  selector: 'app-view-list',
  templateUrl: './view-list.component.html',
  styleUrls: ['./view-list.component.scss']
})
export class ViewListComponent implements OnInit {
  @Input() token: string;
  @Output() tokenChange: EventEmitter<string> = new EventEmitter();

  editing = false;
  taskTextMap: { [key: string]: string } = {};
  currentEditingTask: string = null;

  constructor(public drugstoneConfig: DrugstoneConfigService, public analysis: AnalysisService, public netex: NetexControllerService, private http: HttpClient,  public toast: ToastService) { }

  ngOnInit(): void {
  }

  open(token) {
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
    this.editing = false;
    const newName = this.taskTextMap[task.token];

    const payload: any = {
      token: task.token,
      name: newName
    };

    try {
      const resp = await this.http.put<any>(`${this.netex.getBackend()}rename_selection`, payload).toPromise();
      if (resp && resp.message === 'Name updated successfully.') {
        this.toast.setNewToast({
          message: 'The name of the selection has been updated successfully.',
          type: 'success'
        });
        this.analysis.setViewInfos();
      } else {
        this.toast.setNewToast({
          message: 'Failed to update the name of the selection.',
          type: 'warning'
        });
      }
    } catch (error) {
      console.error('Error while saving name:', error);
    }
  }

  protected readonly algorithmNames = algorithmNames;
}
