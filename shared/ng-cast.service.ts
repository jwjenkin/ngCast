import { NgControlStatus } from '@angular/forms';
import { Injectable } from '@angular/core';

import { Observable, ReplaySubject, Subject, throwError } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable()
export class NgCastService {
  private cast$: ReplaySubject<boolean> = new ReplaySubject(1);
  private castSession;
  private discoveringDevices: boolean = false;
  private session: any;
  private currentMedia: any;

  public status = {
    casting: false
  };

  constructor() {
    const cast = !!(window['chrome'] || {}).cast;
    !!cast ? this.cast$.next(cast) : this.cast$.error({ message: 'Cast not avaible' });
  }

  public initializeCastApi() {
    this.cast$.pipe(take(1)).subscribe(
      (cast: any) => {
        const sessionRequest = new cast.SessionRequest(
          cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID
        );
        const apiConfig = new cast.ApiConfig(sessionRequest,
          (s: any) => { },
          (status: number) => {
            if (status === cast.ReceiverAvailability.AVAILABLE) {

            } // end if
          }
        );
        const x = cast.initialize(apiConfig, this.onInitSuccess, this.onError);
      },
      console.error
    )
  };

  public discoverDevices$() {
    if ( this.discoveringDevices ) {
      return throwError('Already discovering devices');
    } // end if

    this.discoveringDevices = true;
    return this.cast$.pipe(
      switchMap((cast: any) => {
        const response: Subject<string> = new Subject();
        cast.requestSession((s: any) => {
          this.session = s;
          this.setCasting(true);
          response.next('CONNECTED');
        }, (err: any) => {
          this.setCasting(false);
          if (err.code === 'cancel') {
            this.session = null;
            return response.next('CANCEL');
          } // end if

          response.error(`Error selecting a cast device: ${err.message}`);
        });
        return response;
      })
    );
  }

  public launchMedia$(media: any) {
    return this.cast$.pipe(
      take(1),
      map((cast: any) => {
        let mediaInfo = new cast.media.MediaInfo(media);
        let request = new cast.media.LoadRequest(mediaInfo);
        console.log('launch media with session', this.session);

        if (!this.session) {
          window.open(media);
          return false;
        }
        this.session.loadMedia(
          request,
          this.onMediaDiscovered.bind(this, 'loadMedia'),
          this.onMediaError
        );
        return true;
      }),
    );
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
