import { Broker } from './core/messenger'
import { MetadataManager } from './core/metadata'
import { Config } from './types'

export class Messenger {
  private broker!: Broker
  private static instance: Messenger
  config!: Config
  static getInstance() {
    if (!Messenger.instance) {
      Messenger.instance = new Messenger()
    }
    return Messenger.instance
  }

  private constructor() { }

  static init(config: Config) {
    Messenger.getInstance().init(config)
  }

  init(config: Config) {
    this.config = config
    this.broker = new Broker(config.rabbit, config.name)
    this.broker.connect().then(() => {
      this.broker.listen(({ key, args }) => {
        MetadataManager.trigger(key, args?.data || args)
      })
      this.broker.handle((error: Error | null, { key, args }) =>
        MetadataManager.instance().trigger(key, args?.data || args))
    })
  }

  static publish(type: string, data: any) {
    Messenger.getInstance().publish(type, data)
  }

  publish(type: string, data: any) {
    this.broker.publish(type, { data, type })
  }

  static invoke<T>(type: string, data: any) {
    return Messenger.getInstance().invoke<T>(type, data)
  }

  invoke<T>(type: string, data: any) {
    return this.broker.invoke<T>(type, { data, type })
  }

  static close() {
    Messenger.getInstance().close()
  }

  close() {
    this.broker.close()
  }
}
