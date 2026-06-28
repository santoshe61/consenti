import type {
  ConsentiServerPlugin,
  CreateConsentInput,
  UpdateConsentInput,
  ConsentDbRecord,
  Profile,
  CreateUserInput,
  AdminUser,
  PluginContext,
} from '@consenti/types'

export class PluginEngine {
  private plugins: ConsentiServerPlugin[] = []

  register(plugins: ConsentiServerPlugin[]): void {
    this.plugins = plugins
  }

  async initialize(context: PluginContext): Promise<void> {
    for (const plugin of this.plugins) {
      try { await plugin.initialize?.(context) }
      catch (err) { console.warn(`[Consenti] Plugin "${plugin.name}" initialize failed:`, err) }
    }
  }

  async destroy(): Promise<void> {
    for (const plugin of this.plugins) {
      try { await plugin.destroy?.() }
      catch (err) { console.warn(`[Consenti] Plugin "${plugin.name}" destroy failed:`, err) }
    }
  }

  async runBeforeConsentSave(data: CreateConsentInput): Promise<CreateConsentInput> {
    let result = data
    for (const plugin of this.plugins) {
      if (!plugin.beforeConsentSave) continue
      try { result = await plugin.beforeConsentSave(result) }
      catch (err) { console.warn(`[Consenti] Plugin "${plugin.name}" beforeConsentSave failed:`, err) }
    }
    return result
  }

  async runAfterConsentSave(record: ConsentDbRecord): Promise<void> {
    for (const plugin of this.plugins) {
      if (!plugin.afterConsentSave) continue
      try { await plugin.afterConsentSave(record) }
      catch (err) { console.warn(`[Consenti] Plugin "${plugin.name}" afterConsentSave failed:`, err) }
    }
  }

  async runBeforeConsentUpdate(data: UpdateConsentInput): Promise<UpdateConsentInput> {
    let result = data
    for (const plugin of this.plugins) {
      if (!plugin.beforeConsentUpdate) continue
      try { result = await plugin.beforeConsentUpdate(result) }
      catch (err) { console.warn(`[Consenti] Plugin "${plugin.name}" beforeConsentUpdate failed:`, err) }
    }
    return result
  }

  async runAfterConsentUpdate(record: ConsentDbRecord): Promise<void> {
    for (const plugin of this.plugins) {
      if (!plugin.afterConsentUpdate) continue
      try { await plugin.afterConsentUpdate(record) }
      catch (err) { console.warn(`[Consenti] Plugin "${plugin.name}" afterConsentUpdate failed:`, err) }
    }
  }

  async runAfterProfileFetch(profile: Profile): Promise<Profile> {
    let result = profile
    for (const plugin of this.plugins) {
      if (!plugin.afterProfileFetch) continue
      try { result = await plugin.afterProfileFetch(result) }
      catch (err) { console.warn(`[Consenti] Plugin "${plugin.name}" afterProfileFetch failed:`, err) }
    }
    return result
  }

  async runBeforeUserCreate(data: CreateUserInput): Promise<CreateUserInput> {
    let result = data
    for (const plugin of this.plugins) {
      if (!plugin.beforeUserCreate) continue
      try { result = await plugin.beforeUserCreate(result) }
      catch (err) { console.warn(`[Consenti] Plugin "${plugin.name}" beforeUserCreate failed:`, err) }
    }
    return result
  }

  async runAfterUserCreate(user: AdminUser): Promise<void> {
    for (const plugin of this.plugins) {
      if (!plugin.afterUserCreate) continue
      try { await plugin.afterUserCreate(user) }
      catch (err) { console.warn(`[Consenti] Plugin "${plugin.name}" afterUserCreate failed:`, err) }
    }
  }
}
