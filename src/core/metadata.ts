import { Messenger } from '../event'
import { Constructable, EventMetadata, EventParamMetadata, EventParamOptions, EventParamType } from '../types'
import { valueFromPath } from './helpers'

export class MetadataManager {
  private metadata = new Map<string, EventMetadata[]>()
  private paramMetadata = new Map<string, EventParamMetadata[]>()

  private serializeParamMetadata(target: Constructable<any>,
    listener: string) {
    return `${target.name}->${listener}`
  }

  static instance() {
    return metadataManager
  }

  static registerEvent(
    event: string,
    target: Constructable<any>,
    listener: string
  ) {
    MetadataManager.instance().registerEvent(event, target, listener)
  }

  static registerParam(target: Constructable<any>,
    listener: string, index: number, param: EventParamType, options?: EventParamOptions
  ) {
    MetadataManager.instance().registerParam(target, listener, index, param, options)
  }

  static trigger(eventName: string, args: any[], options: EventParamOptions & { origin: string }) {
    MetadataManager.instance().trigger(eventName, args, options)
  }

  registerParam(target: Constructable<any>,
    listener: string, index: number, param: EventParamType, options?: EventParamOptions) {
    const key = this.serializeParamMetadata(target, listener)
    if (!this.paramMetadata.has(key)) {
      this.paramMetadata.set(key, [])
    }
    this.paramMetadata.get(key)?.push({ index, param, options })
  }

  registerEvent(
    event: string,
    target: Constructable<any>,
    listener: string
  ) {
    if (!this.metadata.has(event)) {
      this.metadata.set(event, [])
    }
    this.metadata.get(event)?.push({ target, listener })
  }

  async trigger(eventName: string, args: any[], options: EventParamOptions & { origin: string }) {
    const eventMetadata = this.metadata.get(eventName)
    if (!eventMetadata) {
      return
    }
    const instances = eventMetadata.map(({ target, listener }) => {
      const instance = Messenger.getInstance().config.di.get(target)
      const paramsOptions = this.paramMetadata.get(this.serializeParamMetadata(target, listener))
      const params: any[] = []
      if (typeof paramsOptions === 'undefined') {
        params.push(args)
      } else {
        for (let o of paramsOptions.sort((a, b) => a.index - b.index)) {
          switch (o.param) {
            case 'message':
              params.push(valueFromPath(args, o.options?.path))
              break
            case 'origin':
              params.push(options.origin)
              break
          }
        }
      }
      return {
        instance,
        listener,
        params
      }
    })
    const events = instances
      .filter((meta) => !!meta.instance)
      .map(async ({ instance, listener, params }) => await instance[listener].bind(instance, ...params).call())
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
