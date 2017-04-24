import { Component, OnInit, Input, Output, AfterViewInit, EventEmitter, ViewChild, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { Slides, PickerController, PickerColumnCmp, PickerColumnOption } from 'ionic-angular';

const BODY = ['&#xe93d;', '&#xe93e;', '&#xe93f;', '&#xe940;', '&#xe941;', '&#xe942;'];
const Massage = [{ text: '酸痛缓解' }, { text: '疲劳缓解' }, { text: '快速镇痛' }, { text: '搓揉' }, { text: '按压' }, { text: '肌肉放松' }];

@Component({
  selector: 'comp-commonmode',
  template: `
    <ion-row [ngStyle]="VslideH" margin-top margin-bottom>
        <ion-col col-3 no-padding style="background-color:rgba(255,255,255,.1);border-radius:10px">
            <ion-row no-padding VSideLeft #VLeftSide>
                <ion-col offset-2 col-8 no-padding text-center [class.active]="CurrentBodyValue === item" *ngFor="let item of BodyValues" (click)="SelectBody(item)" tappable>
                    <span app-icon [innerHTML]="item"></span> 
                    <ion-icon *ngIf = "CurrentBodyValue === item">&#xf488;</ion-icon>
                </ion-col>
            </ion-row>
        </ion-col>
        <ion-col col-7 text-center align-self-center>             
            <ion-slides [ngStyle]="SetStyle(0)">
                <ion-slide><ion-icon app-icon [ngStyle]="SetStyle(1)">&#xe943;</ion-icon></ion-slide>
            </ion-slides>           
            <ion-row margin-top>
                <ion-col>
                    <ion-icon app-icon translateDown absolute style="left:48%;font-size:1rem">&#xe93c;</ion-icon>                   
                    <div class="picker-ios" picker-fix>
                        <div class="picker-columns">
                            <div class="picker-above-highlight"></div>
                            <div *ngFor="let c of Columns" [col]="c" class="picker-col" (ionChange)="ColChange($event)"></div>
                            <div class="picker-below-highlight"></div>
                        </div>
                    </div>
                </ion-col>
            </ion-row>
            <button ion-fab absolute style="bottom:10%;right:-15%;">
                 <ion-icon>&#xf488;</ion-icon>
            </button>
        </ion-col>
        <ion-col col-2 align-self-start>
            <ion-row RSideTop>
                <ion-col col-12 text-center><ion-icon app-icon [ngStyle]="SetStyle(2)">&#xe943;</ion-icon></ion-col>
                <ion-col col-12 text-center><ion-icon app-icon [ngStyle]="SetStyle(2)">&#xe95a;</ion-icon></ion-col>
            </ion-row>
        </ion-col>
    </ion-row> 

  `,
})

export class ComponentCommonmode implements OnInit
{ 
  @ViewChild('VLeftSide') VLSide: ElementRef;
  @ViewChildren(PickerColumnCmp) _cols: QueryList<PickerColumnCmp>
  constructor(private Elements: ElementRef, private pickerCtrl: PickerController) 
  {
     
  }

  ngOnInit()
  {   
     this.Columns = [
        {
          name: 'Mas',
          align: 'center',
          selectedIndex: 2,
          options: Massage
        }
      ]       
  } 

 @Input()
 set isDisplay(on: boolean)
 {     
     if (on)        
        setTimeout(() => 
        {            
            this.refresh();            
        },10)
 }

  ngAfterViewInit() 
  {   
      this.SetVLside();   
  } 

  refresh() 
  {            
    this._cols.forEach(column => 
    {
        column.refresh();
    });
  }


  ColChange(selectedOption: PickerColumnOption) 
  {
      let selected: {[k: string]: any} = {};
        this.Columns.forEach((col, index) => 
        {
            let selectedColumn = col.options[col.selectedIndex];
            selected[col.name] = {
                text: selectedColumn ? selectedColumn.text : null,
                value: selectedColumn ? selectedColumn.value : null,
                columnIndex: index,
            };
        });
        return selected;
  }

  SelectBody(item: string)
  {    
    return this.CurrentBodyValue = item;
  }

  SelectMas(item: string)
  {
    return this.CurrentMasValue = item;
  }

  SetStyle(n: number): Object
  {
    switch(n)
    {
        case 0: return { height: Math.ceil(window.innerHeight * 0.3) + 'px' }
        case 1: return { fontSize: Math.ceil(window.innerWidth * 0.45) + 'px' }
        case 2: return { fontSize: Math.ceil(window.innerWidth * 0.1) + 'px' }
    }
  }

  SetVLside()
  {
      let VLS = this.VLSide.nativeElement, AvHeight;      
      AvHeight = Math.ceil(window.innerHeight * 0.7) / VLS.children.length; 

      for (let i = 0; i < VLS.children.length; i++)
      {        
        VLS.children[i].style.height = VLS.children[i].style.lineHeight = AvHeight + 'px';
        VLS.children[i].style.fontSize = '10vw';
        if (i < VLS.children.length - 1)
            VLS.children[i].style.borderBottom = 'solid 1px rgba(255,255,255,.5)';
      
      } 
  }

  get VslideH(): Object
  {
      return { height: this.VSLHeight + 'px' }
  }

  get HslideH(): Object
  {
      return { height: '44px' }
  }

  Columns: any;
  BodyValues: Array<string> = BODY;
  MasValues: Array<Object> = Massage;
  CurrentBodyValue: string = this.BodyValues[0];
  CurrentMasValue: string = Massage[0].text;
  IsHArrowLeftShow: Boolean = false;
  IsHArrowRightShow: Boolean = true;
  VslideOption: Object;
  VSLHeight: number = Math.ceil(window.innerHeight * 0.7); 
  
}