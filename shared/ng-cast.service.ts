import { NgControlStatus } from '@angular/forms';
import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

@Injectable()
export class NgCastService {
  private castSession;
  private cast;
  private session: any;
  private currentMedia: any;

  public status = {
    casting: false
  };

  constructor() {}

  public initializeCastApi() {
    this.cast = window['chrome'].cast;
    let sessionRequest = new this.cast.SessionRequest(this.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
    let apiConfig = new this.cast.ApiConfig(sessionRequest,
      (s: any) => { },
      (status: number) => {
        if (status === this.cast.ReceiverAvailability.AVAILABLE) {

        } // end if
      }
    );
    let x = this.cast.initialize(apiConfig, this.onInitSuccess, this.onError);
  };

  public discoverDevices$() {
    const subj = new Subject();
    this.cast.requestSession((s: any) => {
      this.session = s;
      this.setCasting(true);
      subj.next('CONNECTED');
    }, (err: any) => {
      this.setCasting(false);
      if (err.code === 'cancel') {
        this.session = null;
        subj.next('CANCEL');
      } else {
        console.error('Error selecting a cast device', err);
      }
    });
    return subj;
  }

  public launchMedia(media: any) {
    let mediaInfo = new this.cast.media.MediaInfo(media);
    let request = new this.cast.media.LoadRequest(mediaInfo);
    console.log('launch media with session', this.session);

    if (!this.session) {
      window.open(media);
      return false;
    }
    this.session.loadMedia(request, this.onMediaDiscovered.bind(this, 'loadMedia'), this.onMediaError);
    return true;
  }

  public play() {
    this.currentMedia.play(null);
  };

  public pause() {
    this.currentMedia.pause(null);
  };

  public stop() {
    this.currentMedia.stop(null);
  };

  public setCasting(value: any) {
    this.status.casting = value;
  }

  public getStatus() {
    return this.status
  }

  private onMediaDiscovered(how: any, media: any) {
    this.currentMedia = media;
  };

  onMediaError(err) {
    console.error('Error launching media', err);
  };

  onInitSuccess(e) {
    console.log('GCast initialization success');
  };

  onError(err) {
    console.log('GCast initialization failed', err);
  };

}
