import type {
  StorageAdapter, Visitor, CreateVisitorInput, UpdateVisitorInput,
} from '@consenti/types'

export class VisitorRepo {
  constructor(private adapter: StorageAdapter) {}

  create(data: CreateVisitorInput): Promise<Visitor> {
    return this.adapter.createVisitor(data)
  }

  update(visitorId: string, data: UpdateVisitorInput): Promise<Visitor> {
    return this.adapter.updateVisitor(visitorId, data)
  }

  delete(visitorId: string): Promise<void> {
    return this.adapter.deleteVisitor(visitorId)
  }

  get(visitorId: string): Promise<Visitor | null> {
    return this.adapter.getVisitor(visitorId)
  }
}
