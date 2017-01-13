import {NgModule} from '@angular/core';
import {Observable} from 'rxjs/Observable'
import {IonicModule} from 'ionic-angular';
import {TranslateModule, TranslatePipe, TranslateLoader} from "ng2-translate";

import {TApplication} from '../providers/application'

@NgModule({
    imports: [
        IonicModule,
        TranslateModule.forRoot({provide: TranslateLoader, useFactory: CreateNullLoader}),
    ],
    exports: [
        IonicModule,
        TranslatePipe,
    ],
    declarations: [
    ],
    entryComponents: [
    ],
    providers: [
        TApplication
    ]
})
export class CommonModule {}

export class NullLoader extends TranslateLoader
{
    getTranslation(lang: string): any
    {
        return Observable.of({});
    }
}

export function CreateNullLoader()
{
    return new NullLoader();
}