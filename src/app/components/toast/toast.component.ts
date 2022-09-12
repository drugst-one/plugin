import { Component, OnInit } from '@angular/core';
import { LiveToasts } from 'src/app/interfaces';
import { ToastService } from 'src/app/services/toast/toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {

  public toasts: LiveToasts = {};
  public seen: any = new Set();

  public toastIdPrefix = 'drugstone-toast-id-';

  constructor(public toast: ToastService) { }

  ngOnInit(): void {
    this.toast.getToasts$.forEach(data => {
      this.toasts = data;
    })
  }

  public isSeen(id) {
    console.log(this.seen.has(id))
    if (this.seen.has(id)) {
      return true
    } else {
      this.seen.add(id);
      return false
    }
  }

  public close(id: number) {
    this.toast.deleteToast(id);
    document.getElementById(`${this.toastIdPrefix}` + id).remove();
  }
  
}
