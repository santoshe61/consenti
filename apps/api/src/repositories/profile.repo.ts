import type {
  StorageAdapter, Profile, CreateProfileInput, UpdateProfileInput,
} from '@consenti/types'

export class ProfileRepo {
  constructor(private adapter: StorageAdapter) {}

  create(data: CreateProfileInput): Promise<Profile> {
    return this.adapter.createProfile(data)
  }

  update(id: string, data: UpdateProfileInput): Promise<Profile> {
    return this.adapter.updateProfile(id, data)
  }

  delete(id: string): Promise<void> {
    return this.adapter.deleteProfile(id)
  }

  get(id: string): Promise<Profile | null> {
    return this.adapter.getProfile(id)
  }

  list(tenantId: string): Promise<Profile[]> {
    return this.adapter.getProfiles(tenantId)
  }
}
