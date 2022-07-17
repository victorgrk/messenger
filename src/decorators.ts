import { MetadataManager } from './core/metadata'

export function Amqp(eventName: string) {
  return (target: any, _: string, descriptor: PropertyDescriptor) => {
    MetadataManager.registerEvent(
      eventName,
      target.constructor,
      descriptor.value
    )
    return descriptor
  }
}
