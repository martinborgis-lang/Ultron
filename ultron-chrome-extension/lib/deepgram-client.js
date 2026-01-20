/**
 * Deepgram Client for Chrome Extension
 * Handles WebSocket connection to Deepgram for real-time transcription
 */

const ULTRON_API_URL = 'https://ultron-murex.vercel.app';

class DeepgramClient {
  constructor() {
    this.websocket = null;
    this.isConnected = false;
    this.onTranscript = null;
    this.onError = null;
    this.onStatusChange = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.keepAliveInterval = null;
  }

  /**
   * Get Deepgram credentials from Ultron API
   * @param {string} token - User auth token
   * @returns {Promise<{websocket_url: string, api_key: string}>}
   */
  async getCredentials(token) {
    const response = await fetch(`${ULTRON_API_URL}/api/meeting/transcribe`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Deepgram credentials');
    }

    return response.json();
  }

  /**
   * Connect to Deepgram WebSocket
   * @param {string} token - User auth token
   * @param {Object} callbacks - Callback functions
   * @returns {Promise<void>}
   */
  async connect(token, callbacks = {}) {
    this.onTranscript = callbacks.onTranscript || (() => {});
    this.onError = callbacks.onError || (() => {});
    this.onStatusChange = callbacks.onStatusChange || (() => {});

    try {
      // Get credentials from our API
      const { websocket_url, api_key } = await this.getCredentials(token);

      this.onStatusChange('connecting');

      // Connect to Deepgram WebSocket
      this.websocket = new WebSocket(websocket_url, ['token', api_key]);

      this.websocket.onopen = () => {
        console.log('Ultron: Connected to Deepgram');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onStatusChange('connected');

        // Start keep-alive ping
        this.startKeepAlive();
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'Results') {
            const alternative = data.channel?.alternatives?.[0];
            if (alternative && alternative.transcript) {
              this.onTranscript({
                transcript: alternative.transcript,
                confidence: alternative.confidence,
                isFinal: data.is_final,
                speechFinal: data.speech_final,
                words: alternative.words || [],
              });
            }
          }
        } catch (error) {
          console.error('Ultron: Error parsing Deepgram response', error);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('Ultron: Deepgram WebSocket error', error);
        this.onError(error);
        this.onStatusChange('error');
      };

      this.websocket.onclose = (event) => {
        console.log('Ultron: Deepgram connection closed', event.code, event.reason);
        this.isConnected = false;
        this.stopKeepAlive();

        // Attempt reconnection if not intentionally closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.onStatusChange('reconnecting');
          setTimeout(() => this.connect(token, callbacks), 2000 * this.reconnectAttempts);
        } else {
          this.onStatusChange('disconnected');
        }
      };

    } catch (error) {
      console.error('Ultron: Failed to connect to Deepgram', error);
      this.onError(error);
      this.onStatusChange('error');
      throw error;
    }
  }

  /**
   * Send audio data to Deepgram
   * @param {ArrayBuffer} audioData - Audio chunk
   */
  sendAudio(audioData) {
    if (this.websocket && this.isConnected && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(audioData);
    }
  }

  /**
   * Keep connection alive with periodic messages
   */
  startKeepAlive() {
    this.keepAliveInterval = setInterval(() => {
      if (this.websocket && this.isConnected) {
        // Send keep-alive message
        this.websocket.send(JSON.stringify({ type: 'KeepAlive' }));
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Stop keep-alive interval
   */
  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  /**
   * Close the WebSocket connection
   */
  disconnect() {
    this.stopKeepAlive();

    if (this.websocket) {
      this.websocket.close(1000, 'User requested disconnect');
      this.websocket = null;
    }

    this.isConnected = false;
    this.onStatusChange('disconnected');
    console.log('Ultron: Disconnected from Deepgram');
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isActive() {
    return this.isConnected && this.websocket && this.websocket.readyState === WebSocket.OPEN;
  }
}

// Export for use in content script
if (typeof window !== 'undefined') {
  window.UltronDeepgramClient = DeepgramClient;
}
