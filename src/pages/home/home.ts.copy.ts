import { Component, ViewChild } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
// import { AudioContext } from 'angular-audio-context';

declare var audioinput;
declare var window: any;
var myComponent;
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  audioCtx;
  analyser;
  bufferLength;
  canvas;
  canvasCtx;
  dataArray;
  source;
  stream: MediaStream;
  distortion;
  test;
  // bufferSize
  constructor(public navCtrl: NavController,
    private platform: Platform,
  ) {
    // @ViewChild('oscilloscope') oscilloscopeCanvas : Canvas;

    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // this.audioCtx =  audioContext;
    console.log('this.audioCtx: ' + this.audioCtx);


    this.analyser = this.audioCtx.createAnalyser();

    // console.log('this.analyser: ' + this.analyser);
    console.log('this.analyser: ' + JSON.stringify(this.analyser));
    console.log('this.analyser.frequencyBinCount: ' + JSON.stringify(this.analyser.frequencyBinCount));

    // this.source = this.audioCtx.createMediaStreamSource(this.stream);
    // this.source.connect(this.analyser);
    // this.analyser.connect(this.distortion);

    this.analyser.fftSize = 256;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;
    this.analyser.smoothingTimeConstant = 0.85;


    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    console.log('this.bufferLength: ' + JSON.stringify(this.bufferLength));
    this.analyser.getByteTimeDomainData(this.dataArray);


  }
  ionViewDidLoad() {
    console.log('in ionViewDidLoad');
    // Get a canvas defined with ID "oscilloscope"
    this.canvas = document.getElementById("oscilloscope");
    // console.log('this.canvas: ' + this.canvas );
    // this.canvas = document.createElement("canvas");
    this.canvasCtx = this.canvas.getContext("2d");

    this.test = 1;
    // Listen to audioinput events 
    myComponent = this;
    window.addEventListener("audioinput", this.onAudioInput, false);
    // Listen to audioinputerror events 
    window.addEventListener("audioinputerror", this.onAudioInputError, false);

    this.capture();
    DrawBars();
  }
  onAudioInput(evt) {
    // console.log('myComponent.test: ' + JSON.stringify(myComponent.test) );
    // console.log('myComponent.analyser.frequencyBinCount: ' + JSON.stringify(myComponent.analyser.frequencyBinCount));

    // 'evt.data' is an integer array containing raw audio data 
    //    
    // console.log("Audio data received: " + evt.data.length + " samples");
    myComponent.dataArray = evt.data;
    // myComponent.draw();
    // ... do something with the evt.data array ... 

    // draw();
    // DrawBars();
  }



  onAudioInputError(error) {
    alert("onAudioInputError event recieved: " + JSON.stringify(error));
  };

  capture() {
    // Start capturing audio from the microphone 
    if (this.platform.is('cordova')) {
      audioinput.start({
        // Here we've changed the bufferSize from the default to 8192 bytes. 
        bufferSize: this.bufferLength,
        normalize: true,
        normalizationFactor: 16,
        streamToWebAudio: this.audioCtx,

        // Used in conjunction with streamToWebAudio. If no audioContext is given, 
        // one (prefixed) will be created by the plugin.
        audioContext: null,
      });
    }

    // Stop capturing audio input 
    // audioinput.stop()
  }


  draw() {

    var drawVisual = requestAnimationFrame(this.draw);

    this.analyser.getByteTimeDomainData(this.dataArray);

    this.canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.canvasCtx.lineWidth = 2;
    this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    this.canvasCtx.beginPath();

    var sliceWidth = this.canvas.width * 1.0 / this.bufferLength;
    var x = 0;

    for (var i = 0; i < this.bufferLength; i++) {

      var v = this.dataArray[i] / 128.0;
      var y = v * this.canvas.height / 2;

      if (i === 0) {
        this.canvasCtx.moveTo(x, y);
      } else {
        this.canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
    this.canvasCtx.stroke();
  }


}
function draw() {
  var u8array = new Uint8Array(myComponent.dataArray);

  myComponent.analyser.getByteTimeDomainData(u8array);

  myComponent.canvasCtx.fillStyle = 'rgb(0,0,0)';
  myComponent.canvasCtx.fillRect(0, 0, myComponent.canvas.width, myComponent.canvas.height);

  myComponent.canvasCtx.lineWidth = 2;
  myComponent.canvasCtx.strokeStyle = 'rgb(0, 255, 0)';

  myComponent.canvasCtx.beginPath();

  var sliceWidth = myComponent.canvas.width * 1.0 / myComponent.bufferLength;
  var x = 0;

  for (var i = 0; i < myComponent.bufferLength; i++) {

    var v = myComponent.dataArray[i] / 128.0;
    var y = myComponent.canvas.height - (v * myComponent.canvas.height / 2);

    if (i === 0) {
      myComponent.canvasCtx.moveTo(x, y);
    } else {
      myComponent.canvasCtx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  myComponent.canvasCtx.lineTo(myComponent.canvas.width, myComponent.canvas.height / 2);
  myComponent.canvasCtx.stroke();
}

function DrawBars() {
  var u8array = new Uint8Array(myComponent.bufferLength);
  var drawVisual = requestAnimationFrame(DrawBars);

  myComponent.analyser.getByteFrequencyData(u8array);

  myComponent.canvasCtx.fillStyle = 'rgb(0,0,0)';
  myComponent.canvasCtx.fillRect(0, 0, myComponent.canvas.width, myComponent.canvas.height);

  var barWidth = (myComponent.canvas.width / myComponent.bufferLength) * 2.5;
  var barHeight;
  var x = 0;
  for (var i = 0; i < myComponent.bufferLength; i++) {
    barHeight = myComponent.dataArray[i] / 2;

    myComponent.canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
    myComponent.canvasCtx.fillRect(x, myComponent.canvas.height - barHeight / 2, barWidth, barHeight);

    x += barWidth + 1;
  }
}

    // myComponent.canvasCtx.lineWidth = 2;
    // myComponent.canvasCtx.strokeStyle = 'rgb(0, 255, 0)';

    // myComponent.canvasCtx.beginPath();

    // var sliceWidth = myComponent.canvas.width * 1.0 / myComponent.bufferLength;
    // var x = 0;

    // for (var i = 0; i < myComponent.bufferLength; i++) {

    //   var v = myComponent.dataArray[i] / 128.0;
    //   var y = myComponent.canvas.height - (v * myComponent.canvas.height / 2);

    //   if (i === 0) {
    //     myComponent.canvasCtx.moveTo(x, y);
    //   } else {
    //     myComponent.canvasCtx.lineTo(x, y);
    //   }

    //   x += sliceWidth;
    // }

    // myComponent.canvasCtx.lineTo(myComponent.canvas.width, myComponent.canvas.height / 2);
    // myComponent.canvasCtx.stroke();
// }