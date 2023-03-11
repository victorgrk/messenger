import { FileImporter } from './core/file-importer'
import { Broker } from './core/messenger'
import { MetadataManager } from './core/metadata'
import { Config, MessageOptions } from './types'

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

  private constructor() {
    if (Messenger.instance) {
      throw new Error('Messenger is a singleton')
    }
    process.once('beforeExit', async () => {
      try {
        return await this.close()
      } catch (e) { }
    })
  }

  static init(config: Config) {
    Messenger.getInstance().init(config)
  }

  init(config: Config) {
    FileImporter.import(config.rootDir)
    this.config = config
    this.broker = new Broker(config.rabbit, config.name)
    this.broker.connect().then(() => {
      this.broker.listen(({ key, args }) =>
        MetadataManager.instance().trigger(key, args?.data || args))
    })
  }

  static publish(type: string, data: any, options?: MessageOptions) {
    Messenger.getInstance().publish(type, data, options)
  }

  publish(type: string, data: any, options?: MessageOptions) {
    if (this.config.verbose) {
      console.log(`Publishing message to ${type} with payload : \n${JSON.stringify({ data }, null, 2)}`)
    }
    this.broker.publish(type, { data, type }, options)
  }

  static broadcast(type: string, data: any) {
    Messenger.getInstance().broadcast(type, data)
  }

  broadcast(type: string, data: any) {
    if (this.config.verbose) {
      console.log(`Broadcasting message to ${type} with payload : \n${JSON.stringify({ data }, null, 2)}`)
    }
    this.broker.broadcast(type, { data, type })
  }

  static invoke<T>(type: string, data: any, options?: MessageOptions) {
    return Messenger.getInstance().invoke<T>(type, data, options)
  }

  invoke<T>(type: string, data: any, options?: MessageOptions) {
    if (this.config.verbose) {
      console.log(`Invoking message to ${type} with payload : \n${JSON.stringify({ data }, null, 2)}`)
    }
    return this.broker.invoke<T>(type, { data, type }, options)
  }

  static close() {
    return Messenger.getInstance().close()
  }

  close() {
    return this.broker.close()
  }
}
