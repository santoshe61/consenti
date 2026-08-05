export interface TutorialStepMeta {
  slug: string
  title: string
  description: string
}

export const FRONTEND_TUTORIAL_STEPS: TutorialStepMeta[] = [
  { slug: 'install', title: 'Install', description: 'Add @consenti/ui to your project.' },
  { slug: 'configure', title: 'Configure', description: 'Pick a compliance mode and patch copy with profileOverride.' },
  { slug: 'custom-profile', title: 'Custom Profile', description: 'Define your own cookies, categories, and text with ConsentiProfile.' },
  { slug: 'events', title: 'Events', description: 'Subscribe to consenti: events and gate code on consent.' },
  { slug: 'gate-a-script', title: 'Gate a Script', description: 'Load a third-party script only once consent is granted.' },
  { slug: 'ship-it', title: 'Ship It', description: 'Theme it, wrap it for your framework, and go live.' },
]

export const BACKEND_TUTORIAL_STEPS: TutorialStepMeta[] = [
  { slug: 'install-backend', title: 'Install Backend', description: 'Add @consenti/api to your Node.js server.' },
  { slug: 'configure-backend', title: 'Configure Backend', description: 'Pick a storage driver and start the admin dashboard.' },
  { slug: 'update-profiles', title: 'Update & Add Profiles', description: 'Create and edit compliance profiles from the admin dashboard.' },
  { slug: 'install-frontend', title: 'Install Frontend', description: 'Add @consenti/ui to your client app.' },
  { slug: 'configure-frontend', title: 'Configure Frontend', description: 'Point the widget at your backend with api.baseUrl.' },
  { slug: 'events', title: 'Events', description: 'Subscribe to consenti: events on the frontend and eventBus on the backend.' },
  { slug: 'gate-a-script', title: 'Gate a Script', description: 'Load a third-party script only once consent is granted.' },
  { slug: 'connect-backend', title: 'Connect to Backend', description: 'Verify consent records are saved and visible in the admin dashboard.' },
  { slug: 'ship-it', title: 'Ship It', description: 'Theme it, wrap it for your framework, and go live.' },
]
