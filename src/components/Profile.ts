import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import * as Svc from '../providers'

@Component({selector: 'profile', templateUrl: 'Profile.html',
})
export class Profile implements OnInit
{
    constructor(private app: Svc.TApplication)
    {

    }

    ngOnInit()
    {
        this.app.IsSupportedOTG().then(value => this.IsSupportedOTG = value);
    }

    @Output() OnSelection = new EventEmitter<string>();

    IsSupportedOTG: boolean;
}