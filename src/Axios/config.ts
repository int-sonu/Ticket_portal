export interface AppConfig {
  API_BASE_URL: string;
  API_IMAGE_BASE_URL: string;
  FCM_VAPID_KEY: string;
}

let config: AppConfig | null = null;

export const loadConfig = async (): Promise<AppConfig> => {
  if (config) return config;
  try {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }
    config = await response.json();
    return config!;
  } catch (error) {
    console.error('Error loading config:', error);
    throw error;
  }
};

export const getConfig = (): AppConfig => {
  if (!config) {
    throw new Error('Config not loaded yet. Make sure loadConfig is called before using APIs.');
  }
  return config;
};
