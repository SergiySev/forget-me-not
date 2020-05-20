import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";
import {StorageService} from "../storage.service";
import {IUser} from "../../types";

@Component({
  selector: 'app-input-row',
  templateUrl: './input-row.component.html',
  styleUrls: ['./input-row.component.css', './button.css']
})
export class InputRowComponent implements OnInit {

  @Input() user: IUser;

  public form;
  public isAddState: boolean = true;
  public readonly colors = [
    {label: 'Red', value: '#FF0000'},
    {label: 'Orange', value: '#FF7F00'},
    {label: 'Yellow', value: '#FFFF00'},
    {label: 'Green', value: '#00FF00'},
    {label: 'Blue', value: '#0000FF'},
    {label: 'Indigo', value: '#4B0082'},
    {label: 'Violet', value: '#9400D3'},
  ];
  public currentColor = this.colors[0].value;

  constructor(private readonly fb: FormBuilder,
              private readonly service: StorageService, private readonly cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    if (!this.user) {
      this.user = {
        id: '',
        name: '',
        color: this.currentColor,
        ignore: false
      }
      this.isAddState = true;
    } else {
      this.currentColor = this.user.color;
      this.isAddState = false;
    }

    let controls = {
      id: this.fb.control({
        value: this.user.id,
        disabled: !this.isAddState
      }, [Validators.required]),
      name: this.fb.control(this.user.name),
      color: this.fb.control(this.user.color),
      ignore: this.fb.control(this.user.ignore)
    }

    this.form = this.fb.group(controls);
    this.form.valueChanges.subscribe(() => this.cd.detectChanges());
  }


  changeColor(e) {
    this.currentColor = e.target.value;
    this.setColor(this.currentColor);
    this.cd.detectChanges();
  }

  onSave() {
    if (this.isAddState) {
      this.service.add(this.form.getRawValue());
      this.clearForm();
    } else {
      this.service.update(this.form.getRawValue());
      this.form.markAsPristine();
      this.cd.detectChanges();
    }
  }

  onDelete() {
    if (this.isAddState) {
      this.clearForm();
    } else {
      this.service.delete(this.form.getRawValue());
    }
  }

  onAddButtonRule() {
    return (this.isAddState && !this.form.valid) || (!this.isAddState && !this.form.dirty);
  }

  private clearForm() {
    this.form.reset();
    this.currentColor = this.colors[0].value
    this.setColor(this.currentColor);
    this.form.controls.ignore.setValue(false, {
      onlySelf: true
    })
  }

  private setColor(color) {
    this.form.controls.color.setValue(this.currentColor, {
      onlySelf: true
    })
  }
}
