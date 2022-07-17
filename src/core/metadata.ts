import { Constructable, EventMetadata } from '../types'

export class MetadataManager {
  private metadata = new Map<string, EventMetadata[]>()

  static getInstance() {
    return metadataManager
  }

  static registerEvent(
    event: string,
    target: Constructable<any>,
    listener: Function
  ) {
    MetadataManager.getInstance().registerEvent(event, target, listener)
  }

  registerEvent(
    event: string,
    target: Constructable<any>,
    listener: Function
  ) {
    if (!this.metadata.has(event)) {
      this.metadata.set(event, [])
    }
    this.metadata.get(event)?.push({ target, listener })
  }
}

const metadataManager = new MetadataManager()
