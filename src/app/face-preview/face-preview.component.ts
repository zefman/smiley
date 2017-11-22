import { Component, AfterViewInit, ViewChild, Input, Output, ElementRef, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-face-preview',
  templateUrl: './face-preview.component.html',
  styleUrls: ['./face-preview.component.css']
})
export class FacePreviewComponent implements AfterViewInit {

  @Input( 'imageData' ) imageData: ImageData;
  @Output( 'onClick' ) onClick = new EventEmitter();
  @ViewChild( 'canvas' ) canvasRef: ElementRef;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() { }

  ngAfterViewInit() {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext( '2d' );
    this.ctx.putImageData( this.imageData, 0, 0 );
  }

  click() {
    this.onClick.emit();
  }

}
