import { Injectable, NgZone } from '@angular/core';

@Injectable()
export class FacesService {

  private video: HTMLVideoElement;
  private videoWidth: number;
  private videoHeight: number;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private faceDetector: any;
  private running = false;

  public faces: any[];

  constructor(private zone: NgZone) {
    this.faces = [];
    this.faceDetector = new window[ 'FaceDetector' ]( { fastMode: true, maxDetectedFaces: 2 } );
  }

  setSource(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    videoWidth: number,
    videoHeight: number
  ) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.video = video;
    this.videoWidth = videoWidth;
    this.videoHeight = videoHeight;
  }

  start() {
    this.running = true;
    this.zone.runOutsideAngular( () => this.update() );
  }

  stop() {
    this.running = false;
  }

  async update() {
    if ( !this.running ) {
      return;
    }

    this.faces = await this.faceDetector.detect( this.canvas );
    requestAnimationFrame( () => this.update() );
  }

}
