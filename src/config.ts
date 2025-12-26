// Runtime configuration service
// Uses window.ENV_CONFIG if available (runtime), otherwise falls back to build-time env vars

interface EnvConfig {
  VITE_API_URL?: string;
  VITE_DEBUG?: string;
  VITE_CLARITY_ID?:string;
}

declare global {
  interface Window {
    ENV_CONFIG?: EnvConfig;
  }
}

class ConfigService {
  private config: EnvConfig;

  constructor() {
    // Use runtime config from window.ENV_CONFIG if available
    // This is loaded from /config.js which is generated at container startup
    this.config = window.ENV_CONFIG || {
      // Fallback to build-time environment variables
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_DEBUG: import.meta.env.VITE_DEBUG,
      VITE_CLARITY_ID: import.meta.env.VITE_CLARITY_ID
    };

    // Log configuration source
    if (window.ENV_CONFIG) {
      console.log('[Config] Using runtime configuration from config.js');
      console.log('[Config] VITE_API_URL:', this.config.VITE_API_URL);
      console.log('[Config] VITE_DEBUG:', this.config.VITE_DEBUG);
    } else {
      console.log('[Config] Using build-time environment variables');
      console.log('[Config] VITE_API_URL:', this.config.VITE_API_URL);
    }
  }

  get apiUrl(): string {
    return this.config.VITE_API_URL || 'http://localhost:8000';
  }

  get debug(): boolean {
    return this.config.VITE_DEBUG === 'true';
  }

  get clarityId() : string {
    return this.config.VITE_CLARITY_ID ?? ''
  }
}

// Export singleton instance
export const config = new ConfigService();
