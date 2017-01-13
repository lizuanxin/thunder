import {Component, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {NavController} from 'ionic-angular';

import {TypeInfo} from '../../UltraCreation/Core'
import * as UI from '../../UltraCreation/Graphic'

import {TApplication, TLocalizeService, TAssetService, TCategory, TScriptFile, TDistributeService} from '../services';
import {AgreementPage} from '../agreement/agreement';
import {GoPage} from '../go/go';
import {SkinPage} from '../skin/skin';

const SHOWING_ITEM_COUNT = 6;

@Component({selector: 'page-home', templateUrl: 'home.html'})
export class HomePage implements OnInit, OnDestroy
{
    constructor(public nav: NavController, private Asset: TAssetService,
        private app: TApplication, private Localize: TLocalizeService, private Distrubute: TDistributeService)
    {
    }

    ngOnInit(): void
    {
        let Canvas = document.getElementById('content_canvas') as HTMLCanvasElement;
        this.Content = new TContentCanvas(Canvas, this.Localize);
        this.Content.OnSelectionFile.subscribe(file => this.SelectFile(file));

        this.Categories = this.Asset.Categories;

        if (! this.app.AcceptedTerms)
            this.ShowAgreement();
    }

    ngOnDestroy(): void
    {
        this.Content.Disponse();
        this.Content = null;
    }

    ionViewDidEnter()
    {
        let title = document.getElementById('title');
        let style = window.getComputedStyle(title);
        this.Content.Color = style.color;
        this.Content.BackgroundColor = this.app.SkinShadowColor;

        if (! TypeInfo.Assigned(this.SelectedCategory))
        {
            this.SelectCategory(this.Categories[0]);
            this.Content.Paint();
        }
        else
            this.Content.Paint();
    }

    SelectCategory(Category: TCategory)
    {
        this.SelectedCategory = Category;
        this.Asset.FileList(Category.Id)
            .then(List =>
            {
                this.FileList = List;
                this.Content.NewFileList(List);

            })
            .catch(err => console.log(err));
    }

    SelectSkin()
    {
        this.nav.push(SkinPage);
    }

    ShowAgreement()
    {
        this.nav.push(AgreementPage);
    }

    StateCategory(Category: TCategory)
    {
        if (Category === this.SelectedCategory)
            return "state";
    }

    SelectFile(ScriptFile: TScriptFile)
    {
        this.nav.push(GoPage, {Category: this.SelectedCategory, ScriptFile: ScriptFile});
    }

    Categories: Array<TCategory>;
    FileList: Array<TScriptFile> = [];

    SelectedCategory: TCategory;
    Content: TContentCanvas;
}

/* TContentCanvas */

class TContentCanvas
{
    constructor (private Canvas: HTMLCanvasElement, private Localize: TLocalizeService)
    {
        Canvas.addEventListener("touchstart", this.TouchHandler.bind(this));
        Canvas.addEventListener("touchmove", this.TouchHandler.bind(this));
        Canvas.addEventListener("touchcancel", this.TouchHandler.bind(this));
        Canvas.addEventListener("touchend", this.TouchHandler.bind(this));

        Canvas.addEventListener("click", this.Click.bind(this));

        let width = window.innerWidth;
        let height = window.innerHeight;
        if (height > window.innerHeight - 100)
            height = window.innerHeight - 100;

        Canvas.style.width = width.toString();
        Canvas.style.height = height.toString();
        Canvas.width = width * window.devicePixelRatio;
        Canvas.height = height * window.devicePixelRatio;

        this.DisplayHeight = Math.trunc(window.innerHeight * window.devicePixelRatio * 7 / 10);
        this.Padding = this.DisplayHeight / 10;
        this.ItemHeight = (this.DisplayHeight - this.Padding) / SHOWING_ITEM_COUNT;

        this.Ctx = Canvas.getContext('2d');
        this.Ctx.font = this.IconFont.toString();

        this.Ox = 0;
        this.Oy = Math.trunc(this.DisplayHeight / 2 + this.Padding);
        this.Radius = Math.trunc(this.Canvas.width * 2 / 5);
        if (this.Radius < this.Oy)
        {
            this.Ox = this.Radius - this.Oy;
            this.Radius = Math.trunc(this.Oy * 9 / 10);
        }

        let Cache = document.createElement('canvas') as HTMLCanvasElement;
        Cache.style.width = Canvas.style.width;
        Cache.style.height = Canvas.style.height;
        Cache.width = Canvas.width;
        Cache.height = Canvas.height;
        this.Bg = Cache;
    }

    Disponse()
    {
        this.OnSelectionFile.unsubscribe();
    }

    get Color(): string
    {
        return this.Ctx.fillStyle as string;
    }

    set Color(Value: string)
    {
        this.Ctx.fillStyle = Value;
    }

    get BackgroundColor(): string
    {
        return this.Ctx.strokeStyle as string;
    }

    set BackgroundColor(Value: string)
    {
        let Ctx = this.Bg.getContext('2d', {});
        Ctx.fillStyle = Value;
        Ctx.strokeStyle = Value;
        this.DrawBackground(this.Bg, Ctx, this.Ox, this.Oy, this.Radius - 30);

        this.Ctx.strokeStyle = Value;
        this.Ctx.shadowColor = Value;
    }

    NewFileList(FileList: Array<TScriptFile>)
    {
        this.ScrollingY = 0;
        this.ScrollMaxY = (FileList.length - SHOWING_ITEM_COUNT) * this.ItemHeight + this.ItemHeight / 5;

        this.FileList = FileList;
        this.Paint();
    }

    Paint()
    {
        this.Ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
        this.Ctx.globalAlpha = 1.0;
        this.Ctx.drawImage(this.Bg, 0, 0);

        this.PaintTo(this.Canvas, this.Ctx);
    }

    PaintTo(Canvas: HTMLCanvasElement, Ctx: CanvasRenderingContext2D)
    {
        let Offset = this.ScrollingY % this.ItemHeight + this.Padding;
        let Idx = Math.trunc(-this.ScrollingY / this.ItemHeight);
        Ctx.globalAlpha = 1;

        for (let i = Idx; i < this.FileList.length; i ++)
        {
            if (i < 0)
            {
                Offset += this.ItemHeight;
                continue;
            }

            let ScriptFile = this.FileList[i];

            // click area baseline
            Ctx.globalAlpha = 0.1;
            Ctx.beginPath();
            Ctx.moveTo(0, Offset);
            Ctx.lineTo(Canvas.width, Offset);
            Ctx.closePath();
            Ctx.lineWidth = 3;
            Ctx.stroke();

            Offset += this.ItemHeight / 2;
            let b = (this.Oy - Offset);
            let x = Math.sqrt(this.Radius * this.Radius - b * b) + this.Ox;

            if (Offset < this.Padding)
            {
                Ctx.globalAlpha = Offset / this.Padding;
                Ctx.globalAlpha *= Ctx.globalAlpha * Ctx.globalAlpha;
            }
            else if (Offset > this.DisplayHeight)
            {
                Ctx.globalAlpha = (Canvas.height - Offset) / (Canvas.height - this.DisplayHeight);
                Ctx.globalAlpha *= Ctx.globalAlpha * Ctx.globalAlpha;
            }
            else
                Ctx.globalAlpha = 1.0;

            Ctx.textBaseline = 'bottom';
            Ctx.textAlign = 'left';
            Ctx.font = this.IconFont.toString();

            let Str: string = String.fromCharCode(0xE904);

            Ctx.lineWidth = 1;
            Ctx.strokeText(Str, x, Offset);
            Ctx.fillText(Str, x, Offset);
            let TextWidth = Ctx.measureText(Str).width * 2;

            // file name
            Ctx.textBaseline = 'bottom';
            Ctx.textAlign = 'left';
            Ctx.font = this.FileNameFont.toString();

            Str = this.Localize.Translate(ScriptFile.Name_LangId) as string;
            x += TextWidth * 1.2;
            Ctx.strokeText(Str, x, Offset);
            Ctx.fillText(Str, x, Offset);

            /*
            // file desc
            Ctx.globalAlpha = Ctx.globalAlpha * 0.5;
            Ctx.textBaseline = "top"
            Ctx.textAlign = 'left';
            Ctx.font = this.FileDescFont.toString();
            x += Ctx.measureText('--').width;
            Str = this.Localize.Translate(ScriptFile.Desc_LangId) as string;
            Ctx.fillText(Str, x, Offset);
            */

            // minute
            Ctx.textAlign = 'right'
            Ctx.textBaseline = "top"
            Ctx.font = this.MinuteFont.toString();

            Str = Math.trunc((ScriptFile.Duration + 30) / 60).toString() + this.Localize.Translate('hint.min');
            TextWidth = this.Ctx.measureText('H').width;
            Ctx.fillText(Str, Canvas.width - TextWidth * 3.5, Offset);
            // minute pie
            this.DrawMinute(Canvas, Ctx, [1.75, ScriptFile.Duration / 3600], TextWidth, Canvas.width - TextWidth * 2, Offset);

            Offset += this.ItemHeight / 2;
        }
    }

    private TouchHandler(ev: TouchEvent)
    {
        if (ev.targetTouches.length !== 1)  // 1 finger touch
            return;
        let t = ev.targetTouches[0];

        switch (ev.type)
        {
        case 'touchstart':
            this.Darging = true;
            break;

        case 'touchmove':
            if (! this.Darging)
                return;

            this.ScrollingY += (t.clientY - this.RelativeO.clientY) * 1.5 * window.devicePixelRatio;

            if (this.ScrollingY < -this.ScrollMaxY)
                this.ScrollingY = -this.ScrollMaxY;
            if (this.ScrollingY > 0)
                this.ScrollingY = 0;

            this.Paint();
            break;

        case 'touchcancel':
        case 'touchend':
            this.Darging = false;
            break;
        }

        if (ev.type === 'touchend')
            this.RelativeO = null
        else
            this.RelativeO = ev.touches[0];
    }

    private Click(ev: MouseEvent)
    {
        let Offset = ev.offsetY * window.devicePixelRatio;

        let Idx = Math.trunc((Offset - this.ScrollingY - this.Padding) / this.ItemHeight);
        if (Idx >= 0 && Idx < this.FileList.length)
            this.OnSelectionFile.emit(this.FileList[Idx]);
    }

    private DrawBackground(Canvas: HTMLCanvasElement, Ctx: CanvasRenderingContext2D,
        Ox: number, Oy: number, Radius: number)
    {
        Ctx.clearRect(0, 0, Canvas.width, Canvas.height);

        /*
        const TargetAlpha = 0.2;
        const Step = 120;

        Ctx.globalAlpha = 0.0;
        Ctx.lineWidth = 20;
        let AlphaStep = TargetAlpha * Ctx.lineWidth / Step;

        for (let i = 0; i < Step / Ctx.lineWidth; i ++)
        {
            Radius += Ctx.lineWidth;

            Ctx.moveTo(Ox - Radius, Oy - Radius);
            Ctx.beginPath();
            Ctx.arc(Ox, Oy, Radius, 0, Math.PI * 2);
            Ctx.closePath();

            Ctx.globalAlpha += AlphaStep;
            Ctx.stroke();
        }
        Radius += Ctx.lineWidth / 2;
        Ctx.lineWidth = 1;
        */

        Ctx.globalAlpha = 0.2;
        Ctx.beginPath();
        Ctx.lineTo(0, Canvas.height);
        Ctx.lineTo(Canvas.width, Canvas.height);
        Ctx.lineTo(Canvas.width, 0);
        Ctx.lineTo(0, 0);
        Ctx.moveTo(Ox - Radius, Oy - Radius);
        Ctx.arcTo(Ox + Radius, Oy - Radius, Ox + Radius, Oy, Radius);
        Ctx.arcTo(Ox + Radius, Oy + Radius, Ox, Oy + Radius, Radius);
        Ctx.closePath();
        Ctx.fill();
    }

    /**
     *  https://en.wikipedia.org/wiki/Degree_(angle)
     *  https://en.wikipedia.org/wiki/Radian
     *  http://www.w3schools.com/tags/canvas_arc.asp
     *
     *  turn[0.0~1.0]   degree[0°~360°]     radian[0~2π]:
     *      90°         = 0.25 turn         = 0.5π
     *      180°        = 0.5 turn          = 1π
     *      360°        = 1 turn            = 2π
     **/
    private DrawMinute(Canvas: HTMLCanvasElement, Ctx: CanvasRenderingContext2D,
        Turns: number[], Radius: number, Ox: number, Oy: number)
    {
        let RestoreFillStyle = Ctx.fillStyle;

        let ColorFills: string[] = [null, Ctx.fillStyle as string];

        Ctx.beginPath();
        Ctx.moveTo(Ox, Oy);
        Ctx.arc(Ox, Oy, Radius, 0, 2 * Math.PI);
        Ctx.closePath();

        let Alpha = Ctx.globalAlpha;
        Ctx.globalAlpha = Alpha * 0.15;
        Ctx.fillStyle = ColorFills[1];
        Ctx.lineWidth = 1;
        Ctx.fill();

        Ctx.globalAlpha = Alpha;

        for (let i = 0, StartArc = 0, EndArc = 0; i < Turns.length; i ++, StartArc = EndArc)
        {
            EndArc = EndArc + Turns[i] * Math.PI * 2;

            Ctx.beginPath();
            Ctx.moveTo(Ox, Oy);
            Ctx.arc(Ox, Oy, Radius, StartArc, EndArc);
            Ctx.closePath();

            if (TypeInfo.Assigned(ColorFills[i]))
            {
                Ctx.fillStyle = ColorFills[i];
                Ctx.fill();
            }
        }

        Ctx.fillStyle = RestoreFillStyle;
    }

    IconFont = new UI.TFont('Thundericons', 10, UI.TFontStyle.Normal, UI.TFontWeight.Bold);
    FileNameFont = new UI.TFont('brandontext_normal', 16, UI.TFontStyle.Normal, UI.TFontWeight.Bold);
    FileDescFont = new UI.TFont('brandontext_normal', 8, UI.TFontStyle.Italic);
    MinuteFont = new UI.TFont('brandontext_normal', 8);

    OnSelectionFile = new EventEmitter<TScriptFile>();

    private Ctx: CanvasRenderingContext2D;
    private Bg: HTMLCanvasElement;

    private Padding;
    private Ox: number;
    private Oy: number;
    private Radius: number;
    private ItemHeight;
    private DisplayHeight;

    private FileList: Array<TScriptFile> = [];
    private ScrollingY = 0;
    private ScrollMaxY = 0;

    private RelativeO: Touch;
    private Darging = false;
}