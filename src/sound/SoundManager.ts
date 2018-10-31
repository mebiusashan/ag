// MIT License
//
// Copyright (c) 2018 mebiusashan <mebius@ashan.org>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

namespace ag {
    export class SoundManager {

        private static soundManager: SoundManager;

        private effectOn: boolean;
        private backgroundOn: boolean;
        private effectVolume: number;
        private backgroundVolume: number;

        private effectSound: SoundEffects;
        private backgroundSound: SoundBackground;

        private constructor() {
            this.effectOn = true;
            this.backgroundOn = true;
            this.effectVolume = 0.5;
            this.backgroundVolume = 0.5;

            this.effectSound = new SoundEffects();
            this.effectSound.setVolume(this.effectVolume);

            this.backgroundSound = new SoundBackground();
            this.backgroundSound.setVolume(this.backgroundVolume);

            egret.lifecycle.onPause = () => {
                this.backgroundSound.stop("");
            }

            egret.lifecycle.onResume = () => {
                if (this.backgroundOn) {
                    this.backgroundSound.resume();
                }
            }
        }

        public static getInstance(): SoundManager {
            if (!SoundManager.soundManager) {
                SoundManager.soundManager = new SoundManager();
            }
            return SoundManager.soundManager;
        }

        public getEffectOn(): boolean {
            return this.effectOn;
        }

        public setEffectOn(value: boolean): void {
            this.effectOn = value;
            if (!this.effectOn) {
                this.effectSound.stopAll();
            }
        }

        public getBackgroundOn(): boolean {
            return this.backgroundOn;
        }

        public setBackgroundOn(value: boolean): void {
            this.backgroundOn = value;
            if (this.backgroundOn) {
                this.backgroundSound.resume();
            } else {
                this.backgroundSound.stop("");
            }
        }

        public getEffectVolume(): number {
            return this.effectVolume;
        }

        public setEffectVolume(value: number) {
            value = Math.min(value, 1);
            value = Math.max(value, 0);
            this.effectVolume = value;
            this.effectSound.setVolume(this.effectVolume);
        }

        public getBackgroundVolume(): number {
            return this.backgroundVolume;
        }

        public setBackgroundVolume(value: number) {
            value = Math.min(value, 1);
            value = Math.max(value, 0);
            this.backgroundVolume = value;
            this.backgroundSound.setVolume(this.backgroundVolume);
        }

        public playEffect(key: string): void {
            if (!this.effectOn) {
                return;
            }
            this.effectSound.play(key);
        }

        public stopEffect(key: string): void {
            if (!this.effectOn) {
                return;
            }
            this.effectSound.stop(key);
        }

        public stopAllEffect(): void {
            if (!this.effectOn) {
                return;
            }
            this.effectSound.stopAll();
        }

        public playBackground(key: string): void {
            if (!this.backgroundOn) {
                return;
            }
            this.backgroundSound.play(key);
        }

        public stopBackground(): void {
            if (!this.backgroundOn) {
                return;
            }
            this.backgroundSound.stop("");
        }

        public clearCache(): void {
            this.effectSound.clearCache();
            this.backgroundSound.clearCache();
        }
    }

    class BaseSound {
        protected cache: any;
        protected volume: number;

        constructor() {
            this.cache = {};
            this.volume = 0.5;
        }

        public play(key: string): void {

        }

        public stop(key: string): void {

        }

        public setVolume(value: number): void {
            this.volume = value;
            let voices: Voice[];
            for (let key in this.cache) {
                voices = this.cache[key];
                voices.map(voice => {
                    voice.setVolume(value);
                })
            }
        }

        public clearCache(): void {
            let voices: Voice[];
            for (let key in this.cache) {
                voices = this.cache[key];
                for (let i: number = 0; i < voices.length; i++) {
                    if (!voices[i].isPlay) {
                        voices[i].dispose();
                        voices.splice(i);
                        i--;
                    }
                }
                if (voices.length == 0) {
                    delete this.cache[key];
                }
            }
        }

        protected find(key: string, unused: boolean = false): Voice {
            let voices: Voice[] = this.cache[key];
            if (voices) {
                if (unused) {
                    voices.map(voice => {
                        if (!voice.isPlay) {
                            return voice;
                        }
                    })
                } else {
                    return voices[0];
                }
            }

            let sound: egret.Sound = RES.getRes(key);
            if (sound) {
                if (!voices) {
                    voices = [];
                    this.cache[key] = voices;
                }
                let voice: Voice = new Voice(sound);
                voices.push(voice);
                return voice;
            }
            console.error("sound resource not found, key:", key);
            return null;
        }

        protected finds(key: string): Voice[] {
            return this.cache[key];
        }
    }

    class Voice {

        private _isPlay: boolean;
        private _channel: egret.SoundChannel;
        private _sound: egret.Sound;
        private _position: number = 0;

        public constructor(sound: egret.Sound) {
            this._sound = sound;
            this._isPlay = false;
        }

        public setVolume(value: number): void {
            if (this._channel) {
                this._channel.volume = value;
            }
        }

        public get isPlay(): boolean {
            return this._isPlay;
        }

        public play(startTime: number = 0, loops: number = 0): egret.SoundChannel {
            this._isPlay = true;
            if (this._channel) {
                this._channel.removeEventListener(egret.Event.SOUND_COMPLETE, this.playComplete, this);
            }
            this._channel = this._sound.play(startTime, loops);
            this._channel.addEventListener(egret.Event.SOUND_COMPLETE, this.playComplete, this);
            return this._channel;
        }

        private playComplete(evt: egret.Event): void {
            this._isPlay = false;
        }

        public stop(): void {
            this._isPlay = false;
            if (this._channel) {
                this._position = this._channel.position;
                this._channel.stop();
            }
        }

        public resume() {
            this.play(this._position);
        }

        public dispose(): void {
            if (this._channel) {
                this._channel.stop();
                this._channel.removeEventListener(egret.Event.SOUND_COMPLETE, this.playComplete, this);
            }
            this._channel = null;
            this._sound = null;
        }
    }

    class SoundBackground extends BaseSound {
        private curKey: string = "";
        public constructor() {
            super();
        }

        public play(key: string): void {
            if (key == this.curKey) {
                return;
            }

            if (this.curKey != "") {
                this.stop(this.curKey);
            }
            this.curKey = key;
            let voice: Voice = this.find(key);
            if (voice) {
                voice.play();
                voice.setVolume(this.volume);
            }
        }

        public stop(key: string): void {
            if (key == "") {
                key = this.curKey;
            }
            let voice: Voice = this.find(key);
            if (voice) {
                voice.stop();
            }
        }

        public resume(): void {
            let voice: Voice = this.find(this.curKey);
            if (voice) {
                voice.resume();
                voice.setVolume(this.volume);
            }
        }
    }

    class SoundEffects extends BaseSound {

        public play(key: string): void {
            let voice: Voice = this.find(key, true);
            if (voice) {
                voice.play(0, 1);
                voice.setVolume(this.volume);
            }
        }

        public stop(key: string): void {
            let voices: Voice[] = this.finds(key);
            if (voices) {
                voices.map(voice => {
                    voice.stop();
                })
            }
        }

        public stopAll(): void {
            let voices: Voice[];
            for (let key in this.cache) {
                voices = this.cache[key];
                voices.map(voice => {
                    voice.stop();
                })
            }
        }
    }

}