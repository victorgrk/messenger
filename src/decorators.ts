import { MetadataManager } from './core/metadata'
import { EventParamOptions, EventParamType } from './types'

export function Amqp(eventName: string) {
  return (target: any, properyKey: string, descriptor: PropertyDescriptor) => {
    MetadataManager.registerEvent(
      eventName,
      target.constructor,
      properyKey
    )
    return descriptor
  }
}

function MessageParam(param: EventParamType, options?: EventParamOptions) {
  return (target: any, properyKey: string, index: number) => {
    MetadataManager.registerParam(
      target.constructor,
      properyKey,
      index,
      param,
      options
    )
  }
}

export function Message(path?: string) {
  return MessageParam('message', { path })
}

export function Origin() {
  return MessageParam('origin')
}
