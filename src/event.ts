import { FileImporter } from './core/file-importer'
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
    return Messenger.getInstance().close()
  }

  close() {
    return this.broker.close()
  }
}
