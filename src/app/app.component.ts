import { Component, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SmileModel } from './SmileModel';
import { HappyModel } from './HappyModel';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {

  @ViewChild( 'video' ) videoRef: ElementRef;
  @ViewChild( 'canvas' ) canvasRef: ElementRef;
  @ViewChild( 'faceCanvas' ) faceCanvasRef: ElementRef;

  private video: HTMLVideoElement;
  private videoWidth: number;
  private videoHeight: number;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private faceCanvas: HTMLCanvasElement;
  private faceCtx: CanvasRenderingContext2D;

  private faceDetector: any;

  public smileyFaces: ImageData[] = [];
  public otherFaces: ImageData[] = [];

  private smileModel = new SmileModel();
  private step = 0;
  public cost: number;
  public training = false;
  public predict = false;
  private happyFace = new Image();
  private sadFace = new Image();

  constructor( private zone: NgZone, private http: HttpClient ) {}

  ngAfterViewInit() {
    this.happyFace.src = '/assets/happy-emoji.svg';
    this.sadFace.src = '/assets/sad-emoji.svg';

    // Get references to the video and canvas elements
    this.video = this.videoRef.nativeElement;
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext( '2d' );
    this.faceCanvas = this.faceCanvasRef.nativeElement;
    this.faceCtx = this.faceCanvas.getContext( '2d' );

    // Create a new face detector
    this.faceDetector = new window[ 'FaceDetector' ]( { fastMode: true, maxDetectedFaces: 2 } );

    // Start the webcam
    this.startVideo();

    // this.smileyFaces = [];
    // this.otherFaces = [];
    // this.http.get( '/assets/happyFaces.json' )
    //   .subscribe( (faces: any[]) => {
    //     this.smileyFaces = faces.map( face => {
    //       const imageData = new ImageData( Uint8ClampedArray.from( Object.keys( face.data ).map( k => face.data[ k ] ) ), 50, 50 );
    //       return imageData;
    //     } );
    //   } );
    //
    // this.http.get( '/assets/otherFaces.json' )
    //   .subscribe( (faces: any[]) => {
    //     this.otherFaces = faces.map( face => {
    //       const imageData = new ImageData( Uint8ClampedArray.from( Object.keys( face.data ).map( k => face.data[ k ] ) ), 50, 50 );
    //       return imageData;
    //     } );
    //   } );
  }

  startVideo() {
    navigator.getUserMedia( {
      video: true,
      audio: false
    }, mediaStream => {
      // Successfully started a media stream, bind it to our video element
      this.video.src = window.URL.createObjectURL( mediaStream );

      // Once the video is loaded set our canvas element to match it's
      // width and height
      this.video.addEventListener( 'loadeddata', () => {
        this.videoWidth = this.video.videoWidth;
        this.videoHeight = this.video.videoHeight;
        this.canvas.height = this.videoHeight;
        this.canvas.width = this.videoWidth;
      } );

      this.zone.runOutsideAngular( () => this.update() );
    }, error => {
      console.log( error );
    } );
  }

  async update() {
    // Detect faces in the video feed
    const faces = await this.faceDetector.detect( this.canvas );

    // Draw the latest frame from the video to canvas
    this.ctx.drawImage( this.video, 0, 0, this.videoWidth, this.videoHeight );

    // Mark the detected faces on the canvas
    this.markFaces( faces );

    // Copy the faces to the resized canvas and convert to greyscale
    faces.forEach( face => this.processFace( face ) );

    // Request the next frame
    requestAnimationFrame( () => this.update() );
  }

  markFaces( faces: any[] ) {
    this.ctx.lineWidth = 5;
    this.ctx.strokeStyle = 'red';

    faces.forEach( face => {
      this.ctx.beginPath();
      this.ctx.rect(
        face.boundingBox.x,
        face.boundingBox.y,
        face.boundingBox.width,
        face.boundingBox.height
      );
      this.ctx.closePath();
      this.ctx.stroke();
    } );
  }

  processFace( face: any ) {
    // Resize and draw the face to the smaller canvas
    this.faceCtx.drawImage(
      this.canvas,
      face.boundingBox.x, // The starting x to take from this.canvas
      face.boundingBox.y, // The starting y to take from this.canvas
      face.boundingBox.width, // The width of the rectangle to take from this.canvas
      face.boundingBox.height, // The height of the rectangle to take from this.canvas
      0, // The starting x to draw to on the faceCtx
      0, // The starting y to draw to on the faceCtx
      50, // The width to scale the image to on faceCtx
      50 // The height to scale the image to on faceCtx
    );

    // Convert the resized face to greyscale
    const imageData = this.faceCtx.getImageData(0, 0, 50, 50);
    const pixels = imageData.data;
    for ( let i = 0, n = pixels.length; i < n; i += 4 ) {
      const brightness = pixels[i] * .3 + pixels[i + 1] * .59 + pixels[i + 2] * .11;
      pixels[i] = brightness;
      pixels[i + 1] = brightness;
      pixels[i + 2] = brightness;
    }
    this.faceCtx.putImageData(imageData, 0, 0);

    if ( this.predict ) {
      const prediction = this.smileModel.predict( this.getNormalizedGreyScalePixels( this.faceCtx.getImageData( 0, 0, 50, 50 ) ) )[0];
      this.ctx.fillText( `${prediction}`, face.boundingBox.x + face.boundingBox.width / 2, face.boundingBox.y + face.boundingBox.height / 2);
      console.log(prediction);
       this.ctx.drawImage(this.happyFace, face.boundingBox.x, face.boundingBox.y, face.boundingBox.width, face.boundingBox.height);
    }
  }

  getNormalizedGreyScalePixels( imageData: ImageData ) {
    const pixels = imageData.data;
    const greyScalePixels = [];
    for ( let i = 0, n = pixels.length; i < n; i += 4 ) {
      // greyScalePixels.push( this.normalize( pixels[i], 255, 0 ) );
      const grayscale = pixels[i] * .3 + pixels[i + 1] * .59 + pixels[i + 2] * .11;
      greyScalePixels.push( this.normalize( grayscale, 255, 0 ) );
    }
    return greyScalePixels;
  }

  normalize(val: number, max: number, min: number) {
    return (val - min) / (max - min);
  }

  saveHappy() {
    // this.smileyFaces.push( this.faceCtx.getImageData(0, 0, 50, 50) );
    this.smileyFaces.push( this.faceCtx.getImageData(0, 0, 50, 50) );

  }

  saveOther() {
    this.otherFaces.push( this.faceCtx.getImageData(0, 0, 50, 50) );
  }

  getGreyScalePixels( imageData: ImageData ) {
    const pixels = imageData.data;
    const greyScalePixels = [];
    for ( let i = 0, n = pixels.length; i < n; i += 4 ) {
      const grayscale = pixels[i] * .3 + pixels[i + 1] * .59 + pixels[i + 2] * .11;
      greyScalePixels.push( this.normalize( grayscale, 255, 0 ) );
    }
    return greyScalePixels;
  }

  setUpSession() {
    console.log( this.smileyFaces.map( data => this.getNormalizedGreyScalePixels( data ) ) )
    console.log( this.otherFaces.map( data => this.getNormalizedGreyScalePixels( data ) ) )
    this.smileModel.setupSession(
      this.smileyFaces.map( data => this.getGreyScalePixels( data ) ),
      this.otherFaces.map( data => this.getGreyScalePixels( data ) )
    );
  }

  train() {
    this.training = true;
    this.trainAndMaybeRender();
  }

  stopTraining () {
    this.training = false;
  }

  trainAndMaybeRender() {
    if (this.step > 4200) {
      // Stop training.
      return;
    }

    // Schedule the next batch to be trained.
    if ( this.training ) {
      this.zone.runOutsideAngular(() => {
      });
      requestAnimationFrame(this.trainAndMaybeRender.bind( this ));
    }

    // We only fetch the cost every 10 steps because doing so requires a transfer
    // of data from the GPU.
    const localStepsToRun = 10;
    for (let i = 0; i < localStepsToRun; i++) {
      this.cost = this.smileModel.train1Batch(i === localStepsToRun - 1, this.step);
      this.step++;
    }

    // Print data to console so the user can inspect.
    console.log('step', this.step - 1, 'cost', this.cost);
  }

}
