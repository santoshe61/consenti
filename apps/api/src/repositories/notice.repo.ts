import type {
  StorageAdapter, NoticeShownRecord, CreateNoticeShownInput,
} from '@consenti/types'

export class NoticeRepo {
  constructor(private adapter: StorageAdapter) {}

  create(data: CreateNoticeShownInput): Promise<NoticeShownRecord> {
    return this.adapter.createNoticeShown(data)
  }

  getForVisitor(visitorId: string): Promise<NoticeShownRecord[]> {
    return this.adapter.getNoticeShownForVisitor(visitorId)
  }
}
