/**
 * Audio Capture Module
 * Captures tab audio from Google Meet using chrome.tabCapture
 */

(function() {
  // Prevent re-declaration on extension reload
  if (typeof window.UltronAudioCapture !== 'undefined') {
    console.log('Ultron: AudioCapture already defined, skipping...');
    return;
  }

  class AudioCapture {
  constructor() {
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.isCapturing = false;
    this.onAudioData = null;
  }

  /**
   * Request tab audio capture from the background script
   * @returns {Promise<MediaStream>}
   */
  async requestTabCapture() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'START_TAB_CAPTURE' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        if (response.streamId) {
          // Use the stream ID to get the media stream
          navigator.mediaDevices.getUserMedia({
            audio: {
              mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: response.streamId,
              },
            },
            video: false,
          })
            .then(stream => resolve(stream))
            .catch(err => reject(err));
        } else {
          reject(new Error('No stream ID received'));
        }
      });
    });
  }

  /**
   * Start capturing audio from the tab
   * @param {Function} onData - Callback for audio data chunks
   * @returns {Promise<void>}
   */
  async start(onData) {
    if (this.isCapturing) {
      console.warn('Audio capture already in progress');
      return;
    }

    this.onAudioData = onData;

    try {
      // Get tab audio stream
      this.mediaStream = await this.requestTabCapture();
      console.log('Ultron: Tab audio capture started');

      // Create audio context for processing
      this.audioContext = new AudioContext({
        sampleRate: 16000, // Deepgram prefers 16kHz
      });

      // Create media recorder for chunking audio
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      // Send audio chunks to callback
      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && this.onAudioData) {
          // Convert to ArrayBuffer for sending to Deepgram
          const arrayBuffer = await event.data.arrayBuffer();
          this.onAudioData(arrayBuffer);
        }
      };

      // Start recording with small time slices for real-time streaming
      this.mediaRecorder.start(250); // 250ms chunks
      this.isCapturing = true;

    } catch (error) {
      console.error('Ultron: Failed to start audio capture', error);
      throw error;
    }
  }

  /**
   * Stop capturing audio
   */
  stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isCapturing = false;
    this.onAudioData = null;

    console.log('Ultron: Audio capture stopped');
  }

  /**
   * Check if currently capturing
   * @returns {boolean}
   */
  isActive() {
    return this.isCapturing;
  }
}

  // Export for use in content script
  window.UltronAudioCapture = AudioCapture;

})(); // End IIFE
