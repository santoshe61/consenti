import type { Visitor, CreateVisitorInput } from '@consenti/types'
import { hashIp, hashUserAgent } from '../utils/crypto'
import type { VisitorRepo } from '../repositories/visitor.repo'
import type { EventEmitter } from 'node:events'

export class VisitorService {
  constructor(
    private visitors: VisitorRepo,
    private tenantId: string = 'default',
    private eventBus?: EventEmitter,
  ) {}

  async upsert(data: {
    visitorId: string
    ip?: string
    userAgent?: string
    country?: string
    region?: string
    city?: string
  }): Promise<Visitor> {
    const existing = await this.visitors.get(data.visitorId)
    if (existing) {
      return this.visitors.update(data.visitorId, {
        ...(data.country != null ? { country: data.country } : {}),
        ...(data.region != null ? { region: data.region } : {}),
        ...(data.city != null ? { city: data.city } : {}),
      })
    }
    const input: CreateVisitorInput = {
      tenantId: this.tenantId,
      visitorId: data.visitorId,
      ...(data.country != null ? { country: data.country } : {}),
      ...(data.region != null ? { region: data.region } : {}),
      ...(data.city != null ? { city: data.city } : {}),
      ...(data.ip ? { ipHash: hashIp(data.ip) } : {}),
      ...(data.userAgent ? { userAgentHash: hashUserAgent(data.userAgent) } : {}),
    }
    const visitor = await this.visitors.create(input)
    this.eventBus?.emit('visitor.created', visitor)
    return visitor
  }
}
