import { Messenger } from '../event'
import { Constructable, EventMetadata } from '../types'

export class MetadataManager {
  private metadata = new Map<string, EventMetadata[]>()

  static instance() {
    return metadataManager
  }

  static registerEvent(
    event: string,
    target: Constructable<any>,
    listener: Function
  ) {
    MetadataManager.instance().registerEvent(event, target, listener)
  }

  static trigger(eventName: string, ...args: any[]) {
    MetadataManager.instance().trigger(eventName, ...args)
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

  async trigger(eventName: string, ...args: any[]) {
    const eventMetadata = this.metadata.get(eventName)
    if (!eventMetadata) {
      return
    }
    const instances = eventMetadata.map(({ target, listener }) => ({
      instance: Messenger.getInstance().config.di.get(target),
      listener
    }))
    const events = instances
      .filter((meta) => !!meta.instance)
      .map(async ({ instance, listener }) => await listener.bind(instance, ...args).call())
    try {
      return await Promise.any(events)
    } catch (error: unknown) {
      if (error instanceof AggregateError) {
        throw error.errors.length === 1 ? error.errors[0] : error.errors
      } else {
        throw error
      }
    }
  }
}

const metadataManager = new MetadataManager()
