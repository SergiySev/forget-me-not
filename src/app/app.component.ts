import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {IUser} from "../types";
import {StorageService} from "./storage.service";
import {LocationService} from "./location.service";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  public list: IUser[];

  private serviceUnsubscribe;

  constructor(private readonly service: StorageService,
              private readonly location: LocationService,
              private readonly cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.serviceUnsubscribe = this.service.getList().subscribe(list => {
      this.list = list;
      this.cd.detectChanges();
    });
  }

  ngOnDestroy() {
    this.serviceUnsubscribe.unsubscribe();
  }
}
