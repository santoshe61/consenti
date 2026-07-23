import type { NoticeShownRecord } from '@consenti/types'
import type { NoticeRepo } from '../repositories/notice.repo'

export class NoticeService {
  constructor(
    private notices: NoticeRepo,
    private tenantId: string = 'default',
  ) {}

  recordShown(data: { visitorId: string; profileId: string; locale: string }): Promise<NoticeShownRecord> {
    return this.notices.create({ tenantId: this.tenantId, ...data })
  }

  getForVisitor(visitorId: string): Promise<NoticeShownRecord[]> {
    return this.notices.getForVisitor(visitorId)
  }
}
